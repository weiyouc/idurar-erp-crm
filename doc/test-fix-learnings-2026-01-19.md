# Test Fix Learnings (2026-01-19)

## Scope
- Local frontend Playwright E2E runs with backend at `http://localhost:8888`.
- Focused on user management, workflows, and export flows.

## What We Fixed (Dev Changes)
- **Purchase Order export**: added backend `/api/purchase-orders/export` and wired UI export to trigger a download.
- **Login redirect reliability**: login page now redirects on `isLoggedIn` in addition to `isSuccess` to reduce flake.
- **Roles list request**: added `/api/roles/list` compatibility route and aligned frontend roles fetch.
- **Workflow routing rules UI**: added rule builder (condition type/operator/value/target levels).
- **Admin role assignment UI**: added admin list/update endpoints and frontend admin management screen.
- **Read view rendering**: normalized object arrays for display (e.g., roles).
- **Admin menus 404**: added `/api/workflows/list` and `/api/workflow-instances/*` compatibility routes so Roles/Workflows/Approvals pages load without 404s.

## Reasoning and Diagnosis Notes
- **Purchase Order export**: timeout came from no download event; traced to missing backend export route and UI using a stub export handler. Added endpoint + `ExportButton` to trigger a real file download.
- **Login redirect flake**: login success was stored in persisted auth state, but the login page only watched `isSuccess`. Added `isLoggedIn` to redirect to handle restored sessions.
- **Roles list 500**: frontend used `/roles/list` while backend only supported `/roles`. Added compatibility route and aligned requests to prevent route mis-match.
- **Workflow routing rules**: approval routing needed amount tiers in UI to match backend schema. Added UI builder for rules and target levels to ensure persisted routing config.
- **Admin role assignment**: approval failures were tied to missing role assignments. Exposed admin list/update endpoints and UI to assign roles cleanly.
- **Read view `[object Object]`**: details panel rendered raw objects for arrays; used render functions and normalized arrays for display.
- **Admin menus 404**: frontend `request.list` calls `/list`, while backend only exposed `/api/workflows` and `/api/workflows/instances`. Added aliases under `/api/workflows/list` and `/api/workflow-instances/*`.

## E2E Run Results

### Acceptance Criteria Suite
- `tests/e2e/00-acceptance-criteria/system-requirements.spec.js`
- **20 passed**, **0 failed**

### Full E2E Suite
- `playwright test`
- **184 passed**, **7 failed** (total 191)

Failures:
1. **Integration flows**
   - `00-integration/integration-flows.spec.js`
     - Full supplier-to-PO workflow
     - Approval workflow chain
     - PO → Goods Receipt workflow
     - Create workflow and apply to document
   - Symptoms: timeouts, missing “Submit”, missing fields or selectors.
   - Likely root cause: missing seed data or selector mismatch between test expectations and UI.

2. **Pre-payment creation**
   - `06-pre-payment/pre-payment-management.spec.js`
   - Timeout while waiting for success message.
   - Likely root cause: missing required fields or no matching PO data.

3. **Performance thresholds**
   - `12-performance/performance.spec.js`
   - Search and pagination exceeded thresholds in local dev.
   - Likely root cause: local environment performance variability.

## Key Observations
- Many tests log **“Could not find button: Create”** but still pass due to defensive assertions.
- Several flows depend on **seeded data** (suppliers/materials/POs) that may not exist locally.
- Export tests rely on **download events** and need real download endpoints.

## Suggested Next Steps
- Seed deterministic data for integration flows and pre-payment tests.
- Align UI labels/selectors with test helper expectations (Create/Save/Submit).
- Re-run performance tests on a stable environment or relax thresholds for local dev.

## Artifacts
- Failed test screenshots and videos are under `frontend/test-results/`.
