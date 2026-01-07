const mongoose = require('mongoose');
const MaterialQuotationService = require('../../src/services/MaterialQuotationService');
const MaterialQuotation = require('../../src/models/appModels/MaterialQuotation');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const PurchaseOrder = require('../../src/models/appModels/PurchaseOrder');
const AuditLogService = require('../../src/services/AuditLogService');

// Mock AuditLogService
jest.mock('../../src/services/AuditLogService');

describe('MaterialQuotationService', () => {
  let testAdmin;
  let testSupplier1;
  let testSupplier2;
  let testCategory;
  let testMaterial;

  // Helper function to create test data
  async function createTestData() {
    testAdmin = await Admin.create({
      email: `mqs-test-${Date.now()}@test.com`,
      name: 'MQSTest',
      surname: 'Admin',
      password: 'hashedpassword123',
      enabled: true
    });

    testSupplier1 = await Supplier.create({
      supplierNumber: `MQSSUP1${Date.now()}`,
      companyName: { en: 'MQS Supplier One Inc.', zh: 'MQS供应商一' },
      contact: { 
        name: 'John Doe', 
        email: `john-${Date.now()}@mqssup1.com`,
        phone: '123-456-7890'
      },
      address: { street: '123 Main St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    testSupplier2 = await Supplier.create({
      supplierNumber: `MQSSUP2${Date.now()}`,
      companyName: { en: 'MQS Supplier Two Inc.', zh: 'MQS供应商二' },
      contact: { 
        name: 'Jane Smith', 
        email: `jane-${Date.now()}@mqssup2.com`,
        phone: '123-456-7891'
      },
      address: { street: '456 Elm St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    testCategory = await MaterialCategory.create({
      code: `MQSCAT${Date.now()}`,
      name: { en: 'MQS Test Category', zh: 'MQS测试类别' },
      description: 'Test category for MQS testing',
      level: 1,
      path: `/MQSCAT${Date.now()}`,
      createdBy: testAdmin._id
    });

    testMaterial = await Material.create({
      materialNumber: `MQSMAT${Date.now()}`,
      materialName: { en: 'MQS Test Material', zh: 'MQS测试物料' },
      category: testCategory._id,
      type: 'raw',
      baseUOM: 'kg',
      specifications: { color: 'red' },
      status: 'active',
      createdBy: testAdmin._id
    });
  }

  beforeEach(async () => {
    // Clean up all test data before each test
    await Promise.all([
      MaterialQuotation.deleteMany({}),
      PurchaseOrder.deleteMany({ poNumber: /^PO-/ }),
      Material.deleteMany({ materialNumber: /^MQSMAT/ }),
      MaterialCategory.deleteMany({ code: /^MQSCAT/ }),
      Supplier.deleteMany({ supplierNumber: /^MQSSUP/ }),
      Admin.deleteMany({ email: /^mqs-test/ })
    ]);
    
    // Recreate test data
    await createTestData();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('createQuotation', () => {
    it('should create a new quotation', async () => {
      const quotationData = {
        title: { en: 'Test Quotation', zh: '测试询价' },
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          targetPrice: 10.00
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id],
        requestDate: new Date(),
        responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const quotation = await MaterialQuotationService.createQuotation(quotationData, testAdmin._id);

      expect(quotation._id).toBeDefined();
      expect(quotation.quotationNumber).toMatch(/^MQ-\d{8}-\d{4}$/);
      expect(quotation.items).toHaveLength(1);
      expect(quotation.targetSuppliers).toHaveLength(2);
      expect(AuditLogService.logCreate).toHaveBeenCalled();
    });
  });

  describe('getQuotation', () => {
    it('should retrieve a quotation by ID', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0001',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const result = await MaterialQuotationService.getQuotation(quotation._id);

      expect(result._id.toString()).toBe(quotation._id.toString());
      expect(result.quotationNumber).toBe('MQ-20260106-0001');
    });

    it('should populate references when requested', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0002',
        items: [],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const result = await MaterialQuotationService.getQuotation(quotation._id, {
        populate: ['targetSuppliers', 'createdBy']
      });

      expect(result.targetSuppliers[0].companyName).toBeDefined();
      expect(result.createdBy.email).toContain('mqs-test');
    });

    it('should throw error if quotation not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        MaterialQuotationService.getQuotation(fakeId)
      ).rejects.toThrow('Quotation not found');
    });
  });

  describe('listQuotations', () => {
    beforeEach(async () => {
      await MaterialQuotation.create([
        {
          quotationNumber: 'MQ-20260106-0101',
          status: 'draft',
          items: [],
          targetSuppliers: [],
          requestDate: new Date('2026-01-01'),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        },
        {
          quotationNumber: 'MQ-20260106-0102',
          status: 'sent',
          items: [],
          targetSuppliers: [],
          requestDate: new Date('2026-01-02'),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        },
        {
          quotationNumber: 'MQ-20260106-0103',
          status: 'completed',
          items: [],
          targetSuppliers: [],
          requestDate: new Date('2026-01-03'),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should list all quotations', async () => {
      const result = await MaterialQuotationService.listQuotations({}, { page: 1, items: 10 });

      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(3);
      expect(result.pagination.count).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await MaterialQuotationService.listQuotations(
        { status: 'sent' },
        { page: 1, items: 10 }
      );

      expect(result.result).toHaveLength(1);
      expect(result.result[0].status).toBe('sent');
    });

    it('should support pagination', async () => {
      const page1 = await MaterialQuotationService.listQuotations({}, { page: 1, items: 2 });
      const page2 = await MaterialQuotationService.listQuotations({}, { page: 2, items: 2 });

      expect(page1.result).toHaveLength(2);
      expect(page2.result).toHaveLength(1);
    });
  });

  describe('updateQuotation', () => {
    it('should update a draft quotation', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0201',
        status: 'draft',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const updated = await MaterialQuotationService.updateQuotation(
        quotation._id,
        { description: 'Updated description' },
        testAdmin._id
      );

      expect(updated.description).toBe('Updated description');
      expect(AuditLogService.logUpdate).toHaveBeenCalled();
    });

    it('should not update non-draft quotation', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0202',
        status: 'sent',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(
        MaterialQuotationService.updateQuotation(quotation._id, { description: 'Test' }, testAdmin._id)
      ).rejects.toThrow('Cannot edit quotation with status');
    });
  });

  describe('sendQuotation', () => {
    it('should send a draft quotation', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0301',
        status: 'draft',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg'
        }],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const sent = await MaterialQuotationService.sendQuotation(quotation._id, testAdmin._id);

      expect(sent.status).toBe('sent');
    });
  });

  describe('addQuote', () => {
    it('should add a supplier quote to an item', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0401',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: []
        }],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const quoteData = {
        supplier: testSupplier1._id,
        unitPrice: 10.50,
        totalPrice: 1050,
        leadTime: 7
      };

      const result = await MaterialQuotationService.addQuote(
        quotation._id,
        quotation.items[0]._id,
        quoteData,
        testAdmin._id
      );

      expect(result.items[0].quotes).toHaveLength(1);
      expect(result.items[0].quotes[0].unitPrice).toBe(10.50);
    });
  });

  describe('selectQuote', () => {
    it('should select a quote for an item', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0501',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            { supplier: testSupplier1._id, unitPrice: 10.00, totalPrice: 0, isSelected: false },
            { supplier: testSupplier2._id, unitPrice: 11.00, totalPrice: 0, isSelected: false }
          ]
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const quoteId = quotation.items[0].quotes[0]._id;
      const result = await MaterialQuotationService.selectQuote(
        quotation._id,
        quotation.items[0]._id,
        quoteId,
        testAdmin._id
      );

      expect(result.items[0].quotes[0].isSelected).toBe(true);
      expect(result.items[0].quotes[1].isSelected).toBe(false);
    });
  });

  describe('completeQuotation', () => {
    it('should complete quotation with selected quotes', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0601',
        status: 'sent',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            { supplier: testSupplier1._id, unitPrice: 10.00, totalPrice: 0, isSelected: true }
          ]
        }],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const completed = await MaterialQuotationService.completeQuotation(quotation._id, testAdmin._id);

      expect(completed.status).toBe('completed');
    });
  });

  describe('cancelQuotation', () => {
    it('should cancel a quotation with reason', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0701',
        status: 'draft',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const cancelled = await MaterialQuotationService.cancelQuotation(
        quotation._id,
        'No longer needed',
        testAdmin._id
      );

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.notes).toContain('Cancelled: No longer needed');
    });

    it('should require cancellation reason', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0702',
        status: 'draft',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(
        MaterialQuotationService.cancelQuotation(quotation._id, '', testAdmin._id)
      ).rejects.toThrow('Cancellation reason is required');
    });
  });

  describe('deleteQuotation', () => {
    it('should soft delete a draft quotation', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0801',
        status: 'draft',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const result = await MaterialQuotationService.deleteQuotation(quotation._id, testAdmin._id);

      expect(result.success).toBe(true);

      const deleted = await MaterialQuotation.findById(quotation._id);
      expect(deleted.removed).toBe(true);
    });
  });

  describe('getPendingQuotations', () => {
    it('should return pending quotations', async () => {
      await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0901',
        status: 'sent',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: testAdmin._id
      });

      const pending = await MaterialQuotationService.getPendingQuotations();

      expect(pending.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getOverdueQuotations', () => {
    it('should return overdue quotations', async () => {
      await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-1001',
        status: 'sent',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        responseDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdBy: testAdmin._id
      });

      const overdue = await MaterialQuotationService.getOverdueQuotations();

      expect(overdue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await MaterialQuotation.create([
        {
          quotationNumber: 'MQ-20260106-1101',
          status: 'draft',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        },
        {
          quotationNumber: 'MQ-20260106-1102',
          status: 'sent',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should return statistics', async () => {
      const result = await MaterialQuotationService.getStatistics();

      expect(result.success).toBe(true);
      expect(result.result.totalQuotations).toBeGreaterThanOrEqual(2);
    });
  });

  describe('convertToPurchaseOrders', () => {
    it('should convert completed quotation to POs', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-1201',
        status: 'completed',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            {
              supplier: testSupplier1._id,
              supplierName: testSupplier1.companyName,
              unitPrice: 10.00,
              totalPrice: 1000,
              isSelected: true
            }
          ]
        }],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const result = await MaterialQuotationService.convertToPurchaseOrders(quotation._id, testAdmin._id);

      expect(result.success).toBe(true);
      expect(result.purchaseOrders).toHaveLength(1);
    });

    it('should throw error if quotation not completed', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-1202',
        status: 'draft',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(
        MaterialQuotationService.convertToPurchaseOrders(quotation._id, testAdmin._id)
      ).rejects.toThrow('Only completed quotations can be converted');
    });
  });
});


