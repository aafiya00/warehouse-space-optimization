"""
Performance Tests - Locust load test for Warehouse Space Optimization API.
Target: p95 response time < 500ms under 50 concurrent users.

Run with:
    locust -f tests/performance/locustfile.py --headless -u 50 -r 5 --run-time 60s --host http://localhost:8000
"""
from locust import HttpUser, task, between

ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}


class WarehouseAPIUser(HttpUser):
    wait_time = between(1, 3)
    token: str | None = None

    def on_start(self) -> None:
        """Login and store JWT token before running tasks."""
        res = self.client.post(
            "/api/v1/auth/login/",
            json=ADMIN_CREDENTIALS,
            name="[AUTH] Login",
        )
        if res.status_code == 200:
            self.token = res.json().get("access")

    def get_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def list_inventory_items(self) -> None:
        self.client.get(
            "/api/v1/inventory/items/",
            headers=self.get_headers(),
            name="[INVENTORY] List Items",
        )

    @task(3)
    def list_stock_movements(self) -> None:
        self.client.get(
            "/api/v1/inventory/movements/",
            headers=self.get_headers(),
            name="[INVENTORY] List Movements",
        )

    @task(2)
    def list_products(self) -> None:
        self.client.get(
            "/api/v1/inventory/products/",
            headers=self.get_headers(),
            name="[INVENTORY] List Products",
        )

    @task(2)
    def list_warehouses(self) -> None:
        self.client.get(
            "/api/v1/warehouses/",
            headers=self.get_headers(),
            name="[WAREHOUSE] List Warehouses",
        )

    @task(1)
    def dashboard_kpis(self) -> None:
        self.client.get(
            "/api/v1/dashboard/kpis/",
            headers=self.get_headers(),
            name="[DASHBOARD] KPIs",
        )

    @task(1)
    def warehouse_utilization(self) -> None:
        self.client.get(
            "/api/v1/warehouses/utilization/",
            headers=self.get_headers(),
            name="[ANALYTICS] Utilization",
        )

    @task(1)
    def low_stock_alert(self) -> None:
        self.client.get(
            "/api/v1/inventory/low-stock/",
            headers=self.get_headers(),
            name="[ANALYTICS] Low Stock",
        )