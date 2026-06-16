from warehouses.models import Warehouse, Zone, Rack, Bin
from inventory.models import InventoryItem
from django.db.models import Sum


class WarehouseService:

    @staticmethod
    def get_utilization(warehouse_id):
        bins = Bin.objects.filter(rack__zone__warehouse_id=warehouse_id)
        total_capacity = bins.aggregate(t=Sum('capacity'))['t'] or 0
        used = InventoryItem.objects.filter(
            bin__rack__zone__warehouse_id=warehouse_id
        ).aggregate(u=Sum('quantity'))['u'] or 0
        free = max(0, total_capacity - used)
        utilization = round((used / total_capacity * 100), 2) if total_capacity else 0
        return {
            "warehouse_id": warehouse_id,
            "total_capacity": total_capacity,
            "used_capacity": used,
            "free_capacity": free,
            "utilization_percent": utilization,
        }

    @staticmethod
    def get_all_warehouses_utilization():
        results = []
        for wh in Warehouse.objects.all():
            data = WarehouseService.get_utilization(wh.id)
            data["warehouse_name"] = wh.name
            data["warehouse_code"] = wh.code
            results.append(data)
        return results

    @staticmethod
    def get_overloaded_bins(threshold=90):
        overloaded = []
        for bin_obj in Bin.objects.prefetch_related('inventory_items').all():
            used = bin_obj.inventory_items.aggregate(u=Sum('quantity'))['u'] or 0
            if bin_obj.capacity > 0:
                pct = (used / bin_obj.capacity) * 100
                if pct >= threshold:
                    overloaded.append({
                        "bin_id": bin_obj.id,
                        "bin_code": bin_obj.code,
                        "rack": bin_obj.rack.code,
                        "used": used,
                        "capacity": bin_obj.capacity,
                        "utilization_percent": round(pct, 2),
                    })
        return overloaded

    @staticmethod
    def get_underutilized_zones(threshold=20):
        results = []
        for zone in Zone.objects.prefetch_related('racks__bins__inventory_items').all():
            total = 0
            used = 0
            for rack in zone.racks.all():
                for b in rack.bins.all():
                    total += b.capacity
                    used += b.inventory_items.aggregate(u=Sum('quantity'))['u'] or 0
            if total > 0:
                pct = (used / total) * 100
                if pct <= threshold:
                    results.append({
                        "zone_id": zone.id,
                        "zone_name": zone.name,
                        "warehouse": zone.warehouse.name,
                        "utilization_percent": round(pct, 2),
                    })
        return results

    @staticmethod
    def get_dashboard_kpis():
        bins = Bin.objects.all()
        total_capacity = bins.aggregate(t=Sum('capacity'))['t'] or 0
        used = InventoryItem.objects.aggregate(u=Sum('quantity'))['u'] or 0
        free = max(0, total_capacity - used)
        utilization = round((used / total_capacity * 100), 2) if total_capacity else 0
        return {
            "total_capacity": total_capacity,
            "used_capacity": used,
            "free_capacity": free,
            "utilization_percent": utilization,
            "total_warehouses": Warehouse.objects.count(),
            "total_zones": Zone.objects.count(),
            "total_bins": bins.count(),
        }
