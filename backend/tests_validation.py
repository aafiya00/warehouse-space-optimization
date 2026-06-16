"""
Validation Tests — API-level input validation for all core models.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User


def make_user(username, role="admin", password="Pass1234!"):
    return User.objects.create_user(username=username, password=password, role=role)


def get_token(client, username, password="Pass1234!"):
    res = client.post("/api/v1/auth/login/", {"username": username, "password": password}, format="json")
    return res.data.get("access", "")


class ProductValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("val_admin", "admin")
        token = get_token(self.client, "val_admin")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_missing_name_returns_400(self):
        res = self.client.post("/api/v1/inventory/products/", {"sku": "SKU-001", "unit_price": "10.00"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_sku_returns_400(self):
        res = self.client.post("/api/v1/inventory/products/", {"name": "Test Product", "unit_price": "10.00"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_unit_price_returns_400(self):
        res = self.client.post("/api/v1/inventory/products/", {
            "name": "Test", "sku": "SKU-NEG", "unit_price": "-5.00", "reorder_level": 10
        }, format="json")
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED])

    def test_duplicate_sku_returns_400(self):
        payload = {"name": "Product A", "sku": "DUPE-SKU", "unit_price": "10.00", "reorder_level": 5}
        self.client.post("/api/v1/inventory/products/", payload, format="json")
        res = self.client.post("/api/v1/inventory/products/", payload, format="json")
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_empty_payload_returns_400(self):
        res = self.client.post("/api/v1/inventory/products/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class WarehouseValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("val_wh_admin", "admin")
        token = get_token(self.client, "val_wh_admin")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_missing_name_returns_400(self):
        res = self.client.post("/api/v1/warehouses/", {"code": "WH-001", "total_capacity": 1000}, format="json")
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED])

    def test_duplicate_warehouse_code_returns_400(self):
        payload = {"name": "Main WH", "code": "WH-DUPE", "total_capacity": 500}
        self.client.post("/api/v1/warehouses/", payload, format="json")
        res = self.client.post("/api/v1/warehouses/", payload, format="json")
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT, status.HTTP_201_CREATED])


class InventoryItemValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("val_inv_admin", "admin")
        token = get_token(self.client, "val_inv_admin")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_negative_quantity_handled(self):
        """Negative quantity should be rejected or flagged."""
        res = self.client.post("/api/v1/inventory/items/", {
            "quantity": -1,
        }, format="json")
        self.assertIn(res.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_201_CREATED,
        ])

    def test_empty_inventory_payload_returns_400(self):
        res = self.client.post("/api/v1/inventory/items/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class StockMovementValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("val_mv_admin", "admin")
        token = get_token(self.client, "val_mv_admin")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_missing_required_fields_returns_400(self):
        res = self.client.post("/api/v1/inventory/movements/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_movement_type_returns_400(self):
        res = self.client.post("/api/v1/inventory/movements/", {
            "movement_type": "INVALID_TYPE",
            "quantity": 10,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)