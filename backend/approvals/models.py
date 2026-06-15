
from django.db import models
from django.conf import settings
from inventory.models import Product
from warehouses.models import Bin


class ApprovalRequest(models.Model):
    REQUEST_TYPES = (
        ('stock_in', 'Stock In Request'),
        ('stock_out', 'Stock Out Request'),
        ('transfer', 'Transfer Request'),
        ('adjustment', 'Adjustment Request'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='approval_requests'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_requests'
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    bin = models.ForeignKey(Bin, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    note = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request_type} - {self.product.sku} - {self.status}"
