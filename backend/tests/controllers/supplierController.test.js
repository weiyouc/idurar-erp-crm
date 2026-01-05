const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');

describe('Supplier Controller', () => {
  let authToken;
  let testAdmin;
  let testRole;
  let testSupplier;
  
  beforeAll(async () => {
    // Create permissions for supplier management
    const permissions = await Permission.create([
      { resource: 'supplier', action: 'create', scope: 'all' },
      { resource: 'supplier', action: 'read', scope: 'all' },
      { resource: 'supplier', action: 'update', scope: 'all' },
      { resource: 'supplier', action: 'delete', scope: 'all' },
      { resource: 'supplier', action: 'list', scope: 'all' },
      { resource: 'supplier', action: 'submit_for_approval', scope: 'all' },
      { resource: 'supplier', action: 'approve', scope: 'all' },
      { resource: 'supplier', action: 'reject', scope: 'all' },
      { resource: 'supplier', action: 'activate', scope: 'all' },
      { resource: 'supplier', action: 'deactivate', scope: 'all' },
      { resource: 'supplier', action: 'blacklist', scope: 'all' },
      { resource: 'supplier', action: 'update_rating', scope: 'all' },
      { resource: 'supplier', action: 'restore', scope: 'all' }
    ]);
    
    // Create role with permissions
    testRole = await Role.create({
      name: 'Supplier Manager',
      code: 'supplier_manager',
      permissions: permissions.map(p => p._id)
    });
    
    // Create admin user with role
    testAdmin = await Admin.create({
      email: 'supplier-controller-test@test.com',
      password: 'password123',
      name: 'Controller',
      surname: 'Tester',
      enabled: true,
      roles: [testRole._id]
    });
    
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/login')
      .send({
        email: 'supplier-controller-test@test.com',
        password: 'password123'
      });
    
    authToken = loginRes.body.result.token;
  });
  
  afterEach(async () => {
    await Supplier.deleteMany({});
  });
  
  describe('POST /api/suppliers', () => {
    test('should create new supplier', async () => {
      const supplierData = {
        supplierNumber: 'SUP-20260105-001',
        companyName: {
          zh: '测试供应商',
          en: 'Test Supplier'
        },
        type: 'manufacturer',
        contact: {
          name: 'John Doe',
          email: 'john@test.com',
          phone: '+86 123 4567 8900'
        }
      };
      
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result.supplierNumber).toBe('SUP-20260105-001');
      expect(res.body.result.companyName.zh).toBe('测试供应商');
      expect(res.body.message).toContain('created successfully');
    });
    
    test('should auto-generate supplier number if not provided', async () => {
      const supplierData = {
        companyName: { zh: '自动编号供应商' },
        type: 'distributor'
      };
      
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result.supplierNumber).toMatch(/^SUP-\d{8}-\d{3}$/);
    });
    
    test('should require authentication', async () => {
      const supplierData = {
        companyName: { zh: '测试' },
        type: 'manufacturer'
      };
      
      await request(app)
        .post('/api/suppliers')
        .send(supplierData)
        .expect(401);
    });
    
    test('should validate required fields', async () => {
      const invalidData = {
        type: 'manufacturer'
        // Missing companyName
      };
      
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /api/suppliers', () => {
    beforeEach(async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-GET-001',
          companyName: { zh: '供应商1', en: 'Supplier 1' },
          type: 'manufacturer',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-GET-002',
          companyName: { zh: '供应商2', en: 'Supplier 2' },
          type: 'distributor',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-GET-003',
          companyName: { zh: '供应商3', en: 'Supplier 3' },
          type: 'manufacturer',
          status: 'inactive',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should return all suppliers', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveLength(3);
      expect(res.body.total).toBe(3);
    });
    
    test('should filter by status', async () => {
      const res = await request(app)
        .get('/api/suppliers?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveLength(2);
      expect(res.body.result.every(s => s.status === 'active')).toBe(true);
    });
    
    test('should filter by category/type', async () => {
      const res = await request(app)
        .get('/api/suppliers?category=manufacturer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveLength(2);
      expect(res.body.result.every(s => s.type === 'manufacturer')).toBe(true);
    });
    
    test('should search by name', async () => {
      const res = await request(app)
        .get('/api/suppliers?search=Supplier 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveLength(1);
      expect(res.body.result[0].companyName.en).toBe('Supplier 1');
    });
    
    test('should paginate results', async () => {
      const res = await request(app)
        .get('/api/suppliers?page=1&items=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });
  });
  
  describe('GET /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-GETID-001',
        companyName: { zh: '单个供应商' },
        type: 'manufacturer',
        createdBy: testAdmin._id
      });
    });
    
    test('should return supplier by ID', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result._id).toBe(testSupplier._id.toString());
      expect(res.body.result.companyName.zh).toBe('单个供应商');
    });
    
    test('should return 404 for non-existent supplier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/suppliers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
    
    test('should return 400 for invalid ID format', async () => {
      await request(app)
        .get('/api/suppliers/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
  
  describe('PATCH /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-UPDATE-001',
        companyName: { zh: '原始名称' },
        type: 'manufacturer',
        createdBy: testAdmin._id
      });
    });
    
    test('should update supplier', async () => {
      const updateData = {
        companyName: { zh: '更新名称', en: 'Updated Name' },
        abbreviation: 'UPD'
      };
      
      const res = await request(app)
        .patch(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result.companyName.zh).toBe('更新名称');
      expect(res.body.result.companyName.en).toBe('Updated Name');
      expect(res.body.result.abbreviation).toBe('UPD');
      expect(res.body.message).toContain('updated successfully');
    });
    
    test('should not allow updating supplier number', async () => {
      const updateData = {
        supplierNumber: 'SUP-HACKED-999'
      };
      
      await request(app)
        .patch(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      const updated = await Supplier.findById(testSupplier._id);
      expect(updated.supplierNumber).toBe('SUP-UPDATE-001'); // Should remain unchanged
    });
  });
  
  describe('DELETE /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-DELETE-001',
        companyName: { zh: '待删除' },
        createdBy: testAdmin._id
      });
    });
    
    test('should soft delete supplier', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
      
      const deleted = await Supplier.findById(testSupplier._id);
      expect(deleted.removed).toBe(true);
      expect(deleted.removedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('PATCH /api/suppliers/:id/restore', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-RESTORE-001',
        companyName: { zh: '待恢复' },
        removed: true,
        removedAt: new Date(),
        createdBy: testAdmin._id
      });
    });
    
    test('should restore deleted supplier', async () => {
      const res = await request(app)
        .patch(`/api/suppliers/${testSupplier._id}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('restored successfully');
      
      const restored = await Supplier.findById(testSupplier._id);
      expect(restored.removed).toBe(false);
    });
  });
  
  describe('POST /api/suppliers/:id/submit', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-SUBMIT-001',
        companyName: { zh: '待提交' },
        status: 'draft',
        createdBy: testAdmin._id
      });
    });
    
    test('should submit supplier for approval', async () => {
      const res = await request(app)
        .post(`/api/suppliers/${testSupplier._id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('submitted for approval');
      
      const submitted = await Supplier.findById(testSupplier._id);
      expect(submitted.status).toBe('pending_approval');
    });
  });
  
  describe('POST /api/suppliers/:id/activate', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-ACTIVATE-001',
        companyName: { zh: '待激活' },
        status: 'inactive',
        createdBy: testAdmin._id
      });
    });
    
    test('should activate supplier', async () => {
      const res = await request(app)
        .post(`/api/suppliers/${testSupplier._id}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('activated');
      
      const activated = await Supplier.findById(testSupplier._id);
      expect(activated.status).toBe('active');
    });
  });
  
  describe('POST /api/suppliers/:id/deactivate', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-DEACTIVATE-001',
        companyName: { zh: '待停用' },
        status: 'active',
        createdBy: testAdmin._id
      });
    });
    
    test('should deactivate supplier', async () => {
      const res = await request(app)
        .post(`/api/suppliers/${testSupplier._id}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
      
      const deactivated = await Supplier.findById(testSupplier._id);
      expect(deactivated.status).toBe('inactive');
    });
  });
  
  describe('POST /api/suppliers/:id/blacklist', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-BLACKLIST-001',
        companyName: { zh: '待拉黑' },
        status: 'active',
        createdBy: testAdmin._id
      });
    });
    
    test('should blacklist supplier', async () => {
      const res = await request(app)
        .post(`/api/suppliers/${testSupplier._id}/blacklist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('blacklisted');
      
      const blacklisted = await Supplier.findById(testSupplier._id);
      expect(blacklisted.status).toBe('blacklisted');
    });
  });
  
  describe('PATCH /api/suppliers/:id/rating', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        supplierNumber: 'SUP-RATING-001',
        companyName: { zh: '评分测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('should update supplier rating', async () => {
      const res = await request(app)
        .patch(`/api/suppliers/${testSupplier._id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.5 })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('rating updated');
      
      const updated = await Supplier.findById(testSupplier._id);
      expect(updated.performance.qualityRating).toBe(4.5);
    });
    
    test('should validate rating range', async () => {
      await request(app)
        .patch(`/api/suppliers/${testSupplier._id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 10 }) // Invalid: > 5
        .expect(400);
    });
  });
  
  describe('GET /api/suppliers/stats', () => {
    beforeEach(async () => {
      await Supplier.create([
        {
          supplierNumber: 'SUP-STATS-001',
          companyName: { zh: '统计1' },
          status: 'active',
          type: 'manufacturer',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STATS-002',
          companyName: { zh: '统计2' },
          status: 'inactive',
          type: 'distributor',
          createdBy: testAdmin._id
        },
        {
          supplierNumber: 'SUP-STATS-003',
          companyName: { zh: '统计3' },
          status: 'pending_approval',
          type: 'manufacturer',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should return supplier statistics', async () => {
      const res = await request(app)
        .get('/api/suppliers/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.result.total).toBeGreaterThanOrEqual(3);
      expect(res.body.result.active).toBeGreaterThanOrEqual(1);
      expect(res.body.result.inactive).toBeGreaterThanOrEqual(1);
      expect(res.body.result.pending).toBeGreaterThanOrEqual(1);
    });
  });
});

