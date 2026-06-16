from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager')


class IsInventoryStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager', 'staff')


class IsAdminManagerOrStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager', 'staff')


class IsAdminManagerOrStaffReadCreate(BasePermission):
    """Admin/Manager full access. Staff can read and create only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ('admin', 'manager'):
            return True
        if request.user.role == 'staff':
            return request.method in ('GET', 'POST', 'HEAD', 'OPTIONS')
        if request.user.role == 'auditor':
            return request.method in SAFE_METHODS
        return False


class CanApproveRequests(BasePermission):
    """Only admin and approver roles can approve/reject."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ('admin', 'manager', 'staff', 'approver', 'auditor')
        return request.user.role in ('admin', 'approver')


class IsAuditor(BasePermission):
    """Read-only access for auditors."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'auditor':
            return request.method in SAFE_METHODS
        return request.user.role in ('admin', 'manager', 'staff', 'approver')


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'approver')


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'admin'


class RoleBasedPermission(BasePermission):
    """Views set required_roles = ['admin', 'manager'] etc."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        required_roles = getattr(view, 'required_roles', [])
        if not required_roles:
            return True
        return request.user.role in required_roles
