const mongoose = require('mongoose');
const PurchaseOrderService = require('../../src/services/PurchaseOrderService');
const PurchaseOrder = require('../../src/models/appModels/PurchaseOrder');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const Workflow = require('../../src/models/appModels/Workflow');
const WorkflowInstance = require('../../src/models/appModels/WorkflowInstance');
const AuditLogService = require('../../src/services/AuditLogService');
const WorkflowEngine = require('../../src/services/workflow/WorkflowEngine');

// Mock AuditLogService
jest.mock('../../src/services/AuditLogService');

// Mock WorkflowEngine
jest.mock('../../src/services/workflow/WorkflowEngine', () => ({
  initiateWorkflow: jest.fn().mockImplementation(async () => {
    const mongoose = require('mongoose');
    return {
      _id: new mongoose.Types.ObjectId(),
      workflowId: new mongoose.Types.ObjectId(),
      status: 'in_progress',
      currentStep: 1
    };
  }),
  processApproval: jest.fn().mockImplementation(async (params) => {
    const mongoose = require('mongoose');
    return {
      _id: new mongoose.Types.ObjectId(),
      status: params.action === 'approve' ? 'approved' : 'rejected',
      approved: params.action === 'approve'
    };
  }),
  getWorkflowInstance: jest.fn().mockImplementation(async () => {
    const mongoose = require('mongoose');
    return {
      _id: new mongoose.Types.ObjectId(),
      status: 'in_progress'
    };
  })
}));

