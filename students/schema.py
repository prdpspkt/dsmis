import graphene
from graphene_django import DjangoObjectType
from graphene_django.forms.mutation import DjangoModelFormMutation
from graphene_django.converter import convert_django_field
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import DecimalField
from .models import (
    Student, Course, Instructor, Vehicle, Token, TokenDuration,
    CoursePackage, GuestPackage
)


# Register custom converter for DecimalField
@convert_django_field.register(DecimalField)
def convert_decimal_field_to_decimal(field, registry=None):
    """Convert Django DecimalField to graphene.Float for proper serialization"""
    return graphene.Float(description=field.help_text, required=not field.null)


class DecimalType(graphene.Scalar):
    """Custom scalar for handling Decimal values in GraphQL"""

    @staticmethod
    def serialize(decimal):
        if decimal is None:
            return None
        return float(decimal)

    @staticmethod
    def parse_value(value):
        return Decimal(str(value))

    @staticmethod
    def parse_literal(ast):
        if isinstance(ast, (int, float)):
            return Decimal(str(ast))
        if isinstance(ast, str):
            return Decimal(ast)
        return None


class CourseType(DjangoObjectType):
    class Meta:
        model = Course
        fields = '__all__'


class InstructorType(DjangoObjectType):
    name = graphene.String()

    class Meta:
        model = Instructor
        fields = '__all__'

    def resolve_name(self, info):
        return self.user.get_full_name() or self.user.username


class VehicleType(DjangoObjectType):
    class Meta:
        model = Vehicle
        fields = '__all__'


class StudentType(DjangoObjectType):
    full_name = graphene.String()
    fee_due = DecimalType()
    remaining_minutes = graphene.Int()
    remaining_hours = DecimalType()
    progress_percentage = graphene.Int()
    is_time_completed = graphene.Boolean()

    class Meta:
        model = Student
        fields = '__all__'

    def resolve_remaining_minutes(self, info):
        return self.remaining_minutes

    def resolve_remaining_hours(self, info):
        return self.remaining_hours

    def resolve_progress_percentage(self, info):
        return self.progress_percentage

    def resolve_is_time_completed(self, info):
        return self.is_time_completed


class CreateStudent(graphene.Mutation):
    class Arguments:
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        address = graphene.String(required=True)
        contact = graphene.String(required=True)
        email = graphene.String()
        citizenship_number = graphene.String(required=True)
        date_of_birth = graphene.Date(required=True)
        course_id = graphene.ID(required=True)
        instructor_id = graphene.ID()
        batch_number = graphene.String()
        photo = graphene.String()
        id_proof = graphene.String()
        admission_fee = DecimalType()

    student = graphene.Field(StudentType)

    def mutate(self, info, **kwargs):
        course = Course.objects.get(id=kwargs.get('course_id'))
        instructor = None
        if kwargs.get('instructor_id'):
            instructor = Instructor.objects.get(id=kwargs.get('instructor_id'))

        # Auto-calculate total purchased minutes from course duration
        # Course duration is stored in hours, convert to minutes
        total_purchased_minutes = course.duration * 60

        student = Student(
            first_name=kwargs.get('first_name'),
            last_name=kwargs.get('last_name'),
            address=kwargs.get('address'),
            contact=kwargs.get('contact'),
            email=kwargs.get('email'),
            citizenship_number=kwargs.get('citizenship_number'),
            date_of_birth=kwargs.get('date_of_birth'),
            course=course,
            instructor=instructor,
            batch_number=kwargs.get('batch_number'),
            admission_fee=kwargs.get('admission_fee', course.fee),
            total_purchased_minutes=total_purchased_minutes,
            total_used_minutes=0,  # Always start at 0
        )

        # Handle file uploads (photo, id_proof)
        # For now, we'll store the file path as provided
        # In production, you'd handle actual file upload properly

        student.save()
        return CreateStudent(student=student)


