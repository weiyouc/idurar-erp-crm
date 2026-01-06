# 📋 **Sprint 5: Purchase Order Management**

**Goal:** Implement a comprehensive Purchase Order (PO) management system with workflow approval, goods receipt, and invoice matching capabilities.

**Duration:** 4 Weeks (Estimated)  
**Priority:** High  
**Dependencies:** Sprint 3 (Suppliers), Sprint 4 (Materials)

---

## 🎯 **SPRINT OBJECTIVES**

1. **PO Creation & Management** - Complete lifecycle management
2. **Workflow Integration** - Multi-level approval process
3. **Goods Receipt** - Track deliveries and partial receipts
4. **Invoice Matching** - 3-way matching (PO-Receipt-Invoice)
5. **Reporting** - Comprehensive PO reports and analytics

---

## 📊 **USER STORIES**

### Epic 1: PO Creation & Management

**US-5.1: Create Purchase Order**
- **As a** Procurement Officer
- **I want to** create purchase orders from material requirements
- **So that** I can formally request materials from suppliers

**Acceptance Criteria:**
- Can select supplier and add multiple line items
- Each line item includes: material, quantity, unit price, delivery date
- System auto-populates preferred supplier pricing
- Can add notes and attachments
- PO number auto-generated
- Calculates subtotal, tax, total automatically

**US-5.2: Edit Draft PO**
- **As a** Procurement Officer
- **I want to** edit draft purchase orders before submission
- **So that** I can correct errors and optimize orders

**Acceptance Criteria:**
- Can modify all fields when PO is in "draft" status
- Cannot edit after submission (except authorized users)
- Tracks all changes in audit log
- Validates material availability and pricing

**US-5.3: Submit PO for Approval**
- **As a** Procurement Officer
- **I want to** submit PO for approval workflow
- **So that** authorized personnel can review before sending to supplier

**Acceptance Criteria:**
- Triggers workflow based on total amount
- Notifies approvers via system
- Shows approval status and history
- Can recall if not yet approved

---

### Epic 2: Workflow & Approval

**US-5.4: Approve/Reject PO**
- **As a** Manager/Director
- **I want to** review and approve/reject purchase orders
- **So that** I can control procurement spending

**Acceptance Criteria:**
- Can view PO details and history
- Can approve, reject, or request changes
- Must provide comments for rejection
- Email notification to requester
- Logs approval actions

**US-5.5: Multi-Level Approval**
- **As a** System Administrator
- **I want to** configure approval thresholds
- **So that** high-value POs require additional approval

**Acceptance Criteria:**
- Manager approval: < ¥50,000
- Director approval: ¥50,000 - ¥200,000
- VP approval: > ¥200,000
- Parallel approval for urgent POs
- Delegation support

---

### Epic 3: PO Execution

**US-5.6: Send PO to Supplier**
- **As a** Procurement Officer
- **I want to** send approved PO to supplier
- **So that** supplier can prepare materials

**Acceptance Criteria:**
- Generates PDF with company letterhead
- Sends via email automatically
- Tracks sent date and recipient
- Can resend if needed
- Supplier can acknowledge receipt

**US-5.7: Track PO Status**
- **As a** Procurement Officer
- **I want to** track PO execution status
- **So that** I know when materials will arrive

**Acceptance Criteria:**
- Status tracking: Draft → Submitted → Approved → Confirmed → In Production → Shipped → Received → Completed
- Shows expected vs actual dates
- Alerts for delays
- Dashboard view of all POs

---

### Epic 4: Goods Receipt

**US-5.8: Receive Goods**
- **As a** Warehouse Staff
- **I want to** record goods receipt against PO
- **So that** inventory is updated correctly

**Acceptance Criteria:**
- Can do full or partial receipt
- Records: received quantity, date, batch/lot number, inspector
- Updates inventory immediately
- Creates goods receipt note (GRN)
- Captures quality inspection results

**US-5.9: Handle Discrepancies**
- **As a** Warehouse Manager
- **I want to** record quantity/quality discrepancies
- **So that** we can resolve issues with supplier

**Acceptance Criteria:**
- Records over/under delivery
- Captures quality rejection reasons
- Creates return documents
- Notifies procurement and supplier
- Adjusts PO status

