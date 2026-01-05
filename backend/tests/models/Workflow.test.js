/**
 * Workflow Model Unit Tests
 * 
 * Tests for Workflow model validation, routing rules, and methods.
 */

const mongoose = require('mongoose');
const Workflow = require('../../src/models/appModels/Workflow');
const Role = require('../../src/models/coreModels/Role');
const Admin = require('../../src/models/coreModels/Admin');
const { workflowData, roleData, adminData, generateObjectId } = require('../helpers/testData');

describe('Workflow Model', () => {
  
  let testRole1, testRole2, testAdmin;
  
  beforeEach(async () => {
    testAdmin = await Admin.create(adminData.valid);
    testRole1 = await Role.create({
      ...roleData.valid,
      name: 'procurement_manager'
    });
    testRole2 = await Role.create({
      ...roleData.valid,
      name: 'general_manager'
    });
  }, 15000); // Increase timeout to 15 seconds
  
  describe('Schema Validation', () => {
    
    test('should create a valid workflow', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        isDefault: false, // Avoid validation check
        levels: [
          {
            ...workflowData.valid.levels[0],
            approverRoles: [testRole1._id]
          }
        ],
        createdBy: testAdmin._id
      });
      
      expect(workflow._id).toBeDefined();
      expect(workflow.workflowName).toBe(workflowData.valid.workflowName);
      expect(workflow.documentType).toBe('purchase_order');
      expect(workflow.isActive).toBe(true);
      expect(workflow.removed).toBe(false);
    });
    
    test('should require workflowName field', async () => {
      const workflow = new Workflow({
        displayName: { zh: '测试', en: 'Test' },
        documentType: 'purchase_order',
        levels: []
      });
      
      await expect(workflow.save()).rejects.toThrow();
    });
    
    test('should require displayName.zh field', async () => {
      const workflow = new Workflow({
        workflowName: 'test',
        displayName: { en: 'Test' },
        documentType: 'purchase_order',
        levels: []
      });
      
      await expect(workflow.save()).rejects.toThrow();
    });
    
    test('should require documentType field', async () => {
      const workflow = new Workflow({
        workflowName: 'test',
        displayName: { zh: '测试', en: 'Test' },
        levels: []
      });
      
      await expect(workflow.save()).rejects.toThrow();
    });
    
    test('should validate documentType enum', async () => {
      const workflow = new Workflow({
        workflowName: 'test',
        displayName: { zh: '测试', en: 'Test' },
        documentType: 'invalid_type',
        levels: []
      });
      
      await expect(workflow.save()).rejects.toThrow();
    });
    
    test('should accept valid documentTypes', async () => {
      const validTypes = ['supplier', 'material_quotation', 'purchase_order', 'pre_payment'];
      
      for (const type of validTypes) {
        const workflow = await Workflow.create({
          workflowName: `test_${type}`,
          displayName: { zh: '测试', en: 'Test' },
          documentType: type,
          levels: [],
          isDefault: false
        });
        
        expect(workflow.documentType).toBe(type);
      }
    });
    
    test('should default isActive to true', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [],
        isDefault: false
      });
      
      expect(workflow.isActive).toBe(true);
    });
    
    test('should default isDefault to false', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        isDefault: undefined, // Let it use the default
        levels: []
      });
      
      expect(workflow.isDefault).toBe(false);
    });
    
    test('should default removed to false', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: []
      });
      
      expect(workflow.removed).toBe(false);
    });
    
    test('should default allowRecall to true', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: []
      });
      
      expect(workflow.allowRecall).toBe(true);
    });
    
    test('should default onRejection to return_to_submitter', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: []
      });
      
      expect(workflow.onRejection).toBe('return_to_submitter');
    });
    
  });
  
  describe('Levels Configuration', () => {
    
    test('should accept levels array', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [
          {
            levelNumber: 1,
            levelName: 'Procurement Manager',
            approverRoles: [testRole1._id],
            approvalMode: 'any',
            isMandatory: true
          }
        ]
      });
      
      expect(workflow.levels).toHaveLength(1);
      expect(workflow.levels[0].levelNumber).toBe(1);
      expect(workflow.levels[0].approvalMode).toBe('any');
    });
    
    test('should default approvalMode to "any"', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [
          {
            levelNumber: 1,
            levelName: 'Test',
            approverRoles: [testRole1._id],
            isMandatory: true
          }
        ]
      });
      
      expect(workflow.levels[0].approvalMode).toBe('any');
    });
    
    test('should default isMandatory to true', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [
          {
            levelNumber: 1,
            levelName: 'Test',
            approverRoles: [testRole1._id],
            approvalMode: 'any'
          }
        ]
      });
      
      expect(workflow.levels[0].isMandatory).toBe(true);
    });
    
    test('should validate level numbers are sequential', async () => {
      const workflow = new Workflow({
        ...workflowData.valid,
        levels: [
          {
            levelNumber: 1,
            levelName: 'Level 1',
            approverRoles: [testRole1._id]
          },
          {
            levelNumber: 3,  // Skip level 2
            levelName: 'Level 3',
            approverRoles: [testRole2._id]
          }
        ]
      });
      
      await expect(workflow.save()).rejects.toThrow('Level numbers must be sequential');
    });
    
    test('should accept sequential levels', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [
          {
            levelNumber: 1,
            levelName: 'Level 1',
            approverRoles: [testRole1._id]
          },
          {
            levelNumber: 2,
            levelName: 'Level 2',
            approverRoles: [testRole2._id]
          }
        ]
      });
      
      expect(workflow.levels).toHaveLength(2);
    });
    
  });
  
  describe('Routing Rules', () => {
    
    test('should accept routing rules', async () => {
      const workflow = await Workflow.create({
        ...workflowData.withRoutingRules,
        levels: workflowData.withRoutingRules.levels.map(l => ({
          ...l,
          approverRoles: [testRole1._id]
        }))
      });
      
      expect(workflow.routingRules).toHaveLength(1);
      expect(workflow.routingRules[0].conditionType).toBe('amount');
      expect(workflow.routingRules[0].operator).toBe('gte');
      expect(workflow.routingRules[0].value).toBe(50000);
    });
    
    test('should validate routing rule operators', async () => {
      const validOperators = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne', 'in', 'not_in'];
      
      for (const operator of validOperators) {
        const workflow = await Workflow.create({
          workflowName: `test_${operator}`,
          displayName: { zh: '测试', en: 'Test' },
          documentType: 'purchase_order',
          levels: [],
          routingRules: [
            {
              conditionType: 'amount',
              operator,
              value: 1000,
              targetLevels: [2]
            }
          ],
          isDefault: false
        });
        
        expect(workflow.routingRules[0].operator).toBe(operator);
      }
    });
    
  });
  
  describe('Middleware', () => {
    
    test('should update "updated" timestamp on save', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: []
      });
      const originalUpdated = workflow.updated;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      workflow.workflowName = 'updated_workflow';
      await workflow.save();
      
      expect(workflow.updated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
    
    test('should allow only one default workflow per document type', async () => {
      await Workflow.create({
        ...workflowData.valid,
        workflowName: 'default1',
        isDefault: true
      });
      
      const duplicate = new Workflow({
        ...workflowData.valid,
        workflowName: 'default2',
        isDefault: true
      });
      
      await expect(duplicate.save()).rejects.toThrow('A default workflow already exists');
    });
    
    test('should allow multiple non-default workflows', async () => {
      await Workflow.create({
        ...workflowData.valid,
        workflowName: 'workflow1',
        isDefault: false
      });
      
      const workflow2 = await Workflow.create({
        ...workflowData.valid,
        workflowName: 'workflow2',
        isDefault: false
      });
      
      expect(workflow2._id).toBeDefined();
    });
    
  });
  
  describe('Virtuals', () => {
    
    test('should have totalLevels virtual', async () => {
      const workflow = await Workflow.create({
        ...workflowData.valid,
        levels: [
          { levelNumber: 1, levelName: 'L1', approverRoles: [testRole1._id] },
          { levelNumber: 2, levelName: 'L2', approverRoles: [testRole2._id] }
        ]
      });
      
      expect(workflow.totalLevels).toBe(2);
    });
    
    test('should include virtuals in JSON', () => {
      const workflow = new Workflow(workflowData.valid);
      const json = workflow.toJSON();
      
      expect(json.totalLevels).toBeDefined();
    });
    
  });
  
  describe('Instance Methods', () => {
    
    describe('getMandatoryLevels', () => {
      
      test('should return mandatory levels', async () => {
        const workflow = await Workflow.create({
          ...workflowData.valid,
          levels: [
            { levelNumber: 1, levelName: 'L1', approverRoles: [testRole1._id], isMandatory: true },
            { levelNumber: 2, levelName: 'L2', approverRoles: [testRole2._id], isMandatory: false },
            { levelNumber: 3, levelName: 'L3', approverRoles: [testRole1._id], isMandatory: true }
          ]
        });
        
        const mandatory = workflow.getMandatoryLevels();
        
        expect(mandatory).toEqual([1, 3]);
      });
      
      test('should return empty array if no mandatory levels', async () => {
        const workflow = await Workflow.create({
          ...workflowData.valid,
          levels: [
            { levelNumber: 1, levelName: 'L1', approverRoles: [testRole1._id], isMandatory: false }
          ]
        });
        
        const mandatory = workflow.getMandatoryLevels();
        
        expect(mandatory).toEqual([]);
      });
      
    });
    
    describe('evaluateRoutingRules', () => {
      
      test('should evaluate amount-based routing rules (gte)', async () => {
        const workflow = await Workflow.create({
          ...workflowData.withRoutingRules,
          levels: workflowData.withRoutingRules.levels.map(l => ({
            ...l,
            approverRoles: [testRole1._id]
          }))
        });
        
        const levels1 = workflow.evaluateRoutingRules({ amount: 60000 });
        const levels2 = workflow.evaluateRoutingRules({ amount: 30000 });
        
        expect(levels1).toContain(2);
        expect(levels1).toContain(3);
        expect(levels2).toEqual([]);
      });
      
      test('should evaluate equality condition', async () => {
        const workflow = await Workflow.create({
          workflowName: 'test_eq',
          displayName: { zh: '测试', en: 'Test' },
          documentType: 'supplier',
          levels: [
            { levelNumber: 1, levelName: 'L1', approverRoles: [testRole1._id] },
            { levelNumber: 2, levelName: 'L2', approverRoles: [testRole2._id] }
          ],
          routingRules: [
            {
              conditionType: 'supplier_level',
              operator: 'eq',
              value: 'A',
              targetLevels: [2]
            }
          ]
        });
        
        const levels1 = workflow.evaluateRoutingRules({ supplier_level: 'A' });
        const levels2 = workflow.evaluateRoutingRules({ supplier_level: 'B' });
        
        expect(levels1).toContain(2);
        expect(levels2).toEqual([]);
      });
      
      test('should evaluate "in" condition', async () => {
        const workflow = await Workflow.create({
          workflowName: 'test_in',
          displayName: { zh: '测试', en: 'Test' },
          documentType: 'material_quotation',
          levels: [
            { levelNumber: 1, levelName: 'L1', approverRoles: [testRole1._id] },
            { levelNumber: 2, levelName: 'L2', approverRoles: [testRole2._id] }
          ],
          routingRules: [
            {
              conditionType: 'material_category',
              operator: 'in',
              value: ['Electronics', 'Chemicals'],
              targetLevels: [2]
            }
          ]
        });
        
        const levels1 = workflow.evaluateRoutingRules({ material_category: 'Electronics' });
        const levels2 = workflow.evaluateRoutingRules({ material_category: 'Office Supplies' });
        
        expect(levels1).toContain(2);
        expect(levels2).toEqual([]);
      });
      
    });
    
    describe('getRequiredLevels', () => {
      
      test('should return mandatory levels plus conditional levels', async () => {
        const workflow = await Workflow.create({
          ...workflowData.withRoutingRules,
          levels: workflowData.withRoutingRules.levels.map(l => ({
            ...l,
            approverRoles: [testRole1._id]
          }))
        });
        
        const levels = workflow.getRequiredLevels({ amount: 60000 });
        
        expect(levels).toContain(1);  // Mandatory
        expect(levels).toContain(2);  // From routing rule
        expect(levels).toContain(3);  // From routing rule
      });
      
      test('should return only mandatory if no routing rules match', async () => {
        const workflow = await Workflow.create({
          ...workflowData.withRoutingRules,
          levels: workflowData.withRoutingRules.levels.map(l => ({
            ...l,
            approverRoles: [testRole1._id]
          }))
        });
        
        const levels = workflow.getRequiredLevels({ amount: 10000 });
        
        expect(levels).toEqual([1]);
      });
      
    });
    
    describe('getLevelConfig', () => {
      
      test('should return level configuration', async () => {
        const workflow = await Workflow.create({
          ...workflowData.valid,
          levels: [
            {
              levelNumber: 1,
              levelName: 'Procurement Manager',
              approverRoles: [testRole1._id],
              approvalMode: 'any',
              isMandatory: true
            }
          ]
        });
        
        const config = workflow.getLevelConfig(1);
        
        expect(config.levelName).toBe('Procurement Manager');
        expect(config.approvalMode).toBe('any');
      });
      
      test('should return undefined for non-existent level', async () => {
        const workflow = await Workflow.create({
          ...workflowData.valid,
          levels: []
        });
        
        const config = workflow.getLevelConfig(5);
        
        expect(config).toBeUndefined();
      });
      
    });
    
  });
  
  describe('Static Methods', () => {
    
    describe('findActive', () => {
      
      test('should return only active workflows', async () => {
        await Workflow.create({
          ...workflowData.valid,
          isActive: true,
          isDefault: false
        });
        await Workflow.create({
          workflowName: 'inactive',
          displayName: { zh: '非活动', en: 'Inactive' },
          documentType: 'supplier',
          levels: [],
          isActive: false
        });
        
        const active = await Workflow.findActive();
        
        expect(active).toHaveLength(1);
        expect(active[0].workflowName).toBe(workflowData.valid.workflowName);
      });
      
      test('should not return removed workflows', async () => {
        await Workflow.create({
          ...workflowData.valid,
          isActive: true,
          removed: true,
          isDefault: false
        });
        
        const active = await Workflow.findActive();
        
        expect(active).toHaveLength(0);
      });
      
    });
    
    describe('findDefaultForDocumentType', () => {
      
      test('should find default workflow', async () => {
        const workflow = await Workflow.create({
          ...workflowData.valid,
          isDefault: true
        });
        
        const found = await Workflow.findDefaultForDocumentType('purchase_order');
        
        expect(found._id.toString()).toBe(workflow._id.toString());
      });
      
      test('should return null if no default workflow', async () => {
        const found = await Workflow.findDefaultForDocumentType('supplier');
        
        expect(found).toBeNull();
      });
      
    });
    
    describe('findByDocumentType', () => {
      
      test('should find all workflows for document type', async () => {
        await Workflow.create({
          ...workflowData.valid,
          workflowName: 'workflow1',
          isDefault: true
        });
        await Workflow.create({
          ...workflowData.valid,
          workflowName: 'workflow2',
          isDefault: false
        });
        
        const workflows = await Workflow.findByDocumentType('purchase_order');
        
        expect(workflows).toHaveLength(2);
      });
      
      test('should sort by isDefault descending', async () => {
        await Workflow.create({
          ...workflowData.valid,
          workflowName: 'workflow1',
          isDefault: false
        });
        await Workflow.create({
          ...workflowData.valid,
          workflowName: 'workflow2',
          isDefault: true
        });
        
        const workflows = await Workflow.findByDocumentType('purchase_order');
        
        expect(workflows[0].workflowName).toBe('workflow2');  // Default first
      });
      
    });
    
  });
  
});

