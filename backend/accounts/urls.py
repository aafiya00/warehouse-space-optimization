from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MeView, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView,
    SecureLoginView, LoginHistoryView,
    UserListView, AuditLogListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', SecureLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    path('login-history/', LoginHistoryView.as_view(), name='login-history'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
]