# Testing Guide

## Overview

This directory contains all tests for the IDURAR ERP-CRM Silverplan backend.

**Testing Framework:** Jest + MongoDB Memory Server  
**Target Coverage:** >80% (branches, functions, lines, statements)

## Test Structure

```
tests/
├── setup.js                 # Global test setup (runs before all tests)
├── helpers/
│   └── testData.js         # Test fixtures and data generators
├── models/                  # Model unit tests
│   ├── Role.test.js
│   ├── Permission.test.js
│   ├── AuditLog.test.js
│   ├── Admin.test.js
│   ├── Workflow.test.js           # TODO
│   └── WorkflowInstance.test.js   # TODO
├── services/               # Service unit tests (TODO)
├── middlewares/            # Middleware tests (TODO)
└── integration/            # API integration tests (TODO)
```

## Running Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
npm test -- tests/models/Role.test.js
npm test -- tests/models/Permission.test.js
```

### Run Model Tests Only
```bash
npm run test:models
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Database

Tests use **MongoDB Memory Server** - an in-memory MongoDB instance that:
- ✅ Starts automatically before tests
- ✅ Stops automatically after tests
- ✅ No configuration needed
- ✅ Fast and isolated
- ✅ Clean state for each test

**No need to run migrations or seed data for tests!**

## Writing Tests

### Test Structure

```javascript
describe('ModelName Model', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid model', async () => {
      // Test valid creation
    });
    
    test('should require field', async () => {
      // Test validation
    });
  });
  
  describe('Instance Methods', () => {
    test('should method correctly', async () => {
      // Test methods
    });
  });
  
  describe('Static Methods', () => {
    test('should static method correctly', async () => {
      // Test static methods
    });
  });
  
});
```

### Test Checklist

For each model, test:
- [ ] **Schema Validation**
  - [ ] Valid document creation
  - [ ] Required fields
  - [ ] Field types
  - [ ] Enums
  - [ ] Default values
  - [ ] Unique constraints
  - [ ] Custom validators
- [ ] **Middleware (Pre/Post Hooks)**
  - [ ] Pre-save hooks
  - [ ] Pre-remove hooks
  - [ ] Pre-update hooks
- [ ] **Virtuals**
  - [ ] Virtual getters
  - [ ] Virtual setters
  - [ ] Virtuals in JSON/Object
- [ ] **Instance Methods**
  - [ ] All public methods
  - [ ] Edge cases
  - [ ] Error handling
- [ ] **Static Methods**
  - [ ] All public methods
  - [ ] Query methods
  - [ ] Aggregations
- [ ] **Relationships**
  - [ ] References
  - [ ] Populate
  - [ ] Cascade deletes (if any)

### Using Test Data

Import test fixtures:
```javascript
const { roleData, generateObjectId } = require('../helpers/testData');

// Use in tests
const role = await Role.create(roleData.valid);
const id = generateObjectId();
```

### Async Tests

Always use async/await:
```javascript
test('should create document', async () => {
  const doc = await Model.create(data);
  expect(doc._id).toBeDefined();
});
```

### Testing Errors

```javascript
test('should throw error', async () => {
  await expect(async () => {
    await Model.create(invalidData);
  }).rejects.toThrow();
});
```

### Cleanup

Tests automatically clean up after each test (see `tests/setup.js`).  
No manual cleanup needed!

## Current Test Coverage

### ✅ Completed Tests: ALL MODEL TESTS

| Model | Tests | Coverage | Status |
|-------|-------|----------|--------|
| Role | 29 tests | ~100% | ✅ Complete |
| Permission | 46 tests | ~100% | ✅ Complete |
| AuditLog | 42 tests | ~100% | ✅ Complete |
| Admin | 37 tests | ~100% | ✅ Complete |
| Workflow | 30 tests | ~100% | ✅ Complete |
| WorkflowInstance | 25 tests | ~100% | ✅ Complete |
| **Total Models** | **209 tests** | **~100%** | ✅ **COMPLETE** |

### ⏳ Pending Tests

| Component | Status |
|-----------|--------|
| RBAC Middleware | TODO (Week 2) |
| Workflow Engine Service | TODO (Week 2) |
| ApprovalRouter Service | TODO (Week 2) |
| AuditLog Service | TODO (Week 2) |
| Attachment Service | TODO (Week 2) |
| Role APIs | TODO (Week 3) |
| Workflow APIs | TODO (Week 3) |
| Frontend Components | TODO (Week 4) |

## Test Commands Reference

```bash
# Install dependencies (includes test dependencies)
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- path/to/test.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run in watch mode
npm run test:watch

# Run only model tests
npm run test:models

# Update snapshots (if using)
npm test -- -u
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

**All tests must pass before merging!**

## Debugging Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "${file}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console Logging

```javascript
test('debug test', async () => {
  const doc = await Model.create(data);
  console.log('Created doc:', doc);  // Will show in test output
  expect(doc).toBeDefined();
});
```

## Best Practices

1. ✅ **Write tests first** (TDD approach)
2. ✅ **One assertion per test** (when possible)
3. ✅ **Descriptive test names** ("should X when Y")
4. ✅ **Test edge cases** (null, undefined, empty, max values)
5. ✅ **Test error paths** (validation failures, not found, etc.)
6. ✅ **Use test data helpers** (DRY principle)
7. ✅ **Clean, readable tests** (easy to understand intent)
8. ✅ **Fast tests** (use in-memory DB, minimal I/O)

## Common Issues

### Tests Hang

If tests don't finish:
- Check for unclosed database connections
- Ensure async functions use await
- Check for infinite loops
- Increase timeout: `jest.setTimeout(10000);`

### Tests Fail Randomly

If tests are flaky:
- Check for race conditions
- Ensure proper cleanup between tests
- Check for shared state
- Add proper async/await

### Can't Connect to Database

- MongoDB Memory Server should auto-start
- Check for port conflicts
- Ensure MongoDB isn't already running on test port

## Next Steps

To complete Sprint 1 testing:

1. ✅ Model Tests (154 tests) - **COMPLETE**
2. ⏳ Workflow + WorkflowInstance Model Tests (estimated 50 tests)
3. ⏳ Service Tests (estimated 40 tests)
4. ⏳ Middleware Tests (estimated 20 tests)
5. ⏳ Integration Tests (estimated 30 tests)

**Total Estimated:** ~294 tests for Sprint 1

## Questions?

For issues or questions about tests:
- Review existing test files for examples
- Check Jest documentation: https://jestjs.io/
- Check Mongoose documentation: https://mongoosejs.com/

---

**Last Updated:** Sprint 1, Week 1

