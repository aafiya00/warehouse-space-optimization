# Software Requirements Specification (SRS)
## Warehouse Space Optimization System
**Version:** 1.0  |  **Date:** 2025  |  **Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the Warehouse Space Optimization System — a full-stack web application for managing inventory, warehouse structure, staff, stock movements, and AI-driven space optimization.

### 1.2 Scope
The system covers:
- Inventory management (products, stock in/out, transfers)
- Warehouse physical structure management (warehouses, zones, racks, bins)
- Role-based user access control (Admin, Manager, Supervisor, Staff, Viewer)
- AI-powered bin recommendations and demand forecasting
- Approval workflows for stock transfers
- Reporting and analytics dashboards

### 1.3 Definitions
| Term        | Meaning                                               |
|-------------|-------------------------------------------------------|
| SKU         | Stock Keeping Unit — unique product identifier        |
| Bin         | Smallest physical storage location in the warehouse   |
| Rack        | Contains multiple bins; belongs to a zone             |
| Zone        | Area within a warehouse containing multiple racks     |
| Reorder Level | Minimum stock threshold that triggers a reorder alert |

---

## 2. Overall Description

### 2.1 System Context
The system is a web application with a Django REST API backend and a React + TypeScript frontend. It is containerized using Docker and deployable to any cloud platform.

### 2.2 User Classes
- **Admin** — Full access; user management; system configuration
- **Manager** — Warehouse operations; approvals; reports
- **Supervisor** — Staff oversight; minor approvals; analytics
- **Staff** — Stock movements; receiving; retrieval
- **Viewer** — Read-only access

---

## 3. Functional Requirements

### 3.1 Authentication
- FR-AUTH-01: Users shall log in with username/password and receive a JWT token.
- FR-AUTH-02: Accounts shall be locked after 5 consecutive failed logins for 30 minutes.
- FR-AUTH-03: Users shall be able to change their password (min 8 characters).
- FR-AUTH-04: Admins can reset any user's password via email link.
- FR-AUTH-05: System shall record login history (IP, timestamp, success/failure).

### 3.2 Inventory Management
- FR-INV-01: Admin/Manager can create, edit, and delete products with SKU, barcode, category, price.
- FR-INV-02: Staff can record stock-in (receiving), stock-out (retrieval), and adjustments.
- FR-INV-03: System shall prevent stock-out that would make quantity negative.
- FR-INV-04: Each product can track batch number and expiry date.
- FR-INV-05: System shall alert when stock falls below reorder level.

### 3.3 Warehouse Structure
- FR-WH-01: Admin/Manager can create and edit warehouses, zones, racks, and bins.
- FR-WH-02: Bins have a defined capacity; system enforces this limit on stock-in.
- FR-WH-03: System shall display current utilization (%) per zone and per bin.

### 3.4 Stock Transfers
- FR-TRF-01: Managers/Supervisors can initiate stock transfers between bins.
- FR-TRF-02: Staff-initiated transfers must go through an approval workflow.
- FR-TRF-03: All transfers shall be logged as two StockMovement records (out + in).

### 3.5 AI Recommendations
- FR-AI-01: System shall recommend the optimal bin for placing a given quantity of product.
- FR-AI-02: AI scoring shall consider existing product co-location, bin utilization balance, and remaining capacity.
- FR-AI-03: System shall predict reorder urgency (ok / medium / high / critical).
- FR-AI-04: System shall generate a 30-day demand forecast using a 4-week moving average.

### 3.6 Reporting & Analytics
- FR-RPT-01: Dashboard shall show KPIs: total products, total bins, low stock count, utilization %.
- FR-RPT-02: Analytics page shall include bar chart (zone utilization), line chart (movement trends), pie chart (overall utilization), and low stock table.
- FR-RPT-03: Admin can view complete audit log filtered by user, action, and date.

---

## 4. Non-Functional Requirements

| ID       | Requirement                                                  |
|----------|--------------------------------------------------------------|
| NFR-01   | API response time shall be under 500ms for 95% of requests.  |
| NFR-02   | System shall support 50 concurrent users without degradation. |
| NFR-03   | All API endpoints shall require authentication except login.  |
| NFR-04   | API shall be rate-limited: 60 req/hour unauthenticated, 1000 req/hour authenticated. |
| NFR-05   | Passwords shall be hashed using Django's PBKDF2 algorithm.   |
| NFR-06   | All data mutations shall be audit-logged.                     |
| NFR-07   | System shall be deployable via Docker Compose.               |
| NFR-08   | Frontend shall be responsive on desktop and tablet.          |

---

## 5. System Constraints
- Backend: Python 3.11, Django 4.x, Django REST Framework
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- Database: SQLite (development), PostgreSQL (production)
- Containerization: Docker + Docker Compose
- Authentication: JWT via djangorestframework-simplejwt