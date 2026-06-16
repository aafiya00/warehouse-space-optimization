from inventory.models import InventoryItem, Product, StockMovement
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta


class InventoryService:

    @staticmethod
    def get_low_stock_products():
        results = []
        for product in Product.objects.all():
            total_qty = InventoryItem.objects.filter(
                product=product, status='available'
            ).aggregate(t=Sum('quantity'))['t'] or 0
            if total_qty <= product.reorder_level:
                results.append({
                    "product_id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "current_qty": total_qty,
                    "reorder_level": product.reorder_level,
                    "supplier": product.supplier.name if product.supplier else None,
                })
        return results

    @staticmethod
    def get_overstock_products(multiplier=3):
        results = []
        for product in Product.objects.all():
            total_qty = InventoryItem.objects.filter(
                product=product
            ).aggregate(t=Sum('quantity'))['t'] or 0
            threshold = product.reorder_level * multiplier
            if total_qty > threshold:
                results.append({
                    "product_id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "current_qty": total_qty,
                    "overstock_threshold": threshold,
                })
        return results

    @staticmethod
    def get_expiring_soon(days=30):
        cutoff = timezone.now().date() + timedelta(days=days)
        items = InventoryItem.objects.filter(
            expiry_date__isnull=False,
            expiry_date__lte=cutoff,
            status='available'
        ).select_related('product', 'bin')
        return [
            {
                "item_id": i.id,
                "sku": i.product.sku,
                "product": i.product.name,
                "bin": i.bin.code,
                "quantity": i.quantity,
                "expiry_date": str(i.expiry_date),
            }
            for i in items
        ]

    @staticmethod
    def get_stock_valuation():
        results = []
        for product in Product.objects.all():
            total_qty = InventoryItem.objects.filter(
                product=product
            ).aggregate(t=Sum('quantity'))['t'] or 0
            value = total_qty * float(product.unit_price)
            results.append({
                "sku": product.sku,
                "name": product.name,
                "quantity": total_qty,
                "unit_price": float(product.unit_price),
                "total_value": round(value, 2),
            })
        total = sum(r["total_value"] for r in results)
        return {"items": results, "grand_total": round(total, 2)}

    @staticmethod
    def get_movement_summary(days=30):
        since = timezone.now() - timedelta(days=days)
        movements = StockMovement.objects.filter(timestamp__gte=since)
        stock_in = movements.filter(movement_type__in=['in', 'receiving']).aggregate(
            t=Sum('quantity'))['t'] or 0
        stock_out = movements.filter(movement_type__in=['out', 'retrieval']).aggregate(
            t=Sum('quantity'))['t'] or 0
        return {
            "period_days": days,
            "total_in": stock_in,
            "total_out": stock_out,
            "net": stock_in - stock_out,
        }
