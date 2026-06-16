from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum

from accounts.permissions import IsAdminOrManager, IsAdminManagerOrStaffReadCreate
from .models import Category, Product, InventoryItem, StockMovement, Supplier
from .serializers import (
    CategorySerializer, ProductSerializer,
    InventoryItemSerializer, StockMovementSerializer, SupplierSerializer
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrManager]
    search_fields = ['name', 'contact_email']
    filterset_fields = ['name']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrManager]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrManager]
    search_fields = ['name', 'sku']
    filterset_fields = ['category', 'supplier']


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.select_related('product', 'bin').all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['product', 'bin']


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'performed_by').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminManagerOrStaffReadCreate]
    filterset_fields = ['product', 'movement_type']

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_list(request):
    results = []
    for product in Product.objects.all():
        total_qty = InventoryItem.objects.filter(product=product).aggregate(
            total=Sum('quantity'))['total'] or 0
        if total_qty <= product.reorder_level:
            results.append({
                'sku': product.sku,
                'name': product.name,
                'quantity': total_qty,
                'reorder_level': product.reorder_level,
            })
    return Response(results)