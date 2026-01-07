const mongoose = require('mongoose');
const GoodsReceiptService = require('../../src/services/GoodsReceiptService');
const GoodsReceipt = require('../../src/models/appModels/GoodsReceipt');
const PurchaseOrder = require('../../src/models/appModels/PurchaseOrder');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLogService = require('../../src/services/AuditLogService');

// Mock AuditLogService
jest.mock('../../src/services/AuditLogService');

describe('GoodsReceiptService', () => {
  let testAdmin;
  let testSupplier;
  let testCategory;
  let testMaterial;
  let testPO;

  // Helper function to create test data
  async function createTestData() {
    // Create test admin
    testAdmin = await Admin.create({
      email: `grs-test-${Date.now()}@test.com`,
      name: 'GRSTest',
      surname: 'Admin',
      password: 'hashedpassword123',
      enabled: true
    });

    // Create test supplier
    testSupplier = await Supplier.create({
      supplierNumber: `GRSSUP${Date.now()}`,
      companyName: { en: 'GRS Test Supplier Inc.', zh: 'GRS测试供应商' },
      contact: { 
        name: 'John Doe', 
        email: `john-${Date.now()}@grssupplier.com`,
        phone: '123-456-7890'
      },
      address: { street: '123 Main St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test category
    testCategory = await MaterialCategory.create({
      code: `GRSCAT${Date.now()}`,
      name: { en: 'GRS Test Category', zh: 'GRS测试类别' },
      description: 'Test category for GRS testing',
      level: 1,
      path: `/GRSCAT${Date.now()}`,
      createdBy: testAdmin._id
    });

    // Create test material
    testMaterial = await Material.create({
      materialNumber: `GRSMAT${Date.now()}`,
      materialName: { en: 'GRS Test Material', zh: 'GRS测试物料' },
      category: testCategory._id,
      type: 'raw',
      baseUOM: 'kg',
      specifications: { color: 'red' },
      status: 'active',
      inventory: {
        onHand: 0,
        onOrder: 100,
        available: 0,
        reserved: 0
      },
      createdBy: testAdmin._id
    });

    // Create test PO
    testPO = await PurchaseOrder.create({
      poNumber: `GRSPO-${Date.now()}`,
      supplier: testSupplier._id,
      items: [
        {
          material: testMaterial._id,
          quantity: 100,
          unitPrice: 10.50,
          uom: 'kg'
        }
      ],
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalAmount: 1050,
      status: 'approved',
      createdBy: testAdmin._id
    });
  }

  beforeEach(async () => {
    // Clean up all test data before each test
    await Promise.all([
      GoodsReceipt.deleteMany({}),
      PurchaseOrder.deleteMany({ poNumber: /^GRSPO-/ }),
      Material.deleteMany({ materialNumber: /^GRSMAT/ }),
      MaterialCategory.deleteMany({ code: /^GRSCAT/ }),
      Supplier.deleteMany({ supplierNumber: /^GRSSUP/ }),
      Admin.deleteMany({ email: /^grs-test/ })
    ]);
    
    // Recreate test data
    await createTestData();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('createGoodsReceipt', () => {
    it('should create a new goods receipt', async () => {
      const receiptData = {
        purchaseOrder: testPO._id,
        receiptDate: new Date(),
        items: [{
          material: testMaterial._id,
          materialNumber: testMaterial.materialNumber,
          orderedQuantity: 100,
          receivedQuantity: 95,
          uom: 'kg'
        }]
      };

      const receipt = await GoodsReceiptService.createGoodsReceipt(receiptData, testAdmin._id);

      expect(receipt._id).toBeDefined();
      expect(receipt.receiptNumber).toMatch(/^GR-\d{8}-\d{4}$/);
      expect(receipt.poNumber).toBe(testPO.poNumber);
      expect(receipt.supplier.toString()).toBe(testSupplier._id.toString());
      expect(AuditLogService.logCreate).toHaveBeenCalled();
    });

    it('should throw error if PO not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const receiptData = {
        purchaseOrder: fakeId,
        items: []
      };

      await expect(
        GoodsReceiptService.createGoodsReceipt(receiptData, testAdmin._id)
      ).rejects.toThrow('Purchase order not found');
    });

    it('should throw error if PO not approved', async () => {
      testPO.status = 'draft';
      await testPO.save();

      const receiptData = {
        purchaseOrder: testPO._id,
        items: []
      };

      await expect(
        GoodsReceiptService.createGoodsReceipt(receiptData, testAdmin._id)
      ).rejects.toThrow('Can only create receipts for approved purchase orders');
    });
  });

  describe('getGoodsReceipt', () => {
    it('should retrieve a goods receipt by ID', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0001',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      const result = await GoodsReceiptService.getGoodsReceipt(receipt._id);

      expect(result._id.toString()).toBe(receipt._id.toString());
      expect(result.receiptNumber).toBe('GR-20260106-0001');
    });

    it('should populate references when requested', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0002',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      const result = await GoodsReceiptService.getGoodsReceipt(receipt._id, {
        populate: ['supplier', 'purchaseOrder', 'createdBy']
      });

      expect(result.supplier.companyName).toBeDefined();
      expect(result.createdBy.email).toContain('grs-test');
    });

    it('should throw error if receipt not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        GoodsReceiptService.getGoodsReceipt(fakeId)
      ).rejects.toThrow('Goods receipt not found');
    });
  });

  describe('listGoodsReceipts', () => {
    beforeEach(async () => {
      // Create multiple receipts for testing
      await GoodsReceipt.create([
        {
          receiptNumber: 'GR-20260106-0101',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          receiptDate: new Date('2026-01-01'),
          items: [],
          status: 'draft',
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-0102',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          receiptDate: new Date('2026-01-02'),
          items: [],
          status: 'completed',
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-0103',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          receiptDate: new Date('2026-01-03'),
          items: [],
          status: 'completed',
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should list all goods receipts', async () => {
      const result = await GoodsReceiptService.listGoodsReceipts({}, { page: 1, items: 10 });

      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(3);
      expect(result.pagination.count).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await GoodsReceiptService.listGoodsReceipts(
        { status: 'completed' },
        { page: 1, items: 10 }
      );

      expect(result.result).toHaveLength(2);
      expect(result.result.every(r => r.status === 'completed')).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await GoodsReceiptService.listGoodsReceipts(
        { 
          receiptDateFrom: new Date('2026-01-02'),
          receiptDateTo: new Date('2026-01-03')
        },
        { page: 1, items: 10 }
      );

      expect(result.result.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const page1 = await GoodsReceiptService.listGoodsReceipts({}, { page: 1, items: 2 });
      const page2 = await GoodsReceiptService.listGoodsReceipts({}, { page: 2, items: 2 });

      expect(page1.result).toHaveLength(2);
      expect(page2.result).toHaveLength(1);
      expect(page1.result[0]._id.toString()).not.toBe(page2.result[0]._id.toString());
    });

    it('should support sorting', async () => {
      const ascending = await GoodsReceiptService.listGoodsReceipts(
        {},
        { sortBy: 'receiptDate', sortOrder: 'asc' }
      );

      const dates = ascending.result.map(r => r.receiptDate.getTime());
      expect(dates[0]).toBeLessThan(dates[1]);
    });

    it('should search by receipt or PO number', async () => {
      const result = await GoodsReceiptService.listGoodsReceipts(
        { search: '0101' },
        { page: 1, items: 10 }
      );

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0].receiptNumber).toContain('0101');
    });
  });

  describe('updateGoodsReceipt', () => {
    it('should update a draft receipt', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0201',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'draft',
        items: [],
        createdBy: testAdmin._id
      });

      const updated = await GoodsReceiptService.updateGoodsReceipt(
        receipt._id,
        { notes: 'Updated notes' },
        testAdmin._id
      );

      expect(updated.notes).toBe('Updated notes');
      expect(AuditLogService.logUpdate).toHaveBeenCalled();
    });

    it('should not update completed receipt', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0202',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'completed',
        items: [],
        createdBy: testAdmin._id
      });

      await expect(
        GoodsReceiptService.updateGoodsReceipt(receipt._id, { notes: 'Test' }, testAdmin._id)
      ).rejects.toThrow('Cannot edit receipt with status');
    });
  });

  describe('completeGoodsReceipt', () => {
    it('should complete receipt and update inventory', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0301',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'draft',
        items: [{
          material: testMaterial._id,
          orderedQuantity: 100,
          receivedQuantity: 100,
          acceptedQuantity: 95,
          rejectedQuantity: 5,
          uom: 'kg'
        }],
        qualityInspection: { required: false },
        createdBy: testAdmin._id
      });

      const completed = await GoodsReceiptService.completeGoodsReceipt(receipt._id, testAdmin._id);

      expect(completed.status).toBe('completed');

      // Check inventory was updated
      const material = await Material.findById(testMaterial._id);
      expect(material.inventory.onHand).toBe(95);
      expect(material.inventory.onOrder).toBe(5); // 100 - 95
      expect(material.inventory.lastReceiptDate).toBeDefined();
    });
  });

  describe('recordQualityInspection', () => {
    it('should record quality inspection results', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0401',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [{
          material: testMaterial._id,
          orderedQuantity: 100,
          receivedQuantity: 100,
          uom: 'kg'
        }],
        createdBy: testAdmin._id
      });

      const inspectionData = {
        result: 'passed',
        notes: 'All items meet quality standards',
        items: [{
          itemId: receipt.items[0]._id,
          acceptedQuantity: 98,
          rejectedQuantity: 2,
          qualityStatus: 'partial'
        }]
      };

      const inspected = await GoodsReceiptService.recordQualityInspection(
        receipt._id,
        inspectionData,
        testAdmin._id
      );

      expect(inspected.qualityInspection.result).toBe('passed');
      expect(inspected.items[0].acceptedQuantity).toBe(98);
      expect(inspected.items[0].rejectedQuantity).toBe(2);
    });
  });

  describe('cancelGoodsReceipt', () => {
    it('should cancel a receipt with reason', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0501',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'draft',
        items: [],
        createdBy: testAdmin._id
      });

      const cancelled = await GoodsReceiptService.cancelGoodsReceipt(
        receipt._id,
        'Incorrect delivery',
        testAdmin._id
      );

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.notes).toContain('Cancelled: Incorrect delivery');
    });

    it('should require cancellation reason', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0502',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'draft',
        items: [],
        createdBy: testAdmin._id
      });

      await expect(
        GoodsReceiptService.cancelGoodsReceipt(receipt._id, '', testAdmin._id)
      ).rejects.toThrow('Cancellation reason is required');
    });
  });

  describe('deleteGoodsReceipt', () => {
    it('should soft delete a draft receipt', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0601',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'draft',
        items: [],
        createdBy: testAdmin._id
      });

      const result = await GoodsReceiptService.deleteGoodsReceipt(receipt._id, testAdmin._id);

      expect(result.success).toBe(true);

      const deleted = await GoodsReceipt.findById(receipt._id);
      expect(deleted.removed).toBe(true);
    });
  });

  describe('getReceiptsByPO', () => {
    it('should return all receipts for a PO', async () => {
      await GoodsReceipt.create([
        {
          receiptNumber: 'GR-20260106-0701',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-0702',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          createdBy: testAdmin._id
        }
      ]);

      const receipts = await GoodsReceiptService.getReceiptsByPO(testPO._id);

      expect(receipts).toHaveLength(2);
    });
  });

  describe('getPendingInspections', () => {
    it('should return receipts pending inspection', async () => {
      await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0801',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        qualityInspection: {
          required: true,
          result: 'pending'
        },
        createdBy: testAdmin._id
      });

      const pending = await GoodsReceiptService.getPendingInspections();

      expect(pending.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await GoodsReceipt.create([
        {
          receiptNumber: 'GR-20260106-0901',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'completed',
          totalReceived: 100,
          totalAccepted: 95,
          totalRejected: 5,
          items: [],
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-0902',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'completed',
          totalReceived: 50,
          totalAccepted: 50,
          totalRejected: 0,
          items: [],
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should return statistics', async () => {
      const result = await GoodsReceiptService.getStatistics();

      expect(result.success).toBe(true);
      expect(result.result.totalReceipts).toBe(2);
      expect(result.result.completedReceipts).toBe(2);
      expect(result.result.totalReceived).toBe(150);
      expect(result.result.totalAccepted).toBe(145);
      expect(result.result.totalRejected).toBe(5);
    });
  });
});

