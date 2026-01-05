/**
 * AuditLog Model Unit Tests
 * 
 * Tests for AuditLog model validation, immutability, and query methods.
 */

const mongoose = require('mongoose');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const Admin = require('../../src/models/coreModels/Admin');
const { auditLogData, adminData, generateObjectId } = require('../helpers/testData');

describe('AuditLog Model', () => {
  
  let testAdmin;
  
  beforeEach(async () => {
    // Create test admin
    testAdmin = await Admin.create(adminData.valid);
  });
  
  describe('Schema Validation', () => {
    
    test('should create a valid audit log', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      expect(auditLog._id).toBeDefined();
      expect(auditLog.user.toString()).toBe(testAdmin._id.toString());
      expect(auditLog.action).toBe('create');
      expect(auditLog.entityType).toBe('Supplier');
      expect(auditLog.timestamp).toBeDefined();
    });
    
    test('should require user field', async () => {
      const auditLog = new AuditLog({
        action: 'create',
        entityType: 'Supplier',
        entityId: generateObjectId()
      });
      
      await expect(auditLog.save()).rejects.toThrow();
    });
    
    test('should require action field', async () => {
      const auditLog = new AuditLog({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId: generateObjectId()
      });
      
      await expect(auditLog.save()).rejects.toThrow();
    });
    
    test('should require entityType field', async () => {
      const auditLog = new AuditLog({
        user: testAdmin._id,
        action: 'create',
        entityId: generateObjectId()
      });
      
      await expect(auditLog.save()).rejects.toThrow();
    });
    
    test('should require entityId field', async () => {
      const auditLog = new AuditLog({
        user: testAdmin._id,
        action: 'create',
        entityType: 'Supplier'
      });
      
      await expect(auditLog.save()).rejects.toThrow();
    });
    
    test('should validate action enum', async () => {
      const auditLog = new AuditLog({
        user: testAdmin._id,
        action: 'invalid_action',
        entityType: 'Supplier',
        entityId: generateObjectId()
      });
      
      await expect(auditLog.save()).rejects.toThrow();
    });
    
    test('should default timestamp to current date', async () => {
      const before = new Date();
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      const after = new Date();
      
      expect(auditLog.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(auditLog.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
    
    test('should default indexed to false', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      expect(auditLog.indexed).toBe(false);
    });
    
  });
  
  describe('Supported Actions', () => {
    
    const validActions = [
      'create', 'read', 'update', 'delete',
      'approve', 'reject', 'submit', 'recall',
      'export', 'import', 'login', 'logout',
      'password_change', 'permission_change', 'role_change'
    ];
    
    validActions.forEach(action => {
      test(`should accept "${action}" action`, async () => {
        const auditLog = await AuditLog.create({
          user: testAdmin._id,
          action,
          entityType: 'TestEntity',
          entityId: generateObjectId()
        });
        
        expect(auditLog.action).toBe(action);
      });
    });
    
  });
  
  describe('Changes Tracking', () => {
    
    test('should accept changes array', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.update,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      expect(auditLog.changes).toHaveLength(2);
      expect(auditLog.changes[0].field).toBe('level');
      expect(auditLog.changes[0].oldValue).toBe('B');
      expect(auditLog.changes[0].newValue).toBe('A');
    });
    
    test('should handle empty changes array for create action', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId(),
        changes: []
      });
      
      expect(auditLog.changes).toHaveLength(0);
    });
    
    test('should support mixed types in oldValue and newValue', async () => {
      const auditLog = await AuditLog.create({
        user: testAdmin._id,
        action: 'update',
        entityType: 'TestEntity',
        entityId: generateObjectId(),
        changes: [
          { field: 'status', oldValue: 'pending', newValue: 'active' },
          { field: 'amount', oldValue: 1000, newValue: 1500 },
          { field: 'enabled', oldValue: false, newValue: true },
          { field: 'tags', oldValue: ['a'], newValue: ['a', 'b'] }
        ]
      });
      
      expect(auditLog.changes).toHaveLength(4);
      expect(typeof auditLog.changes[0].oldValue).toBe('string');
      expect(typeof auditLog.changes[1].oldValue).toBe('number');
      expect(typeof auditLog.changes[2].oldValue).toBe('boolean');
      expect(Array.isArray(auditLog.changes[3].oldValue)).toBe(true);
    });
    
  });
  
  describe('Metadata', () => {
    
    test('should accept metadata object', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      expect(auditLog.metadata.ip).toBe('127.0.0.1');
      expect(auditLog.metadata.userAgent).toBe('Jest Test');
      expect(auditLog.metadata.requestId).toBe('test-123');
    });
    
    test('should accept extra metadata', async () => {
      const auditLog = await AuditLog.create({
        user: testAdmin._id,
        action: 'approve',
        entityType: 'PurchaseOrder',
        entityId: generateObjectId(),
        metadata: {
          ip: '127.0.0.1',
          extra: {
            approvalLevel: 2,
            comments: 'Approved with conditions'
          }
        }
      });
      
      expect(auditLog.metadata.extra.approvalLevel).toBe(2);
      expect(auditLog.metadata.extra.comments).toBe('Approved with conditions');
    });
    
  });
  
  describe('Immutability', () => {
    
    test('should prevent updates to existing audit logs', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      auditLog.action = 'update';
      
      await expect(auditLog.save()).rejects.toThrow('Audit logs cannot be modified');
    });
    
    test('should prevent deletion via deleteOne()', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      await expect(auditLog.deleteOne()).rejects.toThrow('Audit logs cannot be deleted');
    });
    
    test('should prevent findOneAndUpdate', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      await expect(
        AuditLog.findOneAndUpdate(
          { _id: auditLog._id },
          { action: 'update' }
        )
      ).rejects.toThrow('Audit logs cannot be modified');
    });
    
    test('should prevent updateOne', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      await expect(
        AuditLog.updateOne(
          { _id: auditLog._id },
          { action: 'update' }
        )
      ).rejects.toThrow('Audit logs cannot be modified');
    });
    
    test('should prevent updateMany', async () => {
      await AuditLog.create({
        ...auditLogData.create,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      await expect(
        AuditLog.updateMany(
          { entityType: 'Supplier' },
          { entityName: 'Modified' }
        )
      ).rejects.toThrow('Audit logs cannot be modified');
    });
    
    test('timestamp should be immutable', async () => {
      const auditLog = new AuditLog({
        user: testAdmin._id,
        action: 'create',
        entityType: 'Supplier',
        entityId: generateObjectId()
      });
      
      // Try to set timestamp to future date
      auditLog.timestamp = new Date(Date.now() + 1000000);
      await auditLog.save();
      
      // Timestamp should be set to now, not the future date
      const diff = Date.now() - auditLog.timestamp.getTime();
      expect(diff).toBeLessThan(1000); // Within 1 second
    });
    
  });
  
  describe('Static Methods', () => {
    
    describe('log()', () => {
      
      test('should create audit log entry', async () => {
        const log = await AuditLog.log({
          ...auditLogData.create,
          user: testAdmin._id,
          entityId: generateObjectId()
        });
        
        expect(log).toBeDefined();
        expect(log._id).toBeDefined();
      });
      
      test('should fail gracefully on error', async () => {
        const log = await AuditLog.log({
          // Missing required fields
          user: testAdmin._id
        });
        
        expect(log).toBeNull();
      });
      
    });
    
    describe('findByUser()', () => {
      
    test('should find logs by user', async () => {
      const entityId1 = generateObjectId();
      const entityId2 = generateObjectId();
      
      await AuditLog.create({
        user: testAdmin._id,
        action: 'create',
        entityType: 'Supplier',
        entityId: entityId1
      });
      await AuditLog.create({
        user: testAdmin._id,
        action: 'update',
        entityType: 'Supplier',
        entityId: entityId2
      });
      
      const logs = await AuditLog.findByUser(testAdmin._id);
      
      expect(logs).toHaveLength(2);
      expect(logs.every(l => {
        const userId = l.user._id ? l.user._id.toString() : l.user.toString();
        return userId === testAdmin._id.toString();
      })).toBe(true);
    });
      
      test('should filter by action', async () => {
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'update',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        
        const logs = await AuditLog.findByUser(testAdmin._id, { action: 'create' });
        
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe('create');
      });
      
      test('should filter by entityType', async () => {
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Material',
          entityId: generateObjectId()
        });
        
        const logs = await AuditLog.findByUser(testAdmin._id, { entityType: 'Supplier' });
        
        expect(logs).toHaveLength(1);
        expect(logs[0].entityType).toBe('Supplier');
      });
      
      test('should respect limit option', async () => {
        for (let i = 0; i < 10; i++) {
          await AuditLog.create({
            user: testAdmin._id,
            action: 'create',
            entityType: 'Supplier',
            entityId: generateObjectId()
          });
        }
        
        const logs = await AuditLog.findByUser(testAdmin._id, { limit: 5 });
        
        expect(logs).toHaveLength(5);
      });
      
      test('should sort by timestamp descending', async () => {
        const log1 = await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const log2 = await AuditLog.create({
          user: testAdmin._id,
          action: 'update',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        
        const logs = await AuditLog.findByUser(testAdmin._id);
        
        expect(logs[0]._id.toString()).toBe(log2._id.toString());
        expect(logs[1]._id.toString()).toBe(log1._id.toString());
      });
      
    });
    
    describe('findByEntity()', () => {
      
      test('should find logs by entity', async () => {
        const entityId = generateObjectId();
        
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Supplier',
          entityId
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'update',
          entityType: 'Supplier',
          entityId
        });
        
        const logs = await AuditLog.findByEntity('Supplier', entityId);
        
        expect(logs).toHaveLength(2);
        expect(logs.every(l => l.entityId.toString() === entityId.toString())).toBe(true);
      });
      
      test('should not return logs for different entity', async () => {
        const entityId1 = generateObjectId();
        const entityId2 = generateObjectId();
        
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Supplier',
          entityId: entityId1
        });
        
        const logs = await AuditLog.findByEntity('Supplier', entityId2);
        
        expect(logs).toHaveLength(0);
      });
      
    });
    
    describe('findByAction()', () => {
      
      test('should find logs by action', async () => {
        await AuditLog.create({
          user: testAdmin._id,
          action: 'approve',
          entityType: 'PurchaseOrder',
          entityId: generateObjectId()
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'approve',
          entityType: 'Supplier',
          entityId: generateObjectId()
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'reject',
          entityType: 'PurchaseOrder',
          entityId: generateObjectId()
        });
        
        const logs = await AuditLog.findByAction('approve');
        
        expect(logs).toHaveLength(2);
        expect(logs.every(l => l.action === 'approve')).toBe(true);
      });
      
    });
    
    describe('search()', () => {
      
      test('should search with multiple criteria', async () => {
        const entityId = generateObjectId();
        
        await AuditLog.create({
          user: testAdmin._id,
          action: 'update',
          entityType: 'Supplier',
          entityId
        });
        await AuditLog.create({
          user: testAdmin._id,
          action: 'create',
          entityType: 'Material',
          entityId: generateObjectId()
        });
        
        const logs = await AuditLog.search({
          user: testAdmin._id,
          action: 'update',
          entityType: 'Supplier'
        });
        
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe('update');
        expect(logs[0].entityType).toBe('Supplier');
      });
      
      test('should respect skip option', async () => {
        for (let i = 0; i < 5; i++) {
          await AuditLog.create({
            user: testAdmin._id,
            action: 'create',
            entityType: 'Supplier',
            entityId: generateObjectId()
          });
        }
        
        const logs = await AuditLog.search({
          user: testAdmin._id,
          skip: 2,
          limit: 10
        });
        
        expect(logs).toHaveLength(3);
      });
      
    });
    
  });
  
  describe('Instance Methods', () => {
    
    test('format should return formatted audit log', async () => {
      const auditLog = await AuditLog.create({
        ...auditLogData.update,
        user: testAdmin._id,
        entityId: generateObjectId()
      });
      
      const populated = await AuditLog.findById(auditLog._id).populate('user');
      const formatted = populated.format();
      
      expect(formatted.id).toBeDefined();
      expect(formatted.user).toBe(`${testAdmin.name} ${testAdmin.surname || ''}`);
      expect(formatted.action).toBe('update');
      expect(formatted.entityType).toBe('Supplier');
      expect(formatted.timestamp).toBeDefined();
      expect(formatted.changes).toHaveLength(2);
      expect(formatted.metadata.ip).toBe('127.0.0.1');
    });
    
  });
  
});

