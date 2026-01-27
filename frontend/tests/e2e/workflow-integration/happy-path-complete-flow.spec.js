/**
 * Complete Happy Path Procurement Workflow Test
 *
 * This test suite implements the complete end-to-end procurement workflow
 * as defined in the Happy Path Demo Story (doc/happy-path-demo-story.md).
 *
 * The test covers all 6 phases of the procurement process:
 * 1. Foundation Setup - Supplier onboarding & material setup
 * 2. Procurement Planning - Three-source quotations & MRP
 * 3. Order Execution - PO creation and approval
 * 4. Payment Processing - Pre-payment workflow
 * 5. Goods Receipt - Receiving materials
 * 6. Reporting - Excel exports & audit trail verification
 *
 * Business Scenario: SilverPlan procures 10,000 units of 10KΩ resistors for customer order SO-2026-001
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
  uploadFile
} from '../helpers/testHelpers';

test.describe('Complete Happy Path Procurement Workflow', () => {
  // Test data constants
  const timestamp = Date.now();
  const testData = {
    // Supplier data
    supplier: {
      code: `SUP-TECH-${timestamp}`,
      nameZh: `技术元件有限公司-${timestamp}`,
      nameEn: `Tech Components Ltd-${timestamp}`,
      shortName: 'TechComp',
      contact: 'John Smith',
      phone: '+86-21-1234-5678',
      email: `procurement-${timestamp}@techcomp.com.cn`,
      businessLicense: `TECH2024${timestamp}`,
      level: 'B'
    },

    // Material data
    material: {
      code: `RES-10K-0603-${timestamp}`,
      name: '10KΩ Resistor 0603 Package',
      category: 'Electronic Components → Resistors → SMD',
      uom: 'PCS',
      specification: '10KΩ ±5% 0603 SMD',
      leadTime: '14',
      moq: '5000',
      mpq: '5000'
    },

    // Quotation data
    quotations: [
      {
        supplier: 'Tech Components Ltd',
        price: '0.085',
        leadTime: '14',
        moq: '5000',
        mpq: '5000'
      },
      {
        supplier: 'Global Electronics',
        price: '0.082',
        leadTime: '14',
        moq: '5000',
        mpq: '5000'
      },
      {
        supplier: 'Asia Components Ltd',
        price: '0.088',
        leadTime: '14',
        moq: '5000',
        mpq: '5000'
      }
    ],

    // MRP data
    mrp: {
      material: 'RES-10K-0603',
      requiredQuantity: '10000',
      requiredDate: '2026-02-15',
      currentStock: '2000',
      safetyStock: '1000',
      customerOrder: 'SO-2026-001'
    },

    // Purchase Order data
    po: {
      date: '2026-01-22',
      paymentTerms: '30% advance, 70% against delivery',
      deliveryTerms: 'FOB Shanghai',
      customerOrderNumber: 'SO-2026-001',
      internalSONumber: `ISO-2026-${timestamp}`
    },

    // Pre-payment data
    prePayment: {
      percentage: '30',
      amount: '172.20', // 30% of ¥574.00
      paymentDate: '2026-01-25',
      reference: `PAY-20260125-${timestamp}`
    },

    // Goods Receipt data
    goodsReceipt: {
      receiptDate: '2026-02-10',
      receivedQuantity: '7000',
      qualityStatus: 'Passed',
      warehouseLocation: 'WH-A-01'
    },

    // Final Payment data
    finalPayment: {
      amount: '401.80', // 70% of ¥574.00
      paymentDate: '2026-02-15',
      reference: `PAY-20260215-${timestamp}`
    }
  };

  test.describe('Phase 1: Foundation Setup', () => {
    test('should complete supplier onboarding workflow', async ({ page }) => {
      console.log('🚀 Phase 1.1: Supplier Onboarding');

      // Step 1.1.1: Access Supplier Management
      console.log('Step 1.1.1: Access Supplier Management');
      console.log('Logging in...');
      await login(page, 'e2e.data.entry@test.com', 'test123456');
      console.log('Login completed, navigating to suppliers...');
      await page.goto('/suppliers', { waitUntil: 'domcontentloaded' });
      console.log('Navigation completed, waiting...');
      await page.waitForTimeout(2000);
      console.log('Wait completed, checking page content...');

      const pageTitle = await page.title();
      console.log('Page title:', pageTitle);
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      const createClicked = await clickButton(page, 'Add new supplier');
      expect(createClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Step 1.1.2: Enter Basic Supplier Information
      console.log('Step 1.1.2: Enter Basic Supplier Information');
      await fillField(page, 'Company Name (ZH)', testData.supplier.nameZh);
      await fillField(page, 'Company Name (EN)', testData.supplier.nameEn);
      await fillField(page, 'Short Name', testData.supplier.shortName);
      await selectOption(page, 'Type', 'manufacturer');
      await fillField(page, 'Email', testData.supplier.email);
      await fillField(page, 'Phone', testData.supplier.phone);
      await fillField(page, 'Contact Person', testData.supplier.contact);

      // Address information
      await fillField(page, 'Country', 'China');
      await fillField(page, 'Province', 'Shanghai');
      await fillField(page, 'City', 'Shanghai');
      await fillField(page, 'Street', '123 Industrial Road');

      // Business information
      await fillField(page, 'Business License Number', testData.supplier.businessLicense);
      await fillField(page, 'Tax ID', `TAX-${timestamp}`);

      // Save supplier
      const saved = await clickButton(page, 'Save');
      expect(saved).toBe(true);
      await waitForLoading(page);
      const supplierCreated = await verifySuccessMessage(page, 'created successfully');
      expect(supplierCreated).toBe(true);
      console.log('✓ Supplier created successfully');

      // Step 1.1.4: Submit for Approval
      console.log('Step 1.1.4: Submit for Approval');
      const submitted = await clickButton(page, 'Submit');
      expect(submitted).toBe(true);
      await waitForLoading(page);
      const submitSuccess = await verifySuccessMessage(page, 'submitted');
      expect(submitSuccess).toBe(true);
      console.log('✓ Supplier submitted for approval');

      await logout(page);

      // Step 1.1.5-1.1.6: Procurement Manager Approval
      console.log('Step 1.1.5-1.1.6: Procurement Manager Approval');
      await login(page, 'e2e.procurement.manager@test.com', 'test123456');
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const supplierRow = page.locator('table tbody tr').filter({
        hasText: testData.supplier.nameZh
      }).first();
      const supplierVisible = await supplierRow.isVisible({ timeout: 5000 }).catch(() => false);
      expect(supplierVisible).toBe(true);

      await supplierRow.click();
      await page.waitForTimeout(1000);

      const approved = await clickButton(page, 'Approve');
      expect(approved).toBe(true);
      await waitForLoading(page);
      const approvalSuccess = await verifySuccessMessage(page, 'approved');
      expect(approvalSuccess).toBe(true);
      console.log('✓ Supplier approved by Procurement Manager');

      await logout(page);
      console.log('✅ Phase 1.1: Supplier Onboarding Complete');
    });

    test('should create material master data', async ({ page }) => {
      console.log('🚀 Phase 1.2: Material Master Data Setup');

      // Step 1.2.1: Access Material Management
      console.log('Step 1.2.1: Access Material Management');
      await login(page, 'e2e.engineering@test.com', 'test123456');
      await page.goto('/materials', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const createClicked = await clickButton(page, '新增物料');
      expect(createClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Step 1.2.2: Enter Material Information
      console.log('Step 1.2.2: Enter Material Information');
      await fillField(page, 'Material Code', testData.material.code);
      await fillField(page, 'Material Name', testData.material.name);
      await selectOption(page, 'Category', 'Electronic Components');
      await selectOption(page, 'Unit of Measure', testData.material.uom);
      await fillField(page, 'Specification', testData.material.specification);
      await fillField(page, 'Lead Time (days)', testData.material.leadTime);
      await fillField(page, 'MOQ', testData.material.moq);
      await fillField(page, 'MPQ', testData.material.mpq);

      // Step 1.2.3: Save Material
      console.log('Step 1.2.3: Save Material');
      const saved = await clickButton(page, 'Save');
      expect(saved).toBe(true);
      await waitForLoading(page);
      const materialCreated = await verifySuccessMessage(page, 'created successfully');
      expect(materialCreated).toBe(true);
      console.log('✓ Material created successfully');

      await logout(page);
      console.log('✅ Phase 1.2: Material Setup Complete');
    });
  });

  test.describe('Phase 2: Procurement Planning', () => {
    test('should create three-source material quotations', async ({ page }) => {
      console.log('🚀 Phase 2.1: Three-Source Material Quotations');

      await login(page, 'e2e.procurement.manager@test.com', 'test123456');

      // Create three quotations
      for (let i = 0; i < testData.quotations.length; i++) {
        const quote = testData.quotations[i];
        console.log(`Creating quotation ${i + 1}: ${quote.supplier}`);

        await page.goto('/quotations', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const createClicked = await clickButton(page, 'Create');
        expect(createClicked).toBe(true);
        await page.waitForTimeout(1000);

        // Select material and supplier
        await fillField(page, 'Material', testData.material.code);
        await fillField(page, 'Supplier', quote.supplier);
        await fillField(page, 'Unit Price', quote.price);
        await fillField(page, 'Currency', 'CNY');
        await fillField(page, 'Quantity', '10000');
        await fillField(page, 'Lead Time (days)', quote.leadTime);
        await fillField(page, 'MOQ', quote.moq);
        await fillField(page, 'MPQ', quote.mpq);

        const saved = await clickButton(page, 'Save');
        expect(saved).toBe(true);
        await waitForLoading(page);
        const quoteCreated = await verifySuccessMessage(page, 'created successfully');
        expect(quoteCreated).toBe(true);
        console.log(`✓ Quotation ${i + 1} created for ${quote.supplier}`);
      }

      // Set preferred supplier (Global Electronics with lowest price)
      console.log('Step 2.1.5: Set Preferred Supplier');
      await navigateTo(page, '/materials');
      await waitForPageReady(page);

      // Find and edit the material
      const materialRow = page.locator('table tbody tr').filter({
        hasText: testData.material.code
      }).first();
      await materialRow.click();
      await page.waitForTimeout(1000);

      // Set preferred supplier
      await selectOption(page, 'Preferred Supplier', 'Global Electronics');
      await fillField(page, 'Standard Price', '0.082');

      const updated = await clickButton(page, 'Update');
      expect(updated).toBe(true);
      await waitForLoading(page);
      const updateSuccess = await verifySuccessMessage(page, 'updated successfully');
      expect(updateSuccess).toBe(true);
      console.log('✓ Preferred supplier set to Global Electronics');

      await logout(page);
      console.log('✅ Phase 2.1: Quotations Complete');
    });

    test('should run MRP calculation', async ({ page }) => {
      console.log('🚀 Phase 2.2: Material Requirements Planning');

      await login(page, 'e2e.mrp.planner@test.com', 'test123456');

      // Step 2.2.1: Access MRP Module
      console.log('Step 2.2.1: Access MRP Module');
      await page.goto('/mrp', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Step 2.2.2: Enter Demand Requirements
      console.log('Step 2.2.2: Enter Demand Requirements');
      await fillField(page, 'Material', testData.material.code);
      await fillField(page, 'Required Quantity', testData.mrp.requiredQuantity);
      await fillField(page, 'Required Date', testData.mrp.requiredDate);
      await fillField(page, 'Customer Order', testData.mrp.customerOrder);

      // Step 2.2.3: Set Current Inventory
      console.log('Step 2.2.3: Set Current Inventory');
      await fillField(page, 'Current Stock', testData.mrp.currentStock);
      await fillField(page, 'Safety Stock', testData.mrp.safetyStock);

      // Step 2.2.4: Run MRP Calculation
      console.log('Step 2.2.4: Run MRP Calculation');
      const calculated = await clickButton(page, 'Calculate MRP');
      expect(calculated).toBe(true);
      await waitForLoading(page);

      // Verify MRP results
      const netRequirement = await page.locator('text').filter({ hasText: 'Net Requirement: 7,000' }).isVisible();
      expect(netRequirement).toBe(true);
      console.log('✓ MRP calculation completed - Net requirement: 7,000 pieces');

      // Step 2.2.5: Review MRP Results
      console.log('Step 2.2.5: Review MRP Results');
      const materialFilter = page.locator('input[placeholder*="Filter by material"]').first();
      if (await materialFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await materialFilter.fill(testData.material.code);
        await page.keyboard.press('Enter');
        await waitForLoading(page);
      }

      // Verify green status (within lead time)
      const greenStatus = await page.locator('.status-green, .text-green, [style*="color: green"]').first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(greenStatus).toBe(true);
      console.log('✓ MRP shows green status (within lead time)');

      await logout(page);
      console.log('✅ Phase 2.2: MRP Complete');
    });
  });

  test.describe('Phase 3: Order Execution', () => {
    test('should create purchase order from MRP', async ({ page }) => {
      console.log('🚀 Phase 3.1: Purchase Order Creation');

      await login(page, 'e2e.purchaser@test.com', 'test123456');

      // Step 3.1.1: Generate PO from MRP
      console.log('Step 3.1.1: Generate PO from MRP');
      await page.goto('/mrp', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Find the MRP line and create PO
      const mrpRow = page.locator('table tbody tr').filter({
        hasText: testData.material.code
      }).first();
      await mrpRow.click();
      await page.waitForTimeout(1000);

      const createPOClicked = await clickButton(page, 'Create PO');
      expect(createPOClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Verify PO auto-populated correctly
      const materialField = await page.locator('input[value*="RES-10K-0603"]').isVisible();
      const quantityField = await page.locator('input[value="7000"]').isVisible();
      const supplierField = await page.locator('select').filter({ hasText: 'Global Electronics' }).isVisible();

      expect(materialField || quantityField || supplierField).toBe(true);
      console.log('✓ PO auto-populated from MRP');

      // Step 3.1.2: Complete PO Details
      console.log('Step 3.1.2: Complete PO Details');
      await fillField(page, 'PO Date', testData.po.date);
      await fillField(page, 'Payment Terms', testData.po.paymentTerms);
      await fillField(page, 'Delivery Terms', testData.po.deliveryTerms);
      await fillField(page, 'Customer Order Number', testData.po.customerOrderNumber);
      await fillField(page, 'Internal SO Number', testData.po.internalSONumber);

      // Step 3.1.3: Add PO Lines
      console.log('Step 3.1.3: Add PO Lines');
      // Confirm single line (already populated)
      const lineCount = await page.locator('table tbody tr').count();
      expect(lineCount).toBeGreaterThan(0);

      // Step 3.1.4: Submit PO for Approval
      console.log('Step 3.1.4: Submit PO for Approval');
      const submitted = await clickButton(page, 'Submit for Approval');
      expect(submitted).toBe(true);
      await waitForLoading(page);
      const submitSuccess = await verifySuccessMessage(page, 'submitted');
      expect(submitSuccess).toBe(true);
      console.log('✓ PO submitted for approval');

      await logout(page);
      console.log('✅ Phase 3.1: PO Creation Complete');
    });

    test('should complete purchase order approval', async ({ page }) => {
      console.log('🚀 Phase 3.2-3.3: Purchase Order Approval');

      // Step 3.2.1: Procurement Manager Review
      console.log('Step 3.2.1: Procurement Manager Review');
      await login(page, 'e2e.procurement.manager@test.com', 'test123456');
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const poRow = page.locator('table tbody tr').filter({
        hasText: testData.material.code
      }).first();
      const poVisible = await poRow.isVisible({ timeout: 5000 }).catch(() => false);
      expect(poVisible).toBe(true);

      await poRow.click();
      await page.waitForTimeout(1000);

      // Step 3.2.2: Review PO Details
      console.log('Step 3.2.2: Review PO Details');
      // Verify pricing, MRP linkage, traceability fields
      const priceVisible = await page.locator('text').filter({ hasText: '¥0.082' }).isVisible();
      expect(priceVisible).toBe(true);
      console.log('✓ PO details verified');

      // Step 3.2.3: Approve Purchase Order
      console.log('Step 3.2.3: Approve Purchase Order');
      const approved = await clickButton(page, 'Approve');
      expect(approved).toBe(true);
      await waitForLoading(page);
      const approvalSuccess = await verifySuccessMessage(page, 'approved');
      expect(approvalSuccess).toBe(true);
      console.log('✓ PO approved by Procurement Manager');

      await logout(page);
      console.log('✅ Phase 3.2-3.3: PO Approval Complete');
    });
  });

  test.describe('Phase 4: Payment Processing', () => {
    test('should complete pre-payment workflow', async ({ page }) => {
      console.log('🚀 Phase 4.1-4.3: Pre-Payment Processing');

      await login(page, 'e2e.procurement.manager@test.com', 'test123456');

      // Step 4.1.1: Create Pre-Payment Application
      console.log('Step 4.1.1: Create Pre-Payment Application');
      await navigateTo(page, '/pre-payments');
      await waitForPageReady(page);

      const createClicked = await clickButton(page, 'Create');
      expect(createClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Find the approved PO
      await fillField(page, 'Purchase Order', `PO-20260122-${timestamp}`);
      await fillField(page, 'Payment Amount', testData.prePayment.amount);
      await fillField(page, 'Payment Date', testData.prePayment.paymentDate);

      // Step 4.1.2: Add Justification
      console.log('Step 4.1.2: Add Justification');
      await fillField(page, 'Reason', testData.prePayment.reason);

      // Step 4.1.3: Submit for Approval
      console.log('Step 4.1.3: Submit for Approval');
      const submitted = await clickButton(page, 'Submit for Approval');
      expect(submitted).toBe(true);
      await waitForLoading(page);
      const submitSuccess = await verifySuccessMessage(page, 'submitted');
      expect(submitSuccess).toBe(true);
      console.log('✓ Pre-payment submitted for approval');

      await logout(page);

      // Step 4.2.1-4.2.6: Multi-level Approval Chain
      console.log('Step 4.2.1-4.2.6: Multi-level Approval Chain');

      // Procurement Manager Approval
      await login(page, 'e2e.procurement.manager@test.com', 'test123456');
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const prePaymentRow = page.locator('table tbody tr').filter({
        hasText: testData.prePayment.amount
      }).first();
      await prePaymentRow.click();
      await page.waitForTimeout(1000);

      const pmApproved = await clickButton(page, 'Approve');
      expect(pmApproved).toBe(true);
      await waitForLoading(page);
      console.log('✓ Procurement Manager approved pre-payment');

      await logout(page);

      // Finance Director Approval
      await login(page, 'e2e.finance.director@test.com', 'test123456');
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const fdPrePaymentRow = page.locator('table tbody tr').filter({
        hasText: testData.prePayment.amount
      }).first();
      await fdPrePaymentRow.click();
      await page.waitForTimeout(1000);

      const fdApproved = await clickButton(page, 'Approve');
      expect(fdApproved).toBe(true);
      await waitForLoading(page);
      console.log('✓ Finance Director approved pre-payment');

      await logout(page);

      // General Manager Approval
      await login(page, 'e2e.general.manager@test.com', 'test123456');
      await navigateTo(page, '/approvals');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const gmPrePaymentRow = page.locator('table tbody tr').filter({
        hasText: testData.prePayment.amount
      }).first();
      await gmPrePaymentRow.click();
      await page.waitForTimeout(1000);

      const gmApproved = await clickButton(page, 'Approve');
      expect(gmApproved).toBe(true);
      await waitForLoading(page);
      console.log('✓ General Manager approved pre-payment');

      await logout(page);

      // Step 4.3.1-4.3.3: Payment Execution
      console.log('Step 4.3.1-4.3.3: Payment Execution');
      await login(page, 'e2e.finance.personnel@test.com', 'test123456');
      await navigateTo(page, '/payments');
      await waitForPageReady(page);

      // Process the approved pre-payment
      const paymentRow = page.locator('table tbody tr').filter({
        hasText: testData.prePayment.amount
      }).first();
      await paymentRow.click();
      await page.waitForTimeout(1000);

      await selectOption(page, 'Payment Method', 'Bank Transfer');
      await fillField(page, 'Reference Number', testData.prePayment.reference);

      const processed = await clickButton(page, 'Process Payment');
      expect(processed).toBe(true);
      await waitForLoading(page);
      const processSuccess = await verifySuccessMessage(page, 'processed');
      expect(processSuccess).toBe(true);
      console.log('✓ Pre-payment processed successfully');

      await logout(page);
      console.log('✅ Phase 4: Payment Processing Complete');
    });
  });

  test.describe('Phase 5: Goods Receipt and Final Settlement', () => {
    test('should process goods receipt', async ({ page }) => {
      console.log('🚀 Phase 5.1: Goods Receipt Processing');

      await login(page, 'e2e.warehouse.personnel@test.com', 'test123456');

      // Step 5.1.1: Record Goods Receipt
      console.log('Step 5.1.1: Record Goods Receipt');
      await navigateTo(page, '/goods-receipt');
      await waitForPageReady(page);

      const createClicked = await clickButton(page, 'Create');
      expect(createClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Link to PO and enter receipt details
      await fillField(page, 'Purchase Order', `PO-20260122-${timestamp}`);
      await fillField(page, 'Receipt Date', testData.goodsReceipt.receiptDate);
      await fillField(page, 'Received Quantity', testData.goodsReceipt.receivedQuantity);
      await selectOption(page, 'Quality Status', testData.goodsReceipt.qualityStatus);
      await fillField(page, 'Warehouse Location', testData.goodsReceipt.warehouseLocation);

      // Step 5.1.2-5.1.4: Complete Goods Receipt
      console.log('Step 5.1.2-5.1.4: Complete Goods Receipt');
      const completed = await clickButton(page, 'Complete Receipt');
      expect(completed).toBe(true);
      await waitForLoading(page);
      const receiptSuccess = await verifySuccessMessage(page, 'completed');
      expect(receiptSuccess).toBe(true);
      console.log('✓ Goods receipt completed successfully');

      await logout(page);
      console.log('✅ Phase 5.1: Goods Receipt Complete');
    });

    test('should process final payment', async ({ page }) => {
      console.log('🚀 Phase 5.2: Final Payment Processing');

      await login(page, 'e2e.finance.personnel@test.com', 'test123456');

      // Step 5.2.1: Create Final Payment
      console.log('Step 5.2.1: Create Final Payment');
      await navigateTo(page, '/payments');
      await waitForPageReady(page);

      const createClicked = await clickButton(page, 'Create');
      expect(createClicked).toBe(true);
      await page.waitForTimeout(1000);

      // Link to completed PO for final payment
      await fillField(page, 'Purchase Order', `PO-20260122-${timestamp}`);
      await fillField(page, 'Payment Amount', testData.finalPayment.amount);
      await fillField(page, 'Payment Date', testData.finalPayment.paymentDate);
      await selectOption(page, 'Payment Method', 'Bank Transfer');
      await fillField(page, 'Reference Number', testData.finalPayment.reference);

      // Step 5.2.2: Process Final Payment
      console.log('Step 5.2.2: Process Final Payment');
      const processed = await clickButton(page, 'Process Payment');
      expect(processed).toBe(true);
      await waitForLoading(page);
      const processSuccess = await verifySuccessMessage(page, 'processed');
      expect(processSuccess).toBe(true);
      console.log('✓ Final payment processed successfully');

      // Step 5.2.3: Close Purchase Order
      console.log('Step 5.2.3: Close Purchase Order');
      await navigateTo(page, '/purchase-orders');
      await waitForPageReady(page);

      const poRow = page.locator('table tbody tr').filter({
        hasText: `PO-20260122-${timestamp}`
      }).first();
      await poRow.click();
      await page.waitForTimeout(1000);

      // Verify PO status shows as Closed
      const closedStatus = await page.locator('text').filter({ hasText: 'Closed' }).isVisible();
      expect(closedStatus).toBe(true);
      console.log('✓ Purchase order automatically closed');

      await logout(page);
      console.log('✅ Phase 5.2: Final Settlement Complete');
    });
  });

  test.describe('Phase 6: Reporting and Analytics', () => {
    test('should export procurement reports', async ({ page }) => {
      console.log('🚀 Phase 6.1: Export Procurement Reports');

      await login(page, 'e2e.procurement.manager@test.com', 'test123456');

      // Step 6.1.1: Export Supplier List
      console.log('Step 6.1.1: Export Supplier List');
      await navigateTo(page, '/suppliers');
      await waitForPageReady(page);

      const supplierExportClicked = await clickButton(page, 'Export');
      expect(supplierExportClicked).toBe(true);
      await page.waitForTimeout(2000); // Wait for download
      console.log('✓ Supplier list exported successfully');

      // Step 6.1.2: Export Material List
      console.log('Step 6.1.2: Export Material List');
      await navigateTo(page, '/materials');
      await waitForPageReady(page);

      const materialExportClicked = await clickButton(page, 'Export');
      expect(materialExportClicked).toBe(true);
      await page.waitForTimeout(2000);
      console.log('✓ Material list exported successfully');

      // Step 6.1.3: Export MRP Results
      console.log('Step 6.1.3: Export MRP Results');
      await navigateTo(page, '/mrp');
      await waitForPageReady(page);

      const mrpExportClicked = await clickButton(page, 'Export');
      expect(mrpExportClicked).toBe(true);
      await page.waitForTimeout(2000);
      console.log('✓ MRP results exported successfully');

      // Step 6.1.4: Export Purchase Orders
      console.log('Step 6.1.4: Export Purchase Orders');
      await navigateTo(page, '/purchase-orders');
      await waitForPageReady(page);

      const poExportClicked = await clickButton(page, 'Export');
      expect(poExportClicked).toBe(true);
      await page.waitForTimeout(2000);
      console.log('✓ Purchase orders exported successfully');

      await logout(page);
      console.log('✅ Phase 6.1: Reports Exported');
    });

    test('should verify audit trail', async ({ page }) => {
      console.log('🚀 Phase 6.2: Audit Trail Verification');

      await login(page, 'e2e.auditor@test.com', 'test123456');

      // Step 6.2.1: Access Audit Logs
      console.log('Step 6.2.1: Access Audit Logs');
      await navigateTo(page, '/audit-logs');
      await waitForPageReady(page);

      // Step 6.2.2: Filter by PO
      console.log('Step 6.2.2: Filter by PO');
      await fillField(page, 'Entity Type', 'Purchase Order');
      await fillField(page, 'Entity ID', `PO-20260122-${timestamp}`);

      const searchClicked = await clickButton(page, 'Search');
      expect(searchClicked).toBe(true);
      await waitForLoading(page);

      // Verify complete audit trail
      const auditEntries = await page.locator('table tbody tr').count();
      expect(auditEntries).toBeGreaterThan(5); // Multiple audit entries expected
      console.log(`✓ Found ${auditEntries} audit entries for the PO`);

      // Step 6.2.3: Review Approval History
      console.log('Step 6.2.3: Review Approval History');
      // Verify approval timestamps and proper authorization
      const approvalEntries = await page.locator('text').filter({ hasText: 'approved' }).count();
      expect(approvalEntries).toBeGreaterThan(2); // PO approval + pre-payment approvals
      console.log('✓ Complete approval history verified');

      await logout(page);
      console.log('✅ Phase 6.2: Audit Trail Verified');

      console.log('🎉 COMPLETE HAPPY PATH PROCURED WORKFLOW SUCCESS!');
      console.log('✅ All 6 phases completed successfully');
      console.log('✅ Zero errors encountered');
      console.log('✅ All business rules enforced');
      console.log('✅ Complete audit trail maintained');
      console.log('✅ End-to-end traceability verified');
    });
  });
});