/**
 * ApprovalRouter Service Tests
 * 
 * Tests for the approval routing logic.
 */

const ApprovalRouter = require('../../src/services/workflow/ApprovalRouter');
const Workflow = require('../../src/models/appModels/Workflow');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const { adminData, workflowData } = require('../helpers/testData');

describe('ApprovalRouter', () => {
  
  let testAdmin1, testAdmin2, testWorkflow;
  
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
    
    // Create test workflow
    testWorkflow = await Workflow.create({
      ...workflowData.valid,
      levels: [
        { level: 1, approvers: [testAdmin1._id], minApprovals: 1 },
        { level: 2, approvers: [testAdmin2._id], minApprovals: 1 }
      ]
    });
  });
  
  describe('determineApprovalPath()', () => {
    
    test('should return default levels when no routing rules', async () => {
      const levels = await ApprovalRouter.determineApprovalPath(testWorkflow, {});
      
      expect(levels).toHaveLength(2);
      expect(levels[0].level).toBe(1);
      expect(levels[1].level).toBe(2);
    });
    
    test('should validate and filter out invalid approvers', async () => {
      const mongoose = require('mongoose');
      const invalidId = new mongoose.Types.ObjectId();
      
      const workflow = await Workflow.create({
        ...workflowData.valid,
        name: 'test_invalid_approvers',
        levels: [
          { level: 1, approvers: [testAdmin1._id, invalidId], minApprovals: 1 }
        ]
      });
      
      const levels = await ApprovalRouter.determineApprovalPath(workflow, {});
      
      expect(levels).toHaveLength(1);
      expect(levels[0].approvers).toHaveLength(1);
      expect(levels[0].approvers[0].toString()).toBe(testAdmin1._id.toString());
    });
    
    test('should filter out levels with no valid approvers', async () => {
      const mongoose = require('mongoose');
      const invalidId = new mongoose.Types.ObjectId();
      
      const workflow = await Workflow.create({
        ...workflowData.valid,
        name: 'test_no_valid_approvers',
        levels: [
          { level: 1, approvers: [invalidId], minApprovals: 1 },
          { level: 2, approvers: [testAdmin1._id], minApprovals: 1 }
        ]
      });
      
      const levels = await ApprovalRouter.determineApprovalPath(workflow, {});
      
      expect(levels).toHaveLength(1);
      expect(levels[0].level).toBe(2);
    });
    
  });
  
  describe('evaluateRoutingRules()', () => {
    
    test('should return matching rule levels', async () => {
      const routingRules = [
        {
          conditions: { amount: { $lte: 10000 } },
          levels: [{ level: 1, approvers: [testAdmin1._id], minApprovals: 1 }]
        },
        {
          conditions: { amount: { $gt: 10000 } },
          levels: [
            { level: 1, approvers: [testAdmin1._id], minApprovals: 1 },
            { level: 2, approvers: [testAdmin2._id], minApprovals: 1 }
          ]
        }
      ];
      
      const levels = await ApprovalRouter.evaluateRoutingRules(routingRules, { amount: 5000 });
      
      expect(levels).toHaveLength(1);
      expect(levels[0].level).toBe(1);
    });
    
    test('should return first matching rule', async () => {
      const routingRules = [
        {
          conditions: { department: 'Procurement' },
          levels: [{ level: 1, approvers: [testAdmin1._id], minApprovals: 1 }]
        },
        {
          conditions: { department: 'Procurement' },
          levels: [{ level: 1, approvers: [testAdmin2._id], minApprovals: 1 }]
        }
      ];
      
      const levels = await ApprovalRouter.evaluateRoutingRules(routingRules, { department: 'Procurement' });
      
      expect(levels).toHaveLength(1);
      expect(levels[0].approvers[0].toString()).toBe(testAdmin1._id.toString());
    });
    
    test('should return empty array if no rules match', async () => {
      const routingRules = [
        {
          conditions: { department: 'IT' },
          levels: [{ level: 1, approvers: [testAdmin1._id], minApprovals: 1 }]
        }
      ];
      
      const levels = await ApprovalRouter.evaluateRoutingRules(routingRules, { department: 'Procurement' });
      
      expect(levels).toHaveLength(0);
    });
    
  });
  
  describe('evaluateRule()', () => {
    
    test('should match exact values', () => {
      const conditions = { department: 'Procurement' };
      const context = { department: 'Procurement' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should not match different values', () => {
      const conditions = { department: 'IT' };
      const context = { department: 'Procurement' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(false);
    });
    
    test('should match $gte operator', () => {
      const conditions = { amount: { $gte: 10000 } };
      const context = { amount: 15000 };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match $lte operator', () => {
      const conditions = { amount: { $lte: 10000 } };
      const context = { amount: 5000 };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match $gt operator', () => {
      const conditions = { amount: { $gt: 10000 } };
      const context = { amount: 10001 };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match $lt operator', () => {
      const conditions = { amount: { $lt: 10000 } };
      const context = { amount: 9999 };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match $in operator', () => {
      const conditions = { department: { $in: ['Procurement', 'Finance'] } };
      const context = { department: 'Procurement' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match $nin operator', () => {
      const conditions = { department: { $nin: ['IT', 'HR'] } };
      const context = { department: 'Procurement' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should match multiple conditions', () => {
      const conditions = {
        amount: { $lte: 50000 },
        department: 'Procurement'
      };
      const context = {
        amount: 30000,
        department: 'Procurement'
      };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
    test('should fail if any condition not met', () => {
      const conditions = {
        amount: { $lte: 50000 },
        department: 'IT'
      };
      const context = {
        amount: 30000,
        department: 'Procurement'
      };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(false);
    });
    
    test('should fail if context missing required key', () => {
      const conditions = { amount: { $lte: 50000 } };
      const context = { department: 'Procurement' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(false);
    });
    
    test('should match empty conditions', () => {
      const conditions = {};
      const context = { anything: 'value' };
      
      const result = ApprovalRouter.evaluateRule(conditions, context);
      
      expect(result).toBe(true);
    });
    
  });
  
  describe('validateApprovers()', () => {
    
    test('should return valid approver IDs', async () => {
      const approverIds = [testAdmin1._id, testAdmin2._id];
      
      const validIds = await ApprovalRouter.validateApprovers(approverIds);
      
      expect(validIds).toHaveLength(2);
      expect(validIds.map(id => id.toString())).toContain(testAdmin1._id.toString());
      expect(validIds.map(id => id.toString())).toContain(testAdmin2._id.toString());
    });
    
    test('should filter out invalid IDs', async () => {
      const mongoose = require('mongoose');
      const invalidId = new mongoose.Types.ObjectId();
      const approverIds = [testAdmin1._id, invalidId];
      
      const validIds = await ApprovalRouter.validateApprovers(approverIds);
      
      expect(validIds).toHaveLength(1);
      expect(validIds[0].toString()).toBe(testAdmin1._id.toString());
    });
    
    test('should return empty array for empty input', async () => {
      const validIds = await ApprovalRouter.validateApprovers([]);
      
      expect(validIds).toHaveLength(0);
    });
    
    test('should return empty array for null input', async () => {
      const validIds = await ApprovalRouter.validateApprovers(null);
      
      expect(validIds).toHaveLength(0);
    });
    
  });
  
  describe('getApproversByRole()', () => {
    
    test('should return admins with specified role', async () => {
      const role = await Role.create({
        name: 'test_approver_role',
        displayName: { zh: '测试', en: 'Test' }
      });
      
      testAdmin1.roles = [role._id];
      await testAdmin1.save();
      
      const approvers = await ApprovalRouter.getApproversByRole('test_approver_role');
      
      expect(approvers).toHaveLength(1);
      expect(approvers[0].toString()).toBe(testAdmin1._id.toString());
    });
    
    test('should return empty array for non-existent role', async () => {
      const approvers = await ApprovalRouter.getApproversByRole('non_existent_role');
      
      expect(approvers).toHaveLength(0);
    });
    
  });
  
  describe('getApproversByDepartment()', () => {
    
    test('should return admins in specified department', async () => {
      testAdmin1.department = 'Procurement';
      await testAdmin1.save();
      
      testAdmin2.department = 'Finance';
      await testAdmin2.save();
      
      const approvers = await ApprovalRouter.getApproversByDepartment('Procurement');
      
      expect(approvers).toHaveLength(1);
      expect(approvers[0].toString()).toBe(testAdmin1._id.toString());
    });
    
    test('should return empty array for non-existent department', async () => {
      const approvers = await ApprovalRouter.getApproversByDepartment('IT');
      
      expect(approvers).toHaveLength(0);
    });
    
  });
  
});

