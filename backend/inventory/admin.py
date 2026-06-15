from django.contrib import admin
from .models import Category, Product, InventoryItem, StockMovement

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(InventoryItem)
admin.site.register(StockMovement)