# warehouses/optimization.py

from warehouses.models import Bin


def get_bin_utilization(bin_obj):
    """Returns how full a bin is as a percentage."""
    total_qty = sum(item.quantity for item in bin_obj.inventory_items.all())
    if bin_obj.capacity == 0:
        return 100.0
    return (total_qty / bin_obj.capacity) * 100


def get_available_space(bin_obj):
    """Returns remaining capacity in a bin."""
    used = sum(item.quantity for item in bin_obj.inventory_items.all())
    return max(0, bin_obj.capacity - used)


def find_best_bin(required_quantity, warehouse_id=None, zone_id=None):
    """
    Finds the best bin to place a given quantity of product.
    Strategy: Best Fit — pick the bin with least remaining space
    that still fits the product (minimizes wasted space).
    """
    bins = Bin.objects.all().prefetch_related('inventory_items')

    if zone_id:
        bins = bins.filter(rack__zone_id=zone_id)
    elif warehouse_id:
        bins = bins.filter(rack__zone__warehouse_id=warehouse_id)

    candidates = []
    for bin_obj in bins:
        available = get_available_space(bin_obj)
        if available >= required_quantity:
            utilization_after = (
                (bin_obj.capacity - available + required_quantity) / bin_obj.capacity
            ) * 100
            candidates.append({
                'bin': bin_obj,
                'available_space': available,
                'utilization_after_placement': round(utilization_after, 2),
                'current_utilization': round(get_bin_utilization(bin_obj), 2),
                'bin_id': bin_obj.id,
                'bin_code': bin_obj.code,
                'rack': bin_obj.rack.name,
                'zone': bin_obj.rack.zone.name,
                'warehouse': bin_obj.rack.zone.warehouse.name,
                'capacity': bin_obj.capacity,
            })

    if not candidates:
        return None

    # Best Fit: sort by least leftover space after placement
    candidates.sort(key=lambda x: x['available_space'] - required_quantity)

    best = candidates[0]
    alternatives = candidates[1:4]

    return {
        'recommended': best,
        'alternatives': alternatives,
        'total_bins_checked': len(list(bins)),
        'eligible_bins': len(candidates),
    }


def get_warehouse_utilization_report(warehouse_id=None):
    """
    Returns utilization stats for all bins, grouped by zone.
    """
    bins = Bin.objects.all().prefetch_related('inventory_items', 'rack__zone__warehouse')

    if warehouse_id:
        bins = bins.filter(rack__zone__warehouse_id=warehouse_id)

    report = {}
    for bin_obj in bins:
        zone_name = bin_obj.rack.zone.name
        warehouse_name = bin_obj.rack.zone.warehouse.name
        key = f"{warehouse_name} > {zone_name}"

        if key not in report:
            report[key] = {
                'warehouse': warehouse_name,
                'zone': zone_name,
                'total_capacity': 0,
                'total_used': 0,
                'bin_count': 0,
            }

        used = bin_obj.capacity - get_available_space(bin_obj)
        report[key]['total_capacity'] += bin_obj.capacity
        report[key]['total_used'] += used
        report[key]['bin_count'] += 1

    result = []
    for key, data in report.items():
        data['utilization_percent'] = (
            round((data['total_used'] / data['total_capacity']) * 100, 2)
            if data['total_capacity'] > 0 else 0
        )
        result.append(data)

    return result