import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from .models import Permission, CustomRole
from .permissions import check_superuser, check_permissions

User = get_user_model()


# =============================================================================
# GraphQL Types
# =============================================================================

class PermissionType(DjangoObjectType):
    class Meta:
        model = Permission
        fields = '__all__'


class CustomRoleType(DjangoObjectType):
    class Meta:
        model = CustomRole
        fields = '__all__'

    permission_count = graphene.Int()

    def resolve_permission_count(self, info):
        return self.permissions.count()


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = '__all__'

    custom_role_name = graphene.String()
    all_permissions = graphene.List(graphene.String)
    permission_count = graphene.Int()

    def resolve_custom_role_name(self, info):
        return self.get_custom_role_display()

    def resolve_all_permissions(self, info):
        return list(self.get_all_permissions())

    def resolve_permission_count(self, info):
        return len(self.get_all_permissions())


# =============================================================================
# Queries
# =============================================================================

class Query(graphene.ObjectType):
    # Permissions
    all_permissions = graphene.List(PermissionType)
    permission_by_id = graphene.Field(PermissionType, id=graphene.ID())
    permissions_by_category = graphene.List(PermissionType, category=graphene.String())

    # Custom Roles
    all_custom_roles = graphene.List(CustomRoleType)
    custom_role_by_id = graphene.Field(CustomRoleType, id=graphene.ID())
    active_custom_roles = graphene.List(CustomRoleType)

    # Users
    all_users = graphene.List(UserType)
    user_by_id = graphene.Field(UserType, id=graphene.ID())
    current_user = graphene.Field(UserType)
    users_by_role = graphene.List(UserType, role_id=graphene.ID())

    # Permission Queries
    def resolve_all_permissions(self, info):
        return Permission.objects.all()

    def resolve_permission_by_id(self, info, id):
        try:
            return Permission.objects.get(id=id)
        except Permission.DoesNotExist:
            return None

    def resolve_permissions_by_category(self, info, category):
        return Permission.objects.filter(category=category)

    # Custom Role Queries
    def resolve_all_custom_roles(self, info):
        return CustomRole.objects.select_related('created_by').all()

    def resolve_custom_role_by_id(self, info, id):
        try:
            return CustomRole.objects.select_related('created_by').get(id=id)
        except CustomRole.DoesNotExist:
            return None

    def resolve_active_custom_roles(self, info):
        return CustomRole.objects.filter(is_active=True)

    # User Queries
    def resolve_all_users(self, info):
        return User.objects.select_related('custom_role', 'created_by').prefetch_related(
            'additional_permissions'
        ).all()

    def resolve_user_by_id(self, info, id):
        try:
            return User.objects.select_related('custom_role', 'created_by').prefetch_related(
                'additional_permissions'
            ).get(id=id)
        except User.DoesNotExist:
            return None

    def resolve_current_user(self, info):
        user = info.context.user if hasattr(info.context, 'user') else None
        if user and user.is_authenticated:
            return user
        return None

    def resolve_users_by_role(self, info, role_id):
        return User.objects.filter(custom_role_id=role_id)


# =============================================================================
# Mutations - Permissions
# =============================================================================

