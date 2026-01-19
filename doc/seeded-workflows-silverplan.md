# Silverplan Seeded Workflows

This document describes the initial workflows seeded by `seedWorkflowsSilverplan.js`.
They align with the approval flows in `doc/customer-requirements/silverplan.md`.

## How To Seed

Run from `backend/`:

```
npm run seed:workflows
```

Prerequisites:
- Database is reachable via `.env` / `.env.local` `DATABASE`.
- System roles are seeded (`node src/setup/seedRoles.js`).

## Seeded Workflows

### 1) Supplier Onboarding (`supplier`)
**Flow:** Data Entry → Procurement Manager → Cost Center → General Manager (by supplier level)

Levels:
- L1 Data Entry Personnel (mandatory)
- L2 Procurement Manager (mandatory)
- L3 Cost Center (mandatory)
- L4 General Manager (conditional)

Routing rules:
- `supplier_level in ['A','B']` → add L4

### 2) Material Quotation Approval (`material_quotation`)
**Flow:** Cost Center → Procurement Manager / General Manager (by amount tier)

Levels:
- L1 Cost Center (mandatory)
- L2 Procurement Manager (conditional)
- L3 General Manager (conditional)

Routing rules (amount):
- `amount <= 50,000` → add L2
- `amount > 50,000` → add L2 and L3

### 3) Purchase Order Approval (`purchase_order`)
**Flow:** Procurement Manager → General Manager (by amount tier)

Levels:
- L1 Procurement Manager (mandatory)
- L2 General Manager (conditional)

Routing rules (amount):
- `amount > 200,000` → add L2

### 4) Pre-Payment Approval (`pre_payment`)
**Flow:** Procurement Manager → Finance Director → General Manager (by amount tier)

Levels:
- L1 Procurement Manager (mandatory)
- L2 Finance Director (mandatory)
- L3 General Manager (conditional)

Routing rules (amount):
- `amount > 200,000` → add L3

## Notes
- Thresholds are placeholders (50,000 / 200,000) and should be adjusted in the Workflow UI
  based on the final approval matrix.
- Seeding is **idempotent**: if a default workflow for a document type already exists, the script
  will skip creation.
- No auto-seed is performed at server startup; this is a manual seed step.
