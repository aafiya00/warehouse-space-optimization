from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from accounts.models import AuditLog
from accounts.permissions import IsAdminOrManager
from inventory.models import InventoryItem, StockMovement
from notifications.models import Notification
from .models import ApprovalRequest
from .serializers import ApprovalRequestSerializer

User = get_user_model()


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'manager'):
            return ApprovalRequest.objects.all()
        return ApprovalRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        approval = serializer.save(requested_by=self.request.user)
        Notification.notify_admins(
            notification_type='general',
            title='New Approval Request',
            message=f"{self.request.user.username} requested {approval.request_type} for {approval.product.sku} x{approval.quantity}.",
            User=User,
        )

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAdminOrManager])
    @transaction.atomic
    def approve(self, request, pk=None):
        approval = self.get_object()
        if approval.status == 'approved':
            return Response({'message': 'Request approved and stock updated.'})
        if approval.status != 'pending':
            return Response({'error': 'Only pending requests can be approved.'}, status=400)

        item, _ = InventoryItem.objects.get_or_create(
            product=approval.product, bin=approval.bin, defaults={'quantity': 0}
        )
        if approval.request_type == 'stock_in':
            item.quantity += approval.quantity
        elif approval.request_type == 'stock_out':
            item.quantity = max(0, item.quantity - approval.quantity)
        elif approval.request_type == 'adjustment':
            item.quantity = approval.quantity
        item.save()

        StockMovement.objects.create(
            product=approval.product,
            bin=approval.bin,
            movement_type=approval.request_type.replace('stock_', ''),
            quantity=approval.quantity,
            performed_by=request.user,
            note=f"Approved request #{approval.id}",
        )

        approval.status = 'approved'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save()

        AuditLog.log(request.user, 'UPDATE', 'ApprovalRequest',
                     approval.id, f"Approved request #{approval.id}")

        Notification.notify(
            user=approval.requested_by,
            notification_type='approval_approved',
            title='Your Request Was Approved',
            message=f"Your {approval.request_type} request for {approval.product.sku} x{approval.quantity} has been approved.",
        )

        return Response({'message': 'Request approved and stock updated.'})

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAdminOrManager])
    def reject(self, request, pk=None):
        approval = self.get_object()
        if approval.status != 'pending':
            return Response({'error': 'Only pending requests can be rejected.'}, status=400)

        reason = request.data.get('reason', '')
        approval.status = 'rejected'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.rejection_reason = reason
        approval.save()

        AuditLog.log(request.user, 'UPDATE', 'ApprovalRequest',
                     approval.id, f"Rejected request #{approval.id}: {reason}")

        Notification.notify(
            user=approval.requested_by,
            notification_type='approval_rejected',
            title='Your Request Was Rejected',
            message=f"Your {approval.request_type} request for {approval.product.sku} x{approval.quantity} was rejected. Reason: {reason}",
        )

        return Response({'message': 'Request rejected.'})
