/**
 * Workflow Test Helpers
 *
 * Specialized helpers for testing procurement workflows:
 * - Multi-user approval flows
 * - Workflow state verification
 * - Approval dashboard interactions
 * - Status transition validation
 */

import {
  login,
  logout,
  navigateToEnhanced as navigateTo,
  clickButton,
  waitForLoading,
  waitForPageReady,
  verifySuccessMessage
} from './testHelpers.js';

/**
 * Test user credentials for workflow testing
 */
export const TEST_USERS = {
  admin: { email: 'e2e.admin@test.com', password: 'test123456', role: 'System Administrator' },
  procurementManager: { email: 'e2e.procurement.manager@test.com', password: 'test123456', role: 'Procurement Manager' },
  costCenter: { email: 'e2e.cost.center@test.com', password: 'test123456', role: 'Cost Center' },
  generalManager: { email: 'e2e.general.manager@test.com', password: 'test123456', role: 'General Manager' },
  dataEntry: { email: 'e2e.data.entry@test.com', password: 'test123456', role: 'Data Entry Personnel' }
};

/**
 * Execute a multi-step approval workflow
 * @param {Page} page - Playwright page object
 * @param {Object} workflowConfig - Workflow configuration
 * @param {Function} submitAction - Function to submit the document
 * @returns {Promise<boolean>} Success status
 */
export async function executeApprovalWorkflow(page, workflowConfig, submitAction) {
  const { steps } = workflowConfig;

  console.log(`🚀 Starting ${steps.length}-step approval workflow`);

  // Step 1: Submit document
  console.log('Step 1: Submitting document for approval');
  const submitResult = await submitAction(page);
  if (!submitResult) {
    console.error('❌ Failed to submit document');
    return false;
  }

  // Execute each approval step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`Step ${i + 2}: ${step.user.role} approval`);

    const approvalResult = await executeApprovalStep(page, step);
    if (!approvalResult) {
      console.error(`❌ Failed at step ${i + 2}: ${step.user.role} approval`);
      return false;
    }
  }

  console.log('✅ Workflow completed successfully');
  return true;
}

/**
 * Execute a single approval step
 * @param {Page} page - Playwright page object
 * @param {Object} step - Step configuration
 * @returns {Promise<boolean>} Success status
 */
export async function executeApprovalStep(page, step) {
  try {
    // Logout current user
    await logout(page);

    // Login as the approver
    await login(page, step.user.email, step.user.password);

    // Navigate to approvals
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);

    // Wait for approvals to load
    await page.waitForTimeout(2000);

    // Find the document in pending approvals
    const approvalItems = page.locator('table tbody tr');
    const itemCount = await approvalItems.count();

    if (itemCount === 0) {
      console.warn(`⚠ No pending approvals found for ${step.user.role}`);
      return false;
    }

    // Click on the first pending approval (should be our document)
    const firstItem = approvalItems.first();
    await firstItem.click();
    await page.waitForTimeout(1000);

    // Perform the approval action
    const approvalResult = await performApprovalAction(page, step.action);
    if (!approvalResult) {
      return false;
    }

    // Verify approval success
    await waitForLoading(page);
    const successMessage = await verifySuccessMessage(page, 'approved');
    return successMessage;

  } catch (error) {
    console.error(`❌ Error in approval step for ${step.user.role}:`, error.message);
    return false;
  }
}

/**
 * Perform approval action (approve/reject)
 * @param {Page} page - Playwright page object
 * @param {string} action - Action to perform (approve/reject)
 * @returns {Promise<boolean>} Success status
 */
export async function performApprovalAction(page, action = 'approve') {
  const buttonText = action === 'approve' ? 'Approve' : 'Reject';

  const button = page.locator(`button:has-text("${buttonText}"), button:has-text("批准"), button:has-text("拒绝")`).first();
  const buttonVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);

  if (!buttonVisible) {
    console.warn(`⚠ ${buttonText} button not found`);
    return false;
  }

  await button.click();

  // Handle confirmation dialog if it appears
  try {
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("确定")').first();
    const confirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (confirmVisible) {
      await confirmButton.click();
    }
  } catch (e) {
    // No confirmation dialog
  }

  return true;
}

/**
 * Verify workflow status for a document
 * @param {Page} page - Playwright page object
 * @param {string} documentType - Type of document (supplier, purchase_order, etc.)
 * @param {string} expectedStatus - Expected status
 * @returns {Promise<boolean>} Status matches expected
 */
