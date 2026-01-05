/**
 * Workflow Controller Tests
 * 
 * Integration tests for workflow management API endpoints.
 */

const workflowController = require('../../src/controllers/workflowController');
const Workflow = require('../../src/models/appModels/Workflow');
const WorkflowInstance = require('../../src/models/appModels/WorkflowInstance');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const { adminData, roleData } = require('../helpers/testData');

// Helper to create mock request/response objects
const createMockReq = (params = {}, query = {}, body = {}, admin = null) => ({
  params,
  query,
  body,
  admin
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Workflow Controller', () => {
  
  let testAdmin, testRole, testWorkflow;
  
  beforeEach(async () => {
    testRole = await Role.create(roleData.valid);
    testAdmin = await Admin.create({
      ...adminData.valid,
      roles: [testRole._id]
    });
    
    testWorkflow = await Workflow.create({
      workflowName: 'Test Workflow',
      displayName: { zh: '测试工作流', en: 'Test Workflow' },
      documentType: 'material_quotation',
      description: 'Test workflow',
      levels: [
        {
          levelNumber: 1,
          levelName: '部门审批',
          approverRoles: [testRole._id],
          approvalMode: 'any',
          isMandatory: true
        }
      ],
      isDefault: true,
      createdBy: testAdmin._id
    });
  });
  
  describe('Workflow Management', () => {
    
    describe('listWorkflows()', () => {
      
      test('should list all workflows', async () => {
        const req = createMockReq();
        const res = createMockRes();
        
        await workflowController.listWorkflows(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.any(Array),
          count: expect.any(Number)
        }));
      });
      
      test('should filter by document type', async () => {
        await Workflow.create({
          workflowName: 'PO Workflow',
          displayName: { zh: '采购订单流程', en: 'PO Workflow' },
          documentType: 'purchase_order',
          levels: [],
          createdBy: testAdmin._id
        });
        
        const req = createMockReq({}, { documentType: 'material_quotation' });
        const res = createMockRes();
        
        await workflowController.listWorkflows(req, res);
        
        const response = res.json.mock.calls[0][0];
        expect(response.data.every(
          w => w.documentType === 'material_quotation'
        )).toBe(true);
      });
      
      test('should filter for active workflows only', async () => {
        await Workflow.create({
          workflowName: 'Inactive Workflow',
          displayName: { zh: '未激活流程', en: 'Inactive Workflow' },
          documentType: 'pre_payment',
          levels: [],
          isActive: false,
          createdBy: testAdmin._id
        });
        
        const req = createMockReq({}, { activeOnly: 'true' });
        const res = createMockRes();
        
        await workflowController.listWorkflows(req, res);
        
        const response = res.json.mock.calls[0][0];
        expect(response.data.every(w => w.isActive)).toBe(true);
      });
      
    });
    
    describe('getWorkflow()', () => {
      
      test('should return workflow by ID', async () => {
        const req = createMockReq({ id: testWorkflow._id });
        const res = createMockRes();
        
        await workflowController.getWorkflow(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            workflowName: testWorkflow.workflowName
          })
        }));
      });
      
      test('should return 404 for non-existent workflow', async () => {
        const mongoose = require('mongoose');
        const fakeId = new mongoose.Types.ObjectId();
        
        const req = createMockReq({ id: fakeId });
        const res = createMockRes();
        
        await workflowController.getWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
      });
      
    });
    
    describe('createWorkflow()', () => {
      
      test('should create new workflow', async () => {
        const req = createMockReq({}, {}, {
          workflowName: 'New Workflow',
          displayName: { zh: '新工作流', en: 'New Workflow' },
          documentType: 'purchase_order',
          description: 'Test workflow',
          levels: [
            {
              levelNumber: 1,
              levelName: '审批',
              approverRoles: [testRole._id],
              approvalMode: 'any'
            }
          ]
        }, testAdmin);
        const res = createMockRes();
        
        await workflowController.createWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Workflow created successfully'
        }));
        
        // Verify audit log
        const logs = await AuditLog.find({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Workflow'
        });
        expect(logs.length).toBeGreaterThan(0);
      });
      
      test('should return 400 if workflowName missing', async () => {
        const req = createMockReq({}, {}, {
          documentType: 'test'
        }, testAdmin);
        const res = createMockRes();
        
        await workflowController.createWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
      });
      
    });
    
    describe('updateWorkflow()', () => {
      
      test('should update workflow', async () => {
        const req = createMockReq(
          { id: testWorkflow._id },
          {},
          { description: 'Updated description' },
          testAdmin
        );
        const res = createMockRes();
        
        await workflowController.updateWorkflow(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Workflow updated successfully'
        }));
      });
      
      test('should return 404 for non-existent workflow', async () => {
        const mongoose = require('mongoose');
        const fakeId = new mongoose.Types.ObjectId();
        
        const req = createMockReq(
          { id: fakeId },
          {},
          { description: 'Updated' },
          testAdmin
        );
        const res = createMockRes();
        
        await workflowController.updateWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
      });
      
    });
    
    describe('deleteWorkflow()', () => {
      
      test('should soft delete workflow', async () => {
        const req = createMockReq({ id: testWorkflow._id }, {}, {}, testAdmin);
        const res = createMockRes();
        
        await workflowController.deleteWorkflow(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Workflow deleted successfully'
        }));
        
        // Verify soft delete
        const deletedWorkflow = await Workflow.findById(testWorkflow._id);
        expect(deletedWorkflow.removed).toBe(true);
        expect(deletedWorkflow.isActive).toBe(false);
      });
      
    });
    
  });
  
  describe('Workflow Instance Management', () => {
    
    let testInstance;
    
    beforeEach(async () => {
      testInstance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'material_quotation',
        documentId: testAdmin._id, // Using admin ID as dummy document ID
        initiatedBy: testAdmin._id,
        submittedBy: testAdmin._id,
        status: 'pending',
        currentLevel: 1,
        requiredLevels: [1], // Array of level numbers
        submittedAt: new Date()
      });
    });
    
    describe('listInstances()', () => {
      
      test('should list workflow instances', async () => {
        const req = createMockReq();
        const res = createMockRes();
        
        await workflowController.listInstances(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.any(Array),
          count: expect.any(Number)
        }));
      });
      
      test('should filter by document type', async () => {
        const req = createMockReq({}, { documentType: 'material_quotation' });
        const res = createMockRes();
        
        await workflowController.listInstances(req, res);
        
        const response = res.json.mock.calls[0][0];
        expect(response.data.every(
          i => i.documentType === 'material_quotation'
        )).toBe(true);
      });
      
      test('should filter by status', async () => {
        const req = createMockReq({}, { status: 'pending' });
        const res = createMockRes();
        
        await workflowController.listInstances(req, res);
        
        const response = res.json.mock.calls[0][0];
        expect(response.data.every(i => i.status === 'pending')).toBe(true);
      });
      
    });
    
    describe('getInstance()', () => {
      
      test('should return instance by ID', async () => {
        const req = createMockReq({ id: testInstance._id });
        const res = createMockRes();
        
        await workflowController.getInstance(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: testInstance.status
          })
        }));
      });
      
      test('should return 404 for non-existent instance', async () => {
        const mongoose = require('mongoose');
        const fakeId = new mongoose.Types.ObjectId();
        
        const req = createMockReq({ id: fakeId });
        const res = createMockRes();
        
        await workflowController.getInstance(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
      });
      
    });
    
    describe('initiateWorkflow()', () => {
      
      test('should initiate workflow', async () => {
        const mongoose = require('mongoose');
        const dummyDocId = new mongoose.Types.ObjectId();
        
        const req = createMockReq({}, {}, {
          documentType: 'material_quotation',
          documentId: dummyDocId,
          metadata: { amount: 5000 }
        }, testAdmin);
        const res = createMockRes();
        
        await workflowController.initiateWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Workflow initiated successfully'
        }));
      });
      
      test('should return 400 if documentType missing', async () => {
        const mongoose = require('mongoose');
        const dummyDocId = new mongoose.Types.ObjectId();
        
        const req = createMockReq({}, {}, {
          documentId: dummyDocId
        }, testAdmin);
        const res = createMockRes();
        
        await workflowController.initiateWorkflow(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
      });
      
    });
    
    describe('approve()', () => {
      
      test('should process approval', async () => {
        const req = createMockReq(
          { id: testInstance._id },
          {},
          { comments: 'Approved' },
          testAdmin
        );
        const res = createMockRes();
        
        await workflowController.approve(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Approval processed successfully'
        }));
      });
      
    });
    
    describe('reject()', () => {
      
      test('should process rejection', async () => {
        const req = createMockReq(
          { id: testInstance._id },
          {},
          { comments: 'Rejected' },
          testAdmin
        );
        const res = createMockRes();
        
        await workflowController.reject(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Rejection processed successfully'
        }));
      });
      
    });
    
    describe('cancel()', () => {
      
      test('should cancel workflow', async () => {
        const req = createMockReq(
          { id: testInstance._id },
          {},
          { reason: 'No longer needed' },
          testAdmin
        );
        const res = createMockRes();
        
        await workflowController.cancel(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Workflow cancelled successfully'
        }));
      });
      
    });
    
    describe('getMyPendingApprovals()', () => {
      
      test('should get pending approvals for user', async () => {
        const req = createMockReq({}, {}, {}, testAdmin);
        const res = createMockRes();
        
        await workflowController.getMyPendingApprovals(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.any(Array),
          count: expect.any(Number)
        }));
      });
      
    });
    
  });
  
});

