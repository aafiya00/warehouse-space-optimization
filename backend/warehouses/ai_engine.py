from django.utils import timezone
from datetime import timedelta


def predict_reorder(product):
    """
    Predicts if a product needs reordering based on recent stock movement velocity.
    """
    from inventory.models import StockMovement

    thirty_days_ago = timezone.now() - timedelta(days=30)
    movements = StockMovement.objects.filter(
        product=product,
        movement_type='out',
        timestamp__gte=thirty_days_ago,
    )

    total_out = sum(m.quantity for m in movements)
    daily_rate = total_out / 30 if total_out > 0 else 0

    total_stock = sum(
        item.quantity for item in product.inventory_items.all()
    )

    days_remaining = (total_stock / daily_rate) if daily_rate > 0 else 999

    needs_reorder = (
        total_stock <= product.reorder_level or days_remaining <= 7
    )

    return {
        'product_id': product.id,
        'product_name': product.name,
        'sku': product.sku,
        'current_stock': total_stock,
        'reorder_level': product.reorder_level,
        'daily_consumption_rate': round(daily_rate, 2),
        'days_of_stock_remaining': round(days_remaining, 1) if days_remaining != 999 else 'N/A',
        'needs_reorder': needs_reorder,
        'urgency': (
            'critical' if days_remaining <= 3
            else 'high' if days_remaining <= 7
            else 'medium' if needs_reorder
            else 'ok'
        ),
    }


def get_smart_bin_recommendation(product, quantity, warehouse_id=None):
    """
    AI-enhanced bin recommendation that considers:
    - Product's existing bin locations (keep same product together)
    - Bin utilization balance
    - Zone proximity
    """
    from warehouses.models import Bin
    from inventory.models import InventoryItem

    existing_bins = InventoryItem.objects.filter(
        product=product, quantity__gt=0
    ).values_list('bin_id', flat=True)

    bins = Bin.objects.all().prefetch_related('inventory_items')
    if warehouse_id:
        bins = bins.filter(rack__zone__warehouse_id=warehouse_id)

    candidates = []
    for bin_obj in bins:
        used = sum(item.quantity for item in bin_obj.inventory_items.all())
        available = bin_obj.capacity - used
        if available < quantity:
            continue

        utilization = (used / bin_obj.capacity) * 100 if bin_obj.capacity > 0 else 100

        score = 0
        reasons = []

        if bin_obj.id in existing_bins:
            score += 40
            reasons.append('Product already stored here')

        if 40 <= utilization <= 80:
            score += 30
            reasons.append('Optimal utilization range')
        elif utilization < 40:
            score += 10
            reasons.append('Low utilization bin')
        else:
            score += 20
            reasons.append('High utilization bin')

        utilization_after = ((used + quantity) / bin_obj.capacity) * 100
        if utilization_after <= 90:
            score += 20
            reasons.append('Will stay under 90% after placement')

        candidates.append({
            'bin_id': bin_obj.id,
            'bin_code': bin_obj.code,
            'rack': bin_obj.rack.name,
            'zone': bin_obj.rack.zone.name,
            'warehouse': bin_obj.rack.zone.warehouse.name,
            'capacity': bin_obj.capacity,
            'available_space': available,
            'current_utilization_percent': round(utilization, 2),
            'utilization_after_placement_percent': round(utilization_after, 2),
            'ai_score': score,
            'reasons': reasons,
        })

    if not candidates:
        return None

    candidates.sort(key=lambda x: x['ai_score'], reverse=True)

    return {
        'recommended': candidates[0],
        'alternatives': candidates[1:3],
        'total_bins_checked': bins.count(),
        'eligible_bins': len(candidates),
        'ai_powered': True,
    }


def get_demand_forecast(product):
    """
    Simple moving average forecast for next 30 days demand.
    """
    from inventory.models import StockMovement

    forecast = []
    for week in range(1, 5):
        start = timezone.now() - timedelta(days=week * 7)
        end = timezone.now() - timedelta(days=(week - 1) * 7)
        week_out = StockMovement.objects.filter(
            product=product,
            movement_type='out',
            timestamp__gte=start,
            timestamp__lt=end,
        )
        total = sum(m.quantity for m in week_out)
        forecast.append(total)

    avg_weekly = sum(forecast) / len(forecast) if forecast else 0
    projected_monthly = avg_weekly * 4

    return {
        'product_id': product.id,
        'sku': product.sku,
        'weekly_demand_last_4_weeks': forecast,
        'average_weekly_demand': round(avg_weekly, 2),
        'projected_monthly_demand': round(projected_monthly, 2),
    }