/**
 * Role Controller Tests
 * 
 * Integration tests for role management API endpoints.
 */

const roleController = require('../../src/controllers/roleController');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLog = require('../../src/models/coreModels/AuditLog');
const { adminData, roleData, permissionData } = require('../helpers/testData');

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

describe('Role Controller', () => {
  
  let testAdmin, testRole, testPermission;
  
  beforeEach(async () => {
    testAdmin = await Admin.create(adminData.valid);
    testPermission = await Permission.create(permissionData.valid);
    testRole = await Role.create({
      ...roleData.valid,
      permissions: [testPermission._id]
    });
  });
  
  describe('list()', () => {
    
    test('should list all roles', async () => {
      const req = createMockReq();
      const res = createMockRes();
      
      await roleController.list(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      }));
    });
    
    test('should filter out system roles when requested', async () => {
      await Role.create({
        name: 'system_role',
        displayName: { zh: '系统角色', en: 'System Role' },
        isSystemRole: true
      });
      
      const req = createMockReq({}, { includeSystem: 'false' });
      const res = createMockRes();
      
      await roleController.list(req, res);
      
      const response = res.json.mock.calls[0][0];
      expect(response.data.every(role => !role.isSystemRole)).toBe(true);
    });
    
    test('should filter for active roles only', async () => {
      await Role.create({
        name: 'removed_role',
        displayName: { zh: '已删除', en: 'Removed' },
        removed: true
      });
      
      const req = createMockReq({}, { activeOnly: 'true' });
      const res = createMockRes();
      
      await roleController.list(req, res);
      
      const response = res.json.mock.calls[0][0];
      expect(response.data.every(role => !role.removed)).toBe(true);
    });
    
    test('should populate specified fields', async () => {
      const req = createMockReq({}, { populate: 'permissions' });
      const res = createMockRes();
      
      await roleController.list(req, res);
      
      const response = res.json.mock.calls[0][0];
      if (response.data.length > 0) {
        expect(response.data[0].permissions).toBeDefined();
      }
    });
    
  });
  
  describe('getById()', () => {
    
    test('should return role by ID', async () => {
      const req = createMockReq({ id: testRole._id });
      const res = createMockRes();
      
      await roleController.getById(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          name: testRole.name
        })
      }));
    });
    
    test('should return 404 for non-existent role', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();
      
      const req = createMockReq({ id: fakeId });
      const res = createMockRes();
      
      await roleController.getById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
  });
  
  describe('create()', () => {
    
    test('should create new role', async () => {
      const req = createMockReq({}, {}, {
        name: 'new_role',
        displayName: { zh: '新角色', en: 'New Role' },
        description: 'Test role'
      }, testAdmin);
      const res = createMockRes();
      
      await roleController.create(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Role created successfully'
      }));
      
      // Verify audit log
      const logs = await AuditLog.find({
        user: testAdmin._id,
        action: 'create',
        entityType: 'Role'
      });
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('should return 400 if name missing', async () => {
      const req = createMockReq({}, {}, {
        displayName: { zh: '测试', en: 'Test' }
      }, testAdmin);
      const res = createMockRes();
      
      await roleController.create(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should return 409 if role name exists', async () => {
      const req = createMockReq({}, {}, {
        name: testRole.name,
        displayName: { zh: '测试', en: 'Test' }
      }, testAdmin);
      const res = createMockRes();
      
      await roleController.create(req, res);
      
      expect(res.status).toHaveBeenCalledWith(409);
    });
    
  });
  
  describe('update()', () => {
    
    test('should update role', async () => {
      const req = createMockReq(
        { id: testRole._id },
        {},
        { description: 'Updated description' },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.update(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Role updated successfully'
      }));
    });
    
    test('should return 404 for non-existent role', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();
      
      const req = createMockReq(
        { id: fakeId },
        {},
        { description: 'Updated' },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.update(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    test('should prevent updating system role', async () => {
      const systemRole = await Role.create({
        name: 'system_admin',
        displayName: { zh: '系统管理员', en: 'System Admin' },
        isSystemRole: true
      });
      
      const req = createMockReq(
        { id: systemRole._id },
        {},
        { description: 'Try to update' },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.update(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });
    
  });
  
  describe('delete()', () => {
    
    test('should soft delete role', async () => {
      const req = createMockReq({ id: testRole._id }, {}, {}, testAdmin);
      const res = createMockRes();
      
      await roleController.delete(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Role deleted successfully'
      }));
      
      // Verify soft delete
      const deletedRole = await Role.findById(testRole._id);
      expect(deletedRole.removed).toBe(true);
    });
    
    test('should prevent deleting system role', async () => {
      const systemRole = await Role.create({
        name: 'system_admin',
        displayName: { zh: '系统管理员', en: 'System Admin' },
        isSystemRole: true
      });
      
      const req = createMockReq({ id: systemRole._id }, {}, {}, testAdmin);
      const res = createMockRes();
      
      await roleController.delete(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });
    
  });
  
  describe('addPermissions()', () => {
    
    test('should add permissions to role', async () => {
      const permission2 = await Permission.create({
        resource: 'material',
        action: 'read',
        scope: 'all'
      });
      
      const req = createMockReq(
        { id: testRole._id },
        {},
        { permissionIds: [permission2._id] },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.addPermissions(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
      
      const updatedRole = await Role.findById(testRole._id);
      expect(updatedRole.permissions).toHaveLength(2);
    });
    
    test('should return 400 if permissionIds missing', async () => {
      const req = createMockReq({ id: testRole._id }, {}, {}, testAdmin);
      const res = createMockRes();
      
      await roleController.addPermissions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should prevent duplicate permissions', async () => {
      const req = createMockReq(
        { id: testRole._id },
        {},
        { permissionIds: [testPermission._id] },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.addPermissions(req, res);
      
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('Added 0 permission');
    });
    
  });
  
  describe('removePermissions()', () => {
    
    test('should remove permissions from role', async () => {
      const req = createMockReq(
        { id: testRole._id },
        {},
        { permissionIds: [testPermission._id] },
        testAdmin
      );
      const res = createMockRes();
      
      await roleController.removePermissions(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Permissions removed from role'
      }));
      
      const updatedRole = await Role.findById(testRole._id);
      expect(updatedRole.permissions).toHaveLength(0);
    });
    
    test('should return 400 if permissionIds missing', async () => {
      const req = createMockReq({ id: testRole._id }, {}, {}, testAdmin);
      const res = createMockRes();
      
      await roleController.removePermissions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
  });
  
});

