from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError


# Legacy Role enum for backward compatibility
class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
    INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
    RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'


class Permission(models.Model):
    """
    Individual permission that can be assigned to roles
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique permission identifier (e.g., 'accounting.manage_fiscal_years')"
    )
    display_name = models.CharField(
        max_length=200,
        help_text="Human-readable permission name"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of what this permission allows"
    )
    category = models.CharField(
        max_length=50,
        help_text="Permission category for grouping (e.g., 'accounting', 'students', 'reports')"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.category}.{self.name}"


class CustomRole(models.Model):
    """
    Custom role that can be created by superusers with specific permissions
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Role name (e.g., 'Driving School Admin', 'Account Manager')"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this role's purpose"
    )
    permissions = models.ManyToManyField(
        Permission,
        related_name='roles',
        blank=True,
        help_text="Permissions granted to this role"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this role is active"
    )
    created_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_roles',
        help_text="Superuser who created this role"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'custom_roles'
        verbose_name = 'Custom Role'
        verbose_name_plural = 'Custom Roles'
        ordering = ['name']

    def __str__(self):
        return self.name

    def has_permission(self, permission_name):
        """Check if this role has a specific permission"""
        return self.permissions.filter(name=permission_name).exists()


class User(AbstractUser):
    # Legacy role field for backward compatibility
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEPTIONIST,
        blank=True,
        null=True
    )

    # New role-based permissions
    custom_role = models.ForeignKey(
        CustomRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text="Custom role assigned to this user"
    )

    # Direct additional permissions (for fine-grained control)
    additional_permissions = models.ManyToManyField(
        Permission,
        related_name='users_with_additional',
        blank=True,
        help_text="Additional permissions beyond the role's permissions"
    )

    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/', blank=True, null=True
    )
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        help_text="Admin who created this user"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        role_display = self.get_custom_role_display() or self.get_role_display()
        return f"{self.username} ({role_display})"

    def get_custom_role_display(self):
        """Get the custom role name if assigned"""
        return self.custom_role.name if self.custom_role else None

    def get_all_permissions(self):
        """
        Get all permissions for this user (from role + additional permissions)
        Superusers get ALL available permissions in the system
        Returns a set of permission names
        """
        # Superusers have ALL permissions
        if self.is_superuser:
            from .models import Permission as PermissionModel
            return set(PermissionModel.objects.values_list('name', flat=True))

        permissions = set()

        # Get permissions from custom role
        if self.custom_role:
            permissions.update(
                self.custom_role.permissions.values_list('name', flat=True)
            )

        # Get additional permissions
        permissions.update(
            self.additional_permissions.values_list('name', flat=True)
        )

        return permissions

    def has_permission(self, permission_name):
        """Check if user has a specific permission"""
        if self.is_superuser:
            return True

        all_permissions = self.get_all_permissions()
        return permission_name in all_permissions

    def has_any_permission(self, permission_names):
        """Check if user has any of the specified permissions"""
        if self.is_superuser:
            return True

        all_permissions = self.get_all_permissions()
        return any(perm in all_permissions for perm in permission_names)

    def can_grant_permission(self, permission_name):
        """
        Check if this user can grant a specific permission to others.
        Users can only grant permissions they themselves have.
        """
        if self.is_superuser:
            return True
        return self.has_permission(permission_name)

    def clean(self):
        """Validate user data"""
        super().clean()

        # If not superuser and not assigned a custom role, require legacy role
        if not self.is_superuser and not self.custom_role and not self.role:
            raise ValidationError("User must have either a custom role or a legacy role.")
