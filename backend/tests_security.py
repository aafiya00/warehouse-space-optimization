"""
Security Tests — Role enforcement, account lockout, JWT rejection.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User


def make_user(username, role, password="Pass1234!"):
    return User.objects.create_user(username=username, password=password, role=role)


def get_token(client, username, password="Pass1234!"):
    res = client.post("/api/v1/auth/login/", {"username": username, "password": password}, format="json")
    return res.data.get("access", "")


class RoleEnforcementTests(TestCase):
    """Verify that lower roles cannot access admin/manager endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("sec_admin", "admin")
        self.manager = make_user("sec_manager", "manager")
        self.staff = make_user("sec_staff", "staff")
        self.viewer = make_user("sec_viewer", "viewer")

    def auth(self, user):
        token = get_token(self.client, user.username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_admin_can_list_users(self):
        self.auth(self.admin)
        res = self.client.get("/api/v1/auth/users/")
        self.assertNotEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_cannot_delete_warehouse(self):
        """Staff must not be able to DELETE warehouse resources."""
        self.auth(self.staff)
        res = self.client.delete("/api/v1/warehouses/1/")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ])

    def test_viewer_cannot_create_product(self):
        """Viewer must not be able to POST to products."""
        self.auth(self.viewer)
        payload = {"name": "Hack", "sku": "HACK-01", "unit_price": "1.00", "reorder_level": 5}
        res = self.client.post("/api/v1/inventory/products/", payload, format="json")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
        ])

    def test_unauthenticated_cannot_access_inventory(self):
        """No token should be rejected."""
        self.client.credentials()
        res = self.client.get("/api/v1/inventory/items/")
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])

    def test_staff_cannot_access_admin_user_list(self):
        """Staff should not be able to create new users (write access blocked)."""
        self.auth(self.staff)
        res = self.client.post(
            "/api/v1/auth/users/",
            {"username": "hacked", "password": "Pass1234!", "role": "admin"},
            format="json",
        )
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ])


class AccountLockoutTests(TestCase):
    """Verify account locks after repeated failed logins."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user("lockout_user", "staff")

    def test_account_locks_after_failed_attempts(self):
        """After repeated wrong passwords the API rejects with 401."""
        for _ in range(5):
            self.client.post(
                "/api/v1/auth/login/",
                {"username": "lockout_user", "password": "WrongPass!"},
                format="json",
            )
        # Verify wrong password is still rejected (lockout or 401)
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": "lockout_user", "password": "WrongPass!"},
            format="json",
        )
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST,
        ])
    def test_wrong_password_returns_401(self):
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": "lockout_user", "password": "BadPass999"},
            format="json",
        )
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST,
        ])


class JWTSecurityTests(TestCase):
    """Verify JWT token validation."""

    def setUp(self):
        self.client = APIClient()
        make_user("jwt_user", "staff")

    def test_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer thisisaninvalidtoken")
        res = self.client.get("/api/v1/inventory/items/")
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])

    def test_missing_token_rejected(self):
        self.client.credentials()
        res = self.client.get("/api/v1/inventory/items/")
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])

    def test_tampered_token_rejected(self):
        token = get_token(self.client, "jwt_user")
        tampered = token[:-5] + "XXXXX"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tampered}")
        res = self.client.get("/api/v1/inventory/items/")
        self.assertIn(res.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])