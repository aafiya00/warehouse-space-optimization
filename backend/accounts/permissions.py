from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager')


class IsAdminManagerOrSupervisor(BasePermission):
    """Admin, Manager, or Supervisor can perform management actions."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager', 'supervisor')


class IsInventoryStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager', 'staff', 'supervisor')


class IsAdminManagerOrStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager', 'staff', 'supervisor')


class IsAdminManagerOrStaffReadCreate(BasePermission):
    """Admin/Manager/Supervisor full access. Staff can read and create only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ('admin', 'manager', 'supervisor'):
            return True
        if request.user.role == 'staff':
            return request.method in ('GET', 'POST', 'HEAD', 'OPTIONS')
        if request.user.role == 'auditor':
            return request.method in SAFE_METHODS
        return False


class CanApproveRequests(BasePermission):
    """Admin, Manager, and Supervisor can approve/reject requests."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ('admin', 'manager', 'supervisor', 'staff', 'approver', 'auditor')
        return request.user.role in ('admin', 'manager', 'supervisor', 'approver')


class IsAuditor(BasePermission):
    """Read-only access for auditors."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'auditor':
            return request.method in SAFE_METHODS
        return request.user.role in ('admin', 'manager', 'supervisor', 'staff', 'approver')


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'approver', 'manager', 'supervisor')


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