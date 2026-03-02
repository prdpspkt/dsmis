from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, date
import random
from decimal import Decimal

from core.models import User, Role
from students.models import (
    Course, Instructor, Vehicle, Student, Token, TokenDuration, TokenStatus, StudentStatus, CourseType
)
from accounting.models import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMode, Income


class Command(BaseCommand):
    help = 'Seed database with dummy data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with dummy data...')

        # Clear existing data (optional - comment out if you want to keep existing data)
        # Token.objects.all().delete()
        # Student.objects.all().delete()
        # Vehicle.objects.all().delete()
        # Instructor.objects.all().delete()
        # Course.objects.all().delete()
        # User.objects.filter(role__in=[Role.INSTRUCTOR, Role.RECEPTIONIST]).delete()

        # 1. Create Admin User
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@driving-school.com',
                'role': Role.ADMIN,
                'is_superuser': True,
                'is_staff': True,
                'first_name': 'Admin',
                'last_name': 'User'
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('* Created admin user'))

        # 2. Create Courses
        courses_data = [
            {'type': CourseType.CAR, 'fee': 15000, 'duration': 30, 'description': 'Complete car driving training with manual and automatic transmission'},
            {'type': CourseType.BIKE, 'fee': 8000, 'duration': 20, 'description': 'Motorcycle training with gear and non-gear vehicles'},
            {'type': CourseType.SCOOTER, 'fee': 6000, 'duration': 15, 'description': 'Scooter training for beginners'},
            {'type': CourseType.HEAVY_VEHICLE, 'fee': 25000, 'duration': 45, 'description': 'Heavy vehicle license training including trucks and buses'},
        ]

        courses = []
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                name=course_data['type'],
                defaults={
                    'fee': course_data['fee'],
                    'duration': course_data['duration'],
                    'description': course_data['description']
                }
            )
            courses.append(course)
            if created:
                self.stdout.write(self.style.SUCCESS(f"* Created course: {course.get_name_display()}"))

        # 3. Create Instructors
        instructors_data = [
            {'username': 'rahul.instructor', 'first_name': 'Rahul', 'last_name': 'Sharma', 'specialization': CourseType.CAR, 'license': 'CAR-INS-001', 'rate': 500},
            {'username': 'priya.instructor', 'first_name': 'Priya', 'last_name': 'Patel', 'specialization': CourseType.CAR, 'license': 'CAR-INS-002', 'rate': 450},
            {'username': 'amit.instructor', 'first_name': 'Amit', 'last_name': 'Kumar', 'specialization': CourseType.BIKE, 'license': 'BIKE-INS-001', 'rate': 400},
            {'username': 'suresh.instructor', 'first_name': 'Suresh', 'last_name': 'Singh', 'specialization': CourseType.HEAVY_VEHICLE, 'license': 'HV-INS-001', 'rate': 700},
            {'username': 'nisha.instructor', 'first_name': 'Nisha', 'last_name': 'Verma', 'specialization': CourseType.SCOOTER, 'license': 'SCOOT-INS-001', 'rate': 350},
        ]

        instructors = []
        for inst_data in instructors_data:
            user, created = User.objects.get_or_create(
                username=inst_data['username'],
                defaults={
                    'first_name': inst_data['first_name'],
                    'last_name': inst_data['last_name'],
                    'email': f"{inst_data['first_name'].lower()}@driving-school.com",
                    'role': Role.INSTRUCTOR,
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            instructor, created = Instructor.objects.get_or_create(
                user=user,
                defaults={
                    'specialization': inst_data['specialization'],
                    'license_number': inst_data['license'],
                    'hourly_rate': inst_data['rate']
                }
            )
            instructors.append(instructor)
            if created:
                self.stdout.write(self.style.SUCCESS(f"* Created instructor: {instructor}"))

        # 4. Create Vehicles
        vehicles_data = [
            {'type': CourseType.CAR, 'model': 'Maruti Suzuki Swift', 'plate': 'MH-01-AB-1234', 'reg': 'MH2015001234'},
            {'type': CourseType.CAR, 'model': 'Hyundai i20', 'plate': 'MH-01-CD-5678', 'reg': 'MH2015005678'},
            {'type': CourseType.CAR, 'model': 'Honda City', 'plate': 'MH-02-EF-9012', 'reg': 'MH2015009012'},
            {'type': CourseType.BIKE, 'model': 'Bajaj Pulsar', 'plate': 'MH-01-GH-3456', 'reg': 'MH2015003456'},
            {'type': CourseType.BIKE, 'model': 'Honda CB Shine', 'plate': 'MH-01-IJ-7890', 'reg': 'MH2015007890'},
            {'type': CourseType.SCOOTER, 'model': 'Honda Activa', 'plate': 'MH-01-KL-2345', 'reg': 'MH2015002345'},
            {'type': CourseType.SCOOTER, 'model': 'TVS Jupiter', 'plate': 'MH-01-MN-6789', 'reg': 'MH2015006789'},
            {'type': CourseType.HEAVY_VEHICLE, 'model': 'Tata LPT 1613', 'plate': 'MH-01-OP-4567', 'reg': 'MH2015004567'},
        ]

        vehicles = []
        for veh_data in vehicles_data:
            vehicle, created = Vehicle.objects.get_or_create(
                license_plate=veh_data['plate'],
                defaults={
                    'vehicle_type': veh_data['type'],
                    'model_name': veh_data['model'],
                    'registration_number': veh_data['reg']
                }
            )
            vehicles.append(vehicle)
            if created:
                self.stdout.write(self.style.SUCCESS(f"* Created vehicle: {vehicle}"))

        # 5. Create Token Durations
        durations_data = [
            {'name': '15 minutes', 'minutes': 15},
            {'name': '30 minutes', 'minutes': 30},
            {'name': '45 minutes', 'minutes': 45},
            {'name': '1 hour', 'minutes': 60},
        ]

        durations = []
        for dur_data in durations_data:
            duration, created = TokenDuration.objects.get_or_create(
                name=dur_data['name'],
                defaults={'minutes': dur_data['minutes']}
            )
            durations.append(duration)
            if created:
                self.stdout.write(self.style.SUCCESS(f"* Created token duration: {duration.name}"))

        # 6. Create Students
        students_data = [
            {'first_name': 'Raj', 'last_name': 'Mehta', 'contact': '9876543210', 'email': 'raj.mehta@email.com', 'citizenship': 'A12345678', 'dob': '1995-05-15', 'course': 0, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Sneha', 'last_name': 'Reddy', 'contact': '9876543211', 'email': 'sneha.reddy@email.com', 'citizenship': 'B12345679', 'dob': '1998-08-22', 'course': 0, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Vikram', 'last_name': ' Joshi', 'contact': '9876543212', 'email': 'vikram.j@email.com', 'citizenship': 'C12345680', 'dob': '1992-12-10', 'course': 2, 'status': StudentStatus.COMPLETED},
            {'first_name': 'Anita', 'last_name': 'Desai', 'contact': '9876543213', 'email': 'anita.d@email.com', 'citizenship': 'D12345681', 'dob': '2000-03-18', 'course': 1, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Karan', 'last_name': 'Malhotra', 'contact': '9876543214', 'email': 'karan.m@email.com', 'citizenship': 'E12345682', 'dob': '1997-07-25', 'course': 3, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Pooja', 'last_name': 'Nair', 'contact': '9876543215', 'email': 'pooja.nair@email.com', 'citizenship': 'F12345683', 'dob': '2001-01-30', 'course': 2, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Rohit', 'last_name': 'Gupta', 'contact': '9876543216', 'email': 'rohit.gupta@email.com', 'citizenship': 'G12345684', 'dob': '1994-09-12', 'course': 0, 'status': StudentStatus.DROPPED},
            {'first_name': 'Divya', 'last_name': 'Iyer', 'contact': '9876543217', 'email': 'divya.iyer@email.com', 'citizenship': 'H12345685', 'dob': '1999-11-05', 'course': 1, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Arjun', 'last_name': 'Rao', 'contact': '9876543218', 'email': 'arjun.rao@email.com', 'citizenship': 'I12345686', 'dob': '1996-06-20', 'course': 0, 'status': StudentStatus.ACTIVE},
            {'first_name': 'Kavita', 'last_name': 'Sharma', 'contact': '9876543219', 'email': 'kavita.s@email.com', 'citizenship': 'J12345687', 'dob': '2002-04-08', 'course': 2, 'status': StudentStatus.ACTIVE},
        ]

        students = []
        for i, stu_data in enumerate(students_data):
            # Create user for student
            username = f"{stu_data['first_name'].lower()}.{stu_data['last_name'].lower()}"

            # Check if student already exists
            existing = Student.objects.filter(citizenship_number=stu_data['citizenship']).first()
            if existing:
                students.append(existing)
                continue

            user = User.objects.create_user(
                username=username,
                email=stu_data['email'],
                password='password123',
                first_name=stu_data['first_name'],
                last_name=stu_data['last_name'],
                role=Role.RECEPTIONIST
            )

            student = Student.objects.create(
                user=user,
                first_name=stu_data['first_name'],
                last_name=stu_data['last_name'],
                address=f'{i+1}, Main Street, Sector {i+1}, Mumbai - 4000{i+1}',
                contact=stu_data['contact'],
                email=stu_data['email'],
                citizenship_number=stu_data['citizenship'],
                date_of_birth=stu_data['dob'],
                course=courses[stu_data['course']],
                instructor=instructors[i % len(instructors)],
                batch_number=f'BATCH-2024-{(i % 5) + 1:02d}',
                status=stu_data['status'],
                admission_fee=courses[stu_data['course']].fee,
                fee_paid=Decimal(str(random.randint(5000, 15000))),
                admission_date=date.today() - timedelta(days=random.randint(10, 90))
            )
            students.append(student)
            self.stdout.write(self.style.SUCCESS(f"* Created student: {student.full_name} ({student.student_id})"))

        # 7. Create Tokens
        token_statuses = [TokenStatus.SCHEDULED, TokenStatus.COMPLETED, TokenStatus.IN_PROGRESS, TokenStatus.CANCELLED]
        today = date.today()

        for i in range(30):
            student = random.choice(students)
            instructor = random.choice(instructors)
            vehicle = random.choice([v for v in vehicles if v.vehicle_type == instructor.specialization])
            duration = random.choice(durations)

            # Generate date within last 30 days
            token_date = today - timedelta(days=random.randint(0, 30))

            # Generate time slots
            hour = random.randint(7, 17)
            minute = random.choice([0, 30])
            start_time = datetime.strptime(f'{hour:02d}:{minute:02d}', '%H:%M').time()

            token, created = Token.objects.get_or_create(
                student=student,
                date=token_date,
                start_time=start_time,
                defaults={
                    'duration': duration,
                    'instructor': instructor,
                    'vehicle': vehicle,
                    'status': random.choice(token_statuses),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"* Created token: {token.token_number}"))

        # 8. Create Invoices and Payments
        invoice_statuses = [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE]

        for i, student in enumerate(students[:8]):
            invoice = Invoice.objects.create(
                student=student,
                invoice_date=today - timedelta(days=random.randint(5, 60)),
                due_date=today + timedelta(days=random.randint(10, 30)),
                status=random.choice(invoice_statuses),
                notes=f"Invoice for {student.course.get_name_display()} course"
            )

            # Add invoice items
            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{student.course.get_name_display()} Course Fee",
                quantity=1,
                unit_price=student.course.fee,
                item_type='COURSE_FEE'
            )

            # Add payment for some invoices
            if invoice.status in [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID]:
                payment_amount = invoice.total if invoice.status == InvoiceStatus.PAID else invoice.total * Decimal('0.5')
                payment = Payment.objects.create(
                    invoice=invoice,
                    amount=payment_amount,
                    mode=random.choice([PaymentMode.CASH, PaymentMode.UPI, PaymentMode.BANK]),
                    received_by='admin'
                )

                # Create income record
                Income.objects.create(
                    invoice=invoice,
                    category=random.choice(['ADMISSION', 'DRIVING_SESSION']),
                    amount=payment_amount,
                    date=payment.payment_date,
                    related_student=student,
                    payment_mode=payment.mode,
                    description=f"Payment for {invoice.invoice_number}"
                )

            self.stdout.write(self.style.SUCCESS(f"* Created invoice: {invoice.invoice_number}"))

        self.stdout.write(self.style.SUCCESS('\n[SUCCESS] Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('Admin login: username=admin, password=admin123'))
        self.stdout.write(self.style.SUCCESS('Instructor login: username=rahul.instructor, password=password123'))
