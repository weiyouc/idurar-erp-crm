# UI Automation Test Suite

## Overview

This test suite validates all functional requirements from `functional-requirements-plan.md` using Playwright for end-to-end UI testing.

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Ensure backend is running:**
   ```bash
   cd ../backend
   npm run dev
   ```

4. **Ensure frontend is running (or will auto-start):**
   ```bash
   cd frontend
   npm run dev
   ```

## Running Tests

**IMPORTANT:** Before running tests, ensure both frontend and backend servers are running!

### Quick Start (Recommended)

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Wait until you see: `Local: http://localhost:5173`

3. **Run Tests (with server already running):**
   ```bash
   cd frontend
   npm run test:e2e:no-server
   ```

### Option 1: UI Mode (Recommended for Development)

Run tests in Playwright's interactive UI mode:

```bash
cd frontend
# If server is already running:
SKIP_WEB_SERVER=true npm run test:e2e:ui

# Or let Playwright start the server (may timeout):
npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- See all tests in a tree view
- Run individual tests or entire suites
- Watch tests execute in real-time
- Debug tests step-by-step
- See screenshots and videos of test runs
- Inspect DOM at any point during test execution

### Option 2: Headed Mode (See Browser)

Run tests with visible browser windows:

```bash
cd frontend
# If server is already running:
SKIP_WEB_SERVER=true npm run test:e2e:headed

# Or let Playwright start the server:
npm run test:e2e:headed
```

### Option 3: Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
cd frontend
# If server is already running:
SKIP_WEB_SERVER=true npm run test:e2e:debug

# Or let Playwright start the server:
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests line by line
- Inspect page state
- Modify selectors on the fly
- See console logs and network requests

### Option 4: Run All Tests (Headless)

Run all tests in headless mode:

```bash
cd frontend
# If server is already running (RECOMMENDED):
npm run test:e2e:no-server

# Or let Playwright start the server (may timeout):
npm run test:e2e
```

### Option 5: Run Specific Test File

Run a specific test file:

```bash
cd frontend
# If server is already running:
SKIP_WEB_SERVER=true npx playwright test tests/e2e/02-supplier-management/supplier-crud.spec.js

# Or let Playwright start the server:
npx playwright test tests/e2e/02-supplier-management/supplier-crud.spec.js
```

### Option 6: Run Tests Matching Pattern

Run tests matching a pattern:

```bash
cd frontend
SKIP_WEB_SERVER=true npx playwright test --grep "Supplier"
```

### Option 7: List All Tests

See all available tests without running them:

```bash
cd frontend
npm run test:e2e:list
```

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── testHelpers.js          # Common test utilities
│   └── auth.setup.js           # Authentication setup
├── 00-acceptance-criteria/     # User Requirements Acceptance Tests
│   ├── pre-procurement-management.spec.js    # 采购前：基础数据与价格管理
│   ├── procurement-execution.spec.js          # 采购中：需求MRP与订单执行
│   ├── post-procurement-management.spec.js  # 采购后管理：付款与闭环
│   └── system-requirements.spec.js           # 系统需求总结 (6 requirements)
├── 01-system-foundation/
│   ├── workflow-engine.spec.js # REQ-WF-001 to REQ-WF-006
│   └── rbac.spec.js             # REQ-RBAC-001 to REQ-RBAC-006
├── 02-supplier-management/
│   └── supplier-crud.spec.js   # REQ-SUP-001 to REQ-SUP-012
├── 03-material-management/
│   └── material-crud.spec.js   # REQ-MAT-001 to REQ-MAT-008
├── 04-material-quotation/
│   └── quotation-management.spec.js # REQ-QUO-001 to REQ-QUO-010
├── 05-purchase-order/
│   └── po-management.spec.js   # REQ-PO-001 to REQ-PO-014
├── 06-pre-payment/
│   └── pre-payment-management.spec.js # REQ-PAY-001 to REQ-PAY-006
├── 07-goods-receipt/
│   └── goods-receipt-management.spec.js # REQ-PO-008 (Goods Receipt)
├── 08-excel-export/
│   └── excel-export.spec.js     # REQ-EXP-001 to REQ-EXP-007
├── 09-mrp/
│   └── mrp-management.spec.js  # REQ-MRP-001 to REQ-MRP-011
├── 10-audit-logging/
│   └── audit-logging.spec.js    # REQ-AUDIT-001 to REQ-AUDIT-005
├── 11-attachment-management/
│   └── attachment-management.spec.js # REQ-ATT-001 to REQ-ATT-003
├── 12-performance/
│   └── performance.spec.js       # REQ-PERF-001 to REQ-PERF-003
├── 00-integration/
│   └── integration-flows.spec.js # End-to-end workflow tests
└── README.md                    # This file
```

