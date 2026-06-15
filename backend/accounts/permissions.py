from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    """
    Full access for admin and manager roles only.
    Staff and viewers get no access to these resources.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager']


class IsAdminManagerOrStaffReadCreate(permissions.BasePermission):
    """
    admin / manager : full CRUD
    staff           : can view (GET) and create (POST), but not update/delete
    viewer          : read-only (GET)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = request.user.role

        if role in ['admin', 'manager']:
            return True

        if role == 'staff':
            return request.method in permissions.SAFE_METHODS or request.method == 'POST'

        if role == 'viewer':
            return request.method in permissions.SAFE_METHODS

        return False