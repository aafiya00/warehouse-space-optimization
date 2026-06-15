"""
Integration Tests - Warehouse Space Optimization System
Flow: Login -> Create Warehouse -> Create Zone -> Create Rack -> Create Bin
      -> Create Category -> Create Product -> Move Stock -> Approve Request
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from warehouses.models import Warehouse, Zone, Rack, Bin
from inventory.models import Category, Product, InventoryItem, StockMovement
from approvals.models import ApprovalRequest


class FullWorkflowIntegrationTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin_test", password="Admin@1234",
            email="admin@test.com", role="admin",
        )
        self.manager = User.objects.create_user(
            username="manager_test", password="Manager@1234",
            email="manager@test.com", role="manager",
        )
        self.staff = User.objects.create_user(
            username="staff_test", password="Staff@1234",
            email="staff@test.com", role="staff",
        )

    def _login(self, username, password):
        res = self.client.post("/api/auth/login/", {
            "username": username,
            "password": password,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, f"Login failed for {username}: {res.data}")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res.data["access"]

    def test_01_admin_login(self):
        """Admin can login and receive JWT token"""
        res = self.client.post("/api/auth/login/", {
            "username": "admin_test",
            "password": "Admin@1234",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        print("PASSED STEP 01: Admin login successful")

    def test_02_invalid_login_blocked(self):
        """Wrong password returns 401"""
        res = self.client.post("/api/auth/login/", {
            "username": "admin_test",
            "password": "wrongpassword",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        print("PASSED STEP 02: Invalid login correctly blocked")

    def test_03_create_warehouse(self):
        """Admin can create a warehouse"""
        self._login("admin_test", "Admin@1234")
        res = self.client.post("/api/warehouses/", {
            "name": "Main Warehouse",
            "location": "Chennai, India",
            "code": "WH-001",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["code"], "WH-001")
        print("PASSED STEP 03: Warehouse created")

    def test_04_create_zone(self):
        """Admin can create a zone inside warehouse"""
        self._login("admin_test", "Admin@1234")
        warehouse = Warehouse.objects.create(name="WH A", location="Chennai", code="WH-A01")
        res = self.client.post("/api/warehouses/zones/", {
            "warehouse": warehouse.id,
            "name": "Cold Storage",
            "code": "ZN-01",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        print("PASSED STEP 04: Zone created")

    def test_05_create_rack(self):
        """Admin can create a rack inside zone"""
        self._login("admin_test", "Admin@1234")
        warehouse = Warehouse.objects.create(name="WH B", location="Chennai", code="WH-B01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone A", code="ZN-A")
        res = self.client.post("/api/warehouses/racks/", {
            "zone": zone.id,
            "name": "Rack 1",
            "code": "RK-01",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        print("PASSED STEP 05: Rack created")

    def test_06_create_bin(self):
        """Admin can create a bin inside rack"""
        self._login("admin_test", "Admin@1234")
        warehouse = Warehouse.objects.create(name="WH C", location="Chennai", code="WH-C01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone B", code="ZN-B")
        rack = Rack.objects.create(zone=zone, name="Rack 2", code="RK-02")
        res = self.client.post("/api/warehouses/bins/", {
            "rack": rack.id,
            "code": "BN-01",
            "capacity": 200,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        print("PASSED STEP 06: Bin created")

    def test_07_create_category_and_product(self):
        """Admin can create category and product"""
        self._login("admin_test", "Admin@1234")
        cat_res = self.client.post("/api/inventory/categories/", {
            "name": "Electronics",
        }, format="json")
        self.assertEqual(cat_res.status_code, status.HTTP_201_CREATED)
        prod_res = self.client.post("/api/inventory/products/", {
            "name": "Laptop",
            "sku": "LP-001",
            "category": cat_res.data["id"],
            "unit_price": "75000.00",
            "reorder_level": 5,
        }, format="json")
        self.assertEqual(prod_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(prod_res.data["sku"], "LP-001")
        print("PASSED STEP 07: Category and Product created")

    def test_08_stock_in_movement(self):
        """Staff can record a stock-in movement"""
        self._login("staff_test", "Staff@1234")
        warehouse = Warehouse.objects.create(name="WH D", location="Delhi", code="WH-D01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone C", code="ZN-C")
        rack = Rack.objects.create(zone=zone, name="Rack 3", code="RK-03")
        bin_obj = Bin.objects.create(rack=rack, code="BN-03", capacity=500)
        category = Category.objects.create(name="Furniture")
        product = Product.objects.create(name="Chair", sku="CH-001", category=category, unit_price=2000)
        res = self.client.post("/api/inventory/movements/", {
            "product": product.id,
            "bin": bin_obj.id,
            "movement_type": "in",
            "quantity": 50,
            "note": "Initial stock",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["movement_type"], "in")
        print("PASSED STEP 08: Stock-in movement recorded")

    def test_09_stock_out_movement(self):
        """Staff can record a stock-out movement"""
        self._login("staff_test", "Staff@1234")
        warehouse = Warehouse.objects.create(name="WH E", location="Mumbai", code="WH-E01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone D", code="ZN-D")
        rack = Rack.objects.create(zone=zone, name="Rack 4", code="RK-04")
        bin_obj = Bin.objects.create(rack=rack, code="BN-04", capacity=300)
        category = Category.objects.create(name="Stationery")
        product = Product.objects.create(name="Pen", sku="PN-001", category=category, unit_price=10)
        InventoryItem.objects.create(product=product, bin=bin_obj, quantity=100)
        res = self.client.post("/api/inventory/movements/", {
            "product": product.id,
            "bin": bin_obj.id,
            "movement_type": "out",
            "quantity": 20,
            "note": "Dispatched to store",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        print("PASSED STEP 09: Stock-out movement recorded")

    def test_10_staff_submit_approval_request(self):
        """Staff can submit an approval request"""
        self._login("staff_test", "Staff@1234")
        warehouse = Warehouse.objects.create(name="WH F", location="Pune", code="WH-F01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone E", code="ZN-E")
        rack = Rack.objects.create(zone=zone, name="Rack 5", code="RK-05")
        bin_obj = Bin.objects.create(rack=rack, code="BN-05", capacity=200)
        category = Category.objects.create(name="Tools")
        product = Product.objects.create(name="Hammer", sku="HM-001", category=category, unit_price=500)
        res = self.client.post("/api/approvals/requests/", {
            "request_type": "stock_in",
            "product": product.id,
            "bin": bin_obj.id,
            "quantity": 30,
            "note": "Need 30 hammers for new project",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "pending")
        print("PASSED STEP 10: Approval request submitted by staff")

    def test_11_manager_approve_request(self):
        """Manager can approve a pending request"""
        warehouse = Warehouse.objects.create(name="WH G", location="Hyderabad", code="WH-G01")
        zone = Zone.objects.create(warehouse=warehouse, name="Zone F", code="ZN-F")
        rack = Rack.objects.create(zone=zone, name="Rack 6", code="RK-06")
        bin_obj = Bin.objects.create(rack=rack, code="BN-06", capacity=100)
        category = Category.objects.create(name="Packaging")
        product = Product.objects.create(name="Box", sku="BX-001", category=category, unit_price=50)
        approval = ApprovalRequest.objects.create(
            request_type="stock_out",
            requested_by=self.staff,
            product=product,
            bin=bin_obj,
            quantity=10,
            note="Need boxes for dispatch",
        )
        self._login("manager_test", "Manager@1234")
        res = self.client.patch(f"/api/approvals/requests/{approval.id}/approve/", {}, format="json")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        print("PASSED STEP 11: Manager approved request")

    def test_12_unauthorized_user_blocked(self):
        """Unauthenticated request to protected endpoint returns 401"""
        self.client.credentials()
        res = self.client.get("/api/warehouses/")
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])
        print("PASSED STEP 12: Unauthorized access correctly blocked")

    def test_13_viewer_cannot_create_warehouse(self):
        """Viewer role cannot create warehouse"""
        viewer = User.objects.create_user(
            username="viewer_test", password="Viewer@1234", role="viewer",
        )
        self._login("viewer_test", "Viewer@1234")
        res = self.client.post("/api/warehouses/", {
            "name": "Viewer Warehouse",
            "location": "Test",
            "code": "WH-V01",
        }, format="json")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
        ])
        print("PASSED STEP 13: Viewer correctly blocked from creating warehouse")
        viewer.delete()


class DataIntegrityIntegrationTest(TestCase):

    def test_14_duplicate_sku_rejected(self):
        """Creating two products with same SKU raises error"""
        category = Category.objects.create(name="Test Cat")
        Product.objects.create(name="Item A", sku="DUP-001", category=category, unit_price=100)
        with self.assertRaises(Exception):
            Product.objects.create(name="Item B", sku="DUP-001", category=category, unit_price=200)
        print("PASSED STEP 14: Duplicate SKU correctly rejected")

    def test_15_cascade_delete_warehouse(self):
        """Deleting warehouse cascades to zones, racks, bins"""
        warehouse = Warehouse.objects.create(name="Cascade WH", location="Test", code="WH-CAS")
        zone = Zone.objects.create(warehouse=warehouse, name="Z1", code="Z1")
        rack = Rack.objects.create(zone=zone, name="R1", code="R1")
        Bin.objects.create(rack=rack, code="B1", capacity=100)
        warehouse_id = warehouse.id
        zone_id = zone.id
        warehouse.delete()
        self.assertEqual(Zone.objects.filter(warehouse_id=warehouse_id).count(), 0)
        self.assertEqual(Rack.objects.filter(zone_id=zone_id).count(), 0)
        print("PASSED STEP 15: Cascade delete works correctly")

    def test_16_auditlog_preserved_after_user_delete(self):
        """AuditLog entries remain with NULL user after user deleted"""
        from accounts.models import AuditLog
        user = User.objects.create_user(username="temp_user", password="Temp@1234", role="staff")
        AuditLog.objects.create(user=user, action="LOGIN", model_name="User", object_id=str(user.id))
        user.delete()
        log = AuditLog.objects.first()
        self.assertIsNotNone(log)
        self.assertIsNone(log.user)
        print("PASSED STEP 16: AuditLog preserved with NULL user after delete")
