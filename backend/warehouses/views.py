from rest_framework import viewsets, permissions
from .models import Warehouse, Zone, Rack, Bin
from .serializers import WarehouseSerializer, ZoneSerializer, RackSerializer, BinSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['code']
    search_fields = ['name', 'code', 'location']


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['warehouse']


class RackViewSet(viewsets.ModelViewSet):
    queryset = Rack.objects.all()
    serializer_class = RackSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['zone']


class BinViewSet(viewsets.ModelViewSet):
    queryset = Bin.objects.all()
    serializer_class = BinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['rack']