# Quick Start: Running UI Tests

## The Problem

If you're seeing "Tests not running at all" or "Timed out waiting for webServer", it's because Playwright is trying to automatically start the dev server but it's timing out.

## The Solution

**Start the servers manually, then run tests with the `no-server` flag.**

## Step-by-Step

### 1. Start Backend Server

Open Terminal 1:
```bash
cd backend
npm run dev
```

Wait until you see the backend is running (usually shows a port like `:3000` or similar).

### 2. Start Frontend Server

Open Terminal 2:
```bash
cd frontend
npm run dev
```

**Wait until you see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

**Note:** The frontend runs on port 3000 (not 5173) as configured in `vite.config.js`.

### 3. Run Tests

Open Terminal 3:
```bash
cd frontend
npm run test:e2e:no-server
```

This will run all tests without trying to start the server.

## Alternative: Use UI Mode

For interactive testing and debugging:

```bash
cd frontend
SKIP_WEB_SERVER=true npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- See all tests
- Run individual tests
- Watch them execute
- Debug step-by-step

## Verify Tests Are Discovered

Before running, check that Playwright can find your tests:

```bash
cd frontend
npm run test:e2e:list
```

You should see a list of all tests (186 total).

## Run a Single Test

To test if everything works, run just one test:

```bash
cd frontend
SKIP_WEB_SERVER=true npx playwright test tests/e2e/01-system-foundation/rbac.spec.js --project=chromium
```

## Troubleshooting

### "ERR_CONNECTION_REFUSED"
→ Frontend server isn't running. Start it with `npm run dev` in the frontend directory.

### "Authentication failed"
→ Backend server isn't running. Start it with `npm run dev` in the backend directory.

### "Tests not found"
→ Make sure you're in the `frontend` directory when running tests.

### Still having issues?
→ See `TROUBLESHOOTING.md` for more detailed solutions.
