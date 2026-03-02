from django.contrib import admin
from .models import (
    Student, Course, Instructor, Vehicle, Token, TokenDuration,
    CoursePackage, GuestPackage
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'fee', 'duration', 'is_active')
    list_filter = ('name', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'license_number', 'hourly_rate', 'is_active')
    list_filter = ('specialization', 'is_active')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number')


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'vehicle_type', 'license_plate', 'is_active')
    list_filter = ('vehicle_type', 'is_active')
    search_fields = ('model_name', 'license_plate', 'registration_number')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'contact', 'course', 'status', 'fee_due')
    list_filter = ('status', 'course', 'batch_number')
    search_fields = ('student_id', 'first_name', 'last_name', 'contact', 'citizenship_number')
    readonly_fields = ('student_id', 'fee_due', 'admission_date')

    fieldsets = (
        ('Personal Information', {
            'fields': ('student_id', 'first_name', 'last_name', 'date_of_birth', 'contact', 'email', 'address', 'citizenship_number')
        }),
        ('Course Information', {
            'fields': ('course', 'instructor', 'batch_number', 'status')
        }),
        ('Documents', {
            'fields': ('photo', 'id_proof')
        }),
        ('Fee Information', {
            'fields': ('admission_fee', 'fee_paid', 'admission_date')
        }),
    )


@admin.register(TokenDuration)
class TokenDurationAdmin(admin.ModelAdmin):
    list_display = ('name', 'minutes', 'is_active')
    list_filter = ('is_active',)


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'student', 'date', 'start_time', 'end_time', 'instructor', 'vehicle', 'status')
    list_filter = ('status', 'date', 'duration')
    search_fields = ('token_number', 'student__first_name', 'student__last_name', 'student__student_id')
    readonly_fields = ('token_number',)

    fieldsets = (
        ('Token Information', {
            'fields': ('token_number', 'student', 'duration', 'date', 'start_time', 'end_time', 'status')
        }),
        ('Assignment', {
            'fields': ('instructor', 'vehicle')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(CoursePackage)
class CoursePackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'package_type', 'course', 'total_sessions', 'fee', 'is_active')
    list_filter = ('package_type', 'course', 'is_active')
    search_fields = ('name', 'description')


@admin.register(GuestPackage)
class GuestPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'package_type', 'vehicle_type', 'total_sessions', 'fee', 'is_active')
    list_filter = ('package_type', 'vehicle_type', 'is_active')
    search_fields = ('name', 'description')

