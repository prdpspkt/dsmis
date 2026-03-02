from django.db import models
from core.models import User


class CourseType(models.TextChoices):
    CAR = 'CAR', 'Car'
    BIKE = 'BIKE', 'Bike'
    SCOOTER = 'SCOOTER', 'Scooter'
    HEAVY_VEHICLE = 'HEAVY_VEHICLE', 'Heavy Vehicle'


class StudentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    COMPLETED = 'COMPLETED', 'Completed'
    DROPPED = 'DROPPED', 'Dropped'


class Course(models.Model):
    name = models.CharField(max_length=50, choices=CourseType.choices)
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(help_text="Duration in hours")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return f"{self.get_name_display()} - ₹{self.fee}"


class Instructor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='instructor_profile')
    specialization = models.CharField(
        max_length=50,
        choices=CourseType.choices,
        blank=True,
        null=True
    )
    license_number = models.CharField(max_length=50, unique=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'instructors'
        verbose_name = 'Instructor'
        verbose_name_plural = 'Instructors'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_specialization_display() or 'Not Assigned'})"


class Vehicle(models.Model):
    vehicle_type = models.CharField(
        max_length=50,
        choices=CourseType.choices
    )
    model_name = models.CharField(max_length=100)
    license_plate = models.CharField(max_length=20, unique=True)
    registration_number = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vehicles'
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'

    def __str__(self):
        return f"{self.model_name} ({self.license_plate})"


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.TextField()
    contact = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    citizenship_number = models.CharField(max_length=50, unique=True)
    date_of_birth = models.DateField()
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='students')
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    batch_number = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=StudentStatus.choices, default=StudentStatus.ACTIVE)
    photo = models.ImageField(upload_to='students/photos/', blank=True, null=True)
    id_proof = models.FileField(upload_to='students/id_proofs/', blank=True, null=True)
    admission_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fee_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admission_date = models.DateField(auto_now_add=True)

    # Time tracking fields
    total_purchased_minutes = models.IntegerField(default=0, help_text="Total minutes purchased with course")
    total_used_minutes = models.IntegerField(default=0, help_text="Total minutes used in completed sessions")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def fee_due(self):
        return self.course.fee - self.fee_paid

    @property
    def remaining_minutes(self):
        """Calculate remaining minutes from purchased time"""
        return max(0, self.total_purchased_minutes - self.total_used_minutes)

    @property
    def remaining_hours(self):
        """Calculate remaining hours"""
        return round(self.remaining_minutes / 60, 2)

    @property
    def is_time_completed(self):
        """Check if student has used all purchased time"""
        return self.total_used_minutes >= self.total_purchased_minutes

    @property
    def progress_percentage(self):
        """Calculate course progress percentage"""
        if self.total_purchased_minutes == 0:
            return 0
        return min(100, int((self.total_used_minutes / self.total_purchased_minutes) * 100))

    def save(self, *args, **kwargs):
        if not self.student_id:
            # Auto-generate student ID
            from django.utils import timezone
            year = timezone.now().year
            last_student = Student.objects.filter(student_id__startswith=f'STD{year}').order_by('-student_id').first()
            if last_student:
                last_number = int(last_student.student_id[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            self.student_id = f'STD{year}{new_number:04d}'
        super().save(*args, **kwargs)


class TokenDuration(models.Model):
    name = models.CharField(max_length=50)  # e.g., "15 minutes", "30 minutes"
    minutes = models.IntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'token_durations'
        verbose_name = 'Token Duration'
        verbose_name_plural = 'Token Durations'

    def __str__(self):
        return self.name


# Package Models
class CoursePackage(models.Model):
    """Packages for regular students - includes course, sessions, materials, etc."""
    PACKAGE_TYPE_CHOICES = [
        ('BASIC', 'Basic'),
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
        ('CUSTOM', 'Custom'),
    ]

    name = models.CharField(max_length=200)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE_CHOICES, default='BASIC')
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='packages')
    total_sessions = models.IntegerField(help_text="Number of driving sessions included")
    session_duration = models.ForeignKey(TokenDuration, on_delete=models.PROTECT, related_name='course_packages')
    fee = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total package fee")
    description = models.TextField(blank=True, null=True)
    includes_license_fee = models.BooleanField(default=False, help_text="Whether license fee is included")
    includes_materials = models.BooleanField(default=False, help_text="Whether study materials are included")
    validity_days = models.IntegerField(help_text="Package validity in days", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_packages'
        verbose_name = 'Course Package'
        verbose_name_plural = 'Course Packages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.course.get_name_display()} ({self.package_type})"


class GuestPackage(models.Model):
    """Packages for walk-in guests - simple session-based packages"""
    PACKAGE_TYPE_CHOICES = [
        ('SINGLE', 'Single Session'),
        ('TRIAL', 'Trial Pack'),
        ('SHORT', 'Short Term'),
        ('INTENSIVE', 'Intensive'),
    ]

    name = models.CharField(max_length=200)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE_CHOICES, default='SINGLE')
    vehicle_type = models.CharField(max_length=50, choices=CourseType.choices)
    total_sessions = models.IntegerField(help_text="Number of sessions in package")
    session_duration = models.ForeignKey(TokenDuration, on_delete=models.PROTECT, related_name='guest_packages')
    fee = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total package fee")
    description = models.TextField(blank=True, null=True)
    validity_days = models.IntegerField(help_text="Package validity in days (null for unlimited)", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guest_packages'
        verbose_name = 'Guest Package'
        verbose_name_plural = 'Guest Packages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.vehicle_type} ({self.package_type})"


class TokenStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    EXPIRED = 'EXPIRED', 'Expired'


class Token(models.Model):
    token_number = models.CharField(max_length=20, unique=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='tokens')
    duration = models.ForeignKey(TokenDuration, on_delete=models.PROTECT, related_name='tokens')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, related_name='tokens')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, related_name='tokens')
    status = models.CharField(max_length=20, choices=TokenStatus.choices, default=TokenStatus.SCHEDULED)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tokens'
        verbose_name = 'Token'
        verbose_name_plural = 'Tokens'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f"{self.token_number} - {self.student.full_name} ({self.date})"

    def save(self, *args, **kwargs):
        if not self.token_number:
            from django.utils import timezone
            today = timezone.now().date()
            prefix = f"TK{today.strftime('%Y%m%d')}"
            last_token = Token.objects.filter(token_number__startswith=prefix).order_by('-token_number').first()
            if last_token:
                last_number = int(last_token.token_number[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            self.token_number = f"{prefix}{new_number:04d}"

        # Auto-calculate end_time if not set
        if self.start_time and self.duration and not self.end_time:
            from datetime import datetime, timedelta
            start_dt = datetime.combine(datetime.today(), self.start_time)
            end_dt = start_dt + timedelta(minutes=self.duration.minutes)
            self.end_time = end_dt.time()

        super().save(*args, **kwargs)

    @classmethod
    def check_slot_availability(cls, date, start_time, end_time, exclude_token_id=None):
        """
        Check if a time slot is available.
        Returns list of unavailable resources (instructors/vehicles)
        """
        from django.db.models import Q

        # Check for overlapping tokens
        overlapping = cls.objects.filter(
            date=date,
            status__in=[TokenStatus.SCHEDULED, TokenStatus.IN_PROGRESS]
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        )

        if exclude_token_id:
            overlapping = overlapping.exclude(id=exclude_token_id)

        occupied_instructors = set(overlapping.values_list('instructor_id', flat=True))
        occupied_vehicles = set(overlapping.values_list('vehicle_id', flat=True))

        return {
            'occupied_instructors': list(occupied_instructors),
            'occupied_vehicles': list(occupied_vehicles)
        }
