# E2E Test Scenarios Mapping: Procurement Workflows

**Date:** January 22, 2026
**Purpose:** Map the 8 core procurement workflows from process flow diagrams to comprehensive E2E test scenarios

---

## Overview

This document maps each of the 8 procurement workflows documented in `doc/customer-requirements/process-flow-diagrams.md` to specific E2E test scenarios. Each workflow includes:

- **Test Scenario Name:** Descriptive test case name
- **Workflow Steps:** Sequential steps from the process flow
- **Test Data Requirements:** Required seed data
- **User Roles:** Users involved in the workflow
- **Success Criteria:** Verifiable outcomes
- **Test Implementation:** Playwright test structure

---

## 1. Supplier Onboarding Workflow

**Test Scenario:** `supplier-onboarding-complete-flow.spec.js`

### Workflow Steps
1. **Data Entry Personnel** creates supplier with all required fields
2. System validates required fields and uploads documents
3. Supplier is submitted for approval (status: Under Review)
4. **Procurement Manager** reviews and approves (Level 1)
5. **Cost Center** reviews and approves (Level 2)
6. **General Manager** reviews and approves (Level 3) [for A-level suppliers]
7. Supplier status changes to Active
8. Notification sent to procurement team

### Test Data Requirements
- **Supplier:** E2E-TEST-SUP-001 (A-level supplier)
- **Users:** e2e.data.entry@test.com, e2e.procurement.manager@test.com, e2e.cost.center@test.com, e2e.general.manager@test.com
- **Workflow:** E2E Supplier Approval Workflow

### User Roles
- Data Entry Personnel (create/submit)
- Procurement Manager (L1 approval)
- Cost Center (L2 approval)
- General Manager (L3 approval)

### Success Criteria
- ✅ Supplier created with draft status
- ✅ Submit changes status to "pending_approval"
- ✅ Workflow instance created with correct approvers
- ✅ Sequential approvals change status through levels
- ✅ Final approval changes supplier to "active" status
- ✅ Audit trail records all actions

### Test Implementation
```javascript
test('complete supplier onboarding workflow', async ({ page }) => {
  // Login as Data Entry
  await login(page, 'e2e.data.entry@test.com');

  // Create supplier
  await navigateTo(page, '/suppliers');
  await clickButton(page, 'Create');
  // Fill all required fields...
  await clickButton(page, 'Submit');

  // Login as Procurement Manager
  await logout(page);
  await login(page, 'e2e.procurement.manager@test.com');

  // Navigate to approvals and approve
  await navigateTo(page, '/approvals');
  // Approve supplier...

  // Continue with Cost Center and General Manager approvals
  // Verify final status
});
```

---

## 2. Supplier Information Maintenance Workflow

**Test Scenario:** `supplier-maintenance-workflow.spec.js`

### Workflow Steps
1. **User** identifies change type (Basic vs Critical)
2. **Basic Changes:** Update contact info, notes (immediate save)
3. **Critical Changes:** Update bank details, supplier level (requires approval)
4. Submit critical changes for approval
5. **Procurement Manager** reviews critical changes
6. **General Manager** reviews critical changes
7. Original values preserved until final approval
8. Approved changes applied, audit logged

### Test Data Requirements
- **Supplier:** E2E-TEST-SUP-002 (active supplier)
- **Users:** e2e.data.entry@test.com, e2e.procurement.manager@test.com, e2e.general.manager@test.com

### User Roles
- Data Entry Personnel (make changes)
- Procurement Manager (approve critical changes)
- General Manager (final approval for critical changes)

### Success Criteria
- ✅ Basic changes saved immediately
- ✅ Critical changes require approval workflow
- ✅ Original values preserved during approval
- ✅ Rejection returns to original values
- ✅ Approval applies changes and logs audit trail

---

## 3. Material Quotation Approval Workflow

**Test Scenario:** `material-quotation-approval-workflow.spec.js`

### Workflow Steps
1. **Procurement Manager** creates quotation request
2. System validates quotation data
3. Submit for approval
4. **Procurement Manager** reviews (L1) - if amount ≥ ¥1,000
5. **Cost Center** reviews (L2) - if amount ≥ ¥10,000
6. Approved quotation can be used for PO creation
7. Rejected quotation returns to draft with comments

### Test Data Requirements
- **Material:** E2E-TEST-MAT-002 (bearing)
- **Supplier:** E2E-TEST-SUP-002
- **Users:** e2e.procurement.manager@test.com, e2e.cost.center@test.com
- **Workflow:** E2E Material Quotation Approval Workflow

### User Roles
- Procurement Manager (create + L1 approval)
- Cost Center (L2 approval for high amounts)

### Success Criteria
- ✅ Quotation created and submitted
- ✅ Amount-based routing to correct approval levels
- ✅ Sequential approval process
- ✅ Approved quotation available for PO creation

---

## 4. Price Strategy Management Workflow

**Test Scenario:** `price-strategy-workflow.spec.js`

### Workflow Steps
1. **Procurement Manager** reviews quotation comparisons
2. System displays 3-source pricing analysis
3. Select preferred supplier based on criteria
4. Update material preferred supplier
5. Generate price strategy report
6. Strategy approved for implementation

### Test Data Requirements
- **Material:** E2E-TEST-MAT-001
- **Suppliers:** All 3 suppliers with different pricing
- **Users:** e2e.procurement.manager@test.com

### User Roles
- Procurement Manager (price analysis and strategy)

### Success Criteria
- ✅ Multiple supplier quotations compared
- ✅ Preferred supplier selected and saved
- ✅ Price strategy documented

---

## 5. MRP Generation and Processing Workflow

**Test Scenario:** `mrp-generation-workflow.spec.js`

