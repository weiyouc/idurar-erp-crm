/**
 * Supplier API End-to-End Tests
 * 
 * Tests the full supplier API flow including authentication, authorization, and CRUD operations.
 */

require('../setup');
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');

const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');
const Supplier = require('../../src/models/appModels/Supplier');
const checkPermission = require('../../src/middlewares/rbac/checkPermission');
const supplierController = require('../../src/controllers/supplierController');

describe('Supplier API End-to-End Tests', () => {
  let app;
  let systemAdminRole, purchaserRole;
  let supplierReadPermission, supplierCreatePermission, supplierUpdatePermission;
  let systemAdmin, regularUser;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

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
      description: 'System administrator',
      isSystemRole: true,
      permissions: []
    });

    purchaserRole = await Role.create({
      name: 'purchaser',
      displayName: { en: 'Purchaser', zh: '采购员' },
      description: 'Purchaser role',
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
  });

  describe('GET /api/suppliers/list', () => {
    beforeEach(async () => {
      // Create test suppliers
      await Supplier.create({
        supplierNumber: 'SUP-001',
        companyName: { zh: '测试供应商1', en: 'Test Supplier 1' },
        type: 'manufacturer',
        status: 'active',
        createdBy: systemAdmin._id
      });

      await Supplier.create({
        supplierNumber: 'SUP-002',
        companyName: { zh: '测试供应商2', en: 'Test Supplier 2' },
        type: 'distributor',
        status: 'draft',
        createdBy: regularUser._id
      });
    });

    test('system admin should get all suppliers', async () => {
      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'read'),
        supplierController.list
      );

      const response = await request(app)
        .get('/api/suppliers/list?page=1&items=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('user with read permission should get suppliers', async () => {
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
        supplierController.list
      );

      const response = await request(app)
        .get('/api/suppliers/list?page=1&items=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
    });

    test('should return paginated results', async () => {
      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'read'),
        supplierController.list
      );

      const response = await request(app)
        .get('/api/suppliers/list?page=1&items=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.count).toBeGreaterThan(0);
    });

    test('should filter by status', async () => {
      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'read'),
        supplierController.list
      );

      const response = await request(app)
        .get('/api/suppliers/list?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.result.forEach(supplier => {
        expect(supplier.status).toBe('active');
      });
    });
  });

  describe('POST /api/suppliers', () => {
    test('system admin should create supplier', async () => {
      app.post('/api/suppliers',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'create'),
        supplierController.create
      );

      const supplierData = {
        supplierNumber: 'SUP-003',
        companyName: { zh: '新供应商', en: 'New Supplier' },
        type: 'manufacturer',
        status: 'draft',
        contact: {
          email: 'new@supplier.com',
          phone: '1234567890'
        }
      };

      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(response.body.result.supplierNumber).toBe('SUP-003');

      // Verify in database
      const created = await Supplier.findOne({ supplierNumber: 'SUP-003' });
      expect(created).toBeDefined();
      expect(created.companyName.zh).toBe('新供应商');
    });

    test('user with create permission should create supplier', async () => {
      const populatedUser = await Admin.findById(regularUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      app.post('/api/suppliers',
        (req, res, next) => {
          req.admin = populatedUser;
          next();
        },
        checkPermission('supplier', 'create'),
        supplierController.create
      );

      const supplierData = {
        supplierNumber: 'SUP-004',
        companyName: { zh: '用户创建的供应商', en: 'User Created Supplier' },
        type: 'distributor',
        status: 'draft'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.result.supplierNumber).toBe('SUP-004');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', async () => {
      app.post('/api/suppliers',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'create'),
        supplierController.create
      );

      const invalidData = {
        companyName: { zh: '缺少供应商编号' }
        // Missing supplierNumber (required field)
      };

      const response = await request(app)
        .post('/api/suppliers')
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should handle duplicate supplier numbers', async () => {
      await Supplier.create({
        supplierNumber: 'SUP-DUPLICATE',
        companyName: { zh: '已存在', en: 'Exists' },
        type: 'manufacturer',
        status: 'draft',
        createdBy: systemAdmin._id
      });

      app.post('/api/suppliers',
        (req, res, next) => {
          req.admin = systemAdmin;
          next();
        },
        checkPermission('supplier', 'create'),
        supplierController.create
      );

      const duplicateData = {
        supplierNumber: 'SUP-DUPLICATE', // Duplicate
        companyName: { zh: '重复', en: 'Duplicate' },
        type: 'manufacturer',
        status: 'draft'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .send(duplicateData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Permission Enforcement', () => {
    test('should deny access without read permission', async () => {
      const noPermissionRole = await Role.create({
        name: 'no_permission_role',
        displayName: { en: 'No Permission', zh: '无权限' },
        description: 'No permission role',
        permissions: [] // No permissions
      });

      const noPermissionUser = await Admin.create({
        email: 'noperm@test.com',
        name: 'No',
        surname: 'Permission',
        password: 'hashedpassword',
        enabled: true,
        roles: [noPermissionRole._id]
      });

      const populatedUser = await Admin.findById(noPermissionUser._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

      app.get('/api/suppliers/list',
        (req, res, next) => {
          req.admin = populatedUser;
          next();
        },
        checkPermission('supplier', 'read'),
        supplierController.list
      );

      const response = await request(app)
        .get('/api/suppliers/list')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});

