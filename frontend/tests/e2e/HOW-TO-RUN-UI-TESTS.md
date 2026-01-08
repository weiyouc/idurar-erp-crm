# How to Run Tests in UI Mode (Built-in Browser)

## Quick Start (3 Steps)

### Step 1: Start Backend Server
Open a terminal and run:
```bash
cd backend
npm run dev
```
Keep this terminal running. Backend should start on `http://localhost:8888`

### Step 2: Run Tests in UI Mode
Open another terminal and run:
```bash
cd frontend
npm run test:e2e:ui
```

### Step 3: Use the Interactive UI
The Playwright UI will automatically open in your browser (usually at `http://localhost:9323`).

## What You'll See

### Playwright UI Interface

```
┌─────────────────────────────────────────────────────────┐
│  Playwright Test Runner                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Test Tree - Left Sidebar]    [Test Details - Main]    │
│                                                           │
│  📁 01-system-foundation                                 │
│    📄 workflow-engine.spec.js                           │
│      ✓ should create workflow                            │
│      ✓ should support 10 levels                          │
│  📁 02-supplier-management                               │
│    📄 supplier-crud.spec.js                             │
│      ⚪ should create new supplier                        │
│      ⚪ should read supplier details                      │
│                                                           │
│  [Run All] [Watch] [Filter]                              │
└─────────────────────────────────────────────────────────┘
```

## How to Use the UI

### Running Tests

1. **Run All Tests:**
   - Click the **"Run all"** button at the top
   - Or press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

2. **Run a Single Test:**
   - Click on any test in the left sidebar (e.g., "should create new supplier")
   - Click the **"Run"** button that appears
   - Or press `Space` key

3. **Run a Test Suite:**
   - Click on a test file (e.g., `supplier-crud.spec.js`)
   - Click **"Run"** to run all tests in that file

4. **Watch Mode:**
   - Click the **"Watch"** toggle
   - Tests will automatically re-run when you save test files

### Watching Test Execution

When you run a test:
1. **Browser Window Opens**: A new browser window opens showing the test execution
2. **Timeline View**: See each step of the test in real-time
3. **Console Logs**: View console output and errors
4. **Network Tab**: See API calls being made

### Debugging Features

#### 1. Time Travel
- Click any step in the timeline
- See the page state at that exact moment
- Inspect DOM elements at that point

#### 2. Pick Locator
- Click the **"Pick Locator"** button (target icon)
- Click on any element in the browser window
- Get the exact selector for that element
- Copy it to use in your tests

#### 3. Screenshots
- Automatic screenshots on test failure
- Click to view full-size image
- See exactly what the page looked like when it failed

#### 4. Videos
- Automatic video recording on failure
- Watch the entire test execution
- See where and why it failed

#### 5. Trace Viewer
- Click **"Trace"** button on any test
- See detailed execution trace
- Step through each action
- Inspect network requests and responses

## Example: Running Your First Test

1. **Start Backend:**
   ```bash
   cd backend && npm run dev
   ```

2. **Open Test UI:**
   ```bash
   cd frontend && npm run test:e2e:ui
   ```

3. **In the UI:**
   - Navigate to: `02-supplier-management` → `supplier-crud.spec.js`
   - Click on: `should create new supplier`
   - Click: **"Run"** button
   - Watch the browser window as it:
     - Opens the application
     - Logs in
     - Navigates to supplier page
     - Clicks create button
     - Fills the form
     - Saves the supplier
   - See the result: ✅ Pass or ❌ Fail

## Keyboard Shortcuts

- `Ctrl+R` / `Cmd+R`: Run all tests
- `Space`: Run selected test
- `Ctrl+F` / `Cmd+F`: Filter/search tests
- `Esc`: Close dialogs
- `Ctrl+Shift+P` / `Cmd+Shift+P`: Command palette

## Tips

### Slow Down Execution
- Use the speed slider (🐢 icon) to slow down tests
- Helpful for debugging and understanding what's happening

### Pause Execution
- Click the pause button to stop at any point
- Inspect the page state
- Continue or stop the test

### Filter Tests
- Use the filter box to search for specific tests
- Example: Type "supplier" to see only supplier tests

### Inspect Elements
- Right-click any element in the browser window
- Select "Inspect" to see it in DevTools
- Use this to find correct selectors

## Troubleshooting

### UI Doesn't Open Automatically

If the browser doesn't open:
1. Check the terminal output for a URL like:
   ```
   Running tests using UI Mode.
   Open http://localhost:9323 to view the UI
   ```
2. Copy and paste that URL into your browser

### Tests Can't Connect to Application

If you see connection errors:
1. **Check Backend:** Ensure backend is running on port 8888
2. **Check Frontend:** The UI mode auto-starts frontend, but verify it's accessible
3. **Check URL:** Verify `baseURL` in `playwright.config.js` matches your setup

### Browser Window Doesn't Show

If tests run but you don't see the browser:
- This is normal in headless mode
- Use `npm run test:e2e:headed` to see browser windows
- Or use UI mode which always shows the browser

### Tests Timeout

If tests timeout:
1. Increase timeout in `playwright.config.js`:
   ```javascript
   timeout: 120 * 1000, // 2 minutes
   ```
2. Check if application is slow to load
3. Verify backend is responding

## Alternative Commands

### Headed Mode (See Browser, No UI)
```bash
npm run test:e2e:headed
```
Runs tests with visible browser windows but without the interactive UI.

### Debug Mode (Step-by-Step)
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### Headless Mode (Fast, No Browser)
```bash
npm run test:e2e
```
Runs all tests in headless mode (fastest, no visual feedback).

## Next Steps

1. ✅ Run tests in UI mode
2. ✅ Watch tests execute
3. ✅ Fix any failing tests
4. ✅ Add new tests as needed
5. ✅ Use trace viewer for debugging

For more details, see `README.md` in the same directory.

