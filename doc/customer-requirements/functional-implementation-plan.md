# Functional Implementation Plan: Silverplan Procurement Management System

**Document Version:** 1.0  
**Date:** 2025-01-27  
**Project:** IDURAR ERP-CRM - Silverplan Customization  
**Status:** Implementation Planning Phase  
**Based On:** Functional Requirements Plan v1.0

---

## Document Purpose

This document provides detailed implementation guidance for the Silverplan Procurement Management System. It translates the functional requirements into actionable technical specifications, including architecture design, database schemas, API specifications, component breakdown, and sprint planning.

---

## Document Structure

1. **Technical Architecture** - System design and technology stack
2. **Database Design** - Schemas and data models
3. **API Specifications** - Backend endpoints and contracts
4. **Component Design** - Frontend components and flows
5. **Integration Strategy** - Module integration points
6. **Sprint Planning** - Detailed sprint breakdown with tasks
7. **Testing Strategy** - Test approach and coverage
8. **Deployment Plan** - Rollout and migration strategy
9. **Risk Management** - Technical risks and mitigation

---

## Table of Contents

1. [Technical Architecture](#1-technical-architecture)
2. [Database Design](#2-database-design)
3. [API Specifications](#3-api-specifications)
4. [Frontend Component Design](#4-frontend-component-design)
5. [Workflow Engine Implementation](#5-workflow-engine-implementation)
6. [Excel Export Implementation](#6-excel-export-implementation)
7. [Sprint Planning](#7-sprint-planning)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Plan](#9-deployment-plan)
10. [Risk Management](#10-risk-management)

---

## 1. Technical Architecture

### 1.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Supplier  │  │  Material  │  │     MRP    │            │
│  │   Module   │  │   Module   │  │   Module   │   ...      │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │               │                │                   │
│         └───────────────┴────────────────┘                   │
│                         │                                    │
│              ┌──────────▼──────────┐                        │
│              │   Redux Store       │                        │
│              │   (State Management)│                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼─────────────────────────────────┘
                          │ Axios/HTTP
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                  API Gateway (Express.js)                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │        Authentication & Authorization Middleware      │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                 │
│  ┌───────────┬──────────┼──────────┬──────────┐          │
│  │           │          │          │          │          │
│  ▼           ▼          ▼          ▼          ▼          │
│ Supplier   Material   Quotation   MRP        PO          │
│ Controller Controller Controller Controller Controller    │
│            │          │           │          │            │
│            └──────────┴───────────┴──────────┘            │
│                       │                                    │
│            ┌──────────▼──────────┐                        │
│            │  Workflow Engine    │                        │
│            │  Service Layer      │                        │
│            └──────────┬──────────┘                        │
└───────────────────────┼────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────┐
│                   MongoDB Database                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐    │
│  │Suppliers│  │Materials│  │Quotations│  │Workflows│ ...  │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### Backend Stack
- **Runtime:** Node.js 20.9.0
- **Framework:** Express.js 4.18.2
- **Database:** MongoDB 7.0.0
- **ODM:** Mongoose 8.1.1
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **File Upload:** Multer 1.4.4, Express-fileupload 1.4.3
- **Excel Generation:** exceljs 4.4.0 (NEW)
- **Validation:** Joi 17.11.0
- **Workflow Engine:** Custom implementation

#### Frontend Stack
- **Framework:** React 18.3.1
- **State Management:** Redux 5.0.1, Redux Toolkit 2.2.1
- **Routing:** React Router DOM 6.22.0
- **UI Library:** Ant Design (antd) 5.14.1
- **HTTP Client:** Axios 1.6.2
- **Form Handling:** Ant Design Forms
- **Date Handling:** dayjs 1.11.10

#### Development Tools
- **Build Tool:** Vite 5.4.8
- **Version Control:** Git
- **API Testing:** Postman/Thunder Client
- **Code Quality:** ESLint, Prettier

### 1.3 Architecture Patterns

#### Backend Patterns
1. **MVC Architecture:** Model-View-Controller separation
2. **Service Layer Pattern:** Business logic in dedicated services
3. **Repository Pattern:** Data access abstraction
4. **Middleware Pattern:** Request processing pipeline
5. **Factory Pattern:** Workflow instance creation
6. **Strategy Pattern:** Approval routing strategies
7. **Observer Pattern:** Workflow state change notifications

#### Frontend Patterns
1. **Container/Presenter Pattern:** Smart vs presentational components
2. **Redux Pattern:** Centralized state management
3. **Higher-Order Components:** Reusable component logic
4. **Custom Hooks:** Reusable stateful logic
5. **Module Pattern:** Feature-based organization

### 1.4 Project Structure

```
idurar-erp-crm/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── coreModels/
│   │   │   │   ├── Admin.js
│   │   │   │   ├── Role.js (NEW)
│   │   │   │   ├── Permission.js (NEW)
│   │   │   │   └── AuditLog.js (NEW)
│   │   │   └── appModels/
│   │   │       ├── Supplier.js (NEW)
│   │   │       ├── Material.js (NEW)
│   │   │       ├── MaterialQuotation.js (NEW)
│   │   │       ├── PurchaseOrder.js (NEW)
│   │   │       ├── PrePayment.js (NEW)
│   │   │       ├── MRP.js (NEW)
│   │   │       ├── Inventory.js (NEW)
│   │   │       ├── Workflow.js (NEW)
│   │   │       └── WorkflowInstance.js (NEW)
│   │   ├── controllers/
│   │   │   ├── coreControllers/
│   │   │   │   ├── roleController/ (NEW)
│   │   │   │   └── permissionController/ (NEW)
│   │   │   └── appControllers/
│   │   │       ├── supplierController/ (NEW)
│   │   │       ├── materialController/ (NEW)
│   │   │       ├── quotationController/ (NEW)
│   │   │       ├── purchaseOrderController/ (NEW)
│   │   │       ├── prePaymentController/ (NEW)
│   │   │       └── mrpController/ (NEW)
│   │   ├── services/
│   │   │   ├── workflowEngine/ (NEW)
│   │   │   │   ├── WorkflowEngine.js
│   │   │   │   ├── ApprovalRouter.js
│   │   │   │   └── WorkflowState.js
│   │   │   ├── excelExport/ (NEW)
│   │   │   │   ├── ExcelExportService.js
│   │   │   │   └── templates/
│   │   │   ├── mrpEngine/ (NEW)
│   │   │   │   └── MRPCalculator.js
│   │   │   └── auditLog/ (NEW)
│   │   │       └── AuditLogService.js
│   │   ├── middlewares/
│   │   │   ├── rbac/ (NEW)
│   │   │   │   ├── checkPermission.js
│   │   │   │   └── checkRole.js
│   │   │   └── workflow/ (NEW)
│   │   │       └── workflowMiddleware.js
│   │   └── routes/
│   │       └── appRoutes/
│   │           ├── supplierRoutes.js (NEW)
│   │           ├── materialRoutes.js (NEW)
│   │           ├── quotationRoutes.js (NEW)
│   │           ├── purchaseOrderRoutes.js (NEW)
│   │           └── mrpRoutes.js (NEW)
├── frontend/
│   └── src/
│       ├── modules/
│       │   ├── SupplierModule/ (NEW)
│       │   ├── MaterialModule/ (NEW)
│       │   ├── QuotationModule/ (NEW)
│       │   ├── PurchaseOrderModule/ (NEW)
│       │   ├── MRPModule/ (NEW)
│       │   └── WorkflowModule/ (NEW)
│       ├── redux/
│       │   ├── supplier/ (NEW)
│       │   ├── material/ (NEW)
│       │   ├── quotation/ (NEW)
│       │   ├── purchaseOrder/ (NEW)
│       │   └── mrp/ (NEW)
│       └── components/
│           ├── ApprovalFlow/ (NEW)
│           ├── WorkflowStatus/ (NEW)
│           └── ExcelExport/ (NEW)
```

---

## 2. Database Design

### 2.1 Core Models (Extended)

#### 2.1.1 Admin Model (Extended)
```javascript
// Extend existing Admin model
{
  _id: ObjectId,
  email: String,
  name: String,
  surname: String,
  enabled: Boolean,
  role: String, // Existing: 'owner'
  roles: [{ type: ObjectId, ref: 'Role' }], // NEW: Multiple roles support
  department: String, // NEW
  managerOf: [{ type: ObjectId, ref: 'Admin' }], // NEW: Subordinates
  reportsTo: { type: ObjectId, ref: 'Admin' }, // NEW: Manager
  approvalAuthority: { // NEW
    maxAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'CNY' },
    documentTypes: [String]
  },
  preferences: { // NEW
    language: { type: String, default: 'zh-CN' },
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    }
  },
  removed: Boolean,
  created: Date,
  updated: Date
}
```

#### 2.1.2 Role Model (NEW)
```javascript
{
  _id: ObjectId,
  name: String, // 'system_administrator', 'general_manager', etc.
  displayName: {
    zh: String,
    en: String
  },
  description: String,
  permissions: [{ type: ObjectId, ref: 'Permission' }],
  inheritsFrom: [{ type: ObjectId, ref: 'Role' }], // Role hierarchy
  isSystemRole: { type: Boolean, default: false }, // Cannot be deleted
  created: Date,
  createdBy: { type: ObjectId, ref: 'Admin' },
  updated: Date,
  removed: Boolean
}
```

#### 2.1.3 Permission Model (NEW)
```javascript
{
  _id: ObjectId,
  resource: String, // 'supplier', 'material', 'purchase_order'
  action: String, // 'create', 'read', 'update', 'delete', 'approve', 'export'
  scope: String, // 'own', 'team', 'all'
  conditions: Mixed, // Additional conditions (JSON)
  description: String,
  isSystemPermission: { type: Boolean, default: false },
  created: Date,
  removed: Boolean
}
```

#### 2.1.4 AuditLog Model (NEW)
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'Admin', required: true },
  action: String, // 'create', 'update', 'delete', 'approve', 'reject'
  entityType: String, // 'Supplier', 'Material', 'PurchaseOrder'
  entityId: ObjectId,
  entityName: String, // For display
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  metadata: {
    ip: String,
    userAgent: String,
    requestId: String
  },
  timestamp: { type: Date, default: Date.now },
  indexed: Boolean
}

// Indexes
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
```

### 2.2 Application Models (NEW)

#### 2.2.1 Supplier Model (NEW)
```javascript
{
  _id: ObjectId,
  supplierCode: { type: String, unique: true, required: true }, // Auto-generated
  supplierName: {
    zh: { type: String, required: true },
    en: String
  },
  shortName: String,
  
  // Contact Information
  contactPerson: String,
  phone: String,
  mobile: String,
  email: String,
  fax: String,
  website: String,
  
  // Address Information
  address: {
    country: String,
    province: String,
    city: String,
    street: String,
    postalCode: String
  },
  
  // Business Information
  businessLicense: String,
  taxId: String,
  registrationDate: Date,
  
  // Banking Information
  bankInfo: {
    bankName: String,
    accountNumber: String,
    bankBranch: String,
    swiftCode: String
  },
  
  // Classification
  supplierType: { 
    type: String, 
    enum: ['manufacturer', 'trader', 'service_provider'],
    required: true
  },
  industryCategory: [String],
  supplierLevel: { 
    type: String, 
    enum: ['A', 'B', 'C', 'D'],
    default: 'C'
  },
  creditRating: String,
  
  // Business Terms
  paymentTerms: String,
  currency: { type: String, default: 'CNY' },
  leadTime: { type: Number, default: 0 }, // Days
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'under_review', 'active', 'inactive', 'blacklisted'],
    default: 'draft'
  },
  
  // Workflow
  workflowInstance: { type: ObjectId, ref: 'WorkflowInstance' },
  currentApprovalLevel: Number,
  
  // Attachments
  files: [{
    name: String,
    path: String,
    type: String, // 'business_license', 'tax_certificate', etc.
    description: String,
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    uploadedAt: Date,
    size: Number
  }],
  
  // Metadata
  notes: String,
  createdBy: { type: ObjectId, ref: 'Admin', required: true },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ 'supplierName.zh': 'text', 'supplierName.en': 'text' });
supplierSchema.index({ status: 1, supplierLevel: 1 });
supplierSchema.index({ createdBy: 1, created: -1 });
```

#### 2.2.2 Material Model (NEW)
```javascript
{
  _id: ObjectId,
  materialCode: { type: String, unique: true, required: true },
  materialName: {
    zh: { type: String, required: true },
    en: String
  },
  shortName: String,
  specification: String,
  
  // Classification
  category: String,
  materialType: String,
  brand: String,
  model: String,
  
  // Unit of Measure
  baseUOM: { type: String, required: true }, // 'EA', 'KG', 'M', etc.
  alternativeUOMs: [{
    uom: String,
    conversionFactor: Number // to base UOM
  }],
  
  // Description
  description: String,
  technicalSpecs: String,
  drawingNumber: String,
  
  // Procurement
  defaultSupplier: { type: ObjectId, ref: 'Supplier' },
  leadTime: { type: Number, default: 0 }, // Days
  moq: Number, // Minimum Order Quantity
  mpq: Number, // Minimum Package Quantity
  safetyStock: { type: Number, default: 0 },
  
  // Cost
  standardCost: Number,
  lastPurchasePrice: Number,
  currency: { type: String, default: 'CNY' },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'obsolete', 'under_development'],
    default: 'active'
  },
  
  // Other
  storageConditions: String,
  shelfLife: Number, // Days
  isHazardous: { type: Boolean, default: false },
  
  // Custom Fields
  customFields: Mixed,
  
  // Attachments
  files: [{
    name: String,
    path: String,
    type: String,
    description: String,
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    uploadedAt: Date
  }],
  
  // Metadata
  notes: String,
  createdBy: { type: ObjectId, ref: 'Admin', required: true },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
materialSchema.index({ materialCode: 1 });
materialSchema.index({ 'materialName.zh': 'text', 'materialName.en': 'text' });
materialSchema.index({ category: 1, status: 1 });
materialSchema.index({ status: 1 });
```

#### 2.2.3 MaterialQuotation Model (NEW)
```javascript
{
  _id: ObjectId,
  quotationNumber: { type: String, unique: true, required: true },
  material: { type: ObjectId, ref: 'Material', required: true },
  supplier: { type: ObjectId, ref: 'Supplier', required: true },
  
  // Price Information
  unitPrice: { type: Number, required: true },
  currency: { type: String, default: 'CNY' },
  quantity: Number,
  totalAmount: Number,
  
  // Terms
  quotationDate: { type: Date, required: true },
  validUntil: Date,
  paymentTerms: String,
  deliveryTerms: String,
  leadTime: Number, // Days
  moq: Number,
  mpq: Number,
  
  // Reference
  supplierQuotationRef: String, // Supplier's quotation number
  
  // Three-source Comparison Position
  isPreferred: { type: Boolean, default: false },
  comparisonRank: { type: Number, min: 1, max: 3 }, // 1, 2, or 3
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired', 'cancelled'],
    default: 'draft'
  },
  
  // Workflow
  workflowInstance: { type: ObjectId, ref: 'WorkflowInstance' },
  currentApprovalLevel: Number,
  
  // Attachments
  files: [{
    name: String,
    path: String,
    description: String,
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    uploadedAt: Date
  }],
  
  // Version Control
  version: { type: Number, default: 1 },
  previousVersion: { type: ObjectId, ref: 'MaterialQuotation' },
  isLatestVersion: { type: Boolean, default: true },
  
  // Metadata
  notes: String,
  createdBy: { type: ObjectId, ref: 'Admin', required: true },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
materialQuotationSchema.index({ quotationNumber: 1 });
materialQuotationSchema.index({ material: 1, supplier: 1, validUntil: -1 });
materialQuotationSchema.index({ status: 1 });
materialQuotationSchema.index({ material: 1, isPreferred: 1, isLatestVersion: 1 });
```

#### 2.2.4 PurchaseOrder Model (NEW)
```javascript
{
  _id: ObjectId,
  poNumber: { type: String, unique: true, required: true },
  poDate: { type: Date, default: Date.now },
  supplier: { type: ObjectId, ref: 'Supplier', required: true },
  
  // Line Items
  items: [{
    lineNumber: Number,
    material: { type: ObjectId, ref: 'Material', required: true },
    description: String,
    quantity: { type: Number, required: true },
    uom: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    amount: Number, // quantity * unitPrice
    requiredDeliveryDate: Date,
    
    // Receipt Tracking
    receivedQuantity: { type: Number, default: 0 },
    outstandingQuantity: Number,
    actualReceiptDate: Date,
    lineStatus: {
      type: String,
      enum: ['open', 'partial', 'received', 'closed'],
      default: 'open'
    },
    
    // Internal Traceability (not shown to supplier)
    customerOrderNumber: String,
    customerModel: String,
    internalSO: String,
    internalModel: String,
    project: String,
    purpose: String,
    
    remarks: String
  }],
  
  // Totals
  currency: { type: String, default: 'CNY' },
  subTotal: Number,
  taxRate: Number,
  taxAmount: Number,
  total: { type: Number, required: true },
  
  // Terms
  paymentTerms: String,
  deliveryTerms: String,
  shippingAddress: {
    contactPerson: String,
    phone: String,
    address: String
  },
  termsAndConditions: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_approval', 'approved', 'sent_to_supplier', 
           'in_transit', 'partially_received', 'received', 'closed', 'cancelled'],
    default: 'draft'
  },
  
  // Workflow
  workflowInstance: { type: ObjectId, ref: 'WorkflowInstance' },
  currentApprovalLevel: Number,
  
  // MRP Linkage
  mrpSuggestions: [{ type: ObjectId, ref: 'MRP' }],
  
  // Attachments
  files: [{
    name: String,
    path: String,
    type: String,
    description: String,
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    uploadedAt: Date
  }],
  
  // Metadata
  notes: String,
  createdBy: { type: ObjectId, ref: 'Admin', required: true },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1, poDate: -1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ 'items.material': 1 });
