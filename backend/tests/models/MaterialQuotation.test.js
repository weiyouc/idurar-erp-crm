const mongoose = require('mongoose');
const MaterialQuotation = require('../../src/models/appModels/MaterialQuotation');
const Admin = require('../../src/models/coreModels/Admin');
const Supplier = require('../../src/models/appModels/Supplier');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');

describe('MaterialQuotation Model', () => {
  let testAdmin;
  let testSupplier1;
  let testSupplier2;
  let testSupplier3;
  let testCategory;
  let testMaterial;

  beforeAll(async () => {
    // Create test admin
    testAdmin = await Admin.create({
      email: `mq-test-${Date.now()}@test.com`,
      name: 'MQTest',
      surname: 'Admin',
      password: 'hashedpassword123',
      enabled: true
    });

    // Create test suppliers
    testSupplier1 = await Supplier.create({
      supplierNumber: `MQSUP1${Date.now()}`,
      companyName: { en: 'MQ Supplier One Inc.', zh: 'MQ供应商一' },
      contact: { 
        name: 'John Doe', 
        email: `john-${Date.now()}@mqsup1.com`,
        phone: '123-456-7890'
      },
      address: { street: '123 Main St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    testSupplier2 = await Supplier.create({
      supplierNumber: `MQSUP2${Date.now()}`,
      companyName: { en: 'MQ Supplier Two Inc.', zh: 'MQ供应商二' },
      contact: { 
        name: 'Jane Smith', 
        email: `jane-${Date.now()}@mqsup2.com`,
        phone: '123-456-7891'
      },
      address: { street: '456 Elm St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    testSupplier3 = await Supplier.create({
      supplierNumber: `MQSUP3${Date.now()}`,
      companyName: { en: 'MQ Supplier Three Inc.', zh: 'MQ供应商三' },
      contact: { 
        name: 'Bob Johnson', 
        email: `bob-${Date.now()}@mqsup3.com`,
        phone: '123-456-7892'
      },
      address: { street: '789 Oak St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test category
    testCategory = await MaterialCategory.create({
      code: `MQCAT${Date.now()}`,
      name: { en: 'MQ Test Category', zh: 'MQ测试类别' },
      description: 'Test category for MQ testing',
      level: 1,
      path: `/MQCAT${Date.now()}`,
      createdBy: testAdmin._id
    });

    // Create test material
    testMaterial = await Material.create({
      materialNumber: `MQMAT${Date.now()}`,
      materialName: { en: 'MQ Test Material', zh: 'MQ测试物料' },
      category: testCategory._id,
      type: 'raw',
      baseUOM: 'kg',
      specifications: { color: 'red' },
      status: 'active',
      createdBy: testAdmin._id
    });
  });

  afterAll(async () => {
    // Cleanup
    await Promise.all([
      MaterialQuotation.deleteMany({ quotationNumber: /^MQ-/ }),
      Material.deleteMany({ materialNumber: /^MQMAT/ }),
      MaterialCategory.deleteMany({ code: /^MQCAT/ }),
      Supplier.deleteMany({ supplierNumber: /^MQSUP/ }),
      Admin.deleteMany({ email: /^mq-test/ })
    ]);
  });

  beforeEach(async () => {
    // Clean up quotations before each test
    await MaterialQuotation.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid material quotation', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0001',
        title: { en: 'Test Quotation', zh: '测试询价' },
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          targetPrice: 10.00
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id],
        requestDate: new Date(),
        responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: testAdmin._id
      });

      expect(quotation._id).toBeDefined();
      expect(quotation.quotationNumber).toBe('MQ-20260106-0001');
      expect(quotation.items).toHaveLength(1);
      expect(quotation.targetSuppliers).toHaveLength(2);
      expect(quotation.status).toBe('draft');
    });

    it('should require quotationNumber', async () => {
      const quotation = new MaterialQuotation({
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(quotation.save()).rejects.toThrow();
    });

    it('should validate quotationNumber format', async () => {
      const quotation = new MaterialQuotation({
        quotationNumber: 'INVALID-FORMAT',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(quotation.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const quotation = new MaterialQuotation({
        quotationNumber: 'MQ-20260106-0002',
        status: 'invalid_status',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      await expect(quotation.save()).rejects.toThrow();
    });
  });

  describe('generateQuotationNumber()', () => {
    it('should generate quotation number with correct format', async () => {
      const number = await MaterialQuotation.generateQuotationNumber();
      expect(number).toMatch(/^MQ-\d{8}-\d{4}$/);
    });

    it('should generate sequential numbers for same day', async () => {
      const number1 = await MaterialQuotation.generateQuotationNumber();
      
      await MaterialQuotation.create({
        quotationNumber: number1,
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const number2 = await MaterialQuotation.generateQuotationNumber();
      
      const seq1 = parseInt(number1.split('-')[2]);
      const seq2 = parseInt(number2.split('-')[2]);
      
      expect(seq2).toBeGreaterThan(seq1);
    });
  });

  describe('findByNumber()', () => {
    it('should find quotation by number', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0003',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      const found = await MaterialQuotation.findByNumber('MQ-20260106-0003');
      expect(found._id.toString()).toBe(quotation._id.toString());
    });

    it('should not find removed quotations', async () => {
      await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0004',
        items: [],
        targetSuppliers: [],
        requestDate: new Date(),
        responseDeadline: new Date(),
        removed: true,
        createdBy: testAdmin._id
      });

      const found = await MaterialQuotation.findByNumber('MQ-20260106-0004');
      expect(found).toBeNull();
    });
  });

  describe('findPending()', () => {
    it('should return pending quotations', async () => {
      await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0005',
        items: [],
        targetSuppliers: [],
        status: 'sent',
        requestDate: new Date(),
        responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: testAdmin._id
      });

      const pending = await MaterialQuotation.findPending();
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findOverdue()', () => {
    it('should return overdue quotations', async () => {
      await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-0006',
        items: [],
        targetSuppliers: [],
        status: 'sent',
        requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        responseDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdBy: testAdmin._id
      });

      const overdue = await MaterialQuotation.findOverdue();
      expect(overdue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStatistics()', () => {
    beforeEach(async () => {
      await MaterialQuotation.create([
        {
          quotationNumber: 'MQ-20260106-1001',
          items: [],
          targetSuppliers: [],
          status: 'draft',
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        },
        {
          quotationNumber: 'MQ-20260106-1002',
          items: [],
          targetSuppliers: [],
          status: 'sent',
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        },
        {
          quotationNumber: 'MQ-20260106-1003',
          items: [],
          targetSuppliers: [],
          status: 'completed',
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should return accurate statistics', async () => {
      const stats = await MaterialQuotation.getStatistics();
      
      expect(stats.totalQuotations).toBe(3);
      expect(stats.draftCount).toBe(1);
      expect(stats.sentCount).toBe(1);
      expect(stats.completedCount).toBe(1);
    });
  });

  describe('Pre-save Middleware', () => {
    it('should calculate total price for quotes', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-2001',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [{
            supplier: testSupplier1._id,
            unitPrice: 10.50,
            totalPrice: 0 // Will be auto-calculated
          }]
        }],
        targetSuppliers: [testSupplier1._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      expect(quotation.items[0].quotes[0].totalPrice).toBe(1050);
    });

    it('should rank quotes by price', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-2002',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            {
              supplier: testSupplier1._id,
              unitPrice: 12.00,
              totalPrice: 0
            },
            {
              supplier: testSupplier2._id,
              unitPrice: 10.00,
              totalPrice: 0
            },
            {
              supplier: testSupplier3._id,
              unitPrice: 11.00,
              totalPrice: 0
            }
          ]
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id, testSupplier3._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      // Check rankings: lowest price = rank 1
      const supplier2Quote = quotation.items[0].quotes.find(
        q => q.supplier.toString() === testSupplier2._id.toString()
      );
      const supplier3Quote = quotation.items[0].quotes.find(
        q => q.supplier.toString() === testSupplier3._id.toString()
      );
      const supplier1Quote = quotation.items[0].quotes.find(
        q => q.supplier.toString() === testSupplier1._id.toString()
      );

      expect(supplier2Quote.rank).toBe(1); // $10.00
      expect(supplier3Quote.rank).toBe(2); // $11.00
      expect(supplier1Quote.rank).toBe(3); // $12.00
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate responseCount', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-3001',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            { supplier: testSupplier1._id, unitPrice: 10.00, totalPrice: 0 },
            { supplier: testSupplier2._id, unitPrice: 11.00, totalPrice: 0 }
          ]
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id, testSupplier3._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      expect(quotation.responseCount).toBe(2);
    });

    it('should calculate completionPercentage', async () => {
      const quotation = await MaterialQuotation.create({
        quotationNumber: 'MQ-20260106-3002',
        items: [{
          material: testMaterial._id,
          quantity: 100,
          uom: 'kg',
          quotes: [
            { supplier: testSupplier1._id, unitPrice: 10.00, totalPrice: 0 }
          ]
        }],
        targetSuppliers: [testSupplier1._id, testSupplier2._id, testSupplier3._id],
        requestDate: new Date(),
        responseDeadline: new Date(),
        createdBy: testAdmin._id
      });

      // 1 response / 3 target suppliers = 33%
      expect(quotation.completionPercentage).toBe(33);
    });
  });

  describe('Instance Methods', () => {
    describe('send()', () => {
      it('should send a draft quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-4001',
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

        await quotation.send(testAdmin._id);
        expect(quotation.status).toBe('sent');
      });

      it('should not send non-draft quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-4002',
          status: 'sent',
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

        await expect(quotation.send(testAdmin._id))
          .rejects.toThrow('Only draft quotations can be sent');
      });

      it('should require target suppliers', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-4003',
          status: 'draft',
          items: [{
            material: testMaterial._id,
            quantity: 100,
            uom: 'kg'
          }],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await expect(quotation.send(testAdmin._id))
          .rejects.toThrow('At least one target supplier is required');
      });
    });

    describe('addQuote()', () => {
      it('should add a supplier quote', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-5001',
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

        await quotation.addQuote(
          quotation.items[0]._id,
          {
            supplier: testSupplier1._id,
            unitPrice: 10.50,
            totalPrice: 1050,
            leadTime: 7
          },
          testAdmin._id
        );

        expect(quotation.items[0].quotes).toHaveLength(1);
        expect(quotation.items[0].quotes[0].unitPrice).toBe(10.50);
      });

      it('should not add duplicate supplier quote', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-5002',
          items: [{
            material: testMaterial._id,
            quantity: 100,
            uom: 'kg',
            quotes: [{
              supplier: testSupplier1._id,
              unitPrice: 10.00,
              totalPrice: 0
            }]
          }],
          targetSuppliers: [testSupplier1._id],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await expect(
          quotation.addQuote(
            quotation.items[0]._id,
            { supplier: testSupplier1._id, unitPrice: 11.00, totalPrice: 0 },
            testAdmin._id
          )
        ).rejects.toThrow('Supplier has already provided a quote');
      });
    });

    describe('selectQuote()', () => {
      it('should select a quote for an item', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-6001',
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
        await quotation.selectQuote(quotation.items[0]._id, quoteId, testAdmin._id);

        expect(quotation.items[0].quotes[0].isSelected).toBe(true);
        expect(quotation.items[0].quotes[1].isSelected).toBe(false);
      });
    });

    describe('complete()', () => {
      it('should complete quotation with selected quotes', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-7001',
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

        await quotation.complete(testAdmin._id);
        expect(quotation.status).toBe('completed');
      });

      it('should not complete without selected quotes', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-7002',
          status: 'sent',
          items: [{
            material: testMaterial._id,
            quantity: 100,
            uom: 'kg',
            quotes: [
              { supplier: testSupplier1._id, unitPrice: 10.00, totalPrice: 0, isSelected: false }
            ]
          }],
          targetSuppliers: [testSupplier1._id],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await expect(quotation.complete(testAdmin._id))
          .rejects.toThrow('All items must have a selected quote');
      });
    });

    describe('cancel()', () => {
      it('should cancel a quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-8001',
          status: 'draft',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await quotation.cancel(testAdmin._id, 'No longer needed');
        
        expect(quotation.status).toBe('cancelled');
        expect(quotation.notes).toContain('Cancelled: No longer needed');
      });

      it('should not cancel completed quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-8002',
          status: 'completed',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await expect(quotation.cancel(testAdmin._id, 'Test'))
          .rejects.toThrow('Cannot cancel a completed quotation');
      });
    });

    describe('softDelete()', () => {
      it('should soft delete a draft quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-9001',
          status: 'draft',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await quotation.softDelete(testAdmin._id);
        expect(quotation.removed).toBe(true);
      });

      it('should not delete completed quotation', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-9002',
          status: 'completed',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        await expect(quotation.softDelete(testAdmin._id))
          .rejects.toThrow('Cannot delete a completed quotation');
      });
    });

    describe('format()', () => {
      it('should format quotation for JSON response', async () => {
        const quotation = await MaterialQuotation.create({
          quotationNumber: 'MQ-20260106-9999',
          items: [],
          targetSuppliers: [],
          requestDate: new Date(),
          responseDeadline: new Date(),
          createdBy: testAdmin._id
        });

        const formatted = quotation.format();
        
        expect(formatted).toHaveProperty('quotationNumber');
        expect(formatted).toHaveProperty('status');
        expect(formatted).toHaveProperty('responseCount');
        expect(formatted).toHaveProperty('completionPercentage');
      });
    });
  });
});


