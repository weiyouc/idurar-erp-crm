# ⚠️ IMPORTANT: Tests Require Servers to be Running

## The Problem

All tests are failing with `ERR_CONNECTION_REFUSED` because **the frontend and backend servers are not running**.

## The Solution

**You MUST start both servers before running tests:**

### Step 1: Start Backend Server

Open Terminal 1:
```bash
cd backend
npm run dev
```

Wait until you see the backend is running (usually shows a port like `:3000` or similar).

### Step 2: Start Frontend Server

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

### Step 3: Run Tests

Open Terminal 3:
```bash
cd frontend
npm run test:e2e:chromium
```

Or if you want to skip the webServer check:
```bash
npm run test:e2e:no-server
```

## Why This Happens

Playwright tests are **end-to-end tests** that require:
1. ✅ Backend API server running (for authentication and data)
2. ✅ Frontend dev server running (for the UI)

Without both servers running, tests cannot:
- Navigate to pages
- Login users
- Make API calls
- Interact with the UI

## Quick Check

Before running tests, verify servers are running:

```bash
# Check if frontend is running (on port 3000)
curl http://localhost:3000

# Check if backend is running (adjust port if different)
curl http://localhost:3000/api/health
```

If either fails, start that server first.

## Alternative: Use Playwright's Auto-Start (Not Recommended)

You can let Playwright try to start the server automatically, but it often times out:

```bash
cd frontend
npm run test:e2e
```

This is less reliable than starting servers manually.

## Summary

**All test failures = Servers not running**

Fix: Start backend + frontend servers, then run tests.

