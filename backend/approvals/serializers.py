from rest_framework import serializers
from .models import ApprovalRequest, ApprovalAuditTrail


class ApprovalAuditTrailSerializer(serializers.ModelSerializer):
    performed_by = serializers.StringRelatedField()

    class Meta:
        model = ApprovalAuditTrail
        fields = ['action', 'performed_by', 'note', 'timestamp']


class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by = serializers.StringRelatedField(read_only=True)
    reviewed_by = serializers.StringRelatedField(read_only=True)
    audit_trail = ApprovalAuditTrailSerializer(many=True, read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'request_type', 'title', 'description', 'status',
            'requested_by', 'reviewed_by', 'reviewer_note',
            'purchase_order_id', 'stock_movement_id', 'reference_data',
            'created_at', 'reviewed_at', 'audit_trail',
        ]
        read_only_fields = [
            'status', 'reviewed_by', 'reviewer_note', 'reviewed_at', 'audit_trail'
        ]
