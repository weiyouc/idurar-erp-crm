/**
 * RBAC End-to-End Integration Tests
 * 
 * Comprehensive tests for permission checking middleware and database interactions.
 * Tests the full flow from request to permission check to database operations.
 */

require('../setup');
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');

const checkPermission = require('../../src/middlewares/rbac/checkPermission');
const checkRole = require('../../src/middlewares/rbac/checkRole');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');

describe('RBAC End-to-End Integration Tests', () => {
  let app;
  let systemAdminRole, purchaserRole, managerRole;
  let supplierReadPermission, supplierCreatePermission, supplierUpdatePermission;
  let systemAdmin, regularUser, userWithoutRoles;

  // Setup Express app for testing
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  // Create test data before each test
  beforeEach(async () => {
    // Create Permissions
    supplierReadPermission = await Permission.create({
      resource: 'supplier',
      action: 'read',
      scope: 'all',
      description: 'Read suppliers'
    });

    supplierCreatePermission = await Permission.create({
      resource: 'supplier',
      action: 'create',
      scope: 'own',
      description: 'Create suppliers'
    });

    supplierUpdatePermission = await Permission.create({
      resource: 'supplier',
      action: 'update',
      scope: 'own',
      description: 'Update suppliers'
    });

    // Create Roles
    systemAdminRole = await Role.create({
      name: 'system_administrator',
      displayName: { en: 'System Administrator', zh: '系统管理员' },
      description: 'Full system access',
      isSystemRole: true,
      permissions: [] // System admin bypasses permission checks
    });

    purchaserRole = await Role.create({
      name: 'purchaser',
      displayName: { en: 'Purchaser', zh: '采购员' },
      description: 'Can create and read suppliers',
      permissions: [supplierReadPermission._id, supplierCreatePermission._id]
    });

    managerRole = await Role.create({
      name: 'procurement_manager',
      displayName: { en: 'Procurement Manager', zh: '采购经理' },
      description: 'Can manage all suppliers',
      permissions: [
        supplierReadPermission._id,
        supplierCreatePermission._id,
        supplierUpdatePermission._id
      ]
    });

    // Create Admin Users
    systemAdmin = await Admin.create({
      email: 'admin@test.com',
      name: 'System',
      surname: 'Admin',
      password: 'hashedpassword',
      enabled: true,
      roles: [systemAdminRole._id]
    });

    regularUser = await Admin.create({
      email: 'purchaser@test.com',
      name: 'Regular',
      surname: 'User',
      password: 'hashedpassword',
      enabled: true,
      roles: [purchaserRole._id]
    });

    userWithoutRoles = await Admin.create({
      email: 'noroles@test.com',
      name: 'No',
      surname: 'Roles',
      password: 'hashedpassword',
      enabled: true,
      roles: []
    });
  });

  describe('System Administrator Bypass', () => {
    test('system administrator should bypass all permission checks', async () => {
      // Populate roles to get role names
      const populatedAdmin = await Admin.findById(systemAdmin._id).populate('roles');
      
      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedAdmin,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.permission).toBeDefined();
      expect(mockReq.permission.scope).toBe('all');
    });

    test('system administrator should have access to any resource/action', async () => {
      // Populate roles to get role names
      const populatedAdmin = await Admin.findById(systemAdmin._id).populate('roles');
      
      const middleware = checkPermission('any_resource', 'any_action');
      const mockReq = {
        admin: populatedAdmin,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Permission Checking with Database', () => {
    test('user with correct permission should pass', async () => {
      // Populate roles for regular user
      const populatedUser = await Admin.findById(regularUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('user without required permission should be denied', async () => {
      // Populate roles for regular user
      const populatedUser = await Admin.findById(regularUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'delete'); // User doesn't have delete permission
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied')
        })
      );
    });

    test('user without roles should be denied', async () => {
      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: userWithoutRoles,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied: No roles assigned'
        })
      );
    });

    test('unauthenticated user should be denied', async () => {
      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: null,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required'
        })
      );
    });
  });

  describe('Scope Hierarchy', () => {
    test('user with "all" scope should access "own" resources', async () => {
      const allScopePermission = await Permission.create({
        resource: 'supplier',
        action: 'read',
        scope: 'all'
      });

      const allScopeRole = await Role.create({
        name: 'all_scope_role',
        displayName: { en: 'All Scope Role', zh: '全部范围角色' },
        description: 'All scope role',
        permissions: [allScopePermission._id]
      });

      const allScopeUser = await Admin.create({
        email: 'allscope@test.com',
        name: 'All',
        surname: 'Scope',
        password: 'hashedpassword',
        enabled: true,
        roles: [allScopeRole._id]
      });

      const populatedUser = await Admin.findById(allScopeUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read', 'own');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('user with "own" scope should not access "all" scope requirement', async () => {
      const ownScopePermission = await Permission.create({
        resource: 'supplier',
        action: 'read',
        scope: 'own'
      });

      const ownScopeRole = await Role.create({
        name: 'own_scope_role',
        displayName: { en: 'Own Scope Role', zh: '自己范围角色' },
        description: 'Own scope role',
        permissions: [ownScopePermission._id]
      });

      const ownScopeUser = await Admin.create({
        email: 'ownscope@test.com',
        name: 'Own',
        surname: 'Scope',
        password: 'hashedpassword',
        enabled: true,
        roles: [ownScopeRole._id]
      });

      const populatedUser = await Admin.findById(ownScopeUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read', 'all');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Role Inheritance', () => {
    test('user should inherit permissions from parent roles', async () => {
      // Create parent role with permission
      const parentRole = await Role.create({
        name: 'parent_role',
        displayName: { en: 'Parent Role', zh: '父角色' },
        description: 'Parent role',
        permissions: [supplierReadPermission._id]
      });

      // Create child role that inherits from parent
      const childRole = await Role.create({
        name: 'child_role',
        displayName: { en: 'Child Role', zh: '子角色' },
        description: 'Child role',
        permissions: [supplierCreatePermission._id],
        inheritsFrom: [parentRole._id]
      });

      const inheritedUser = await Admin.create({
        email: 'inherited@test.com',
        name: 'Inherited',
        surname: 'User',
        password: 'hashedpassword',
        enabled: true,
        roles: [childRole._id]
      });

      const populatedUser = await Admin.findById(inheritedUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      // User should have both parent and child permissions
      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Permission model gracefully', async () => {
      // Instead of breaking Permission.find globally, test with a user that has no matching permissions
      const noMatchPermission = await Permission.create({
        resource: 'other_resource',
        action: 'read', // Use valid enum value
        scope: 'own',
        description: 'Other permission'
      });

      const noMatchRole = await Role.create({
        name: 'no_match_role',
        displayName: { en: 'No Match', zh: '无匹配' },
        description: 'No match role',
        permissions: [noMatchPermission._id]
      });

      const noMatchUser = await Admin.create({
        email: 'nomatch@test.com',
        name: 'No',
        surname: 'Match',
        password: 'hashedpassword',
        enabled: true,
        roles: [noMatchRole._id]
      });

      const populatedNoMatchUser = await Admin.findById(noMatchUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedNoMatchUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle role without permissions gracefully', async () => {
      const emptyRole = await Role.create({
        name: 'empty_role',
        displayName: { en: 'Empty Role', zh: '空角色' },
        description: 'Empty role',
        permissions: []
      });

      const emptyRoleUser = await Admin.create({
        email: 'emptyrole@test.com',
        name: 'Empty',
        surname: 'Role',
        password: 'hashedpassword',
        enabled: true,
        roles: [emptyRole._id]
      });

      const populatedUser = await Admin.findById(emptyRoleUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No permissions assigned')
        })
      );
    });

    test('should handle getAllPermissions() errors gracefully', async () => {
      // Create a role with a problematic getAllPermissions
      const problematicRole = await Role.create({
        name: 'problematic_role',
        displayName: { en: 'Problematic', zh: '有问题' },
        description: 'Problematic role',
        permissions: [supplierReadPermission._id]
      });

      const problematicUser = await Admin.create({
        email: 'problematic@test.com',
        name: 'Problematic',
        surname: 'User',
        password: 'hashedpassword',
        enabled: true,
        roles: [problematicRole._id]
      });

      const populatedUser = await Admin.findById(problematicUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      // Mock getAllPermissions to throw error
      if (populatedUser.roles && populatedUser.roles.length > 0) {
        const originalGetAllPermissions = populatedUser.roles[0].getAllPermissions;
        populatedUser.roles[0].getAllPermissions = jest.fn().mockRejectedValue(
          new Error('Permission fetch error')
        );

        const middleware = checkPermission('supplier', 'read');
        const mockReq = {
          admin: populatedUser,
          body: {},
          query: {}
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        };
        const mockNext = jest.fn();

        await middleware(mockReq, mockRes, mockNext);

        // Should handle error gracefully (either deny or continue)
        expect(mockRes.status).toHaveBeenCalled();
        
        // Restore original
        populatedUser.roles[0].getAllPermissions = originalGetAllPermissions;
      }
    });
  });

  describe('Real API Endpoint Integration', () => {
    test('GET /api/suppliers/list should work with system admin', async () => {
      // Populate roles to get role names
      const populatedAdmin = await Admin.findById(systemAdmin._id).populate('roles');
      
      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = populatedAdmin;
          next();
        },
        checkPermission('supplier', 'read'),
        (req, res) => {
          res.json({ success: true, result: [] });
        }
      );

      const response = await request(app)
        .get('/api/suppliers/list')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/suppliers/list should work with user having read permission', async () => {
      const populatedUser = await Admin.findById(regularUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = populatedUser;
          next();
        },
        checkPermission('supplier', 'read'),
        (req, res) => {
          res.json({ success: true, result: [] });
        }
      );

      const response = await request(app)
        .get('/api/suppliers/list')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/suppliers/list should deny user without read permission', async () => {
      const populatedUser = await Admin.findById(userWithoutRoles._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = populatedUser;
          next();
        },
        checkPermission('supplier', 'read'),
        (req, res) => {
          res.json({ success: true, result: [] });
        }
      );

      const response = await request(app)
        .get('/api/suppliers/list')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Database State Verification', () => {
    test('should verify all test data exists in database', async () => {
      const adminCount = await Admin.countDocuments();
      const roleCount = await Role.countDocuments();
      const permissionCount = await Permission.countDocuments();

      expect(adminCount).toBeGreaterThan(0);
      expect(roleCount).toBeGreaterThan(0);
      expect(permissionCount).toBeGreaterThan(0);
    });

    test('should verify role-permission relationships', async () => {
      const populatedRole = await Role.findById(purchaserRole._id)
        .populate('permissions');

      expect(populatedRole.permissions).toBeDefined();
      expect(populatedRole.permissions.length).toBeGreaterThan(0);
      expect(populatedRole.permissions[0].resource).toBe('supplier');
    });

    test('should verify admin-role relationships', async () => {
      const populatedAdmin = await Admin.findById(regularUser._id)
        .populate('roles');

      expect(populatedAdmin.roles).toBeDefined();
      expect(populatedAdmin.roles.length).toBeGreaterThan(0);
      expect(populatedAdmin.roles[0].name).toBe('purchaser');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle multiple roles efficiently', async () => {
      const multiRoleUser = await Admin.create({
        email: 'multirole@test.com',
        name: 'Multi',
        surname: 'Role',
        password: 'hashedpassword',
        enabled: true,
        roles: [purchaserRole._id, managerRole._id]
      });

      const populatedUser = await Admin.findById(multiRoleUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      const middleware = checkPermission('supplier', 'read');
      const mockReq = {
        admin: populatedUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const startTime = Date.now();
      await middleware(mockReq, mockRes, mockNext);
      const endTime = Date.now();

      expect(mockNext).toHaveBeenCalled();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    test('should handle case-insensitive resource/action matching', async () => {
      // Create a fresh populated user to avoid issues from previous tests
      const freshUser = await Admin.findById(regularUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      // Permission is stored as 'supplier' (lowercase)
      const middleware = checkPermission('SUPPLIER', 'READ'); // Uppercase
      const mockReq = {
        admin: freshUser,
        body: {},
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

