from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('approval_approved', 'Request Approved'),
        ('approval_rejected', 'Request Rejected'),
        ('approval_pending', 'Approval Pending'),
        ('low_stock', 'Low Stock Alert'),
        ('bin_full', 'Bin Full Alert'),
        ('stock_in', 'Stock In'),
        ('stock_out', 'Stock Out'),
        ('purchase_order_approved', 'Purchase Order Approved'),
        ('inventory_mismatch', 'Inventory Mismatch'),
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
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]

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

    @classmethod
    def notify_roles(cls, notification_type, title, message, User, roles):
        users = User.objects.filter(role__in=roles)
        for user in users:
            cls.notify(user, notification_type, title, message)
