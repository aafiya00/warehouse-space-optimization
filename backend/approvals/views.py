from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ApprovalRequest
from .serializers import ApprovalRequestSerializer
from accounts.permissions import IsAdminManagerOrStaff, CanApproveRequests


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminManagerOrStaff]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "manager", "supervisor"):
            return ApprovalRequest.objects.all().order_by("-created_at")
        return ApprovalRequest.objects.filter(requested_by=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanApproveRequests])
    def approve(self, request, pk=None):
        obj = self.get_object()
        if obj.status != "pending":
            return Response({"detail": "Only pending requests can be approved."},
                            status=status.HTTP_400_BAD_REQUEST)
        obj.status = "approved"
        obj.reviewed_by = request.user
        obj.save()
        return Response({"detail": "Request approved."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanApproveRequests])
    def reject(self, request, pk=None):
        obj = self.get_object()
        if obj.status != "pending":
            return Response({"detail": "Only pending requests can be rejected."},
                            status=status.HTTP_400_BAD_REQUEST)
        obj.status = "rejected"
        obj.reviewed_by = request.user
        obj.save()
        return Response({"detail": "Request rejected."})