export async function verifyWorkflowStatus(page, documentType, expectedStatus) {
  try {
    // Navigate to the document list
    const routeMap = {
      supplier: '/suppliers',
      material: '/materials',
      purchase_order: '/purchase-orders',
      material_quotation: '/material-quotations'
    };

    const route = routeMap[documentType];
    if (!route) {
      console.warn(`⚠ Unknown document type: ${documentType}`);
      return false;
    }

    await navigateTo(page, route);
    await waitForPageReady(page);

    // Look for the document in the list
    // This is a simplified check - in practice, you might need to search or filter
    const statusCells = page.locator('table tbody tr td').filter({ hasText: expectedStatus });
    const statusFound = await statusCells.isVisible({ timeout: 5000 }).catch(() => false);

    if (statusFound) {
      console.log(`✅ Document status verified: ${expectedStatus}`);
      return true;
    } else {
      console.warn(`⚠ Expected status "${expectedStatus}" not found`);
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying workflow status:', error.message);
    return false;
  }
}

/**
 * Wait for document to appear in approval dashboard
 * @param {Page} page - Playwright page object
 * @param {string} documentIdentifier - Text to identify the document
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} Document found in approvals
 */
export async function waitForApproval(page, documentIdentifier, timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(1000);

      // Check if document appears in approval list
      const documentRow = page.locator('table tbody tr').filter({ hasText: documentIdentifier }).first();
      const isVisible = await documentRow.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        console.log(`✅ Document "${documentIdentifier}" found in approvals`);
        return true;
      }

      // Wait before checking again
      await page.waitForTimeout(2000);

    } catch (error) {
      // Continue polling
      await page.waitForTimeout(2000);
    }
  }

  console.warn(`⚠ Document "${documentIdentifier}" not found in approvals within ${timeout}ms`);
  return false;
}

/**
 * Get current approval queue count
 * @param {Page} page - Playwright page object
 * @returns {Promise<number>} Number of pending approvals
 */
export async function getApprovalCount(page) {
  try {
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    const approvalRows = page.locator('table tbody tr');
    const count = await approvalRows.count();
    return count;

  } catch (error) {
    console.warn('❌ Error getting approval count:', error.message);
    return 0;
  }
}

/**
 * Pre-configured workflow test scenarios
 */
export const WORKFLOW_SCENARIOS = {
  supplierApprovalA: {
    name: 'Supplier A-Level Approval',
    steps: [
      { user: TEST_USERS.procurementManager, action: 'approve' },
      { user: TEST_USERS.costCenter, action: 'approve' },
      { user: TEST_USERS.generalManager, action: 'approve' }
    ]
  },

  supplierApprovalB: {
    name: 'Supplier B-Level Approval',
    steps: [
      { user: TEST_USERS.procurementManager, action: 'approve' },
      { user: TEST_USERS.costCenter, action: 'approve' }
    ]
  },

  poApprovalLow: {
    name: 'Low-Value PO Approval',
    steps: [
      { user: TEST_USERS.procurementManager, action: 'approve' }
    ]
  },

  poApprovalMedium: {
    name: 'Medium-Value PO Approval',
    steps: [
      { user: TEST_USERS.procurementManager, action: 'approve' },
      { user: TEST_USERS.costCenter, action: 'approve' }
    ]
  },

  quotationApproval: {
    name: 'Material Quotation Approval',
    steps: [
      { user: TEST_USERS.procurementManager, action: 'approve' }
    ]
  }
};

/**
 * Run a complete workflow test scenario
 * @param {Page} page - Playwright page object
 * @param {string} scenarioName - Name of the scenario from WORKFLOW_SCENARIOS
 * @param {Function} setupAction - Function to create and submit the document
 * @returns {Promise<boolean>} Test success
 */
export async function runWorkflowScenario(page, scenarioName, setupAction) {
  const scenario = WORKFLOW_SCENARIOS[scenarioName];

  if (!scenario) {
    console.error(`❌ Unknown workflow scenario: ${scenarioName}`);
    return false;
  }

  console.log(`🎯 Running workflow scenario: ${scenario.name}`);

  try {
    const result = await executeApprovalWorkflow(page, scenario, setupAction);
    return result;

  } catch (error) {
    console.error(`❌ Workflow scenario failed: ${error.message}`);
    return false;
  }
}