class UpdateStudent(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        first_name = graphene.String()
        last_name = graphene.String()
        address = graphene.String()
        contact = graphene.String()
        email = graphene.String()
        batch_number = graphene.String()
        instructor_id = graphene.ID()
        status = graphene.String()
        fee_paid = DecimalType()

    student = graphene.Field(StudentType)

    def mutate(self, info, **kwargs):
        try:
            student = Student.objects.get(id=kwargs.get('id'))
        except Student.DoesNotExist:
            raise Exception('Student not found')

        for field, value in kwargs.items():
            if field == 'id':
                continue
            if field == 'instructor_id' and value:
                setattr(student, 'instructor', Instructor.objects.get(id=value))
            elif field != 'instructor_id':
                setattr(student, field, value)

        student.save()
        return UpdateStudent(student=student)


class DeleteStudent(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            student = Student.objects.get(id=kwargs.get('id'))
            student.delete()
            return DeleteStudent(success=True)
        except Student.DoesNotExist:
            return DeleteStudent(success=False)


# Token Types
class TokenDurationType(DjangoObjectType):
    class Meta:
        model = TokenDuration
        fields = '__all__'


class TokenType(DjangoObjectType):
    class Meta:
        model = Token
        fields = '__all__'


# Package Types
class CoursePackageType(DjangoObjectType):
    class Meta:
        model = CoursePackage
        fields = '__all__'


class GuestPackageType(DjangoObjectType):
    class Meta:
        model = GuestPackage
        fields = '__all__'


class AvailableSlotsType(graphene.ObjectType):
    date = graphene.Date()
    occupied_instructors = graphene.List(graphene.Int)
    occupied_vehicles = graphene.List(graphene.Int)
    available_instructors = graphene.List(InstructorType)
    available_vehicles = graphene.List(VehicleType)


class CreateToken(graphene.Mutation):
    class Arguments:
        student_id = graphene.ID(required=True)
        duration_id = graphene.ID(required=True)
        date = graphene.Date(required=True)
        start_time = graphene.String(required=True)  # Format: "HH:MM"
        instructor_id = graphene.ID()
        vehicle_id = graphene.ID()
        notes = graphene.String()

    token = graphene.Field(TokenType)

    def mutate(self, info, **kwargs):
        student = Student.objects.get(id=kwargs.get('student_id'))
        duration = TokenDuration.objects.get(id=kwargs.get('duration_id'))

        # Check if student has remaining time
        if student.remaining_minutes < duration.minutes:
            raise Exception(f'Student has only {student.remaining_minutes} minutes remaining. Cannot book {duration.minutes} minutes session.')

        # Parse start_time
        start_time = datetime.strptime(kwargs.get('start_time'), '%H:%M').time()

        # Calculate end_time
        start_dt = datetime.combine(datetime.today(), start_time)
        end_dt = start_dt + timedelta(minutes=duration.minutes)
        end_time = end_dt.time()

        # Check slot availability
        availability = Token.check_slot_availability(
            kwargs.get('date'),
            start_time,
            end_time
        )

        instructor = None
        vehicle = None

        if kwargs.get('instructor_id'):
            instructor = Instructor.objects.get(id=kwargs.get('instructor_id'))
            if instructor.id in availability['occupied_instructors']:
                raise Exception('Instructor not available for this time slot')

        if kwargs.get('vehicle_id'):
            vehicle = Vehicle.objects.get(id=kwargs.get('vehicle_id'))
            if vehicle.id in availability['occupied_vehicles']:
                raise Exception('Vehicle not available for this time slot')

        token = Token(
            student=student,
            duration=duration,
            date=kwargs.get('date'),
            start_time=start_time,
            end_time=end_time,
            instructor=instructor,
            vehicle=vehicle,
            notes=kwargs.get('notes')
        )
        token.save()
        return CreateToken(token=token)


class UpdateToken(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        start_time = graphene.String()
        instructor_id = graphene.ID()
        vehicle_id = graphene.ID()
        status = graphene.String()
        notes = graphene.String()

    token = graphene.Field(TokenType)

    def mutate(self, info, **kwargs):
        try:
            token = Token.objects.get(id=kwargs.get('id'))
        except Token.DoesNotExist:
            raise Exception('Token not found')

        # Track if status is being changed to COMPLETED
        old_status = token.status
        new_status = kwargs.get('status')

        for field, value in kwargs.items():
            if field == 'id':
                continue
            if field == 'instructor_id' and value:
                setattr(token, 'instructor', Instructor.objects.get(id=value))
            elif field == 'vehicle_id' and value:
                setattr(token, 'vehicle', Vehicle.objects.get(id=value))
            elif field == 'start_time' and value:
                # Recalculate end_time when start_time changes
                new_start = datetime.strptime(value, '%H:%M').time()
                setattr(token, 'start_time', new_start)
                start_dt = datetime.combine(datetime.today(), new_start)
                end_dt = start_dt + timedelta(minutes=token.duration.minutes)
                token.end_time = end_dt.time()
            elif field not in ['instructor_id', 'vehicle_id']:
                setattr(token, field, value)

        token.save()

        # If token is being marked as COMPLETED, deduct time from student
        if old_status != 'COMPLETED' and new_status == 'COMPLETED':
            student = token.student
            student.total_used_minutes += token.duration.minutes
            student.save()

            # Check if student has completed all purchased time
            if student.is_time_completed:
                student.status = 'COMPLETED'
                student.save()

        return UpdateToken(token=token)


class DeleteToken(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            token = Token.objects.get(id=kwargs.get('id'))
            token.delete()
            return DeleteToken(success=True)
        except Token.DoesNotExist:
            return DeleteToken(success=False)


# Course Management Mutations
class CreateCourse(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        fee = DecimalType(required=True)
        duration = graphene.Int(required=True)  # in hours
        description = graphene.String()

    course = graphene.Field(CourseType)

    def mutate(self, info, **kwargs):
        from .models import Course
        course = Course(
            name=kwargs.get('name'),
            fee=kwargs.get('fee'),
            duration=kwargs.get('duration'),
            description=kwargs.get('description', '')
        )
        course.save()
        return CreateCourse(course=course)


class UpdateCourse(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        fee = DecimalType()
        duration = graphene.Int()
        description = graphene.String()
        is_active = graphene.Boolean()

    course = graphene.Field(CourseType)

    def mutate(self, info, **kwargs):
        from .models import Course
        try:
            course = Course.objects.get(id=kwargs.get('id'))
        except Course.DoesNotExist:
            raise Exception('Course not found')

        for field, value in kwargs.items():
            if field != 'id':
                setattr(course, field, value)

        course.save()
        return UpdateCourse(course=course)


class DeleteCourse(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        from .models import Course
        try:
            course = Course.objects.get(id=kwargs.get('id'))
            course.is_active = False
            course.save()
            return DeleteCourse(success=True)
        except Course.DoesNotExist:
            return DeleteCourse(success=False)


# Token Duration Management Mutations
class CreateTokenDuration(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        minutes = graphene.Int(required=True)
        description = graphene.String()

    duration = graphene.Field(TokenDurationType)

    def mutate(self, info, **kwargs):
        from .models import TokenDuration
        duration = TokenDuration(
            name=kwargs.get('name'),
            minutes=kwargs.get('minutes'),
            description=kwargs.get('description', '')
        )
        duration.save()
        return CreateTokenDuration(duration=duration)


class UpdateTokenDuration(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        minutes = graphene.Int()
        description = graphene.String()
        is_active = graphene.Boolean()

    duration = graphene.Field(TokenDurationType)

    def mutate(self, info, **kwargs):
        from .models import TokenDuration
        try:
            duration = TokenDuration.objects.get(id=kwargs.get('id'))
        except TokenDuration.DoesNotExist:
            raise Exception('Token duration not found')

        for field, value in kwargs.items():
            if field != 'id':
                setattr(duration, field, value)

        duration.save()
        return UpdateTokenDuration(duration=duration)


class DeleteTokenDuration(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        from .models import TokenDuration
        try:
            duration = TokenDuration.objects.get(id=kwargs.get('id'))
            duration.is_active = False
            duration.save()
            return DeleteTokenDuration(success=True)
        except TokenDuration.DoesNotExist:
            return DeleteTokenDuration(success=False)


# Course Package Mutations
class CreateCoursePackage(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        package_type = graphene.String()
        course_id = graphene.ID(required=True)
        total_sessions = graphene.Int(required=True)
        session_duration_id = graphene.ID(required=True)
        fee = graphene.Float(required=True)
        description = graphene.String()
        includes_license_fee = graphene.Boolean()
        includes_materials = graphene.Boolean()
        validity_days = graphene.Int()

    course_package = graphene.Field(CoursePackageType)

    def mutate(self, info, **kwargs):
        from .models import CoursePackage, Course, TokenDuration
        try:
            course = Course.objects.get(id=kwargs.get('course_id'))
            session_duration = TokenDuration.objects.get(id=kwargs.get('session_duration_id'))

            package = CoursePackage(
                name=kwargs.get('name'),
                package_type=kwargs.get('package_type', 'BASIC'),
                course=course,
                total_sessions=kwargs.get('total_sessions'),
                session_duration=session_duration,
                fee=kwargs.get('fee'),
                description=kwargs.get('description'),
                includes_license_fee=kwargs.get('includes_license_fee', False),
                includes_materials=kwargs.get('includes_materials', False),
                validity_days=kwargs.get('validity_days')
            )
            package.save()
            return CreateCoursePackage(course_package=package)
        except (Course.DoesNotExist, TokenDuration.DoesNotExist) as e:
            raise Exception(f'Invalid course or session duration: {str(e)}')


class UpdateCoursePackage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        package_type = graphene.String()
        course_id = graphene.ID()
        total_sessions = graphene.Int()
        session_duration_id = graphene.ID()
        fee = graphene.Float()
        description = graphene.String()
        includes_license_fee = graphene.Boolean()
        includes_materials = graphene.Boolean()
        validity_days = graphene.Int()
        is_active = graphene.Boolean()

    course_package = graphene.Field(CoursePackageType)

    def mutate(self, info, **kwargs):
        from .models import CoursePackage, Course, TokenDuration
        try:
            package = CoursePackage.objects.get(id=kwargs.get('id'))

            if 'course_id' in kwargs:
                package.course = Course.objects.get(id=kwargs.get('course_id'))
            if 'session_duration_id' in kwargs:
                package.session_duration = TokenDuration.objects.get(id=kwargs.get('session_duration_id'))

            for field, value in kwargs.items():
                if field not in ['id', 'course_id', 'session_duration_id']:
                    setattr(package, field, value)

            package.save()
            return UpdateCoursePackage(course_package=package)
        except CoursePackage.DoesNotExist:
            raise Exception('Course package not found')
        except (Course.DoesNotExist, TokenDuration.DoesNotExist):
            raise Exception('Invalid course or session duration')


class DeleteCoursePackage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        from .models import CoursePackage
        try:
            package = CoursePackage.objects.get(id=kwargs.get('id'))
            package.is_active = False
            package.save()
            return DeleteCoursePackage(success=True)
        except CoursePackage.DoesNotExist:
            return DeleteCoursePackage(success=False)


# Guest Package Mutations
class CreateGuestPackage(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        package_type = graphene.String()
        vehicle_type = graphene.String(required=True)
        total_sessions = graphene.Int(required=True)
        session_duration_id = graphene.ID(required=True)
        fee = graphene.Float(required=True)
        description = graphene.String()
        validity_days = graphene.Int()

    guest_package = graphene.Field(GuestPackageType)

    def mutate(self, info, **kwargs):
        from .models import GuestPackage, TokenDuration
        try:
            session_duration = TokenDuration.objects.get(id=kwargs.get('session_duration_id'))

            package = GuestPackage(
                name=kwargs.get('name'),
                package_type=kwargs.get('package_type', 'SINGLE'),
                vehicle_type=kwargs.get('vehicle_type'),
                total_sessions=kwargs.get('total_sessions'),
                session_duration=session_duration,
                fee=kwargs.get('fee'),
                description=kwargs.get('description'),
                validity_days=kwargs.get('validity_days')
            )
            package.save()
            return CreateGuestPackage(guest_package=package)
        except TokenDuration.DoesNotExist:
            raise Exception('Invalid session duration')


class UpdateGuestPackage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        package_type = graphene.String()
        vehicle_type = graphene.String()
        total_sessions = graphene.Int()
        session_duration_id = graphene.ID()
        fee = graphene.Float()
        description = graphene.String()
        validity_days = graphene.Int()
        is_active = graphene.Boolean()

    guest_package = graphene.Field(GuestPackageType)

    def mutate(self, info, **kwargs):
        from .models import GuestPackage, TokenDuration
        try:
            package = GuestPackage.objects.get(id=kwargs.get('id'))

            if 'session_duration_id' in kwargs:
                package.session_duration = TokenDuration.objects.get(id=kwargs.get('session_duration_id'))

            for field, value in kwargs.items():
                if field not in ['id', 'session_duration_id']:
                    setattr(package, field, value)

            package.save()
            return UpdateGuestPackage(guest_package=package)
        except GuestPackage.DoesNotExist:
            raise Exception('Guest package not found')
        except TokenDuration.DoesNotExist:
            raise Exception('Invalid session duration')


class DeleteGuestPackage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        from .models import GuestPackage
        try:
            package = GuestPackage.objects.get(id=kwargs.get('id'))
            package.is_active = False
            package.save()
            return DeleteGuestPackage(success=True)
        except GuestPackage.DoesNotExist:
            return DeleteGuestPackage(success=False)


class Query(graphene.ObjectType):
    all_students = graphene.List(StudentType)
    student = graphene.Field(StudentType, id=graphene.ID())
    students_by_status = graphene.List(StudentType, status=graphene.String())
    students_by_course = graphene.List(StudentType, course_id=graphene.ID())

    all_courses = graphene.List(CourseType)
    course = graphene.Field(CourseType, id=graphene.ID())

    all_instructors = graphene.List(InstructorType)
    all_vehicles = graphene.List(VehicleType)

    # Token queries
    all_tokens = graphene.List(TokenType)
    token = graphene.Field(TokenType, id=graphene.ID())
    tokens_by_student = graphene.List(TokenType, student_id=graphene.ID())
    tokens_by_date = graphene.List(TokenType, date=graphene.Date())
    daily_schedule = graphene.List(TokenType, date=graphene.Date(required=True))
    all_token_durations = graphene.List(TokenDurationType)

    # Package queries
    all_course_packages = graphene.List(CoursePackageType)
    active_course_packages = graphene.List(CoursePackageType)
    all_guest_packages = graphene.List(GuestPackageType)
    active_guest_packages = graphene.List(GuestPackageType)

    def resolve_all_students(root, info, **kwargs):
        return Student.objects.all()

    def resolve_student(root, info, id):
        try:
            return Student.objects.get(id=id)
        except Student.DoesNotExist:
            return None

    def resolve_students_by_status(root, info, status):
        return Student.objects.filter(status=status)

    def resolve_students_by_course(root, info, course_id):
        return Student.objects.filter(course_id=course_id)

    def resolve_all_courses(root, info, **kwargs):
        return Course.objects.filter(is_active=True)

    def resolve_course(root, info, id):
        try:
            return Course.objects.get(id=id)
        except Course.DoesNotExist:
            return None

    def resolve_all_instructors(root, info, **kwargs):
        return Instructor.objects.filter(is_active=True)

    def resolve_all_vehicles(root, info, **kwargs):
        return Vehicle.objects.filter(is_active=True)

    def resolve_all_tokens(root, info, **kwargs):
        return Token.objects.all()

    def resolve_token(root, info, id):
        try:
            return Token.objects.get(id=id)
        except Token.DoesNotExist:
            return None

    def resolve_tokens_by_student(root, info, student_id):
        return Token.objects.filter(student_id=student_id).order_by('-date', '-start_time')

    def resolve_tokens_by_date(root, info, date):
        return Token.objects.filter(date=date).order_by('start_time')

    def resolve_daily_schedule(root, info, date):
        return Token.objects.filter(date=date).order_by('start_time')

    def resolve_all_token_durations(root, info, **kwargs):
        return TokenDuration.objects.filter(is_active=True)

    # Package resolvers
    def resolve_all_course_packages(root, info, **kwargs):
        return CoursePackage.objects.all()

    def resolve_active_course_packages(root, info, **kwargs):
        return CoursePackage.objects.filter(is_active=True)

    def resolve_all_guest_packages(root, info, **kwargs):
        return GuestPackage.objects.all()

    def resolve_active_guest_packages(root, info, **kwargs):
        return GuestPackage.objects.filter(is_active=True)


class Mutation(graphene.ObjectType):
    # Student mutations
    create_student = CreateStudent.Field()
    update_student = UpdateStudent.Field()
    delete_student = DeleteStudent.Field()

    # Token mutations
    create_token = CreateToken.Field()
    update_token = UpdateToken.Field()
    delete_token = DeleteToken.Field()

    # Course mutations
    create_course = CreateCourse.Field()
    update_course = UpdateCourse.Field()
    delete_course = DeleteCourse.Field()

    # Token duration mutations
    create_token_duration = CreateTokenDuration.Field()
    update_token_duration = UpdateTokenDuration.Field()
    delete_token_duration = DeleteTokenDuration.Field()

    # Course package mutations
    create_course_package = CreateCoursePackage.Field()
    update_course_package = UpdateCoursePackage.Field()
    delete_course_package = DeleteCoursePackage.Field()

    # Guest package mutations
    create_guest_package = CreateGuestPackage.Field()
    update_guest_package = UpdateGuestPackage.Field()
    delete_guest_package = DeleteGuestPackage.Field()
