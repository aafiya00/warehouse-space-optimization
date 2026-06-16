from django.db import models
from django.conf import settings
from django.utils import timezone
from warehouses.models import Bin


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name


class ProductManager(models.Manager):
    def active(self):
        return self.filter(is_deleted=False)

    def deleted(self):
        return self.filter(is_deleted=True)


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    description = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    batch_tracking = models.BooleanField(default=False)
    expiry_tracking = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = ProductManager()

    class Meta:
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['name']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class InventoryItem(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('damaged', 'Damaged'),
        ('expired', 'Expired'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_items')
    bin = models.ForeignKey(Bin, on_delete=models.CASCADE, related_name='inventory_items')
    quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_counted_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'bin')
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['bin']),
            models.Index(fields=['status']),
            models.Index(fields=['expiry_date']),
        ]

    @property
    def available_quantity(self):
        return max(0, self.quantity - self.reserved_quantity)

    def __str__(self):
        return f"{self.product.sku} @ {self.bin} - Qty: {self.quantity}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    )

    order_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='purchase_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    expected_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"PO-{self.order_number} ({self.status})"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.sku} x{self.quantity_ordered}"


class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
        ('receiving', 'Product Receiving'),
        ('allocation', 'Product Allocation'),
        ('retrieval', 'Product Retrieval'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    bin = models.ForeignKey(Bin, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.product.sku} - {self.quantity}"