## Configuration

### Environment Variables

Set these in `.env` or export before running:

```bash
export PLAYWRIGHT_BASE_URL=http://localhost:3000
export JWT_SECRET=p6FSrVog0Tj6uqaSr/DzhJcalssRtwRLGBBTyDv+JTQ=
```

### Test Timeout

Default timeout is 60 seconds per test. Adjust in `playwright.config.js`:

```javascript
timeout: 60 * 1000, // milliseconds
```

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

Or manually:

```bash
npx playwright show-report
```

## Debugging Tests

### 1. Using UI Mode (Easiest)

```bash
npm run test:e2e:ui
```

- Click on any test to run it
- Click "Trace" to see step-by-step execution
- Use "Pick Locator" to find selectors
- Use "Time Travel" to see test at any point

### 2. Using Debug Mode

```bash
npm run test:e2e:debug
```

- Set breakpoints in test code
- Step through execution
- Inspect page state
- Modify selectors

### 3. Using VS Code

Install "Playwright Test for VSCode" extension, then:
- Click "Run Test" above any test
- Use debugger breakpoints
- See test results in sidebar

## Common Issues

### Tests Not Running at All / "Timed out waiting for webServer"

**Problem:** Playwright is trying to start the dev server but it's timing out.

**Solution 1 (Recommended):** Start servers manually and skip webServer:
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Run tests
cd frontend && npm run test:e2e:no-server
```

**Solution 2:** Increase webServer timeout in `playwright.config.js`:
```javascript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  timeout: 180 * 1000, // Increase to 3 minutes
}
```

**Solution 3:** Comment out webServer section in `playwright.config.js` and always start server manually.

### Tests Fail with "ERR_CONNECTION_REFUSED"

**Problem:** Frontend server is not running.

**Solution:**
1. Start frontend: `cd frontend && npm run dev`
2. Wait until you see: `Local: http://localhost:5173`
3. Run tests with: `npm run test:e2e:no-server`

### Tests Fail with "Page not found"

- Ensure frontend dev server is running on port 3000 (see `vite.config.js`)
- Or set `PLAYWRIGHT_BASE_URL` environment variable
- Check that the URL in browser matches `baseURL` in config

### Tests Fail with "Authentication required"

- Check that backend is running
- Verify login credentials in `testHelpers.js`
- Ensure JWT_SECRET matches backend
- Check backend logs for authentication errors

### Tests Timeout

- Increase timeout in `playwright.config.js`
- Check network connectivity
- Verify application is responding
- Check if backend is running and accessible

### Selectors Not Found

- Use Playwright's "Pick Locator" tool in UI mode
- Check browser DevTools for actual element structure
- Update selectors in `testHelpers.js` if needed
- Run tests in headed mode to see what's happening: `npm run test:e2e:headed`

## Writing New Tests

1. Create test file in appropriate directory
2. Import test helpers:
   ```javascript
   import { login, navigateTo, fillField, clickButton } from '../helpers/testHelpers';
   ```
3. Use test.describe for grouping
4. Use test.beforeEach for setup
5. Follow existing test patterns

## Test Coverage

This suite covers all requirements from `functional-requirements-plan.md`:

- ✅ System Foundation (Workflow, RBAC)
- ✅ Supplier Management
- ✅ Material Management
- ✅ Material Quotation Management
- ✅ Purchase Order Management
- ✅ Pre-payment Management
- ⏳ MRP (Material Requirements Planning) - TODO
- ⏳ Excel Export - TODO
- ⏳ Audit Logging - TODO
- ⏳ Attachment Management - TODO
- ⏳ Performance Tests - TODO

## Continuous Integration

For CI/CD, use headless mode:

```bash
npm run test:e2e
```

Set environment variables in CI:
- `PLAYWRIGHT_BASE_URL` - Application URL
- `CI=true` - Enables CI optimizations

