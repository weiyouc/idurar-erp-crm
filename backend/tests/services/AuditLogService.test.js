/**
 * AuditLogService Tests
 * 
 * Tests for the centralized audit logging service.
 */

const AuditLogService = require('../../src/services/AuditLogService');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const Admin = require('../../src/models/coreModels/Admin');
const { adminData } = require('../helpers/testData');
const mongoose = require('mongoose');

const generateObjectId = () => new mongoose.Types.ObjectId();

describe('AuditLogService', () => {
  
  let testAdmin;
  
  beforeEach(async () => {
    testAdmin = await Admin.create(adminData.valid);
  });
  
  describe('logCreate()', () => {
    
    test('should log create operation', async () => {
      const entityId = generateObjectId();
      const newData = { name: 'Test Supplier', code: 'SUP001' };
      
      const log = await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId,
        newData
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('create');
      expect(log.entityType).toBe('Supplier');
      expect(log.entityId.toString()).toBe(entityId.toString());
      expect(log.metadata.extra.newData).toMatchObject(newData);
    });
    
    test('should include metadata if provided', async () => {
      const entityId = generateObjectId();
      const metadata = { source: 'API', version: '1.0' };
      
      const log = await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Material',
        entityId,
        metadata
      });
      
      expect(log.metadata.extra).toMatchObject(metadata);
    });
    
    test('should handle empty newData', async () => {
      const entityId = generateObjectId();
      
      const log = await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Material',
        entityId
      });
      
      expect(log).toBeDefined();
      expect(log.metadata.extra.newData).toEqual({});
    });
    
  });
  
  describe('logUpdate()', () => {
    
    test('should log update operation with changes', async () => {
      const entityId = generateObjectId();
      const changes = [
        { field: 'name', oldValue: 'Old Name', newValue: 'New Name' }
      ];
      
      const log = await AuditLogService.logUpdate({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId,
        changes
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('update');
      expect(log.changes).toHaveLength(1);
      expect(log.changes[0]).toMatchObject(changes[0]);
    });
    
    test('should include old and new data', async () => {
      const entityId = generateObjectId();
      const oldData = { name: 'Old Name' };
      const newData = { name: 'New Name' };
      
      const log = await AuditLogService.logUpdate({
        user: testAdmin._id,
        entityType: 'Material',
        entityId,
        oldData,
        newData
      });
      
      expect(log.metadata.extra.oldData).toMatchObject(oldData);
      expect(log.metadata.extra.newData).toMatchObject(newData);
    });
    
  });
  
  describe('logDelete()', () => {
    
    test('should log delete operation', async () => {
      const entityId = generateObjectId();
      const oldData = { name: 'Deleted Item', code: 'DEL001' };
      
      const log = await AuditLogService.logDelete({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId,
        oldData
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('delete');
      expect(log.metadata.extra.oldData).toMatchObject(oldData);
    });
    
  });
  
  describe('logApproval()', () => {
    
    test('should log approval action', async () => {
      const entityId = generateObjectId();
      const metadata = { level: 1, comments: 'Approved' };
      
      const log = await AuditLogService.logApproval({
        user: testAdmin._id,
        entityType: 'MaterialQuotation',
        entityId,
        metadata
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('approve');
      expect(log.metadata.extra).toMatchObject(metadata);
    });
    
  });
  
  describe('logRejection()', () => {
    
    test('should log rejection action', async () => {
      const entityId = generateObjectId();
      const metadata = { reason: 'Price too high', comments: 'Rejected' };
      
      const log = await AuditLogService.logRejection({
        user: testAdmin._id,
        entityType: 'MaterialQuotation',
        entityId,
        metadata
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('reject');
      expect(log.metadata.extra).toMatchObject(metadata);
    });
    
  });
  
  describe('logWorkflowAction()', () => {
    
    test('should log workflow initiated', async () => {
      const workflowInstanceId = generateObjectId();
      const details = { documentType: 'material_quotation', requiredLevels: 2 };
      
      const log = await AuditLogService.logWorkflowAction({
        user: testAdmin._id,
        action: 'workflow_initiated',
        workflowInstanceId,
        details
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('workflow_initiated');
      expect(log.entityType).toBe('WorkflowInstance');
      expect(log.metadata.extra).toMatchObject(details);
    });
    
    test('should log workflow approved', async () => {
      const workflowInstanceId = generateObjectId();
      const details = { level: 1, finalStatus: 'approved' };
      
      const log = await AuditLogService.logWorkflowAction({
        user: testAdmin._id,
        action: 'workflow_approved',
        workflowInstanceId,
        details
      });
      
      expect(log.action).toBe('workflow_approved');
      expect(log.metadata.extra).toMatchObject(details);
    });
    
  });
  
  describe('logLogin()', () => {
    
    test('should log login event', async () => {
      const metadata = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' };
      
      const log = await AuditLogService.logLogin({
        user: testAdmin._id,
        metadata
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('login');
      expect(log.entityType).toBe('Admin');
      expect(log.metadata).toMatchObject(metadata);
    });
    
  });
  
  describe('logLogout()', () => {
    
    test('should log logout event', async () => {
      const log = await AuditLogService.logLogout({
        user: testAdmin._id
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('logout');
      expect(log.entityType).toBe('Admin');
    });
    
  });
  
  describe('logAction()', () => {
    
    test('should log generic action', async () => {
      const entityId = generateObjectId();
      const metadata = { custom: 'data' };
      
      const log = await AuditLogService.logAction({
        user: testAdmin._id,
        action: 'custom_action',
        entityType: 'CustomEntity',
        entityId,
        metadata
      });
      
      expect(log).toBeDefined();
      expect(log.action).toBe('custom_action');
      expect(log.entityType).toBe('CustomEntity');
      expect(log.metadata.extra).toMatchObject(metadata);
    });
    
  });
  
  describe('getLogsForEntity()', () => {
    
    test('should retrieve logs for specific entity', async () => {
      const entityId = generateObjectId();
      
      await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId
      });
      
      await AuditLogService.logUpdate({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId
      });
      
      const logs = await AuditLogService.getLogsForEntity('Supplier', entityId);
      
      expect(logs).toHaveLength(2);
      expect(logs.every(l => l.entityId.toString() === entityId.toString())).toBe(true);
    });
    
  });
  
  describe('getLogsForUser()', () => {
    
    test('should retrieve logs for specific user', async () => {
      const entityId1 = generateObjectId();
      const entityId2 = generateObjectId();
      
      await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Supplier',
        entityId: entityId1
      });
      
      await AuditLogService.logCreate({
        user: testAdmin._id,
        entityType: 'Material',
        entityId: entityId2
      });
      
      const logs = await AuditLogService.getLogsForUser(testAdmin._id);
      
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });
    
  });
  
  describe('searchLogs()', () => {
    
    test('should return empty array by default (method needs implementation)', async () => {
      const logs = await AuditLogService.searchLogs({ action: 'create' });
      
      expect(logs).toEqual([]);
    });
    
  });
  
});

