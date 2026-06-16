from warehouses import report_views as warehouse_report_views
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Warehouse Space Optimization API",
        default_version='v1',
        description="API documentation for Warehouse Space Optimization System",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/warehouses/', include('warehouses.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('api/notifications/', include('notifications.urls')),

    # Reports (export)
    path('api/v1/reports/inventory/csv/', warehouse_report_views.export_inventory_csv),
    path('api/v1/reports/inventory/excel/', warehouse_report_views.export_inventory_excel),
    path('api/v1/reports/movements/csv/', warehouse_report_views.export_movements_csv),
    path('api/v1/reports/utilization/', warehouse_report_views.warehouse_utilization_report),
    path('api/v1/reports/movement-trends/', warehouse_report_views.movement_trends),

    # Analytics Dashboard endpoints (what AnalyticsDashboard.tsx calls)
    path('api/v1/warehouses/utilization/', warehouse_report_views.warehouse_utilization_report),
    path('api/v1/inventory/movement-trends/', warehouse_report_views.movement_trends),
    path('api/v1/inventory/low-stock/', warehouse_report_views.low_stock_analytics),

    # API Docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]