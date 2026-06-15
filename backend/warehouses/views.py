from rest_framework import viewsets
from accounts.permissions import IsAdminOrManager
from .models import Warehouse, Zone, Rack, Bin
from .serializers import WarehouseSerializer, ZoneSerializer, RackSerializer, BinSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['code']
    search_fields = ['name', 'code', 'location']


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['warehouse']


class RackViewSet(viewsets.ModelViewSet):
    queryset = Rack.objects.all()
    serializer_class = RackSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['zone']


class BinViewSet(viewsets.ModelViewSet):
    queryset = Bin.objects.all()
    serializer_class = BinSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['rack']
# ─── Space Optimization API ───────────────────────────────────────────────────

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from warehouses.optimization import find_best_bin, get_warehouse_utilization_report


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommend_bin(request):
    """
    GET /api/warehouses/recommend-bin/?quantity=50&warehouse_id=1
    Returns the best bin recommendation for a given quantity.
    """
    try:
        quantity = int(request.query_params.get('quantity', 0))
        warehouse_id = request.query_params.get('warehouse_id', None)
        zone_id = request.query_params.get('zone_id', None)

        if quantity <= 0:
            return Response(
                {'error': 'quantity must be a positive integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = find_best_bin(quantity, warehouse_id=warehouse_id, zone_id=zone_id)

        if result is None:
            return Response(
                {'message': 'No suitable bin found for the given quantity.', 'recommended': None},
                status=status.HTTP_200_OK
            )

        # Remove non-serializable bin object before returning
        result['recommended'] = {k: v for k, v in result['recommended'].items() if k != 'bin'}
        result['alternatives'] = [
            {k: v for k, v in a.items() if k != 'bin'} for a in result['alternatives']
        ]

        return Response(result, status=status.HTTP_200_OK)

    except ValueError:
        return Response(
            {'error': 'quantity must be a valid integer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def utilization_report(request):
    """
    GET /api/warehouses/utilization-report/?warehouse_id=1
    Returns space utilization report grouped by zone.
    """
    try:
        warehouse_id = request.query_params.get('warehouse_id', None)
        report = get_warehouse_utilization_report(warehouse_id=warehouse_id)
        return Response(
            {'report': report, 'total_zones': len(report)},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
from warehouses.ai_engine import get_smart_bin_recommendation, predict_reorder, get_demand_forecast
from inventory.models import Product


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_bin_recommendation(request):
    """
    GET /api/warehouses/ai-recommend/?product_id=1&quantity=50&warehouse_id=1
    AI-powered bin recommendation considering product history and utilization balance.
    """
    try:
        product_id = request.query_params.get('product_id')
        quantity = int(request.query_params.get('quantity', 0))
        warehouse_id = request.query_params.get('warehouse_id')

        if not product_id or quantity <= 0:
            return Response({'error': 'product_id and quantity are required.'}, status=400)

        product = Product.objects.get(id=product_id)
        result = get_smart_bin_recommendation(product, quantity, warehouse_id)

        if not result:
            return Response({'message': 'No suitable bin found.', 'recommended': None})

        return Response(result)

    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reorder_predictions(request):
    """
    GET /api/warehouses/reorder-predictions/
    Returns reorder predictions for all products.
    """
    try:
        products = Product.objects.prefetch_related('inventory_items', 'movements').all()
        predictions = [predict_reorder(p) for p in products]
        predictions.sort(key=lambda x: (
            0 if x['urgency'] == 'critical'
            else 1 if x['urgency'] == 'high'
            else 2 if x['urgency'] == 'medium'
            else 3
        ))
        return Response({
            'total_products': len(predictions),
            'needs_reorder': sum(1 for p in predictions if p['needs_reorder']),
            'predictions': predictions,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def demand_forecast(request):
    """
    GET /api/warehouses/demand-forecast/?product_id=1
    Returns demand forecast for a product.
    """
    try:
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=400)
        product = Product.objects.get(id=product_id)
        return Response(get_demand_forecast(product))
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)