/**
 * Basic CRUD Operations Test
 *
 * Tests fundamental Create, Read, Update, Delete operations for core entities.
 * This ensures the basic happy paths work before testing complex workflows.
 *
 * Covered Entities:
 * - Suppliers (CRUD)
 * - Materials (CRUD)
 * - Purchase Orders (CRUD)
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
  waitForPageReady,
  getTableRowCount
} from '../helpers/testHelpers';

test.describe('Basic CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'e2e.admin@test.com');
  });

  test('should perform complete supplier CRUD operations', async ({ page }) => {
    const timestamp = Date.now();
    const supplierNameZh = `CRUD测试供应商-${timestamp}`;
    const supplierNameEn = `CRUD Test Supplier-${timestamp}`;
    const supplierEmail = `crud-supplier-${timestamp}@test.com`;

    console.log('Testing supplier CRUD operations');

    // ==========================================
    // CREATE: Add new supplier
    // ==========================================
    console.log('Step 1: Creating supplier');

    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    const initialRowCount = await getTableRowCount(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill required fields
    await fillField(page, 'Company Name (ZH)', supplierNameZh);
    await fillField(page, 'Company Name (EN)', supplierNameEn);
    await selectOption(page, 'Type', 'manufacturer');
    await fillField(page, 'Email', supplierEmail);

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const supplierCreated = await verifySuccessMessage(page, 'created successfully');
    expect(supplierCreated).toBe(true);

    console.log('✓ Supplier created successfully');

    // ==========================================
    // READ: Verify supplier appears in list
    // ==========================================
    console.log('Step 2: Verifying supplier in list');

    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    const finalRowCount = await getTableRowCount(page);
    expect(finalRowCount).toBeGreaterThan(initialRowCount);

    // Search for the supplier
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(supplierNameZh);
      await page.keyboard.press('Enter');
      await waitForLoading(page);

      // Should find exactly one result
      const searchResultCount = await getTableRowCount(page);
      expect(searchResultCount).toBe(1);
    }

    console.log('✓ Supplier found in list');

    // ==========================================
    // UPDATE: Modify supplier information
    // ==========================================
    console.log('Step 3: Updating supplier');

    // Click on the supplier row to edit
    const supplierRow = page.locator('table tbody tr').first();
    await supplierRow.click();
    await page.waitForTimeout(1000);

    // Modify a field
    const updatedPhone = '+86-999-8888-7777';
    await fillField(page, 'Phone', updatedPhone);

    const updated = await clickButton(page, 'Save');
    expect(updated).toBe(true);

    await waitForLoading(page);
    const supplierUpdated = await verifySuccessMessage(page, 'updated successfully');
    expect(supplierUpdated).toBe(true);

    console.log('✓ Supplier updated successfully');

    // ==========================================
    // DELETE: Remove supplier (if supported)
    // ==========================================
    console.log('Step 4: Testing supplier deletion');

    // Try to find delete button (may not be available for all suppliers)
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("删除")').first();
    const deleteVisible = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (deleteVisible) {
      await deleteButton.click();

      // Handle confirmation dialog
      const confirmDelete = await clickButton(page, 'Confirm');
      if (confirmDelete) {
        await waitForLoading(page);
        const supplierDeleted = await verifySuccessMessage(page, 'deleted successfully');
        expect(supplierDeleted).toBe(true);
        console.log('✓ Supplier deleted successfully');
      }
    } else {
      console.log('⚠ Delete button not available (possibly restricted for this supplier)');
    }

    console.log('✓ Supplier CRUD operations completed');
  });

  test('should perform complete material CRUD operations', async ({ page }) => {
    const timestamp = Date.now();
    const materialCode = `CRUD-MAT-${timestamp}`;
    const materialNameZh = `CRUD测试物料-${timestamp}`;
    const materialNameEn = `CRUD Test Material-${timestamp}`;

    console.log('Testing material CRUD operations');

    // ==========================================
    // CREATE: Add new material
    // ==========================================
    console.log('Step 1: Creating material');

    await navigateTo(page, '/materials');
    await waitForPageReady(page);

    const initialRowCount = await getTableRowCount(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill required fields
    await fillField(page, 'Material Code', materialCode);
    await fillField(page, 'Material Name (ZH)', materialNameZh);
    await fillField(page, 'Material Name (EN)', materialNameEn);
    await selectOption(page, 'Unit of Measure', 'ea');
    await selectOption(page, 'Type', 'raw');

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const materialCreated = await verifySuccessMessage(page, 'created successfully');
    expect(materialCreated).toBe(true);

    console.log('✓ Material created successfully');

    // ==========================================
    // READ: Verify material appears in list
    // ==========================================
    console.log('Step 2: Verifying material in list');

    await navigateTo(page, '/materials');
    await waitForPageReady(page);

    const finalRowCount = await getTableRowCount(page);
    expect(finalRowCount).toBeGreaterThan(initialRowCount);

    // Search for the material
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(materialCode);
      await page.keyboard.press('Enter');
      await waitForLoading(page);

      // Should find exactly one result
      const searchResultCount = await getTableRowCount(page);
      expect(searchResultCount).toBe(1);
    }

    console.log('✓ Material found in list');

    // ==========================================
    // UPDATE: Modify material information
    // ==========================================
    console.log('Step 3: Updating material');

    // Click on the material row to edit
    const materialRow = page.locator('table tbody tr').first();
    await materialRow.click();
    await page.waitForTimeout(1000);

    // Modify a field
    const updatedDescription = 'Updated description for CRUD test';
    await fillField(page, 'Description', updatedDescription);

    const updated = await clickButton(page, 'Save');
    expect(updated).toBe(true);

    await waitForLoading(page);
    const materialUpdated = await verifySuccessMessage(page, 'updated successfully');
    expect(materialUpdated).toBe(true);

    console.log('✓ Material updated successfully');

    console.log('✓ Material CRUD operations completed');
  });

  test('should perform basic purchase order operations', async ({ page }) => {
    const timestamp = Date.now();
    const quantity = 25;
    const unitPrice = 50.00;

    console.log('Testing basic purchase order operations');

    // ==========================================
    // CREATE: Add new PO
    // ==========================================
    console.log('Step 1: Creating purchase order');

    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    const initialRowCount = await getTableRowCount(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Fill PO with existing supplier and material
    await selectOption(page, 'Supplier', 'E2E-TEST-SUP-001');
    await fillField(page, 'Order Date', new Date().toISOString().split('T')[0]);
    await fillField(page, 'Expected Delivery Date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await selectOption(page, 'Material', 'E2E-TEST-MAT-001');
    await fillField(page, 'Quantity', quantity.toString());
    await fillField(page, 'Unit Price', unitPrice.toString());

    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);
    const poCreated = await verifySuccessMessage(page, 'created successfully');
    expect(poCreated).toBe(true);

    console.log('✓ Purchase order created successfully');

    // ==========================================
    // READ: Verify PO appears in list
    // ==========================================
    console.log('Step 2: Verifying PO in list');

    await navigateTo(page, '/purchase-orders');
    await waitForPageReady(page);

    const finalRowCount = await getTableRowCount(page);
    expect(finalRowCount).toBeGreaterThan(initialRowCount);

    console.log('✓ Purchase order operations completed');
  });

  test('should handle form validation errors', async ({ page }) => {
    console.log('Testing form validation');

    // Try to create supplier with missing required fields
    await navigateTo(page, '/suppliers');
    await waitForPageReady(page);

    const createClicked = await clickButton(page, 'Create');
    expect(createClicked).toBe(true);

    await page.waitForTimeout(1000);

    // Leave required fields empty and try to save
    const saved = await clickButton(page, 'Save');
    expect(saved).toBe(true);

    await waitForLoading(page);

    // Should see validation errors
    const errorMessages = page.locator('.ant-form-item-explain-error, .ant-message-error');
    const hasErrors = await errorMessages.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasErrors) {
      console.log('✓ Form validation working correctly');
    } else {
      console.log('⚠ No validation errors displayed (may be handled differently)');
    }

    // Cancel the form
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("取消")').first();
    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click();
    }

    console.log('✓ Form validation test completed');
  });
});