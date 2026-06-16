# API Documentation — Warehouse Space Optimization System

Base URL: `http://localhost:8000`
All endpoints (except auth) require: `Authorization: Bearer <access_token>`

---

## Authentication — `/api/v1/auth/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Login — returns access + refresh token |
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| POST | `/api/v1/auth/logout/` | Logout |
| POST | `/api/v1/auth/change-password/` | Change password |

---

## Dashboard — `/api/v1/dashboard/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/kpis/` | Total/Used/Free capacity, utilization %, alerts |

---

## Warehouses — `/api/v1/warehouses/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/warehouses/` | List all warehouses |
| POST | `/api/v1/warehouses/` | Create warehouse |
| GET | `/api/v1/warehouses/{id}/` | Get warehouse detail |
| PUT | `/api/v1/warehouses/{id}/` | Update warehouse |
| DELETE | `/api/v1/warehouses/{id}/` | Delete warehouse |
| GET | `/api/v1/warehouses/utilization/` | Per-warehouse utilization % |
| GET | `/api/v1/warehouses/overloaded-bins/?threshold=90` | Bins above threshold % |
| GET | `/api/v1/warehouses/underutilized-zones/?threshold=20` | Zones below threshold % |

---

## Inventory — `/api/v1/inventory/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory/low-stock/` | Products at or below reorder level |
| GET | `/api/v1/inventory/overstock/` | Overstocked products |
| GET | `/api/v1/inventory/valuation/` | Stock valuation by product |
| GET | `/api/v1/inventory/expiring-soon/?days=30` | Items expiring within N days |
| GET | `/api/v1/inventory/movement-trends/?days=30` | Daily in/out movement trends |

---

## Reports — `/api/v1/reports/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/inventory/csv/` | Export inventory as CSV |
| GET | `/api/v1/reports/inventory/excel/` | Export inventory as Excel |
| GET | `/api/v1/reports/movements/csv/?days=30` | Export movements as CSV |
| GET | `/api/v1/reports/utilization/` | Zone utilization JSON |
| GET | `/api/v1/reports/movement-trends/` | Movement trend JSON |

---

## Approvals — `/api/v1/approvals/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/approvals/` | List approval requests |
| POST | `/api/v1/approvals/` | Create approval request |
| POST | `/api/v1/approvals/{id}/approve/` | Approve request (admin/approver) |
| POST | `/api/v1/approvals/{id}/reject/` | Reject request (admin/approver) |
| GET | `/api/v1/approvals/{id}/audit_trail/` | View full audit trail |

---

## API Docs (Swagger)

- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
- JSON Schema: `http://localhost:8000/swagger.json`

---

## Role Access Matrix

| Endpoint Group | Admin | Manager | Staff | Approver | Auditor |
|---------------|-------|---------|-------|----------|---------|
| Warehouses CRUD | ✅ | ✅ | ❌ | ❌ | 👁️ |
| Inventory CRUD | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Approvals | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Approve/Reject | ✅ | ❌ | ❌ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | 👁️ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |

👁️ = Read-only
