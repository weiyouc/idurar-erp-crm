# Functional Requirements Plan: Silverplan Procurement Management System

**Document Version:** 1.0  
**Date:** 2025-01-27  
**Project:** IDURAR ERP-CRM - Silverplan Customization  
**Status:** Requirements Definition Phase  
**Based On:** Gap Analysis Report v1.0

---

## Document Purpose

This document provides detailed functional requirements for the Silverplan Procurement Management System based on the gap analysis conducted against the current IDURAR ERP-CRM system. Each requirement is specified with clear acceptance criteria, priority levels, and dependencies.

---

## Document Structure

This functional requirements plan is organized into the following sections:

1. **System Foundation Requirements** - Core infrastructure needed for all modules
2. **Master Data Management** - Supplier and Material management
3. **Procurement Process Management** - Quotation, MRP, and Purchase Orders
4. **Financial Management** - Pre-payment and payment tracking
5. **System Features** - Export, reporting, and notifications
6. **Cross-cutting Requirements** - Security, audit, and performance

---

## Requirement Specification Format

Each requirement follows this format:

- **REQ-ID:** Unique identifier
- **Requirement Name:** Short descriptive name
- **Priority:** Critical / High / Medium / Low
- **Description:** Detailed requirement description
- **Acceptance Criteria:** Testable conditions for completion
- **Dependencies:** Related requirements
- **User Roles:** Roles that interact with this feature

---

## Table of Contents

