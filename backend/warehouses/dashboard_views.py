from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from .models import Warehouse, Zone, Rack, Bin
from inventory.models import InventoryItem, Product


class WarehouseUtilizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = []
        for wh in Warehouse.objects.all():
            bins = Bin.objects.filter(rack__zone__warehouse=wh)
            total_capacity = bins.aggregate(total=Sum('capacity'))['total'] or 0
            used = InventoryItem.objects.filter(bin__rack__zone__warehouse=wh).aggregate(
                total=Sum('quantity'))['total'] or 0
            utilization = round((used / total_capacity) * 100, 2) if total_capacity else 0
            data.append({
                'warehouse': wh.name,
                'code': wh.code,
                'total_capacity': total_capacity,
                'used_capacity': used,
                'utilization_percent': utilization,
            })
        return Response(data)


class LowStockAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        alerts = []
        for product in Product.objects.all():
            total_qty = InventoryItem.objects.filter(product=product).aggregate(
                total=Sum('quantity'))['total'] or 0
            if total_qty <= product.reorder_level:
                alerts.append({
                    'product': product.name,
                    'sku': product.sku,
                    'current_stock': total_qty,
                    'reorder_level': product.reorder_level,
                })
        return Response(alerts)


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'total_warehouses': Warehouse.objects.count(),
            'total_zones': Zone.objects.count(),
            'total_racks': Rack.objects.count(),
            'total_bins': Bin.objects.count(),
            'total_products': Product.objects.count(),
            'total_stock_items': InventoryItem.objects.aggregate(total=Sum('quantity'))['total'] or 0,
        })