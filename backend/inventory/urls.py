from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, InventoryItemViewSet, StockMovementViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('products', ProductViewSet)
router.register('items', InventoryItemViewSet)
router.register('movements', StockMovementViewSet)

urlpatterns = router.urls
