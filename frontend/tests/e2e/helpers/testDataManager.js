/**
 * Test Data Management System
 *
 * Provides utilities for managing test data lifecycle:
 * - Cleanup between tests
 * - Isolation of test data
 * - Restoration of seed data
 * - Tracking of created test entities
 */

import { expect } from '@playwright/test';

// Test data prefixes to identify test-created entities
export const TEST_PREFIXES = {
  SUPPLIER: 'E2E-TEST-SUP-',
  MATERIAL: 'E2E-TEST-MAT-',
  MATERIAL_CATEGORY: 'E2E-TEST-CAT-',
  QUOTATION: 'E2E-TEST-QUO-',
  PURCHASE_ORDER: 'PO-E2E-TEST-',
  WORKFLOW: 'E2E-TEST-'
};

// Track created entities for cleanup
let createdEntities = {
  suppliers: [],
  materials: [],
  materialCategories: [],
  quotations: [],
  purchaseOrders: [],
  workflows: []
};

/**
 * Reset tracking for a new test run
 */
export function resetTestDataTracking() {
  createdEntities = {
    suppliers: [],
    materials: [],
    materialCategories: [],
    quotations: [],
    purchaseOrders: [],
    workflows: []
  };
}

/**
 * Track a created entity for cleanup
 * @param {string} type - Entity type (suppliers, materials, etc.)
 * @param {string} id - Entity ID
 */
export function trackCreatedEntity(type, id) {
  if (createdEntities[type]) {
    createdEntities[type].push(id);
  }
}

/**
 * Get all tracked entities of a type
 * @param {string} type - Entity type
 * @returns {Array} Array of entity IDs
 */
export function getTrackedEntities(type) {
  return createdEntities[type] || [];
}

/**
 * Generate unique test identifier
 * @param {string} prefix - Prefix for the identifier
 * @returns {string} Unique test identifier
 */
