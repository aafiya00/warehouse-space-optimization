# Role & Permission Matrix
## Warehouse Space Optimization System

---

## Roles

| Role       | Description                                              |
|------------|----------------------------------------------------------|
| Admin      | Full system access. Manages users, settings, all data.   |
| Manager    | Manages warehouse operations, approves transfers.        |
| Staff      | Day-to-day stock movements, receiving, retrieval.        |
| Supervisor | Oversees staff, views reports, approves minor requests.  |
| Viewer     | Read-only access to inventory and reports.               |

---

## Permission Matrix

| Feature / Action             | Admin | Manager | Supervisor | Staff | Viewer |
|------------------------------|:-----:|:-------:|:----------:|:-----:|:------:|
| **USER MANAGEMENT**          |       |         |            |       |        |
| Create users                 | ✅    | ❌      | ❌         | ❌    | ❌     |
| Edit user roles              | ✅    | ❌      | ❌         | ❌    | ❌     |
| View all users               | ✅    | ✅      | ❌         | ❌    | ❌     |
| **WAREHOUSE / ZONES / BINS** |       |         |            |       |        |
| Create warehouse             | ✅    | ✅      | ❌         | ❌    | ❌     |
| Edit warehouse               | ✅    | ✅      | ❌         | ❌    | ❌     |
| View warehouses              | ✅    | ✅      | ✅         | ✅    | ✅     |
| Manage zones/racks/bins      | ✅    | ✅      | ❌         | ❌    | ❌     |
| **INVENTORY**                |       |         |            |       |        |
| View inventory               | ✅    | ✅      | ✅         | ✅    | ✅     |
| Add products                 | ✅    | ✅      | ❌         | ❌    | ❌     |
| Edit products                | ✅    | ✅      | ❌         | ❌    | ❌     |
| Delete products              | ✅    | ❌      | ❌         | ❌    | ❌     |
| Stock IN (receiving)         | ✅    | ✅      | ✅         | ✅    | ❌     |
| Stock OUT (retrieval)        | ✅    | ✅      | ✅         | ✅    | ❌     |
| Stock transfer               | ✅    | ✅      | ✅         | ❌    | ❌     |
| Stock adjustment             | ✅    | ✅      | ❌         | ❌    | ❌     |
| **APPROVALS**                |       |         |            |       |        |
| Create approval request      | ✅    | ✅      | ✅         | ✅    | ❌     |
| Approve/reject requests      | ✅    | ✅      | ✅         | ❌    | ❌     |
| View approval history        | ✅    | ✅      | ✅         | ✅    | ❌     |
| **REPORTS**                  |       |         |            |       |        |
| View reports                 | ✅    | ✅      | ✅         | ❌    | ✅     |
| Export reports (PDF/Excel)   | ✅    | ✅      | ✅         | ❌    | ❌     |
| **AI FEATURES**              |       |         |            |       |        |
| View AI recommendations      | ✅    | ✅      | ✅         | ✅    | ❌     |
| Run demand forecast          | ✅    | ✅      | ✅         | ❌    | ❌     |
| **AUDIT & SECURITY**         |       |         |            |       |        |
| View full audit log          | ✅    | ❌      | ❌         | ❌    | ❌     |
| View own audit trail         | ✅    | ✅      | ✅         | ✅    | ✅     |
| View login history           | ✅    | ✅      | ✅         | ✅    | ✅     |
| **NOTIFICATIONS**            |       |         |            |       |        |
| View own notifications       | ✅    | ✅      | ✅         | ✅    | ✅     |
| Send system notifications    | ✅    | ✅      | ❌         | ❌    | ❌     |

---

## Responsibilities Per Role

### Admin
- User account management and role assignment
- System configuration and settings
- Full audit log access
- All CRUD operations across all modules

### Manager
- Approve/reject stock transfer requests
- Manage warehouse structure (zones, racks, bins)
- Create and manage products and suppliers
- View and export all reports

### Supervisor
- Oversee daily warehouse operations
- Approve minor stock requests from staff
- View AI recommendations and forecasts
- Export operational reports

### Staff
- Receive incoming stock (product receiving workflow)
- Retrieve outgoing stock (product retrieval workflow)
- Record stock movements
- View own activity history

### Viewer
- Read-only access to inventory levels
- View warehouse utilization dashboards
- View published reports (no export)