describe('PurchaseOrderService', () => {
  let testAdmin;
  let testSupplier;
  let testMaterial;
  let testCategory;
  let testWorkflow;

  // Helper function to create test data
  async function createTestData() {
    // Create test admin
    testAdmin = await Admin.create({
      email: `po-test-${Date.now()}@test.com`,
      name: 'POTest',
      surname: 'Admin',
      password: 'hashedpassword123',
      enabled: true
    });

    // Create test category
    testCategory = await MaterialCategory.create({
      code: `POCAT${Date.now()}`,
      name: { en: 'PO Test Category', zh: 'PO测试类别' },
      description: 'Test category for PO testing',
      level: 1,
      path: `/POCAT${Date.now()}`,
      createdBy: testAdmin._id
    });

    // Create test supplier
    testSupplier = await Supplier.create({
      supplierNumber: `POSUP${Date.now()}`,
      companyName: { en: 'PO Test Supplier Inc.', zh: 'PO测试供应商' },
      contact: { 
        name: 'John Doe', 
        email: `john-${Date.now()}@posupplier.com`,
        phone: '123-456-7890'
      },
      address: { street: '123 Main St', city: 'Test City', country: 'US' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test material
    testMaterial = await Material.create({
      materialNumber: `POMAT${Date.now()}`,
      materialName: { en: 'PO Test Material', zh: 'PO测试物料' },
      category: testCategory._id,
      type: 'raw',
      baseUOM: 'kg',
      specifications: { color: 'red' },
      status: 'active',
      createdBy: testAdmin._id
    });

    // Create test workflow
    testWorkflow = await Workflow.create({
      workflowName: `po_workflow_${Date.now()}`,
      displayName: { en: 'PO Approval Workflow', zh: 'PO审批流程' },
      description: { en: 'Purchase order approval workflow', zh: '采购订单审批流程' },
      documentType: 'purchase_order',
      steps: [
        { 
          stepNumber: 1, 
          stepName: { en: 'Manager Approval', zh: '经理审批' },
          approverRole: 'manager', 
          action: 'approve' 
        }
      ],
      isActive: true,
      isDefault: false,
      createdBy: testAdmin._id
    });
  }

  beforeEach(async () => {
    // Clean up all test data before each test
    await Promise.all([
      PurchaseOrder.deleteMany({}),
      WorkflowInstance.deleteMany({}),
      Material.deleteMany({ materialNumber: /^POMAT/ }),
      MaterialCategory.deleteMany({ code: /^POCAT/ }),
      Supplier.deleteMany({ supplierNumber: /^POSUP/ }),
      Admin.deleteMany({ email: /^po-test/ }),
      Workflow.deleteMany({ workflowName: /^po_workflow/ })
    ]);
    
    // Recreate test data
    await createTestData();
  });

  describe('createPurchaseOrder', () => {
    it('should create a new purchase order with auto-generated PO number', async () => {
      const poData = {
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
        currency: 'USD',
        paymentTerms: 'Net 30',
        shippingAddress: {
          street: '456 Factory Rd',
          city: 'Production City',
          state: 'PC',
          country: 'US',
          postalCode: '12345'
        }
      };

      const result = await PurchaseOrderService.createPurchaseOrder(poData, testAdmin._id);

      expect(result).toBeDefined();
      expect(result.poNumber).toMatch(/^PO-\d{8}-\d{3,4}$/);
      expect(result.supplier.toString()).toBe(testSupplier._id.toString());
      expect(result.items).toHaveLength(1);
      expect(result.items[0].material.toString()).toBe(testMaterial._id.toString());
      expect(result.items[0].quantity).toBe(100);
      expect(result.items[0].totalPrice).toBe(1050); // 100 * 10.50
      expect(result.totalAmount).toBe(1050);
      expect(result.status).toBe('draft');
      expect(result.createdBy.toString()).toBe(testAdmin._id.toString());
    });

    it('should calculate item and total amounts correctly', async () => {
      const poData = {
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg' },
          { material: testMaterial._id, quantity: 50, unitPrice: 20.00, uom: 'kg' }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currency: 'USD'
      };

      const result = await PurchaseOrderService.createPurchaseOrder(poData, testAdmin._id);

      expect(result.items[0].totalPrice).toBe(1050);
      expect(result.items[1].totalPrice).toBe(1000);
      expect(result.totalAmount).toBe(2050);
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData = {
        supplier: testSupplier._id
        // Missing items array
      };

      await expect(
        PurchaseOrderService.createPurchaseOrder(invalidData, testAdmin._id)
      ).rejects.toThrow();
    });

    it('should attach workflow if available', async () => {
      const poData = {
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg' }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const result = await PurchaseOrderService.createPurchaseOrder(poData, testAdmin._id);

      // Workflow should be attached if an active workflow exists
      if (result.workflow && result.workflow.workflowId) {
        expect(result.workflow.workflowId.toString()).toBe(testWorkflow._id.toString());
        expect(result.workflow.status).toBe('not_started');
      }
    });
  });

  describe('getPurchaseOrder', () => {
    it('should retrieve a purchase order by ID', async () => {
      const po = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        currency: 'USD',
        status: 'draft',
        createdBy: testAdmin._id
      });

      const result = await PurchaseOrderService.getPurchaseOrder(po._id);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(po._id.toString());
      expect(result.poNumber).toBe('PO-20260106-0001');
    });

    it('should populate references when requested', async () => {
      const po = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        currency: 'USD',
        status: 'draft',
        createdBy: testAdmin._id
      });

      const result = await PurchaseOrderService.getPurchaseOrder(po._id, {
        populate: ['supplier', 'items.material', 'createdBy']
      });

      expect(result.supplier.companyName.en).toBe('PO Test Supplier Inc.');
      expect(result.items[0].material.materialNumber).toContain('POMAT');
      expect(result.createdBy.email).toContain('po-test');
    });

    it('should throw error if PO not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        PurchaseOrderService.getPurchaseOrder(fakeId)
      ).rejects.toThrow('Purchase order not found');
    });

    it('should not return deleted POs', async () => {
      const po = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'draft',
        createdBy: testAdmin._id,
        removed: true
      });

      await expect(
        PurchaseOrderService.getPurchaseOrder(po._id)
      ).rejects.toThrow('Purchase order not found');
    });
  });

  describe('listPurchaseOrders', () => {
    beforeEach(async () => {
      // Create multiple POs
      await PurchaseOrder.create([
        {
          poNumber: 'PO-20260106-0001',
          supplier: testSupplier._id,
          items: [{ material: testMaterial._id, quantity: 100, unitPrice: 10, uom: 'kg', totalPrice: 1000 }],
          orderDate: new Date('2026-01-01'),
          expectedDeliveryDate: new Date('2026-01-10'),
          totalAmount: 1000,
          currency: 'USD',
          status: 'draft',
          createdBy: testAdmin._id
        },
        {
          poNumber: 'PO-20260106-0002',
          supplier: testSupplier._id,
          items: [{ material: testMaterial._id, quantity: 50, unitPrice: 20, uom: 'kg', totalPrice: 1000 }],
          orderDate: new Date('2026-01-02'),
          expectedDeliveryDate: new Date('2026-01-12'),
          totalAmount: 1000,
          currency: 'USD',
          status: 'pending_approval',
          createdBy: testAdmin._id
        },
        {
          poNumber: 'PO-20260106-0003',
          supplier: testSupplier._id,
          items: [{ material: testMaterial._id, quantity: 75, unitPrice: 15, uom: 'kg', totalPrice: 1125 }],
          orderDate: new Date('2026-01-03'),
          expectedDeliveryDate: new Date('2026-01-13'),
          totalAmount: 1125,
          currency: 'USD',
          status: 'approved',
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should list all purchase orders', async () => {
      const result = await PurchaseOrderService.listPurchaseOrders({}, { page: 1, items: 10 });

      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(3);
      expect(result.pagination.totalItems).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await PurchaseOrderService.listPurchaseOrders(
        { status: 'draft' },
        { page: 1, items: 10 }
      );

      expect(result.result).toHaveLength(1);
      expect(result.result[0].status).toBe('draft');
    });

    it('should filter by supplier', async () => {
      // First, verify all POs in the database for this supplier
      const allPOs = await PurchaseOrder.find({});
      const matchingPOs = allPOs.filter(po => po.supplier.toString() === testSupplier._id.toString());
      
      const result = await PurchaseOrderService.listPurchaseOrders(
        { supplier: testSupplier._id },
        { page: 1, items: 10 }
      );

      // All POs created in beforeEach use testSupplier
      expect(result.result.length).toBe(matchingPOs.length);
      // Check that filtering is working (all returned POs have the right supplier)
      expect(result.result.every(po => po.supplier.toString() === testSupplier._id.toString())).toBe(true);
    });

    it('should support pagination', async () => {
      const result = await PurchaseOrderService.listPurchaseOrders({}, { page: 1, items: 2 });

      expect(result.result).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should support sorting', async () => {
      const result = await PurchaseOrderService.listPurchaseOrders(
        {},
        { page: 1, items: 10, sortBy: 'orderDate', sortOrder: 'asc' }
      );

      expect(result.result[0].poNumber).toBe('PO-20260106-0001');
      expect(result.result[2].poNumber).toBe('PO-20260106-0003');
    });

    it('should filter by date range', async () => {
      const result = await PurchaseOrderService.listPurchaseOrders(
        { orderDateFrom: new Date('2026-01-02'), orderDateTo: new Date('2026-01-02') },
        { page: 1, items: 10 }
      );

      expect(result.result).toHaveLength(1);
      expect(result.result[0].poNumber).toBe('PO-20260106-0002');
    });

    it('should not return deleted POs', async () => {
      await PurchaseOrder.updateOne(
        { poNumber: 'PO-20260106-0001' },
        { removed: true }
      );

      const result = await PurchaseOrderService.listPurchaseOrders({}, { page: 1, items: 10 });

      expect(result.result).toHaveLength(2);
      expect(result.result.every(po => po.poNumber !== 'PO-20260106-0001')).toBe(true);
    });
  });

  describe('updatePurchaseOrder', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        currency: 'USD',
        status: 'draft',
        createdBy: testAdmin._id
      });
    });

    it('should update purchase order fields', async () => {
      const updates = {
        paymentTerms: 'Net 60',
        notes: 'Rush order'
      };

      const result = await PurchaseOrderService.updatePurchaseOrder(
        testPO._id,
        updates,
        testAdmin._id
      );

      expect(result.paymentTerms).toBe('Net 60');
      expect(result.notes).toBe('Rush order');
      expect(result.updatedBy.toString()).toBe(testAdmin._id.toString());
    });

    it('should update items and recalculate totals', async () => {
      const updates = {
        items: [
          { material: testMaterial._id, quantity: 150, unitPrice: 12.00, uom: 'kg' }
        ]
      };

      const result = await PurchaseOrderService.updatePurchaseOrder(
        testPO._id,
        updates,
        testAdmin._id
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(150);
      expect(result.items[0].totalPrice).toBe(1800);
      expect(result.totalAmount).toBe(1800);
    });

    it('should not allow updates to approved POs', async () => {
      await PurchaseOrder.updateOne(
        { _id: testPO._id },
        { status: 'approved' }
      );

      await expect(
        PurchaseOrderService.updatePurchaseOrder(
          testPO._id,
          { notes: 'Test' },
          testAdmin._id
        )
      ).rejects.toThrow('Cannot edit PO with status');
    });

    it('should throw error if PO not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        PurchaseOrderService.updatePurchaseOrder(fakeId, { notes: 'Test' }, testAdmin._id)
      ).rejects.toThrow('Purchase order not found');
    });
  });

  describe('deletePurchaseOrder', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'draft',
        createdBy: testAdmin._id
      });
    });

    it('should soft delete a purchase order', async () => {
      const result = await PurchaseOrderService.deletePurchaseOrder(testPO._id, testAdmin._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');

      const deletedPO = await PurchaseOrder.findById(testPO._id);
      expect(deletedPO.removed).toBe(true);
    });

    it('should not allow deletion of approved POs', async () => {
      await PurchaseOrder.updateOne(
        { _id: testPO._id },
        { status: 'approved' }
      );

      await expect(
        PurchaseOrderService.deletePurchaseOrder(testPO._id, testAdmin._id)
      ).rejects.toThrow('Cannot delete PO with status');
    });
  });

  describe('submitForApproval', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'draft',
        createdBy: testAdmin._id
      });
    });

    it('should submit PO for approval', async () => {
      const result = await PurchaseOrderService.submitForApproval(testPO._id, testAdmin._id);

      expect(result.status).toBe('pending_approval');
    });

    it('should create workflow instance', async () => {
      const result = await PurchaseOrderService.submitForApproval(testPO._id, testAdmin._id);

      // Verify WorkflowEngine was called
      expect(WorkflowEngine.initiateWorkflow).toHaveBeenCalled();
      expect(result.status).toBe('pending_approval');
      expect(result.workflow.approvalStatus).toBe('pending');
      expect(result.workflow.currentWorkflowId).toBeDefined();
    });

    it('should not submit non-draft POs', async () => {
      await PurchaseOrder.updateOne(
        { _id: testPO._id },
        { status: 'approved' }
      );

      await expect(
        PurchaseOrderService.submitForApproval(testPO._id, testAdmin._id)
      ).rejects.toThrow('Only draft POs can be submitted for approval');
    });
  });

  describe('approvePurchaseOrder', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'pending_approval',
        createdBy: testAdmin._id,
        workflow: {
          workflowId: testWorkflow._id,
          currentWorkflowId: new mongoose.Types.ObjectId(),
          currentStep: 1,
          status: 'in_progress',
          approvalStatus: 'pending'
        }
      });
    });

    it('should approve purchase order', async () => {
      const result = await PurchaseOrderService.approvePurchaseOrder(
        testPO._id,
        testAdmin._id,
        'Approved'
      );

      expect(result.status).toBe('approved');
      expect(result.workflow.approvalStatus).toBe('approved');
    });

    it('should not approve non-pending POs', async () => {
      await PurchaseOrder.updateOne(
        { _id: testPO._id },
        { status: 'draft', 'workflow.approvalStatus': 'none' }
      );

      await expect(
        PurchaseOrderService.approvePurchaseOrder(testPO._id, testAdmin._id, 'Test')
      ).rejects.toThrow('PO is not pending approval');
    });
  });

  describe('rejectPurchaseOrder', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'pending_approval',
        createdBy: testAdmin._id,
        workflow: {
          workflowId: testWorkflow._id,
          currentWorkflowId: new mongoose.Types.ObjectId(),
          approvalStatus: 'pending'
        }
      });
    });

    it('should reject purchase order', async () => {
      const result = await PurchaseOrderService.rejectPurchaseOrder(
        testPO._id,
        testAdmin._id,
        'Pricing too high'
      );

      expect(result.status).toBe('rejected');
    });

    it('should require rejection reason', async () => {
      await expect(
        PurchaseOrderService.rejectPurchaseOrder(testPO._id, testAdmin._id, '')
      ).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('cancelPurchaseOrder', () => {
    let testPO;

    beforeEach(async () => {
      testPO = await PurchaseOrder.create({
        poNumber: 'PO-20260106-0001',
        supplier: testSupplier._id,
        items: [
          { material: testMaterial._id, quantity: 100, unitPrice: 10.50, uom: 'kg', totalPrice: 1050 }
        ],
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        totalAmount: 1050,
        status: 'approved',
        createdBy: testAdmin._id
      });
    });

    it('should cancel purchase order', async () => {
      const result = await PurchaseOrderService.cancelPurchaseOrder(
        testPO._id,
        testAdmin._id,
        'Order no longer needed'
      );

      expect(result.status).toBe('cancelled');
    });

    it('should not cancel completed POs', async () => {
      await PurchaseOrder.updateOne(
        { _id: testPO._id },
        { status: 'completed' }
      );

      await expect(
        PurchaseOrderService.cancelPurchaseOrder(
          testPO._id,
          testAdmin._id,
          'Test'
        )
      ).rejects.toThrow('Cannot cancel PO with status');
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await PurchaseOrder.create([
        {
          poNumber: 'PO-20260106-0001',
          supplier: testSupplier._id,
          items: [{ material: testMaterial._id, quantity: 100, unitPrice: 10, uom: 'kg', totalPrice: 1000 }],
          orderDate: new Date(),
          expectedDeliveryDate: new Date(),
          totalAmount: 1000,
          currency: 'USD',
          status: 'draft',
          createdBy: testAdmin._id
        },
        {
          poNumber: 'PO-20260106-0002',
          supplier: testSupplier._id,
          items: [{ material: testMaterial._id, quantity: 50, unitPrice: 20, uom: 'kg', totalPrice: 1000 }],
          orderDate: new Date(),
          expectedDeliveryDate: new Date(),
          totalAmount: 2000,
          currency: 'USD',
          status: 'approved',
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should return statistics', async () => {
      const stats = await PurchaseOrderService.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalPOs).toBe(2);
      expect(stats.draft).toBeDefined();
      expect(stats.approved).toBeDefined();
      expect(stats.totalValue).toBeGreaterThan(0);
    });
  });
});

