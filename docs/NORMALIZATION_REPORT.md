# Database Normalization Report
## Warehouse Space Optimization System

---

## 1NF — First Normal Form

**Rule:** Every column must be atomic (no repeating groups, no arrays).

| Table           | Status | Justification                                                     |
|-----------------|--------|-------------------------------------------------------------------|
| User            | ✅ 1NF | All fields are atomic (role is a single value, not a list).       |
| Warehouse       | ✅ 1NF | name, location, code are all single-valued.                       |
| Zone            | ✅ 1NF | References warehouse via FK, no repeating groups.                 |
| Rack            | ✅ 1NF | References zone via FK, all fields atomic.                        |
| Bin             | ✅ 1NF | capacity is a single integer, code is atomic.                     |
| Product         | ✅ 1NF | category is FK not embedded list; all fields single-valued.       |
| InventoryItem   | ✅ 1NF | quantity, reserved_quantity, status are all atomic.               |
| StockMovement   | ✅ 1NF | quantity is an integer; movement_type is a single choice value.   |
| AuditLog        | ✅ 1NF | All columns are single-valued atomic fields.                      |

---

## 2NF — Second Normal Form

**Rule:** Must be in 1NF and every non-key attribute must be fully functionally dependent on the primary key (no partial dependencies).

| Table           | Status | Justification                                                          |
|-----------------|--------|------------------------------------------------------------------------|
| InventoryItem   | ✅ 2NF | PK is `id`. `unique_together(product, bin)` is a constraint, not a composite PK. All attributes (quantity, status, batch_number) depend on the single surrogate PK. |
| StockMovement   | ✅ 2NF | Single surrogate PK `id`. All fields (quantity, timestamp, note) depend fully on it. |
| Zone            | ✅ 2NF | `unique_together(warehouse, code)` is a constraint. All fields depend on PK `id`. |
| All others      | ✅ 2NF | All tables use surrogate integer PKs; no partial dependencies exist.   |

---

## 3NF — Third Normal Form

**Rule:** Must be in 2NF and no transitive dependencies (non-key attribute depending on another non-key attribute).

| Table           | Status | Justification                                                          |
|-----------------|--------|------------------------------------------------------------------------|
| Product         | ✅ 3NF | `category_id` is a FK; category name is not stored in Product (no transitive dependency). |
| InventoryItem   | ✅ 3NF | bin location details are in the Bin table; not duplicated here.        |
| StockMovement   | ✅ 3NF | product name/sku not stored here; fetched via FK relation.             |
| User            | ✅ 3NF | role is a char field; no role table needed for this scope (enum-like). |
| AuditLog        | ✅ 3NF | username is stored via FK, not duplicated as a text column.            |

---

## Constraints Justification

| Constraint                                 | Table         | Reason                                              |
|--------------------------------------------|---------------|-----------------------------------------------------|
| `unique_together(product, bin)`            | InventoryItem | One row per product-bin pair; prevents duplicates.  |
| `unique_together(warehouse, code)`         | Zone          | Zone codes must be unique within a warehouse.       |
| `unique_together(zone, code)`              | Rack          | Rack codes unique within a zone.                    |
| `unique_together(rack, code)`              | Bin           | Bin codes unique within a rack.                     |
| `sku UNIQUE`                               | Product       | SKU is a business identifier; must be globally unique. |
| `barcode UNIQUE`                           | Product       | Barcode must identify exactly one product.          |
| `CASCADE on Bin delete → InventoryItem`    | InventoryItem | Removing a bin removes its stock entries (expected). |
| `SET_NULL on Product category delete`      | Product       | Category removal doesn't cascade-delete products.   |
| `SET_NULL on performed_by delete`          | StockMovement | Preserve movement history even if user is deleted.  |