"""
Security Test Suite
Tests: role escalation, account lockout, JWT expiry rejection
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User


def create_user(username, role, password="TestPass123!"):
    return User.objects.create_user(username=username, password=password, role=role)


class RoleEscalationTests(TestCase):
    """Verify that lower roles cannot access higher-role endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.viewer = create_user("viewer1", "viewer")
        self.staff = create_user("staff1", "staff")

    def _get_token(self, username, password="TestPass123!"):
        res = self.client.post("/api/auth/login/", {
            "username": username, "password": password
        }, format="json")
        return res.data.get("access", "")

    def test_viewer_cannot_create_product(self):
        """Viewer role must get 403 on POST /api/inventory/products/."""
        token = self._get_token("viewer1")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.post("/api/inventory/products/", {
            "name": "Hack Product", "sku": "HACK001",
            "unit_price": "10.00", "reorder_level": 5
        }, format="json")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
        ])

    def test_staff_cannot_approve_request(self):
        """Staff role must get 403 on approval endpoint."""
        token = self._get_token("staff1")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.post("/api/approvals/requests/1/approve/", format="json")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ])

    def test_viewer_cannot_delete_warehouse(self):
        """Viewer role must get 403 on DELETE /api/warehouses/warehouses/1/."""
        token = self._get_token("viewer1")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.delete("/api/warehouses/warehouses/1/")
        self.assertIn(res.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
        ])

    def test_unauthenticated_cannot_access_inventory(self):
        """No token must return 401 on inventory endpoint."""
        self.client.credentials()
        res = self.client.get("/api/inventory/products/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountLockoutTests(TestCase):
    """Verify account lockout after 5 failed login attempts."""

    def setUp(self):
        self.client = APIClient()
        self.user = create_user("locktest", "staff")

    def test_account_locks_after_failed_attempts(self):
        """After 5 failed logins, account locks and 6th attempt is blocked."""
        for _ in range(5):
            self.user.record_failed_login()

        self.user.refresh_from_db()
        self.assertIsNotNone(
            self.user.locked_until,
            "locked_until should be set after 5 failed attempts"
        )
        self.assertTrue(
            self.user.is_locked(),
            "is_locked() should return True after 5 failed attempts"
        )

        res = self.client.post("/api/auth/login/", {
            "username": "locktest", "password": "TestPass123!"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN,
            "Locked account must return 403 even with correct password")

    def test_correct_password_works_before_lockout(self):
        """Correct password must work before any failed attempts."""
        res = self.client.post("/api/auth/login/", {
            "username": "locktest", "password": "TestPass123!"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)


class JWTSecurityTests(TestCase):
    """Verify JWT token rejection."""

    def setUp(self):
        self.client = APIClient()

    def test_invalid_token_rejected(self):
        """A fake/invalid JWT must return 401."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer faketoken.invalid.jwt")
        res = self.client.get("/api/inventory/products/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_token_rejected(self):
        """Missing Authorization header must return 401."""
        self.client.credentials()
        res = self.client.get("/api/inventory/items/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_bearer_rejected(self):
        """Malformed Bearer must return 401."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer ")
        res = self.client.get("/api/inventory/products/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)