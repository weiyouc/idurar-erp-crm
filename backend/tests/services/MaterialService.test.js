const mongoose = require('mongoose');
const MaterialService = require('../../src/services/MaterialService');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLogService = require('../../src/services/AuditLogService');

jest.mock('../../src/services/AuditLogService');

describe('MaterialService', () => {
  let testAdmin;
  let testCategory;
  let testSupplier;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'material-service-test@test.com',
      password: 'password123',
      name: 'MaterialService',
      surname: 'Tester',
      enabled: true
    });
    
    testCategory = await MaterialCategory.create({
      code: 'TESTCAT',
      name: { zh: '测试分类', en: 'Test Category' },
      createdBy: testAdmin._id
    });
    
    testSupplier = await Supplier.create({
      supplierNumber: 'SUP-TEST-001',
      companyName: { zh: '测试供应商', en: 'Test Supplier' },
      status: 'active',
      createdBy: testAdmin._id
    });
  });
  
  afterEach(async () => {
    await Material.deleteMany({});
    jest.clearAllMocks();
  });
  
  describe('createMaterial', () => {
    test('should create material with valid data', async () => {
      const materialData = {
        materialName: { zh: '测试材料', en: 'Test Material' },
        category: testCategory._id,
        type: 'raw',
        baseUOM: 'PC'
      };
      
      const material = await MaterialService.createMaterial(materialData, testAdmin._id);
      
      expect(material).toBeDefined();
      expect(material.materialNumber).toBeDefined();
      expect(material.materialName.zh).toBe('测试材料');
      expect(material.category.toString()).toBe(testCategory._id.toString());
    });
    
    test('should auto-generate material number', async () => {
      const material1 = await MaterialService.createMaterial({
        materialName: { zh: '材料1' },
        category: testCategory._id
      }, testAdmin._id);
      
      const material2 = await MaterialService.createMaterial({
        materialName: { zh: '材料2' },
        category: testCategory._id
      }, testAdmin._id);
      
      expect(material1.materialNumber).toBeDefined();
      expect(material2.materialNumber).toBeDefined();
      expect(material1.materialNumber).not.toBe(material2.materialNumber);
    });
    
    test('should log creation in audit log', async () => {
      await MaterialService.createMaterial({
        materialName: { zh: '测试' },
        category: testCategory._id
      }, testAdmin._id);
      
      expect(AuditLogService.logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'Material'
        })
      );
    });
  });
  
  describe('getMaterial', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'MAT-TEST-001',
        materialName: { zh: '获取测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should get material by ID', async () => {
      const result = await MaterialService.getMaterial(material._id);
      
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(material._id.toString());
      expect(result.materialNumber).toBe('MAT-TEST-001');
    });
    
    test('should populate category if requested', async () => {
      const result = await MaterialService.getMaterial(material._id, {
        populate: ['category']
      });
      
      expect(result.category).toBeDefined();
      expect(result.category.code).toBe('TESTCAT');
    });
    
    test('should populate suppliers if requested', async () => {
      material.preferredSuppliers = [{
        supplier: testSupplier._id,
        leadTime: 7,
        price: 100
      }];
      await material.save();
      
      const result = await MaterialService.getMaterial(material._id, {
        populate: ['suppliers']
      });
      
      expect(result.preferredSuppliers).toBeDefined();
      expect(result.preferredSuppliers[0].supplier).toBeDefined();
    });
    
    test('should throw error if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        MaterialService.getMaterial(fakeId)
      ).rejects.toThrow('Material not found');
    });
  });
  
  describe('listMaterials', () => {
    beforeEach(async () => {
      await Material.create([
        {
          materialNumber: 'LIST-001',
          materialName: { zh: '列表1', en: 'List 1' },
          category: testCategory._id,
          type: 'raw',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'LIST-002',
          materialName: { zh: '列表2', en: 'List 2' },
          category: testCategory._id,
          type: 'finished',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'LIST-003',
          materialName: { zh: '停用', en: 'Inactive' },
          category: testCategory._id,
          type: 'consumable',
          status: 'draft',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should list all materials', async () => {
      const result = await MaterialService.listMaterials();
      
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(3);
      expect(result.pagination.count).toBe(3);
    });
    
    test('should filter by type', async () => {
      const result = await MaterialService.listMaterials({
        type: 'raw'
      });
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0].type).toBe('raw_material');
    });
    
    test('should filter by status', async () => {
      const result = await MaterialService.listMaterials({
        status: 'draft'
      });
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0].status).toBe('draft');
    });
    
    test('should filter by category', async () => {
      const result = await MaterialService.listMaterials({
        category: testCategory._id
      });
      
      expect(result.result).toHaveLength(3);
      expect(result.result.every(m => {
        const catId = m.category?._id || m.category;
        return catId && catId.toString() === testCategory._id.toString();
      })).toBe(true);
    });
    
    test('should search by text', async () => {
      const result = await MaterialService.listMaterials({
        search: '列表1'
      });
      
      expect(result.result.length).toBeGreaterThanOrEqual(1);
      expect(result.result.some(m => m.materialNumber === 'LIST-001')).toBe(true);
    });
    
    test('should paginate results', async () => {
      const result = await MaterialService.listMaterials({}, {
        page: 1,
        items: 2
      });
      
      expect(result.result).toHaveLength(2);
      expect(result.pagination.pages).toBe(2);
    });
    
    test('should sort results', async () => {
      const result = await MaterialService.listMaterials({}, {
        sortBy: 'materialNumber',
        sortOrder: 'asc'
      });
      
      expect(result.result[0].materialNumber).toBe('LIST-001');
    });
  });
  
  describe('updateMaterial', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'UPDATE-001',
        materialName: { zh: '更新测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should update material data', async () => {
      const updateData = {
        materialName: { zh: '更新后', en: 'Updated' },
        description: 'New description'
      };
      
      const updated = await MaterialService.updateMaterial(
        material._id,
        updateData,
        testAdmin._id
      );
      
      expect(updated.materialName.zh).toBe('更新后');
      expect(updated.materialName.en).toBe('Updated');
      expect(updated.description).toBe('New description');
    });
    
    test('should log update in audit log', async () => {
      await MaterialService.updateMaterial(
        material._id,
        { description: 'Updated' },
        testAdmin._id
      );
      
      expect(AuditLogService.logUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'Material',
          entityId: material._id
        })
      );
    });
    
    test('should throw error if material not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        MaterialService.updateMaterial(fakeId, {}, testAdmin._id)
      ).rejects.toThrow('Material not found');
    });
  });
  
  describe('deleteMaterial', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'DELETE-001',
        materialName: { zh: '删除测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should soft delete material', async () => {
      await MaterialService.deleteMaterial(material._id, testAdmin._id);
      
      const deleted = await Material.findById(material._id);
      expect(deleted.removed).toBe(true);
      expect(deleted.removedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('should log deletion', async () => {
      await MaterialService.deleteMaterial(material._id, testAdmin._id);
      
      expect(AuditLogService.logDelete).toHaveBeenCalled();
    });
  });
  
  describe('activateMaterial', () => {
    test('should activate inactive material', async () => {
      const material = await Material.create({
        materialNumber: 'ACTIVATE-001',
        materialName: { zh: '激活测试' },
        category: testCategory._id,
        status: 'draft',
        createdBy: testAdmin._id
      });
      
      const result = await MaterialService.activateMaterial(
        material._id,
        testAdmin._id
      );
      
      expect(result.status).toBe('active');
    });
  });
  
  describe('deactivateMaterial', () => {
    test('should deactivate active material', async () => {
      const material = await Material.create({
        materialNumber: 'DEACTIVATE-001',
        materialName: { zh: '停用测试' },
        category: testCategory._id,
        status: 'active',
        createdBy: testAdmin._id
      });
      
      const result = await MaterialService.deactivateMaterial(
        material._id,
        testAdmin._id
      );
      
      expect(result.status).toBe('obsolete');
    });
  });
  
  describe('addSupplier', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'SUPPLIER-001',
        materialName: { zh: '供应商测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should add supplier to material', async () => {
      const supplierData = {
        supplier: testSupplier._id,
        leadTime: 7,
        minOrderQuantity: 100,
        price: 50.00,
        currency: 'CNY'
      };
      
      const result = await MaterialService.addPreferredSupplier(
        material._id,
        supplierData,
        testAdmin._id
      );
      
      expect(result.preferredSuppliers).toHaveLength(1);
      expect(result.preferredSuppliers[0].supplier.toString()).toBe(testSupplier._id.toString());
      expect(result.preferredSuppliers[0].price).toBe(50.00);
    });
    
    test('should prevent duplicate supplier', async () => {
      const supplierData = {
        supplier: testSupplier._id,
        leadTime: 7,
        price: 50.00
      };
      
      await MaterialService.addPreferredSupplier(material._id, supplierData, testAdmin._id);
      
      await expect(
        MaterialService.addPreferredSupplier(material._id, supplierData, testAdmin._id)
      ).rejects.toThrow('already added');
    });
  });
  
  describe('removeSupplier', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'RMSUPP-001',
        materialName: { zh: '移除供应商' },
        category: testCategory._id,
        preferredSuppliers: [{
          supplier: testSupplier._id,
          leadTime: 7,
          price: 50
        }],
        createdBy: testAdmin._id
      });
    });
    
    test('should remove supplier from material', async () => {
      const result = await MaterialService.removePreferredSupplier(
        material._id,
        testSupplier._id,
        testAdmin._id
      );
      
      expect(result.preferredSuppliers).toHaveLength(0);
    });
  });
  
  describe('updatePricing', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'PRICING-001',
        materialName: { zh: '定价测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should update material pricing', async () => {
      const pricingData = {
        cost: 100.00,
        currency: 'USD',
        listPrice: 150.00
      };
      
      const result = await MaterialService.updatePricing(
        material._id,
        pricingData,
        testAdmin._id
      );
      
      expect(result.cost).toBe(100.00);
      expect(result.currency).toBe('USD');
      expect(result.listPrice).toBe(150.00);
    });
  });
  
  describe('updateInventory', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'INV-001',
        materialName: { zh: '库存测试' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should update inventory settings', async () => {
      const inventoryData = {
        safetyStock: 100,
        reorderPoint: 50,
        reorderQuantity: 500
      };
      
      const result = await MaterialService.updateInventoryParams(
        material._id,
        inventoryData,
        testAdmin._id
      );
      
      expect(result.safetyStock).toBe(100);
      expect(result.reorderPoint).toBe(50);
      expect(result.reorderQuantity).toBe(500);
    });
  });
  
  describe('convertUOM', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'UOM-001',
        materialName: { zh: '单位转换' },
        category: testCategory._id,
        baseUOM: 'PC',
        alternativeUOMs: [
          { uom: 'BOX', conversionFactor: 12 }, // 1 BOX = 12 PC
          { uom: 'CARTON', conversionFactor: 120 } // 1 CARTON = 120 PC
        ],
        createdBy: testAdmin._id
      });
    });
    
    test('should convert from base UOM to alternative', async () => {
      const result = await MaterialService.convertQuantity(
        material._id,
        100, // quantity
        'PC', // from
        'BOX' // to
      );
      
      expect(result.quantity).toBeCloseTo(8.333, 2); // 100 PC = 8.333 BOX
      expect(result.uom).toBe('BOX');
    });
    
    test('should convert from alternative to base UOM', async () => {
      const result = await MaterialService.convertQuantity(
        material._id,
        10, // quantity
        'BOX', // from
        'PC' // to
      );
      
      expect(result.quantity).toBe(120); // 10 BOX = 120 PC
      expect(result.uom).toBe('PC');
    });
    
    test('should convert between alternative UOMs', async () => {
      const result = await MaterialService.convertQuantity(
        material._id,
        1, // quantity
        'CARTON', // from
        'BOX' // to
      );
      
      expect(result.quantity).toBe(10); // 1 CARTON = 10 BOX (120/12)
      expect(result.uom).toBe('BOX');
    });
    
    test('should throw error for invalid UOM', async () => {
      await expect(
        MaterialService.convertQuantity(material._id, 100, 'PC', 'INVALID')
      ).rejects.toThrow('Invalid UOM');
    });
  });
  
  describe('searchMaterials', () => {
    beforeEach(async () => {
      await Material.create([
        {
          materialNumber: 'SEARCH-001',
          materialName: { zh: '搜索测试1', en: 'Search Test 1' },
          category: testCategory._id,
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'SEARCH-002',
          materialName: { zh: '搜索测试2', en: 'Search Test 2' },
          category: testCategory._id,
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should search by material number', async () => {
      const results = await MaterialService.searchMaterials('SEARCH-001');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(m => m.materialNumber === 'SEARCH-001')).toBe(true);
    });
    
    test('should search by name', async () => {
      const results = await MaterialService.searchMaterials('搜索测试');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('getStatistics', () => {
    beforeEach(async () => {
      await Material.create([
        {
          materialNumber: 'STAT-001',
          materialName: { zh: '统计1' },
          category: testCategory._id,
          type: 'raw',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'STAT-002',
          materialName: { zh: '统计2' },
          category: testCategory._id,
          type: 'finished',
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'STAT-003',
          materialName: { zh: '统计3' },
          category: testCategory._id,
          type: 'raw',
          status: 'draft',
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should return material statistics', async () => {
      const stats = await MaterialService.getStatistics();
      
      expect(stats.totalMaterials).toBeGreaterThanOrEqual(3);
      expect(stats.byType.raw_material).toBeGreaterThanOrEqual(2);
      expect(stats.byType.finished_goods).toBeGreaterThanOrEqual(1);
      expect(stats.activeCount).toBeGreaterThanOrEqual(2);
      expect(stats.inactiveCount).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('getMaterialByNumber', () => {
    test('should find material by number', async () => {
      await Material.create({
        materialNumber: 'BYNUM-001',
        materialName: { zh: '编号查找' },
        category: testCategory._id,
        createdBy: testAdmin._id
      });
      
      const result = await MaterialService.getMaterialByNumber('BYNUM-001');
      
      expect(result).toBeDefined();
      expect(result.materialNumber).toBe('BYNUM-001');
    });
    
    test('should throw error if not found', async () => {
      await expect(
        MaterialService.getMaterialByNumber('NOTEXIST-999')
      ).rejects.toThrow('Material not found');
    });
  });
  
  describe('getMaterialsByCategory', () => {
    test('should get all materials in category', async () => {
      await Material.create([
        {
          materialNumber: 'CAT-001',
          materialName: { zh: '分类1' },
          category: testCategory._id,
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'CAT-002',
          materialName: { zh: '分类2' },
          category: testCategory._id,
          createdBy: testAdmin._id
        }
      ]);
      
      const results = await MaterialService.getMaterialsByCategory(testCategory._id);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(m => m.category.toString() === testCategory._id.toString())).toBe(true);
    });
  });
  
  describe('getMaterialsBySupplier', () => {
    test('should get all materials from supplier', async () => {
      await Material.create({
        materialNumber: 'SUPP-001',
        materialName: { zh: '供应商材料' },
        category: testCategory._id,
        preferredSuppliers: [{
          supplier: testSupplier._id,
          leadTime: 7,
          price: 100
        }],
        createdBy: testAdmin._id
      });
      
      const results = await MaterialService.getMaterialsBySupplier(testSupplier._id);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].materialNumber).toBe('SUPP-001');
    });
  });
});

