from django.db import models


class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Zone(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('warehouse', 'code')

    def __str__(self):
        return f"{self.warehouse.code} - {self.name}"


class Rack(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='racks')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('zone', 'code')

    def __str__(self):
        return f"{self.zone.name} - {self.name}"


class Bin(models.Model):
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name='bins')
    code = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(default=100)

    class Meta:
        unique_together = ('rack', 'code')

    def __str__(self):
        return f"{self.rack.name} - Bin {self.code}"