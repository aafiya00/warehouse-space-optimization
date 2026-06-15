from django.test import TestCase
from django.contrib.auth import get_user_model
from warehouses.models import Warehouse, Zone, Rack, Bin
from inventory.models import Category, Product, InventoryItem, StockMovement

User = get_user_model()


def make_bin(warehouse_name='WH-1', warehouse_code='WH1'):
    warehouse = Warehouse.objects.create(name=warehouse_name, location='Chennai', code=warehouse_code)
    zone = Zone.objects.create(warehouse=warehouse, name='Zone A', code='ZA')
    rack = Rack.objects.create(zone=zone, name='Rack 1', code='R1')
    bin_ = Bin.objects.create(rack=rack, code='B1', capacity=100)
    return bin_


class CategoryModelTest(TestCase):

    def test_category_created_successfully(self):
        cat = Category.objects.create(name='Electronics')
        self.assertEqual(cat.name, 'Electronics')

    def test_category_str(self):
        cat = Category.objects.create(name='Electronics')
        self.assertEqual(str(cat), 'Electronics')

    def test_duplicate_category_raises_error(self):
        Category.objects.create(name='Electronics')
        with self.assertRaises(Exception):
            Category.objects.create(name='Electronics')


class ProductModelTest(TestCase):

    def setUp(self):
        self.category = Category.objects.create(name='Tools')

    def test_product_created_successfully(self):
        product = Product.objects.create(
            name='Hammer',
            sku='TOOL-001',
            category=self.category,
            unit_price=9.99,
            reorder_level=5,
        )
        self.assertEqual(product.sku, 'TOOL-001')
        self.assertEqual(product.reorder_level, 5)

    def test_product_str_contains_sku(self):
        product = Product.objects.create(name='Hammer', sku='TOOL-001', category=self.category)
        self.assertIn('TOOL-001', str(product))

    def test_duplicate_sku_raises_error(self):
        Product.objects.create(name='Hammer', sku='TOOL-001', category=self.category)
        with self.assertRaises(Exception):
            Product.objects.create(name='Hammer2', sku='TOOL-001', category=self.category)

    def test_product_default_reorder_level(self):
        product = Product.objects.create(name='Drill', sku='TOOL-002', category=self.category)
        self.assertEqual(product.reorder_level, 10)


class InventoryItemModelTest(TestCase):

    def setUp(self):
        self.category = Category.objects.create(name='Parts')
        self.product = Product.objects.create(name='Bolt', sku='PART-001', category=self.category)
        self.bin = make_bin('WH-1', 'WH1')

    def test_inventory_item_created_successfully(self):
        item = InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=20)
        self.assertEqual(item.quantity, 20)
        self.assertEqual(item.product, self.product)

    def test_inventory_item_str(self):
        item = InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=20)
        self.assertIn('PART-001', str(item))

    def test_duplicate_product_bin_raises_error(self):
        InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=10)
        with self.assertRaises(Exception):
            InventoryItem.objects.create(product=self.product, bin=self.bin, quantity=5)


class StockMovementModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='mover', password='Pass123!')
        self.category = Category.objects.create(name='Raw')
        self.product = Product.objects.create(name='Steel', sku='RAW-001', category=self.category)
        self.bin = make_bin('WH-2', 'WH2')

    def test_stock_in_movement(self):
        movement = StockMovement.objects.create(
            product=self.product, bin=self.bin,
            movement_type='in', quantity=50, performed_by=self.user,
        )
        self.assertEqual(movement.movement_type, 'in')
        self.assertEqual(movement.quantity, 50)

    def test_stock_out_movement(self):
        movement = StockMovement.objects.create(
            product=self.product, bin=self.bin,
            movement_type='out', quantity=10, performed_by=self.user,
        )
        self.assertEqual(movement.movement_type, 'out')

    def test_stock_movement_str(self):
        movement = StockMovement.objects.create(
            product=self.product, bin=self.bin,
            movement_type='in', quantity=30, performed_by=self.user,
        )
        self.assertIn('RAW-001', str(movement))

    def test_adjustment_movement(self):
        movement = StockMovement.objects.create(
            product=self.product, bin=self.bin,
            movement_type='adjustment', quantity=-5,
            performed_by=self.user, note='Damaged goods',
        )
        self.assertEqual(movement.note, 'Damaged goods')
        self.assertEqual(movement.quantity, -5)