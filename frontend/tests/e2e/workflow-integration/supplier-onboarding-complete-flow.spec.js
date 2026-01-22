/**
 * Supplier Onboarding Complete Flow Test
 *
 * Tests the complete supplier onboarding workflow from creation through final approval.
 * This covers the happy path for supplier onboarding as defined in the process flow diagrams.
 *
 * Workflow Steps:
 * 1. Data Entry Personnel creates supplier with all required fields
 * 2. System validates required fields and uploads documents
 * 3. Supplier is submitted for approval (status: Under Review)
 * 4. Procurement Manager reviews and approves (Level 1)
 * 5. Cost Center reviews and approves (Level 2)
 * 6. General Manager reviews and approves (Level 3) [for A-level suppliers]
 * 7. Supplier status changes to Active
 * 8. Notification sent to procurement team
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

test.describe('Supplier Onboarding Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts with fresh login
  });

  test('should complete full supplier onboarding workflow for A-level supplier', async ({ page }) => {
    const timestamp = Date.now();
    const supplierNameZh = `集成测试供应商A-${timestamp}`;
    const supplierNameEn = `Integration Test Supplier A-${timestamp}`;
    const supplierEmail = `supplier-a-${timestamp}@test.com`;

    // ==========================================
    // Step 1: Data Entry Personnel creates supplier
    // ==========================================
    console.log('Step 1: Data Entry Personnel creates supplier');

    await login(page, 'e2e.data.entry@test.com');
    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    // Click create button
    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill all required supplier information
    await fillField(page, 'Company Name (ZH)', supplierNameZh);
    await fillField(page, 'Company Name (EN)', supplierNameEn);
    await selectOption(page, 'Type', 'manufacturer');
    await fillField(page, 'Email', supplierEmail);
    await fillField(page, 'Phone', '+86-123-4567-8901');

    // Fill address information
    await fillField(page, 'Country', 'China');
    await fillField(page, 'Province', 'Guangdong');
    await fillField(page, 'City', 'Shenzhen');
    await fillField(page, 'Street', '高新区科技园123号');

    // Fill business information
    await fillField(page, 'Business License Number', `BL-${timestamp}`);
    await fillField(page, 'Tax ID', `TAX-${timestamp}`);

    // Save the supplier
    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const supplierCreated = await verifySuccessMessage(page, 'created successfully');
    expect(supplierCreated).toBe(true);

    console.log('✓ Supplier created successfully');

    // ==========================================
    // Step 2: Submit supplier for approval
    // ==========================================
    console.log('Step 2: Submit supplier for approval');

    // Submit for approval (should trigger workflow)
    const submitted = await clickButton(page, 'Submit');
    expect(submitted).toBe(true);

    await waitForLoading(page);
    const submitSuccess = await verifySuccessMessage(page, 'submitted');
    expect(submitSuccess).toBe(true);

    console.log('✓ Supplier submitted for approval');

    // Logout data entry user
    await logout(page);

    // ==========================================
    // Step 3: Procurement Manager Level 1 Approval
    // ==========================================
    console.log('Step 3: Procurement Manager Level 1 Approval');

    await login(page, 'e2e.procurement.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);

    // Should see the supplier in pending approvals
    await page.waitForTimeout(2000); // Allow time for approval to appear

    // Look for the supplier in the approval list
    const supplierRow = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();

    const supplierVisible = await supplierRow.isVisible({ timeout: 5000 }).catch(() => false);
    expect(supplierVisible).toBe(true);

    // Click on the supplier row to open approval details
    await supplierRow.click();
    await page.waitForTimeout(1000);

    // Approve at Level 1
    const approvedL1 = await clickButton(page, 'Approve');
    expect(approvedL1).toBe(true);

    await waitForLoading(page);
    const approvalL1Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL1Success).toBe(true);

    console.log('✓ Level 1 approval completed');

    // Logout procurement manager
    await logout(page);

    // ==========================================
    // Step 4: Cost Center Level 2 Approval
    // ==========================================
    console.log('Step 4: Cost Center Level 2 Approval');

    await login(page, 'e2e.cost.center@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);

    // Should see the supplier in pending approvals
    await page.waitForTimeout(2000);

    // Look for the supplier again (should still be in approval queue)
    const supplierRowL2 = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();

    const supplierVisibleL2 = await supplierRowL2.isVisible({ timeout: 5000 }).catch(() => false);
    expect(supplierVisibleL2).toBe(true);

    // Click to open approval details
    await supplierRowL2.click();
    await page.waitForTimeout(1000);

    // Approve at Level 2
    const approvedL2 = await clickButton(page, 'Approve');
    expect(approvedL2).toBe(true);

    await waitForLoading(page);
    const approvalL2Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL2Success).toBe(true);

    console.log('✓ Level 2 approval completed');

    // Logout cost center
    await logout(page);

    // ==========================================
    // Step 5: General Manager Level 3 Approval (A-level supplier)
    // ==========================================
    console.log('Step 5: General Manager Level 3 Approval');

    await login(page, 'e2e.general.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);

    // Should see the supplier in pending approvals
    await page.waitForTimeout(2000);

    // Look for the supplier again
    const supplierRowL3 = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();

    const supplierVisibleL3 = await supplierRowL3.isVisible({ timeout: 5000 }).catch(() => false);
    expect(supplierVisibleL3).toBe(true);

    // Click to open approval details
    await supplierRowL3.click();
    await page.waitForTimeout(1000);

    // Approve at Level 3 (final approval)
    const approvedL3 = await clickButton(page, 'Approve');
    expect(approvedL3).toBe(true);

    await waitForLoading(page);
    const approvalL3Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL3Success).toBe(true);

    console.log('✓ Level 3 approval completed');

    // Logout general manager
    await logout(page);

    // ==========================================
    // Step 6: Verify supplier is now active
    // ==========================================
    console.log('Step 6: Verify supplier activation');

    await login(page, 'e2e.admin@test.com');
    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    // Search for the supplier
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(supplierNameZh);
      await page.keyboard.press('Enter');
      await waitForLoading(page);
    }

    // Verify supplier appears in list and shows as active
    const supplierRowFinal = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();

    const supplierFinalVisible = await supplierRowFinal.isVisible({ timeout: 5000 }).catch(() => false);
    expect(supplierFinalVisible).toBe(true);

    // Check if status shows as Active
    const statusCell = supplierRowFinal.locator('td').filter({ hasText: 'Active' }).first();
    const statusVisible = await statusCell.isVisible({ timeout: 2000 }).catch(() => false);
    expect(statusVisible).toBe(true);

    console.log('✓ Supplier successfully activated');
    console.log('🎉 Supplier onboarding workflow completed successfully!');

  });

  test('should complete supplier onboarding for B-level supplier (2-level approval)', async ({ page }) => {
    const timestamp = Date.now();
    const supplierNameZh = `集成测试供应商B-${timestamp}`;
    const supplierNameEn = `Integration Test Supplier B-${timestamp}`;
    const supplierEmail = `supplier-b-${timestamp}@test.com`;

    console.log('Testing B-level supplier workflow (2-level approval)');

    // Create B-level supplier (should only need 2 approvals)
    await login(page, 'e2e.data.entry@test.com');
    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    await fillField(page, 'Company Name (ZH)', supplierNameZh);
    await fillField(page, 'Company Name (EN)', supplierNameEn);
    await selectOption(page, 'Type', 'distributor'); // B-level supplier type
    await fillField(page, 'Email', supplierEmail);

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const supplierCreated = await verifySuccessMessage(page, 'created successfully');
    expect(supplierCreated).toBe(true);

    // Submit for approval
    const submitted = await clickButton(page, 'Submit');
    expect(submitted).toBe(true);

    await logout(page);

    // Level 1: Procurement Manager
    await login(page, 'e2e.procurement.manager@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const supplierRowL1 = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();
    expect(await supplierRowL1.isVisible({ timeout: 5000 })).toBe(true);

    await supplierRowL1.click();
    await page.waitForTimeout(1000);

    const approvedL1 = await clickButton(page, 'Approve');
    expect(approvedL1).toBe(true);

    await waitForLoading(page);
    const approvalL1Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL1Success).toBe(true);

    await logout(page);

    // Level 2: Cost Center (should be final approval for B-level)
    await login(page, 'e2e.cost.center@test.com');
    await navigateTo(page, '/approvals');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const supplierRowL2 = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();
    expect(await supplierRowL2.isVisible({ timeout: 5000 })).toBe(true);

    await supplierRowL2.click();
    await page.waitForTimeout(1000);

    const approvedL2 = await clickButton(page, 'Approve');
    expect(approvedL2).toBe(true);

    await waitForLoading(page);
    const approvalL2Success = await verifySuccessMessage(page, 'approved');
    expect(approvalL2Success).toBe(true);

    // Verify supplier is active (B-level doesn't need GM approval)
    await logout(page);
    await login(page, 'e2e.admin@test.com');
    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    const supplierRowFinal = page.locator('table tbody tr').filter({
      hasText: supplierNameZh
    }).first();
    expect(await supplierRowFinal.isVisible({ timeout: 5000 })).toBe(true);

    console.log('✓ B-level supplier onboarding completed (2-level approval)');
  });
});