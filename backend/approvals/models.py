from django.db import models
from django.conf import settings


class ApprovalRequest(models.Model):
    REQUEST_TYPES = (
        ('purchase_order', 'Purchase Order'),
        ('inventory_adjustment', 'Inventory Adjustment'),
        ('stock_transfer', 'Stock Transfer'),
        ('bin_capacity_change', 'Bin Capacity Change'),
        ('general', 'General'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    request_type = models.CharField(max_length=30, choices=REQUEST_TYPES, default='general')
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='approval_requests_made'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approval_requests_reviewed'
    )

    # Links to related objects (optional — set whichever applies)
    purchase_order_id = models.IntegerField(null=True, blank=True)
    stock_movement_id = models.IntegerField(null=True, blank=True)
    reference_data = models.JSONField(default=dict, blank=True)

    reviewer_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['request_type']),
            models.Index(fields=['requested_by']),
        ]

    def __str__(self):
        return f"[{self.status.upper()}] {self.title} ({self.request_type})"

    def approve(self, reviewer, note=''):
        from django.utils import timezone
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewer_note = note
        self.reviewed_at = timezone.now()
        self.save()
        ApprovalAuditTrail.objects.create(
            approval_request=self,
            action='approved',
            performed_by=reviewer,
            note=note,
        )

    def reject(self, reviewer, note=''):
        from django.utils import timezone
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewer_note = note
        self.reviewed_at = timezone.now()
        self.save()
        ApprovalAuditTrail.objects.create(
            approval_request=self,
            action='rejected',
            performed_by=reviewer,
            note=note,
        )


class ApprovalAuditTrail(models.Model):
    ACTION_CHOICES = (
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('commented', 'Commented'),
    )

    approval_request = models.ForeignKey(
        ApprovalRequest, on_delete=models.CASCADE, related_name='audit_trail'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.approval_request.title} → {self.action} by {self.performed_by}"
