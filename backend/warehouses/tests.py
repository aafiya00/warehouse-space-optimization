from django.test import TestCase
from django.contrib.auth import get_user_model
from warehouses.models import Warehouse, Zone, Rack, Bin
from warehouses.optimization import find_best_bin, get_bin_utilization, get_available_space, get_warehouse_utilization_report
from inventory.models import Category, Product, InventoryItem

User = get_user_model()


def make_full_warehouse(code='WH1'):
    warehouse = Warehouse.objects.create(name=f'Warehouse {code}', location='Chennai', code=code)
    zone = Zone.objects.create(warehouse=warehouse, name='Zone A', code='ZA')
    rack = Rack.objects.create(zone=zone, name='Rack 1', code='R1')
    bin_ = Bin.objects.create(rack=rack, code='B1', capacity=100)
    return warehouse, zone, rack, bin_


class WarehouseModelTest(TestCase):

    def test_warehouse_created(self):
        wh = Warehouse.objects.create(name='Main Warehouse', location='Chennai', code='MW1')
        self.assertEqual(wh.code, 'MW1')

    def test_warehouse_str(self):
        wh = Warehouse.objects.create(name='Main Warehouse', location='Chennai', code='MW1')
        self.assertIn('MW1', str(wh))

    def test_zone_linked_to_warehouse(self):
        wh = Warehouse.objects.create(name='WH', location='Delhi', code='DL1')
        zone = Zone.objects.create(warehouse=wh, name='Zone A', code='ZA')
        self.assertEqual(zone.warehouse, wh)

    def test_bin_capacity_default(self):
        _, _, _, bin_ = make_full_warehouse('BIN1')
        self.assertEqual(bin_.capacity, 100)

    def test_duplicate_warehouse_code_raises_error(self):
        Warehouse.objects.create(name='WH1', location='Chennai', code='SAME')
        with self.assertRaises(Exception):
            Warehouse.objects.create(name='WH2', location='Mumbai', code='SAME')


class OptimizationTest(TestCase):

    def setUp(self):
        self.warehouse, self.zone, self.rack, self.bin = make_full_warehouse('OPT1')
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(name='Widget', sku='WID-001', category=self.category)

    def test_empty_bin_utilization_is_zero(self):
        self.assertEqual(get_bin_utilization(self.bin), 0.0)

    def test_available_space_equals_capacity_when_empty(self):
        self.assertEqual(get_available_space(self.bin), 100)

    def test_bin_utilization_after_stock(self):
        InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=50)
        self.assertEqual(get_bin_utilization(self.bin), 50.0)

    def test_available_space_after_stock(self):
        InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=30)
        self.assertEqual(get_available_space(self.bin), 70)

    def test_find_best_bin_returns_result(self):
        result = find_best_bin(50, warehouse_id=self.warehouse.id)
        self.assertIsNotNone(result)
        self.assertIn('recommended', result)

    def test_find_best_bin_returns_none_when_full(self):
        InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=100)
        result = find_best_bin(10, warehouse_id=self.warehouse.id)
        self.assertIsNone(result)

    def test_utilization_report_returns_list(self):
        report = get_warehouse_utilization_report(warehouse_id=self.warehouse.id)
        self.assertIsInstance(report, list)
        self.assertEqual(len(report), 1)

    def test_utilization_report_has_correct_zone(self):
        report = get_warehouse_utilization_report(warehouse_id=self.warehouse.id)
        self.assertEqual(report[0]['zone'], 'Zone A')