class CreatePermission(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        display_name = graphene.String(required=True)
        description = graphene.String()
        category = graphene.String(required=True)

    permission = graphene.Field(PermissionType)

    @check_superuser
    def mutate(self, info, **kwargs):
        permission = Permission(**kwargs)
        permission.save()
        return CreatePermission(permission=permission)


class UpdatePermission(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        display_name = graphene.String()
        description = graphene.String()
        category = graphene.String()

    permission = graphene.Field(PermissionType)

    @check_superuser
    def mutate(self, info, **kwargs):
        try:
            permission = Permission.objects.get(id=kwargs.pop('id'))
        except Permission.DoesNotExist:
            raise Exception('Permission not found')

        for field, value in kwargs.items():
            setattr(permission, field, value)

        permission.save()
        return UpdatePermission(permission=permission)


class DeletePermission(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @check_superuser
    def mutate(self, info, id):
        try:
            permission = Permission.objects.get(id=id)
            permission.delete()
            return DeletePermission(success=True)
        except Permission.DoesNotExist:
            raise Exception('Permission not found')


# =============================================================================
# Mutations - Custom Roles
# =============================================================================

class CreateCustomRole(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String()
        permission_ids = graphene.List(graphene.ID)

    custom_role = graphene.Field(CustomRoleType)

    @check_superuser
    def mutate(self, info, **kwargs):
        from django.core.exceptions import ValidationError

        user = info.context.user if hasattr(info.context, 'user') else None
        permission_ids = kwargs.pop('permission_ids', [])

        custom_role = CustomRole(**kwargs, created_by=user)
        custom_role.save()

        # Add permissions
        if permission_ids:
            try:
                permissions = Permission.objects.filter(id__in=permission_ids)
                custom_role.permissions.set(permissions)
            except Exception as e:
                raise Exception(f'Error adding permissions: {str(e)}')

        return CreateCustomRole(custom_role=custom_role)


class UpdateCustomRole(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        permission_ids = graphene.List(graphene.ID)
        is_active = graphene.Boolean()

    custom_role = graphene.Field(CustomRoleType)

    @check_superuser
    def mutate(self, info, **kwargs):
        try:
            custom_role = CustomRole.objects.get(id=kwargs.pop('id'))
        except CustomRole.DoesNotExist:
            raise Exception('Role not found')

        permission_ids = kwargs.pop('permission_ids', None)

        for field, value in kwargs.items():
            setattr(custom_role, field, value)

        custom_role.save()

        # Update permissions if provided
        if permission_ids is not None:
            permissions = Permission.objects.filter(id__in=permission_ids)
            custom_role.permissions.set(permissions)

        return UpdateCustomRole(custom_role=custom_role)


class DeleteCustomRole(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @check_superuser
    def mutate(self, info, id):
        try:
            custom_role = CustomRole.objects.get(id=id)

            # Check if role is assigned to any users
            if custom_role.users.exists():
                raise Exception('Cannot delete role that is assigned to users')

            custom_role.delete()
            return DeleteCustomRole(success=True)
        except CustomRole.DoesNotExist:
            raise Exception('Role not found')


# =============================================================================
# Mutations - User Management
# =============================================================================

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String()
        first_name = graphene.String()
        last_name = graphene.String()
        password = graphene.String(required=True)
        phone = graphene.String()
        address = graphene.String()
        custom_role_id = graphene.ID()
        additional_permission_ids = graphene.List(graphene.ID)
        is_staff = graphene.Boolean()
        is_active = graphene.Boolean()

    user = graphene.Field(UserType)

    def mutate(self, info, **kwargs):
        user = info.context.user if hasattr(info.context, 'user') else None

        # Must be authenticated
        if not user or not user.is_authenticated:
            raise Exception('Authentication required')

        # Check if user can create users (is superuser or has user management permission)
        if not user.is_superuser and not user.has_permission('users.manage'):
            raise Exception('You do not have permission to create users')

        custom_role_id = kwargs.pop('custom_role_id', None)
        additional_permission_ids = kwargs.pop('additional_permission_ids', [])
        password = kwargs.pop('password')

        # Verify custom role exists if provided
        if custom_role_id:
            try:
                CustomRole.objects.get(id=custom_role_id)
            except CustomRole.DoesNotExist:
                raise Exception('Specified role does not exist')

        # Verify additional permissions - user can only grant permissions they have
        if additional_permission_ids and not user.is_superuser:
            for perm_id in additional_permission_ids:
                try:
                    permission = Permission.objects.get(id=perm_id)
                    if not user.can_grant_permission(permission.name):
                        raise Exception(f'You cannot grant permission: {permission.display_name}')
                except Permission.DoesNotExist:
                    raise Exception('One or more permissions do not exist')

        # Create user
        new_user = User(**kwargs, created_by=user)
        new_user.set_password(password)
        new_user.save()

        # Assign custom role
        if custom_role_id:
            new_user.custom_role_id = custom_role_id
            new_user.save()

        # Add additional permissions
        if additional_permission_ids:
            permissions = Permission.objects.filter(id__in=additional_permission_ids)
            new_user.additional_permissions.set(permissions)

        return CreateUser(user=new_user)


class UpdateUser(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        email = graphene.String()
        first_name = graphene.String()
        last_name = graphene.String()
        phone = graphene.String()
        address = graphene.String()
        custom_role_id = graphene.ID()
        additional_permission_ids = graphene.List(graphene.ID)
        is_staff = graphene.Boolean()
        is_active = graphene.Boolean()

    user = graphene.Field(UserType)

    def mutate(self, info, **kwargs):
        requesting_user = info.context.user if hasattr(info.context, 'user') else None

        # Must be authenticated
        if not requesting_user or not requesting_user.is_authenticated:
            raise Exception('Authentication required')

        # Check if user can manage users
        if not requesting_user.is_superuser and not requesting_user.has_permission('users.manage'):
            raise Exception('You do not have permission to update users')

        try:
            target_user = User.objects.get(id=kwargs.pop('id'))
        except User.DoesNotExist:
            raise Exception('User not found')

        # Prevent modifying superusers unless you are one
        if target_user.is_superuser and not requesting_user.is_superuser:
            raise Exception('Cannot modify superuser accounts')

        custom_role_id = kwargs.pop('custom_role_id', None)
        additional_permission_ids = kwargs.pop('additional_permission_ids', None)

        # Verify custom role exists if provided
        if custom_role_id:
            try:
                CustomRole.objects.get(id=custom_role_id)
            except CustomRole.DoesNotExist:
                raise Exception('Specified role does not exist')

        # Verify additional permissions - user can only grant permissions they have
        if additional_permission_ids is not None and not requesting_user.is_superuser:
            for perm_id in additional_permission_ids:
                try:
                    permission = Permission.objects.get(id=perm_id)
                    if not requesting_user.can_grant_permission(permission.name):
                        raise Exception(f'You cannot grant permission: {permission.display_name}')
                except Permission.DoesNotExist:
                    raise Exception('One or more permissions do not exist')

        # Update fields (but not password here)
        for field, value in kwargs.items():
            setattr(target_user, field, value)

        target_user.save()

        # Update custom role
        if custom_role_id is not None:
            target_user.custom_role_id = custom_role_id
            target_user.save()

        # Update additional permissions
        if additional_permission_ids is not None:
            permissions = Permission.objects.filter(id__in=additional_permission_ids)
            target_user.additional_permissions.set(permissions)

        return UpdateUser(user=target_user)


class SetUserPassword(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        password = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id, password):
        requesting_user = info.context.user if hasattr(info.context, 'user') else None

        # Must be authenticated
        if not requesting_user or not requesting_user.is_authenticated:
            raise Exception('Authentication required')

        # Check if user can manage users
        if not requesting_user.is_superuser and not requesting_user.has_permission('users.manage'):
            raise Exception('You do not have permission to manage user passwords')

        try:
            target_user = User.objects.get(id=id)
        except User.DoesNotExist:
            raise Exception('User not found')

        target_user.set_password(password)
        target_user.save()

        return SetUserPassword(success=True)


class DeleteUser(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        requesting_user = info.context.user if hasattr(info.context, 'user') else None

        # Must be authenticated
        if not requesting_user or not requesting_user.is_authenticated:
            raise Exception('Authentication required')

        # Check if user can delete users
        if not requesting_user.is_superuser and not requesting_user.has_permission('users.delete'):
            raise Exception('You do not have permission to delete users')

        try:
            target_user = User.objects.get(id=id)
        except User.DoesNotExist:
            raise Exception('User not found')

        # Prevent deleting superusers or yourself
        if target_user.is_superuser:
            raise Exception('Cannot delete superuser accounts')

        if target_user.id == requesting_user.id:
            raise Exception('Cannot delete your own account')

        target_user.delete()
        return DeleteUser(success=True)


# =============================================================================
# Mutation Schema
# =============================================================================

class Mutation(graphene.ObjectType):
    # Permission Mutations
    create_permission = CreatePermission.Field()
    update_permission = UpdatePermission.Field()
    delete_permission = DeletePermission.Field()

    # Custom Role Mutations
    create_custom_role = CreateCustomRole.Field()
    update_custom_role = UpdateCustomRole.Field()
    delete_custom_role = DeleteCustomRole.Field()

    # User Mutations
    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    set_user_password = SetUserPassword.Field()
    delete_user = DeleteUser.Field()


# =============================================================================
# Complete Schema
# =============================================================================

schema = graphene.Schema(query=Query, mutation=Mutation)
