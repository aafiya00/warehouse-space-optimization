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