---

### Epic 5: Invoice Matching

**US-5.10: 3-Way Matching**
- **As an** Accounts Payable Officer
- **I want to** match invoice to PO and goods receipt
- **So that** payment is accurate

**Acceptance Criteria:**
- Compares: PO quantity/price, GRN quantity, Invoice quantity/price
- Auto-approves if matched within tolerance (e.g., ±5%)
- Flags discrepancies for review
- Calculates payment amount
- Updates payment status

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### Data Models

#### PurchaseOrder
```javascript
{
  poNumber: String (unique, auto-generated),
  supplier: ObjectId (ref: Supplier),
  orderDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  status: Enum [
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'sent_to_supplier',
    'confirmed',
    'in_production',
    'partially_shipped',
    'shipped',
    'partially_received',
    'received',
    'completed',
    'cancelled'
  ],
  
  // Items
  items: [{
    material: ObjectId (ref: Material),
    description: String,
    quantity: Number,
    uom: String,
    unitPrice: Number,
    taxRate: Number,
    discount: Number,
    lineTotal: Number,
    expectedDeliveryDate: Date,
    notes: String
  }],
  
  // Financial
  subtotal: Number,
  taxAmount: Number,
  shippingCost: Number,
  discount: Number,
  totalAmount: Number,
  currency: String,
  
  // Workflow
  workflow: {
    currentWorkflowId: ObjectId (ref: WorkflowInstance),
    submittedBy: ObjectId (ref: Admin),
    submittedAt: Date,
    approvalStatus: Enum ['none', 'pending', 'approved', 'rejected'],
    approvers: [{ 
      user: ObjectId, 
      action: String, 
      comments: String, 
      timestamp: Date 
    }]
  },
  
  // Delivery
  deliveryAddress: {
    contactPerson: String,
    phone: String,
    address: String,
    notes: String
  },
  
  // Documents
  attachments: [ObjectId (ref: Attachment)],
  
  // Communication
  sentToSupplier: {
    sent: Boolean,
    sentAt: Date,
    sentBy: ObjectId,
    email: String,
    acknowledged: Boolean,
    acknowledgedAt: Date
  },
  
  // Metadata
  createdBy: ObjectId (ref: Admin),
  updatedBy: ObjectId (ref: Admin),
  removed: Boolean,
  
  // Additional
  notes: String,
  internalNotes: String,
  paymentTerms: String,
  shippingMethod: String,
  priority: Enum ['normal', 'urgent', 'critical']
}
```

#### GoodsReceipt
```javascript
{
  grnNumber: String (unique, auto-generated),
  purchaseOrder: ObjectId (ref: PurchaseOrder),
  supplier: ObjectId (ref: Supplier),
  receiptDate: Date,
  
  items: [{
    poItem: ObjectId,
    material: ObjectId (ref: Material),
    orderedQuantity: Number,
    receivedQuantity: Number,
    acceptedQuantity: Number,
    rejectedQuantity: Number,
    uom: String,
    batchNumber: String,
    lotNumber: String,
    expiryDate: Date,
    rejectionReason: String,
    notes: String
  }],
  
  // Quality Inspection
  inspectionStatus: Enum ['pending', 'passed', 'failed', 'partial'],
  inspector: ObjectId (ref: Admin),
  inspectionNotes: String,
  
  // Storage
  warehouse: String,
  storageLocation: String,
  
  // Documents
  attachments: [ObjectId (ref: Attachment)],
  
  // Metadata
  createdBy: ObjectId (ref: Admin),
  
  status: Enum ['draft', 'completed', 'cancelled']
}
```

