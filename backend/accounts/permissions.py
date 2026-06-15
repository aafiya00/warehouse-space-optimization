from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Full access - Admin only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrManager(BasePermission):
    """Admin and Manager access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager']


class IsAdminManagerOrStaff(BasePermission):
    """Admin, Manager, and Staff access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager', 'staff']


class IsAuthenticatedReadOnly(BasePermission):
    """All authenticated users can read; only admin/manager/staff can write"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.role in ['admin', 'manager', 'staff']


class CanManageWarehouses(BasePermission):
    """Admin full access, Manager can manage their warehouses, Staff/Viewer read only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.role in ['admin', 'manager']


class CanManageInventory(BasePermission):
    """Admin and Staff can manage inventory, Viewer read only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.role in ['admin', 'manager', 'staff']
class IsAdminManagerOrStaffReadCreate(BasePermission):
    """Admin and Manager full access, Staff can read and create, Viewer read only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        if request.method == 'POST':
            return request.user.role in ['admin', 'manager', 'staff']
        return request.user.role in ['admin', 'manager']