/**
 * checkRole Middleware Tests
 * 
 * Tests for RBAC role checking middleware.
 */

const checkRole = require('../../src/middlewares/rbac/checkRole');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const { adminData, roleData } = require('../helpers/testData');

describe('checkRole Middleware', () => {
  
  let testRole1, testRole2, testAdmin, mockReq, mockRes, mockNext;
  
  beforeEach(async () => {
    // Create test roles
    testRole1 = await Role.create({
      name: 'purchaser',
      displayName: { zh: '采购员', en: 'Purchaser' }
    });
    
    testRole2 = await Role.create({
      name: 'system_administrator',
      displayName: { zh: '系统管理员', en: 'System Administrator' }
    });
    
    // Create test admin with roles
    testAdmin = await Admin.create({
      ...adminData.valid,
      roles: [testRole1._id]
    });
    
    // Mock Express request, response, and next
    mockReq = {
      admin: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });
  
  describe('Authentication', () => {
    
    test('should return 401 if user not authenticated', async () => {
      const middleware = checkRole('purchaser');
      
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
      const middleware = checkRole('purchaser');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: No roles assigned'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
  });
  
  describe('Single Role Check', () => {
    
    test('should allow access if user has required role', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole('purchaser');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    test('should deny access if user does not have required role', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole('system_administrator');
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Access denied: Insufficient permissions'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should work with case-sensitive role names', async () => {
      // Role names are case-sensitive
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole('purchaser'); // Exact match
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
  });
  
  describe('Multiple Roles Check', () => {
    
    test('should allow access if user has any of the required roles', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole(['purchaser', 'system_administrator']);
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    test('should deny access if user has none of the required roles', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole(['system_administrator', 'general_manager']);
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should accept array with single role', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole(['purchaser']);
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
  });
  
  describe('Multiple User Roles', () => {
    
    test('should allow access if user has multiple roles and one matches', async () => {
      // Create admin with multiple roles
      const multiRoleAdmin = await Admin.create({
        email: 'multi@example.com',
        name: 'Multi',
        roles: [testRole1._id, testRole2._id]
      });
      
      const populatedAdmin = await Admin.findById(multiRoleAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole('system_administrator');
      
      await middleware(mockReq, mockRes, mockNext);
      
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
      
      const middleware = checkRole('purchaser');
      
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
  
  describe('Response Format', () => {
    
    test('should include requiredRoles and userRoles in 403 response', async () => {
      const populatedAdmin = await Admin.findById(testAdmin._id).populate('roles');
      mockReq.admin = populatedAdmin;
      
      const middleware = checkRole(['system_administrator', 'general_manager']);
      
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: Insufficient permissions',
        requiredRoles: ['system_administrator', 'general_manager'],
        userRoles: ['purchaser']
      });
    });
    
  });
  
});

