# User Acceptance Testing (UAT) Report
## Warehouse Space Optimization System
**Date:** June 16, 2026
**Tested By:** QA Team
**Version:** 1.0.0

---

## 1. UAT Overview

This document records end-to-end user acceptance test scenarios executed from the perspective of each system role. Each scenario maps to a user story, defines acceptance criteria, and records pass/fail status.

---

## 2. Test Environment

| Item | Detail |
|---|---|
| Frontend URL | http://localhost:5173 |
| Backend URL | http://localhost:8000 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Browser | Chrome 125+ |
| Test Date | June 16, 2026 |

---

## 3. User Story Test Scenarios

### Scenario 1 — User Login and Authentication
**User Story:** As a user, I can log in with my credentials and be redirected to my dashboard.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Navigate to `/login` | Login form displayed | ✅ Pass |
| 2 | Enter valid username and password | Fields accept input | ✅ Pass |
| 3 | Click Sign In | JWT token issued, redirected to Dashboard | ✅ Pass |
| 4 | Enter wrong password 5 times | Account locked, 403 returned | ✅ Pass |
| 5 | Access `/inventory` without login | Redirected to `/login` | ✅ Pass |

---

### Scenario 2 — Admin Creates and Manages Users
**User Story:** As an admin, I can create users, assign roles, and deactivate accounts.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as admin | Admin dashboard visible | ✅ Pass |
| 2 | Navigate to User Management via sidebar | `/users` page loads with user list | ✅ Pass |
| 3 | Click Add User, fill form, assign role | User created successfully | ✅ Pass |
| 4 | Edit existing user role | Role updated in DB | ✅ Pass |
| 5 | Login as viewer, try to access `/users` | Access denied / redirected | ✅ Pass |

---

### Scenario 3 — Staff Performs Stock-In Movement
**User Story:** As a staff member, I can perform a stock-in movement and see inventory update.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as staff | Dashboard visible | ✅ Pass |
| 2 | Navigate to Movements | Movement list loads | ✅ Pass |
| 3 | Click Add Movement, select type "in" | Form displays correctly | ✅ Pass |
| 4 | Select product, bin, enter quantity | Fields accept valid input | ✅ Pass |
| 5 | Submit movement | Movement saved, inventory quantity increases | ✅ Pass |
| 6 | Navigate to Inventory | Updated quantity reflected | ✅ Pass |

---

### Scenario 4 — Manager Approves Stock Request
**User Story:** As a manager or supervisor, I can approve or reject pending stock requests.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as manager | Dashboard visible | ✅ Pass |
| 2 | Navigate to Approvals | Pending requests listed | ✅ Pass |
| 3 | Click Approve on a pending request | Status changes to "approved" | ✅ Pass |
| 4 | Click Reject on a pending request | Status changes to "rejected" | ✅ Pass |
| 5 | Login as staff, try to approve | 403 Forbidden returned | ✅ Pass |
| 6 | Login as supervisor, approve request | Approval succeeds | ✅ Pass |

---

### Scenario 5 — Supplier Management (Admin/Manager)
**User Story:** As an admin, I can add and manage suppliers linked to products.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as admin | Dashboard visible | ✅ Pass |
| 2 | Navigate to Suppliers via sidebar | `/suppliers` page loads | ✅ Pass |
| 3 | Click Add Supplier, fill all fields | Supplier created with 201 | ✅ Pass |
| 4 | Edit supplier contact details | Details updated successfully | ✅ Pass |
| 5 | Delete a supplier | Supplier removed from list | ✅ Pass |

---

### Scenario 6 — Analytics Dashboard Displays Data
**User Story:** As a manager, I can view live analytics including utilization and low stock alerts.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as manager | Dashboard visible | ✅ Pass |
| 2 | Click Analytics in sidebar | `/analytics` page loads | ✅ Pass |
| 3 | View Zone Utilization chart | Bar chart renders with zone data | ✅ Pass |
| 4 | View Stock Movement Trends | Line chart renders with in/out data | ✅ Pass |
| 5 | View Low Stock Alerts panel | Products below reorder level listed | ✅ Pass |

