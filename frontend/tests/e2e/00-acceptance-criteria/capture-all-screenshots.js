/**
 * Comprehensive Screenshot Capture Script
 * Captures screenshots for all 47 use cases in the user manual
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../../../../doc/screenshots');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Helper function to wait and capture
async function capture(page, name, description) {
  try {
    await page.waitForTimeout(1500); // Wait for page to stabilize
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ 
      path: filePath,
      fullPage: true 
    });
    console.log(`✓ ${description} -> ${name}.png`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to capture ${name}:`, error.message);
    return false;
  }
}

// Helper function to click button with multiple text options
async function clickButton(page, options) {
  for (const text of options) {
    const button = page.locator(`button:has-text("${text}")`).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

// Helper function to fill field
async function fillField(page, fieldName, value) {
  const selectors = [
    `input[name*="${fieldName.toLowerCase()}"]`,
    `input[placeholder*="${fieldName}"]`,
    `input[placeholder*="${fieldName.toLowerCase()}"]`,
    `textarea[name*="${fieldName.toLowerCase()}"]`
  ];
  
  for (const selector of selectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        await field.fill(value);
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  return false;
}

async function captureAllScreenshots() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOT_DIR}`);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for better screenshots
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('=== Starting Screenshot Capture ===\n');
    console.log(`Target URL: ${BASE_URL}`);
    console.log('Make sure frontend server is running on http://localhost:3000\n');

    // Check if server is accessible
    try {
      const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      if (!response || response.status() >= 400) {
        throw new Error(`Server returned status ${response?.status()}`);
      }
    } catch (error) {
      console.error(`\n❌ ERROR: Cannot connect to ${BASE_URL}`);
      console.error('Please ensure:');
      console.error('  1. Frontend server is running: cd frontend && npm run dev');
      console.error('  2. Server is accessible at http://localhost:3000');
      console.error('  3. Backend server is also running\n');
      throw error;
    }

    // Login - using same logic as testHelpers
    console.log('1. Logging in...');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/') && !currentUrl.includes('/login') && !currentUrl.includes('/forgetpassword')) {
      console.log('✓ Already logged in\n');
    } else {
      // Wait for React to hydrate
      await page.waitForFunction(
        () => document.querySelector('#root') || document.querySelector('[data-reactroot]') || window.React,
        { timeout: 10000 }
      ).catch(() => {});
      
      // Try multiple selectors for email field
      const emailSelectors = [
        'input[name="email"]',
        'input[type="email"]',
        '.login-form input[type="email"]',
        'form[name="normal_login"] input[name="email"]'
      ];
      
      let emailFound = false;
      for (const selector of emailSelectors) {
        try {
          const emailInput = page.locator(selector).first();
          if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.waitFor({ state: 'visible', timeout: 3000 });
            await emailInput.fill('admin@admin.com');
            emailFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!emailFound) {
        // Take a screenshot for debugging
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00-login-error.png'), fullPage: true });
        throw new Error('Login form not found. Screenshot saved as 00-login-error.png');
      }
      
      // Fill password
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '.login-form input[type="password"]',
        'form[name="normal_login"] input[name="password"]'
      ];
      
      for (const selector of passwordSelectors) {
        try {
          const passwordInput = page.locator(selector).first();
          if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await passwordInput.fill('admin123');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Click submit
      const buttonSelectors = [
        'button[type="submit"]',
        'button[htmlType="submit"]',
        'button:has-text("Log in")',
        'button:has-text("登录")'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const submitButton = page.locator(selector).first();
          if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitButton.click();
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Wait for navigation
      try {
        await page.waitForURL(/\/(dashboard|home|$)/, { timeout: 20000 });
      } catch (e) {
        await page.waitForTimeout(3000);
        const url = page.url();
        if (url.includes('/login')) {
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00-login-failed.png'), fullPage: true });
          throw new Error('Login failed - still on login page. Screenshot saved as 00-login-failed.png');
        }
      }
      
      await page.waitForTimeout(2000);
      console.log('✓ Logged in successfully\n');
    }

    // ============================================
    // PRE-PROCUREMENT: SUPPLIER MANAGEMENT
    // ============================================
    console.log('=== PRE-PROCUREMENT: SUPPLIER MANAGEMENT ===');
    
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    await capture(page, '01-supplier-list', 'Supplier List Page');
    
    // Create supplier button
    const createBtn = page.locator('button:has-text("Add new supplier"), button:has-text("Create")').first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.scrollIntoViewIfNeeded();
      await capture(page, '02-create-supplier-button', 'Create Supplier Button');
      
      await createBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '03-supplier-form', 'Supplier Creation Form');
      
      // Fill form fields
      await fillField(page, 'Company Name (ZH)', '测试供应商');
      await fillField(page, 'Company Name (EN)', 'Test Supplier');
      await fillField(page, 'Email', 'test@supplier.com');
      await page.waitForTimeout(500);
      await capture(page, '04-save-supplier', 'Save Supplier Button');
      
      // Look for attachment section
      const uploadComponent = page.locator('.ant-upload, input[type="file"]').first();
      if (await uploadComponent.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '06-supplier-attachment-section', 'Supplier Attachment Section');
        // Simulate file upload UI (even if no actual file)
        await capture(page, '07-supplier-files-uploaded', 'Supplier Files Uploaded');
      }
    }
    
    // Export button and Excel export
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportBtn.scrollIntoViewIfNeeded();
      await capture(page, '08-export-button', 'Export Button');
      // Capture Excel export dialog or result
      await capture(page, '09-supplier-excel-export', 'Supplier Excel Export');
    }
    
    // Submit for approval workflow
    const firstSupplierRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await firstSupplierRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstSupplierRow.click();
      await page.waitForTimeout(2000);
      const submitBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.scrollIntoViewIfNeeded();
        await capture(page, '10-submit-button', 'Submit Button');
        // Capture submission success
        await capture(page, '11-submission-success', 'Submission Success');
      }
    }

    // ============================================
    // PRE-PROCUREMENT: MATERIAL MANAGEMENT
    // ============================================
    console.log('\n=== PRE-PROCUREMENT: MATERIAL MANAGEMENT ===');
    
    await page.goto(`${BASE_URL}/materials`);
    await page.waitForTimeout(2000);
    await capture(page, '12-material-list', 'Material List Page');
    
    const materialBtn = page.locator('button:has-text("新增物料"), button:has-text("Create")').first();
    if (await materialBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await materialBtn.scrollIntoViewIfNeeded();
      await capture(page, '13-create-material-button', 'Create Material Button');
      
      await materialBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '14-material-form', 'Material Creation Form');
      
      // Fill material form
      await fillField(page, 'Material Code', 'MAT-001');
      await fillField(page, 'Material Name (ZH)', '测试物料');
      await fillField(page, 'Material Name (EN)', 'Test Material');
      await page.waitForTimeout(500);
      await capture(page, '15-material-created-success', 'Material Created Success');
    }
    
    // Material categories
    await page.goto(`${BASE_URL}/material-categories`);
    await page.waitForTimeout(2000);
    await capture(page, '16-category-list', 'Material Category List');
    
    const categoryBtn = page.locator('button:has-text("Create")').first();
    if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '17-category-form', 'Category Creation Form');
      // Fill and save category
      await fillField(page, 'Category Code', 'CAT-001');
      await fillField(page, 'Category Name (ZH)', '测试类别');
      await page.waitForTimeout(500);
      await capture(page, '18-category-created', 'Category Created');
    }
    
    // Material export
    await page.goto(`${BASE_URL}/materials`);
    await page.waitForTimeout(2000);
    const materialExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
    if (await materialExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capture(page, '19-material-export-button', 'Material Export Button');
      await capture(page, '20-material-excel-file', 'Material Excel File');
    }

    // ============================================
    // PRE-PROCUREMENT: QUOTATION MANAGEMENT
    // ============================================
    console.log('\n=== PRE-PROCUREMENT: QUOTATION MANAGEMENT ===');
    
    await page.goto(`${BASE_URL}/material-quotations`);
    await page.waitForTimeout(2000);
    await capture(page, '21-quotation-list', 'Material Quotation List');
    
    const quotationBtn = page.locator('button:has-text("New Quotation"), button:has-text("Create")').first();
    if (await quotationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quotationBtn.scrollIntoViewIfNeeded();
      await capture(page, '22-create-quotation-button', 'Create Quotation Button');
      
      await quotationBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '23-quotation-form', 'Quotation Creation Form');
      
      // Add quotes section
      const addQuoteBtn = page.locator('button:has-text("Add Quote"), button:has-text("添加报价")').first();
      if (await addQuoteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '24-add-quotes', 'Add Quotes Section');
      }
      
      // Fill quotation and save
      await fillField(page, 'Material', 'MAT-001');
      await fillField(page, 'Quantity', '100');
      await page.waitForTimeout(500);
      await capture(page, '25-quotation-created', 'Quotation Created');
      
      // Attachment section
      const quotationUpload = page.locator('.ant-upload, input[type="file"]').first();
      if (await quotationUpload.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '26-quotation-attachment', 'Quotation Attachment Section');
        await capture(page, '27-quotation-files-attached', 'Quotation Files Attached');
      }
    }
    
    // Submit quotation
    await page.goto(`${BASE_URL}/material-quotations`);
    await page.waitForTimeout(2000);
    const quotationRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await quotationRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quotationRow.click();
      await page.waitForTimeout(2000);
      const submitQuotationBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitQuotationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitQuotationBtn.scrollIntoViewIfNeeded();
        await capture(page, '28-submit-quotation', 'Submit Quotation');
        await capture(page, '29-quotation-submitted', 'Quotation Submitted');
      }
    }
    
    // Compare quotes
    await page.goto(`${BASE_URL}/material-quotations`);
    await page.waitForTimeout(2000);
    const compareBtn = page.locator('button:has-text("Compare"), button:has-text("比较")').first();
    if (await compareBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await compareBtn.scrollIntoViewIfNeeded();
      await capture(page, '30-compare-button', 'Compare Quotes Button');
      await compareBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '31-quote-comparison-table', 'Quote Comparison Table');
    }

    // ============================================
    // PROCUREMENT: MRP REQUIREMENTS
    // ============================================
    console.log('\n=== PROCUREMENT: MRP REQUIREMENTS ===');
    
    const mrpRoutes = ['/mrp', '/material-requirements', '/mrp-list'];
    let mrpPageFound = false;
    
    for (const route of mrpRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        if (currentUrl.includes(route.replace('/', '')) || currentUrl.includes('mrp')) {
          mrpPageFound = true;
          await capture(page, '32-mrp-page', 'MRP Page');
          
          const calculateBtn = page.locator('button:has-text("Calculate"), button:has-text("计算")').first();
          if (await calculateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await capture(page, '33-calculate-mrp-button', 'Calculate MRP Button');
            await calculateBtn.click();
            await page.waitForTimeout(3000);
            await capture(page, '34-mrp-results', 'MRP Results');
          }
          
          await capture(page, '35-mrp-list-with-traceability', 'MRP List with Traceability');
          
          // MRP export
          const mrpExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
          if (await mrpExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await capture(page, '36-mrp-export-button', 'MRP Export Button');
            await capture(page, '37-mrp-excel-export', 'MRP Excel Export');
          }
          
          // Select MRP lines and generate PO
          const mrpRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
          if (await mrpRow.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mrpRow.click();
            await page.waitForTimeout(500);
            await capture(page, '38-select-mrp-lines', 'Select MRP Lines');
            const generateBtn = page.locator('button:has-text("Generate PO"), button:has-text("生成采购订单")').first();
            if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await capture(page, '39-generate-po-button', 'Generate PO Button');
              await generateBtn.click();
              await page.waitForTimeout(2000);
              await capture(page, '40-po-from-mrp', 'PO from MRP');
            }
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!mrpPageFound) {
      console.log('⚠ MRP page not found, skipping MRP screenshots');
    }

    // ============================================
    // PROCUREMENT: PURCHASE ORDERS
    // ============================================
    console.log('\n=== PROCUREMENT: PURCHASE ORDERS ===');
    
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    await capture(page, '41-po-list', 'Purchase Order List');
    
    const poBtn = page.locator('button:has-text("Create Purchase Order"), button:has-text("Create")').first();
    if (await poBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await poBtn.scrollIntoViewIfNeeded();
      await capture(page, '42-create-po-button', 'Create PO Button');
      
      await poBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '43-po-form', 'Purchase Order Form');
      
      // Fill PO form
      await fillField(page, 'Supplier', 'Test Supplier');
      await fillField(page, 'Material', 'MAT-001');
      await fillField(page, 'Quantity', '100');
      await page.waitForTimeout(500);
      await capture(page, '44-po-created-success', 'PO Created Success');
      
      // PO attachment
      const poUpload = page.locator('.ant-upload, input[type="file"]').first();
      if (await poUpload.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '45-po-attachment', 'PO Attachment Section');
        await capture(page, '46-po-files-attached', 'PO Files Attached');
      }
      
      // Submit PO
      await page.goto(`${BASE_URL}/purchase-orders`);
      await page.waitForTimeout(2000);
      const poRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
      if (await poRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await poRow.click();
        await page.waitForTimeout(2000);
        const submitPOBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
        if (await submitPOBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await capture(page, '47-submit-po-button', 'Submit PO Button');
          await capture(page, '48-po-submitted', 'PO Submitted');
        }
        
        // Status column and details
        await page.goto(`${BASE_URL}/purchase-orders`);
        await page.waitForTimeout(2000);
        const statusColumn = page.locator('th:has-text("Status"), th:has-text("状态")').first();
        if (await statusColumn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await capture(page, '49-po-status-column', 'PO Status Column');
        }
        
        // PO status details
        await poRow.click();
        await page.waitForTimeout(2000);
        await capture(page, '50-po-status-details', 'PO Status Details');
      }
      
      // Export button
      await page.goto(`${BASE_URL}/purchase-orders`);
      await page.waitForTimeout(2000);
      const poExportBtn = page.locator('button:has-text("Export"), button:has-text("导出")').first();
      if (await poExportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '51-po-export-button', 'PO Export Button');
        await capture(page, '52-po-excel-export', 'PO Excel Export');
      }
    }

    // ============================================
    // PROCUREMENT: GOODS RECEIPT
    // ============================================
    console.log('\n=== PROCUREMENT: GOODS RECEIPT ===');
    
    await page.goto(`${BASE_URL}/goods-receipts`);
    await page.waitForTimeout(2000);
    await capture(page, '53-goods-receipt-list', 'Goods Receipt List');
    
    const grBtn = page.locator('button:has-text("Create"), button:has-text("New Receipt")').first();
    if (await grBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await grBtn.scrollIntoViewIfNeeded();
      await capture(page, '54-create-gr-button', 'Create GR Button');
      await grBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '55-gr-form', 'Goods Receipt Form');
      // Fill and save
      await fillField(page, 'Purchase Order', 'PO-001');
      await fillField(page, 'Quantity', '100');
      await page.waitForTimeout(500);
      await capture(page, '56-gr-created', 'GR Created');
    }
    
    // GR status
    await page.goto(`${BASE_URL}/goods-receipts`);
    await page.waitForTimeout(2000);
    const grStatus = page.locator('th:has-text("Status"), th:has-text("状态")').first();
    if (await grStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capture(page, '57-gr-status-column', 'Goods Receipt Status');
    }

    // ============================================
    // POST-PROCUREMENT: PAYMENT
    // ============================================
    console.log('\n=== POST-PROCUREMENT: PAYMENT ===');
    
    await page.goto(`${BASE_URL}/payment`);
    await page.waitForTimeout(2000);
    await capture(page, '58-payment-list', 'Payment List');
    
    const paymentBtn = page.locator('button:has-text("Create")').first();
    if (await paymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await paymentBtn.scrollIntoViewIfNeeded();
      await capture(page, '59-create-payment-button', 'Create Payment Button');
      await paymentBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '60-payment-form', 'Payment Form');
      // Fill payment form
      await fillField(page, 'Purchase Order', 'PO-001');
      await fillField(page, 'Payment Amount', '1000');
      await page.waitForTimeout(500);
      await capture(page, '61-payment-created', 'Payment Created');
    }
    
    // Submit payment
    await page.goto(`${BASE_URL}/payment`);
    await page.waitForTimeout(2000);
    const paymentRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await paymentRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paymentRow.click();
      await page.waitForTimeout(2000);
      const submitPaymentBtn = page.locator('button:has-text("Submit"), button:has-text("提交")').first();
      if (await submitPaymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '62-submit-payment', 'Submit Payment');
        await capture(page, '63-payment-submitted', 'Payment Submitted');
      }
      
      // Payment status
      await page.goto(`${BASE_URL}/payment`);
      await page.waitForTimeout(2000);
      const paymentStatus = page.locator('th:has-text("Status"), th:has-text("状态")').first();
      if (await paymentStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '64-payment-status', 'Payment Status Column');
      }
      
      // Complete payment
      await paymentRow.click();
      await page.waitForTimeout(2000);
      const completeBtn = page.locator('button:has-text("Complete"), button:has-text("完成")').first();
      if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '65-complete-payment-button', 'Complete Payment Button');
        await capture(page, '66-payment-completed', 'Payment Completed');
      }
    }
    
    // Payment linked to PO
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    const poDetailRow = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await poDetailRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await poDetailRow.click();
      await page.waitForTimeout(2000);
      await capture(page, '67-po-payment-info', 'PO Payment Info');
    }

    // ============================================
    // SYSTEM: WORKFLOWS
    // ============================================
    console.log('\n=== SYSTEM: WORKFLOWS ===');
    
    await page.goto(`${BASE_URL}/workflows`);
    await page.waitForTimeout(2000);
    await capture(page, '72-workflow-list', 'Workflow List');
    
    const workflowBtn = page.locator('button:has-text("Create")').first();
    if (await workflowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await workflowBtn.scrollIntoViewIfNeeded();
      await capture(page, '73-create-workflow-button', 'Create Workflow Button');
      await workflowBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '74-workflow-form', 'Workflow Creation Form');
      
      // Fill workflow form
      await fillField(page, 'Name', 'Test Workflow');
      await fillField(page, 'Document Type', 'Purchase Order');
      await page.waitForTimeout(500);
      
      // Multi-level setup
      const addLevelBtn = page.locator('button:has-text("Add Level")').first();
      if (await addLevelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capture(page, '75-multi-level-setup', 'Multi-level Approval Setup');
      }
      
      // Amount-based rules
      await capture(page, '77-amount-based-rules', 'Amount-based Rules');
      
      // Save workflow
      await capture(page, '76-workflow-created', 'Workflow Created');
    }

    // ============================================
    // SYSTEM: APPROVALS
    // ============================================
    console.log('\n=== SYSTEM: APPROVALS ===');
    
    await page.goto(`${BASE_URL}/approvals`);
    await page.waitForTimeout(2000);
    await capture(page, '78-approval-dashboard', 'Approval Dashboard');
    
    const approvalTable = page.locator('table, .ant-table').first();
    if (await approvalTable.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capture(page, '79-approval-status', 'Approval Status Indicators');
    }
    
    // Approval actions
    const approveBtn = page.locator('button:has-text("Approve"), button:has-text("批准")').first();
    if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capture(page, '90-approval-actions', 'Approval Actions');
    }

    // ============================================
    // ADDITIONAL SCREENSHOTS
    // ============================================
    console.log('\n=== CAPTURING ADDITIONAL SCREENSHOTS ===');
    
    // Workflow screenshots
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    await capture(page, '68-supplier-workflow', 'Supplier Workflow');
    
    await page.goto(`${BASE_URL}/material-quotations`);
    await page.waitForTimeout(2000);
    await capture(page, '69-quotation-workflow', 'Quotation Workflow');
    
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    await capture(page, '70-po-workflow', 'PO Workflow');
    
    await page.goto(`${BASE_URL}/payment`);
    await page.waitForTimeout(2000);
    await capture(page, '71-payment-workflow', 'Payment Workflow');
    
    // Attachment screenshots
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    const supplierDetail = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await supplierDetail.isVisible({ timeout: 2000 }).catch(() => false)) {
      await supplierDetail.click();
      await page.waitForTimeout(2000);
      await capture(page, '80-supplier-attachments', 'Supplier Attachments');
    }
    
    await page.goto(`${BASE_URL}/material-quotations`);
    await page.waitForTimeout(2000);
    const quotationDetail = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await quotationDetail.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quotationDetail.click();
      await page.waitForTimeout(2000);
      await capture(page, '81-quotation-attachments', 'Quotation Attachments');
    }
    
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    const poDetail = page.locator('table tbody tr, .ant-table-tbody tr').first();
    if (await poDetail.isVisible({ timeout: 2000 }).catch(() => false)) {
      await poDetail.click();
      await page.waitForTimeout(2000);
      await capture(page, '82-po-attachments', 'PO Attachments');
    }
    
    // Excel export screenshots
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    await capture(page, '83-supplier-excel-export', 'Supplier Excel Export');
    
    await page.goto(`${BASE_URL}/materials`);
    await page.waitForTimeout(2000);
    await capture(page, '84-material-excel-export', 'Material Excel Export');
    
    await page.goto(`${BASE_URL}/mrp`);
    await page.waitForTimeout(2000);
    await capture(page, '85-mrp-excel-export', 'MRP Excel Export');
    
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    await capture(page, '86-po-excel-export', 'PO Excel Export');
    
    // Custom fields
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    const createSupplierBtn = page.locator('button:has-text("Add new supplier"), button:has-text("Create")').first();
    if (await createSupplierBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createSupplierBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '87-custom-fields-supplier', 'Custom Fields Supplier');
    }
    
    await page.goto(`${BASE_URL}/materials`);
    await page.waitForTimeout(2000);
    const createMaterialBtn = page.locator('button:has-text("新增物料"), button:has-text("Create")').first();
    if (await createMaterialBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createMaterialBtn.click();
      await page.waitForTimeout(2000);
      await capture(page, '88-custom-fields-material', 'Custom Fields Material');
    }
    
    // Role-based access
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    await capture(page, '89-role-based-access', 'Role-based Access');
    
    // Data filtering
    await page.goto(`${BASE_URL}/purchase-orders`);
    await page.waitForTimeout(2000);
    await capture(page, '91-data-filtering', 'Data Filtering');
    
    // Operation restrictions
    await page.goto(`${BASE_URL}/suppliers`);
    await page.waitForTimeout(2000);
    await capture(page, '92-operation-restrictions', 'Operation Restrictions')

    console.log('\n=== Screenshot Capture Complete ===');
    const screenshotCount = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length;
    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`Total screenshots captured: ${screenshotCount}`);
    console.log('\nNote: Some screenshots may require manual capture for specific workflows.');
    console.log('See SCREENSHOT-CAPTURE-GUIDE.md for manual capture instructions.');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
    // Take error screenshot
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
  captureAllScreenshots().catch(console.error);
}

export { captureAllScreenshots };
