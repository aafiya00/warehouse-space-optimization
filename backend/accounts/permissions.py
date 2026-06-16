from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager")
        )


class IsAdminManagerOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "supervisor")
        )


class CanApproveRequests(BasePermission):
    """Managers and supervisors can approve/reject stock requests."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "supervisor")
        )


class IsAdminManagerOrStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "supervisor", "staff")
        )


class IsAdminManagerOrStaffReadCreate(BasePermission):
    """
    Admin/manager/supervisor: full access.
    Staff: read and create only (no update/delete).
    Viewer: read only.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "manager", "supervisor"):
            return True
        if request.user.role == "staff":
            return request.method in SAFE_METHODS or request.method == "POST"
        if request.user.role == "viewer":
            return request.method in SAFE_METHODS
        return False


class IsAuthenticatedReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.method in SAFE_METHODS


class CanManageWarehouses(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "supervisor")
        )


class CanManageInventory(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "supervisor", "staff")
        )