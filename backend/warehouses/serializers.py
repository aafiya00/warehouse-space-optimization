from rest_framework import serializers
from .models import Warehouse, Zone, Rack, Bin


class BinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bin
        fields = ['id', 'rack', 'code', 'capacity']


class RackSerializer(serializers.ModelSerializer):
    bins = BinSerializer(many=True, read_only=True)

    class Meta:
        model = Rack
        fields = ['id', 'zone', 'name', 'code', 'bins']


class ZoneSerializer(serializers.ModelSerializer):
    racks = RackSerializer(many=True, read_only=True)

    class Meta:
        model = Zone
        fields = ['id', 'warehouse', 'name', 'code', 'racks']


class WarehouseSerializer(serializers.ModelSerializer):
    zones = ZoneSerializer(many=True, read_only=True)

    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location', 'code', 'created_at', 'zones']