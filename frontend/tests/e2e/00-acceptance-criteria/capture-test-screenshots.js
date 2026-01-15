/**
 * Capture Screenshots from Test Execution
 * Runs acceptance criteria tests and captures screenshots at key points
 */

import { test as baseTest, expect } from '@playwright/test';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../../../../doc/screenshots');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Import test helpers
const testHelpersPath = path.join(__dirname, '../helpers/testHelpers.js');
const testHelpers = await import(testHelpersPath);
const { login, navigateTo, fillField, clickButton, selectOption, waitForLoading } = testHelpers;

async function captureScreenshotsFromTests() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    baseURL: BASE_URL
  });
  const page = await context.newPage();

  try {
    console.log('=== Capturing Screenshots from Test Workflows ===\n');

    // Login
    await login(page);
    await page.waitForTimeout(1000);

    // ============================================
    // PRE-PROCUREMENT: SUPPLIER MANAGEMENT
    // ============================================
    console.log('=== Supplier Management Workflow ===');
    
    await navigateTo(page, '/suppliers');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-supplier-list.png'), fullPage: true });
    
    // Create supplier workflow
    const createBtn = page.locator('button:has-text("Add new supplier"), button:has-text("Create")').first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-supplier-form.png'), fullPage: true });
      
      // Fill form
      await fillField(page, 'Company Name (ZH)', '测试供应商');
      await fillField(page, 'Company Name (EN)', 'Test Supplier');
      await fillField(page, 'Email', 'test@supplier.com');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-supplier-form-filled.png'), fullPage: true });
      
      // Save
      await clickButton(page, 'Save');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-supplier-created-success.png'), fullPage: true });
    }

    // Export
    await navigateTo(page, '/suppliers');
    await waitForLoading(page);
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportBtn.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-export-button.png'), fullPage: true });
    }

    // Submit for approval
    const firstRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      const submitBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-submit-button.png'), fullPage: true });
      }
    }

    // ============================================
    // PRE-PROCUREMENT: MATERIAL MANAGEMENT
    // ============================================
    console.log('\n=== Material Management Workflow ===');
    
    await navigateTo(page, '/materials');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-material-list.png'), fullPage: true });
    
    const materialBtn = page.locator('button:has-text("新增物料"), button:has-text("Create")').first();
    if (await materialBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await materialBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-material-form.png'), fullPage: true });
      
      await fillField(page, 'Material Code', 'MAT-001');
      await fillField(page, 'Material Name (ZH)', '测试物料');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-material-created-success.png'), fullPage: true });
    }

    // Material categories
    await navigateTo(page, '/material-categories');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-category-list.png'), fullPage: true });
    
    const categoryBtn = page.locator('button:has-text("Create")').first();
    if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-category-form.png'), fullPage: true });
    }

    // Material export
    await navigateTo(page, '/materials');
    await waitForLoading(page);
    const materialExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
    if (await materialExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-material-export-button.png'), fullPage: true });
    }

    // ============================================
    // PRE-PROCUREMENT: QUOTATION MANAGEMENT
    // ============================================
    console.log('\n=== Quotation Management Workflow ===');
    
    await navigateTo(page, '/material-quotations');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21-quotation-list.png'), fullPage: true });
    
    const quotationBtn = page.locator('button:has-text("New Quotation"), button:has-text("Create")').first();
    if (await quotationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quotationBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23-quotation-form.png'), fullPage: true });
      
      // Add quotes
      const addQuoteBtn = page.locator('button:has-text("Add Quote")').first();
      if (await addQuoteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24-add-quotes.png'), fullPage: true });
      }
      
      // Attachment
      const quotationUpload = page.locator('.ant-upload, input[type="file"]').first();
      if (await quotationUpload.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26-quotation-attachment.png'), fullPage: true });
      }
    }
    
    // Compare quotes
    await navigateTo(page, '/material-quotations');
    await waitForLoading(page);
    const compareBtn = page.locator('button:has-text("Compare"), button:has-text("比较")').first();
    if (await compareBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await compareBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31-quote-comparison-table.png'), fullPage: true });
    }

    // Submit quotation
    const quotationRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await quotationRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quotationRow.click();
      await page.waitForTimeout(1000);
      const submitQuotationBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitQuotationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28-submit-quotation.png'), fullPage: true });
      }
    }

    // ============================================
    // PROCUREMENT: MRP REQUIREMENTS
    // ============================================
    console.log('\n=== MRP Requirements Workflow ===');
    
    const mrpRoutes = ['/mrp', '/material-requirements'];
    for (const route of mrpRoutes) {
      try {
        await navigateTo(page, route);
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        if (currentUrl.includes(route.replace('/', '')) || currentUrl.includes('mrp')) {
          await waitForLoading(page);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32-mrp-page.png'), fullPage: true });
          
          const calculateBtn = page.locator('button:has-text("Calculate"), button:has-text("计算")').first();
          if (await calculateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '33-calculate-mrp-button.png'), fullPage: true });
          }
          
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '35-mrp-list-with-traceability.png'), fullPage: true });
          
          // Export MRP
          const mrpExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
          if (await mrpExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '36-mrp-export-button.png'), fullPage: true });
          }
          
          // Generate PO from MRP
          const mrpRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
          if (await mrpRow.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mrpRow.click();
            await page.waitForTimeout(500);
            const generateBtn = page.locator('button:has-text("Generate PO"), button:has-text("生成采购订单")').first();
            if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await page.screenshot({ path: path.join(SCREENSHOT_DIR, '39-generate-po-button.png'), fullPage: true });
            }
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // ============================================
    // PROCUREMENT: PURCHASE ORDERS
    // ============================================
    console.log('\n=== Purchase Order Workflow ===');
    
    await navigateTo(page, '/purchase-orders');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '41-po-list.png'), fullPage: true });
    
    const poBtn = page.locator('button:has-text("Create Purchase Order"), button:has-text("Create")').first();
    if (await poBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await poBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '43-po-form.png'), fullPage: true });
      
      // PO attachment
      const poUpload = page.locator('.ant-upload, input[type="file"]').first();
      if (await poUpload.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '45-po-attachment.png'), fullPage: true });
      }
    }
    
    // PO status and export
    await navigateTo(page, '/purchase-orders');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '49-po-status-column.png'), fullPage: true });
    
    const poExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
    if (await poExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '51-po-export-button.png'), fullPage: true });
    }
    
    // Submit PO
    const poRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await poRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await poRow.click();
      await page.waitForTimeout(1000);
      const submitPOBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitPOBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '47-submit-po-button.png'), fullPage: true });
      }
      
      // PO status details
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '50-po-status-details.png'), fullPage: true });
    }

    // ============================================
    // PROCUREMENT: GOODS RECEIPT
    // ============================================
    console.log('\n=== Goods Receipt Workflow ===');
    
    await navigateTo(page, '/goods-receipts');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '53-goods-receipt-list.png'), fullPage: true });
    
    const grBtn = page.locator('button:has-text("Create"), button:has-text("New Receipt")').first();
    if (await grBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await grBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '55-gr-form.png'), fullPage: true });
    }
    
    await navigateTo(page, '/goods-receipts');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '57-gr-status-column.png'), fullPage: true });

    // ============================================
    // POST-PROCUREMENT: PAYMENT
    // ============================================
    console.log('\n=== Payment Workflow ===');
    
    await navigateTo(page, '/payment');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '58-payment-list.png'), fullPage: true });
    
    const paymentBtn = page.locator('button:has-text("Create")').first();
    if (await paymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await paymentBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '60-payment-form.png'), fullPage: true });
    }
    
    await navigateTo(page, '/payment');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '64-payment-status.png'), fullPage: true });
    
    // Submit payment
    const paymentRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await paymentRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paymentRow.click();
      await page.waitForTimeout(1000);
      const submitPaymentBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitPaymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '62-submit-payment.png'), fullPage: true });
      }
      
      // Complete payment
      const completeBtn = page.locator('button:has-text("Complete"), button:has-text("完成")').first();
      if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '65-complete-payment-button.png'), fullPage: true });
      }
    }
    
    // Payment linked to PO
    await navigateTo(page, '/purchase-orders');
    await waitForLoading(page);
    const poDetailRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await poDetailRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await poDetailRow.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '67-po-payment-info.png'), fullPage: true });
    }

    // ============================================
    // SYSTEM: WORKFLOWS
    // ============================================
    console.log('\n=== Workflow Configuration ===');
    
    await navigateTo(page, '/workflows');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '72-workflow-list.png'), fullPage: true });
    
    const workflowBtn = page.locator('button:has-text("Create")').first();
    if (await workflowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await workflowBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '74-workflow-form.png'), fullPage: true });
      
      // Multi-level setup
      const addLevelBtn = page.locator('button:has-text("Add Level")').first();
      if (await addLevelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '75-multi-level-setup.png'), fullPage: true });
      }
      
      // Amount-based rules
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '77-amount-based-rules.png'), fullPage: true });
    }

    // ============================================
    // SYSTEM: APPROVALS
    // ============================================
    console.log('\n=== Approval Dashboard ===');
    
    await navigateTo(page, '/approvals');
    await waitForLoading(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '78-approval-dashboard.png'), fullPage: true });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '79-approval-status.png'), fullPage: true });
    
    // Approval actions
    const approveBtn = page.locator('button:has-text("Approve"), button:has-text("批准")').first();
    if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '90-approval-actions.png'), fullPage: true });
    }

    console.log('\n=== Screenshot Capture Complete ===');
    const screenshotCount = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length;
    console.log(`\nTotal screenshots captured: ${screenshotCount}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('Error capturing screenshots:', error);
    try {
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '00-error.png'),
        fullPage: true 
      });
    } catch (e) {
      // Ignore
    }
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  captureScreenshotsFromTests().catch(console.error);
}

export { captureScreenshotsFromTests };
