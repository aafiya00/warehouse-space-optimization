from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminManagerOrStaff, CanApproveRequests
from .models import ApprovalRequest, ApprovalAuditTrail
from .serializers import ApprovalRequestSerializer


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.select_related(
        'requested_by', 'reviewed_by'
    ).prefetch_related('audit_trail').all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminManagerOrStaff]
    filterset_fields = ['status', 'request_type']
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        instance = serializer.save(requested_by=self.request.user)
        ApprovalAuditTrail.objects.create(
            approval_request=instance,
            action='submitted',
            performed_by=self.request.user,
            note='Request submitted.',
        )

    @action(detail=True, methods=['post'], permission_classes=[CanApproveRequests])
    def approve(self, request, pk=None):
        obj = self.get_object()
        if obj.status != 'pending':
            return Response(
                {'error': f'Cannot approve a request with status: {obj.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        note = request.data.get('note', '')
        obj.approve(reviewer=request.user, note=note)

        # Notify requester
        try:
            from notifications.models import Notification
            Notification.notify(
                user=obj.requested_by,
                notification_type='approval_approved',
                title=f'Your request was approved: {obj.title}',
                message=note or 'Your approval request has been approved.',
            )
        except Exception:
            pass

        return Response({'status': 'approved', 'message': 'Request approved successfully.'})

    @action(detail=True, methods=['post'], permission_classes=[CanApproveRequests])
    def reject(self, request, pk=None):
        obj = self.get_object()
        if obj.status != 'pending':
            return Response(
                {'error': f'Cannot reject a request with status: {obj.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        note = request.data.get('note', '')
        obj.reject(reviewer=request.user, note=note)

        try:
            from notifications.models import Notification
            Notification.notify(
                user=obj.requested_by,
                notification_type='approval_rejected',
                title=f'Your request was rejected: {obj.title}',
                message=note or 'Your approval request has been rejected.',
            )
        except Exception:
            pass

        return Response({'status': 'rejected', 'message': 'Request rejected.'})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def audit_trail(self, request, pk=None):
        obj = self.get_object()
        trail = obj.audit_trail.all().values(
            'action', 'performed_by__username', 'note', 'timestamp'
        )
        return Response(list(trail))
