from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import WarehouseViewSet, ZoneViewSet, RackViewSet, BinViewSet, recommend_bin, utilization_report
from .dashboard_views import WarehouseUtilizationView, LowStockAlertView, DashboardSummaryView

sub_router = SimpleRouter()
sub_router.register('zones', ZoneViewSet, basename='zone')
sub_router.register('racks', RackViewSet, basename='rack')
sub_router.register('bins', BinViewSet, basename='bin')

warehouse_router = SimpleRouter()
warehouse_router.register('', WarehouseViewSet, basename='warehouse')

urlpatterns = (
    sub_router.urls
    + warehouse_router.urls
    + [
        path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
        path('dashboard/utilization/', WarehouseUtilizationView.as_view(), name='dashboard-utilization'),
        path('dashboard/low-stock/', LowStockAlertView.as_view(), name='dashboard-low-stock'),
        path('recommend-bin/', recommend_bin, name='recommend-bin'),
        path('utilization-report/', utilization_report, name='utilization-report'),
    ]
)
