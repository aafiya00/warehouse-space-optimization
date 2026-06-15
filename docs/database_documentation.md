# Database Documentation
## Warehouse Space Optimization System

---

## 1. Overview

The database is built using **Django ORM** with **SQLite** (development) and is designed to be compatible with **PostgreSQL** (production). It spans **5 Django apps**: `accounts`, `warehouses`, `inventory`, `approvals`, `notifications`.

---

## 2. Normalization

### 2.1 First Normal Form (1NF)

> **Rule:** Every column must hold atomic (indivisible) values. No repeating groups. Each table must have a Primary Key.

| Table | How 1NF is satisfied |
|---|---|
| User | Each column holds one value (e.g. `role` is a single string, not a list) |
| Warehouse | `code` is atomic; no arrays or comma-separated values |
| Zone | Single `name` and `code` per row |
| Rack | One rack per row, single zone reference |
| Bin | `capacity` is a single integer; no multi-value fields |
| Product | `sku` is a single unique string; `description` is one text field |
| InventoryItem | One product-bin combination per row |
| StockMovement | Each movement is one atomic event |
| ApprovalRequest | `status` is a single enum value |
| AuditLog | One log entry per action |
| Notification | One notification per row per user |

**All tables satisfy 1NF.**

---

### 2.2 Second Normal Form (2NF)

> **Rule:** Must be in 1NF. Every non-key attribute must be **fully functionally dependent** on the entire Primary Key (no partial dependencies). Applies only to composite keys.

Tables with composite unique constraints (not composite PKs):

| Table | Composite Unique | Analysis |
|---|---|---|
| Zone | `(warehouse_id, code)` | All other columns (`name`) depend on the full pair — ✅ 2NF |
| Rack | `(zone_id, code)` | `name` depends on full pair — ✅ 2NF |
| Bin | `(rack_id, code)` | `capacity` depends on full pair — ✅ 2NF |
| InventoryItem | `(product_id, bin_id)` | `quantity`, `updated_at` depend on both — ✅ 2NF |

All tables use a surrogate integer PK (`id`). Non-key attributes depend fully on `id`.

**All tables satisfy 2NF.**

---

### 2.3 Third Normal Form (3NF)

> **Rule:** Must be in 2NF. No transitive dependencies — non-key attributes must not depend on other non-key attributes.

| Table | Potential Transitive Dependency | Resolution |
|---|---|---|
| Product | `category_name` could depend on `category_id` | Category is a **separate table** — no transitive dependency ✅ |
| Zone | Warehouse `location` could repeat | Warehouse data lives only in `Warehouse` table ✅ |
| InventoryItem | Product `name` could be inlined | Product data lives in `Product` table only ✅ |
| StockMovement | User `username` is not stored inline | Only `performed_by_id` (FK) is stored ✅ |
| ApprovalRequest | No derived or transitively dependent field | All fields depend directly on `id` ✅ |
| AuditLog | `model_name` and `action` are independent attributes | No transitive dependency ✅ |

**All tables satisfy 3NF.**

---

## 3. Primary Keys (PK)

| Table | Primary Key | Type | Notes |
|---|---|---|---|
| User | `id` | Auto-increment integer | Inherited from AbstractUser |
| AuditLog | `id` | Auto-increment integer | |
| Notification | `id` | Auto-increment integer | |
| Warehouse | `id` | Auto-increment integer | |
| Zone | `id` | Auto-increment integer | |
| Rack | `id` | Auto-increment integer | |
| Bin | `id` | Auto-increment integer | |
| Category | `id` | Auto-increment integer | |
| Product | `id` | Auto-increment integer | `sku` acts as natural unique key |
| InventoryItem | `id` | Auto-increment integer | Composite unique: `(product, bin)` |
| StockMovement | `id` | Auto-increment integer | |
| ApprovalRequest | `id` | Auto-increment integer | |

> **Design Justification:** Surrogate integer PKs are used throughout for performance, simplicity, and to decouple database identity from business logic. Natural keys (like `sku`, `code`) are enforced via `unique=True` constraints, not as PKs.

---

## 4. Foreign Keys (FK)

