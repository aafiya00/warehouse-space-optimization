from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CategoryViewSet, ProductViewSet,
    InventoryItemViewSet, StockMovementViewSet,
    SupplierViewSet, low_stock_list
)

router = DefaultRouter()
router.register('suppliers', SupplierViewSet)
router.register('categories', CategoryViewSet)
router.register('products', ProductViewSet)
router.register('items', InventoryItemViewSet)
router.register('movements', StockMovementViewSet)

urlpatterns = router.urls + [
    path('low-stock/', low_stock_list, name='low-stock'),
]