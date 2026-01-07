const mongoose = require('mongoose');
const GoodsReceipt = require('../../src/models/appModels/GoodsReceipt');
const Admin = require('../../src/models/coreModels/Admin');
const Supplier = require('../../src/models/appModels/Supplier');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const PurchaseOrder = require('../../src/models/appModels/PurchaseOrder');

describe('GoodsReceipt Model', () => {
  let testAdmin;
  let testSupplier;
  let testCategory;
  let testMaterial;
  let testPO;

  beforeAll(async () => {
    // Create test admin
    testAdmin = await Admin.create({
      email: `gr-test-${Date.now()}@test.com`,
      name: 'GRTest',
      surname: 'Admin',
      password: 'hashedpassword123',
      enabled: true
    });

    // Create test supplier
    testSupplier = await Supplier.create({
      supplierNumber: `GRSUP${Date.now()}`,
      companyName: { en: 'GR Test Supplier Inc.', zh: 'GR测试供应商' },
      contact: { 
        name: 'John Doe', 
        email: `john-${Date.now()}@grsupplier.com`,
        phone: '123-456-7890'
      },
      address: { street: '123 Main St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test category
    testCategory = await MaterialCategory.create({
      code: `GRCAT${Date.now()}`,
      name: { en: 'GR Test Category', zh: 'GR测试类别' },
      description: 'Test category for GR testing',
      level: 1,
      path: `/GRCAT${Date.now()}`,
      createdBy: testAdmin._id
    });

    // Create test material
    testMaterial = await Material.create({
      materialNumber: `GRMAT${Date.now()}`,
      materialName: { en: 'GR Test Material', zh: 'GR测试物料' },
      category: testCategory._id,
      type: 'raw',
      baseUOM: 'kg',
      specifications: { color: 'red' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test PO
    testPO = await PurchaseOrder.create({
      poNumber: `GRPO-${Date.now()}`,
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
  });

  afterAll(async () => {
    // Cleanup
    await Promise.all([
      GoodsReceipt.deleteMany({ receiptNumber: /^GR-/ }),
      PurchaseOrder.deleteMany({ poNumber: /^GRPO-/ }),
      Material.deleteMany({ materialNumber: /^GRMAT/ }),
      MaterialCategory.deleteMany({ code: /^GRCAT/ }),
      Supplier.deleteMany({ supplierNumber: /^GRSUP/ }),
      Admin.deleteMany({ email: /^gr-test/ })
    ]);
  });

  beforeEach(async () => {
    // Clean up receipts before each test
    await GoodsReceipt.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid goods receipt', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0001',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        receiptDate: new Date(),
        items: [{
          material: testMaterial._id,
          materialNumber: testMaterial.materialNumber,
          orderedQuantity: 100,
          receivedQuantity: 95,
          acceptedQuantity: 90,
          rejectedQuantity: 5,
          uom: 'kg',
          batchNumber: 'BATCH001',
          qualityStatus: 'passed'
        }],
        status: 'draft',
        createdBy: testAdmin._id
      });

      expect(receipt._id).toBeDefined();
      expect(receipt.receiptNumber).toBe('GR-20260106-0001');
      expect(receipt.poNumber).toBe(testPO.poNumber);
      expect(receipt.items).toHaveLength(1);
      expect(receipt.status).toBe('draft');
    });

    it('should require receiptNumber', async () => {
      const receipt = new GoodsReceipt({
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      await expect(receipt.save()).rejects.toThrow();
    });

    it('should require purchaseOrder', async () => {
      const receipt = new GoodsReceipt({
        receiptNumber: 'GR-20260106-0002',
        poNumber: 'PO-123',
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      await expect(receipt.save()).rejects.toThrow();
    });

    it('should validate receiptNumber format', async () => {
      const receipt = new GoodsReceipt({
        receiptNumber: 'INVALID-FORMAT',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      await expect(receipt.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const receipt = new GoodsReceipt({
        receiptNumber: 'GR-20260106-0003',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        status: 'invalid_status',
        items: [],
        createdBy: testAdmin._id
      });

      await expect(receipt.save()).rejects.toThrow();
    });

    it('should validate item quantities are non-negative', async () => {
      const receipt = new GoodsReceipt({
        receiptNumber: 'GR-20260106-0004',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [{
          material: testMaterial._id,
          orderedQuantity: 100,
          receivedQuantity: -10,  // Invalid
          uom: 'kg'
        }],
        createdBy: testAdmin._id
      });

      await expect(receipt.save()).rejects.toThrow();
    });
  });

  describe('generateReceiptNumber()', () => {
    it('should generate receipt number with correct format', async () => {
      const number = await GoodsReceipt.generateReceiptNumber();
      expect(number).toMatch(/^GR-\d{8}-\d{4}$/);
    });

    it('should generate sequential numbers for same day', async () => {
      const number1 = await GoodsReceipt.generateReceiptNumber();
      
      // Create a receipt with the first number
      await GoodsReceipt.create({
        receiptNumber: number1,
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      const number2 = await GoodsReceipt.generateReceiptNumber();
      
      const seq1 = parseInt(number1.split('-')[2]);
      const seq2 = parseInt(number2.split('-')[2]);
      
      expect(seq2).toBeGreaterThan(seq1);
    });
  });

  describe('findByNumber()', () => {
    it('should find receipt by number', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0005',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        createdBy: testAdmin._id
      });

      const found = await GoodsReceipt.findByNumber('GR-20260106-0005');
      expect(found._id.toString()).toBe(receipt._id.toString());
    });

    it('should not find removed receipts', async () => {
      await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0006',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [],
        removed: true,
        createdBy: testAdmin._id
      });

      const found = await GoodsReceipt.findByNumber('GR-20260106-0006');
      expect(found).toBeNull();
    });
  });

  describe('findByPO()', () => {
    it('should find all receipts for a purchase order', async () => {
      await GoodsReceipt.create([
        {
          receiptNumber: 'GR-20260106-0007',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-0008',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          createdBy: testAdmin._id
        }
      ]);

      const receipts = await GoodsReceipt.findByPO(testPO._id);
      expect(receipts).toHaveLength(2);
    });
  });

  describe('getPendingInspections()', () => {
    it('should return receipts requiring inspection', async () => {
      await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-0009',
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

      const pending = await GoodsReceipt.getPendingInspections();
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStatistics()', () => {
    beforeEach(async () => {
      await GoodsReceipt.create([
        {
          receiptNumber: 'GR-20260106-1001',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          status: 'completed',
          totalReceived: 100,
          totalAccepted: 95,
          totalRejected: 5,
          createdBy: testAdmin._id
        },
        {
          receiptNumber: 'GR-20260106-1002',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          status: 'draft',
          totalReceived: 50,
          totalAccepted: 50,
          totalRejected: 0,
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should return accurate statistics', async () => {
      const stats = await GoodsReceipt.getStatistics();
      
      expect(stats.totalReceipts).toBe(2);
      expect(stats.completedReceipts).toBe(1);
      expect(stats.totalReceived).toBe(150);
      expect(stats.totalAccepted).toBe(145);
      expect(stats.totalRejected).toBe(5);
    });

    it('should calculate acceptance rate', async () => {
      const stats = await GoodsReceipt.getStatistics();
      
      // (145 accepted / 150 received) * 100 = 96.67%
      expect(stats.acceptanceRate).toBeGreaterThan(90);
    });
  });

  describe('Pre-save Middleware', () => {
    it('should calculate totals on save', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-2001',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [
          {
            material: testMaterial._id,
            orderedQuantity: 100,
            receivedQuantity: 95,
            acceptedQuantity: 90,
            rejectedQuantity: 5,
            uom: 'kg'
          },
          {
            material: testMaterial._id,
            orderedQuantity: 50,
            receivedQuantity: 50,
            acceptedQuantity: 48,
            rejectedQuantity: 2,
            uom: 'kg'
          }
        ],
        createdBy: testAdmin._id
      });

      expect(receipt.totalReceived).toBe(145);
      expect(receipt.totalAccepted).toBe(138);
      expect(receipt.totalRejected).toBe(7);
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate completionPercentage', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-3001',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [{
          material: testMaterial._id,
          orderedQuantity: 100,
          receivedQuantity: 75,
          uom: 'kg'
        }],
        createdBy: testAdmin._id
      });

      expect(receipt.completionPercentage).toBe(75);
    });

    it('should calculate acceptanceRate', async () => {
      const receipt = await GoodsReceipt.create({
        receiptNumber: 'GR-20260106-3002',
        purchaseOrder: testPO._id,
        poNumber: testPO.poNumber,
        supplier: testSupplier._id,
        items: [{
          material: testMaterial._id,
          orderedQuantity: 100,
          receivedQuantity: 100,
          acceptedQuantity: 95,
          rejectedQuantity: 5,
          uom: 'kg'
        }],
        createdBy: testAdmin._id
      });

      expect(receipt.acceptanceRate).toBe(95);
    });
  });

  describe('Instance Methods', () => {
    describe('complete()', () => {
      it('should complete a draft receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-4001',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'draft',
          items: [{
            material: testMaterial._id,
            orderedQuantity: 100,
            receivedQuantity: 100,
            acceptedQuantity: 100,
            rejectedQuantity: 0,
            uom: 'kg'
          }],
          qualityInspection: { required: false },
          createdBy: testAdmin._id
        });

        await receipt.complete(testAdmin._id);
        expect(receipt.status).toBe('completed');
      });

      it('should not complete already completed receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-4002',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'completed',
          items: [],
          createdBy: testAdmin._id
        });

        await expect(receipt.complete(testAdmin._id))
          .rejects.toThrow('Receipt is already completed');
      });

      it('should not complete cancelled receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-4003',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'cancelled',
          items: [],
          createdBy: testAdmin._id
        });

        await expect(receipt.complete(testAdmin._id))
          .rejects.toThrow('Cannot complete a cancelled receipt');
      });
    });

    describe('recordInspection()', () => {
      it('should record quality inspection', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-5001',
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
          notes: 'All items meet specifications',
          items: [{
            itemId: receipt.items[0]._id,
            acceptedQuantity: 98,
            rejectedQuantity: 2,
            qualityStatus: 'partial',
            inspectionNotes: 'Minor defects found'
          }]
        };

        await receipt.recordInspection(inspectionData, testAdmin._id);
        
        expect(receipt.qualityInspection.result).toBe('passed');
        expect(receipt.qualityInspection.inspector.toString()).toBe(testAdmin._id.toString());
        expect(receipt.items[0].acceptedQuantity).toBe(98);
        expect(receipt.items[0].rejectedQuantity).toBe(2);
      });

      it('should not inspect cancelled receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-5002',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'cancelled',
          items: [],
          createdBy: testAdmin._id
        });

        await expect(receipt.recordInspection({ result: 'passed' }, testAdmin._id))
          .rejects.toThrow('Cannot inspect a cancelled receipt');
      });
    });

    describe('cancel()', () => {
      it('should cancel a draft receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-6001',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'draft',
          items: [],
          createdBy: testAdmin._id
        });

        await receipt.cancel(testAdmin._id, 'Incorrect delivery');
        
        expect(receipt.status).toBe('cancelled');
        expect(receipt.notes).toContain('Cancelled: Incorrect delivery');
      });

      it('should not cancel completed receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-6002',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'completed',
          items: [],
          createdBy: testAdmin._id
        });

        await expect(receipt.cancel(testAdmin._id, 'Test'))
          .rejects.toThrow('Cannot cancel a completed receipt');
      });
    });

    describe('softDelete()', () => {
      it('should soft delete a draft receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-7001',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'draft',
          items: [],
          createdBy: testAdmin._id
        });

        await receipt.softDelete(testAdmin._id);
        expect(receipt.removed).toBe(true);
      });

      it('should not delete completed receipt', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-7002',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          status: 'completed',
          items: [],
          createdBy: testAdmin._id
        });

        await expect(receipt.softDelete(testAdmin._id))
          .rejects.toThrow('Cannot delete a completed receipt');
      });
    });

    describe('format()', () => {
      it('should format receipt for JSON response', async () => {
        const receipt = await GoodsReceipt.create({
          receiptNumber: 'GR-20260106-8001',
          purchaseOrder: testPO._id,
          poNumber: testPO.poNumber,
          supplier: testSupplier._id,
          items: [],
          createdBy: testAdmin._id
        });

        const formatted = receipt.format();
        
        expect(formatted).toHaveProperty('receiptNumber');
        expect(formatted).toHaveProperty('poNumber');
        expect(formatted).toHaveProperty('status');
        expect(formatted).toHaveProperty('completionPercentage');
        expect(formatted).toHaveProperty('acceptanceRate');
      });
    });
  });
});


