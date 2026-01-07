# Integration Tests

Comprehensive end-to-end tests for the RBAC system and API endpoints.

## Test Files

### `rbac-e2e.test.js`
End-to-end tests for the RBAC permission checking middleware:
- System administrator bypass
- Permission checking with database
- Scope hierarchy (all > team > own)
- Role inheritance
- Error handling
- Real API endpoint integration
- Database state verification
- Performance and edge cases

### `supplier-api-e2e.test.js`
End-to-end tests for the Supplier API:
- GET /api/suppliers/list
- POST /api/suppliers
- Error handling
- Permission enforcement
- Database operations

## Running Tests

```bash
# Run all integration tests
npm test -- tests/integration

# Run specific test file
npm test -- tests/integration/rbac-e2e.test.js
npm test -- tests/integration/supplier-api-e2e.test.js

# Run with coverage
npm run test:coverage -- tests/integration
```

## Test Coverage

These tests verify:
- ✅ Permission middleware works correctly
- ✅ System administrators bypass all checks
- ✅ Regular users are checked properly
- ✅ Database relationships are correct
- ✅ Error handling is robust
- ✅ API endpoints enforce permissions
- ✅ CRUD operations work end-to-end

## Test Data

Each test creates its own test data:
- Permissions (supplier:read, supplier:create, etc.)
- Roles (system_administrator, purchaser, etc.)
- Admin users (systemAdmin, regularUser, etc.)
- Suppliers (for API tests)

All test data is cleaned up after each test.