#### Invoice (Vendor Invoice)
```javascript
{
  invoiceNumber: String,
  vendorInvoiceNumber: String,
  supplier: ObjectId (ref: Supplier),
  purchaseOrder: ObjectId (ref: PurchaseOrder),
  invoiceDate: Date,
  dueDate: Date,
  
  items: [{
    description: String,
    quantity: Number,
    uom: String,
    unitPrice: Number,
    taxRate: Number,
    lineTotal: Number
  }],
  
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,
  currency: String,
  
  // Matching
  matchingStatus: Enum ['pending', 'matched', 'discrepancy', 'approved', 'rejected'],
  matchedGRN: [ObjectId (ref: GoodsReceipt)],
  discrepancies: [{
    type: String,
    description: String,
    expectedValue: Mixed,
    actualValue: Mixed
  }],
  
  // Payment
  paymentStatus: Enum ['pending', 'partial', 'paid'],
  paidAmount: Number,
  paymentDate: Date,
  
  // Documents
  attachments: [ObjectId (ref: Attachment)],
  
  // Metadata
  createdBy: ObjectId (ref: Admin),
  status: Enum ['draft', 'submitted', 'approved', 'rejected', 'paid']
}
```

---

## 🔌 **API ENDPOINTS**

### Purchase Order APIs

```
POST   /api/purchase-orders              # Create PO
GET    /api/purchase-orders              # List with filters
GET    /api/purchase-orders/:id          # Get by ID
PATCH  /api/purchase-orders/:id          # Update
DELETE /api/purchase-orders/:id          # Soft delete

POST   /api/purchase-orders/:id/submit   # Submit for approval
POST   /api/purchase-orders/:id/approve  # Approve PO
POST   /api/purchase-orders/:id/reject   # Reject PO
POST   /api/purchase-orders/:id/cancel   # Cancel PO

POST   /api/purchase-orders/:id/send     # Send to supplier
POST   /api/purchase-orders/:id/confirm  # Mark as confirmed

GET    /api/purchase-orders/number/:number    # Get by PO number
GET    /api/purchase-orders/supplier/:id      # Get by supplier
GET    /api/purchase-orders/material/:id      # Get by material
GET    /api/purchase-orders/pending-approval  # Get pending approvals
GET    /api/purchase-orders/statistics        # Get statistics

POST   /api/purchase-orders/:id/items         # Add item
PATCH  /api/purchase-orders/:id/items/:itemId # Update item
DELETE /api/purchase-orders/:id/items/:itemId # Remove item
```

### Goods Receipt APIs

```
POST   /api/goods-receipts               # Create GRN
GET    /api/goods-receipts               # List
GET    /api/goods-receipts/:id           # Get by ID
PATCH  /api/goods-receipts/:id           # Update
DELETE /api/goods-receipts/:id           # Cancel

POST   /api/goods-receipts/:id/complete  # Mark as completed
GET    /api/goods-receipts/po/:poId      # Get by PO
```

### Invoice APIs (Basic - full AP system in future sprint)

```
POST   /api/vendor-invoices              # Create invoice
GET    /api/vendor-invoices              # List
GET    /api/vendor-invoices/:id          # Get by ID
PATCH  /api/vendor-invoices/:id          # Update

POST   /api/vendor-invoices/:id/match    # Match to PO & GRN
POST   /api/vendor-invoices/:id/approve  # Approve for payment
```

---

## 📱 **FRONTEND COMPONENTS**

### 1. PurchaseOrderForm (Complex Form)
**Features:**
- Supplier selection
- Delivery address
- Line items table (add/edit/remove)
  - Material selector (with search)
  - Quantity input
  - Unit price (auto-populate from supplier pricing)
  - Delivery date
- Auto-calculation of totals
- Attachment upload
- Notes fields
- Save as draft / Submit

### 2. PurchaseOrderModule (List & Management)
**Features:**
- Data table with filters
  - By supplier, status, date range, material
  - By creator, approver
- Action buttons
  - View, Edit, Delete
  - Submit, Approve, Reject
  - Send to Supplier
  - Cancel
- Status badges with colors
- Excel export

### 3. PurchaseOrderDetail (View Page)
**Features:**
- Header with PO info
- Items table
- Workflow history
- Goods receipt history
- Invoice matching status
- Action buttons based on status
- PDF generation
- Print view

### 4. GoodsReceiptForm
**Features:**
- PO selection
- Items table (pre-filled from PO)
- Received quantity input
- Quality inspection fields
- Batch/lot number entry
- Rejection handling
- Storage location

### 5. ApprovalDashboard Enhancement
**Features:**
- Add PO approvals to existing dashboard
- Show PO details inline
- Quick approve/reject actions

---

## 🧪 **TESTING STRATEGY**

