from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserSerializer, RegisterSerializer, AuditLogSerializer
from .models import AuditLog, LoginHistory

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password or len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        from django.utils import timezone
        user.password_changed_at = timezone.now()
        user.save()
        return Response({'message': 'Password changed successfully.'})


class SecureLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '')
        try:
            user = User.objects.get(username=username)
            if user.is_locked():
                return Response(
                    {'error': 'Account is temporarily locked due to too many failed attempts. Try again later.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            pass

        response = super().post(request, *args, **kwargs)

        ip = request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')

        if response.status_code == 200:
            try:
                user = User.objects.get(username=username)
                user.reset_failed_login()
                user.last_login_ip = ip
                user.save()
                LoginHistory.objects.create(user=user, ip_address=ip, user_agent=ua, success=True)
                AuditLog.log(user=user, action='LOGIN', model_name='User',
                             object_id=user.id, ip_address=ip)
            except User.DoesNotExist:
                pass
        else:
            try:
                user = User.objects.get(username=username)
                user.record_failed_login()
                LoginHistory.objects.create(user=user, ip_address=ip, user_agent=ua, success=False)
            except User.DoesNotExist:
                pass

        return response


class LoginHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = LoginHistory.objects.filter(user=request.user)[:20]
        data = [
            {
                'id': h.id,
                'ip_address': h.ip_address,
                'user_agent': h.user_agent,
                'success': h.success,
                'timestamp': h.timestamp,
            }
            for h in history
        ]
        return Response(data)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all().order_by('username')
        return User.objects.filter(id=self.request.user.id)


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin' and request.user.id != pk:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can update user details.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = {'role', 'is_active'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if 'role' in data:
            valid_roles = ['admin', 'manager', 'supervisor', 'staff', 'viewer']
            if data['role'] not in valid_roles:
                return Response({'error': f'Invalid role. Choose from: {valid_roles}'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            AuditLog.log(
                user=request.user,
                action='UPDATE',
                model_name='User',
                object_id=user.id,
                description=f'Admin updated user {user.username}: {data}',
                ip_address=request.META.get('REMOTE_ADDR'),
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=self.request.user)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject='Password Reset Request',
                message=f'Click the link to reset your password: {reset_link}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        return Response({'message': 'If that email exists, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Reset link has expired or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('new_password', '')
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully.'})