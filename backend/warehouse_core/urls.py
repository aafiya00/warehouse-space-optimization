from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from warehouses import report_views as warehouse_report_views
from warehouses.dashboard_views import (
    DashboardKPIView,
    WarehouseUtilizationView,
    LowStockAlertView,
    overloaded_bins,
    underutilized_zones,
    stock_valuation,
    overstock_products,
    expiring_soon,
)

schema_view = get_schema_view(
    openapi.Info(
        title="Warehouse Space Optimization API",
        default_version='v1',
        description="Complete API for Warehouse Space Optimization System",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

v1_urlpatterns = [
    path('auth/', include('accounts.urls')),
    path('warehouses/', include('warehouses.urls')),
    path('inventory/', include('inventory.urls')),
    path('approvals/', include('approvals.urls')),
    path('notifications/', include('notifications.urls')),
    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('warehouses/utilization/', WarehouseUtilizationView.as_view(), name='wh-utilization'),
    path('warehouses/overloaded-bins/', overloaded_bins, name='overloaded-bins'),
    path('warehouses/underutilized-zones/', underutilized_zones, name='underutilized-zones'),
    path('inventory/low-stock/', LowStockAlertView.as_view(), name='low-stock'),
    path('inventory/overstock/', overstock_products, name='overstock'),
    path('inventory/valuation/', stock_valuation, name='stock-valuation'),
    path('inventory/expiring-soon/', expiring_soon, name='expiring-soon'),
    path('inventory/movement-trends/', warehouse_report_views.movement_trends, name='movement-trends'),
    path('reports/inventory/csv/', warehouse_report_views.export_inventory_csv, name='report-inv-csv'),
    path('reports/inventory/excel/', warehouse_report_views.export_inventory_excel, name='report-inv-excel'),
    path('reports/movements/csv/', warehouse_report_views.export_movements_csv, name='report-mov-csv'),
    path('reports/utilization/', warehouse_report_views.warehouse_utilization_report, name='report-util'),
    path('reports/movement-trends/', warehouse_report_views.movement_trends, name='report-trends'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(v1_urlpatterns)),
    path('api/auth/', include('accounts.urls')),
    path('api/warehouses/', include('warehouses.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]