| FK Column | Source Table | References | On Delete | Nullable |
|---|---|---|---|---|
| `user_id` | AuditLog | User | SET NULL | Yes |
| `user_id` | Notification | User | CASCADE | No |
| `warehouse_id` | Zone | Warehouse | CASCADE | No |
| `zone_id` | Rack | Zone | CASCADE | No |
| `rack_id` | Bin | Rack | CASCADE | No |
| `category_id` | Product | Category | SET NULL | Yes |
| `product_id` | InventoryItem | Product | CASCADE | No |
| `bin_id` | InventoryItem | Bin | CASCADE | No |
| `product_id` | StockMovement | Product | CASCADE | No |
| `bin_id` | StockMovement | Bin | CASCADE | No |
| `performed_by` | StockMovement | User | SET NULL | Yes |
| `requested_by` | ApprovalRequest | User | CASCADE | No |
| `reviewed_by` | ApprovalRequest | User | SET NULL | Yes |
| `product_id` | ApprovalRequest | Product | CASCADE | No |
| `bin_id` | ApprovalRequest | Bin | CASCADE | No |

### ON DELETE Justification

| Strategy | When Used | Reason |
|---|---|---|
| `CASCADE` | Child data tied to parent lifecycle | e.g. deleting a Warehouse removes its Zones, Racks, Bins |
| `SET NULL` | Reference is optional or auditable | e.g. deleting a User preserves AuditLog history with `user=NULL` |

---

## 5. Constraints Summary

| Table | Constraint | Type |
|---|---|---|
| User | `username` | UNIQUE |
| Warehouse | `code` | UNIQUE |
| Zone | `(warehouse_id, code)` | UNIQUE TOGETHER |
| Rack | `(zone_id, code)` | UNIQUE TOGETHER |
| Bin | `(rack_id, code)` | UNIQUE TOGETHER |
| Category | `name` | UNIQUE |
| Product | `sku` | UNIQUE |
| InventoryItem | `(product_id, bin_id)` | UNIQUE TOGETHER |
| Bin | `capacity` | PositiveIntegerField (≥ 0) |
| InventoryItem | `quantity` | PositiveIntegerField (≥ 0) |
| ApprovalRequest | `quantity` | PositiveIntegerField (≥ 0) |
| StockMovement | `movement_type` | CHOICES enum |
| ApprovalRequest | `status` | CHOICES enum |
| User | `role` | CHOICES enum |

---

## 6. Design Justifications

### 6.1 Why AbstractUser?
Django's `AbstractUser` was extended to add `role` and `phone` without rebuilding authentication from scratch. This gives full access to Django's built-in auth system (password hashing, sessions, admin) while adding custom fields.

### 6.2 Why Separate Warehouse → Zone → Rack → Bin Hierarchy?
This 4-level hierarchy models real-world warehouse physical structure. Each level can have its own codes, names, and constraints. This allows precise stock location tracking (e.g. `WH-A / Zone-C / Rack-02 / Bin-05`) and supports future capacity management at each level.

### 6.3 Why a Separate Category Table?
Separating `Category` from `Product` eliminates data redundancy. If category name changes, it is updated in one place, not across all product rows. Satisfies 3NF by removing transitive dependency.

### 6.4 Why InventoryItem as a Junction Table?
`InventoryItem` is a many-to-many relationship between `Product` and `Bin` with an attribute (`quantity`). Using a dedicated table with a unique constraint on `(product, bin)` ensures each product can only have one inventory record per bin, preventing duplicate entries.

### 6.5 Why AuditLog uses SET NULL?
Deleting a user should not erase audit history — that would be a compliance and security risk. `SET NULL` preserves the log entry while clearing the user reference.

### 6.6 Why two FKs on ApprovalRequest for User?
`requested_by` (who submitted) and `reviewed_by` (who approved/rejected) are two distinct roles in the approval workflow. Using two FKs with `related_name` prevents reverse accessor conflicts and keeps the workflow clear.

---

## 7. Database Tables Summary

| App | Tables |
|---|---|
| accounts | User, AuditLog |
| warehouses | Warehouse, Zone, Rack, Bin |
| inventory | Category, Product, InventoryItem, StockMovement |
| approvals | ApprovalRequest |
| notifications | Notification |

**Total: 11 tables**