const mongoose = require('mongoose');
const MaterialCategoryService = require('../../src/services/MaterialCategoryService');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Admin = require('../../src/models/coreModels/Admin');
const AuditLogService = require('../../src/services/AuditLogService');

jest.mock('../../src/services/AuditLogService');

describe('MaterialCategoryService', () => {
  let testAdmin;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'category-service-test@test.com',
      password: 'password123',
      name: 'CategoryService',
      surname: 'Tester',
      enabled: true
    });
  });
  
  afterEach(async () => {
    await MaterialCategory.deleteMany({});
    jest.clearAllMocks();
  });
  
  describe('createCategory', () => {
    test('should create category with valid data', async () => {
      const categoryData = {
        code: 'RAW',
        name: { zh: '原材料', en: 'Raw Material' },
        description: 'Raw materials category'
      };
      
      const category = await MaterialCategoryService.createCategory(categoryData, testAdmin._id);
      
      expect(category).toBeDefined();
      expect(category.code).toBe('RAW');
      expect(category.name.zh).toBe('原材料');
      expect(category.level).toBe(0);
      expect(category.path).toBe('/');
    });
    
    test('should create child category with parent', async () => {
      const parent = await MaterialCategory.create({
        code: 'PARENT',
        name: { zh: '父分类' },
        createdBy: testAdmin._id
      });
      
      const categoryData = {
        code: 'CHILD',
        name: { zh: '子分类' },
        parent: parent._id
      };
      
      const category = await MaterialCategoryService.createCategory(categoryData, testAdmin._id);
      
      expect(category.level).toBe(1);
      expect(category.path).toBe('/PARENT/');
      expect(category.parent.toString()).toBe(parent._id.toString());
    });
    
    test('should log creation in audit log', async () => {
      const categoryData = {
        code: 'TEST',
        name: { zh: '测试' }
      };
      
      await MaterialCategoryService.createCategory(categoryData, testAdmin._id);
      
      expect(AuditLogService.logCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'MaterialCategory'
        })
      );
    });
    
    test('should throw error for invalid parent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const categoryData = {
        code: 'ORPHAN',
        name: { zh: '孤儿' },
        parent: fakeId
      };
      
      await expect(
        MaterialCategoryService.createCategory(categoryData, testAdmin._id)
      ).rejects.toThrow();
    });
  });
  
  describe('getCategory', () => {
    let category;
    
    beforeEach(async () => {
      category = await MaterialCategory.create({
        code: 'GET',
        name: { zh: '获取测试' },
        createdBy: testAdmin._id
      });
    });
    
    test('should get category by ID', async () => {
      const result = await MaterialCategoryService.getCategory(category._id);
      
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(category._id.toString());
      expect(result.code).toBe('GET');
    });
    
    test('should populate parent if requested', async () => {
      const parent = await MaterialCategory.create({
        code: 'PARENT2',
        name: { zh: '父级' },
        createdBy: testAdmin._id
      });
      
      const child = await MaterialCategory.create({
        code: 'CHILD2',
        name: { zh: '子级' },
        parent: parent._id,
        createdBy: testAdmin._id
      });
      
      const result = await MaterialCategoryService.getCategory(child._id, {
        populate: ['parent']
      });
      
      expect(result.parent).toBeDefined();
      expect(result.parent.code).toBe('PARENT2');
    });
    
    test('should throw error if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        MaterialCategoryService.getCategory(fakeId)
      ).rejects.toThrow('Category not found');
    });
  });
  
  describe('listCategories', () => {
    beforeEach(async () => {
      const root = await MaterialCategory.create({
        code: 'ROOT',
        name: { zh: '根' },
        displayOrder: 1,
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create([
        {
          code: 'CHILD1',
          name: { zh: '子1' },
          parent: root._id,
          displayOrder: 1,
          createdBy: testAdmin._id
        },
        {
          code: 'CHILD2',
          name: { zh: '子2' },
          parent: root._id,
          displayOrder: 2,
          createdBy: testAdmin._id
        },
        {
          code: 'INACTIVE',
          name: { zh: '停用' },
          isActive: false,
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should list all categories', async () => {
      const result = await MaterialCategoryService.listCategories();
      
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(4);
      expect(result.pagination.count).toBe(4);
    });
    
    test('should filter by parent', async () => {
      const root = await MaterialCategory.findOne({ code: 'ROOT' });
      
      const result = await MaterialCategoryService.listCategories({
        parent: root._id
      });
      
      expect(result.result).toHaveLength(2);
      // Check parent field exists and matches (may be ObjectId or populated)
      expect(result.result.every(c => {
        const parentId = c.parent._id || c.parent;
        return parentId.toString() === root._id.toString();
      })).toBe(true);
    });
    
    test('should filter by level', async () => {
      const result = await MaterialCategoryService.listCategories({
        level: 1
      });
      
      expect(result.result).toHaveLength(2);
      expect(result.result.every(c => c.level === 1)).toBe(true);
    });
    
    test('should filter by isActive', async () => {
      const result = await MaterialCategoryService.listCategories({
        isActive: false
      });
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0].code).toBe('INACTIVE');
    });
    
    test('should search by code', async () => {
      const result = await MaterialCategoryService.listCategories({
        search: 'ROOT'
      });
      
      expect(result.result.length).toBeGreaterThanOrEqual(1);
      expect(result.result.some(c => c.code === 'ROOT')).toBe(true);
    });
    
    test('should paginate results', async () => {
      const result = await MaterialCategoryService.listCategories({}, {
        page: 1,
        items: 2
      });
      
      expect(result.result).toHaveLength(2);
      expect(result.pagination.pages).toBe(2);
    });
  });
  
  describe('getCategoryTree', () => {
    beforeEach(async () => {
      const root = await MaterialCategory.create({
        code: 'TREE',
        name: { zh: '树' },
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create({
        code: 'BRANCH',
        name: { zh: '分支' },
        parent: root._id,
        createdBy: testAdmin._id
      });
    });
    
    test('should build tree structure', async () => {
      const tree = await MaterialCategoryService.getCategoryTree();
      
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBeGreaterThanOrEqual(1);
      
      const treeNode = tree.find(n => n.code === 'TREE');
      expect(treeNode).toBeDefined();
      expect(treeNode.children).toHaveLength(1);
      expect(treeNode.children[0].code).toBe('BRANCH');
    });
    
    test('should exclude inactive if activeOnly=true', async () => {
      await MaterialCategory.create({
        code: 'INACTIVE2',
        name: { zh: '停用2' },
        isActive: false,
        createdBy: testAdmin._id
      });
      
      const tree = await MaterialCategoryService.getCategoryTree(null, true);
      
      const inactiveNode = tree.find(n => n.code === 'INACTIVE2');
      expect(inactiveNode).toBeUndefined();
    });
  });
  
  describe('updateCategory', () => {
    let category;
    
    beforeEach(async () => {
      category = await MaterialCategory.create({
        code: 'UPDATE',
        name: { zh: '更新' },
        createdBy: testAdmin._id
      });
    });
    
    test('should update category data', async () => {
      const updateData = {
        name: { zh: '更新后', en: 'Updated' },
        description: 'New description'
      };
      
      const updated = await MaterialCategoryService.updateCategory(
        category._id,
        updateData,
        testAdmin._id
      );
      
      expect(updated.name.zh).toBe('更新后');
      expect(updated.name.en).toBe('Updated');
      expect(updated.description).toBe('New description');
    });
    
    test('should log update in audit log', async () => {
      await MaterialCategoryService.updateCategory(
        category._id,
        { description: 'Updated' },
        testAdmin._id
      );
      
      expect(AuditLogService.logUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          entityType: 'MaterialCategory',
          entityId: category._id
        })
      );
    });
    
    test('should throw error if category not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        MaterialCategoryService.updateCategory(fakeId, {}, testAdmin._id)
      ).rejects.toThrow('Category not found');
    });
    
    test('should prevent circular reference', async () => {
      const parent = await MaterialCategory.create({
        code: 'PARENT3',
        name: { zh: '父' },
        createdBy: testAdmin._id
      });
      
      const child = await MaterialCategory.create({
        code: 'CHILD3',
        name: { zh: '子' },
        parent: parent._id,
        createdBy: testAdmin._id
      });
      
      // Try to make parent a child of child (circular!)
      await expect(
        MaterialCategoryService.updateCategory(
          parent._id,
          { parent: child._id },
          testAdmin._id
        )
      ).rejects.toThrow('circular reference');
    });
  });
  
  describe('deleteCategory', () => {
    let category;
    
    beforeEach(async () => {
      category = await MaterialCategory.create({
        code: 'DELETE',
        name: { zh: '删除' },
        createdBy: testAdmin._id
      });
    });
    
    test('should deactivate category', async () => {
      await MaterialCategoryService.deleteCategory(category._id, testAdmin._id);
      
      const deleted = await MaterialCategory.findById(category._id);
      expect(deleted.isActive).toBe(false);
    });
    
    test('should prevent deleting category with children', async () => {
      const parent = await MaterialCategory.create({
        code: 'PARENT4',
        name: { zh: '有子级' },
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create({
        code: 'CHILD4',
        name: { zh: '子级' },
        parent: parent._id,
        createdBy: testAdmin._id
      });
      
      await expect(
        MaterialCategoryService.deleteCategory(parent._id, testAdmin._id)
      ).rejects.toThrow('Cannot delete category with children');
    });
    
    test('should log deletion', async () => {
      await MaterialCategoryService.deleteCategory(category._id, testAdmin._id);
      
      expect(AuditLogService.logDelete).toHaveBeenCalled();
    });
  });
  
  describe('activateCategory', () => {
    test('should activate inactive category', async () => {
      const category = await MaterialCategory.create({
        code: 'ACTIVATE',
        name: { zh: '激活' },
        isActive: false,
        createdBy: testAdmin._id
      });
      
      const result = await MaterialCategoryService.activateCategory(
        category._id,
        testAdmin._id
      );
      
      expect(result.isActive).toBe(true);
    });
  });
  
  describe('deactivateCategory', () => {
    test('should deactivate active category', async () => {
      const category = await MaterialCategory.create({
        code: 'DEACTIVATE',
        name: { zh: '停用' },
        isActive: true,
        createdBy: testAdmin._id
      });
      
      const result = await MaterialCategoryService.deactivateCategory(
        category._id,
        testAdmin._id
      );
      
      expect(result.isActive).toBe(false);
    });
  });
  
  describe('searchCategories', () => {
    beforeEach(async () => {
      await MaterialCategory.create([
        {
          code: 'SEARCH1',
          name: { zh: '搜索测试1' },
          createdBy: testAdmin._id
        },
        {
          code: 'SEARCH2',
          name: { zh: '搜索测试2' },
          createdBy: testAdmin._id
        }
      ]);
    });
    
    test('should search by code', async () => {
      const results = await MaterialCategoryService.searchCategories('SEARCH1');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(c => c.code === 'SEARCH1')).toBe(true);
    });
    
    test('should search by name', async () => {
      const results = await MaterialCategoryService.searchCategories('搜索测试');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('getCategoryByCode', () => {
    test('should find category by code', async () => {
      await MaterialCategory.create({
        code: 'BYCODE',
        name: { zh: '代码查找' },
        createdBy: testAdmin._id
      });
      
      const result = await MaterialCategoryService.getCategoryByCode('BYCODE');
      
      expect(result).toBeDefined();
      expect(result.code).toBe('BYCODE');
    });
    
    test('should throw error if not found', async () => {
      await expect(
        MaterialCategoryService.getCategoryByCode('NOTEXIST')
      ).rejects.toThrow('Category not found');
    });
  });
  
  describe('getStatistics', () => {
    test('should return category statistics', async () => {
      await MaterialCategory.create([
        {
          code: 'STAT1',
          name: { zh: '统计1' },
          createdBy: testAdmin._id
        },
        {
          code: 'STAT2',
          name: { zh: '统计2' },
          createdBy: testAdmin._id
        }
      ]);
      
      const stats = await MaterialCategoryService.getStatistics();
      
      expect(stats.totalCategories).toBeGreaterThanOrEqual(2);
      expect(stats.maxLevel).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('getChildren', () => {
    test('should get direct children', async () => {
      const parent = await MaterialCategory.create({
        code: 'GETCHILD',
        name: { zh: '获取子级' },
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create({
        code: 'CHILD5',
        name: { zh: '子5' },
        parent: parent._id,
        createdBy: testAdmin._id
      });
      
      const children = await MaterialCategoryService.getChildren(parent._id);
      
      expect(children).toHaveLength(1);
      expect(children[0].code).toBe('CHILD5');
    });
  });
  
  describe('getAncestors', () => {
    test('should get parent chain', async () => {
      const root = await MaterialCategory.create({
        code: 'ANCESTOR1',
        name: { zh: '祖先1' },
        createdBy: testAdmin._id
      });
      
      const child = await MaterialCategory.create({
        code: 'ANCESTOR2',
        name: { zh: '祖先2' },
        parent: root._id,
        createdBy: testAdmin._id
      });
      
      const grandchild = await MaterialCategory.create({
        code: 'ANCESTOR3',
        name: { zh: '祖先3' },
        parent: child._id,
        createdBy: testAdmin._id
      });
      
      const ancestors = await MaterialCategoryService.getAncestors(grandchild._id);
      
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].code).toBe('ANCESTOR1');
      expect(ancestors[1].code).toBe('ANCESTOR2');
    });
  });
});