purchaseOrderSchema.index({ 'items.internalSO': 1 });
purchaseOrderSchema.index({ 'items.customerOrderNumber': 1 });
```

#### 2.2.5 PrePayment Model (NEW)
```javascript
{
  _id: ObjectId,
  applicationNumber: { type: String, unique: true, required: true },
  purchaseOrder: { type: ObjectId, ref: 'PurchaseOrder', required: true },
  supplier: { type: ObjectId, ref: 'Supplier', required: true },
  
  // Payment Details
  paymentAmount: { type: Number, required: true },
  currency: { type: String, default: 'CNY' },
  paymentPercentage: Number, // % of PO total
  requestedPaymentDate: Date,
  
  // Justification
  reason: { type: String, required: true },
  paymentTermsReference: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_approval', 'approved', 'payment_processed', 'cancelled'],
    default: 'draft'
  },
  
  // Payment Execution
  paymentDate: Date,
  paymentReference: String,
  paymentMethod: String,
  
  // Workflow
  workflowInstance: { type: ObjectId, ref: 'WorkflowInstance' },
  currentApprovalLevel: Number,
  
  // Attachments
  files: [{
    name: String,
    path: String,
    description: String,
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    uploadedAt: Date
  }],
  
  // Metadata
  notes: String,
  createdBy: { type: ObjectId, ref: 'Admin', required: true },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
