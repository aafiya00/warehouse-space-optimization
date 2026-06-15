from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, ZoneViewSet, RackViewSet, BinViewSet,
    recommend_bin, utilization_report,
    ai_bin_recommendation, reorder_predictions, demand_forecast,
)
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
    path('recommend-bin/', recommend_bin, name='recommend-bin'),
    path('utilization-report/', utilization_report, name='utilization-report'),
    path('ai-recommend/', ai_bin_recommendation, name='ai-bin-recommendation'),
    path('reorder-predictions/', reorder_predictions, name='reorder-predictions'),
    path('demand-forecast/', demand_forecast, name='demand-forecast'),
]