### Workflow Steps
1. **MRP Planner** initiates MRP run
2. System calculates material requirements
3. Review MRP recommendations
4. **MRP Planner** approves recommendations
5. System generates purchase requisitions
6. Automatic PO creation for approved items
7. MRP report generated and distributed

### Test Data Requirements
- **Materials:** All materials with inventory data
- **Suppliers:** Linked to materials
- **Users:** e2e.mrp.planner@test.com

### User Roles
- MRP Planner (run MRP + approve recommendations)

### Success Criteria
- ✅ MRP calculation completes
- ✅ Recommendations generated
- ✅ PO requisitions created automatically
- ✅ MRP report available

---

## 6. Purchase Order Creation and Approval Workflow

**Test Scenario:** `purchase-order-approval-workflow.spec.js`

### Workflow Steps
1. **Purchaser** creates PO (manual or from MRP)
2. System validates PO data and calculates totals
3. Submit for approval
4. **Procurement Manager** reviews (L1) - always required
5. **Cost Center** reviews (L2) - if amount ≥ ¥10,000
6. **General Manager** reviews (L3) - if amount ≥ ¥50,000
7. Approved PO sent to supplier
8. PO status tracking throughout lifecycle

### Test Data Requirements
- **PO:** PO-1769054229456-001 (draft, low amount)
- **PO:** PO-1769054229456-002 (draft, high amount)
- **Users:** e2e.data.entry@test.com, e2e.procurement.manager@test.com, e2e.cost.center@test.com, e2e.general.manager@test.com
- **Workflow:** E2E Purchase Order Approval Workflow

### User Roles
- Data Entry Personnel (create PO)
- Procurement Manager (L1 approval)
- Cost Center (L2 approval for high amounts)
- General Manager (L3 approval for very high amounts)

### Success Criteria
- ✅ PO created and submitted
- ✅ Amount-based routing to correct approval levels
- ✅ Sequential approval through all required levels
- ✅ Approved PO status changes to "approved"
- ✅ PO available for goods receipt processing

---

## 7. Pre-payment Application and Approval Workflow

**Test Scenario:** `pre-payment-approval-workflow.spec.js`

### Workflow Steps
1. **Finance Personnel** creates pre-payment request
2. Link to approved PO
3. System validates payment amount vs PO
4. Submit for approval
5. **Finance Director** reviews (L1)
6. **General Manager** reviews (L2) - high amounts
7. Approved pre-payment processed
8. Payment status tracked

### Test Data Requirements
- **PO:** Approved PO for payment testing
- **Users:** e2e.finance@test.com, e2e.finance.director@test.com, e2e.general.manager@test.com

### User Roles
- Finance Personnel (create payment request)
- Finance Director (L1 approval)
- General Manager (L2 approval for high amounts)

### Success Criteria
- ✅ Pre-payment request created
- ✅ Linked to approved PO
- ✅ Approval workflow triggered
- ✅ Payment approved and processed

---

## 8. Goods Receipt Workflow

**Test Scenario:** `goods-receipt-workflow.spec.js`

### Workflow Steps
1. **Warehouse Personnel** receives goods against PO
2. System validates receipt against PO quantities
3. Quality inspection performed
4. **Warehouse Personnel** records inspection results
5. Accepted goods added to inventory
6. Rejected goods handled per procedure
7. PO status updated (partial/complete)
8. Receipt documented and reported

### Test Data Requirements
- **PO:** Approved PO ready for receipt
- **Users:** e2e.warehouse@test.com

### User Roles
- Warehouse Personnel (receive + inspect goods)

### Success Criteria
- ✅ Goods receipt created against PO
- ✅ Quantities validated
- ✅ Quality inspection recorded
- ✅ Inventory updated
- ✅ PO status reflects receipt progress

---

## Test Implementation Strategy

### Test Organization
```
frontend/tests/e2e/
├── 00-acceptance-criteria/          # Manual verification tests
├── 01-system-foundation/           # RBAC, workflows, auth
├── 02-supplier-management/         # Supplier CRUD + workflows
├── 03-material-management/         # Material CRUD
├── 04-material-quotation/          # Quotation workflows
├── 05-purchase-order/              # PO creation + approval
├── 06-pre-payment/                 # Payment workflows
├── 07-goods-receipt/               # Receipt processing
├── 08-excel-export/                # Export functionality
├── 09-mrp/                         # MRP processing
├── 10-audit-logging/               # Audit verification
├── 11-attachment-management/       # File uploads
├── 12-performance/                 # Performance benchmarks
└── workflow-integration/           # Cross-module workflows
    ├── supplier-onboarding-complete-flow.spec.js
    ├── supplier-maintenance-workflow.spec.js
    ├── material-quotation-approval-workflow.spec.js
    ├── purchase-order-approval-workflow.spec.js
    └── goods-receipt-workflow.spec.js
```

### Test Data Management
- **Seed Script:** `backend/scripts/seed-e2e-test-data.js`
- **Test Isolation:** Each test uses prefixed data (E2E-TEST-*)
- **Cleanup:** Tests clean up after themselves
- **Deterministic:** Same data available for regression testing

### Success Metrics
- ✅ **100% workflow coverage** - All 8 workflows tested end-to-end
- ✅ **95%+ pass rate** - Reliable, stable test execution
- ✅ **Complete traceability** - Each test maps to process flow steps
- ✅ **Fast feedback** - Tests run in <5 minutes
- ✅ **CI/CD ready** - Tests work in automated pipelines

---

## Next Steps

1. **Implement Test Scenarios** - Create the 8 workflow test files
2. **Fix UI Selectors** - Update test helpers for reliable element detection
3. **Integration Testing** - Connect all workflow tests
4. **Performance Validation** - Ensure tests run efficiently
5. **Documentation** - Update test README with workflow coverage