1. [System Foundation Requirements](#1-system-foundation-requirements)
2. [Supplier Management](#2-supplier-management)
3. [Material Management](#3-material-management)
4. [Material Quotation Management](#4-material-quotation-management)
5. [Material Requirements Planning (MRP)](#5-material-requirements-planning-mrp)
6. [Purchase Order Management](#6-purchase-order-management)
7. [Pre-payment Management](#7-pre-payment-management)
8. [Excel Export Functionality](#8-excel-export-functionality)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Audit Logging and History](#10-audit-logging-and-history)
11. [Attachment Management](#11-attachment-management)
12. [System Performance and Usability](#12-system-performance-and-usability)

---

## 1. System Foundation Requirements

### 1.1 Workflow and Approval Engine

#### REQ-WF-001: Workflow Engine Core
- **Priority:** Critical
- **Description:** Implement a flexible workflow engine that supports configurable multi-level approval processes for all business documents (suppliers, quotations, purchase orders, pre-payments).
- **Acceptance Criteria:**
  - Engine supports defining workflows with multiple approval levels (up to 10 levels)
  - Each workflow step can be configured with approver roles
  - Workflows can be assigned to document types
  - System tracks current workflow state for each document
  - Workflow definitions can be created and modified through UI
- **Dependencies:** REQ-RBAC-001 (Role system)
- **User Roles:** System Administrator

#### REQ-WF-002: Multi-level Approval
- **Priority:** Critical
- **Description:** Support sequential multi-level approval workflows where each level must approve before proceeding to the next level.
- **Acceptance Criteria:**
  - Documents progress through approval levels sequentially
  - Each level can have one or multiple approvers
  - If multiple approvers at same level, support both "any" and "all" approval modes
  - Document status reflects current approval level
  - Approvers at each level can approve or reject
  - Rejection returns document to submitter or previous level (configurable)
- **Dependencies:** REQ-WF-001
- **User Roles:** All approver roles (Procurement Manager, Cost Center, Finance Director, General Manager)

#### REQ-WF-003: Amount-based Approval Routing
- **Priority:** Critical
- **Description:** Automatically route approvals based on document amount thresholds.
- **Acceptance Criteria:**
  - System allows configuration of amount thresholds for each approval level
  - Different document types can have different threshold configurations
  - System automatically determines required approval levels based on document amount
  - Approval routing can skip levels if amount is below threshold
  - Amount thresholds can be configured per currency
  - System displays required approval path at document creation
- **Dependencies:** REQ-WF-001, REQ-WF-002
- **User Roles:** System Administrator, all approver roles

#### REQ-WF-004: Approval Status Tracking
- **Priority:** Critical
- **Description:** Track and display approval status for all documents in workflow.
- **Acceptance Criteria:**
  - Document status includes: Draft, Pending Approval, Approved, Rejected, Cancelled
  - System shows current approval level and pending approvers
  - Users can view approval history with timestamps
  - Real-time status updates visible to submitter and approvers
  - Dashboard shows pending approvals for each user
  - Status changes trigger notifications (if notification system exists)
- **Dependencies:** REQ-WF-002
- **User Roles:** All users

#### REQ-WF-005: Approval Actions
- **Priority:** Critical
- **Description:** Approvers can perform approval actions with comments.
- **Acceptance Criteria:**
  - Approvers can approve or reject documents
  - Mandatory comment field for rejection
  - Optional comment field for approval
  - Approval action is timestamped and recorded
  - Approver identity is recorded
  - Documents can be recalled by submitter before first approval (configurable)
  - Approved documents cannot be edited (unless workflow supports revision)
- **Dependencies:** REQ-WF-002
- **User Roles:** All approver roles

#### REQ-WF-006: Conditional Routing Rules
- **Priority:** High
- **Description:** Support conditional routing based on business rules beyond amount (e.g., supplier classification, material category).
- **Acceptance Criteria:**
  - System supports rule-based routing conditions
  - Rules can be based on document attributes (supplier level, material type, etc.)
  - Multiple conditions can be combined with AND/OR logic
  - Rules are evaluated at workflow initiation
  - System logs which rules were applied
- **Dependencies:** REQ-WF-001
- **User Roles:** System Administrator

---

## 2. Supplier Management

### 2.1 Supplier Master Data

#### REQ-SUP-001: Supplier CRUD Operations
- **Priority:** Critical
- **Description:** System shall provide full Create, Read, Update, Delete operations for supplier master data.
- **Acceptance Criteria:**
  - Users can create new supplier records
  - Users can search and view supplier records
  - Users can update supplier information (subject to approval workflow for critical fields)
  - Users can deactivate (soft delete) suppliers
  - Supplier records include unique supplier ID (auto-generated)
  - System prevents deletion of suppliers referenced in other documents
- **Dependencies:** REQ-RBAC-002 (Permissions), REQ-AUDIT-001 (Audit logging)
- **User Roles:** Data Entry Personnel, Procurement Manager

#### REQ-SUP-002: Supplier Information Fields
- **Priority:** Critical
- **Description:** Supplier master data shall include comprehensive information fields.
- **Acceptance Criteria:**
  - **Basic Information:** Supplier Code, Supplier Name (Chinese & English), Short Name
  - **Contact Information:** Contact Person, Phone, Mobile, Email, Fax, Website
  - **Address Information:** Country, Province/State, City, Detailed Address, Postal Code
  - **Business Information:** Business License Number, Tax ID, Registration Date
  - **Banking Information:** Bank Name, Bank Account Number, Bank Branch, SWIFT Code
  - **Classification:** Supplier Type (Manufacturer, Trader, Service Provider), Industry Category
  - **Rating:** Supplier Level (A/B/C/D), Credit Rating
  - **Status:** Active, Inactive, Blacklisted, Under Review
  - **Other:** Payment Terms, Currency, Lead Time, Notes
  - All mandatory fields are enforced at creation
  - System validates email, phone formats
- **Dependencies:** REQ-SUP-001
- **User Roles:** Data Entry Personnel, Procurement Manager

#### REQ-SUP-003: Supplier Classification
- **Priority:** High
- **Description:** System shall support supplier classification and rating system.
- **Acceptance Criteria:**
  - Suppliers can be assigned to multiple categories
  - Supplier level (A/B/C/D) can be assigned and impacts approval workflow
  - System maintains classification history
  - Classification changes require approval for level A suppliers
  - Reports can be filtered by supplier classification
- **Dependencies:** REQ-SUP-001
- **User Roles:** Procurement Manager, Cost Center

#### REQ-SUP-004: Supplier Status Management
- **Priority:** High
- **Description:** System shall manage supplier lifecycle status.
- **Acceptance Criteria:**
  - Status values: Draft, Under Review, Active, Inactive, Blacklisted
  - Status transitions follow business rules
  - Only Active suppliers can be selected in purchase documents
  - Status change requires approval for critical transitions
  - System logs all status changes with reason
- **Dependencies:** REQ-SUP-001, REQ-AUDIT-001
- **User Roles:** Procurement Manager, General Manager

### 2.2 Supplier Onboarding Workflow

#### REQ-SUP-005: New Supplier Approval Workflow
- **Priority:** Critical
- **Description:** New supplier creation shall follow a multi-level approval workflow.
- **Acceptance Criteria:**
  - Workflow: Data Entry → Procurement Manager → Cost Center → General Manager (based on supplier level)
  - Level A suppliers require all approval levels
  - Level B/C suppliers may skip General Manager approval (configurable)
  - Each approver can approve, reject, or request modifications
  - System automatically advances to next approval level upon approval
  - Rejection returns to Data Entry with comments
  - Supplier record is "Under Review" status during approval
  - Upon final approval, supplier becomes "Active"
- **Dependencies:** REQ-WF-001, REQ-WF-002, REQ-SUP-001, REQ-SUP-004
- **User Roles:** Data Entry Personnel, Procurement Manager, Cost Center, General Manager

#### REQ-SUP-006: Supplier Document Attachment
- **Priority:** High
- **Description:** System shall support attaching required documents during supplier onboarding.
- **Acceptance Criteria:**
  - Required documents: Business License, Tax Registration Certificate, Bank Account Proof
  - Optional documents: Quality Certificates, ISO Certificates, Cooperation Agreement
  - System enforces required document upload before submission for approval
  - Documents are stored securely and linked to supplier record
  - Document types are predefined and selectable
  - Support multiple file formats (PDF, JPG, PNG, DOC, XLS)
  - Each document has upload date and uploader information
  - Approvers can view all attached documents
- **Dependencies:** REQ-SUP-001, REQ-ATT-001 (Attachment management)
- **User Roles:** Data Entry Personnel, all approver roles

### 2.3 Supplier Information Maintenance

#### REQ-SUP-007: Basic Information Update
- **Priority:** High
- **Description:** Basic supplier information can be updated directly without approval workflow.
- **Acceptance Criteria:**
  - Basic fields: Contact Person, Phone, Mobile, Email, Address, Notes
  - Changes are logged in audit trail
  - Users with edit permission can update immediately
  - No approval required for basic field changes
  - System records who changed what and when
  - Change history is viewable
- **Dependencies:** REQ-SUP-001, REQ-AUDIT-001
- **User Roles:** Data Entry Personnel, Procurement Manager

#### REQ-SUP-008: Critical Information Update Workflow
- **Priority:** Critical
- **Description:** Critical supplier information changes shall require approval workflow.
- **Acceptance Criteria:**
  - Critical fields: Bank Account Information, Business License, Tax ID, Supplier Level, Status
  - Change request workflow: Initiator → Procurement Manager → General Manager
  - System creates change request record
  - Original values are preserved during approval
  - Upon approval, changes are applied
  - Upon rejection, original values remain
  - Both old and new values are shown in approval screen
  - Change history maintains complete audit trail
- **Dependencies:** REQ-WF-001, REQ-SUP-001, REQ-AUDIT-002
- **User Roles:** Data Entry Personnel, Procurement Manager, General Manager

#### REQ-SUP-009: Supplier Information History
- **Priority:** Medium
- **Description:** System shall maintain complete history of supplier information changes.
- **Acceptance Criteria:**
  - All changes are recorded with timestamp and user
  - History shows old value, new value, change reason, and approver
  - Users can view change history for any supplier
  - History cannot be deleted or modified
  - Export capability for change history
  - Filter history by date range, field, or user
- **Dependencies:** REQ-AUDIT-002
- **User Roles:** Procurement Manager, Auditor

### 2.4 Supplier List and Search

#### REQ-SUP-010: Supplier Search and Filter
- **Priority:** High
- **Description:** System shall provide comprehensive search and filter capabilities for suppliers.
- **Acceptance Criteria:**
  - Quick search by: Supplier Code, Name, Contact Person
  - Advanced filter by: Status, Level, Category, Country, Creation Date
  - Search results display key information in table view
  - Results can be sorted by any column
  - Pagination for large result sets
  - Save search filters for reuse
  - Export search results to Excel
- **Dependencies:** REQ-SUP-001, REQ-EXP-001
- **User Roles:** All users

#### REQ-SUP-011: Supplier List View
- **Priority:** High
- **Description:** System shall provide a comprehensive supplier list view with key information.
- **Acceptance Criteria:**
  - List displays: Supplier Code, Name, Contact, Phone, Status, Level, Category
  - Customizable columns (user can show/hide columns)
  - Click on supplier to view full details
  - Bulk operations support (export, status change)
  - Real-time status indicators (Active, Inactive, Under Review)
  - Quick access to common actions (Edit, View Documents, History)
- **Dependencies:** REQ-SUP-001
- **User Roles:** All users

### 2.5 Supplier Excel Export

#### REQ-SUP-012: Supplier List Excel Export
- **Priority:** High
- **Description:** System shall support one-click export of supplier list to Excel format matching reference template.
- **Acceptance Criteria:**
  - Export button available on supplier list page
  - Excel file includes all supplier fields
  - File format matches reference template in `各报表清单格式 2025.12.23.xlsx`
  - Column headers in Chinese
  - Support for Chinese characters in data
  - Include only filtered/searched suppliers if filter is active
  - File naming convention: `供应商清单_YYYYMMDD_HHMMSS.xlsx`
  - Export completes within 30 seconds for up to 10,000 records
- **Dependencies:** REQ-EXP-001, REQ-SUP-001
- **User Roles:** Data Entry Personnel, Procurement Manager

---

## 3. Material Management

### 3.1 Material Master Data

#### REQ-MAT-001: Material CRUD Operations
- **Priority:** Critical
- **Description:** System shall provide full Create, Read, Update, Delete operations for material master data.
- **Acceptance Criteria:**
  - Users can create new material records
  - Users can search and view material records
  - Users can update material information
  - Users can deactivate (soft delete) materials
  - Material records include unique material ID/code (auto-generated or manual)
  - System prevents deletion of materials referenced in other documents
- **Dependencies:** REQ-RBAC-002
- **User Roles:** Data Entry Personnel, Procurement Manager, Engineering

#### REQ-MAT-002: Material Information Fields
- **Priority:** Critical
- **Description:** Material master data shall include comprehensive information fields.
- **Acceptance Criteria:**
  - **Identification:** Material Code, Material Name (Chinese & English), Short Name, Specification
  - **Classification:** Material Category, Material Type, Brand, Model
  - **Unit of Measure:** Base UOM, Alternative UOM, Conversion Factor
  - **Description:** Detailed Description, Technical Specifications, Drawing Number
  - **Procurement:** Default Supplier, Lead Time, MOQ, MPQ, Safety Stock Level
  - **Cost:** Standard Cost, Last Purchase Price, Currency
  - **Status:** Active, Inactive, Obsolete, Under Development
  - **Other:** Storage Conditions, Shelf Life, Hazardous Material Flag, Notes
  - All mandatory fields are enforced at creation
  - System validates material code uniqueness
- **Dependencies:** REQ-MAT-001
- **User Roles:** Data Entry Personnel, Engineering, Procurement Manager

#### REQ-MAT-003: Material Categories
- **Priority:** Medium
- **Description:** System shall support material categorization and classification.
- **Acceptance Criteria:**
  - Hierarchical category structure (Category → Sub-category → Item Type)
  - Materials can be assigned to one primary category
  - Category attributes can be inherited by materials
  - System maintains category tree management interface
  - Reports can be filtered by material category
- **Dependencies:** REQ-MAT-001
- **User Roles:** Procurement Manager, Engineering

#### REQ-MAT-004: Unit of Measure Management
- **Priority:** High
- **Description:** System shall support multiple units of measure for materials.
- **Acceptance Criteria:**
  - Define base UOM for each material (EA, KG, M, L, etc.)
  - Support alternative UOM with conversion factors
  - Automatic conversion in transactions
  - Common UOM library (predefined list)
  - Custom UOM can be added
- **Dependencies:** REQ-MAT-001
- **User Roles:** Data Entry Personnel, Engineering

#### REQ-MAT-005: Material Status Management
- **Priority:** High
- **Description:** System shall manage material lifecycle status.
- **Acceptance Criteria:**
  - Status values: Active, Inactive, Obsolete, Under Development
  - Only Active materials can be used in new purchase documents
  - Status change requires approval
  - System logs all status changes with reason
  - Obsolete materials display warning when referenced
- **Dependencies:** REQ-MAT-001, REQ-AUDIT-001
- **User Roles:** Engineering, Procurement Manager

### 3.2 Material List and Search

#### REQ-MAT-006: Material Search and Filter
- **Priority:** High
- **Description:** System shall provide comprehensive search and filter capabilities for materials.
- **Acceptance Criteria:**
  - Quick search by: Material Code, Name, Specification, Model
  - Advanced filter by: Category, Status, Supplier, Brand
  - Search results display key information in table view
  - Results can be sorted by any column
  - Pagination for large result sets
  - Save search filters for reuse
  - Export search results to Excel
- **Dependencies:** REQ-MAT-001, REQ-EXP-002
- **User Roles:** All users

#### REQ-MAT-007: Material List View
- **Priority:** High
- **Description:** System shall provide a comprehensive material list view with key information.
- **Acceptance Criteria:**
  - List displays: Material Code, Name, Specification, Category, UOM, Status, Last Price
  - Customizable columns (user can show/hide columns)
  - Click on material to view full details
  - Bulk operations support (export, status change)
  - Real-time status indicators
  - Quick access to pricing history and supplier information
- **Dependencies:** REQ-MAT-001
- **User Roles:** All users

### 3.3 Material Excel Export

#### REQ-MAT-008: Material List Excel Export
- **Priority:** High
- **Description:** System shall support one-click export of material list to Excel format matching reference template.
- **Acceptance Criteria:**
  - Export button available on material list page
  - Excel file includes all material fields
  - File format matches reference template in `各报表清单格式 2025.12.23.xlsx`
  - Column headers in Chinese
  - Support for Chinese characters in data
  - Include only filtered/searched materials if filter is active
  - File naming convention: `物料清单_YYYYMMDD_HHMMSS.xlsx`
  - Export completes within 30 seconds for up to 50,000 records
- **Dependencies:** REQ-EXP-002, REQ-MAT-001
- **User Roles:** Data Entry Personnel, Procurement Manager, Engineering

---

## 4. Material Quotation Management

### 4.1 Quotation Entry

#### REQ-QUO-001: Material Quotation Creation
- **Priority:** Critical
- **Description:** System shall allow purchasers to create material quotations with supplier pricing information.
- **Acceptance Criteria:**
  - Quotation includes: Material, Supplier, Unit Price, Currency, Quantity, Total Amount
  - Quotation Date and Valid Until date
  - Payment Terms, Delivery Terms
  - Lead Time, MOQ, MPQ
  - Reference Number (supplier's quotation number)
  - Notes and remarks
  - System validates all required fields
  - Quotation can be saved as draft or submitted for approval
- **Dependencies:** REQ-MAT-001, REQ-SUP-001
- **User Roles:** Purchaser, Procurement Manager

#### REQ-QUO-002: Quotation Document Attachment
- **Priority:** High
- **Description:** System shall support attaching quotation documents from suppliers.
- **Acceptance Criteria:**
  - Support PDF, Excel, Word, image formats
  - Multiple files can be attached
  - Each attachment labeled with description
  - Attachments viewable by approvers
  - File size limit: 10MB per file
  - Mandatory to attach at least one quotation document
- **Dependencies:** REQ-QUO-001, REQ-ATT-001
- **User Roles:** Purchaser

### 4.2 Quotation Approval Workflow

#### REQ-QUO-003: Quotation Approval Process
- **Priority:** Critical
- **Description:** Material quotations shall follow multi-level approval workflow.
- **Acceptance Criteria:**
  - Workflow: Purchaser (Submit) → Cost Center (Review) → Procurement Manager/GM (Approval)
  - Cost Center reviews: Currency, Unit Price, Amount calculations
  - Approval level determined by total amount threshold
  - Each approver can approve, reject, or request clarification
  - Rejection returns to purchaser with comments
  - Approved quotations can be used in purchase orders
  - System tracks approval history
- **Dependencies:** REQ-WF-001, REQ-WF-003, REQ-QUO-001
- **User Roles:** Purchaser, Cost Center, Procurement Manager, General Manager

#### REQ-QUO-004: Amount-based Quotation Approval
- **Priority:** Critical
- **Description:** Quotation approval routing shall be based on amount thresholds.
- **Acceptance Criteria:**
  - Configurable amount thresholds per currency
  - Example thresholds (TBD by business):
    - < 10,000 CNY: Procurement Manager
    - 10,000-50,000 CNY: Procurement Manager + Cost Center
    - > 50,000 CNY: Procurement Manager + Cost Center + General Manager
  - System automatically routes to appropriate approvers
  - Threshold configuration accessible to administrators
  - Amount calculated in base currency if needed
- **Dependencies:** REQ-QUO-003, REQ-WF-003
- **User Roles:** System Administrator, all approver roles

### 4.3 Price Strategy Management (Three-source Comparison)

#### REQ-QUO-005: Three-source Price Comparison
- **Priority:** Critical
- **Description:** System shall maintain three supplier price sources for each material with comparison capability.
- **Acceptance Criteria:**
  - For each material, maintain:
    - Supplier 1 (Preferred): Supplier, Unit Price, Currency, Lead Time, MOQ, MPQ
    - Supplier 2 (Alternative): Supplier, Unit Price, Currency, Lead Time, MOQ, MPQ
    - Supplier 3 (Alternative): Supplier, Unit Price, Currency, Lead Time, MOQ, MPQ
  - System marks one supplier as "Preferred"
  - Comparison table shows all three sources side-by-side
  - Prices can be compared in common currency
  - System highlights lowest price
  - Historical comparison data retained
- **Dependencies:** REQ-MAT-001, REQ-SUP-001, REQ-QUO-001
- **User Roles:** Purchaser, Procurement Manager, Cost Center

#### REQ-QUO-006: Lead Time and MOQ/MPQ Tracking
- **Priority:** High
- **Description:** System shall track lead time, minimum order quantity, and minimum package quantity for each supplier-material combination.
- **Acceptance Criteria:**
  - Lead Time stored in days
  - MOQ (Minimum Order Quantity) with UOM
  - MPQ (Minimum Package Quantity) with UOM
  - System validates purchase quantities against MOQ/MPQ
  - Warning if quantity below MOQ
  - System calculates estimated delivery date based on lead time
  - Historical lead time tracking for supplier performance
- **Dependencies:** REQ-QUO-005
- **User Roles:** Purchaser, Procurement Manager

#### REQ-QUO-007: Price Version Control and History
- **Priority:** High
- **Description:** System shall maintain complete price change history with version control.
- **Acceptance Criteria:**
  - Each price change creates new version
  - Version includes: Price, Effective Date, Valid Until, Changed By, Reason
  - System displays current price and price history
  - Ability to view price trend graph
  - Price history includes approval information
  - Export price history for materials
  - Compare prices across time periods
- **Dependencies:** REQ-QUO-001, REQ-AUDIT-002
- **User Roles:** Purchaser, Procurement Manager, Cost Center

### 4.4 Quotation List and Management

#### REQ-QUO-008: Quotation Search and Filter
- **Priority:** High
- **Description:** System shall provide comprehensive search and filter for quotations.
- **Acceptance Criteria:**
  - Search by: Material, Supplier, Date Range, Status, Approver
  - Filter by: Status (Draft, Pending, Approved, Rejected), Material Category, Supplier
  - Advanced filter with multiple conditions
  - Save filter templates
  - Export filtered results
- **Dependencies:** REQ-QUO-001
- **User Roles:** All procurement users

#### REQ-QUO-009: Quotation Status Management
- **Priority:** High
- **Description:** System shall manage quotation status throughout lifecycle.
- **Acceptance Criteria:**
  - Status values: Draft, Submitted, Under Review, Approved, Rejected, Expired, Cancelled
  - Status transitions follow business rules
  - Only approved and non-expired quotations usable in PO
  - System auto-expires quotations after valid until date
  - Status change notifications to relevant parties
- **Dependencies:** REQ-QUO-001, REQ-WF-004
- **User Roles:** Purchaser, all approver roles

### 4.5 Approval Permission Matrix

#### REQ-QUO-010: Configurable Approval Matrix
- **Priority:** Critical
- **Description:** System shall support configurable approval permission matrix based on amount and other criteria.
- **Acceptance Criteria:**
  - Matrix configuration by: Document Type, Amount Range, Material Category, Supplier Level
  - Define approvers at each level
  - Define approval sequence (sequential or parallel)
  - Matrix changes require admin approval
  - System validates matrix completeness
  - Export/import matrix configuration
  - Audit trail for matrix changes
- **Dependencies:** REQ-WF-001, REQ-WF-003, REQ-WF-006
- **User Roles:** System Administrator, General Manager

---

## 5. Material Requirements Planning (MRP)

### 5.1 MRP Calculation Engine

#### REQ-MRP-001: Automatic MRP Calculation
- **Priority:** Critical
- **Description:** System shall automatically calculate material requirements based on demand, inventory, and supply factors.
- **Acceptance Criteria:**
  - MRP calculation considers:
    - Current inventory levels (on-hand quantity)
    - In-transit quantities (open purchase orders)
    - Safety stock levels
    - Demand requirements (from sales orders or forecast)
    - Lead times
    - Minimum order quantities
  - Calculation formula: Net Requirement = Gross Requirement - On Hand - In Transit + Safety Stock
  - Suggested order quantity considers MOQ/MPQ
  - System calculates suggested order date based on lead time
  - MRP runs can be triggered manually or scheduled
  - Calculation completes within 5 minutes for 10,000 materials
- **Dependencies:** REQ-MAT-001, REQ-INV-001 (Inventory tracking), REQ-PO-001
- **User Roles:** Procurement Manager, MRP Planner

#### REQ-MRP-002: Inventory Level Tracking
- **Priority:** Critical
- **Description:** System shall track current inventory levels for MRP calculation.
- **Acceptance Criteria:**
  - Real-time or near-real-time inventory balance
  - Track by: Material, Location (warehouse), Batch/Lot (if applicable)
  - Inventory movements recorded: Receipt, Issue, Transfer, Adjustment
  - System validates inventory before MRP calculation
  - Negative inventory flagged as exception
  - Integration with inventory management system (if separate)
- **Dependencies:** REQ-MAT-001
- **User Roles:** Warehouse Personnel, MRP Planner

#### REQ-MRP-003: In-transit Quantity Tracking
- **Priority:** Critical
- **Description:** System shall track in-transit quantities from open purchase orders.
- **Acceptance Criteria:**
  - Sum of quantities from POs in status: Approved, In Transit
  - Group by material and expected delivery date
  - Include in MRP calculation as supply
  - Update in real-time when PO status changes
  - Show breakdown of in-transit by PO
- **Dependencies:** REQ-PO-001, REQ-PO-006
- **User Roles:** MRP Planner, Purchaser

#### REQ-MRP-004: Safety Stock Management
- **Priority:** High
- **Description:** System shall support safety stock level definition and management.
- **Acceptance Criteria:**
  - Safety stock defined at material level
  - Can be defined as fixed quantity or days of supply
  - System recommends safety stock based on historical consumption (optional)
  - Safety stock considered in MRP calculation
  - Alerts when stock falls below safety stock
  - Override capability for critical materials
- **Dependencies:** REQ-MAT-001, REQ-MRP-001
- **User Roles:** MRP Planner, Procurement Manager

#### REQ-MRP-005: Demand Requirement Input
- **Priority:** High
- **Description:** System shall accept demand requirements from various sources for MRP calculation.
- **Acceptance Criteria:**
  - Manual demand entry by material and required date
  - Import demand from sales orders (if integrated)
  - Import demand from production plans (if integrated)
  - Demand forecast entry
  - Demand can be tagged by source (sales order, forecast, etc.)
  - Historical demand visible for analysis
- **Dependencies:** REQ-MAT-001
- **User Roles:** MRP Planner, Sales Personnel

### 5.2 MRP List Management

#### REQ-MRP-006: MRP List Display
- **Priority:** Critical
- **Description:** System shall display MRP calculation results in a comprehensive list view.
- **Acceptance Criteria:**
  - MRP list shows: Material, Current Inventory, In Transit, Safety Stock, Gross Requirement, Net Requirement, Suggested Order Qty, Suggested Order Date
  - Color coding for urgency (red: immediate, yellow: within lead time, green: future)
  - Exception indicators (negative inventory, overdue orders)
  - Ability to drill down into calculation details
  - Show which demand orders drive the requirement
  - Refresh MRP list on demand
- **Dependencies:** REQ-MRP-001
- **User Roles:** MRP Planner, Purchaser, Procurement Manager

#### REQ-MRP-007: Multi-dimensional Filtering
- **Priority:** High
- **Description:** System shall support filtering MRP results by multiple dimensions.
- **Acceptance Criteria:**
  - Filter by: Material, Material Category, Supplier, Required Date Range
  - Filter by: Exception Type (negative inventory, below safety stock, overdue)
  - Combined filters with AND/OR logic
  - Quick filters for common scenarios
  - Save filter templates
  - Export filtered results
- **Dependencies:** REQ-MRP-006
- **User Roles:** MRP Planner, Purchaser

#### REQ-MRP-008: MRP Status Tracking
- **Priority:** Medium
- **Description:** System shall track status of MRP suggestions through to procurement action.
- **Acceptance Criteria:**
  - MRP line status: Suggested, Under Review, PO Created, Cancelled, Ignored
  - Link MRP suggestion to created purchase order
  - Track which MRP suggestions have been actioned
  - Report on MRP suggestion conversion rate
  - Archive old MRP runs with history
- **Dependencies:** REQ-MRP-006, REQ-PO-003
- **User Roles:** MRP Planner, Purchaser

### 5.3 MRP to Purchase Order Integration

#### REQ-MRP-009: Generate PO Draft from MRP
- **Priority:** High
- **Description:** System shall allow creating purchase order drafts directly from MRP suggestions.
- **Acceptance Criteria:**
  - Select one or multiple MRP lines
  - Auto-populate PO with: Material, Quantity (suggested), Supplier (preferred), Required Date
  - Group by supplier option (create one PO per supplier)
  - System pre-fills price from latest quotation
  - User can modify before submitting PO
  - Link between MRP suggestion and PO maintained
  - Update MRP status to "PO Created"
- **Dependencies:** REQ-MRP-006, REQ-PO-001, REQ-QUO-005
- **User Roles:** Purchaser

#### REQ-MRP-010: MRP Calculation Schedule
- **Priority:** Medium
- **Description:** System shall support scheduled automatic MRP calculation.
- **Acceptance Criteria:**
  - Configure MRP calculation schedule (daily, weekly, on-demand)
  - Scheduled runs execute at specified time
  - System notification when MRP calculation completes
  - View history of MRP runs
  - Compare MRP results between runs
  - Manual trigger option always available
- **Dependencies:** REQ-MRP-001
- **User Roles:** System Administrator, MRP Planner

### 5.4 MRP Excel Export

#### REQ-MRP-011: MRP List Excel Export
- **Priority:** High
- **Description:** System shall support one-click export of MRP list to Excel format matching reference template.
- **Acceptance Criteria:**
  - Export button available on MRP list page
  - Excel file includes all MRP fields
  - File format matches reference template in `各报表清单格式 2025.12.23.xlsx`
  - Column headers in Chinese
  - Include calculation details
  - Include only filtered/searched items if filter is active
  - File naming convention: `MRP清单_YYYYMMDD_HHMMSS.xlsx`
  - Export completes within 30 seconds for up to 10,000 lines
- **Dependencies:** REQ-EXP-003, REQ-MRP-006
- **User Roles:** MRP Planner, Purchaser, Procurement Manager

---

## 6. Purchase Order Management

### 6.1 Purchase Order Creation

#### REQ-PO-001: PO Creation and Entry
- **Priority:** Critical
- **Description:** System shall allow online creation and submission of purchase orders.
- **Acceptance Criteria:**
  - PO Header: PO Number (auto-generated), Date, Supplier, Currency, Payment Terms, Delivery Terms
  - PO Lines: Line No, Material Code, Description, Quantity, UOM, Unit Price, Amount, Required Delivery Date
  - Calculate line amount automatically (Qty × Price)
  - Calculate PO total (sum of line amounts)
  - Support multiple lines per PO
  - Add/edit/delete lines before submission
  - Save as draft or submit for approval
  - System validates all required fields
- **Dependencies:** REQ-MAT-001, REQ-SUP-001
- **User Roles:** Purchaser

#### REQ-PO-002: Standard PO Fields
- **Priority:** Critical
- **Description:** Purchase orders shall maintain standard fields matching existing format.
- **Acceptance Criteria:**
  - Standard fields: Project, Material Code, Description, Quantity, Delivery Date, Unit Price, Amount
  - Optional fields: Tax Rate, Tax Amount, Discount, Notes
  - Line-level remarks field
  - PO-level terms and conditions
  - Shipping address and contact
  - All fields from reference format included
- **Dependencies:** REQ-PO-001
- **User Roles:** Purchaser

#### REQ-PO-003: Internal Traceability Fields
- **Priority:** High
- **Description:** Purchase orders shall include internal traceability fields not shown to suppliers.
- **Acceptance Criteria:**
  - Internal fields (not on supplier copy):
    - Actual Receipt Date (populated after goods receipt)
    - Customer Order Number
    - Customer Model/Part Number
    - Internal Sales Order Number (SO#)
    - Internal Model/Part Number
    - Purpose/Project Code
  - Fields visible only to internal users
  - Fields excluded from supplier PO print/PDF
  - Enable cost traceability from customer order to procurement
  - Reporting by customer order or internal SO
- **Dependencies:** REQ-PO-001, REQ-RBAC-002
- **User Roles:** Purchaser, Procurement Manager, Cost Center

#### REQ-PO-004: Generate PO from MRP
- **Priority:** High
- **Description:** System shall support generating PO draft from MRP suggestions.
- **Acceptance Criteria:**
  - Select MRP lines and click "Create PO"
  - System auto-fills: Material, Quantity, Supplier (preferred), Price (from latest quotation)
  - Suggested delivery date calculated from requirement date minus lead time
  - User can modify all fields before submission
  - Multiple materials can be added to one PO
  - Link maintained between MRP and PO
- **Dependencies:** REQ-MRP-009, REQ-PO-001
- **User Roles:** Purchaser

### 6.2 Purchase Order Approval Workflow

#### REQ-PO-005: PO Approval Process
- **Priority:** Critical
- **Description:** Purchase orders shall follow multi-level approval workflow.
- **Acceptance Criteria:**
  - Workflow: Purchaser (Create) → Procurement Manager → Higher Level (amount-based)
  - Approval levels determined by PO total amount
  - Each approver can approve, reject, or request changes
  - Rejection returns to purchaser with comments
  - Approved POs can be sent to supplier
  - System tracks full approval history
  - Approval notifications sent to next approver
- **Dependencies:** REQ-WF-001, REQ-WF-002, REQ-PO-001
- **User Roles:** Purchaser, Procurement Manager, General Manager

#### REQ-PO-006: Amount-based PO Approval
- **Priority:** Critical
- **Description:** PO approval routing shall be based on amount thresholds.
- **Acceptance Criteria:**
  - Configurable amount thresholds per currency
  - Example thresholds (TBD by business):
    - < 20,000 CNY: Procurement Manager only
    - 20,000-100,000 CNY: Procurement Manager + Cost Center
    - > 100,000 CNY: Procurement Manager + Cost Center + General Manager
  - System automatically routes based on PO total
  - Threshold configuration by administrators
  - Multi-currency support with base currency conversion
- **Dependencies:** REQ-PO-005, REQ-WF-003
- **User Roles:** System Administrator, all approver roles

### 6.3 Purchase Order Status Tracking

#### REQ-PO-007: PO Status Lifecycle
- **Priority:** Critical
- **Description:** System shall track purchase order status through complete lifecycle.
- **Acceptance Criteria:**
  - Status values: Draft, Submitted, Under Approval, Approved, Sent to Supplier, In Transit, Partially Received, Received, Closed, Cancelled
  - Status transitions follow business rules
  - Only approved POs can be sent to supplier
  - System prevents editing after approval (requires change order)
  - Status history maintained with timestamps
  - Status visible to all relevant parties
  - Dashboard showing PO counts by status
- **Dependencies:** REQ-PO-001, REQ-WF-004
- **User Roles:** Purchaser, all approver roles, Warehouse Personnel

#### REQ-PO-008: Goods Receipt Against PO
- **Priority:** High
- **Description:** System shall support recording goods receipt against purchase orders.
- **Acceptance Criteria:**
  - Select PO and enter received quantity per line
  - Actual receipt date recorded
  - Partial receipts supported (multiple receipts per PO line)
  - System updates: Received Quantity, Outstanding Quantity, PO Line Status
  - PO status updates to "Partially Received" or "Received" accordingly
  - Over-receipt tolerance configurable (e.g., 10%)
  - Under-receipt tracked
  - Receipt history viewable
  - Update "Actual Receipt Date" internal field
- **Dependencies:** REQ-PO-007, REQ-PO-003
- **User Roles:** Warehouse Personnel, Purchaser

#### REQ-PO-009: PO Closing and Cancellation
- **Priority:** Medium
- **Description:** System shall support closing and cancelling purchase orders.
- **Acceptance Criteria:**
  - Close PO manually when all items received and accepted
  - Auto-close option when received qty equals ordered qty
  - Cancel PO before goods receipt (requires approval)
  - Cancelled PO cannot be reinstated
  - Closed PO cannot be reopened (unless permissions allow)
  - Reason required for cancellation
  - Status change logged in audit trail
- **Dependencies:** REQ-PO-007
- **User Roles:** Purchaser, Procurement Manager

### 6.4 PO Query and Reporting

#### REQ-PO-010: Multi-condition PO Search
- **Priority:** High
- **Description:** System shall provide comprehensive search and filter capabilities for purchase orders.
- **Acceptance Criteria:**
  - Search by: PO Number, Supplier, Material, Date Range, Status, Approver
  - Advanced filter: Amount Range, Project, Customer Order, Internal SO
  - Multiple filter conditions with AND/OR logic
  - Quick filters for common scenarios (my POs, pending approval, overdue delivery)
  - Save search templates
  - Search results exportable to Excel
- **Dependencies:** REQ-PO-001
- **User Roles:** All procurement users

#### REQ-PO-011: PO Statistics and Reports
- **Priority:** Medium
- **Description:** System shall provide statistical reports and analytics for purchase orders.
- **Acceptance Criteria:**
  - Reports: PO by Status, PO by Supplier, PO by Period, PO by Material Category
  - Analytics: Average PO value, PO count trend, Supplier performance
  - Overdue PO report (expected delivery date passed)
  - Open PO report (not yet received)
  - Cost analysis by customer order (using traceability fields)
  - Export all reports to Excel
- **Dependencies:** REQ-PO-001, REQ-PO-007
- **User Roles:** Procurement Manager, Cost Center, General Manager

### 6.5 PO Documentation and Communication

#### REQ-PO-012: PO Document Generation
- **Priority:** High
- **Description:** System shall generate purchase order documents for suppliers.
- **Acceptance Criteria:**
  - Generate PO PDF for supplier (excluding internal fields)
  - Standard PO format with company header and footer
  - Include: PO number, date, supplier details, line items, terms
  - Multi-language support (Chinese/English)
  - Company logo and signature block
  - Generate button available after approval
  - Re-generate capability
- **Dependencies:** REQ-PO-001, REQ-PO-005
- **User Roles:** Purchaser

#### REQ-PO-013: PO Attachment Management
- **Priority:** Medium
- **Description:** System shall support attaching documents to purchase orders.
- **Acceptance Criteria:**
  - Attach supporting documents (quotations, specifications, drawings)
  - Multiple files per PO
  - Common formats supported (PDF, Excel, Word, images)
  - Attachments accessible to approvers and supplier (if configured)
  - File size limit: 10MB per file
  - Download all attachments as zip
- **Dependencies:** REQ-PO-001, REQ-ATT-001
- **User Roles:** Purchaser

### 6.6 PO Excel Export

#### REQ-PO-014: PO List Excel Export
- **Priority:** High
- **Description:** System shall support one-click export of purchase order list to Excel format matching reference template.
- **Acceptance Criteria:**
  - Export button available on PO list page
  - Excel file includes all PO fields (including internal traceability fields)
  - File format matches reference template in `各报表清单格式 2025.12.23.xlsx`
  - Column headers in Chinese
  - Include PO lines (one line per Excel row)
  - Include only filtered/searched POs if filter is active
  - File naming convention: `采购订单清单_YYYYMMDD_HHMMSS.xlsx`
  - Export completes within 30 seconds for up to 5,000 POs
- **Dependencies:** REQ-EXP-004, REQ-PO-001
- **User Roles:** Purchaser, Procurement Manager, Cost Center

---

## 7. Pre-payment Management

### 7.1 Pre-payment Application

#### REQ-PAY-001: Pre-payment Application Creation
- **Priority:** High
- **Description:** System shall allow creation of pre-payment applications linked to approved purchase orders.
- **Acceptance Criteria:**
  - Application includes: PO reference (mandatory), Payment Amount, Currency, Payment Date
  - Payment Terms reference
  - Pre-payment percentage of PO total
  - Reason/justification field
  - Supporting documents attachment
  - System validates PO is approved before allowing pre-payment
  - Cannot exceed PO total amount
  - Save as draft or submit for approval
- **Dependencies:** REQ-PO-001, REQ-PO-005
- **User Roles:** Purchaser, Procurement Specialist

#### REQ-PAY-002: Pre-payment Application Conditions
- **Priority:** High
- **Description:** System shall enforce pre-payment application business rules.
- **Acceptance Criteria:**
  - Pre-payment only allowed if:
    - Contract/PO specifies pre-payment terms
    - Supplier meets pre-payment eligibility criteria
    - Supplier has "Active" status
    - Supplier cooperation history meets threshold (configurable)
  - System validates conditions before submission
  - Display eligibility check results
  - Override capability with special approval (configurable)
  - Audit log for overrides
- **Dependencies:** REQ-PAY-001, REQ-SUP-001
- **User Roles:** Purchaser, Procurement Manager

### 7.2 Pre-payment Approval Workflow

#### REQ-PAY-003: Pre-payment Approval Process
- **Priority:** High
- **Description:** Pre-payment applications shall follow multi-level approval workflow.
- **Acceptance Criteria:**
  - Workflow: Purchaser → Procurement Manager → Finance Director → General Manager
  - All levels required for pre-payments (regardless of amount)
  - Finance Director validates payment terms and cash flow impact
  - Each approver can approve, reject, or request information
  - Rejection returns to purchaser with comments
  - Approved applications ready for payment execution
  - System tracks full approval history
- **Dependencies:** REQ-WF-001, REQ-WF-002, REQ-PAY-001
- **User Roles:** Purchaser, Procurement Manager, Finance Director, General Manager

#### REQ-PAY-004: Amount-based Pre-payment Approval
- **Priority:** Medium
- **Description:** Pre-payment approval may include amount-based thresholds (optional enhancement).
- **Acceptance Criteria:**
  - Configurable amount thresholds for pre-payments
  - Small pre-payments may skip General Manager (if configured)
  - Thresholds defined per currency
  - System automatically routes based on amount
  - Default: all levels required
- **Dependencies:** REQ-PAY-003, REQ-WF-003
- **User Roles:** System Administrator, all approver roles

### 7.3 Pre-payment Tracking

#### REQ-PAY-005: Pre-payment Status Tracking
- **Priority:** High
- **Description:** System shall track pre-payment application status through lifecycle.
- **Acceptance Criteria:**
  - Status values: Draft, Submitted, Under Approval, Approved, Payment Processed, Cancelled
  - Link to related PO always visible
  - Payment execution date recorded
  - Payment reference number captured
  - Integration with financial system (if available) for payment confirmation
  - Status history with timestamps
- **Dependencies:** REQ-PAY-001, REQ-WF-004
- **User Roles:** Purchaser, Finance Personnel, all approver roles

#### REQ-PAY-006: Pre-payment History and Reporting
- **Priority:** Medium
- **Description:** System shall maintain pre-payment history and provide reports.
- **Acceptance Criteria:**
  - View all pre-payments by supplier
  - View all pre-payments by PO
  - Pre-payment aging report
  - Outstanding pre-payment report
  - Pre-payment vs actual cost reconciliation
  - Export reports to Excel
- **Dependencies:** REQ-PAY-005
- **User Roles:** Finance Personnel, Procurement Manager, Auditor

---

## 8. Excel Export Functionality

### 8.1 General Export Requirements

#### REQ-EXP-001: Supplier List Excel Export
- **Priority:** High
- **Description:** Export supplier list to Excel format matching reference template.
- **Acceptance Criteria:**
  - See REQ-SUP-012 for detailed requirements
  - Uses standard export service
  - Template format: `各报表清单格式 2025.12.23.xlsx` - Supplier tab
- **Dependencies:** None (foundational)
- **User Roles:** Data Entry Personnel, Procurement Manager

#### REQ-EXP-002: Material List Excel Export
- **Priority:** High
- **Description:** Export material list to Excel format matching reference template.
- **Acceptance Criteria:**
  - See REQ-MAT-008 for detailed requirements
  - Uses standard export service
  - Template format: `各报表清单格式 2025.12.23.xlsx` - Items tab
- **Dependencies:** None (foundational)
- **User Roles:** Data Entry Personnel, Procurement Manager, Engineering

#### REQ-EXP-003: MRP List Excel Export
- **Priority:** High
- **Description:** Export MRP list to Excel format matching reference template.
- **Acceptance Criteria:**
  - See REQ-MRP-011 for detailed requirements
  - Uses standard export service
  - Template format: `各报表清单格式 2025.12.23.xlsx` - MRP tab
- **Dependencies:** None (foundational)
- **User Roles:** MRP Planner, Purchaser, Procurement Manager

#### REQ-EXP-004: Purchase Order List Excel Export
- **Priority:** High
- **Description:** Export purchase order list to Excel format matching reference template.
- **Acceptance Criteria:**
  - See REQ-PO-014 for detailed requirements
  - Uses standard export service
  - Template format: `各报表清单格式 2025.12.23.xlsx` - PO tab
- **Dependencies:** None (foundational)
- **User Roles:** Purchaser, Procurement Manager, Cost Center

### 8.2 Export Service Requirements

#### REQ-EXP-005: Generic Excel Export Service
- **Priority:** High
- **Description:** System shall provide a reusable Excel export service for all modules.
- **Acceptance Criteria:**
  - Service accepts: Data source, Template format, Column mapping
  - Generates Excel file in XLSX format
  - Support for Chinese characters (UTF-8 encoding)
  - Cell formatting: headers bold, data auto-fit columns
  - Include filters on header row
  - Maximum rows: 100,000 per file
  - Performance: Export up to 10,000 rows in < 30 seconds
  - Error handling for large datasets
- **Dependencies:** None (foundational)
- **User Roles:** All users (via specific export features)

#### REQ-EXP-006: Template Format Compliance
- **Priority:** High
- **Description:** All Excel exports shall match reference template formats.
- **Acceptance Criteria:**
  - Column order matches reference template
  - Column headers in Chinese (matching template)
  - Data format matches template (dates, numbers, text)
  - Include all columns from template
  - Optional: Allow user to select columns to export
  - Template version tracking
- **Dependencies:** REQ-EXP-005
- **User Roles:** All users

#### REQ-EXP-007: Export Download and Storage
- **Priority:** Medium
- **Description:** System shall handle export file download and temporary storage.
- **Acceptance Criteria:**
  - Files generated on server and available for download
  - Download link expires after 24 hours
  - Temporary files cleaned up automatically
  - File naming includes timestamp for uniqueness
  - User notified when export is ready (for large exports)
  - Export history viewable (last 30 days)
- **Dependencies:** REQ-EXP-005
- **User Roles:** All users

---

## 9. Role-Based Access Control

### 9.1 Role Management

#### REQ-RBAC-001: User Role System
- **Priority:** Critical
- **Description:** System shall support a comprehensive role-based access control system.
- **Acceptance Criteria:**
  - Predefined roles: Data Entry Personnel, Purchaser, Procurement Manager, Cost Center, Finance Director, Finance Personnel, Warehouse Personnel, General Manager, System Administrator, Auditor
  - Users can be assigned one or multiple roles
  - Role definitions include: permissions, approval authority, module access
  - Role hierarchy supported (inherits permissions from lower roles)
  - Role assignment requires admin approval
  - Audit log for role assignments
- **Dependencies:** None (foundational)
- **User Roles:** System Administrator, General Manager

#### REQ-RBAC-002: Permission Framework
- **Priority:** Critical
- **Description:** System shall implement granular permission control for all operations.
- **Acceptance Criteria:**
  - Permissions defined for: Create, Read, Update, Delete, Approve, Export
  - Module-level permissions (e.g., access to Supplier module, Material module)
  - Function-level permissions (e.g., create supplier, approve quotation)
  - Field-level permissions (e.g., view bank details, edit price)
  - Permissions assigned to roles, not individuals
  - Permission check enforced at API level and UI level
  - Unauthorized access attempts logged
- **Dependencies:** REQ-RBAC-001
- **User Roles:** System Administrator

#### REQ-RBAC-003: Data Access Control
- **Priority:** High
- **Description:** System shall control data access based on user roles and organizational hierarchy.
- **Acceptance Criteria:**
  - Users see only data they have permission to access
  - Purchasers see their own POs and team POs
  - Managers see all subordinate data
  - Sensitive fields hidden for users without permission
  - Approval queue shows only items pending user's approval
  - Cross-module security (e.g., can't create PO without supplier access)
- **Dependencies:** REQ-RBAC-002
- **User Roles:** All users

#### REQ-RBAC-004: Role-specific Dashboards
- **Priority:** Medium
- **Description:** System shall provide role-specific dashboard views.
- **Acceptance Criteria:**
  - Dashboard content customized per role
  - Purchaser: Pending approvals, my POs, overdue deliveries
  - Manager: Team performance, approval queue, budget status
  - Finance: Payment due, pre-payment requests, cost analysis
  - General Manager: Executive summary, critical approvals, KPIs
  - Widgets configurable by user within role constraints
- **Dependencies:** REQ-RBAC-001
- **User Roles:** All users

### 9.2 Approval Authority

#### REQ-RBAC-005: Approval Permission Assignment
- **Priority:** Critical
- **Description:** System shall assign approval authority based on roles and thresholds.
- **Acceptance Criteria:**
  - Approval authority defined by: Role, Document Type, Amount Threshold
  - Multiple approvers per level supported
  - Backup approvers configurable (for absence)
  - Approval delegation capability (temporary)
  - Authority matrix configurable by administrators
  - Changes to approval authority require high-level approval
- **Dependencies:** REQ-RBAC-001, REQ-WF-003
- **User Roles:** System Administrator, General Manager

#### REQ-RBAC-006: Field-level Security
- **Priority:** Medium
- **Description:** System shall support field-level view and edit permissions.
- **Acceptance Criteria:**
  - Sensitive fields: Bank Account Details, Price Information, Cost Data
  - Define view and edit permissions separately per field
  - Fields without permission: hidden or masked
  - Field permissions enforced in API and UI
  - Audit log for sensitive field access
  - Override capability for administrators
- **Dependencies:** REQ-RBAC-002
- **User Roles:** System Administrator

---

## 10. Audit Logging and History

### 10.1 Audit Logging

#### REQ-AUDIT-001: Operation Audit Log
- **Priority:** Medium
- **Description:** System shall maintain comprehensive audit logs for all operations.
- **Acceptance Criteria:**
  - Log all operations: Create, Read (for sensitive data), Update, Delete, Approve, Reject
  - Log includes: User, Timestamp, Operation Type, Entity Type, Entity ID, Old Value, New Value
  - Logs stored in separate audit table (not in main tables)
  - Logs cannot be modified or deleted by regular users
  - Log retention: minimum 7 years
  - Log search and filter capabilities
  - Export logs for audit purposes
- **Dependencies:** None (foundational)
- **User Roles:** System Administrator, Auditor

#### REQ-AUDIT-002: Change History Tracking
- **Priority:** Medium
- **Description:** System shall track complete change history for critical entities.
- **Acceptance Criteria:**
  - Track changes for: Suppliers, Materials, Quotations, Purchase Orders
  - History includes: Field Name, Old Value, New Value, Changed By, Change Date, Reason
  - Version control for major changes
  - View change history from entity detail page
  - Compare any two versions side-by-side
  - Export change history to Excel
  - Cannot modify or delete history
- **Dependencies:** REQ-AUDIT-001
- **User Roles:** All users (view), Auditor (full access)

#### REQ-AUDIT-003: Approval History
- **Priority:** High
- **Description:** System shall maintain complete approval history for all workflows.
- **Acceptance Criteria:**
  - Approval history includes: Approver, Approval Level, Action (Approve/Reject), Timestamp, Comments
  - History visible to document creator and approvers
  - Show full approval chain with timestamps
  - Indicate current approval status and next approver
  - Approval history cannot be modified
  - Include in document audit trail
- **Dependencies:** REQ-WF-004, REQ-AUDIT-001
- **User Roles:** All users (view own documents), Managers (view team documents)

### 10.2 Version Control

#### REQ-AUDIT-004: Price Change Version Control
- **Priority:** High
- **Description:** System shall maintain version control for price changes.
- **Acceptance Criteria:**
  - Each price change creates new version
  - Version includes: Version Number, Effective Date, Old Price, New Price, Changed By, Approval Status
  - View all versions for a material-supplier combination
  - Ability to view price as of specific date
  - Price trend analysis and graphing
  - Compare prices between versions
- **Dependencies:** REQ-QUO-007, REQ-AUDIT-002
- **User Roles:** Purchaser, Procurement Manager, Cost Center

#### REQ-AUDIT-005: Document Version Control
- **Priority:** Medium
- **Description:** System shall support document versioning for major changes after approval.
- **Acceptance Criteria:**
  - Major change to approved document creates new version
  - Version includes: Version Number, Change Date, Changed By, Change Summary
  - View all versions of a document
  - Compare versions side-by-side
  - Print/export specific version
  - Original version always retained
- **Dependencies:** REQ-AUDIT-002
- **User Roles:** Document owners, Managers, Auditor

---

## 11. Attachment Management

### 11.1 File Attachment

#### REQ-ATT-001: File Upload and Storage
- **Priority:** High
- **Description:** System shall support file attachment for all major entities.
- **Acceptance Criteria:**
  - Support for: Suppliers, Materials, Quotations, Purchase Orders, Pre-payments
  - Supported formats: PDF, Word (doc/docx), Excel (xls/xlsx), Images (jpg/png), ZIP
  - File size limit: 10MB per file, 50MB total per entity
  - Virus scanning on upload (if available)
  - Storage: Local server or cloud (S3-compatible)
  - Files organized by entity type and entity ID
  - Automatic thumbnail generation for images
- **Dependencies:** None (foundational, leverages existing upload infrastructure)
- **User Roles:** All users with create/edit permissions

#### REQ-ATT-002: File Metadata and Organization
- **Priority:** Medium
- **Description:** System shall maintain file metadata and support organization.
- **Acceptance Criteria:**
  - Metadata: File Name, File Type, File Size, Upload Date, Uploaded By, Description
  - Document type classification (e.g., Business License, Quotation, Specification)
  - Required vs optional attachments defined per entity
  - System enforces required attachments before submission
  - Bulk upload capability
  - Drag-and-drop interface
- **Dependencies:** REQ-ATT-001
- **User Roles:** All users with create/edit permissions

#### REQ-ATT-003: File Download and Access
- **Priority:** Medium
- **Description:** System shall control file download and access based on permissions.
- **Acceptance Criteria:**
  - Download individual file or all files as ZIP
  - View permissions enforced (only users with entity access can download)
  - Download logged in audit trail for sensitive documents
  - File preview for common formats (PDF, images)
  - Download count tracked
  - Expired links for shared files (if external sharing supported)
- **Dependencies:** REQ-ATT-001, REQ-RBAC-003
- **User Roles:** All users with read permissions

### 11.2 Attachment Versioning

#### REQ-ATT-004: File Version Control
- **Priority:** Low
- **Description:** System shall support file versioning for important documents.
- **Acceptance Criteria:**
  - Upload new version of existing file
  - Maintain version history with timestamps
  - View all versions of a file
  - Download specific version
  - Latest version is default
  - Version notes field
  - Mark versions as obsolete
- **Dependencies:** REQ-ATT-001
- **User Roles:** Users with edit permissions

---

## 12. System Performance and Usability

### 12.1 Performance Requirements

#### REQ-PERF-001: Response Time
- **Priority:** High
- **Description:** System shall meet response time requirements for all operations.
- **Acceptance Criteria:**
  - Page load: < 2 seconds for standard pages
  - Search results: < 3 seconds for up to 10,000 records
  - Save operation: < 1 second
  - List views: < 2 seconds for pagination
  - Dashboard: < 3 seconds initial load
  - Excel export: < 30 seconds for up to 10,000 rows
  - MRP calculation: < 5 minutes for 10,000 materials
- **Dependencies:** None (system-wide)
- **User Roles:** All users

#### REQ-PERF-002: Concurrent Users
- **Priority:** High
- **Description:** System shall support specified number of concurrent users.
- **Acceptance Criteria:**
  - Support 50 concurrent users with no performance degradation
  - Support 100 concurrent users with acceptable performance
  - Load testing performed before production
  - System scales horizontally if needed
  - Database connection pooling optimized
- **Dependencies:** None (system-wide)
- **User Roles:** All users

#### REQ-PERF-003: Data Volume
- **Priority:** Medium
- **Description:** System shall handle expected data volumes without performance issues.
- **Acceptance Criteria:**
  - Support 100,000 materials
  - Support 50,000 suppliers
  - Support 500,000 purchase order lines per year
  - Support 1 million transaction records
  - Database indexing optimized for performance
  - Archive strategy for old data
- **Dependencies:** None (system-wide)
- **User Roles:** All users

### 12.2 Usability Requirements

#### REQ-USE-001: User Interface Standards
- **Priority:** High
- **Description:** System shall provide consistent and intuitive user interface.
- **Acceptance Criteria:**
  - Responsive design (desktop, tablet, mobile)
  - Consistent navigation structure
  - Consistent button placement and styling
  - Form validation with clear error messages
  - Progress indicators for long operations
  - Confirmation dialogs for destructive actions
  - Help icons with tooltips
  - Breadcrumb navigation
- **Dependencies:** None (system-wide)
- **User Roles:** All users

#### REQ-USE-002: Multi-language Support
- **Priority:** High
- **Description:** System shall support multiple languages.
- **Acceptance Criteria:**
  - Primary language: Simplified Chinese
  - Secondary language: English
  - Language selection per user
  - All UI elements translated
  - Data entry supports Chinese and English
  - Reports support both languages
  - Date and number formatting per locale
- **Dependencies:** None (system-wide)
- **User Roles:** All users

#### REQ-USE-003: Help and Documentation
- **Priority:** Medium
- **Description:** System shall provide comprehensive help and documentation.
- **Acceptance Criteria:**
  - Online help accessible from all pages
  - User manual available in PDF
  - Context-sensitive help
  - Video tutorials for key processes
  - FAQ section
  - Search capability in help system
  - Regular updates to documentation
- **Dependencies:** None (system-wide)
- **User Roles:** All users

#### REQ-USE-004: Notification System
- **Priority:** Medium
- **Description:** System shall provide notification system for important events.
- **Acceptance Criteria:**
  - In-app notifications (bell icon with count)
  - Email notifications (configurable)
  - Notification types: Approval requests, approval decisions, status changes, reminders
  - User can configure notification preferences
  - Notification history viewable
  - Mark as read/unread
  - Priority levels (urgent, normal, info)
- **Dependencies:** None (system-wide)
- **User Roles:** All users

---

## Appendix A: Requirements Traceability Matrix

| Requirement ID | Priority | Module | Dependencies | Linked Requirements |
|---------------|----------|---------|--------------|---------------------|
| REQ-WF-001 | Critical | Workflow | REQ-RBAC-001 | All approval requirements |
| REQ-SUP-001 | Critical | Supplier | REQ-RBAC-002, REQ-AUDIT-001 | REQ-SUP-002 through REQ-SUP-012 |
| REQ-MAT-001 | Critical | Material | REQ-RBAC-002 | REQ-MAT-002 through REQ-MAT-008 |
| REQ-QUO-001 | Critical | Quotation | REQ-MAT-001, REQ-SUP-001 | REQ-QUO-002 through REQ-QUO-010 |
| REQ-MRP-001 | Critical | MRP | REQ-MAT-001, REQ-INV-001, REQ-PO-001 | REQ-MRP-002 through REQ-MRP-011 |
| REQ-PO-001 | Critical | Purchase Order | REQ-MAT-001, REQ-SUP-001 | REQ-PO-002 through REQ-PO-014 |
| REQ-PAY-001 | High | Pre-payment | REQ-PO-001, REQ-PO-005 | REQ-PAY-002 through REQ-PAY-006 |
| REQ-EXP-001 | High | Export | None | REQ-EXP-005, REQ-EXP-006 |
| REQ-RBAC-001 | Critical | Security | None | All access control requirements |
| REQ-AUDIT-001 | Medium | Audit | None | All history requirements |
| REQ-ATT-001 | High | Attachment | None | All attachment requirements |
| REQ-PERF-001 | High | Performance | None | System-wide |

---

## Appendix B: User Roles and Responsibilities

| Role | Responsibilities | Key Permissions | Approval Authority |
|------|------------------|-----------------|-------------------|
| System Administrator | System configuration, user management, role assignment | Full system access | No approval authority |
| General Manager | Executive oversight, final approvals | View all data, approve high-value items | Final approval on all critical documents |
| Procurement Manager | Procurement oversight, team management | Manage procurement operations | Approve POs, quotations based on threshold |
| Cost Center | Cost analysis, price review | View/analyze all cost data | Approve quotations, validate prices |
| Finance Director | Financial oversight, payment approval | View financial data, approve payments | Approve pre-payments |
| Finance Personnel | Payment processing, financial tracking | Process payments, view finance data | No approval authority |
| Purchaser | Create POs, quotations, manage suppliers | Create/edit procurement documents | No approval authority (submitter) |
| Data Entry Personnel | Data entry, supplier/material maintenance | Create/edit master data | No approval authority |
| MRP Planner | MRP execution, requirement planning | Run MRP, view all materials/inventory | No approval authority |
| Warehouse Personnel | Goods receipt, inventory management | Receive goods, update inventory | No approval authority |
| Engineering | Material specification, technical review | Create/edit material specifications | No approval authority |
| Auditor | Audit review, compliance check | View all data, access logs | No approval authority |

---

## Appendix C: Implementation Priority Summary

### Phase 1: Foundation (Weeks 1-4)
- REQ-RBAC-001 through REQ-RBAC-006: Role and Permission System
- REQ-WF-001 through REQ-WF-006: Workflow Engine
- REQ-AUDIT-001 through REQ-AUDIT-003: Audit Logging
- REQ-ATT-001 through REQ-ATT-003: Attachment Management

### Phase 2: Master Data (Weeks 5-8)
- REQ-SUP-001 through REQ-SUP-012: Supplier Management
- REQ-MAT-001 through REQ-MAT-008: Material Management

### Phase 3: Procurement Processes (Weeks 9-14)
- REQ-QUO-001 through REQ-QUO-010: Material Quotation Management
- REQ-PO-001 through REQ-PO-014: Purchase Order Management
- REQ-PAY-001 through REQ-PAY-006: Pre-payment Management

### Phase 4: Planning and Integration (Weeks 15-20)
- REQ-MRP-001 through REQ-MRP-011: MRP Module
- REQ-EXP-001 through REQ-EXP-007: Excel Export Functionality
- Integration testing between all modules

### Phase 5: Enhancement and Rollout (Weeks 21-24)
- REQ-AUDIT-004 through REQ-AUDIT-005: Advanced Audit Features
- REQ-USE-001 through REQ-USE-004: Usability Enhancements
- User training and documentation
- Production rollout

---

## Document Approval

**Prepared By:** AI Assistant (Planner Mode)  
**Date:** 2025-01-27

**Review and Approval:**
- [ ] Technical Lead: ___________________ Date: __________
- [ ] Business Owner: ___________________ Date: __________
- [ ] General Manager: ___________________ Date: __________

---

**End of Document**