---

### Scenario 7 — Reports Export
**User Story:** As a manager, I can export inventory and movement reports as CSV or Excel.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as manager | Dashboard visible | ✅ Pass |
| 2 | Navigate to Reports | Reports page loads with charts | ✅ Pass |
| 3 | Click "Inventory CSV" button | CSV file downloads automatically | ✅ Pass |
| 4 | Click "Inventory Excel" button | XLSX file downloads automatically | ✅ Pass |
| 5 | Click "Movements CSV" button | Movements CSV downloads | ✅ Pass |
| 6 | Open downloaded CSV in Excel | Data is correctly formatted | ✅ Pass |

---

### Scenario 8 — AI Bin Recommendation
**User Story:** As a staff member, I can get an AI-recommended bin for storing a product.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as staff | Dashboard visible | ✅ Pass |
| 2 | Navigate to AI Insights | `/ai` page loads | ✅ Pass |
| 3 | Select a product and enter quantity | Form accepts input | ✅ Pass |
| 4 | Click Get Recommendation | Recommended bin displayed with reasoning | ✅ Pass |

---

### Scenario 9 — Viewer Has Read-Only Access
**User Story:** As a viewer, I can browse inventory data but cannot create, edit, or delete anything.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as viewer | Dashboard visible | ✅ Pass |
| 2 | Navigate to Products | Product list loads | ✅ Pass |
| 3 | Try POST to `/api/inventory/products/` via API | 403 Forbidden returned | ✅ Pass |
| 4 | Try DELETE on any resource via API | 403 Forbidden returned | ✅ Pass |
| 5 | Navigate to `/users` | Access denied / not visible in nav | ✅ Pass |

---

### Scenario 10 — Password Change and Profile
**User Story:** As any logged-in user, I can update my password and view my profile.

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Login as any user | Dashboard visible | ✅ Pass |
| 2 | Click My Profile in sidebar | `/profile` page loads with user info | ✅ Pass |
| 3 | Navigate to Change Password | Form with old/new password fields | ✅ Pass |
| 4 | Enter wrong old password | Error message displayed | ✅ Pass |
| 5 | Enter valid old + new password | Password updated successfully | ✅ Pass |

---

## 4. UAT Sign-Off Matrix

| Scenario | Feature Area | Tester | Result | Sign-Off |
|---|---|---|---|---|
| 1 | Authentication & Lockout | QA Lead | ✅ Pass | __________ |
| 2 | User Management (Admin) | QA Lead | ✅ Pass | __________ |
| 3 | Stock Movement (Staff) | QA Analyst | ✅ Pass | __________ |
| 4 | Approvals (Manager/Supervisor) | QA Analyst | ✅ Pass | __________ |
| 5 | Supplier Management | QA Lead | ✅ Pass | __________ |
| 6 | Analytics Dashboard | QA Analyst | ✅ Pass | __________ |
| 7 | Report Exports | QA Analyst | ✅ Pass | __________ |
| 8 | AI Bin Recommendation | QA Lead | ✅ Pass | __________ |
| 9 | Viewer Read-Only Access | QA Analyst | ✅ Pass | __________ |
| 10 | Profile & Password Change | QA Analyst | ✅ Pass | __________ |

---

## 5. Overall UAT Result

| Total Scenarios | Passed | Failed | Pass Rate |
|---|---|---|---|
| 10 | 10 | 0 | 100% |

**UAT Status: APPROVED ✅**

---

## 6. Notes
- Supervisor role permission enforcement verified via automated security tests.
- Report export tested with sample inventory data loaded in staging environment.
- AI recommendation requires backend to be running with OpenAI/Anthropic API key configured.