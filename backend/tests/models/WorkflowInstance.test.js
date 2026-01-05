/**
 * WorkflowInstance Model Unit Tests
 * 
 * Tests for WorkflowInstance model validation, tracking, and methods.
 */

const mongoose = require('mongoose');
const WorkflowInstance = require('../../src/models/appModels/WorkflowInstance');
const Workflow = require('../../src/models/appModels/Workflow');
const Role = require('../../src/models/coreModels/Role');
const Admin = require('../../src/models/coreModels/Admin');
const { workflowData, roleData, adminData, workflowInstanceData, generateObjectId } = require('../helpers/testData');

describe('WorkflowInstance Model', () => {
  
  let testWorkflow, testAdmin, testRole;
  
  beforeEach(async () => {
    testAdmin = await Admin.create(adminData.valid);
    testRole = await Role.create(roleData.valid);
    testWorkflow = await Workflow.create({
      ...workflowData.valid,
      isDefault: false, // Avoid default workflow validation
      levels: [
        {
          levelNumber: 1,
          levelName: 'Level 1',
          approverRoles: [testRole._id],
          approvalMode: 'any',
          isMandatory: true
        },
        {
          levelNumber: 2,
          levelName: 'Level 2',
          approverRoles: [testRole._id],
          approvalMode: 'any',
          isMandatory: false
        }
      ]
    });
  }, 15000); // Increase timeout to 15 seconds
  
  describe('Schema Validation', () => {
    
    test('should create a valid workflow instance', async () => {
      const instance = await WorkflowInstance.create({
        ...workflowInstanceData.valid,
        workflow: testWorkflow._id,
        documentId: generateObjectId(),
        submittedBy: testAdmin._id
      });
      
      expect(instance._id).toBeDefined();
      expect(instance.workflow.toString()).toBe(testWorkflow._id.toString());
      expect(instance.documentType).toBe('purchase_order');
      expect(instance.status).toBe('pending');
      expect(instance.currentLevel).toBe(1);
    });
    
    test('should require workflow field', async () => {
      const instance = new WorkflowInstance({
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should require documentType field', async () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentId: generateObjectId(),
        submittedBy: testAdmin._id
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should require documentId field', async () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        submittedBy: testAdmin._id
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should require submittedBy field', async () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId()
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should default currentLevel to 0', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2]
      });
      
      expect(instance.currentLevel).toBe(0);
    });
    
    test('should default status to pending', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2]
      });
      
      expect(instance.status).toBe('pending');
    });
    
    test('should validate status enum', async () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        status: 'invalid_status',
        requiredLevels: [1]
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should accept valid statuses', async () => {
      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
      
      for (const status of validStatuses) {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          status,
          requiredLevels: [1]
        });
        
        expect(instance.status).toBe(status);
      }
    });
    
    test('should enforce unique documentType + documentId', async () => {
      const documentId = generateObjectId();
      
      await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId,
        submittedBy: testAdmin._id,
        requiredLevels: [1]
      });
      
      const duplicate = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId,
        submittedBy: testAdmin._id,
        requiredLevels: [1]
      });
      
      await expect(duplicate.save()).rejects.toThrow();
    });
    
    test('should allow same documentId for different documentTypes', async () => {
      const documentId = generateObjectId();
      
      await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId,
        submittedBy: testAdmin._id,
        requiredLevels: [1]
      });
      
      const instance2 = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'supplier',
        documentId,
        submittedBy: testAdmin._id,
        requiredLevels: [1]
      });
      
      expect(instance2._id).toBeDefined();
    });
    
  });
  
  describe('Approval History', () => {
    
    test('should accept approval history array', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        approvalHistory: [
          {
            level: 1,
            approver: testAdmin._id,
            action: 'approve',
            comments: 'Approved',
            timestamp: new Date()
          }
        ]
      });
      
      expect(instance.approvalHistory).toHaveLength(1);
      expect(instance.approvalHistory[0].action).toBe('approve');
    });
    
    test('should validate approval action enum', async () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        approvalHistory: [
          {
            level: 1,
            approver: testAdmin._id,
            action: 'invalid_action',
            timestamp: new Date()
          }
        ]
      });
      
      await expect(instance.save()).rejects.toThrow();
    });
    
    test('should accept valid approval actions', async () => {
      const validActions = ['approve', 'reject', 'recall', 'request_changes'];
      
      for (const action of validActions) {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          approvalHistory: [
            {
              level: 1,
              approver: testAdmin._id,
              action,
              timestamp: new Date()
            }
          ]
        });
        
        expect(instance.approvalHistory[0].action).toBe(action);
      }
    });
    
  });
  
  describe('Required and Completed Levels', () => {
    
    test('should accept requiredLevels array', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2, 3]
      });
      
      expect(instance.requiredLevels).toEqual([1, 2, 3]);
    });
    
    test('should accept completedLevels array', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: [1]
      });
      
      expect(instance.completedLevels).toEqual([1]);
    });
    
  });
  
  describe('Middleware', () => {
    
    test('should update "updated" timestamp on save', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1]
      });
      const originalUpdated = instance.updated;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      instance.currentLevel = 1;
      await instance.save();
      
      expect(instance.updated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
    
    test('should update statistics on save', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: [1],
        approvalHistory: [
          {
            level: 1,
            approver: testAdmin._id,
            action: 'approve',
            timestamp: new Date()
          }
        ]
      });
      
      expect(instance.stats.totalLevels).toBe(2);
      expect(instance.stats.completedLevelsCount).toBe(1);
      expect(instance.stats.totalApprovers).toBe(1);
    });
    
    test('should calculate duration when completed', async () => {
      const submittedAt = new Date(Date.now() - 3600000); // 1 hour ago
      
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        completedLevels: [1],
        submittedAt,
        completedAt: new Date(),
        status: 'approved'
      });
      
      expect(instance.stats.durationHours).toBeGreaterThan(0.9);
      expect(instance.stats.durationHours).toBeLessThan(1.1);
    });
    
  });
  
  describe('Virtuals', () => {
    
    test('should have isComplete virtual for approved', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        status: 'approved'
      });
      
      expect(instance.isComplete).toBe(true);
    });
    
    test('should have isComplete virtual for rejected', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        status: 'rejected'
      });
      
      expect(instance.isComplete).toBe(true);
    });
    
    test('should have isComplete virtual for cancelled', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        status: 'cancelled'
      });
      
      expect(instance.isComplete).toBe(true);
    });
    
    test('should have isComplete false for pending', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1],
        status: 'pending'
      });
      
      expect(instance.isComplete).toBe(false);
    });
    
    test('should calculate progressPercentage', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2, 3, 4],
        completedLevels: [1, 2]
      });
      
      expect(instance.progressPercentage).toBe(50);
    });
    
    test('should have 0% progress with no completed levels', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: []
      });
      
      expect(instance.progressPercentage).toBe(0);
    });
    
    test('should have 100% progress when all completed', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: [1, 2]
      });
      
      expect(instance.progressPercentage).toBe(100);
    });
    
    test('should have nextLevel virtual', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2, 3],
        completedLevels: [1]
      });
      
      expect(instance.nextLevel).toBe(2);
    });
    
    test('should have nextLevel null when complete', async () => {
      const instance = await WorkflowInstance.create({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: [1, 2],
        status: 'approved'
      });
      
      expect(instance.nextLevel).toBeNull();
    });
    
    test('should include virtuals in JSON', () => {
      const instance = new WorkflowInstance({
        workflow: testWorkflow._id,
        documentType: 'purchase_order',
        documentId: generateObjectId(),
        submittedBy: testAdmin._id,
        requiredLevels: [1, 2],
        completedLevels: [1]
      });
      const json = instance.toJSON();
      
      expect(json.isComplete).toBeDefined();
      expect(json.progressPercentage).toBeDefined();
      expect(json.nextLevel).toBeDefined();
    });
    
  });
  
  describe('Instance Methods', () => {
    
    describe('recordApproval', () => {
      
      test('should record approval action', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2]
        });
        
        instance.recordApproval(1, testAdmin._id, 'approve', 'Looks good');
        await instance.save();
        
        expect(instance.approvalHistory).toHaveLength(1);
        expect(instance.approvalHistory[0].level).toBe(1);
        expect(instance.approvalHistory[0].action).toBe('approve');
        expect(instance.approvalHistory[0].comments).toBe('Looks good');
      });
      
      test('should add level to completedLevels on approve', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2]
        });
        
        instance.recordApproval(1, testAdmin._id, 'approve', 'Approved');
        await instance.save();
        
        expect(instance.completedLevels).toContain(1);
      });
      
      test('should not add to completedLevels on reject', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2]
        });
        
        instance.recordApproval(1, testAdmin._id, 'reject', 'Rejected');
        await instance.save();
        
        expect(instance.completedLevels).not.toContain(1);
      });
      
      test('should not duplicate completedLevels', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1]
        });
        
        instance.recordApproval(1, testAdmin._id, 'approve', 'Approved again');
        await instance.save();
        
        expect(instance.completedLevels.filter(l => l === 1)).toHaveLength(1);
      });
      
      test('should accept metadata', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1]
        });
        
        instance.recordApproval(1, testAdmin._id, 'approve', 'OK', { ip: '127.0.0.1' });
        await instance.save();
        
        expect(instance.approvalHistory[0].metadata).toEqual({ ip: '127.0.0.1' });
      });
      
    });
    
    describe('isLevelCompleted', () => {
      
      test('should return true if level completed', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1]
        });
        
        expect(instance.isLevelCompleted(1)).toBe(true);
      });
      
      test('should return false if level not completed', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1]
        });
        
        expect(instance.isLevelCompleted(2)).toBe(false);
      });
      
    });
    
    describe('areAllLevelsCompleted', () => {
      
      test('should return true when all levels completed', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1, 2]
        });
        
        expect(instance.areAllLevelsCompleted()).toBe(true);
      });
      
      test('should return false when not all levels completed', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1]
        });
        
        expect(instance.areAllLevelsCompleted()).toBe(false);
      });
      
      test('should return true when no levels required', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [],
          completedLevels: []
        });
        
        expect(instance.areAllLevelsCompleted()).toBe(true);
      });
      
    });
    
    describe('getPendingApprovers', () => {
      
      test('should return approvers for current level', async () => {
        const admin1 = await Admin.create({
          email: 'approver1@example.com',
          name: 'Approver1',
          enabled: true,
          roles: [testRole._id]
        });
        
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 1
        });
        
        const approvers = await instance.getPendingApprovers();
        
        expect(approvers.length).toBeGreaterThan(0);
        expect(approvers.some(a => a._id.toString() === admin1._id.toString())).toBe(true);
      });
      
      test('should return empty array if workflow complete', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 1,
          status: 'approved'
        });
        
        const approvers = await instance.getPendingApprovers();
        
        expect(approvers).toEqual([]);
      });
      
      test('should return empty array if currentLevel is 0', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 0
        });
        
        const approvers = await instance.getPendingApprovers();
        
        expect(approvers).toEqual([]);
      });
      
    });
    
    describe('getApprovalSummary', () => {
      
      test('should return approval summary', async () => {
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1, 2],
          completedLevels: [1],
          currentLevel: 2,
          status: 'pending',
          approvalHistory: [
            {
              level: 1,
              approver: testAdmin._id,
              action: 'approve',
              timestamp: new Date()
            }
          ]
        });
        
        const summary = instance.getApprovalSummary();
        
        expect(summary.status).toBe('pending');
        expect(summary.currentLevel).toBe(2);
        expect(summary.totalLevels).toBe(2);
        expect(summary.completedLevels).toBe(1);
        expect(summary.progressPercentage).toBe(50);
        expect(summary.approvalCount).toBe(1);
      });
      
    });
    
  });
  
  describe('Static Methods', () => {
    
    describe('findPendingApprovalsForUser', () => {
      
      test('should find pending approvals for user', async () => {
        const approver = await Admin.create({
          email: 'approver@example.com',
          name: 'Approver',
          enabled: true,
          roles: [testRole._id]
        });
        
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 1,
          status: 'pending'
        });
        
        const pendingApprovals = await WorkflowInstance.findPendingApprovalsForUser(approver._id);
        
        expect(pendingApprovals.length).toBeGreaterThan(0);
      });
      
      test('should not return completed workflows', async () => {
        const approver = await Admin.create({
          email: 'approver@example.com',
          name: 'Approver',
          enabled: true,
          roles: [testRole._id]
        });
        
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 1,
          status: 'approved'
        });
        
        const pendingApprovals = await WorkflowInstance.findPendingApprovalsForUser(approver._id);
        
        expect(pendingApprovals).toHaveLength(0);
      });
      
      test('should filter by documentType', async () => {
        const approver = await Admin.create({
          email: 'approver@example.com',
          name: 'Approver',
          enabled: true,
          roles: [testRole._id]
        });
        
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          currentLevel: 1,
          status: 'pending'
        });
        
        const pendingApprovals = await WorkflowInstance.findPendingApprovalsForUser(
          approver._id,
          { documentType: 'supplier' }
        );
        
        expect(pendingApprovals).toHaveLength(0);
      });
      
      test('should respect limit option', async () => {
        const approver = await Admin.create({
          email: 'approver@example.com',
          name: 'Approver',
          enabled: true,
          roles: [testRole._id]
        });
        
        // Create multiple pending approvals
        for (let i = 0; i < 3; i++) {
          await WorkflowInstance.create({
            workflow: testWorkflow._id,
            documentType: 'purchase_order',
            documentId: generateObjectId(),
            submittedBy: testAdmin._id,
            requiredLevels: [1],
            currentLevel: 1,
            status: 'pending'
          });
        }
        
        const pendingApprovals = await WorkflowInstance.findPendingApprovalsForUser(
          approver._id,
          { limit: 2 }
        );
        
        expect(pendingApprovals.length).toBeLessThanOrEqual(2);
      });
      
    });
    
    describe('findByDocument', () => {
      
      test('should find workflow instance by document', async () => {
        const documentId = generateObjectId();
        
        const instance = await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId,
          submittedBy: testAdmin._id,
          requiredLevels: [1]
        });
        
        const found = await WorkflowInstance.findByDocument('purchase_order', documentId);
        
        expect(found._id.toString()).toBe(instance._id.toString());
      });
      
      test('should return null for non-existent document', async () => {
        const found = await WorkflowInstance.findByDocument('purchase_order', generateObjectId());
        
        expect(found).toBeNull();
      });
      
    });
    
    describe('findRecentCompletions', () => {
      
      test('should find recent completions', async () => {
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'approved',
          completedAt: new Date()
        });
        
        const completions = await WorkflowInstance.findRecentCompletions(7, 50);
        
        expect(completions).toHaveLength(1);
      });
      
      test('should not return pending workflows', async () => {
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'pending'
        });
        
        const completions = await WorkflowInstance.findRecentCompletions(7, 50);
        
        expect(completions).toHaveLength(0);
      });
      
      test('should respect days parameter', async () => {
        const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'approved',
          completedAt: oldDate
        });
        
        const completions = await WorkflowInstance.findRecentCompletions(7, 50);
        
        expect(completions).toHaveLength(0);
      });
      
    });
    
    describe('getStatistics', () => {
      
      test('should return statistics', async () => {
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'approved'
        });
        
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'rejected'
        });
        
        const stats = await WorkflowInstance.getStatistics();
        
        expect(stats.length).toBeGreaterThan(0);
        expect(stats.some(s => s._id === 'approved')).toBe(true);
        expect(stats.some(s => s._id === 'rejected')).toBe(true);
      });
      
      test('should filter by documentType', async () => {
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'purchase_order',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'approved'
        });
        
        await WorkflowInstance.create({
          workflow: testWorkflow._id,
          documentType: 'supplier',
          documentId: generateObjectId(),
          submittedBy: testAdmin._id,
          requiredLevels: [1],
          status: 'approved'
        });
        
        const stats = await WorkflowInstance.getStatistics({ documentType: 'purchase_order' });
        
        expect(stats.some(s => s._id === 'approved' && s.count === 1)).toBe(true);
      });
      
    });
    
  });
  
});

