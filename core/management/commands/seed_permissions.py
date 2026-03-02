from django.core.management.base import BaseCommand
from core.models import Permission


class Command(BaseCommand):
    help = 'Seeds initial permissions for the application'

    def handle(self, *args, **options):
        permissions = [
            # Dashboard
            {
                'name': 'dashboard.view',
                'display_name': 'View Dashboard',
                'description': 'Access to main dashboard',
                'category': 'dashboard'
            },

            # Students
            {
                'name': 'students.view',
                'display_name': 'View Students',
                'description': 'View student list and details',
                'category': 'students'
            },
            {
                'name': 'students.manage',
                'display_name': 'Manage Students',
                'description': 'Create, edit, and delete students',
                'category': 'students'
            },
            {
                'name': 'students.admission',
                'display_name': 'Student Admission',
                'description': 'Admit new students',
                'category': 'students'
            },

            # Tokens
            {
                'name': 'tokens.view',
                'display_name': 'View Tokens',
                'description': 'View token bookings',
                'category': 'operations'
            },
            {
                'name': 'tokens.manage',
                'display_name': 'Manage Tokens',
                'description': 'Create and manage token bookings',
                'category': 'operations'
            },

            # Guest Billing
            {
                'name': 'guest_billing.view',
                'display_name': 'View Guest Billing',
                'description': 'View walk-in guest bills',
                'category': 'operations'
            },
            {
                'name': 'guest_billing.manage',
                'display_name': 'Manage Guest Billing',
                'description': 'Create and manage guest bills',
                'category': 'operations'
            },

            # TMO Billing
            {
                'name': 'tmo_billing.view',
                'display_name': 'View TMO Billing',
                'description': 'View TMO trial bills',
                'category': 'operations'
            },
            {
                'name': 'tmo_billing.manage',
                'display_name': 'Manage TMO Billing',
                'description': 'Create and manage TMO trials',
                'category': 'operations'
            },

            # Packages
            {
                'name': 'packages.view',
                'display_name': 'View Packages',
                'description': 'View training packages',
                'category': 'packages'
            },
            {
                'name': 'packages.manage',
                'display_name': 'Manage Packages',
                'description': 'Create, edit, and delete packages',
                'category': 'packages'
            },

            # Invoices
            {
                'name': 'invoices.view',
                'display_name': 'View Invoices',
                'description': 'View invoice list and details',
                'category': 'financial'
            },
            {
                'name': 'invoices.manage',
                'display_name': 'Manage Invoices',
                'description': 'Create and manage invoices',
                'category': 'financial'
            },
            {
                'name': 'invoices.create',
                'display_name': 'Create Invoices',
                'description': 'Create new invoices',
                'category': 'financial'
            },

            # Accounting
            {
                'name': 'accounting.view',
                'display_name': 'View Accounting',
                'description': 'View accounting data and reports',
                'category': 'accounting'
            },
            {
                'name': 'accounting.manage',
                'display_name': 'Manage Accounting',
                'description': 'Full access to accounting features',
                'category': 'accounting'
            },
            {
                'name': 'accounting.manage_fiscal_years',
                'display_name': 'Manage Fiscal Years',
                'description': 'Create and manage fiscal years',
                'category': 'accounting'
            },
            {
                'name': 'accounting.create_journal',
                'display_name': 'Create Journal Entries',
                'description': 'Create manual journal entries',
                'category': 'accounting'
            },
            {
                'name': 'accounting.manage_accounts',
                'display_name': 'Manage Chart of Accounts',
                'description': 'Create and manage accounts',
                'category': 'accounting'
            },

            # Assets
            {
                'name': 'assets.view',
                'display_name': 'View Assets',
                'description': 'View asset list and details',
                'category': 'assets'
            },
            {
                'name': 'assets.manage',
                'display_name': 'Manage Assets',
                'description': 'Create, edit, and delete assets',
                'category': 'assets'
            },

            # Shareholders
            {
                'name': 'shareholders.view',
                'display_name': 'View Shareholders',
                'description': 'View shareholder information',
                'category': 'financial'
            },
            {
                'name': 'shareholders.manage',
                'display_name': 'Manage Shareholders',
                'description': 'Create and manage shareholders',
                'category': 'financial'
            },

            # Reports
            {
                'name': 'reports.view',
                'display_name': 'View Reports',
                'description': 'Access to reports menu',
                'category': 'reports'
            },
            {
                'name': 'reports.financial',
                'display_name': 'Financial Reports',
                'description': 'View financial reports (P&L, Balance Sheet)',
                'category': 'reports'
            },
            {
                'name': 'reports.student',
                'display_name': 'Student Reports',
                'description': 'View student reports',
                'category': 'reports'
            },
            {
                'name': 'reports.collection',
                'display_name': 'Collection Reports',
                'description': 'View collection and payment reports',
                'category': 'reports'
            },

            # User Management
            {
                'name': 'users.view',
                'display_name': 'View Users',
                'description': 'View user list',
                'category': 'users'
            },
            {
                'name': 'users.manage',
                'display_name': 'Manage Users',
                'description': 'Create and edit users',
                'category': 'users'
            },
            {
                'name': 'users.create',
                'display_name': 'Create Users',
                'description': 'Create new users',
                'category': 'users'
            },
            {
                'name': 'users.delete',
                'display_name': 'Delete Users',
                'description': 'Delete users',
                'category': 'users'
            },
            {
                'name': 'users.reset_password',
                'display_name': 'Reset User Passwords',
                'description': 'Reset passwords for other users',
                'category': 'users'
            },

            # Role Management
            {
                'name': 'roles.view',
                'display_name': 'View Roles',
                'description': 'View role list and permissions',
                'category': 'users'
            },
            {
                'name': 'roles.manage',
                'display_name': 'Manage Roles',
                'description': 'Create and manage roles',
                'category': 'users'
            },

            # Settings
            {
                'name': 'settings.view',
                'display_name': 'View Settings',
                'description': 'View system settings',
                'category': 'settings'
            },
            {
                'name': 'settings.manage',
                'display_name': 'Manage Settings',
                'description': 'Modify system settings',
                'category': 'settings'
            },
        ]

        created_count = 0
        updated_count = 0

        for perm_data in permissions:
            permission, created = Permission.objects.get_or_create(
                name=perm_data['name'],
                defaults={
                    'display_name': perm_data['display_name'],
                    'description': perm_data['description'],
                    'category': perm_data['category']
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created permission: {permission.display_name}")
                )
            else:
                # Update existing permission
                permission.display_name = perm_data['display_name']
                permission.description = perm_data['description']
                permission.category = perm_data['category']
                permission.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Updated permission: {permission.display_name}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nPermission seeding complete!\n"
                f"Created: {created_count}\n"
                f"Updated: {updated_count}\n"
                f"Total permissions: {len(permissions)}"
            )
        )