prePaymentSchema.index({ applicationNumber: 1 });
prePaymentSchema.index({ purchaseOrder: 1 });
prePaymentSchema.index({ supplier: 1, status: 1 });
prePaymentSchema.index({ status: 1 });
```

#### 2.2.6 MRP Model (NEW)
```javascript
{
  _id: ObjectId,
  mrpRunId: { type: String, required: true }, // Group MRP calculations
  runDate: { type: Date, default: Date.now },
  
  material: { type: ObjectId, ref: 'Material', required: true },
  
  // Current State
  onHandQuantity: { type: Number, default: 0 },
  inTransitQuantity: { type: Number, default: 0 },
  safetyStock: { type: Number, default: 0 },
  
  // Demand
  grossRequirement: { type: Number, default: 0 },
  requiredDate: Date,
  demandSource: String, // 'sales_order', 'forecast', 'manual'
  demandReference: String,
  
  // Calculation
  netRequirement: Number, // Gross - OnHand - InTransit + SafetyStock
  suggestedOrderQty: Number, // Adjusted for MOQ/MPQ
  suggestedOrderDate: Date, // RequiredDate - LeadTime
  
  // Supplier Recommendation
  preferredSupplier: { type: ObjectId, ref: 'Supplier' },
  estimatedPrice: Number,
  currency: String,
  
  // Status
  status: {
    type: String,
    enum: ['suggested', 'under_review', 'po_created', 'cancelled', 'ignored'],
    default: 'suggested'
  },
  
  // Exception Flags
  isUrgent: { type: Boolean, default: false }, // Immediate requirement
  isBelowSafetyStock: { type: Boolean, default: false },
  hasNegativeInventory: { type: Boolean, default: false },
  
  // PO Linkage
  generatedPO: { type: ObjectId, ref: 'PurchaseOrder' },
  
  // Metadata
  calculatedBy: String, // 'system' or user ID
  notes: String,
  created: { type: Date, default: Date.now },
  removed: { type: Boolean, default: false }
}

// Indexes
mrpSchema.index({ mrpRunId: 1, material: 1 });
mrpSchema.index({ material: 1, status: 1 });
mrpSchema.index({ status: 1, requiredDate: 1 });
mrpSchema.index({ isUrgent: 1, status: 1 });
```

#### 2.2.7 Inventory Model (NEW)
```javascript
{
  _id: ObjectId,
  material: { type: ObjectId, ref: 'Material', required: true },
  location: String, // Warehouse location
  
  // Quantities
  onHandQuantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  availableQuantity: Number, // OnHand - Reserved
  
  // Batch/Lot (if applicable)
  batchNumber: String,
  lotNumber: String,
  expiryDate: Date,
  
  // Last Movement
  lastMovementDate: Date,
  lastMovementType: String, // 'receipt', 'issue', 'transfer', 'adjustment'
  
  // Metadata
  updated: { type: Date, default: Date.now },
  removed: { type: Boolean, default: false }
}

