from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Warehouse, Zone, Rack, Bin
from inventory.models import InventoryItem, Product
from services.warehouse_service import WarehouseService
from services.inventory_service import InventoryService


class DashboardKPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        kpis = WarehouseService.get_dashboard_kpis()
        low_stock_count = len(InventoryService.get_low_stock_products())
        overloaded_count = len(WarehouseService.get_overloaded_bins(threshold=90))
        movement_summary = InventoryService.get_movement_summary(days=30)
        return Response({
            **kpis,
            "low_stock_alerts": low_stock_count,
            "overloaded_bins": overloaded_count,
            "movement_summary": movement_summary,
        })


class WarehouseUtilizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(WarehouseService.get_all_warehouses_utilization())


class LowStockAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(InventoryService.get_low_stock_products())


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'total_warehouses': Warehouse.objects.count(),
            'total_zones': Zone.objects.count(),
            'total_racks': Rack.objects.count(),
            'total_bins': Bin.objects.count(),
            'total_products': Product.objects.count(),
            'total_stock_items': InventoryItem.objects.aggregate(
                total=Sum('quantity'))['total'] or 0,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overloaded_bins(request):
    threshold = int(request.query_params.get('threshold', 90))
    return Response(WarehouseService.get_overloaded_bins(threshold=threshold))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def underutilized_zones(request):
    threshold = int(request.query_params.get('threshold', 20))
    return Response(WarehouseService.get_underutilized_zones(threshold=threshold))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_valuation(request):
    return Response(InventoryService.get_stock_valuation())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overstock_products(request):
    return Response(InventoryService.get_overstock_products())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expiring_soon(request):
    days = int(request.query_params.get('days', 30))
    return Response(InventoryService.get_expiring_soon(days=days))
