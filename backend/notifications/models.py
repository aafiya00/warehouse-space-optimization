from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('approval_approved', 'Request Approved'),
        ('approval_rejected', 'Request Rejected'),
        ('low_stock', 'Low Stock Alert'),
        ('stock_in', 'Stock In'),
        ('stock_out', 'Stock Out'),
        ('general', 'General'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title} - {'Read' if self.is_read else 'Unread'}"

    @classmethod
    def notify(cls, user, notification_type, title, message):
        return cls.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
        )

    @classmethod
    def notify_admins(cls, notification_type, title, message, User):
        admins = User.objects.filter(role__in=['admin', 'manager'])
        for admin in admins:
            cls.notify(admin, notification_type, title, message)