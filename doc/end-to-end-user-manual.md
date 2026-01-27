# End-to-End User Manual
## Silver Plan Procurement Management System

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Document Classification:** User Documentation

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | End-to-End User Manual - Procurement Management System |
| **System Name** | Silver Plan CRM/ERP System |
| **Version** | 1.0 |
| **Last Updated** | January 27, 2026 |
| **Target Audience** | End Users, System Administrators, Procurement Personnel |
| **Document Status** | Current |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - [1.1 Purpose](#11-purpose)
   - [1.2 Scope](#12-scope)
   - [1.3 Document Structure](#13-document-structure)
   - [1.4 System Overview](#14-system-overview)

2. [Getting Started](#2-getting-started)
   - [2.1 System Access](#21-system-access)
   - [2.2 User Roles and Permissions](#22-user-roles-and-permissions)
   - [2.3 Navigation Overview](#23-navigation-overview)

3. [Pre-Procurement Management](#3-pre-procurement-management-采购前基础数据与价格管理)
   - [3.1 Supplier Management](#31-supplier-management-供应商管理)
   - [3.2 Material Management](#32-material-management-物料管理)
   - [3.3 Material Quotation Management](#33-material-quotation-management-报价管理)

4. [Procurement Execution](#4-procurement-execution-采购中订单执行)
   - [4.1 Purchase Order Management](#41-purchase-order-management-采购订单执行)
   - [4.2 Goods Receipt Management](#42-goods-receipt-management-收货管理)

5. [System Administration](#5-system-administration)
   - [5.1 Workflow Configuration](#51-workflow-configuration-审批流程引擎)
   - [5.2 Role and Permission Management](#52-role-and-permission-management)
   - [5.3 Approval Dashboard](#53-approval-dashboard)

6. [Data Management](#6-data-management)
   - [6.1 Attachment Management](#61-attachment-management-附件管理)
   - [6.2 Data Export](#62-data-export-数据可导出性)

7. [Appendices](#7-appendices)
   - [A. Quick Reference Guide](#a-quick-reference-guide)
   - [B. Keyboard Shortcuts](#b-keyboard-shortcuts)
   - [C. Error Handling and Troubleshooting](#c-error-handling-and-troubleshooting)
   - [D. Test Users](#d-test-users)
   - [E. Version History](#e-version-history)

---

## 1. Introduction

### 1.1 Purpose

This user manual provides comprehensive, step-by-step instructions for using the Silver Plan Procurement Management System. It serves as:

- **Primary User Guide**: Detailed instructions for all system functions
- **Training Material**: Reference documentation for new user onboarding
- **Operational Reference**: Quick lookup for common tasks and procedures
- **System Documentation**: Complete coverage of implemented features

### 1.2 Scope

This manual covers all implemented features of the Procurement Management System, including:

- Supplier onboarding and management
- Material master data management
- Material quotation and price comparison
- Purchase order creation and approval
- Goods receipt processing
- Workflow and approval management
- Role-based access control
- Data export functionality

#### Planned Features (Not Yet Implemented)

The following features are planned for future releases but are **not currently available** in version 1.0:

- **MRP (Material Requirements Planning)**: Automatic calculation of material requirements based on inventory, demand, and supply factors
- **Pre-Payment Management**: Application and approval workflow for supplier pre-payments
- **Advanced Inventory Tracking**: Real-time inventory levels, safety stock management, in-transit tracking

These features will be documented in future versions of this manual once they are implemented.

### 1.3 Document Structure

This manual is organized into logical sections:

- **Sections 1-2**: Introduction and getting started
- **Sections 3-4**: Core procurement workflows
- **Section 5**: System administration
- **Section 6**: Data management features
- **Section 7**: Appendices with reference materials

Each section contains detailed use cases with step-by-step instructions, expected results, and relevant screenshots.

### 1.4 System Overview

The Silver Plan Procurement Management System is a web-based application built on the MERN stack (MongoDB, Express.js, React.js, Node.js) that provides:

#### Key Features

- ✅ **Full Process Online Workflow**: Complete procurement processes managed digitally
- ✅ **Multi-level Approval Workflow Engine**: Configurable approval workflows with multiple levels
- ✅ **Attachment Management**: File attachments at all document stages
- ✅ **One-click Excel Export**: Export all list data to Excel format
- ✅ **Role-based Access Control (RBAC)**: Granular permission management
- ✅ **Bilingual Support**: English and Chinese (中文) interface
- ✅ **Real-time Status Tracking**: Live updates on document status and approvals

#### System Architecture

- **Frontend**: React.js with Ant Design (AntD) components
- **Backend**: Node.js with Express.js RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Token-based authentication
- **Authorization**: Role-based permission system

---

## 2. Getting Started

### 2.1 System Access

#### 2.1.1 Login

1. Navigate to the system URL in your web browser
2. Enter your **Email** address
3. Enter your **Password**
4. Click **"Login"** or **"登录"** button

**Note**: If you do not have login credentials, contact your system administrator.

#### 2.1.2 Logout

1. Click on your user profile icon in the top-right corner
2. Select **"Logout"** or **"退出"** from the dropdown menu

### 2.2 User Roles and Permissions

The system supports multiple user roles with different permission levels:

#### Available Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **System Administrator** | Full system access | All permissions, system configuration |
| **General Manager** | Executive oversight | High-level approvals, all data access |
| **Procurement Manager** | Procurement oversight | Procurement approvals, team management |
| **Purchaser** | Purchase order creation | Create POs, quotations, suppliers |
| **Finance Director** | Financial oversight | Payment approvals, financial data |
| **Finance Personnel** | Payment processing | Process payments, view financial data |
| **MRP Planner** | Material planning | MRP calculations (when implemented) |
| **Warehouse Personnel** | Goods receipt | Create goods receipts, inventory tracking |
| **Data Entry Personnel** | Master data management | Create/update suppliers, materials |

**Note**: Your actual permissions depend on your assigned roles. Contact your system administrator if you need additional permissions.

### 2.3 Navigation Overview

The main navigation menu is located on the left side of the screen and includes:

- **Dashboard**: System overview and statistics
- **Procurement**: Supplier, Material, Quotation, PO, and Goods Receipt management
- **Administration**: User, Role, Workflow, and Approval management
- **Settings**: System configuration

---

## 3. Pre-Procurement Management (采购前：基础数据与价格管理)

**Objective**: Centralized, standardized, process-oriented management of suppliers, materials, and quotation information.

### 3.1 Supplier Management (供应商管理)

#### Use Case 3.1.1: Create Supplier

**Objective**: Create a new supplier record with complete information.

**Prerequisites**: User must have `supplier:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Suppliers** from the main menu
   - ![Supplier List](screenshots/01-supplier-list.png)

2. Click **"Add new supplier"** or **"Create"** button
   - ![Create Supplier Button](screenshots/02-create-supplier-button.png)

3. Fill in required fields in the supplier form:
   - **Supplier Code**: Auto-generated (read-only)
   - **Company Name (ZH)**: Enter Chinese company name (required)
   - **Company Name (EN)**: Enter English company name (optional)
   - **Supplier Type**: Select from dropdown (Manufacturer, Trader, Service Provider)
   - **Contact Person**: Enter primary contact name
   - **Email**: Enter contact email address
   - **Phone**: Enter contact phone number
   - **Address**: Enter company address
   - ![Supplier Form](screenshots/03-supplier-form.png)

4. Fill in optional fields as needed:
   - Business license information
   - Banking information
   - Payment terms
   - Notes and remarks

5. Click **"Save"** or **"Submit"** button
   - ![Save Supplier](screenshots/04-save-supplier.png)

6. Verify success message appears
   - ![Success Message](screenshots/05-supplier-created-success.png)

**Expected Result**: 
- Supplier record is created successfully
- Supplier appears in the supplier list
- Supplier code is automatically generated
- Record is saved with status "draft" or "active" depending on workflow configuration

---

#### Use Case 3.1.2: Upload Supplier Attachments

**Objective**: Attach supporting documents to supplier records.

**Prerequisites**: User must have `supplier:update` permission.

**Steps**:

1. Navigate to **Suppliers** page
2. Click on an existing supplier record to open the detail view
3. Locate the **Attachments** section
   - ![Attachment Section](screenshots/06-supplier-attachment-section.png)
4. Click **"Upload"** button or drag and drop files
5. Select files from your computer (supported formats: PDF, DOC, DOCX, XLS, XLSX, images)
6. Add file description (optional)
7. Click **"Upload"** to confirm
8. Verify files are uploaded and displayed in the attachments list
   - ![Uploaded Files](screenshots/07-supplier-files-uploaded.png)

**Expected Result**: 
- Files are successfully uploaded
- Attachments are visible in the supplier record
- Files can be downloaded or deleted (with appropriate permissions)

**File Size Limit**: Maximum 10MB per file

---

#### Use Case 3.1.3: Export Supplier List to Excel

**Objective**: Export supplier data to Excel format for reporting or analysis.

**Prerequisites**: User must have `supplier:export` permission.

**Steps**:

1. Navigate to **Suppliers** page
2. Apply any filters if needed (optional):
   - Filter by supplier type
   - Filter by status
   - Search by name or code
3. Click **"Export"** or **"导出"** button
   - ![Export Button](screenshots/08-export-button.png)
4. Wait for download to complete (progress indicator may appear)
5. Open the downloaded Excel file
   - ![Excel Export](screenshots/83-supplier-excel-export.png)

**Expected Result**: 
- Excel file is downloaded with filename format: `suppliers_YYYYMMDD_HHMMSS.xlsx`
- File contains all visible supplier data in columns
- Data matches the current filter settings

---

#### Use Case 3.1.4: Submit Supplier for Approval

**Objective**: Submit supplier record through the approval workflow.

**Prerequisites**: 
- User must have `supplier:submit` permission
- Workflow must be configured for supplier document type

**Steps**:

1. Create or edit a supplier record
2. Fill in all required information
3. Upload any required attachments
4. Click **"Save"** to save the draft
5. Click **"Submit"** or **"提交"** button
   - ![Submit Button](screenshots/10-submit-button.png)
6. Confirm submission in the dialog
7. Verify submission success message
   - ![Submission Success](screenshots/11-submission-success.png)

**Expected Result**: 
- Supplier status changes to "submitted" or "under_approval"
- Supplier appears in the approval queue
- Workflow instance is created
- Notifications are sent to approvers

---

### 3.2 Material Management (物料管理)

#### Use Case 3.2.1: Create Material

**Objective**: Create a new material record with standardized fields.

**Prerequisites**: User must have `material:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Materials** from the main menu
   - ![Material List](screenshots/12-material-list.png)

2. Click **"新增物料"** (New Material) or **"Create"** button
   - ![Create Material Button](screenshots/13-create-material-button.png)

3. Fill in required fields:
   - **Material Code**: Enter unique material code (e.g., MAT-001) or leave blank for auto-generation
   - **Material Name (ZH)**: Enter Chinese material name (required)
   - **Material Name (EN)**: Enter English material name (optional)
   - **Base UOM**: Select unit of measure (e.g., EA, KG, M, PCS)
   - **Category**: Select material category from dropdown
   - ![Material Form](screenshots/14-material-form.png)

4. Fill in optional fields:
   - Specification
   - Brand and Model
   - Description
   - Default supplier
   - Lead time
   - MOQ (Minimum Order Quantity)
   - Safety stock level

5. Click **"Save"** button
6. Verify success message
   - ![Material Created](screenshots/15-material-created-success.png)

**Expected Result**: 
- Material is created with standardized fields
- Material appears in the material list
- Material code is generated if not provided

---

#### Use Case 3.2.2: Manage Material Categories

**Objective**: Create and manage material category hierarchy.

**Prerequisites**: User must have `material_category:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Material Categories** page
   - ![Category List](screenshots/16-category-list.png)

2. Click **"Create"** button
3. Fill in category information:
   - **Category Code**: Enter category code (e.g., CAT-001)
   - **Category Name (ZH)**: Enter Chinese category name
   - **Category Name (EN)**: Enter English category name
   - **Parent Category**: Select parent category if creating subcategory (optional)
   - ![Category Form](screenshots/17-category-form.png)

4. Click **"Save"**
5. Verify category is created
   - ![Category Created](screenshots/18-category-created.png)

**Expected Result**: 
- Material category is created
- Category can be assigned to materials
- Category hierarchy is maintained

---

#### Use Case 3.2.3: Export Material List to Excel

**Objective**: Export material data to Excel format.

**Prerequisites**: User must have `material:export` permission.

**Steps**:

1. Navigate to **Materials** page
2. Apply filters if needed (by category, status, etc.)
3. Click **"Export"** or **"导出Excel"** button
   - ![Material Export](screenshots/19-material-export-button.png)
4. Wait for download
5. Verify Excel file contains all material data
   - ![Material Excel](screenshots/84-material-excel-export.png)

**Expected Result**: 
- Excel file downloaded with complete material information
- File format matches system specifications

---

### 3.3 Material Quotation Management (报价管理)

#### Use Case 3.3.1: Create Material Quotation

**Objective**: Create a quotation request and compare multiple supplier quotes.

**Prerequisites**: User must have `material_quotation:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Material Quotations** page
   - ![Quotation List](screenshots/21-quotation-list.png)

2. Click **"New Quotation"** or **"Create"** button
   - ![Create Quotation](screenshots/22-create-quotation-button.png)

3. Fill in quotation header:
   - **Quotation Number**: Auto-generated (read-only)
   - **Title (ZH/EN)**: Enter quotation title
   - **Request Date**: Select request date
   - **Response Deadline**: Select deadline for supplier responses
   - ![Quotation Form](screenshots/23-quotation-form.png)

4. Add quotation items:
   - Click **"Add Item"** button
   - Select **Material** from dropdown
   - Enter **Quantity**
   - Enter **Specifications** (optional)
   - Repeat for multiple materials

5. Add supplier quotes for each item:
   - Click **"Add Quote"** button for an item
   - Select **Supplier** from dropdown
   - Enter **Unit Price**
   - Enter **Lead Time** (days)
   - Enter **MOQ** (Minimum Order Quantity)
   - Enter **Valid Until** date
   - Add **Payment Terms** and **Delivery Terms** (optional)
   - Repeat for multiple suppliers
   - ![Add Quotes](screenshots/24-add-quotes.png)

6. Click **"Save"**
7. Verify quotation is created
   - ![Quotation Created](screenshots/25-quotation-created.png)

**Expected Result**: 
- Quotation created with multiple items
- Multiple supplier quotes can be added per item
- Quotation status is "draft"
- Quotation can be submitted for approval

---

#### Use Case 3.3.2: Compare Supplier Quotes

**Objective**: View and compare quotes from different suppliers for the same material.

**Steps**:

1. Navigate to **Material Quotations** page
2. Select a quotation with multiple quotes
3. View the quotation detail page
4. For each item, review the quotes table showing:
   - Supplier names
   - Unit prices
   - Total prices (quantity × unit price)
   - Lead times
   - MOQ/MPQ
   - Valid until dates
   - Payment and delivery terms
   - ![Quote Comparison](screenshots/31-quote-comparison-table.png)

5. Select preferred quote by clicking **"Select"** button (if permitted)

**Expected Result**: 
- Side-by-side comparison of all supplier quotes is displayed
- Quotes are ranked by price (lowest first)
- Selected quote is marked for use in purchase orders

---

#### Use Case 3.3.3: Submit Quotation for Approval

**Objective**: Submit quotation through approval workflow.

**Prerequisites**: User must have `material_quotation:submit` permission.

**Steps**:

1. Navigate to **Material Quotations** page
2. Select an existing quotation
3. Review all information and quotes
4. Click **"Submit"** or **"提交"** button
   - ![Submit Quotation](screenshots/28-submit-quotation.png)
5. Confirm submission
6. Verify submission success
   - ![Quotation Submitted](screenshots/29-quotation-submitted.png)

**Expected Result**: 
- Quotation is submitted and appears in approval queue
- Status changes to "submitted" or "under_approval"
- Workflow instance is created
- Approvers receive notifications

---

## 4. Procurement Execution (采购中：订单执行)

**Objective**: Automated, traceable management from requirements to orders.

### 4.1 Purchase Order Management (采购订单执行)

#### Use Case 4.1.1: Create Purchase Order

**Objective**: Create a purchase order based on approved quotation or manually.

**Prerequisites**: User must have `purchase_order:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Purchase Orders** page
   - ![PO List](screenshots/41-po-list.png)

2. Click **"Create Purchase Order"** or **"Create"** button
   - ![Create PO](screenshots/42-create-po-button.png)

3. Fill in PO header:
   - **PO Number**: Auto-generated (read-only)
   - **Supplier**: Select supplier from dropdown
   - **Order Date**: Select order date (defaults to today)
   - **Expected Delivery Date**: Select expected delivery date
   - **Currency**: Select currency (default: CNY)

4. Add line items:
   - Click **"Add Item"** button
   - **Material**: Select material from dropdown
   - **Quantity**: Enter quantity
   - **Unit Price**: Enter unit price (pre-filled if from quotation)
   - **UOM**: Unit of measure (auto-filled from material)
   - **Required Delivery Date**: Select delivery date for this line
   - Repeat for multiple items
   - ![PO Form](screenshots/43-po-form.png)

5. Review financial summary:
   - Subtotal
   - Tax amount (if applicable)
   - Shipping cost (if applicable)
   - Discount (if applicable)
   - Total amount

6. Fill in terms and conditions:
   - Payment terms
   - Delivery terms
   - Shipping address
   - Terms and conditions text

7. Click **"Save"**
8. Verify PO is created
   - ![PO Created](screenshots/44-po-created-success.png)

**Expected Result**: 
- Purchase order created with all line items
- PO number is automatically generated
- Status is "draft"
- PO can be edited, submitted, or deleted (based on permissions)

---

#### Use Case 4.1.2: Submit Purchase Order for Approval

**Objective**: Submit purchase order through approval workflow.

**Prerequisites**: 
- User must have `purchase_order:submit` permission
- PO must have at least one line item
- Total amount must be greater than zero

**Steps**:

1. Navigate to **Purchase Orders** page
2. Select a purchase order (status: draft)
3. Review all information
4. Click **"Submit"** or **"提交"** button
   - ![Submit PO](screenshots/47-submit-po-button.png)
5. Confirm submission
6. Verify submission success
   - ![PO Submitted](screenshots/48-po-submitted.png)

**Expected Result**: 
- PO status changes to "pending_approval" or "under_approval"
- PO appears in approval queue
- Workflow instance is created
- Approvers receive notifications based on amount thresholds

---

#### Use Case 4.1.3: Track Purchase Order Status

**Objective**: Monitor purchase order status throughout its lifecycle.

**Steps**:

1. Navigate to **Purchase Orders** page
2. View status column in PO list
   - ![PO Status Column](screenshots/49-po-status-column.png)
3. Click on a PO to view details
4. Review status information:
   - Current status
   - Approval workflow status
   - Approval history
   - Status change timestamps
   - ![PO Status Details](screenshots/50-po-status-details.png)

**Available Statuses**:
- `draft`: Initial creation, not submitted
- `pending_approval`: Submitted, awaiting approval
- `approved`: Approved by all required approvers
- `rejected`: Rejected during approval
- `sent_to_supplier`: Sent to supplier
- `confirmed`: Supplier confirmed the order
- `in_production`: Supplier is producing
- `shipped`: Goods shipped by supplier
- `partially_received`: Some goods received
- `received`: All goods received
- `completed`: Order fully completed
- `cancelled`: Order cancelled

**Expected Result**: 
- PO status is visible and trackable throughout lifecycle
- Status history shows all changes with timestamps
- Current approver information is displayed

---

#### Use Case 4.1.4: Export Purchase Order List to Excel

**Objective**: Export purchase order data to Excel format.

**Prerequisites**: User must have `purchase_order:export` permission.

**Steps**:

1. Navigate to **Purchase Orders** page
2. Apply filters if needed (by status, supplier, date range)
3. Click **"Export"** or **"导出"** button
   - ![PO Export](screenshots/51-po-export-button.png)
4. Wait for download
5. Verify Excel file
   - ![PO Excel](screenshots/86-po-excel-export.png)

**Expected Result**: 
- Excel file downloaded with all PO data
- File includes line items and totals
- Format matches system specifications

---

### 4.2 Goods Receipt Management (收货管理)

#### Use Case 4.2.1: Create Goods Receipt from Purchase Order

**Objective**: Record goods receipt against a purchase order.

**Prerequisites**: User must have `goods_receipt:create` permission.

**Steps**:

1. Navigate to **Procurement** → **Goods Receipts** page
   - ![Goods Receipt List](screenshots/53-goods-receipt-list.png)

2. Click **"New Receipt"** or **"Create"** button
   - ![Create GR](screenshots/54-create-gr-button.png)

3. Fill in receipt details:
   - **Purchase Order**: Select PO from dropdown (only approved/shipped POs shown)
   - **Receipt Date**: Select receipt date (defaults to today)
   - **Receipt Number**: Auto-generated (read-only)

4. Review PO line items and enter received quantities:
   - For each line item, enter **Received Quantity**
   - System calculates **Outstanding Quantity** automatically
   - Add **Remarks** if needed
   - ![GR Form](screenshots/55-gr-form.png)

5. Fill in additional information:
   - Quality inspection status
   - Receiving warehouse/location
   - Notes

6. Click **"Save"**
7. Verify receipt is created
   - ![GR Created](screenshots/56-gr-created.png)

**Expected Result**: 
- Goods receipt created and linked to PO
- PO line item received quantities are updated
- PO status may change to "partially_received" or "received"
- Receipt can be edited or cancelled (if permitted)

---

#### Use Case 4.2.2: Track Goods Receipt Status

**Objective**: Monitor goods receipt status and history.

**Steps**:

1. Navigate to **Goods Receipts** page
2. View status column in receipt list
   - ![GR Status](screenshots/57-gr-status-column.png)
3. Click on receipt to view details
4. Review status information:
   - Current status
   - Linked purchase order
   - Received quantities per line item
   - Quality inspection status

**Expected Result**: 
- Goods receipt status is visible and trackable
- Link to source purchase order is maintained
- Receipt history shows all changes

---

## 5. System Administration

### 5.1 Workflow Configuration (审批流程引擎)

#### Use Case 5.1.1: Configure Multi-level Approval Workflow

**Objective**: Set up multi-level approval workflow for document types.

**Prerequisites**: User must have `workflow:create` permission (typically System Administrator).

**Steps**:

1. Navigate to **Administration** → **Workflows** page
   - ![Workflow List](screenshots/72-workflow-list.png)

2. Click **"Create"** button
   - ![Create Workflow](screenshots/73-create-workflow-button.png)

3. Fill in workflow details:
   - **Name**: Enter workflow name (e.g., "Purchase Order Approval")
   - **Display Name (ZH/EN)**: Enter display names
   - **Document Type**: Select document type (Supplier, Material Quotation, Purchase Order, Pre-Payment)
   - **Description**: Enter workflow description
   - ![Workflow Form](screenshots/74-workflow-form.png)

4. Add approval levels:
   - Click **"Add Level"** button
   - **Level Number**: Enter level (1, 2, 3, etc.)
   - **Approver Role**: Select approver role from dropdown
   - **Approval Type**: Select "Sequential" or "Parallel"
   - Add another level if needed
   - ![Multi-level Setup](screenshots/75-multi-level-setup.png)

5. Configure routing rules (optional):
   - **Amount-based Routing**: Set min/max amount ranges
   - **Condition-based Routing**: Set conditions for routing
   - Add multiple rules as needed

6. Click **"Save"**
7. Verify workflow is created
   - ![Workflow Created](screenshots/76-workflow-created.png)

**Expected Result**: 
- Multi-level approval workflow configured
- Workflow is active and can be assigned to documents
- Approval levels are enforced when documents are submitted

---

#### Use Case 5.1.2: Configure Amount-based Approval Routing

**Objective**: Set up approval routing based on document amount ranges.

**Prerequisites**: User must have `workflow:update` permission.

**Steps**:

1. Navigate to **Workflows** page
2. Select an existing workflow or create a new one
3. In the workflow configuration, locate **Routing Rules** section
4. Click **"Add Rule"** button
5. Configure amount-based rule:
   - **Min Amount**: Enter minimum amount (e.g., 0)
   - **Max Amount**: Enter maximum amount (e.g., 10,000)
   - **Currency**: Select currency (default: CNY)
   - **Approver Role**: Select approver role for this range
   - **Level**: Select approval level
   - ![Amount-based Rules](screenshots/77-amount-based-rules.png)

6. Add additional rules for different amount ranges:
   - Rule 2: 10,000 - 100,000 → Procurement Manager
   - Rule 3: 100,000 - 1,000,000 → General Manager
   - Rule 4: > 1,000,000 → General Manager + Finance Director

7. Click **"Save"**
8. Verify workflow is updated

**Expected Result**: 
- Amount-based approval routing configured
- Documents are automatically routed to appropriate approvers based on total amount
- Multiple rules can be configured for different ranges

---

### 5.2 Role and Permission Management

#### Use Case 5.2.1: View Roles

**Objective**: View all available roles in the system.

**Prerequisites**: User must have `role:read` permission.

**Steps**:

1. Navigate to **Administration** → **Roles** page
2. View role list showing:
   - Role name
   - Display names (ZH/EN)
   - Description
   - System role indicator
   - Number of permissions

**Expected Result**: 
- All roles are displayed
- System roles are clearly marked
- Role details are visible

---

#### Use Case 5.2.2: Assign Roles to Users

**Objective**: Assign roles to users for access control.

**Prerequisites**: User must have `admin:update` permission.

**Steps**:

1. Navigate to **Administration** → **Users** page
2. Select a user
3. Click **"Edit"** button
4. In the **Roles** section, select roles from dropdown
5. Click **"Save"**
6. Verify roles are assigned

**Expected Result**: 
- User has assigned roles
- User permissions are updated based on role permissions
- User can access modules based on role permissions

---

### 5.3 Approval Dashboard

#### Use Case 5.3.1: View Approval Dashboard

**Objective**: Monitor all pending approvals and approval statistics.

**Prerequisites**: User must have access to approval dashboard.

**Steps**:

1. Navigate to **Administration** → **Approvals** page
   - ![Approval Dashboard](screenshots/78-approval-dashboard.png)

2. View dashboard statistics:
   - Total pending approvals
   - Approvals by document type
   - Approvals by status
   - My pending approvals

3. View approval queue:
   - Pending approvals list
   - Document type, number, submitter
   - Submission date
   - Current approver
   - Amount (if applicable)
   - ![Approval Status](screenshots/79-approval-status.png)

4. Filter approvals:
   - By document type
   - By status
   - By date range
   - My approvals only

**Expected Result**: 
- Approval dashboard displays all relevant information
- Pending approvals are clearly visible
- Statistics are updated in real-time

---

#### Use Case 5.3.2: Approve or Reject Document

**Objective**: Review and approve or reject a submitted document.

**Prerequisites**: User must have `approve` permission for the document type.

**Steps**:

1. Navigate to **Approvals** page
2. Select a pending approval from the list
3. Review document details:
   - All document information
   - Attachments
   - Approval history
   - Comments from previous approvers

4. Take action:
   - Click **"Approve"** button to approve
   - Click **"Reject"** button to reject
   - Add **Comments** (optional but recommended)

5. Confirm action
6. Verify action is recorded
   - Status updates immediately
   - Next approver is notified (if applicable)
   - Submitter is notified

**Expected Result**: 
- Document is approved or rejected
- Status is updated
- Workflow proceeds to next level or completes
- All parties are notified

---

## 6. Data Management

### 6.1 Attachment Management (附件管理)

#### Use Case 6.1.1: Upload Attachments to Documents

**Objective**: Attach supporting files to any document (Supplier, Material, Quotation, PO, etc.).

**Prerequisites**: User must have `update` permission for the document type.

**Steps**:

1. Navigate to the relevant document page (Supplier, Material, Quotation, PO, etc.)
2. Open the document (create new or edit existing)
3. Locate **Attachments** section
4. Click **"Upload"** button or drag and drop files
5. Select files from your computer
6. Add file description (optional)
7. Click **"Upload"** to confirm
8. Verify files appear in attachments list

**Supported File Types**: PDF, DOC, DOCX, XLS, XLSX, images (JPG, PNG, etc.)

**File Size Limit**: Maximum 10MB per file

**Expected Result**: 
- Files are uploaded successfully
- Attachments are visible in document
- Files can be downloaded or deleted (with permissions)

---

#### Use Case 6.1.2: Download or Delete Attachments

**Objective**: Manage existing document attachments.

**Prerequisites**: User must have appropriate permissions.

**Steps**:

1. Open document with attachments
2. Locate **Attachments** section
3. To download:
   - Click **"Download"** icon next to file
   - File downloads to your computer
4. To delete:
   - Click **"Delete"** icon next to file
   - Confirm deletion
   - File is removed from document

**Expected Result**: 
- Files can be downloaded or deleted
- Deleted files are removed from system
- Document is updated immediately

---

### 6.2 Data Export (数据可导出性)

#### Use Case 6.2.1: Export Any List to Excel

**Objective**: Export list data to Excel format for reporting.

**Prerequisites**: User must have `export` permission for the entity type.

**General Steps** (applies to all list pages):

1. Navigate to any list page (Suppliers, Materials, Quotations, POs, Goods Receipts)
2. Apply filters if needed (optional)
3. Click **"Export"** or **"导出"** button
4. Wait for download to complete
5. Open downloaded Excel file

**Export Features**:
- Exports all visible data (respects current filters)
- Includes all columns
- Format matches system specifications
- Filename includes entity type and timestamp

**Expected Result**: 
- Excel file downloaded successfully
- Data matches current list view
- File can be opened in Excel or other spreadsheet applications

---

## 7. Appendices

### A. Quick Reference Guide

#### Common Actions

| Action | Location | Button Text | Permission Required |
|--------|----------|-------------|---------------------|
| Create Supplier | Procurement → Suppliers | "Add new supplier" | `supplier:create` |
| Create Material | Procurement → Materials | "新增物料" / "Create" | `material:create` |
| Create Quotation | Procurement → Material Quotations | "New Quotation" | `material_quotation:create` |
| Create PO | Procurement → Purchase Orders | "Create Purchase Order" | `purchase_order:create` |
| Create Goods Receipt | Procurement → Goods Receipts | "New Receipt" | `goods_receipt:create` |
| Export Data | Any list page | "Export" / "导出" | `[entity]:export` |
| Submit for Approval | Document detail page | "Submit" / "提交" | `[entity]:submit` |
| Approve Document | Administration → Approvals | "Approve" | `[entity]:approve` |

#### Navigation Paths

- **Suppliers**: Procurement → Suppliers
- **Materials**: Procurement → Materials
- **Material Categories**: Procurement → Material Categories
- **Material Quotations**: Procurement → Material Quotations
- **Purchase Orders**: Procurement → Purchase Orders
- **Goods Receipts**: Procurement → Goods Receipts
- **Roles**: Administration → Roles
- **Workflows**: Administration → Workflows
- **Approvals**: Administration → Approvals
- **Users**: Administration → Users

---

### B. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save current form |
| `Esc` | Close modal/dialog |
| `Ctrl/Cmd + F` | Focus search/filter field |
| `Ctrl/Cmd + E` | Export current list (if available) |
| `Tab` | Navigate between form fields |
| `Enter` | Submit form (when in last field) |

---

### C. Error Handling and Troubleshooting

#### Common Issues and Solutions

**Issue 1: "Cannot find button" or "Button not visible"**

**Possible Causes**:
- User does not have required permission
- Document is in wrong status
- Page not fully loaded

**Solutions**:
1. Check user permissions with system administrator
2. Verify document status allows the action
3. Refresh the page (F5)
4. Clear browser cache if issue persists

---

**Issue 2: "Export not working" or "Download fails"**

**Possible Causes**:
- Browser download settings blocking downloads
- No data to export
- Network connectivity issues

**Solutions**:
1. Check browser download settings (allow downloads)
2. Verify data exists in the list
3. Check browser console for errors (F12)
4. Try again after a few seconds
5. Try different browser if issue persists

---

**Issue 3: "Approval workflow not visible" or "Cannot submit"**

**Possible Causes**:
- Workflow not configured for document type
- User lacks submit permission
- Document missing required information

**Solutions**:
1. Verify workflow is configured (Administration → Workflows)
2. Check user has `[entity]:submit` permission
3. Verify all required fields are filled
4. Contact system administrator

---

**Issue 4: "File upload fails"**

**Possible Causes**:
- File size exceeds 10MB limit
- Unsupported file type
- Network issues

**Solutions**:
1. Check file size (must be < 10MB)
2. Verify file type is supported
3. Try compressing large files
4. Check network connection
5. Try uploading one file at a time

---

**Issue 5: "Cannot approve document"**

**Possible Causes**:
- User is not the current approver
- Document not in approval status
- User lacks approve permission

**Solutions**:
1. Verify document is in "pending_approval" or "under_approval" status
2. Check if you are the current approver
3. Verify you have `[entity]:approve` permission
4. Check approval dashboard for your pending approvals

---

### D. Test Users

For testing and demonstration purposes, the following test users have been created with different roles:

#### Test User Accounts

| Email | Name | Role | Department | Approval Authority | Password |
|-------|------|------|------------|-------------------|----------|
| `procurement.manager@test.com` | Procurement Manager | Procurement Manager | Procurement | 100,000 CNY | `test123456` |
| `purchaser@test.com` | John Purchaser | Purchaser | Procurement | - | `test123456` |
| `finance.director@test.com` | Finance Director | Finance Director | Finance | 500,000 CNY | `test123456` |
| `finance@test.com` | Finance Personnel | Finance Personnel | Finance | - | `test123456` |
| `general.manager@test.com` | General Manager | General Manager | Executive | 1,000,000 CNY | `test123456` |
| `mrp.planner@test.com` | MRP Planner | MRP Planner | Planning | - | `test123456` |
| `warehouse@test.com` | Warehouse Personnel | Warehouse Personnel | Warehouse | - | `test123456` |
| `data.entry@test.com` | Data Entry | Data Entry Personnel | Procurement | - | `test123456` |

#### User Capabilities

**Procurement Manager** (`procurement.manager@test.com`)
- Can approve Purchase Orders, Suppliers, Material Quotations up to 100,000 CNY
- Full access to procurement processes
- Can manage procurement team

**Purchaser** (`purchaser@test.com`)
- Can create Purchase Orders, Quotations, Suppliers, Materials
- Can submit documents for approval
- Reports to Procurement Manager

**Finance Director** (`finance.director@test.com`)
- Can approve Pre-payments and Purchase Orders up to 500,000 CNY
- Financial oversight authority
- Manages Finance Personnel

**Finance Personnel** (`finance@test.com`)
- Can process payments (when payment module is implemented)
- Can view financial data
- Reports to Finance Director

**General Manager** (`general.manager@test.com`)
- Can approve all document types up to 1,000,000 CNY
- Executive approval authority
- Highest approval level

**MRP Planner** (`mrp.planner@test.com`)
- Can run MRP calculations (when MRP module is implemented)
- Can manage material requirements
- Can generate purchase orders from MRP suggestions (when implemented)

**Warehouse Personnel** (`warehouse@test.com`)
- Can create goods receipts
- Can track inventory (when inventory module is implemented)
- Can manage warehouse operations

**Data Entry Personnel** (`data.entry@test.com`)
- Can create and update master data (Suppliers, Materials)
- Can maintain data quality
- Limited to data entry operations

#### Security Note

⚠️ **Important**: All test users share the same password (`test123456`) for testing convenience. **This is for testing purposes only.** In production, each user should have a unique, secure password.

---

### E. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | January 27, 2026 | Initial formal release. Documented all implemented features. Removed references to unimplemented features (MRP, Pre-payment). Structured as formal user manual. | Documentation Team |

---

## Document Maintenance

**Screenshot Location**: `/doc/screenshots/`

**Related Documents**:
- Functional Requirements Plan: `doc/customer-requirements/functional-requirements-plan.md`
- Functional Implementation Plan: `doc/customer-requirements/functional-implementation-plan.md`
- Happy Path Demo Story: `doc/happy-path-demo-story.md`

**Feedback and Updates**: 
For questions, corrections, or updates to this manual, please contact the system administrator or documentation team.

---

**End of Document**