// Indexes
inventorySchema.index({ material: 1, location: 1 }, { unique: true });
inventorySchema.index({ material: 1 });
```

### 2.3 Workflow Models (NEW)

#### 2.3.1 Workflow Model (NEW)
```javascript
{
  _id: ObjectId,
  workflowName: String,
  displayName: {
    zh: String,
    en: String
  },
  documentType: { 
    type: String, 
    required: true,
    enum: ['supplier', 'material_quotation', 'purchase_order', 'pre_payment']
  },
  
  // Workflow Definition
  levels: [{
    levelNumber: { type: Number, required: true },
    levelName: String,
    approverRoles: [{ type: ObjectId, ref: 'Role' }],
    approvalMode: { 
      type: String, 
      enum: ['any', 'all'], 
      default: 'any' 
    }, // If multiple approvers
    isMandatory: { type: Boolean, default: true }
  }],
  
  // Routing Rules
  routingRules: [{
    conditionType: String, // 'amount', 'supplier_level', 'material_category'
    operator: String, // 'gt', 'lt', 'eq', 'in'
    value: Mixed,
    targetLevels: [Number] // Which levels to activate
  }],
  
  // Settings
  allowRecall: { type: Boolean, default: true },
  onRejection: { 
    type: String, 
    enum: ['return_to_submitter', 'return_to_previous_level'],
    default: 'return_to_submitter'
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  
  // Metadata
  createdBy: { type: ObjectId, ref: 'Admin' },
  created: { type: Date, default: Date.now },
  updated: Date,
  removed: { type: Boolean, default: false }
}

// Indexes
workflowSchema.index({ documentType: 1, isActive: 1 });
```

#### 2.3.2 WorkflowInstance Model (NEW)
```javascript
{
  _id: ObjectId,
  workflow: { type: ObjectId, ref: 'Workflow', required: true },
  documentType: String,
  documentId: ObjectId,
  documentNumber: String, // For display
  
  // Current State
  currentLevel: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Approval History
  approvalHistory: [{
    level: Number,
    levelName: String,
    approver: { type: ObjectId, ref: 'Admin', required: true },
    action: { type: String, enum: ['approve', 'reject', 'recall'], required: true },
    comments: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Required Levels (determined by routing rules)
  requiredLevels: [Number],
  completedLevels: [Number],
  
  // Submitter
  submittedBy: { type: ObjectId, ref: 'Admin', required: true },
  submittedAt: { type: Date, default: Date.now },
  
  // Completion
  completedAt: Date,
  
  // Metadata
  created: { type: Date, default: Date.now },
  updated: Date
}

// Indexes
workflowInstanceSchema.index({ documentType: 1, documentId: 1 });
workflowInstanceSchema.index({ status: 1, currentLevel: 1 });
workflowInstanceSchema.index({ submittedBy: 1, status: 1 });
workflowInstanceSchema.index({ 'approvalHistory.approver': 1, status: 1 });
```

---

## 3. API Specifications

### 3.1 API Design Principles

1. **RESTful Architecture:** Follow REST conventions for resource naming and HTTP methods
2. **Consistent Responses:** Standardized response format across all endpoints
3. **Error Handling:** Clear error messages with appropriate HTTP status codes
4. **Versioning:** API version in URL path (e.g., `/api/v1/`)
5. **Authentication:** JWT-based authentication for all protected routes
6. **Authorization:** Role and permission checks via middleware
7. **Pagination:** Standard pagination for list endpoints
8. **Filtering:** Query parameter-based filtering
9. **Sorting:** Query parameter for sort field and direction

### 3.2 Standard Response Format

```javascript
// Success Response
{
  success: true,
  result: {}, // or [] for lists
  message: "Operation successful",
  pagination: { // For list endpoints
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}

// Error Response
{
  success: false,
  message: "Error description",
  error: "ERROR_CODE",
  details: {} // Optional additional error details
}
```

### 3.3 Supplier API Endpoints

#### Create Supplier
```
POST /api/v1/supplier/create
Headers: Authorization: Bearer <token>
Body: {
  supplierName: { zh: String, en: String },
  supplierType: String,
  contactPerson: String,
  phone: String,
  email: String,
  address: { country, province, city, street, postalCode },
  businessLicense: String,
  taxId: String,
  bankInfo: { bankName, accountNumber, bankBranch, swiftCode },
  supplierLevel: String,
  paymentTerms: String,
  currency: String,
  notes: String
}
Response: { success, result: supplierObject, message }
```

#### Get Supplier List
```
GET /api/v1/supplier/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page: Number (default: 1)
  - limit: Number (default: 10)
  - status: String (filter)
  - supplierLevel: String (filter)
  - search: String (search supplier name, code)
  - sortBy: String (default: 'created')
  - sortOrder: String (asc|desc, default: 'desc')
Response: { success, result: [suppliers], pagination, message }
```

#### Get Supplier by ID
```
GET /api/v1/supplier/read/:id
Headers: Authorization: Bearer <token>
Response: { success, result: supplierObject, message }
```

#### Update Supplier
```
PATCH /api/v1/supplier/update/:id
Headers: Authorization: Bearer <token>
Body: { fields to update }
Response: { success, result: updatedSupplier, message }
```

#### Delete Supplier (Soft Delete)
```
DELETE /api/v1/supplier/delete/:id
Headers: Authorization: Bearer <token>
Response: { success, message }
```

#### Submit Supplier for Approval
```
POST /api/v1/supplier/submit/:id
Headers: Authorization: Bearer <token>
Response: { success, result: { workflowInstance }, message }
```

#### Approve/Reject Supplier
```
POST /api/v1/supplier/approval/:id
Headers: Authorization: Bearer <token>
Body: {
  action: 'approve' | 'reject',
  comments: String
}
Response: { success, result: { supplier, workflowInstance }, message }
```

#### Export Suppliers to Excel
```
GET /api/v1/supplier/export
Headers: Authorization: Bearer <token>
Query Parameters: (same as list filters)
Response: Excel file download
```

### 3.4 Material API Endpoints

#### Create Material
```
POST /api/v1/material/create
Headers: Authorization: Bearer <token>
Body: {
  materialName: { zh: String, en: String },
  materialCode: String (optional, auto-generated if not provided),
  specification: String,
  category: String,
  baseUOM: String,
  defaultSupplier: ObjectId,
  leadTime: Number,
  moq: Number,
  mpq: Number,
  safetyStock: Number,
  status: String,
  ...
}
Response: { success, result: materialObject, message }
```

#### Get Material List
```
GET /api/v1/material/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit, search, sortBy, sortOrder
  - status: String (filter)
  - category: String (filter)
Response: { success, result: [materials], pagination, message }
```

#### Get Material by ID
```
GET /api/v1/material/read/:id
Headers: Authorization: Bearer <token>
Response: { success, result: materialObject, message }
```

#### Update Material
```
PATCH /api/v1/material/update/:id
Headers: Authorization: Bearer <token>
Body: { fields to update }
Response: { success, result: updatedMaterial, message }
```

#### Export Materials to Excel
```
GET /api/v1/material/export
Headers: Authorization: Bearer <token>
Query Parameters: (same as list filters)
Response: Excel file download
```

### 3.5 Material Quotation API Endpoints

#### Create Quotation
```
POST /api/v1/quotation/create
Headers: Authorization: Bearer <token>
Body: {
  material: ObjectId,
  supplier: ObjectId,
  unitPrice: Number,
  currency: String,
  quantity: Number,
  quotationDate: Date,
  validUntil: Date,
  paymentTerms: String,
  leadTime: Number,
  moq: Number,
  mpq: Number,
  supplierQuotationRef: String,
  isPreferred: Boolean,
  notes: String
}
Response: { success, result: quotationObject, message }
```

#### Get Quotation List
```
GET /api/v1/quotation/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit, sortBy, sortOrder
  - material: ObjectId (filter)
  - supplier: ObjectId (filter)
  - status: String (filter)
Response: { success, result: [quotations], pagination, message }
```

#### Get Three-source Comparison for Material
```
GET /api/v1/quotation/comparison/:materialId
Headers: Authorization: Bearer <token>
Response: { 
  success, 
  result: {
    material: materialObject,
    quotations: [quotation1, quotation2, quotation3], // Top 3
    preferred: quotationObject
  }, 
  message 
}
```

#### Submit Quotation for Approval
```
POST /api/v1/quotation/submit/:id
Headers: Authorization: Bearer <token>
Response: { success, result: { workflowInstance }, message }
```

#### Approve/Reject Quotation
```
POST /api/v1/quotation/approval/:id
Headers: Authorization: Bearer <token>
Body: {
  action: 'approve' | 'reject',
  comments: String
}
Response: { success, result: { quotation, workflowInstance }, message }
```

### 3.6 Purchase Order API Endpoints

#### Create Purchase Order
```
POST /api/v1/purchase-order/create
Headers: Authorization: Bearer <token>
Body: {
  supplier: ObjectId,
  currency: String,
  items: [{
    material: ObjectId,
    description: String,
    quantity: Number,
    uom: String,
    unitPrice: Number,
    requiredDeliveryDate: Date,
    customerOrderNumber: String,
    internalSO: String,
    project: String,
    remarks: String
  }],
  paymentTerms: String,
  deliveryTerms: String,
  shippingAddress: { contactPerson, phone, address },
  notes: String
}
Response: { success, result: purchaseOrderObject, message }
```

#### Create PO from MRP
```
POST /api/v1/purchase-order/create-from-mrp
Headers: Authorization: Bearer <token>
Body: {
  mrpIds: [ObjectId], // MRP suggestion IDs
  groupBySupplier: Boolean // Whether to create separate POs per supplier
}
Response: { 
  success, 
  result: { 
    purchaseOrders: [poObject1, poObject2, ...] 
  }, 
  message 
}
```

#### Get Purchase Order List
```
GET /api/v1/purchase-order/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit, sortBy, sortOrder
  - supplier: ObjectId (filter)
  - status: String (filter)
  - internalSO: String (filter)
  - customerOrderNumber: String (filter)
  - dateFrom, dateTo: Date range filter
Response: { success, result: [purchaseOrders], pagination, message }
```

#### Get Purchase Order by ID
```
GET /api/v1/purchase-order/read/:id
Headers: Authorization: Bearer <token>
Response: { success, result: poObject, message }
```

#### Submit Purchase Order for Approval
```
POST /api/v1/purchase-order/submit/:id
Headers: Authorization: Bearer <token>
Response: { success, result: { workflowInstance }, message }
```

#### Approve/Reject Purchase Order
```
POST /api/v1/purchase-order/approval/:id
Headers: Authorization: Bearer <token>
Body: {
  action: 'approve' | 'reject',
  comments: String
}
Response: { success, result: { purchaseOrder, workflowInstance }, message }
```

#### Record Goods Receipt
```
POST /api/v1/purchase-order/goods-receipt/:id
Headers: Authorization: Bearer <token>
Body: {
  receipts: [{
    lineNumber: Number,
    receivedQuantity: Number,
    actualReceiptDate: Date
  }]
}
Response: { success, result: updatedPO, message }
```

#### Generate PO PDF for Supplier
```
GET /api/v1/purchase-order/generate-pdf/:id
Headers: Authorization: Bearer <token>
Query Parameters:
  - includeInternal: Boolean (default: false) // For internal use only
Response: PDF file download
```

#### Export Purchase Orders to Excel
```
GET /api/v1/purchase-order/export
Headers: Authorization: Bearer <token>
Query Parameters: (same as list filters)
Response: Excel file download
```

### 3.7 MRP API Endpoints

#### Run MRP Calculation
```
POST /api/v1/mrp/calculate
Headers: Authorization: Bearer <token>
Body: {
  materials: [ObjectId], // Specific materials or empty for all
  considerLeadTime: Boolean,
  considerSafetyStock: Boolean
}
Response: { 
  success, 
  result: { 
    mrpRunId: String,
    calculationSummary: {
      totalMaterials: Number,
      materialsWithRequirements: Number,
      urgentRequirements: Number
    }
  }, 
  message 
}
```

#### Get MRP List
```
GET /api/v1/mrp/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit, sortBy, sortOrder
  - mrpRunId: String (filter)
  - material: ObjectId (filter)
  - status: String (filter)
  - isUrgent: Boolean (filter)
  - requiredDateFrom, requiredDateTo: Date range
Response: { success, result: [mrpRecords], pagination, message }
```

#### Get MRP by ID
```
GET /api/v1/mrp/read/:id
Headers: Authorization: Bearer <token>
Response: { success, result: mrpObject, message }
```

#### Update MRP Status
```
PATCH /api/v1/mrp/update-status/:id
Headers: Authorization: Bearer <token>
Body: {
  status: String,
  notes: String
}
Response: { success, result: updatedMRP, message }
```

#### Export MRP to Excel
```
GET /api/v1/mrp/export
Headers: Authorization: Bearer <token>
Query Parameters: (same as list filters)
Response: Excel file download
```

### 3.8 Pre-payment API Endpoints

#### Create Pre-payment Application
```
POST /api/v1/pre-payment/create
Headers: Authorization: Bearer <token>
Body: {
  purchaseOrder: ObjectId,
  paymentAmount: Number,
  currency: String,
  requestedPaymentDate: Date,
  reason: String,
  paymentTermsReference: String,
  notes: String
}
Response: { success, result: prePaymentObject, message }
```

#### Get Pre-payment List
```
GET /api/v1/pre-payment/list
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit, sortBy, sortOrder
  - supplier: ObjectId (filter)
  - status: String (filter)
  - purchaseOrder: ObjectId (filter)
Response: { success, result: [prePayments], pagination, message }
```

#### Submit Pre-payment for Approval
```
POST /api/v1/pre-payment/submit/:id
Headers: Authorization: Bearer <token>
Response: { success, result: { workflowInstance }, message }
```

#### Approve/Reject Pre-payment
```
POST /api/v1/pre-payment/approval/:id
Headers: Authorization: Bearer <token>
Body: {
  action: 'approve' | 'reject',
  comments: String
}
Response: { success, result: { prePayment, workflowInstance }, message }
```

#### Record Payment Execution
```
POST /api/v1/pre-payment/record-payment/:id
Headers: Authorization: Bearer <token>
Body: {
  paymentDate: Date,
  paymentReference: String,
  paymentMethod: String
}
Response: { success, result: updatedPrePayment, message }
```

### 3.9 Workflow API Endpoints

#### Get Pending Approvals for User
```
GET /api/v1/workflow/pending-approvals
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, limit
  - documentType: String (filter)
Response: { 
  success, 
  result: [{
    workflowInstance: Object,
    documentType: String,
    documentNumber: String,
    documentData: Object, // Populated document
    submittedBy: Object,
    submittedAt: Date,
    currentLevel: Number
  }], 
  pagination, 
  message 
}
```

#### Get Workflow History for Document
```
GET /api/v1/workflow/history/:documentType/:documentId
Headers: Authorization: Bearer <token>
Response: { 
  success, 
  result: {
    workflowInstance: Object,
    approvalHistory: Array
  }, 
  message 
}
```

### 3.10 Role and Permission API Endpoints

#### Get User Permissions
```
GET /api/v1/permission/my-permissions
Headers: Authorization: Bearer <token>
Response: { 
  success, 
  result: {
    roles: [roleObjects],
    permissions: [permissionObjects],
    approvalAuthority: Object
  }, 
  message 
}
```

#### Check Permission
```
POST /api/v1/permission/check
Headers: Authorization: Bearer <token>
Body: {
  resource: String,
  action: String
}
Response: { success, result: { hasPermission: Boolean }, message }
```

---

## 4. Frontend Component Design

### 4.1 Module Structure

Each module follows a consistent structure:

```
ModuleName/
├── index.jsx              # Module entry point
├── components/
│   ├── ModuleForm.jsx     # Create/Edit form
│   ├── ModuleDataTable.jsx # List view
│   ├── ModuleDetail.jsx   # Detail view
│   └── ModuleFilter.jsx   # Advanced filter
├── config/
│   ├── fields.js          # Form field configuration
│   └── columns.js         # Table column configuration
├── hooks/
│   ├── useModuleData.js   # Custom hook for data fetching
│   └── useModuleForm.js   # Custom hook for form logic
└── utils/
    └── validation.js      # Field validation rules
```

### 4.2 Common Reusable Components

#### FileUploadComponent.jsx
```jsx
// Reusable File Upload Component
// Features: Drag and drop, multiple files, validation, preview
// Props: maxFiles, maxSize, acceptedTypes, required, onChange
```

#### ExportButton.jsx
```jsx
// Reusable Export to Excel Button
// Features: Loading indicator, success notification, automatic download
// Props: exportFunction, filters, fileName, disabled
```

#### StatusBadge.jsx
```jsx
// Status Display Component
// Features: Color-coded badges, multilingual labels
// Props: status, type ('supplier' | 'material' | 'quotation' | 'purchase_order' | 'pre_payment')
```

#### ApprovalFlow.jsx
```jsx
// Reusable Approval Flow Visualization Component
// Features: Workflow steps timeline, approval history
// Props: workflowInstance, documentType
```

#### ApprovalModal.jsx
```jsx
// Approval Action Modal
// Features: Document summary, approval flow, approve/reject actions
// Props: document, documentType, workflowInstance, onApprove, onReject
```

### 4.3 Redux State Management

All modules follow the same Redux pattern:

```javascript
// State Structure
{
  moduleName: {
    list: [],
    current: null,
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    },
    filters: {}
  }
}

// Common Actions:
// - fetch{Module}List
// - fetch{Module}ById
// - create{Module}
// - update{Module}
// - delete{Module}
// - submit{Module}ForApproval
// - export{Module}
// - setFilters
// - resetFilters
```

---

## 5. Workflow Engine Implementation

### 5.1 Workflow Engine Core

```javascript
// WorkflowEngine.js - Core Workflow Engine

class WorkflowEngine {
  // Initialize workflow for a document
  async initiateWorkflow(documentType, documentId, documentData, submittedBy) {
    // 1. Find applicable workflow
    // 2. Determine required approval levels based on routing rules
    // 3. Create workflow instance
    // 4. Notify first level approvers
  }

  // Process approval action
  async processApproval(workflowInstanceId, approverId, action, comments) {
    // 1. Validate approver has authority
    // 2. Record approval action
    // 3. Handle approval or rejection
  }

  // Handle approval
  async handleApprove(instance, workflow) {
    // 1. Mark current level as completed
    // 2. Check if all required levels are completed
    // 3. If completed: update document status, notify submitter
    // 4. If not: move to next level, notify next approvers
  }

  // Handle rejection
  async handleReject(instance, workflow, comments) {
    // 1. Update instance status to rejected
    // 2. Update document status
    // 3. Notify submitter
  }
}
```

### 5.2 Approval Router

```javascript
// ApprovalRouter.js - Determines approval path based on rules

class ApprovalRouter {
  // Determine which approval levels are required
  async determineApprovalPath(workflow, documentData) {
    // 1. Start with mandatory levels
    // 2. Apply routing rules based on conditions
    // 3. Return sorted list of required levels
  }

  // Evaluate routing rule
  evaluateRule(rule, documentData) {
    // Evaluate conditions: amount, supplier_level, material_category, etc.
  }
}
```

---

## 6. Excel Export Implementation

### 6.1 Excel Export Service

```javascript
// ExcelExportService.js - Generic Excel export service

const ExcelJS = require('exceljs');

class ExcelExportService {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  // Generic export method
  async export(data, template, filename) {
    const worksheet = this.workbook.addWorksheet('Data');
    
    // 1. Add headers from template
    this.addHeaders(worksheet, template.columns);
    
    // 2. Add data rows
    this.addDataRows(worksheet, data, template.columnMapping);
    
    // 3. Apply styling
    this.applyStyle(worksheet, template.style);
    
    // 4. Auto-fit columns
    this.autoFitColumns(worksheet);
    
    // 5. Generate file
    return await this.generateFile(filename);
  }

  addHeaders(worksheet, columns) {
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  }

  addDataRows(worksheet, data, columnMapping) {
    data.forEach(item => {
      const row = columnMapping.map(mapping => {
        return this.getValue(item, mapping.field, mapping.formatter);
      });
      worksheet.addRow(row);
    });
  }

  getValue(item, field, formatter) {
    let value = field.split('.').reduce((obj, key) => obj?.[key], item);
    return formatter ? formatter(value) : value;
  }

  applyStyle(worksheet, style) {
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  }

  autoFitColumns(worksheet) {
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  async generateFile(filename) {
    const buffer = await this.workbook.xlsx.writeBuffer();
    return { buffer, filename };
  }
}

module.exports = ExcelExportService;
```

### 6.2 Export Templates

```javascript
// templates/supplierExportTemplate.js

module.exports = {
  columns: [
    { header: '供应商编号', key: 'supplierCode' },
    { header: '供应商名称', key: 'supplierName' },
    { header: '联系人', key: 'contactPerson' },
    { header: '电话', key: 'phone' },
    { header: '邮箱', key: 'email' },
    { header: '地址', key: 'address' },
    { header: '供应商类型', key: 'supplierType' },
    { header: '供应商等级', key: 'supplierLevel' },
    { header: '状态', key: 'status' },
    { header: '创建日期', key: 'created' }
  ],
  columnMapping: [
    { field: 'supplierCode' },
    { field: 'supplierName.zh' },
    { field: 'contactPerson' },
    { field: 'phone' },
    { field: 'email' },
    { field: 'address.street', formatter: (v) => formatAddress(v) },
    { field: 'supplierType', formatter: (v) => translateSupplierType(v) },
    { field: 'supplierLevel' },
    { field: 'status', formatter: (v) => translateStatus(v) },
    { field: 'created', formatter: (v) => formatDate(v) }
  ],
  style: {
    header: { bold: true, bgColor: 'D3D3D3' }
  }
};
```

---

## 7. Sprint Planning

### 7.1 Sprint Structure

**Total Duration:** 24 weeks (6 sprints of 4 weeks each)

Each sprint follows:
- **Week 1-2:** Development
- **Week 3:** Testing and bug fixes
- **Week 4:** User acceptance testing and deployment to staging

### 7.2 Phase 1: Foundation (Sprint 1-2, Weeks 1-8)

#### Sprint 1 (Weeks 1-4): Core Infrastructure

**Goals:** Establish role-based access control and workflow engine

**User Stories:**
1. As a system administrator, I can create and manage user roles
2. As a system administrator, I can assign permissions to roles
3. As a system administrator, I can define workflows for different document types
4. As a user, I can only access features I have permission for
5. As an administrator, I can view audit logs of all system operations

**Tasks:**
- [ ] Create Role model and CRUD APIs (2 days)
- [ ] Create Permission model and CRUD APIs (2 days)
- [ ] Extend Admin model with roles array (1 day)
- [ ] Implement RBAC middleware (3 days)
- [ ] Create Workflow model (2 days)
- [ ] Create WorkflowInstance model (2 days)
- [ ] Implement WorkflowEngine core (5 days)
- [ ] Implement ApprovalRouter (3 days)
- [ ] Create AuditLog model and service (3 days)
- [ ] Frontend: Role management UI (3 days)
- [ ] Frontend: Workflow configuration UI (4 days)
- [ ] Frontend: ApprovalFlow component (2 days)
- [ ] Testing: RBAC and workflow engine (4 days)
- [ ] Documentation (2 days)

**Deliverables:**
- Working RBAC system with predefined roles
- Configurable workflow engine
- Audit logging infrastructure
- Approval flow visualization component

#### Sprint 2 (Weeks 5-8): File Management and Excel Export

**Goals:** Implement attachment management and Excel export infrastructure

**User Stories:**
1. As a user, I can upload multiple files to any document
2. As a user, I can download attached files
3. As a user, I can export any list to Excel format
4. As a system, I can store files securely (local or S3)

**Tasks:**
- [ ] Review and extend existing Upload model (1 day)
- [ ] Create generic attachment service (3 days)
- [ ] Install and configure exceljs (1 day)
- [ ] Create ExcelExportService (4 days)
- [ ] Create export templates for all modules (3 days)
- [ ] Frontend: FileUploadComponent (3 days)
- [ ] Frontend: ExportButton component (2 days)
- [ ] Test file upload/download (2 days)
- [ ] Test Excel export with sample data (3 days)
- [ ] Performance testing for large exports (2 days)
- [ ] Documentation (2 days)

**Deliverables:**
- Generic file attachment capability
- Reusable Excel export service
- Export functionality for all modules
- File upload/download UI components

### 7.3 Phase 2: Master Data (Sprint 3-4, Weeks 9-16)

#### Sprint 3 (Weeks 9-12): Supplier Management

**Goals:** Complete supplier management module with workflow

**User Stories:**
1. As a data entry personnel, I can create new suppliers
2. As a data entry personnel, I can attach required documents to suppliers
3. As a purchaser, I can search and filter suppliers
4. As a procurement manager, I can approve new suppliers
5. As a user, I can export supplier list to Excel

**Tasks:**
- [ ] Create Supplier model (2 days)
- [ ] Create Supplier CRUD APIs (4 days)
- [ ] Implement supplier approval workflow (3 days)
- [ ] Create supplier number generation logic (1 day)
- [ ] Frontend: SupplierForm component (5 days)
- [ ] Frontend: SupplierDataTable component (4 days)
- [ ] Frontend: SupplierDetail component (3 days)
- [ ] Frontend: SupplierFilter component (2 days)
- [ ] Integrate file attachments (2 days)
- [ ] Implement supplier Excel export (2 days)
- [ ] Testing: Supplier CRUD and workflow (4 days)
- [ ] Testing: Excel export validation (2 days)
- [ ] Documentation and training materials (2 days)

**Deliverables:**
- Complete supplier management module
- Supplier approval workflow
- Supplier list Excel export

#### Sprint 4 (Weeks 13-16): Material Management

**Goals:** Complete material management module

**User Stories:**
1. As an engineer, I can create new materials
2. As a user, I can define material categories
3. As a user, I can manage multiple units of measure
4. As a purchaser, I can search materials by various criteria
5. As a user, I can export material list to Excel

**Tasks:**
- [ ] Create Material model (2 days)
- [ ] Create Material CRUD APIs (4 days)
- [ ] Implement material category hierarchy (3 days)
- [ ] Implement UOM management (2 days)
- [ ] Create material number generation logic (1 day)
- [ ] Frontend: MaterialForm component (5 days)
- [ ] Frontend: MaterialDataTable component (4 days)
- [ ] Frontend: MaterialDetail component (3 days)
- [ ] Frontend: MaterialFilter component (2 days)
- [ ] Frontend: Category management UI (3 days)
- [ ] Implement material Excel export (2 days)
- [ ] Testing: Material CRUD and categories (4 days)
- [ ] Documentation (2 days)

**Deliverables:**
- Complete material management module
- Material category hierarchy
- Material list Excel export

### 7.4 Phase 3: Procurement Processes (Sprint 5-6, Weeks 17-24)

#### Sprint 5 (Weeks 17-20): Quotation and Purchase Order

**Goals:** Implement quotation management and purchase orders

**User Stories:**
1. As a purchaser, I can create material quotations
2. As a cost center, I can view three-source price comparison
3. As a purchaser, I can create purchase orders
4. As a purchaser, I can create PO from MRP suggestions
5. As a purchaser, I can generate PO PDF for supplier
6. As warehouse personnel, I can record goods receipt

**Tasks:**
- [ ] Create MaterialQuotation model (2 days)
- [ ] Create MaterialQuotation CRUD APIs (4 days)
- [ ] Implement quotation approval workflow (3 days)
- [ ] Implement three-source comparison logic (3 days)
- [ ] Create PurchaseOrder model (3 days)
- [ ] Create PurchaseOrder CRUD APIs (5 days)
- [ ] Implement PO approval workflow (3 days)
- [ ] Implement goods receipt logic (3 days)
- [ ] Frontend: QuotationForm component (5 days)
- [ ] Frontend: QuotationComparisonView component (4 days)
- [ ] Frontend: PurchaseOrderForm component (6 days)
- [ ] Frontend: PurchaseOrderDataTable component (4 days)
- [ ] Frontend: GoodsReceiptModal component (3 days)
- [ ] Implement PO PDF generation (4 days)
- [ ] Implement PO Excel export (2 days)
- [ ] Testing: Quotation and PO workflows (5 days)
- [ ] Documentation (2 days)

**Deliverables:**
- Quotation management with approval
- Three-source price comparison
- Purchase order management
- PO PDF generation
- Goods receipt functionality

#### Sprint 6 (Weeks 21-24): MRP and Pre-payment

**Goals:** Implement MRP calculation and pre-payment management

**User Stories:**
1. As an MRP planner, I can run MRP calculation
2. As a purchaser, I can view MRP suggestions
3. As a purchaser, I can create PO from MRP
4. As a purchaser, I can create pre-payment applications
5. As a finance director, I can approve pre-payments

**Tasks:**
- [ ] Create MRP model (2 days)
- [ ] Create Inventory model (2 days)
- [ ] Implement MRP calculation engine (6 days)
- [ ] Create MRP APIs (3 days)
- [ ] Create PrePayment model (2 days)
- [ ] Create PrePayment CRUD APIs (3 days)
- [ ] Implement pre-payment approval workflow (3 days)
- [ ] Frontend: MRPDashboard component (4 days)
- [ ] Frontend: MRPDataTable component (5 days)
- [ ] Frontend: MRPDetailModal component (3 days)
- [ ] Frontend: PrePaymentForm component (4 days)
- [ ] Frontend: PrePaymentDataTable component (3 days)
- [ ] Implement MRP Excel export (2 days)
- [ ] Integration: MRP to PO creation (3 days)
- [ ] Testing: MRP calculation accuracy (5 days)
- [ ] Testing: Pre-payment workflow (3 days)
- [ ] End-to-end testing (5 days)
- [ ] Documentation and training (3 days)

**Deliverables:**
- MRP calculation engine
- MRP-to-PO integration
- Pre-payment management
- Complete system integration

---

## 8. Testing Strategy

### 8.1 Unit Testing

**Framework:** Jest, Mocha

**Coverage Target:** 80%

**Test Areas:**
- Model validations
- Service layer business logic
- Utility functions
- Workflow engine logic
- MRP calculation logic

**Example Test Structure:**
```javascript
describe('WorkflowEngine', () => {
  describe('initiateWorkflow', () => {
    it('should create workflow instance with correct initial state', async () => {
      // Test implementation
    });
    
    it('should determine approval levels based on amount', async () => {
      // Test implementation
    });
  });
  
  describe('processApproval', () => {
    it('should move to next level on approval', async () => {
      // Test implementation
    });
    
    it('should reject workflow and notify submitter', async () => {
      // Test implementation
    });
  });
});
```

### 8.2 Integration Testing

**Framework:** Supertest (API testing)

**Test Areas:**
- API endpoints
- Database operations
- Workflow integration
- File upload/download
- Excel export

**Example Test:**
```javascript
describe('Supplier API', () => {
  it('POST /api/v1/supplier/create - should create supplier', async () => {
    const response = await request(app)
      .post('/api/v1/supplier/create')
      .set('Authorization', `Bearer ${token}`)
      .send(supplierData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('POST /api/v1/supplier/submit/:id - should initiate workflow', async () => {
    const response = await request(app)
      .post(`/api/v1/supplier/submit/${supplierId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.result.workflowInstance).toBeDefined();
  });
});
```

### 8.3 End-to-End Testing

**Framework:** Cypress

**Test Scenarios:**
1. **Supplier Onboarding Flow**
   - Create supplier
   - Upload documents
   - Submit for approval
   - Approve at each level
   - Verify supplier becomes active

2. **Purchase Order Flow**
   - Create material quotation
   - Approve quotation
   - Run MRP
   - Create PO from MRP
   - Approve PO
   - Generate PDF
   - Record goods receipt

3. **Three-source Comparison Flow**
   - Create three quotations for same material
   - View comparison
   - Select preferred supplier
   - Create PO

### 8.4 Performance Testing

**Tool:** Apache JMeter

**Test Scenarios:**
- Concurrent user load (50, 100 users)
- Large dataset operations (10,000+ records)
- Excel export performance (up to 50,000 rows)
- MRP calculation performance (10,000 materials)

**Performance Targets:**
- API response time: < 500ms (95th percentile)
- Page load time: < 2 seconds
- Excel export: < 30 seconds for 10,000 rows
- MRP calculation: < 5 minutes for 10,000 materials

### 8.5 User Acceptance Testing (UAT)

**Approach:** Sprint-based UAT with key users

**Test Cases:** Based on functional requirements

**UAT Checklist:**
- [ ] All user stories tested
- [ ] Workflow approvals tested by actual approvers
- [ ] Excel exports validated against reference templates
- [ ] MRP calculations validated with sample data
- [ ] Role-based access verified
- [ ] UI/UX feedback incorporated

---

## 9. Deployment Plan

### 9.1 Environment Strategy

**Environments:**
1. **Development:** Local developer machines
2. **Staging:** Staging server for UAT
3. **Production:** Production server

**Database Strategy:**
- Separate MongoDB instances for each environment
- Automated backups for production
- Data migration scripts for schema changes

### 9.2 Deployment Process

#### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Database migration scripts tested
- [ ] Environment variables configured
- [ ] Backup strategy confirmed
- [ ] Rollback plan prepared

#### Deployment Steps

**Backend Deployment:**
1. SSH to server
2. Pull latest code from repository
3. Install dependencies: `npm install`
4. Run database migrations
5. Restart Node.js application
6. Verify API health check

**Frontend Deployment:**
1. Build production bundle: `npm run build`
2. Upload build files to server
3. Clear CDN cache (if applicable)
4. Verify frontend loads correctly

**Post-deployment Verification:**
- [ ] API endpoints responsive
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] File upload/download working
- [ ] Excel export working
- [ ] Workflow approvals functional

### 9.3 Database Migration Strategy

**Tool:** Custom migration scripts

**Migration Script Template:**
```javascript
// migrations/001_add_roles_to_admin.js

module.exports = {
  up: async (db) => {
    // Add 'roles' field to Admin collection
    await db.collection('admins').updateMany(
      {},
      { $set: { roles: [] } }
    );
  },
  
  down: async (db) => {
    // Rollback: Remove 'roles' field
    await db.collection('admins').updateMany(
      {},
      { $unset: { roles: "" } }
    );
  }
};
```

### 9.4 Data Migration

**Initial Data Setup:**
1. **System Roles:** Create predefined roles (System Administrator, General Manager, etc.)
2. **Permissions:** Create all required permissions
3. **Default Workflows:** Create default workflows for each document type
4. **UOM Master Data:** Populate common units of measure
5. **Material Categories:** Create initial category structure

**Data Import:**
- Provide Excel import templates for bulk data loading
- Import existing suppliers (if migrating from another system)
- Import existing materials

### 9.5 Rollback Plan

**Rollback Triggers:**
- Critical bugs discovered in production
- Performance degradation
- Data corruption

**Rollback Steps:**
1. Identify rollback decision maker (Project Lead/Tech Lead)
2. Take database snapshot
3. Revert code to previous version
4. Revert database schema (run down migrations)
5. Restart application
6. Verify system functionality
7. Communicate rollback to users

---

## 10. Risk Management

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Performance issues with large datasets** | Medium | High | - Implement database indexing<br>- Use pagination<br>- Optimize queries<br>- Performance testing early |
| **Workflow engine complexity** | High | High | - Start with simple workflow<br>- Iterative development<br>- Comprehensive testing<br>- Code review |
| **Data migration failures** | Medium | Critical | - Test migrations in staging<br>- Maintain rollback scripts<br>- Backup before migration<br>- Phased migration |
| **Integration with existing system** | Medium | Medium | - Define clear API contracts<br>- Mock external systems for testing<br>- Integration testing |
| **Excel export memory issues** | Low | Medium | - Stream large exports<br>- Implement export limits<br>- Queue large exports |
| **MRP calculation accuracy** | High | Critical | - Extensive test cases<br>- UAT with business users<br>- Parallel run with existing system |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **User adoption resistance** | Medium | High | - Involve users early<br>- Comprehensive training<br>- Phased rollout<br>- Support documentation |
| **Requirement changes mid-project** | High | Medium | - Agile methodology<br>- Regular stakeholder reviews<br>- Change request process<br>- Flexible architecture |
| **Resource availability** | Medium | High | - Cross-training team members<br>- Documentation<br>- Knowledge sharing sessions |
| **Timeline delays** | Medium | Medium | - Buffer time in schedule<br>- Prioritize critical features<br>- Regular progress tracking |

### 10.3 Mitigation Actions

#### For Workflow Engine Complexity:
1. **Week 1-2:** Design workflow engine architecture with team review
2. **Week 3-4:** Implement core workflow engine with unit tests
3. **Week 5:** Integration testing with simple workflow
4. **Week 6:** Add complex routing rules
5. **Week 7-8:** End-to-end testing with all document types

#### For MRP Calculation Accuracy:
1. Create comprehensive test dataset with known outcomes
2. Implement MRP calculation step-by-step with validation at each step
3. Parallel run with existing MRP process (if available)
4. UAT with MRP planners using real data
5. Comparison report of system suggestions vs manual calculations

#### For User Adoption:
1. **Sprint 1-2:** Demo foundation features to key users
2. **Sprint 3-4:** Demo supplier and material modules, gather feedback
3. **Sprint 5-6:** Demo procurement processes, conduct training
4. **Post-deployment:** Weekly office hours for support
5. **Month 1-2:** Collect feedback and iterate

---

## 11. Success Criteria

### 11.1 Functional Success Criteria

- [ ] All critical requirements (Priority: Critical) implemented and tested
- [ ] All high-priority requirements (Priority: High) implemented and tested
- [ ] Workflow engine handles all document types correctly
- [ ] MRP calculation accuracy validated by business users
- [ ] Excel exports match reference templates exactly
- [ ] All approval workflows tested end-to-end
- [ ] Role-based access control enforced across all modules

### 11.2 Performance Success Criteria

- [ ] System supports 50 concurrent users without degradation
- [ ] API response time < 500ms (95th percentile)
- [ ] Excel export completes in < 30 seconds for 10,000 rows
- [ ] MRP calculation completes in < 5 minutes for 10,000 materials
- [ ] Page load time < 2 seconds

### 11.3 Quality Success Criteria

- [ ] Unit test coverage > 80%
- [ ] All integration tests passing
- [ ] All UAT test cases passed
- [ ] Zero critical bugs in production
- [ ] Less than 5 high-priority bugs in first month

### 11.4 User Acceptance Criteria

- [ ] User training completed for all roles
- [ ] User documentation finalized
- [ ] 90% user satisfaction rating (post-deployment survey)
- [ ] All user-reported issues during UAT resolved

---

## 12. Appendices

### Appendix A: Technology Versions

| Technology | Version | Notes |
|-----------|---------|-------|
| Node.js | 20.9.0 | LTS version |
| Express.js | 4.18.2 | Web framework |
| MongoDB | 7.0.0 | Database |
| Mongoose | 8.1.1 | ODM |
| React | 18.3.1 | Frontend framework |
| Redux | 5.0.1 | State management |
| Ant Design | 5.14.1 | UI library |
| ExcelJS | 4.4.0 | Excel generation |

### Appendix B: Naming Conventions

**Backend:**
- Models: PascalCase (e.g., `Supplier`, `PurchaseOrder`)
- Controllers: camelCase with suffix (e.g., `supplierController`)
- Services: PascalCase with suffix (e.g., `WorkflowEngine`)
- Routes: kebab-case (e.g., `/purchase-order`)
- Functions: camelCase (e.g., `createSupplier`)

**Frontend:**
- Components: PascalCase (e.g., `SupplierForm.jsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSupplierData`)
- Redux actions: UPPER_SNAKE_CASE (e.g., `FETCH_SUPPLIER_LIST`)
- Redux action creators: camelCase (e.g., `fetchSupplierList`)

**Database:**
- Collection names: lowercase plural (e.g., `suppliers`, `materials`)
- Field names: camelCase (e.g., `supplierName`, `createdAt`)

### Appendix C: API Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE | 409 | Duplicate resource |
| WORKFLOW_ERROR | 422 | Workflow state error |
| SERVER_ERROR | 500 | Internal server error |

### Appendix D: Reference Documents

1. Functional Requirements Plan v1.0
2. Gap Analysis Report v1.0
3. Silverplan User Requirements v1.0
4. Excel Template Reference: `各报表清单格式 2025.12.23.xlsx`

---

## Document Approval

**Prepared By:** AI Assistant (Planner Mode)  
**Date:** 2025-01-27

**Review and Approval:**
- [ ] Technical Lead: ___________________ Date: __________
- [ ] Project Manager: ___________________ Date: __________
- [ ] Business Owner: ___________________ Date: __________

---

**End of Document**

