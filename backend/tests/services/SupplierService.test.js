const mongoose = require('mongoose');
const SupplierService = require('../../src/services/SupplierService');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const WorkflowInstance = require('../../src/models/appModels/WorkflowInstance');
const WorkflowEngine = require('../../src/services/workflow/WorkflowEngine');

jest.mock('../../src/services/AuditLogService');
jest.mock('../../src/services/workflow/WorkflowEngine');

describe('SupplierService', () => {
  let testAdmin;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'supplier-service-test@test.com',
      password: 'password123',
      name: 'Service',
      surname: 'Tester',
      enabled: true
    });
  });
  
  afterEach(async () => {
    await Supplier.deleteMany({});
    jest.clearAllMocks();
  });
  
  describe('createSupplier', () => {
    test('should create supplier with valid data', async () => {
      const supplierData = {
        companyName: { zh: '测试供应商', en: 'Test Supplier' },
        type: 'manufacturer',
        contact: {
          primaryContact: 'John Doe',
          email: 'john@test.com',
          phone: '+86 123 4567 8900'
        }
      };
      
      const supplier = await SupplierService.createSupplier(supplierData, testAdmin._id);
      
      expect(supplier).toBeDefined();
      expect(supplier.supplierNumber).toMatch(/^SUP-\d{8}-\d{3}$/); // Auto-generated
      expect(supplier.companyName.zh).toBe('测试供应商');
      expect(supplier.companyName.en).toBe('Test Supplier');
      expect(supplier.createdBy).toBeDefined();
    });
    
    test('should auto-generate supplier number if not provided', async () => {
      const supplierData = {
        companyName: { zh: '自动编号' },
        type: 'distributor'
      };
      
      const supplier = await SupplierService.createSupplier(supplierData, testAdmin._id);
      
      expect(supplier.supplierNumber).toMatch(/^SUP-\d{8}-\d{3}$/);
    });
    
    test('should log creation in audit log', async () => {
      const AuditLogService = require('../../src/services/AuditLogService');
      
      const supplierData = {
        companyName: { zh: '审计测试' },
        type: 'manufacturer'
      };
      
      await SupplierService.createSupplier(supplierData, testAdmin._id);
      
      expect(AuditLogService.logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'Supplier'
        })
      );
    });
    
    test('should throw error for missing company name', async () => {
      const supplierData = {
        type: 'manufacturer'
        // Missing companyName
      };
      
      await expect(
        SupplierService.createSupplier(supplierData, testAdmin._id)
      ).rejects.toThrow();
    });
  });
  
  describe('listSuppliers', () => {
    beforeEach(async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-GET-001',
          companyName: { zh: '供应商1', en: 'Supplier 1' },
          type: 'manufacturer',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-GET-002',
          companyName: { zh: '供应商2', en: 'Supplier 2' },
          type: 'distributor',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-GET-003',
          companyName: { zh: '供应商3', en: 'Supplier 3' },
          type: 'manufacturer',
          status: 'inactive',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should return all suppliers with default options', async () => {
      const response = await SupplierService.listSuppliers();
      
      expect(response.result).toHaveLength(3);
      expect(response.pagination.count).toBe(3);
    });
    
    test('should filter by status', async () => {
      const response = await SupplierService.listSuppliers({ status: 'active' });
      
      expect(response.result).toHaveLength(2);
      expect(response.result.every(s => s.status === 'active')).toBe(true);
    });
    
    test('should filter by type', async () => {
      const response = await SupplierService.listSuppliers({ type: 'manufacturer' });
      
      expect(response.result).toHaveLength(2);
      expect(response.result.every(s => s.type === 'manufacturer')).toBe(true);
    });
    
    test('should search by company name', async () => {
      const response = await SupplierService.listSuppliers({ search: 'Supplier 1' });
      
      expect(response.result.length).toBeGreaterThanOrEqual(1);
      const found = response.result.find(s => s.companyName.en === 'Supplier 1');
      expect(found).toBeDefined();
    });
    
    test('should paginate results', async () => {
      const response = await SupplierService.listSuppliers({}, { items: 2, page: 1 });
      
      expect(response.result).toHaveLength(2);
      expect(response.pagination.count).toBe(3);
    });
    
    test('should sort results', async () => {
      const response = await SupplierService.listSuppliers({}, { sortBy: 'supplierNumber', sortOrder: 'asc' });
      
      expect(response.result[0].supplierNumber).toBe('SUP-GET-001');
      expect(response.result[2].supplierNumber).toBe('SUP-GET-003');
    });
    
    test('should not return removed suppliers', async () => {
      await Supplier.create({
        supplierNumber: 'SUP-REMOVED-001',
        companyName: { zh: '已删除' },
        removed: true,
        createdBy: testAdmin._id
      });
      
      const response = await SupplierService.listSuppliers();
      
      expect(response.pagination.count).toBe(3); // Should not count removed
      expect(response.result.find(s => s.supplierNumber === 'SUP-REMOVED-001')).toBeUndefined();
    });
  });
  
  describe('getSupplier', () => {
    test('should return supplier by ID', async () => {
      const created = await Supplier.create({
        supplierNumber: 'SUP-GETID-001',
        companyName: { zh: '测试' },
        createdBy: testAdmin._id
      });
      
      const supplier = await SupplierService.getSupplier(created._id);
      
      expect(supplier).toBeDefined();
      expect(supplier._id.toString()).toBe(created._id.toString());
    });
    
    test('should throw error if supplier not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        SupplierService.getSupplier(fakeId)
      ).rejects.toThrow();
    });
    
    test('should throw error if supplier is removed', async () => {
      const created = await Supplier.create({
        supplierNumber: 'SUP-REMOVED-002',
        companyName: { zh: '已删除' },
        removed: true,
        createdBy: testAdmin._id
      });
      
      await expect(
        SupplierService.getSupplier(created._id)
      ).rejects.toThrow();
    });
  });
  
  describe('updateSupplier', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-UPDATE-001',
        companyName: { zh: '原始名称' },
        type: 'manufacturer',
        createdBy: testAdmin._id
      });
    });
    
    test('should update supplier data', async () => {
      const updateData = {
        companyName: { zh: '更新名称', en: 'Updated Name' },
        abbreviation: 'UPD'
      };
      
      const updated = await SupplierService.updateSupplier(
        supplier._id,
        updateData,
        testAdmin._id
      );
      
      expect(updated.companyName.zh).toBe('更新名称');
      expect(updated.companyName.en).toBe('Updated Name');
      expect(updated.abbreviation).toBe('UPD');
    });
    
    test('should log update in audit log', async () => {
      const AuditLogService = require('../../src/services/AuditLogService');
      
      await SupplierService.updateSupplier(
        supplier._id,
        { abbreviation: 'TEST' },
        testAdmin._id
      );
      
      expect(AuditLogService.logUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'Supplier',
          entityId: supplier._id
        })
      );
    });
    
    test('should throw error if supplier not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        SupplierService.updateSupplier(fakeId, {}, testAdmin._id)
      ).rejects.toThrow('Supplier not found');
    });
  });
  
  describe('deleteSupplier', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-DELETE-001',
        companyName: { zh: '待删除' },
        createdBy: testAdmin._id
      });
    });
    
    test('should soft delete supplier', async () => {
      await SupplierService.deleteSupplier(supplier._id, testAdmin._id);
      
      const deletedSupplier = await Supplier.findById(supplier._id);
      expect(deletedSupplier.removed).toBe(true);
      expect(deletedSupplier.removedAt).toBeInstanceOf(Date);
      expect(deletedSupplier.removedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('should log deletion in audit log', async () => {
      const AuditLogService = require('../../src/services/AuditLogService');
      
      await SupplierService.deleteSupplier(supplier._id, testAdmin._id);
      
      expect(AuditLogService.logDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'Supplier',
          entityId: supplier._id
        })
      );
    });
  });
  
  describe('submitForApproval', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-SUBMIT-001',
        companyName: { zh: '待审批' },
        status: 'draft',
        createdBy: testAdmin._id
      });
    });
    
    test('should submit supplier for approval', async () => {
      const mockWorkflowInstance = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending'
      };
      
      WorkflowEngine.initiateWorkflow.mockResolvedValue(mockWorkflowInstance);
      
      const result = await SupplierService.submitForApproval(
        supplier._id,
        testAdmin._id
      );
      
      expect(WorkflowEngine.initiateWorkflow).toHaveBeenCalled();
      
      const updated = await Supplier.findById(supplier._id);
      expect(updated.status).toBe('pending_approval');
    });
    
    test('should throw error if already pending approval', async () => {
      supplier.status = 'pending_approval';
      await supplier.save();
      
      await expect(
        SupplierService.submitForApproval(supplier._id, testAdmin._id)
      ).rejects.toThrow();
    });
  });
  
  describe('approveSupplier', () => {
    let supplier;
    let workflowInstanceId;
    
    beforeEach(async () => {
      workflowInstanceId = new mongoose.Types.ObjectId();
      supplier = await Supplier.create({
        supplierNumber: 'SUP-APPROVE-001',
        companyName: { zh: '待批准' },
        status: 'pending_approval',
        createdBy: testAdmin._id
      });
      supplier.workflow.currentWorkflowId = workflowInstanceId;
      await supplier.save();
    });
    
    test('should approve supplier', async () => {
      const mockWorkflowInstance = {
        _id: workflowInstanceId,
        status: 'approved',
        currentStep: 999
      };
      
      WorkflowEngine.processApproval.mockResolvedValue(mockWorkflowInstance);
      
      await SupplierService.approveSupplier(
        supplier._id,
        testAdmin._id
      );
      
      const updated = await Supplier.findById(supplier._id);
      expect(updated.status).toBe('active');
    });
    
    test('should throw error if supplier not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        SupplierService.approveSupplier(fakeId, testAdmin._id)
      ).rejects.toThrow();
    });
  });
  
  describe('rejectSupplier', () => {
    let supplier;
    let workflowInstanceId;
    
    beforeEach(async () => {
      workflowInstanceId = new mongoose.Types.ObjectId();
      supplier = await Supplier.create({
        supplierNumber: 'SUP-REJECT-001',
        companyName: { zh: '待拒绝' },
        status: 'pending_approval',
        createdBy: testAdmin._id
      });
      supplier.workflow.currentWorkflowId = workflowInstanceId;
      await supplier.save();
    });
    
    test('should reject supplier', async () => {
      const mockWorkflowInstance = {
        _id: workflowInstanceId,
        status: 'rejected'
      };
      
      WorkflowEngine.processApproval.mockResolvedValue(mockWorkflowInstance);
      
      await SupplierService.rejectSupplier(
        supplier._id,
        testAdmin._id,
        'Missing documents'
      );
      
      const updated = await Supplier.findById(supplier._id);
      expect(updated.status).toBe('draft');
    });
  });
  
  describe('Status Change Operations', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-STATUS-001',
        companyName: { zh: '状态测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('activateSupplier should change status to active', async () => {
      const result = await SupplierService.activateSupplier(supplier._id, testAdmin._id);
      
      expect(result.status).toBe('active');
    });
    
    test('deactivateSupplier should change status to inactive', async () => {
      supplier.status = 'active';
      await supplier.save();
      
      const result = await SupplierService.deactivateSupplier(supplier._id, testAdmin._id);
      
      expect(result.status).toBe('inactive');
    });
    
    test('blacklistSupplier should change status to blacklisted', async () => {
      const result = await SupplierService.blacklistSupplier(supplier._id, testAdmin._id);
      
      expect(result.status).toBe('blacklisted');
    });
  });
  
  describe('updatePerformance', () => {
    let supplier;
    
    beforeEach(async () => {
      supplier = await Supplier.create({
        supplierNumber: 'SUP-RATING-001',
        companyName: { zh: '评分测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('should update supplier performance metrics', async () => {
      const metrics = {
        qualityRating: 4.5,
        deliveryRating: 4.0
      };
      
      const result = await SupplierService.updatePerformance(
        supplier._id,
        metrics,
        testAdmin._id
      );
      
      expect(result.performance.qualityRating).toBe(4.5);
      expect(result.performance.deliveryRating).toBe(4.0);
    });
  });
  
  describe('getStatistics', () => {
    beforeEach(async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-STATS-001',
          companyName: { zh: '统计1' },
          status: 'active',
          type: 'manufacturer',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STATS-002',
          companyName: { zh: '统计2' },
          status: 'inactive',
          type: 'distributor',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STATS-003',
          companyName: { zh: '统计3' },
          status: 'pending_approval',
          type: 'manufacturer',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should return supplier statistics', async () => {
      const stats = await SupplierService.getStatistics();
      
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.active).toBeGreaterThanOrEqual(1);
      expect(stats.inactive).toBeGreaterThanOrEqual(1);
      expect(stats.pending).toBeGreaterThanOrEqual(1);
    });
  });
});