export function generateTestId(prefix = 'TEST') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * API call helper with error handling
 * @param {Page} page - Playwright page object
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
export async function apiCall(page, method, endpoint, data = null) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8888';

  try {
    const response = await page.request[method.toLowerCase()](`${baseUrl}${endpoint}`, {
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok()) {
      console.warn(`API call failed: ${method} ${endpoint} - ${response.status()}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`API call error: ${method} ${endpoint} - ${error.message}`);
    return null;
  }
}

/**
 * Clean up test data via API
 * @param {Page} page - Playwright page object
 */
export async function cleanupTestData(page) {
  console.log('🧹 Starting test data cleanup...');

  // Clean up in reverse dependency order
  await cleanupPurchaseOrders(page);
  await cleanupMaterialQuotations(page);
  await cleanupMaterials(page);
  await cleanupSuppliers(page);
  await cleanupWorkflows(page);
  await cleanupMaterialCategories(page);

  console.log('✅ Test data cleanup completed');
  resetTestDataTracking();
}

/**
 * Clean up purchase orders created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupPurchaseOrders(page) {
  const poIds = getTrackedEntities('purchaseOrders');

  for (const poId of poIds) {
    try {
      await apiCall(page, 'DELETE', `/api/purchase-orders/${poId}`);
      console.log(`  ✓ Cleaned up PO: ${poId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up PO ${poId}: ${error.message}`);
    }
  }
}

/**
 * Clean up material quotations created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupMaterialQuotations(page) {
  const quotationIds = getTrackedEntities('quotations');

  for (const quotationId of quotationIds) {
    try {
      await apiCall(page, 'DELETE', `/api/material-quotations/${quotationId}`);
      console.log(`  ✓ Cleaned up quotation: ${quotationId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up quotation ${quotationId}: ${error.message}`);
    }
  }
}

/**
 * Clean up materials created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupMaterials(page) {
  const materialIds = getTrackedEntities('materials');

  for (const materialId of materialIds) {
    try {
      await apiCall(page, 'DELETE', `/api/materials/${materialId}`);
      console.log(`  ✓ Cleaned up material: ${materialId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up material ${materialId}: ${error.message}`);
    }
  }
}

/**
 * Clean up suppliers created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupSuppliers(page) {
  const supplierIds = getTrackedEntities('suppliers');

  for (const supplierId of supplierIds) {
    try {
      await apiCall(page, 'DELETE', `/api/suppliers/${supplierId}`);
      console.log(`  ✓ Cleaned up supplier: ${supplierId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up supplier ${supplierId}: ${error.message}`);
    }
  }
}

/**
 * Clean up workflows created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupWorkflows(page) {
  const workflowIds = getTrackedEntities('workflows');

  for (const workflowId of workflowIds) {
    try {
      await apiCall(page, 'DELETE', `/api/workflows/${workflowId}`);
      console.log(`  ✓ Cleaned up workflow: ${workflowId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up workflow ${workflowId}: ${error.message}`);
    }
  }
}

/**
 * Clean up material categories created during tests
 * @param {Page} page - Playwright page object
 */
async function cleanupMaterialCategories(page) {
  const categoryIds = getTrackedEntities('materialCategories');

  for (const categoryId of categoryIds) {
    try {
      await apiCall(page, 'DELETE', `/api/material-categories/${categoryId}`);
      console.log(`  ✓ Cleaned up category: ${categoryId}`);
    } catch (error) {
      console.warn(`  ⚠ Failed to clean up category ${categoryId}: ${error.message}`);
    }
  }
}

/**
 * Verify seed data exists and is accessible
 * @param {Page} page - Playwright page object
 */
export async function verifySeedData(page) {
  console.log('🔍 Verifying seed data availability...');

  // Check if key seed data exists
  const seedChecks = [
    { endpoint: '/api/suppliers', expectedCount: 3, name: 'suppliers' },
    { endpoint: '/api/materials', expectedCount: 3, name: 'materials' },
    { endpoint: '/api/material-categories', expectedCount: 3, name: 'material categories' },
    { endpoint: '/api/workflows', expectedCount: 3, name: 'workflows' }
  ];

  for (const check of seedChecks) {
    try {
      const response = await apiCall(page, 'GET', check.endpoint);

      if (response && response.result && Array.isArray(response.result)) {
        const count = response.result.length;
        console.log(`  ✓ ${check.name}: ${count} found`);

        if (count < check.expectedCount) {
          console.warn(`  ⚠ Warning: Expected ${check.expectedCount} ${check.name}, found ${count}`);
        }
      } else {
        console.warn(`  ⚠ Warning: Could not verify ${check.name} count`);
      }
    } catch (error) {
      console.warn(`  ⚠ Warning: Could not check ${check.name}: ${error.message}`);
    }
  }

  console.log('✅ Seed data verification completed');
}

/**
 * Create test supplier and track it for cleanup
 * @param {Page} page - Playwright page object
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} Created supplier data
 */
export async function createTestSupplier(page, supplierData = {}) {
  const testId = generateTestId('SUP');
  const defaultData = {
    supplierNumber: testId,
    companyName: {
      zh: `测试供应商-${testId}`,
      en: `Test Supplier ${testId}`
    },
    abbreviation: testId.substring(0, 10),
    type: 'manufacturer',
    category: ['Electronics'],
    status: 'draft',
    contact: {
      primaryContact: 'Test Contact',
      email: `test-${testId.toLowerCase()}@example.com`,
      phone: '+86-123-456-7890'
    },
    address: {
      country: 'China',
      province: 'Guangdong',
      city: 'Shenzhen',
      street: 'Test Address 123'
    }
  };

  const data = { ...defaultData, ...supplierData };

  const response = await apiCall(page, 'POST', '/api/suppliers', data);

  if (response && response.result && response.result._id) {
    trackCreatedEntity('suppliers', response.result._id);
    console.log(`  ✓ Created test supplier: ${testId}`);
    return response.result;
  } else {
    throw new Error('Failed to create test supplier');
  }
}

/**
 * Create test material and track it for cleanup
 * @param {Page} page - Playwright page object
 * @param {Object} materialData - Material data
 * @returns {Promise<Object>} Created material data
 */
export async function createTestMaterial(page, materialData = {}) {
  const testId = generateTestId('MAT');
  const defaultData = {
    materialNumber: testId,
    materialName: {
      zh: `测试物料-${testId}`,
      en: `Test Material ${testId}`
    },
    baseUOM: 'ea',
    type: 'raw',
    status: 'draft',
    description: `Test material created for automated testing - ${testId}`
  };

  const data = { ...defaultData, ...materialData };

  const response = await apiCall(page, 'POST', '/api/materials', data);

  if (response && response.result && response.result._id) {
    trackCreatedEntity('materials', response.result._id);
    console.log(`  ✓ Created test material: ${testId}`);
    return response.result;
  } else {
    throw new Error('Failed to create test material');
  }
}

/**
 * Setup test environment before running tests
 * @param {Page} page - Playwright page object
 */
export async function setupTestEnvironment(page) {
  console.log('🚀 Setting up test environment...');

  // Reset tracking
  resetTestDataTracking();

  // Verify seed data is available
  await verifySeedData(page);

  console.log('✅ Test environment ready');
}

/**
 * Teardown test environment after running tests
 * @param {Page} page - Playwright page object
 */
export async function teardownTestEnvironment(page) {
  console.log('🔚 Tearing down test environment...');

  // Clean up test data
  await cleanupTestData(page);

  console.log('✅ Test environment cleaned up');
}

// Export utility functions for use in tests
export const testUtils = {
  generateTestId,
  trackCreatedEntity,
  getTrackedEntities,
  resetTestDataTracking
};