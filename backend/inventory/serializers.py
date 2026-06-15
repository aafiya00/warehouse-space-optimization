from rest_framework import serializers
from .models import Category, Product, InventoryItem, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'category_name', 'description',
                  'unit_price', 'reorder_level', 'created_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    bin_code = serializers.CharField(source='bin.code', read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'product', 'product_name', 'bin', 'bin_code', 'quantity', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'product_name', 'bin', 'movement_type', 'quantity',
                  'performed_by', 'performed_by_name', 'timestamp', 'note']
        read_only_fields = ['performed_by', 'timestamp']