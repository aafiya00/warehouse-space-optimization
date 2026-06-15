from rest_framework import viewsets
from django.db import transaction
from accounts.permissions import IsAdminOrManager, IsAdminManagerOrStaffReadCreate
from .models import Category, Product, InventoryItem, StockMovement
from .serializers import (
    CategorySerializer, ProductSerializer,
    InventoryItemSerializer, StockMovementSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrManager]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['category']
    search_fields = ['name', 'sku']


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['product', 'bin']


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-timestamp')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminManagerOrStaffReadCreate]
    filterset_fields = ['product', 'bin', 'movement_type']

    @transaction.atomic
    def perform_create(self, serializer):
        movement = serializer.save(performed_by=self.request.user)
        item, created = InventoryItem.objects.get_or_create(
            product=movement.product, bin=movement.bin, defaults={'quantity': 0}
        )
        if movement.movement_type == 'in':
            item.quantity += movement.quantity
        elif movement.movement_type == 'out':
            item.quantity -= movement.quantity
        elif movement.movement_type == 'adjustment':
            item.quantity = movement.quantity
        item.save()