/**
 * Permission Model Unit Tests
 * 
 * Tests for Permission model validation, methods, and behavior.
 */

const mongoose = require('mongoose');
const Permission = require('../../src/models/coreModels/Permission');
const { permissionData } = require('../helpers/testData');

describe('Permission Model', () => {
  
  describe('Schema Validation', () => {
    
    test('should create a valid permission', async () => {
      const permission = new Permission(permissionData.valid);
      const savedPermission = await permission.save();
      
      expect(savedPermission._id).toBeDefined();
      expect(savedPermission.resource).toBe(permissionData.valid.resource);
      expect(savedPermission.action).toBe(permissionData.valid.action);
      expect(savedPermission.scope).toBe(permissionData.valid.scope);
      expect(savedPermission.removed).toBe(false);
      expect(savedPermission.created).toBeDefined();
    });
    
    test('should require resource field', async () => {
      const permission = new Permission({
        action: 'create',
        scope: 'own'
      });
      
      await expect(permission.save()).rejects.toThrow();
    });
    
    test('should require action field', async () => {
      const permission = new Permission({
        resource: 'supplier',
        scope: 'own'
      });
      
      await expect(permission.save()).rejects.toThrow();
    });
    
    test('should default scope to "own"', async () => {
      const permission = await Permission.create({
        resource: 'supplier',
        action: 'create'
      });
      
      expect(permission.scope).toBe('own');
    });
    
    test('should validate action enum', async () => {
      const permission = new Permission({
        resource: 'supplier',
        action: 'invalid_action',
        scope: 'own'
      });
      
      await expect(permission.save()).rejects.toThrow();
    });
    
    test('should validate scope enum', async () => {
      const permission = new Permission({
        resource: 'supplier',
        action: 'create',
        scope: 'invalid_scope'
      });
      
      await expect(permission.save()).rejects.toThrow();
    });
    
    test('should convert resource to lowercase', async () => {
      const permission = await Permission.create({
        resource: 'SUPPLIER',
        action: 'create',
        scope: 'own'
      });
      
      expect(permission.resource).toBe('supplier');
    });
    
    test('should convert action to lowercase', async () => {
      const permission = await Permission.create({
        resource: 'supplier',
        action: 'CREATE',
        scope: 'own'
      });
      
      expect(permission.action).toBe('create');
    });
    
    test('should default scope to "own"', async () => {
      const permission = new Permission({
        resource: 'supplier',
        action: 'create'
      });
      
      expect(permission.scope).toBe('own');
    });
    
    test('should default isSystemPermission to false', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      expect(permission.isSystemPermission).toBe(false);
    });
    
    test('should default removed to false', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      expect(permission.removed).toBe(false);
    });
    
    test('should default conditions to null', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      expect(permission.conditions).toBeNull();
    });
    
  });
  
  describe('Supported Actions', () => {
    
    const validActions = [
      'create', 'read', 'update', 'delete',
      'approve', 'reject', 'export', 'import',
      'submit', 'recall', 'close', 'cancel'
    ];
    
    validActions.forEach(action => {
      test(`should accept "${action}" action`, async () => {
        const permission = await Permission.create({
          resource: 'supplier',
          action,
          scope: 'own'
        });
        
        expect(permission.action).toBe(action);
      });
    });
    
  });
  
  describe('Supported Scopes', () => {
    
    const validScopes = ['own', 'team', 'all'];
    
    validScopes.forEach(scope => {
      test(`should accept "${scope}" scope`, async () => {
        const permission = await Permission.create({
          resource: 'supplier',
          action: 'read',
          scope
        });
        
        expect(permission.scope).toBe(scope);
      });
    });
    
  });
  
  describe('Conditions', () => {
    
    test('should accept conditions object', async () => {
      const permission = await Permission.create(permissionData.withConditions);
      
      expect(permission.conditions).toBeDefined();
      expect(permission.conditions.maxAmount).toBe(100000);
      expect(permission.conditions.currency).toBe('CNY');
    });
    
    test('should accept complex conditions', async () => {
      const permission = await Permission.create({
        resource: 'purchase_order',
        action: 'approve',
        scope: 'all',
        conditions: {
          maxAmount: { $lte: 100000 },
          supplierLevel: ['A', 'B'],
          currency: 'CNY'
        }
      });
      
      expect(permission.conditions.maxAmount.$lte).toBe(100000);
      expect(permission.conditions.supplierLevel).toEqual(['A', 'B']);
    });
    
  });
  
  describe('Middleware', () => {
    
    test('should prevent deletion of system permissions', async () => {
      const permission = await Permission.create(permissionData.systemPermission);
      
      await expect(permission.deleteOne()).rejects.toThrow('Cannot delete system permission');
    });
    
    test('should allow deletion of non-system permissions', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      await expect(permission.deleteOne()).resolves.toBeDefined();
    });
    
  });
  
  describe('Virtuals', () => {
    
    test('should have permissionKey virtual', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      expect(permission.permissionKey).toBe('supplier:create:own');
    });
    
    test('should include virtuals in JSON', () => {
      const permission = new Permission(permissionData.valid);
      const json = permission.toJSON();
      
      expect(json.permissionKey).toBeDefined();
    });
    
  });
  
  describe('Static Methods', () => {
    
    test('findByResourceAction should find permissions by resource and action', async () => {
      await Permission.create({
        resource: 'supplier',
        action: 'create',
        scope: 'own'
      });
      await Permission.create({
        resource: 'supplier',
        action: 'create',
        scope: 'all'
      });
      await Permission.create({
        resource: 'supplier',
        action: 'read',
        scope: 'all'
      });
      
      const permissions = await Permission.findByResourceAction('supplier', 'create');
      
      expect(permissions).toHaveLength(2);
      expect(permissions.every(p => p.resource === 'supplier')).toBe(true);
      expect(permissions.every(p => p.action === 'create')).toBe(true);
    });
    
    test('findByResourceAction should not return removed permissions', async () => {
      await Permission.create({
        resource: 'supplier',
        action: 'create',
        scope: 'own',
        removed: true
      });
      
      const permissions = await Permission.findByResourceAction('supplier', 'create');
      
      expect(permissions).toHaveLength(0);
    });
    
    test('findActive should return only non-removed permissions', async () => {
      await Permission.create(permissionData.valid);
      await Permission.create({
        resource: 'supplier',
        action: 'delete',
        scope: 'all',
        removed: true
      });
      
      const activePermissions = await Permission.findActive();
      
      expect(activePermissions.every(p => !p.removed)).toBe(true);
    });
    
    test('checkPermission should return true if permission exists', async () => {
      await Permission.create(permissionData.valid);
      
      const exists = await Permission.checkPermission('supplier', 'create', 'own');
      
      expect(exists).toBe(true);
    });
    
    test('checkPermission should return false if permission does not exist', async () => {
      const exists = await Permission.checkPermission('supplier', 'delete', 'all');
      
      expect(exists).toBe(false);
    });
    
    test('checkPermission should return false if permission is removed', async () => {
      await Permission.create({
        ...permissionData.valid,
        removed: true
      });
      
      const exists = await Permission.checkPermission('supplier', 'create', 'own');
      
      expect(exists).toBe(false);
    });
    
  });
  
  describe('Instance Methods', () => {
    
    describe('matchesConditions', () => {
      
      test('should return true when no conditions', async () => {
        const permission = await Permission.create(permissionData.valid);
        
        const matches = permission.matchesConditions({ anything: 'value' });
        
        expect(matches).toBe(true);
      });
      
      test('should return true when conditions is empty object', async () => {
        const permission = await Permission.create({
          ...permissionData.valid,
          conditions: {}
        });
        
        const matches = permission.matchesConditions({ anything: 'value' });
        
        expect(matches).toBe(true);
      });
      
      test('should match simple equality condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { currency: 'CNY' }
        });
        
        expect(permission.matchesConditions({ currency: 'CNY' })).toBe(true);
        expect(permission.matchesConditions({ currency: 'USD' })).toBe(false);
      });
      
      test('should match array condition (in)', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { supplierLevel: ['A', 'B'] }
        });
        
        expect(permission.matchesConditions({ supplierLevel: 'A' })).toBe(true);
        expect(permission.matchesConditions({ supplierLevel: 'B' })).toBe(true);
        expect(permission.matchesConditions({ supplierLevel: 'C' })).toBe(false);
      });
      
      test('should match $gte condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { maxAmount: { $gte: 100 } }
        });
        
        expect(permission.matchesConditions({ maxAmount: 150 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 100 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 50 })).toBe(false);
      });
      
      test('should match $lte condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { maxAmount: { $lte: 100 } }
        });
        
        expect(permission.matchesConditions({ maxAmount: 50 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 100 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 150 })).toBe(false);
      });
      
      test('should match $gt condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { maxAmount: { $gt: 100 } }
        });
        
        expect(permission.matchesConditions({ maxAmount: 150 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 100 })).toBe(false);
      });
      
      test('should match $lt condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { maxAmount: { $lt: 100 } }
        });
        
        expect(permission.matchesConditions({ maxAmount: 50 })).toBe(true);
        expect(permission.matchesConditions({ maxAmount: 100 })).toBe(false);
      });
      
      test('should match $eq condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { status: { $eq: 'active' } }
        });
        
        expect(permission.matchesConditions({ status: 'active' })).toBe(true);
        expect(permission.matchesConditions({ status: 'inactive' })).toBe(false);
      });
      
      test('should match $ne condition', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: { status: { $ne: 'deleted' } }
        });
        
        expect(permission.matchesConditions({ status: 'active' })).toBe(true);
        expect(permission.matchesConditions({ status: 'deleted' })).toBe(false);
      });
      
      test('should match multiple conditions (AND logic)', async () => {
        const permission = await Permission.create({
          ...permissionData.withConditions,
          conditions: {
            currency: 'CNY',
            maxAmount: { $lte: 100000 },
            supplierLevel: ['A', 'B']
          }
        });
        
        // All conditions match
        expect(permission.matchesConditions({
          currency: 'CNY',
          maxAmount: 50000,
          supplierLevel: 'A'
        })).toBe(true);
        
        // One condition fails
        expect(permission.matchesConditions({
          currency: 'USD',
          maxAmount: 50000,
          supplierLevel: 'A'
        })).toBe(false);
        
        // Another condition fails
        expect(permission.matchesConditions({
          currency: 'CNY',
          maxAmount: 150000,
          supplierLevel: 'A'
        })).toBe(false);
      });
      
    });
    
  });
  
});

