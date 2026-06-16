from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Warehouse Manager'),
        ('staff', 'Inventory Staff'),
        ('auditor', 'Auditor'),
        ('approver', 'Approver'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(max_length=15, blank=True, null=True)

    # Account lockout
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)

    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)

    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)

    # Refresh token tracking
    refresh_token_hash = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
        ]

    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def record_failed_login(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save()

    def reset_failed_login(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save()

    def is_read_only(self):
        return self.role == 'auditor'

    def can_approve(self):
        return self.role in ('admin', 'approver')

    def __str__(self):
        return f"{self.username} ({self.role})"


class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
        ]

    def __str__(self):
        status = "OK" if self.success else "FAIL"
        return f"[{status}] {self.user.username} @ {self.timestamp}"


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('STOCK_IN', 'Stock In'),
        ('STOCK_OUT', 'Stock Out'),
        ('TRANSFER', 'Transfer'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
    )

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model_name']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.user} - {self.action} - {self.model_name}"

    @classmethod
    def log(cls, user, action, model_name, object_id=None, description='', ip_address=None):
        cls.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else None,
            description=description,
            ip_address=ip_address,
        )
