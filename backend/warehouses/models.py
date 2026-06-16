from django.db import models
from django.db.models import Sum


class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def utilization_percent(self):
        from inventory.models import InventoryItem
        bins = Bin.objects.filter(rack__zone__warehouse=self)
        total = bins.aggregate(t=Sum('capacity'))['t'] or 0
        used = InventoryItem.objects.filter(
            bin__rack__zone__warehouse=self
        ).aggregate(u=Sum('quantity'))['u'] or 0
        return round((used / total * 100), 2) if total else 0


class Zone(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('warehouse', 'code')
        indexes = [
            models.Index(fields=['warehouse']),
        ]

    def __str__(self):
        return f"{self.warehouse.code} - {self.name}"


class Rack(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='racks')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('zone', 'code')
        indexes = [
            models.Index(fields=['zone']),
        ]

    def __str__(self):
        return f"{self.zone.name} - {self.name}"


class Bin(models.Model):
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name='bins')
    code = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(default=100)

    class Meta:
        unique_together = ('rack', 'code')
        indexes = [
            models.Index(fields=['rack']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.rack.name} - Bin {self.code}"

    @property
    def current_quantity(self):
        return self.inventory_items.aggregate(
            t=Sum('quantity'))['t'] or 0

    @property
    def available_space(self):
        return max(0, self.capacity - self.current_quantity)

    @property
    def utilization_percent(self):
        if self.capacity == 0:
            return 0
        return round((self.current_quantity / self.capacity) * 100, 2)
