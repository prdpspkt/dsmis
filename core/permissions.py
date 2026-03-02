from functools import wraps
from graphene import GraphQLError


class PermissionDenied(GraphQLError):
    """Custom error for permission denied"""
    def __init__(self, message="You do not have permission to perform this action"):
        super().__init__(message, extensions={"code": "PERMISSION_DENIED"})


def check_permissions(permissions=None, require_all=False):
    """
    Decorator to check if user has required permissions
    Can be used with GraphQL resolvers

    Args:
        permissions: Single permission string or list of permissions
        require_all: If True, user must have ALL permissions.
                    If False, user must have AT LEAST ONE permission.

    Usage:
        @check_permissions('students.manage')
        def resolve_my_field(self, info):
            ...

        @check_permissions(['students.view', 'students.manage'], require_all=False)
        def resolve_my_field(self, info):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get info object (usually second argument for mutations/queries)
            info = None
            for arg in args:
                if hasattr(arg, 'context'):
                    info = arg
                    break

            if not info:
                return func(*args, **kwargs)

            # Get user from context
            user = getattr(info.context, 'user', None) if hasattr(info.context, 'user') else None

            # Allow superusers
            if user and user.is_superuser:
                return func(*args, **kwargs)

            # Check if user is authenticated
            if not user or not user.is_authenticated:
                raise PermissionDenied("Authentication required")

            # Check permissions
            if permissions:
                perm_list = [permissions] if isinstance(permissions, str) else permissions

                if require_all:
                    # User must have all permissions
                    if not all(user.has_permission(perm) for perm in perm_list):
                        missing = [p for p in perm_list if not user.has_permission(p)]
                        raise PermissionDenied(
                            f"Permission denied. Missing required permissions: {', '.join(missing)}"
                        )
                else:
                    # User must have at least one permission
                    if not any(user.has_permission(perm) for perm in perm_list):
                        raise PermissionDenied(
                            f"Permission denied. You need one of: {', '.join(perm_list)}"
                        )

            return func(*args, **kwargs)
        return wrapper
    return decorator


def check_superuser(func):
    """
    Decorator to check if user is superuser

    Usage:
        @check_superuser
        def resolve_sensitive_operation(self, info):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Get info object
        info = None
        for arg in args:
            if hasattr(arg, 'context'):
                info = arg
                break

        if not info:
            return func(*args, **kwargs)

        # Get user from context
        user = getattr(info.context, 'user', None) if hasattr(info.context, 'user') else None

        # Check if user is superuser
        if not user or not user.is_superuser:
            raise PermissionDenied("This action requires superuser privileges")

        return func(*args, **kwargs)
    return wrapper


def check_authenticated(func):
    """
    Decorator to check if user is authenticated

    Usage:
        @check_authenticated
        def resolve_my_field(self, info):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Get info object
        info = None
        for arg in args:
            if hasattr(arg, 'context'):
                info = arg
                break

        if not info:
            return func(*args, **kwargs)

        # Get user from context
        user = getattr(info.context, 'user', None) if hasattr(info.context, 'user') else None

        # Check if user is authenticated
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required")

        return func(*args, **kwargs)
    return wrapper


def can_user_grant(user, permission_name):
    """
    Check if user can grant a specific permission to others
    Users can only grant permissions they themselves have

    Args:
        user: User instance
        permission_name: Permission name to check

    Returns:
        bool: True if user can grant this permission
    """
    if not user:
        return False

    if user.is_superuser:
        return True

    return user.has_permission(permission_name)
