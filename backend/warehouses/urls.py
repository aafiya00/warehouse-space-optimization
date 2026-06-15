from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, ZoneViewSet, RackViewSet, BinViewSet
from .dashboard_views import WarehouseUtilizationView, LowStockAlertView, DashboardSummaryView

router = DefaultRouter()
router.register('warehouses', WarehouseViewSet)
router.register('zones', ZoneViewSet)
router.register('racks', RackViewSet)
router.register('bins', BinViewSet)

urlpatterns = router.urls + [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/utilization/', WarehouseUtilizationView.as_view(), name='dashboard-utilization'),
    path('dashboard/low-stock/', LowStockAlertView.as_view(), name='dashboard-low-stock'),
]