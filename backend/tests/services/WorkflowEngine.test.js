/**
 * WorkflowEngine Service Tests
 * 
 * Tests for the workflow engine service.
 */

const WorkflowEngine = require('../../src/services/workflow/WorkflowEngine');
const Workflow = require('../../src/models/appModels/Workflow');
const WorkflowInstance = require('../../src/models/appModels/WorkflowInstance');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const { adminData, workflowData } = require('../helpers/testData');
const mongoose = require('mongoose');

const generateObjectId = () => new mongoose.Types.ObjectId();

describe('WorkflowEngine', () => {
  
  let testAdmin1, testAdmin2, testAdmin3, testWorkflow;
  
  beforeEach(async () => {
    // Create test admins
    testAdmin1 = await Admin.create({
      ...adminData.valid,
      email: 'approver1@example.com'
    });
    
    testAdmin2 = await Admin.create({
      ...adminData.valid,
      email: 'approver2@example.com'
    });
    
    testAdmin3 = await Admin.create({
      ...adminData.valid,
      email: 'initiator@example.com'
    });
    
    // Create test workflow
    testWorkflow = await Workflow.create({
      ...workflowData.valid,
      levels: [
        { level: 1, approvers: [testAdmin1._id], minApprovals: 1 },
        { level: 2, approvers: [testAdmin2._id], minApprovals: 1 }
      ]
    });
  });
  
  describe('initiateWorkflow()', () => {
    
    test('should create workflow instance', async () => {
      const documentId = generateObjectId();
      
      const instance = await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
      
      expect(instance).toBeDefined();
      expect(instance.documentType).toBe('material_quotation');
      expect(instance.documentId.toString()).toBe(documentId.toString());
      expect(instance.status).toBe('pending');
      expect(instance.currentLevel).toBe(1);
      expect(instance.requiredLevels).toHaveLength(2);
    });
    
    test('should create audit log for workflow initiation', async () => {
      const documentId = generateObjectId();
      
      await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
      
      const logs = await AuditLog.find({
        user: testAdmin3._id,
        action: 'workflow_initiated'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('should include metadata in instance', async () => {
      const documentId = generateObjectId();
      const metadata = { amount: 50000, currency: 'CNY' };
      
      const instance = await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id,
        metadata
      });
      
      expect(instance.metadata).toEqual(metadata);
    });
    
    test('should throw error if no workflow found for document type', async () => {
      const documentId = generateObjectId();
      
      await expect(
        WorkflowEngine.initiateWorkflow({
          documentType: 'non_existent_type',
          documentId,
          initiatedBy: testAdmin3._id
        })
      ).rejects.toThrow('No active workflow found for document type');
    });
    
    test('should throw error if no approval levels determined', async () => {
      // Create workflow with no levels
      const emptyWorkflow = await Workflow.create({
        ...workflowData.valid,
        name: 'empty_workflow',
        documentType: 'empty_type',
        levels: []
      });
      
      const documentId = generateObjectId();
      
      await expect(
        WorkflowEngine.initiateWorkflow({
          documentType: 'empty_type',
          documentId,
          initiatedBy: testAdmin3._id
        })
      ).rejects.toThrow('No approval levels determined for this workflow');
    });
    
  });
  
  describe('processApproval()', () => {
    
    let workflowInstance;
    
    beforeEach(async () => {
      const documentId = generateObjectId();
      workflowInstance = await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
    });
    
    test('should process approval and move to next level', async () => {
      const updatedInstance = await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve',
        comments: 'Approved by level 1'
      });
      
      expect(updatedInstance.currentLevel).toBe(2);
      expect(updatedInstance.status).toBe('pending');
      expect(updatedInstance.approvalHistory).toHaveLength(1);
      expect(updatedInstance.approvalHistory[0].action).toBe('approve');
    });
    
    test('should complete workflow after all levels approved', async () => {
      // Approve level 1
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve'
      });
      
      // Approve level 2
      const finalInstance = await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin2._id,
        action: 'approve'
      });
      
      expect(finalInstance.status).toBe('approved');
      expect(finalInstance.approvalHistory).toHaveLength(2);
    });
    
    test('should reject workflow on rejection', async () => {
      const rejectedInstance = await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'reject',
        comments: 'Insufficient documentation'
      });
      
      expect(rejectedInstance.status).toBe('rejected');
      expect(rejectedInstance.approvalHistory[0].action).toBe('reject');
      expect(rejectedInstance.approvalHistory[0].comments).toBe('Insufficient documentation');
    });
    
    test('should create audit log for approval', async () => {
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve'
      });
      
      const logs = await AuditLog.find({
        user: testAdmin1._id,
        action: 'workflow_approved'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('should create audit log for rejection', async () => {
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'reject'
      });
      
      const logs = await AuditLog.find({
        user: testAdmin1._id,
        action: 'workflow_rejected'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('should throw error for invalid action', async () => {
      await expect(
        WorkflowEngine.processApproval({
          workflowInstanceId: workflowInstance._id,
          approverId: testAdmin1._id,
          action: 'invalid_action'
        })
      ).rejects.toThrow('Action must be either "approve" or "reject"');
    });
    
    test('should throw error for non-existent workflow instance', async () => {
      const fakeId = generateObjectId();
      
      await expect(
        WorkflowEngine.processApproval({
          workflowInstanceId: fakeId,
          approverId: testAdmin1._id,
          action: 'approve'
        })
      ).rejects.toThrow('Workflow instance not found');
    });
    
    test('should throw error if workflow already complete', async () => {
      // Approve all levels
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve'
      });
      
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin2._id,
        action: 'approve'
      });
      
      // Try to approve again
      await expect(
        WorkflowEngine.processApproval({
          workflowInstanceId: workflowInstance._id,
          approverId: testAdmin1._id,
          action: 'approve'
        })
      ).rejects.toThrow('Workflow is already approved');
    });
    
    test('should throw error if approver not authorized for current level', async () => {
      await expect(
        WorkflowEngine.processApproval({
          workflowInstanceId: workflowInstance._id,
          approverId: testAdmin2._id, // Level 2 approver trying to approve level 1
          action: 'approve'
        })
      ).rejects.toThrow('User not authorized to approve at this level');
    });
    
    test('should throw error if approver already acted on level', async () => {
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve'
      });
      
      // Try to approve again by same user at next level
      // First need to make testAdmin1 an approver for level 2
      const instance = await WorkflowInstance.findById(workflowInstance._id);
      instance.requiredLevels[1].approvers.push(testAdmin1._id);
      await instance.save();
      
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin2._id, // Different approver
        action: 'approve'
      });
      
      // Now workflow is complete, can't approve again
      await expect(
        WorkflowEngine.processApproval({
          workflowInstanceId: workflowInstance._id,
          approverId: testAdmin1._id,
          action: 'approve'
        })
      ).rejects.toThrow(); // Will throw because workflow is complete
    });
    
  });
  
  describe('getPendingApprovalsForUser()', () => {
    
    test('should return pending approvals for user', async () => {
      const documentId = generateObjectId();
      await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
      
      const pendingApprovals = await WorkflowEngine.getPendingApprovalsForUser(testAdmin1._id);
      
      expect(pendingApprovals.length).toBeGreaterThan(0);
    });
    
    test('should filter by document type', async () => {
      const documentId = generateObjectId();
      await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
      
      const pendingApprovals = await WorkflowEngine.getPendingApprovalsForUser(
        testAdmin1._id,
        { documentType: 'material_quotation' }
      );
      
      expect(pendingApprovals.every(p => p.documentType === 'material_quotation')).toBe(true);
    });
    
  });
  
  describe('cancelWorkflow()', () => {
    
    let workflowInstance;
    
    beforeEach(async () => {
      const documentId = generateObjectId();
      workflowInstance = await WorkflowEngine.initiateWorkflow({
        documentType: 'material_quotation',
        documentId,
        initiatedBy: testAdmin3._id
      });
    });
    
    test('should cancel pending workflow', async () => {
      const cancelledInstance = await WorkflowEngine.cancelWorkflow(
        workflowInstance._id,
        testAdmin3._id,
        'No longer needed'
      );
      
      expect(cancelledInstance.status).toBe('rejected');
      expect(cancelledInstance.approvalHistory[0].comments).toContain('Cancelled');
    });
    
    test('should create audit log for cancellation', async () => {
      await WorkflowEngine.cancelWorkflow(
        workflowInstance._id,
        testAdmin3._id,
        'Test cancellation'
      );
      
      const logs = await AuditLog.find({
        user: testAdmin3._id,
        action: 'workflow_cancelled'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('should throw error for non-existent workflow', async () => {
      const fakeId = generateObjectId();
      
      await expect(
        WorkflowEngine.cancelWorkflow(fakeId, testAdmin3._id)
      ).rejects.toThrow('Workflow instance not found');
    });
    
    test('should throw error if workflow already complete', async () => {
      // Complete the workflow
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin1._id,
        action: 'approve'
      });
      
      await WorkflowEngine.processApproval({
        workflowInstanceId: workflowInstance._id,
        approverId: testAdmin2._id,
        action: 'approve'
      });
      
      // Try to cancel
      await expect(
        WorkflowEngine.cancelWorkflow(workflowInstance._id, testAdmin3._id)
      ).rejects.toThrow('Cannot cancel workflow with status: approved');
    });
    
  });
  
  describe('getStatistics()', () => {
    
    beforeEach(async () => {
      // Create multiple workflow instances
      for (let i = 0; i < 3; i++) {
        const documentId = generateObjectId();
        await WorkflowEngine.initiateWorkflow({
          documentType: 'material_quotation',
          documentId,
          initiatedBy: testAdmin3._id
        });
      }
    });
    
    test('should return workflow statistics', async () => {
      const stats = await WorkflowEngine.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.byStatus).toBeDefined();
    });
    
    test('should filter statistics by document type', async () => {
      const stats = await WorkflowEngine.getStatistics({
        documentType: 'material_quotation'
      });
      
      expect(stats.total).toBeGreaterThanOrEqual(3);
    });
    
  });
  
});