### Unit Tests
- Model validation (required fields, enums, calculations)
- Service methods (CRUD, workflow, calculations)
- UOM conversion in PO context
- Date validations
- Status transitions

### Integration Tests
- API endpoints (authentication, authorization)
- Workflow integration
- Goods receipt flow
- 3-way matching logic

### E2E Tests (Manual)
- Complete PO lifecycle
- Approval workflow
- Goods receipt
- Invoice matching

---

## 📈 **SUCCESS METRICS**

### Functionality
- [ ] Create PO with multiple items
- [ ] Submit for approval workflow
- [ ] Multi-level approval
- [ ] Send PO to supplier (email/PDF)
- [ ] Record goods receipt
- [ ] Match invoice to PO & GRN
- [ ] Track status through lifecycle

### Technical
- [ ] All API endpoints working
- [ ] RBAC applied
- [ ] Audit logging
- [ ] Test coverage > 70%
- [ ] Response time < 500ms

### User Experience
- [ ] Intuitive form layout
- [ ] Real-time calculations
- [ ] Clear status indicators
- [ ] Helpful error messages
- [ ] Mobile-responsive

---

## 🚀 **IMPLEMENTATION PHASES**

### Week 1: Core PO Management
- [ ] PurchaseOrder model
- [ ] PurchaseOrderService (CRUD)
- [ ] PO APIs and routes
- [ ] Unit tests
- [ ] PurchaseOrderForm component
- [ ] PurchaseOrderModule component

### Week 2: Workflow & Approval
- [ ] Workflow integration
- [ ] Approval APIs
- [ ] Email notifications
- [ ] Approval UI enhancements
- [ ] Status tracking
- [ ] PDF generation

### Week 3: Goods Receipt
- [ ] GoodsReceipt model
- [ ] GoodsReceiptService
- [ ] GRN APIs
- [ ] GoodsReceiptForm component
- [ ] Inventory update integration

### Week 4: Invoice & Reporting
- [ ] VendorInvoice model (basic)
- [ ] 3-way matching logic
- [ ] Invoice APIs
- [ ] Reporting & analytics
- [ ] Excel exports
- [ ] Final testing & bug fixes

---

## 🔗 **INTEGRATION POINTS**

### Sprint 3 (Supplier)
- Supplier selection in PO
- Supplier contact info
- Supplier pricing
- Payment terms

### Sprint 4 (Material)
- Material selection in PO items
- Material pricing
- UOM conversion
- Preferred suppliers

### Sprint 1 (Workflow)
- Approval workflow engine
- Multi-level approvals
- Workflow history

### Sprint 2 (Attachments)
- PO attachments
- GRN attachments
- Invoice attachments

---

## 📋 **TASK BREAKDOWN**

### Backend Tasks (60 hours)
1. **Models** (12h)
   - PurchaseOrder model with validations
   - PurchaseOrderItem sub-schema
   - GoodsReceipt model
   - VendorInvoice model (basic)

2. **Services** (20h)
   - PurchaseOrderService (CRUD, calculations, status management)
   - GoodsReceiptService
   - InvoiceMatchingService
   - PDF generation service

3. **APIs** (16h)
   - PO controller & routes (15 endpoints)
   - GRN controller & routes (6 endpoints)
   - Invoice controller & routes (5 endpoints)

4. **Tests** (12h)
   - Model tests (validation, calculations)
   - Service tests (business logic)
   - API integration tests

### Frontend Tasks (40 hours)
1. **Forms** (16h)
   - PurchaseOrderForm (complex, with line items)
   - GoodsReceiptForm
   - InvoiceForm

2. **Modules** (16h)
   - PurchaseOrderModule (list, search, filters)
   - PurchaseOrderDetail (view page)
   - GoodsReceiptModule

3. **Integration** (8h)
   - Routes
   - Navigation
   - State management
   - API integration

---

## 🎯 **DEFINITION OF DONE**

- [ ] All models created with proper validation
- [ ] All services implemented with error handling
- [ ] All API endpoints functional with RBAC
- [ ] Test coverage > 70%
- [ ] All frontend components built and styled
- [ ] Routes configured
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Manual testing completed
- [ ] No critical bugs

---

*Sprint 5 Plan - Ready for Implementation*




