from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

User = get_user_model()


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Session-based login view"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)

        # Get all permissions for the user
        if user.is_superuser:
            # Superusers get ALL permissions directly (more efficient)
            all_permissions = list(Permission.objects.values_list('name', flat=True))
        else:
            all_permissions = list(user.get_all_permissions())

        return Response({
            'success': True,
            'username': user.username,
            'role': user.role,
            'email': user.email,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'custom_role_name': user.get_custom_role_display(),
            'all_permissions': all_permissions
        })
    else:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
def logout_view(request):
    """Session-based logout view"""
    logout(request)
    return Response({'success': True})


@csrf_exempt
@api_view(['GET'])
def user_view(request):
    """Get current user info"""
    if request.user.is_authenticated:
        # Get all permissions for the user
        if request.user.is_superuser:
            # Superusers get ALL permissions directly (more efficient)
            all_permissions = list(Permission.objects.values_list('name', flat=True))
        else:
            all_permissions = list(request.user.get_all_permissions())

        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_superuser': request.user.is_superuser,
            'is_staff': request.user.is_staff,
            'custom_role_name': request.user.get_custom_role_display(),
            'all_permissions': all_permissions
        })
    return Response(
        {'error': 'Not authenticated'},
        status=status.HTTP_401_UNAUTHORIZED
    )
