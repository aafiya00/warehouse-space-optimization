# Business Workflow Documentation
## Warehouse Space Optimization System

---

## 1. Product Receiving Workflow

**Trigger:** Goods arrive at warehouse from supplier or transfer.
Supplier Delivery
│
▼
Staff scans barcode / enters SKU
│
▼
System validates product exists in catalogue
│  No → Reject / Create Product first
▼
Staff selects target bin (or uses AI Recommendation)
│
▼
System checks bin capacity
│  Exceeded → Error: suggest alternative bin
▼
Staff enters quantity + optional batch/expiry
│
▼
System creates StockMovement (type=receiving)
System updates InventoryItem.quantity += received
System logs AuditLog entry
│
▼
Notification sent to Manager: "X units of SKU received"
│
▼
✅ COMPLETE


---

## 2. Product Allocation Workflow

**Trigger:** An order requires stock to be reserved before dispatch.

Order Request Created
│
▼
Manager / Supervisor selects product + quantity
│
▼
System checks InventoryItem.available_quantity
│  Insufficient → Error: show available qty
▼
System sets InventoryItem.reserved_quantity += requested
System creates ApprovalRequest (if Staff initiates)
│
▼
Manager reviews and Approves
│
▼
ApprovalRequest.status = 'approved'
AuditLog entry created
│
▼
✅ Stock ALLOCATED (not yet removed)


---

## 3. Product Retrieval Workflow

**Trigger:** Picking/dispatch of allocated or available stock.

Pick request initiated
│
▼
Staff confirms bin location + quantity
│
▼
System checks InventoryItem.quantity >= requested
│  Insufficient → Error
▼
InventoryItem.quantity -= retrieved
InventoryItem.reserved_quantity reduced if applicable
StockMovement (type=retrieval) created
AuditLog entry created
│
▼
Low stock check:
If quantity <= reorder_level → Notification to Manager
│
▼
✅ COMPLETE — goods dispatched


---

## 4. Stock Transfer Approval Workflow

**Trigger:** Staff requests moving stock between bins/zones.

Staff creates Transfer Request
│
▼
ApprovalRequest created (status=pending)
Manager / Supervisor notified
│
▼
Manager reviews request
├── APPROVE → InventoryService.transfer_stock() called
│             Source bin quantity -= amount
│             Target bin quantity += amount
│             Two StockMovements created
│             AuditLog recorded
│             ✅ COMPLETE
│
└── REJECT  → ApprovalRequest.status = 'rejected'
Staff notified
❌ Transfer cancelled


---

## 5. Warehouse Space Optimization Workflow

**Trigger:** Manager/Supervisor wants to optimize bin assignments.

Manager opens AI Recommendation page
│
▼
Enters: product SKU + quantity + optional warehouse filter
│
▼
System calls ai_engine.get_smart_bin_recommendation()


Scores all eligible bins
Prefers bins already holding the same product
Balances utilization (prefers 40–80% full bins)
Excludes bins where capacity would exceed 90%
│
▼
System returns:
Top recommended bin with AI score + reasons
2 alternative bins
Demand forecast for product
Reorder prediction
│
▼
Manager selects recommendation
│
▼
Placement confirmed → StockMovement or Transfer created
✅ COMPLETE