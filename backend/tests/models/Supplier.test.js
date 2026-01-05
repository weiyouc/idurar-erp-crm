const mongoose = require('mongoose');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');

describe('Supplier Model', () => {
  let testAdmin;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'supplier-test@test.com',
      password: 'password123',
      name: 'Supplier',
      surname: 'Tester',
      enabled: true
    });
  });
  
  afterEach(async () => {
    await Supplier.deleteMany({});
  });
  
  describe('Schema Validation', () => {
    test('should create supplier with all required fields', async () => {
      const supplierData = {
        supplierNumber: 'SUP-20260105-001',
        companyName: {
          zh: '测试供应商',
          en: 'Test Supplier'
        },
        type: 'manufacturer',
        createdBy: testAdmin._id
      };
      
      const supplier = await Supplier.create(supplierData);
      
      expect(supplier.supplierNumber).toBe('SUP-20260105-001');
      expect(supplier.companyName.zh).toBe('测试供应商');
      expect(supplier.companyName.en).toBe('Test Supplier');
      expect(supplier.type).toBe('manufacturer');
      expect(supplier.status).toBe('draft');
      expect(supplier.removed).toBe(false);
    });
    
    test('should require supplier number', async () => {
      const supplier = new Supplier({
        companyName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should require at least one company name', async () => {
      const supplier = new Supplier({
        supplierNumber: 'SUP-20260105-002',
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should accept Chinese name only', async () => {
      const supplier = await Supplier.create({
        supplierNumber: 'SUP-20260105-003',
        companyName: { zh: '中文名称' },
        createdBy: testAdmin._id
      });
      
      expect(supplier.companyName.zh).toBe('中文名称');
      expect(supplier.companyName.en).toBeUndefined();
    });
    
    test('should accept English name only', async () => {
      const supplier = await Supplier.create({
        supplierNumber: 'SUP-20260105-004',
        companyName: { en: 'English Name' },
        createdBy: testAdmin._id
      });
      
      expect(supplier.companyName.en).toBe('English Name');
      expect(supplier.companyName.zh).toBeUndefined();
    });
    
    test('should validate supplier type enum', async () => {
      const supplier = new Supplier({
        supplierNumber: 'SUP-20260105-005',
        companyName: { zh: 'Test' },
        type: 'invalid_type',
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should validate status enum', async () => {
      const supplier = new Supplier({
        supplierNumber: 'SUP-20260105-006',
        companyName: { zh: 'Test' },
        status: 'invalid_status',
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should validate email format', async () => {
      const supplier = new Supplier({
        supplierNumber: 'SUP-20260105-007',
        companyName: { zh: 'Test' },
        contact: { email: 'invalid-email' },
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should validate credit rating enum', async () => {
      const supplier = new Supplier({
        supplierNumber: 'SUP-20260105-008',
        companyName: { zh: 'Test' },
        creditInfo: { creditRating: 'F' },
        createdBy: testAdmin._id
      });
      
      await expect(supplier.save()).rejects.toThrow();
    });
    
    test('should set default values', async () => {
      const supplier = await Supplier.create({
        supplierNumber: 'SUP-20260105-009',
        companyName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      expect(supplier.type).toBe('manufacturer');
      expect(supplier.status).toBe('draft');
      expect(supplier.removed).toBe(false);
      expect(supplier.category).toEqual([]);
      expect(supplier.tags).toEqual([]);
      expect(supplier.creditInfo.creditRating).toBe('Unrated');
      expect(supplier.creditInfo.creditLimit).toBe(0);
      expect(supplier.creditInfo.currency).toBe('CNY');
      expect(supplier.performance.qualityRating).toBe(3);
      expect(supplier.performance.deliveryRating).toBe(3);
      expect(supplier.performance.serviceRating).toBe(3);
    });
  });
  
  describe('Instance Methods', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-TEST-001',
        companyName: { zh: '测试供应商', en: 'Test Supplier' },
        type: 'manufacturer',
        status: 'draft',
        createdBy: testAdmin._id
      });
    });
    
    test('submitForApproval() should change status to pending_approval', async () => {
      await supplier.submitForApproval();
      
      expect(supplier.status).toBe('pending_approval');
      expect(supplier.workflow.approvalStatus).toBe('pending');
    });
    
    test('approve() should change status to active', async () => {
      supplier.status = 'pending_approval';
      await supplier.approve(testAdmin._id);
      
      expect(supplier.status).toBe('active');
      expect(supplier.workflow.approvalStatus).toBe('approved');
      expect(supplier.workflow.approvedBy.toString()).toBe(testAdmin._id.toString());
      expect(supplier.workflow.approvedAt).toBeInstanceOf(Date);
    });
    
    test('reject() should change status to draft', async () => {
      supplier.status = 'pending_approval';
      const reason = 'Missing documents';
      await supplier.reject(testAdmin._id, reason);
      
      expect(supplier.status).toBe('draft');
      expect(supplier.workflow.approvalStatus).toBe('rejected');
      expect(supplier.workflow.rejectedBy.toString()).toBe(testAdmin._id.toString());
      expect(supplier.workflow.rejectedAt).toBeInstanceOf(Date);
      expect(supplier.workflow.rejectionReason).toBe(reason);
    });
    
    test('activate() should change status to active', async () => {
      await supplier.activate();
      
      expect(supplier.status).toBe('active');
    });
    
    test('deactivate() should change status to inactive', async () => {
      supplier.status = 'active';
      await supplier.deactivate();
      
      expect(supplier.status).toBe('inactive');
    });
    
    test('addToBlacklist() should change status to blacklisted', async () => {
      const reason = 'Quality issues';
      await supplier.addToBlacklist(reason);
      
      expect(supplier.status).toBe('blacklisted');
      expect(supplier.notes).toContain('Blacklisted: Quality issues');
    });
    
    test('updatePerformance() should update metrics', async () => {
      const metrics = {
        qualityRating: 4.5,
        deliveryRating: 4.0,
        totalOrders: 10,
        totalAmount: 50000
      };
      
      await supplier.updatePerformance(metrics);
      
      expect(supplier.performance.qualityRating).toBe(4.5);
      expect(supplier.performance.deliveryRating).toBe(4.0);
      expect(supplier.performance.totalOrders).toBe(10);
      expect(supplier.performance.totalAmount).toBe(50000);
    });
    
    test('softDelete() should mark as removed', async () => {
      await supplier.softDelete(testAdmin._id);
      
      expect(supplier.removed).toBe(true);
      expect(supplier.removedAt).toBeInstanceOf(Date);
      expect(supplier.removedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('format() should return formatted data', async () => {
      const formatted = supplier.format();
      
      expect(formatted.id).toBeDefined();
      expect(formatted.supplierNumber).toBe('SUP-TEST-001');
      expect(formatted.companyName.zh).toBe('测试供应商');
      expect(formatted.companyName.en).toBe('Test Supplier');
      expect(formatted.type).toBe('manufacturer');
      expect(formatted.status).toBe('draft');
      expect(formatted.workflow).toBeDefined();
    });
  });
  
  describe('Static Methods', () => {
    test('generateSupplierNumber() should create unique number', async () => {
      const number1 = await Supplier.generateSupplierNumber();
      
      expect(number1).toMatch(/^SUP-\d{8}-\d{3}$/);
      
      // Create a supplier with the first number to establish sequence
      await Supplier.create({
        supplierNumber: number1,
        companyName: { zh: 'Test Seq' },
        createdBy: testAdmin._id
      });
      
      const number2 = await Supplier.generateSupplierNumber();
      
      expect(number2).toMatch(/^SUP-\d{8}-\d{3}$/);
      
      // Should be different from number1
      expect(number2).not.toBe(number1);
    });
    
    test('generateSupplierNumber() should increment sequence', async () => {
      const number1 = await Supplier.generateSupplierNumber();
      
      // Create a supplier with that number
      await Supplier.create({
        supplierNumber: number1,
        companyName: { zh: 'Test1' },
        createdBy: testAdmin._id
      });
      
      const number2 = await Supplier.generateSupplierNumber();
      
      const seq1 = parseInt(number1.split('-')[2]);
      const seq2 = parseInt(number2.split('-')[2]);
      
      expect(seq2).toBe(seq1 + 1);
    });
    
    test('findByNumber() should find supplier', async () => {
      const created = await Supplier.create({
        supplierNumber: 'SUP-FIND-001',
        companyName: { zh: 'Find Test' },
        createdBy: testAdmin._id
      });
      
      const found = await Supplier.findByNumber('SUP-FIND-001');
      
      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(created._id.toString());
    });
    
    test('findByNumber() should not find removed supplier', async () => {
      const created = await Supplier.create({
        supplierNumber: 'SUP-REMOVED-001',
        companyName: { zh: 'Removed' },
        removed: true,
        createdBy: testAdmin._id
      });
      
      const found = await Supplier.findByNumber('SUP-REMOVED-001');
      
      expect(found).toBeNull();
    });
    
    test('findByStatus() should filter by status', async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-ACTIVE-001',
          companyName: { zh: 'Active 1' },
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-ACTIVE-002',
          companyName: { zh: 'Active 2' },
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-DRAFT-001',
          companyName: { zh: 'Draft' },
          status: 'draft',
          createdBy: testAdmin._id
        }
      ]);
      
      const activeSuppliers = await Supplier.findByStatus('active');
      
      expect(activeSuppliers).toHaveLength(2);
      expect(activeSuppliers.every(s => s.status === 'active')).toBe(true);
    });
    
    test('findByType() should filter by type', async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-MANU-001',
          companyName: { zh: 'Manufacturer' },
          type: 'manufacturer',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-DIST-001',
          companyName: { zh: 'Distributor' },
          type: 'distributor',
          createdBy: testAdmin._id
        }
      ]);
      
      const manufacturers = await Supplier.findByType('manufacturer');
      
      expect(manufacturers).toHaveLength(1);
      expect(manufacturers[0].type).toBe('manufacturer');
    });
    
    test('getStatistics() should return stats', async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-STAT-001',
          companyName: { zh: 'Stat1' },
          status: 'active',
          type: 'manufacturer',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STAT-002',
          companyName: { zh: 'Stat2' },
          status: 'inactive',
          type: 'distributor',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STAT-003',
          companyName: { zh: 'Stat3' },
          status: 'pending_approval',
          type: 'manufacturer',
          createdBy: testAdmin._id
        }
      ]);
      
      const stats = await Supplier.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.manufacturers).toBe(2);
      expect(stats.distributors).toBe(1);
    });
  });
  
  describe('Indexes', () => {
    test('should have index on supplierNumber', async () => {
      const indexes = Supplier.schema.indexes();
      const supplierNumberIndex = indexes.find(idx => idx[0].supplierNumber);
      
      expect(supplierNumberIndex).toBeDefined();
    });
    
    test('should have index on status', async () => {
      const indexes = Supplier.schema.indexes();
      const statusIndex = indexes.find(idx => idx[0].status);
      
      expect(statusIndex).toBeDefined();
    });
    
    test('should have text index on company names', async () => {
      const indexes = Supplier.schema.indexes();
      const textIndex = indexes.find(idx => 
        idx[0]['companyName.zh'] === 'text' || idx[0]['companyName.en'] === 'text'
      );
      
      expect(textIndex).toBeDefined();
    });
  });
  
  describe('Pre-save Hook', () => {
    test('should update updatedAt on save', async () => {
      const supplier = await Supplier.create({
        supplierNumber: 'SUP-UPDATE-001',
        companyName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      const originalUpdatedAt = supplier.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      supplier.abbreviation = 'TEST';
      await supplier.save();
      
      expect(supplier.updatedAt).toBeDefined();
      if (originalUpdatedAt) {
        expect(supplier.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }
    });
  });
});

