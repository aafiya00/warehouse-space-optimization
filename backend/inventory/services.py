"""
Service layer for Inventory business logic.
Keeps views thin and business rules centralised.
"""
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import InventoryItem, StockMovement, Product, PurchaseOrder
from accounts.models import AuditLog


class InventoryService:

    @staticmethod
    @transaction.atomic
    def receive_stock(product, bin_obj, quantity, performed_by, reference=None, batch=None, expiry=None):
        """Full product-receiving workflow."""
        if quantity <= 0:
            raise ValueError("Quantity must be positive.")

        used = sum(i.quantity for i in bin_obj.inventory_items.all())
        if used + quantity > bin_obj.capacity:
            raise ValueError(f"Bin capacity exceeded. Available: {bin_obj.capacity - used}")

        item, _ = InventoryItem.objects.get_or_create(
            product=product, bin=bin_obj,
            defaults={'quantity': 0}
        )
        item.quantity += quantity
        if batch:
            item.batch_number = batch
        if expiry:
            item.expiry_date = expiry
        item.last_counted_date = timezone.now()
        item.save()

        movement = StockMovement.objects.create(
            product=product,
            bin=bin_obj,
            movement_type='receiving',
            quantity=quantity,
            performed_by=performed_by,
            reference_number=reference,
        )

        AuditLog.log(
            user=performed_by,
            action='STOCK_IN',
            model_name='InventoryItem',
            object_id=item.id,
            description=f"Received {quantity} units of {product.sku} into bin {bin_obj.code}",
        )
        return movement

    @staticmethod
    @transaction.atomic
    def allocate_stock(product, bin_obj, quantity, performed_by, reference=None):
        """Reserve stock for an order without removing it yet."""
        try:
            item = InventoryItem.objects.get(product=product, bin=bin_obj)
        except InventoryItem.DoesNotExist:
            raise ValueError("No inventory found for this product/bin combination.")

        if item.available_quantity < quantity:
            raise ValueError(f"Insufficient available stock. Available: {item.available_quantity}")

        item.reserved_quantity += quantity
        item.save()

        AuditLog.log(
            user=performed_by,
            action='UPDATE',
            model_name='InventoryItem',
            object_id=item.id,
            description=f"Allocated {quantity} units of {product.sku} from bin {bin_obj.code}",
        )
        return item

    @staticmethod
    @transaction.atomic
    def retrieve_stock(product, bin_obj, quantity, performed_by, reference=None):
        """Actually remove allocated or available stock from a bin."""
        try:
            item = InventoryItem.objects.get(product=product, bin=bin_obj)
        except InventoryItem.DoesNotExist:
            raise ValueError("No inventory found for this product/bin combination.")

        if item.quantity < quantity:
            raise ValueError(f"Insufficient stock. Current: {item.quantity}")

        item.quantity -= quantity
        item.reserved_quantity = max(0, item.reserved_quantity - quantity)
        item.save()

        movement = StockMovement.objects.create(
            product=product,
            bin=bin_obj,
            movement_type='retrieval',
            quantity=quantity,
            performed_by=performed_by,
            reference_number=reference,
        )

        AuditLog.log(
            user=performed_by,
            action='STOCK_OUT',
            model_name='InventoryItem',
            object_id=item.id,
            description=f"Retrieved {quantity} units of {product.sku} from bin {bin_obj.code}",
        )
        return movement

    @staticmethod
    @transaction.atomic
    def transfer_stock(product, from_bin, to_bin, quantity, performed_by):
        """Transfer stock between bins with full audit trail."""
        InventoryService.retrieve_stock(product, from_bin, quantity, performed_by,
                                        reference=f"TRANSFER-TO-{to_bin.code}")
        InventoryService.receive_stock(product, to_bin, quantity, performed_by,
                                       reference=f"TRANSFER-FROM-{from_bin.code}")

    @staticmethod
    def get_low_stock_products():
        """Return products at or below reorder level."""
        from django.db.models import Sum
        products = Product.objects.annotate(
            total_stock=Sum('inventory_items__quantity')
        ).filter(total_stock__lte=F('reorder_level'))
        return products

    @staticmethod
    def get_expiring_soon(days=30):
        """Return inventory items expiring within N days."""
        from django.utils.timezone import now
        from datetime import timedelta
        cutoff = now().date() + timedelta(days=days)
        return InventoryItem.objects.filter(
            expiry_date__isnull=False,
            expiry_date__lte=cutoff,
        ).select_related('product', 'bin')