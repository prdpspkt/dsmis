from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from core import views as core_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True))),
    path('api/auth/login/', core_views.login_view, name='login'),
    path('api/auth/logout/', core_views.logout_view, name='logout'),
    path('api/auth/user/', core_views.user_view, name='user'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
