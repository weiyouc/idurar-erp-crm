const mongoose = require('mongoose');
const Material = require('../../src/models/appModels/Material');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Supplier = require('../../src/models/appModels/Supplier');
const Admin = require('../../src/models/coreModels/Admin');

describe('Material Model', () => {
  let testAdmin, testCategory, testSupplier;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'material-test@test.com',
      password: 'password123',
      name: 'Material',
      surname: 'Tester',
      enabled: true
    });
    
    testCategory = await MaterialCategory.create({
      code: 'RAW',
      name: { zh: '原材料' },
      createdBy: testAdmin._id
    });
    
    testSupplier = await Supplier.create({
      supplierNumber: 'SUP-TEST-001',
      companyName: { zh: '测试供应商' },
      createdBy: testAdmin._id
    });
  });
  
  afterEach(async () => {
    await Material.deleteMany({});
  });
  
  describe('Schema Validation', () => {
    test('should create material with all required fields', async () => {
      const material = await Material.create({
        materialNumber: 'MAT-20260106-001',
        materialName: { zh: '测试物料' },
        createdBy: testAdmin._id
      });
      
      expect(material.materialNumber).toBe('MAT-20260106-001');
      expect(material.materialName.zh).toBe('测试物料');
      expect(material.type).toBe('raw');
      expect(material.status).toBe('draft');
      expect(material.baseUOM).toBe('pcs');
      expect(material.removed).toBe(false);
    });
    
    test('should require material number', async () => {
      const material = new Material({
        materialName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow();
    });
    
    test('should require Chinese material name', async () => {
      const material = new Material({
        materialNumber: 'MAT-TEST-001',
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow();
    });
    
    test('should accept English name', async () => {
      const material = await Material.create({
        materialNumber: 'MAT-ENG-001',
        materialName: { zh: '中文', en: 'English' },
        createdBy: testAdmin._id
      });
      
      expect(material.materialName.en).toBe('English');
    });
    
    test('should enforce unique material number', async () => {
      await Material.create({
        materialNumber: 'MAT-DUP-001',
        materialName: { zh: '重复1' },
        createdBy: testAdmin._id
      });
      
      await expect(Material.create({
        materialNumber: 'MAT-DUP-001',
        materialName: { zh: '重复2' },
        createdBy: testAdmin._id
      })).rejects.toThrow();
    });
    
    test('should validate material type enum', async () => {
      const material = new Material({
        materialNumber: 'MAT-TYPE-001',
        materialName: { zh: 'Test' },
        type: 'invalid_type',
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow();
    });
    
    test('should validate status enum', async () => {
      const material = new Material({
        materialNumber: 'MAT-STATUS-001',
        materialName: { zh: 'Test' },
        status: 'invalid_status',
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow();
    });
    
    test('should validate currency enum', async () => {
      const material = new Material({
        materialNumber: 'MAT-CURR-001',
        materialName: { zh: 'Test' },
        currency: 'GBP', // Not in enum
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow();
    });
    
    test('should set default values', async () => {
      const material = await Material.create({
        materialNumber: 'MAT-DEFAULT-001',
        materialName: { zh: '默认值' },
        createdBy: testAdmin._id
      });
      
      expect(material.type).toBe('raw');
      expect(material.status).toBe('draft');
      expect(material.baseUOM).toBe('pcs');
      expect(material.currency).toBe('CNY');
      expect(material.removed).toBe(false);
      expect(material.standardCost).toBe(0);
      expect(material.minimumOrderQty).toBe(1);
    });
  });
  
  describe('UOM (Unit of Measure) Management', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'MAT-UOM-001',
        materialName: { zh: 'UOM测试' },
        baseUOM: 'pcs',
        alternativeUOMs: [
          { uom: 'box', conversionFactor: 100, isPurchasing: true },
          { uom: 'carton', conversionFactor: 1000, isInventory: true }
        ],
        createdBy: testAdmin._id
      });
    });
    
    test('should store alternative UOMs', () => {
      expect(material.alternativeUOMs).toHaveLength(2);
      expect(material.alternativeUOMs[0].uom).toBe('box');
      expect(material.alternativeUOMs[0].conversionFactor).toBe(100);
    });
    
    test('convertToBaseUOM() should convert correctly', () => {
      // 2 boxes = 200 pcs
      const result = material.convertToBaseUOM(2, 'box');
      expect(result).toBe(200);
    });
    
    test('convertToBaseUOM() should return same for base UOM', () => {
      const result = material.convertToBaseUOM(50, 'pcs');
      expect(result).toBe(50);
    });
    
    test('convertToBaseUOM() should throw error for unknown UOM', () => {
      expect(() => material.convertToBaseUOM(10, 'kg'))
        .toThrow('UOM kg not found');
    });
    
    test('convertFromBaseUOM() should convert correctly', () => {
      // 500 pcs = 5 boxes
      const result = material.convertFromBaseUOM(500, 'box');
      expect(result).toBe(5);
    });
    
    test('convertFromBaseUOM() should return same for base UOM', () => {
      const result = material.convertFromBaseUOM(100, 'pcs');
      expect(result).toBe(100);
    });
    
    test('convertFromBaseUOM() should throw error for unknown UOM', () => {
      expect(() => material.convertFromBaseUOM(100, 'ton'))
        .toThrow('UOM ton not found');
    });
  });
  
  describe('Supplier Management', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'MAT-SUP-001',
        materialName: { zh: '供应商测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('should add preferred supplier', async () => {
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        supplierPN: 'SUP-PN-001',
        leadTime: 7,
        moq: 100,
        isPrimary: true
      });
      
      expect(material.preferredSuppliers).toHaveLength(1);
      expect(material.preferredSuppliers[0].supplier.toString()).toBe(testSupplier._id.toString());
      expect(material.preferredSuppliers[0].isPrimary).toBe(true);
    });
    
    test('should set first supplier as primary automatically', async () => {
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        leadTime: 7,
        moq: 100
      });
      
      expect(material.preferredSuppliers[0].isPrimary).toBe(true);
    });
    
    test('should throw error when adding duplicate supplier', async () => {
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        leadTime: 7,
        moq: 100
      });
      
      await expect(material.addPreferredSupplier({
        supplier: testSupplier._id,
        leadTime: 10,
        moq: 50
      })).rejects.toThrow('Supplier already in preferred list');
    });
    
    test('should allow only one primary supplier', async () => {
      const supplier2 = await Supplier.create({
        supplierNumber: 'SUP-TEST-002',
        companyName: { zh: '供应商2' },
        createdBy: testAdmin._id
      });
      
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        isPrimary: true
      });
      
      await material.addPreferredSupplier({
        supplier: supplier2._id,
        isPrimary: true
      });
      
      // Only the second one should be primary
      const primarySuppliers = material.preferredSuppliers.filter(s => s.isPrimary);
      expect(primarySuppliers).toHaveLength(1);
      expect(primarySuppliers[0].supplier.toString()).toBe(supplier2._id.toString());
    });
    
    test('getPrimarySupplier() should return primary supplier', async () => {
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        isPrimary: true
      });
      
      const primary = material.getPrimarySupplier();
      
      expect(primary).toBeDefined();
      expect(primary.supplier.toString()).toBe(testSupplier._id.toString());
    });
    
    test('getPrimarySupplier() should return first if no primary marked', async () => {
      const supplier2 = await Supplier.create({
        supplierNumber: 'SUP-TEST-003',
        companyName: { zh: '供应商3' },
        createdBy: testAdmin._id
      });
      
      // Manually add without using addPreferredSupplier to test fallback
      material.preferredSuppliers = [
        { supplier: testSupplier._id, isPrimary: false },
        { supplier: supplier2._id, isPrimary: false }
      ];
      
      const primary = material.getPrimarySupplier();
      
      expect(primary.supplier.toString()).toBe(testSupplier._id.toString());
    });
    
    test('removePreferredSupplier() should remove supplier', async () => {
      await material.addPreferredSupplier({
        supplier: testSupplier._id
      });
      
      await material.removePreferredSupplier(testSupplier._id);
      
      expect(material.preferredSuppliers).toHaveLength(0);
    });
    
    test('removePreferredSupplier() should make next supplier primary', async () => {
      const supplier2 = await Supplier.create({
        supplierNumber: 'SUP-TEST-004',
        companyName: { zh: '供应商4' },
        createdBy: testAdmin._id
      });
      
      await material.addPreferredSupplier({
        supplier: testSupplier._id,
        isPrimary: true
      });
      
      await material.addPreferredSupplier({
        supplier: supplier2._id
      });
      
      await material.removePreferredSupplier(testSupplier._id);
      
      expect(material.preferredSuppliers).toHaveLength(1);
      expect(material.preferredSuppliers[0].isPrimary).toBe(true);
    });
  });
  
  describe('Instance Methods', () => {
    let material;
    
    beforeEach(async () => {
      material = await Material.create({
        materialNumber: 'MAT-INST-001',
        materialName: { zh: '实例方法测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('activate() should set status to active', async () => {
      await material.activate();
      
      expect(material.status).toBe('active');
    });
    
    test('deactivate() should set status to obsolete', async () => {
      material.status = 'active';
      await material.save();
      
      await material.deactivate();
      
      expect(material.status).toBe('obsolete');
    });
    
    test('softDelete() should mark as removed', async () => {
      await material.softDelete(testAdmin._id);
      
      expect(material.removed).toBe(true);
      expect(material.removedAt).toBeInstanceOf(Date);
      expect(material.removedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('restore() should unmark removed', async () => {
      material.removed = true;
      material.removedAt = new Date();
      material.removedBy = testAdmin._id;
      await material.save();
      
      await material.restore();
      
      expect(material.removed).toBe(false);
      expect(material.removedAt).toBeUndefined();
      expect(material.removedBy).toBeUndefined();
    });
    
    test('format() should return formatted data', () => {
      const formatted = material.format();
      
      expect(formatted.id).toBeDefined();
      expect(formatted.materialNumber).toBe('MAT-INST-001');
      expect(formatted.materialName.zh).toBe('实例方法测试');
      expect(formatted.type).toBe('raw');
      expect(formatted.status).toBe('draft');
      expect(formatted.baseUOM).toBe('pcs');
    });
  });
  
  describe('Static Methods', () => {
    test('generateMaterialNumber() should create unique number', async () => {
      const number1 = await Material.generateMaterialNumber();
      
      expect(number1).toMatch(/^MAT-\d{8}-\d{3}$/);
      
      await Material.create({
        materialNumber: number1,
        materialName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      const number2 = await Material.generateMaterialNumber();
      
      expect(number2).not.toBe(number1);
    });
    
    test('generateMaterialNumber() should increment sequence', async () => {
      const number1 = await Material.generateMaterialNumber();
      
      await Material.create({
        materialNumber: number1,
        materialName: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      const number2 = await Material.generateMaterialNumber();
      
      const seq1 = parseInt(number1.split('-')[2]);
      const seq2 = parseInt(number2.split('-')[2]);
      
      expect(seq2).toBe(seq1 + 1);
    });
    
    test('findByNumber() should find material', async () => {
      await Material.create({
        materialNumber: 'MAT-FIND-001',
        materialName: { zh: '查找测试' },
        createdBy: testAdmin._id
      });
      
      const found = await Material.findByNumber('MAT-FIND-001');
      
      expect(found).toBeDefined();
      expect(found.materialNumber).toBe('MAT-FIND-001');
    });
    
    test('findByNumber() should not find removed materials', async () => {
      await Material.create({
        materialNumber: 'MAT-REMOVED-001',
        materialName: { zh: '已删除' },
        removed: true,
        createdBy: testAdmin._id
      });
      
      const found = await Material.findByNumber('MAT-REMOVED-001');
      
      expect(found).toBeNull();
    });
    
    test('findByCategory() should find materials in category', async () => {
      await Material.create([
        {
          materialNumber: 'MAT-CAT-001',
          materialName: { zh: '分类1' },
          category: testCategory._id,
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'MAT-CAT-002',
          materialName: { zh: '分类2' },
          category: testCategory._id,
          createdBy: testAdmin._id
        }
      ]);
      
      const materials = await Material.findByCategory(testCategory._id);
      
      expect(materials).toHaveLength(2);
    });
    
    test('findByType() should filter by type', async () => {
      await Material.create([
        {
          materialNumber: 'MAT-TYPE-001',
          materialName: { zh: '原材料' },
          type: 'raw',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'MAT-TYPE-002',
          materialName: { zh: '成品' },
          type: 'finished',
          createdBy: testAdmin._id
        }
      ]);
      
      const rawMaterials = await Material.findByType('raw');
      
      expect(rawMaterials).toHaveLength(1);
      expect(rawMaterials[0].type).toBe('raw');
    });
    
    test('findByStatus() should filter by status', async () => {
      await Material.create([
        {
          materialNumber: 'MAT-STATUS-001',
          materialName: { zh: '激活1' },
          status: 'active',
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'MAT-STATUS-002',
          materialName: { zh: '草稿' },
          status: 'draft',
          createdBy: testAdmin._id
        }
      ]);
      
      const activeMaterials = await Material.findByStatus('active');
      
      expect(activeMaterials).toHaveLength(1);
      expect(activeMaterials[0].status).toBe('active');
    });
    
    test('search() should find by material number', async () => {
      await Material.create({
        materialNumber: 'MAT-SEARCH-001',
        materialName: { zh: '搜索测试' },
        createdBy: testAdmin._id
      });
      
      const results = await Material.search('MAT-SEARCH-001');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.materialNumber === 'MAT-SEARCH-001')).toBe(true);
    });
    
    test('search() should find by Chinese name', async () => {
      await Material.create({
        materialNumber: 'MAT-SEARCH-002',
        materialName: { zh: '搜索中文测试' },
        createdBy: testAdmin._id
      });
      
      const results = await Material.search('搜索中文');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.materialName.zh.includes('搜索中文'))).toBe(true);
    });
    
    test('search() should find by brand', async () => {
      await Material.create({
        materialNumber: 'MAT-BRAND-001',
        materialName: { zh: '品牌测试' },
        brand: 'TestBrand',
        createdBy: testAdmin._id
      });
      
      const results = await Material.search('TestBrand');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.brand === 'TestBrand')).toBe(true);
    });
    
    test('getStatistics() should return material stats', async () => {
      await Material.create([
        {
          materialNumber: 'MAT-STAT-001',
          materialName: { zh: '统计1' },
          type: 'raw',
          status: 'active',
          standardCost: 100,
          createdBy: testAdmin._id
        },
        {
          materialNumber: 'MAT-STAT-002',
          materialName: { zh: '统计2' },
          type: 'finished',
          status: 'draft',
          standardCost: 200,
          createdBy: testAdmin._id
        }
      ]);
      
      const stats = await Material.getStatistics();
      
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.active).toBeGreaterThanOrEqual(1);
      expect(stats.draft).toBeGreaterThanOrEqual(1);
      expect(stats.raw).toBeGreaterThanOrEqual(1);
      expect(stats.finished).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('Pre-save Hook', () => {
    test('should update updatedAt on save', async () => {
      const material = await Material.create({
        materialNumber: 'MAT-UPDATE-001',
        materialName: { zh: '更新测试' },
        createdBy: testAdmin._id
      });
      
      const originalUpdatedAt = material.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      material.abbreviation = 'UPD';
      await material.save();
      
      expect(material.updatedAt).toBeDefined();
      if (originalUpdatedAt) {
        expect(material.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }
    });
    
    test('should enforce only one primary supplier', async () => {
      const material = new Material({
        materialNumber: 'MAT-PRIMARY-001',
        materialName: { zh: '主供应商测试' },
        preferredSuppliers: [
          { supplier: testSupplier._id, isPrimary: true },
          { supplier: testSupplier._id, isPrimary: true }
        ],
        createdBy: testAdmin._id
      });
      
      await expect(material.save()).rejects.toThrow('Only one primary supplier allowed');
    });
  });
  
  describe('Indexes', () => {
    test('should have index on materialNumber', async () => {
      const indexes = Material.schema.indexes();
      const materialNumberIndex = indexes.find(idx => idx[0].materialNumber);
      
      expect(materialNumberIndex).toBeDefined();
    });
    
    test('should have text index on material names', async () => {
      const indexes = Material.schema.indexes();
      const textIndex = indexes.find(idx => 
        idx[0]['materialName.zh'] === 'text' || idx[0]['materialName.en'] === 'text'
      );
      
      expect(textIndex).toBeDefined();
    });
    
    test('should have compound indexes', async () => {
      const indexes = Material.schema.indexes();
      const statusTypeIndex = indexes.find(idx => 
        idx[0].status && idx[0].type
      );
      
      expect(statusTypeIndex).toBeDefined();
    });
  });
});

