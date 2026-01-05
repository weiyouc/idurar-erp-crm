/**
 * checkPermission Middleware Tests
 * 
 * Tests for RBAC permission checking middleware.
 */

const checkPermission = require('../../src/middlewares/rbac/checkPermission');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');
const { adminData, roleData, permissionData } = require('../helpers/testData');

describe('checkPermission Middleware', () => {
  
  let testRole, testPermission, testAdmin, mockReq, mockRes, mockNext;
  
  beforeEach(async () => {
    // Create test permission
    testPermission = await Permission.create({
      resource: 'supplier',
      action: 'create',
      scope: 'own'
    });
    
    // Create test role with permission
    testRole = await Role.create({
      name: 'purchaser',
      displayName: { zh: '采购员', en: 'Purchaser' },
      permissions: [testPermission._id]
    });
    
    // Create test admin with role
    testAdmin = await Admin.create({
      ...adminData.valid,
      roles: [testRole._id]
    });
    
    // Mock Express request, response, and next
    mockReq = {
      admin: null,
      body: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });
  
  describe('Authentication', () => {
    
    test('should return 401 if user not authenticated', async () => {
      const middleware = checkPermission('supplier', 'create');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
  });
  
  describe('Role Assignment', () => {
    
    test('should return 403 if user has no roles', async () => {
      const adminWithoutRoles = await Admin.create({
        email: 'noroles@example.com',
        name: 'NoRoles',
        roles: []
      });
      
      mockReq.admin = adminWithoutRoles;
      const middleware = checkPermission('supplier', 'create');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No roles assigned'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
  });
  
  describe('Permission Check - Basic', () => {
    
    test('should allow access if user has required permission', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('supplier', 'create', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    test('should deny access if permission not found', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('supplier', 'delete', 'all');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Access denied: Permission not found'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should use default scope of "own" if not specified', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      // Don't specify scope, should default to 'own'
      const middleware = checkPermission('supplier', 'create');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.permission.scope).toBe('own');
    });
    
  });
  
  describe('Permission Scope - Hierarchy', () => {
    
    test('should allow "all" scope to satisfy "own" requirement', async () => {
      // Create permission with 'all' scope
      const allPermission = await Permission.create({
        resource: 'material',
        action: 'read',
        scope: 'all'
      });
      
      const role = await Role.create({
        name: 'viewer',
        displayName: { zh: '查看者', en: 'Viewer' },
        permissions: [allPermission._id]
      });
      
      const admin = await Admin.create({
        email: 'viewer@example.com',
        name: 'Viewer',
        roles: [role._id]
      });
      
      const populatedAdmin = await Admin.findById(admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('material', 'read', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should allow "team" scope to satisfy "own" requirement', async () => {
      const teamPermission = await Permission.create({
        resource: 'material',
        action: 'update',
        scope: 'team'
      });
      
      const role = await Role.create({
        name: 'manager',
        displayName: { zh: '经理', en: 'Manager' },
        permissions: [teamPermission._id]
      });
      
      const admin = await Admin.create({
        email: 'manager@example.com',
        name: 'Manager',
        roles: [role._id]
      });
      
      const populatedAdmin = await Admin.findById(admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('material', 'update', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should deny "own" scope for "all" requirement', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      // testPermission has 'own' scope
      const middleware = checkPermission('supplier', 'create', 'all');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Access denied: Insufficient permission scope'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should deny "own" scope for "team" requirement', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('supplier', 'create', 'team');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
  });
  
  describe('Conditional Permissions', () => {
    
    test('should allow access if conditions are met', async () => {
      const conditionalPermission = await Permission.create({
        resource: 'purchase_order',
        action: 'approve',
        scope: 'all',
        conditions: {
          amount: { $lte: 50000 },
          currency: 'CNY'
        }
      });
      
      const role = await Role.create({
        name: 'approver',
        displayName: { zh: '审批者', en: 'Approver' },
        permissions: [conditionalPermission._id]
      });
      
      const admin = await Admin.create({
        email: 'approver@example.com',
        name: 'Approver',
        roles: [role._id]
      });
      
      const populatedAdmin = await Admin.findById(admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      mockReq.body = { amount: 30000, currency: 'CNY' };
      
      const middleware = checkPermission('purchase_order', 'approve', 'all');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should deny access if conditions are not met', async () => {
      const conditionalPermission = await Permission.create({
        resource: 'purchase_order',
        action: 'approve',
        scope: 'all',
        conditions: {
          amount: { $lte: 50000 }
        }
      });
      
      const role = await Role.create({
        name: 'approver',
        displayName: { zh: '审批者', en: 'Approver' },
        permissions: [conditionalPermission._id]
      });
      
      const admin = await Admin.create({
        email: 'approver@example.com',
        name: 'Approver',
        roles: [role._id]
      });
      
      const populatedAdmin = await Admin.findById(admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      mockReq.body = { amount: 100000 }; // Exceeds $lte: 50000
      
      const middleware = checkPermission('purchase_order', 'approve', 'all');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Access denied: Permission conditions not met'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should merge context from body and query', async () => {
      const conditionalPermission = await Permission.create({
        resource: 'material',
        action: 'approve',
        scope: 'all',
        conditions: {
          category: 'Electronics'
        }
      });
      
      const role = await Role.create({
        name: 'approver',
        displayName: { zh: '审批者', en: 'Approver' },
        permissions: [conditionalPermission._id]
      });
      
      const admin = await Admin.create({
        email: 'approver@example.com',
        name: 'Approver',
        roles: [role._id]
      });
      
      const populatedAdmin = await Admin.findById(admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      mockReq.query = { category: 'Electronics' };
      
      const middleware = checkPermission('material', 'approve', 'all');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
  });
  
  describe('Request Enhancement', () => {
    
    test('should attach permission info to request', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('supplier', 'create', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockReq.permission).toEqual({
        resource: 'supplier',
        action: 'create',
        scope: 'own',
        conditions: null
      });
      expect(mockNext).toHaveBeenCalled();
    });
    
  });
  
  describe('Error Handling', () => {
    
    test('should handle malformed user object gracefully', async () => {
      // Simulate a malformed admin object without proper structure
      mockReq.admin = {
        _id: testAdmin._id,
        roles: null  // null roles should be caught
      };
      
      const middleware = checkPermission('supplier', 'create');
      
      await middleware(mockReq, mockRes, mockNext);
      
      // Should return 403 for no roles, not crash
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No roles assigned'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
  });
  
  describe('Case Insensitivity', () => {
    
    test('should match resource case-insensitively', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('SUPPLIER', 'create', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should match action case-insensitively', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      mockReq.admin = populatedAdmin;
      
      const middleware = checkPermission('supplier', 'CREATE', 'own');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
  });
  
});

