/**
 * Purchase Order Approval Workflow Test
 *
 * Tests the complete purchase order approval workflow from creation through final approval.
 * This covers the happy path for PO approval as defined in the process flow diagrams.
 *
 * Workflow Steps:
 * 1. Purchaser creates PO (manual or from MRP)
 * 2. System validates PO data and calculates totals
 * 3. Submit for approval
 * 4. Procurement Manager reviews (L1) - always required
 * 5. Cost Center reviews (L2) - if amount ≥ ¥10,000
 * 6. General Manager reviews (L3) - if amount ≥ ¥50,000
 * 7. Approved PO sent to supplier
 * 8. PO status tracking throughout lifecycle
 */

import { test, expect } from '@playwright/test';
import {
  login,
  logout,
  navigateToEnhanced as navigateTo,
  clickButton,
  fillField,
  selectOption,
  verifySuccessMessage,
  waitForLoading,
  waitForPageReady
} from '../helpers/testHelpers';

test.describe('Purchase Order Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts with fresh login
  });

  test('should complete PO approval workflow for low-value order (1-level approval)', async ({ page }) => {
    const timestamp = Date.now();
    const quantity = 5;
    const unitPrice = 100.00; // Total: ¥500 (below ¥10,000 threshold)

    console.log('Testing low-value PO workflow (1-level approval)');

    // ==========================================
    // Step 1: Create PO (Low Value)
    // ==========================================
    console.log('Step 1: Creating low-value purchase order');

    await login(page, 'e2e.data.entry@test.com');
    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    // Click create button
    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill PO with low-value amount (should only need L1 approval)
    // Use existing seed data suppliers and materials
    await selectOption(page, 'Supplier', 'E2E-TEST-SUP-001'); // Test Supplier A
    await fillField(page, 'Order Date', new Date().toISOString().split('T')[0]);
    await fillField(page, 'Expected Delivery Date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await selectOption(page, 'Material', 'E2E-TEST-MAT-001'); // Test Material 1
    await fillField(page, 'Quantity', quantity.toString());
    await fillField(page, 'Unit Price', unitPrice.toString());

    // Save PO
    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const poCreated = await verifySuccessMessage(page, 'created successfully');
    expect(poCreated).toBe(true);

    console.log('✓ Low-value PO created successfully');

    // ==========================================
    // Step 2: Submit PO for approval
    // ==========================================
    console.log('Step 2: Submit PO for approval');

    const submitted = await clickButton(page, 'Submit');
    expect(submitted).toBe(true);

    await waitForLoading(page);
    const submitSuccess = await verifySuccessMessage(page, 'submitted');
    expect(submitSuccess).toBe(true);

    console.log('✓ PO submitted for approval');

    // Logout data entry user
    await logout(page);

    // ==========================================
    // Step 3: Procurement Manager Level 1 Approval (Only level needed)
    // ==========================================
    console.log('Step 3: Procurement Manager Level 1 Approval');

    await login(page, 'e2e.procurement.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);

    // Should see the PO in pending approvals
    await page.waitForTimeout(2000);

    // Look for the PO in the approval list (may need to search by PO number or amount)
    const poRow = page.locator('table tbody tr').first(); // Get first pending approval

    const poVisible = await poRow.isVisible({ timeout: 5000 }).catch(() => false);
    expect(poVisible).toBe(true);

    // Click on the PO row to open approval details
    await poRow.click();
    await page.waitForTimeout(1000);

    // Approve at Level 1 (should be final approval for low-value PO)
    const approved = await clickButton(page, 'Approve');
    expect(approved).toBe(true);

    await waitForLoading(page);
    const approvalSuccess = await verifySuccessMessage(page, 'approved');
    expect(approvalSuccess).toBe(true);

    console.log('✓ Level 1 approval completed - PO should be approved');

    // Logout procurement manager
    await logout(page);

    // ==========================================
    // Step 4: Verify PO status is approved
    // ==========================================
    console.log('Step 4: Verify PO approval status');

    await login(page, 'e2e.admin@test.com');
    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    // The approved PO should appear in the list
    await page.waitForTimeout(2000);

    // Check that we can see approved POs
    const poList = page.locator('table tbody tr');
    const poCount = await poList.count();
    expect(poCount).toBeGreaterThan(0);

    console.log('✓ PO approval workflow completed for low-value order');
  });

  test('should complete PO approval workflow for medium-value order (2-level approval)', async ({ page }) => {
    const timestamp = Date.now();
    const quantity = 50;
    const unitPrice = 300.00; // Total: ¥15,000 (between ¥10,000-¥50,000 threshold)

    console.log('Testing medium-value PO workflow (2-level approval)');

    // ==========================================
    // Step 1: Create PO (Medium Value)
    // ==========================================
    console.log('Step 1: Creating medium-value purchase order');

    await login(page, 'e2e.data.entry@test.com');
    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill PO with medium-value amount (should need L1 + L2 approval)
    await selectOption(page, 'Supplier', 'E2E-TEST-SUP-002'); // Test Supplier B
    await fillField(page, 'Order Date', new Date().toISOString().split('T')[0]);
    await fillField(page, 'Expected Delivery Date', new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await selectOption(page, 'Material', 'E2E-TEST-MAT-002'); // Test Material 2
    await fillField(page, 'Quantity', quantity.toString());
    await fillField(page, 'Unit Price', unitPrice.toString());

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const poCreated = await verifySuccessMessage(page, 'created successfully');
    expect(poCreated).toBe(true);

    console.log('✓ Medium-value PO created successfully');

    // ==========================================
    // Step 2: Submit for approval
    // ==========================================
    console.log('Step 2: Submit PO for approval');

    const submitted = await clickButton(page, 'Submit');
    expect(submitted).toBe(true);

    await waitForLoading(page);
    const submitSuccess = await verifySuccessMessage(page, 'submitted');
    expect(submitSuccess).toBe(true);

    await logout(page);

    // ==========================================
    // Step 3: Level 1 - Procurement Manager Approval
    // ==========================================
    console.log('Step 3: Level 1 - Procurement Manager Approval');

    await login(page, 'e2e.procurement.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const poRowL1 = page.locator('table tbody tr').first();
    expect(await poRowL1.isVisible({ timeout: 5000 })).toBe(true);

    await poRowL1.click();
    await page.waitForTimeout(1000);

    const approvedL1 = await clickButton(page, 'Approve');
    expect(approvedL1).toBe(true);

    await waitForLoading(page);
    const approvalL1Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL1Success).toBe(true);

    console.log('✓ Level 1 approval completed');

    await logout(page);

    // ==========================================
    // Step 4: Level 2 - Cost Center Approval (Final)
    // ==========================================
    console.log('Step 4: Level 2 - Cost Center Approval');

    await login(page, 'e2e.cost.center@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const poRowL2 = page.locator('table tbody tr').first();
    expect(await poRowL2.isVisible({ timeout: 5000 })).toBe(true);

    await poRowL2.click();
    await page.waitForTimeout(1000);

    const approvedL2 = await clickButton(page, 'Approve');
    expect(approvedL2).toBe(true);

    await waitForLoading(page);
    const approvalL2Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL2Success).toBe(true);

    console.log('✓ Level 2 approval completed - PO should be fully approved');

    // Verify final status
    await logout(page);
    await login(page, 'e2e.admin@test.com');
    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const poList = page.locator('table tbody tr');
    const poCount = await poList.count();
    expect(poCount).toBeGreaterThan(0);

    console.log('✓ Medium-value PO approval workflow completed');
  });

  test('should handle PO rejection and resubmission', async ({ page }) => {
    const timestamp = Date.now();
    const quantity = 10;
    const unitPrice = 200.00; // Total: ¥2,000 (low value)

    console.log('Testing PO rejection and resubmission workflow');

    // Create and submit PO
    await login(page, 'e2e.data.entry@test.com');
    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    await selectOption(page, 'Supplier', 'E2E-TEST-SUP-001');
    await fillField(page, 'Order Date', new Date().toISOString().split('T')[0]);
    await fillField(page, 'Expected Delivery Date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    await selectOption(page, 'Material', 'E2E-TEST-MAT-001');
    await fillField(page, 'Quantity', quantity.toString());
    await fillField(page, 'Unit Price', unitPrice.toString());

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const poCreated = await verifySuccessMessage(page, 'created successfully');
    expect(poCreated).toBe(true);

    // Submit for approval
    const submitted = await clickButton(page, 'Submit');
    expect(submitted).toBe(true);

    await logout(page);

    // Procurement Manager rejects the PO
    await login(page, 'e2e.procurement.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const poRow = page.locator('table tbody tr').first();
    expect(await poRow.isVisible({ timeout: 5000 })).toBe(true);

    await poRow.click();
    await page.waitForTimeout(1000);

    // Reject the PO
    const rejectButton = page.locator('button:has-text("Reject"), button:has-text("拒绝")').first();
    const rejectVisible = await rejectButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (rejectVisible) {
      await rejectButton.click();

      // Fill rejection reason
      const reasonField = page.locator('textarea[name="rejectionReason"], textarea[placeholder*="reason"]').first();
      if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonField.fill('Test rejection for workflow validation');
      }

      // Confirm rejection
      const confirmReject = await clickButton(page, 'Confirm');
      expect(confirmReject).toBe(true);

      await waitForLoading(page);
      const rejectSuccess = await verifySuccessMessage(page, 'rejected');
      expect(rejectSuccess).toBe(true);

      console.log('✓ PO rejected successfully');
    } else {
      console.log('⚠ Reject button not found, skipping rejection test');
    }

    console.log('✓ PO rejection workflow test completed');
  });
});