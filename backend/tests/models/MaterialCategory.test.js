const mongoose = require('mongoose');
const MaterialCategory = require('../../src/models/appModels/MaterialCategory');
const Admin = require('../../src/models/coreModels/Admin');

describe('MaterialCategory Model', () => {
  let testAdmin;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'category-test@test.com',
      password: 'password123',
      name: 'Category',
      surname: 'Tester',
      enabled: true
    });
  });
  
  afterEach(async () => {
    await MaterialCategory.deleteMany({});
  });
  
  describe('Schema Validation', () => {
    test('should create category with all required fields', async () => {
      const category = await MaterialCategory.create({
        code: 'RAW001',
        name: { zh: '原材料' },
        createdBy: testAdmin._id
      });
      
      expect(category.code).toBe('RAW001');
      expect(category.name.zh).toBe('原材料');
      expect(category.level).toBe(0);
      expect(category.path).toBe('/');
      expect(category.isActive).toBe(true);
      expect(category.displayOrder).toBe(0);
    });
    
    test('should require category code', async () => {
      const category = new MaterialCategory({
        name: { zh: 'Test' },
        createdBy: testAdmin._id
      });
      
      await expect(category.save()).rejects.toThrow();
    });
    
    test('should require Chinese name', async () => {
      const category = new MaterialCategory({
        code: 'TEST001',
        createdBy: testAdmin._id
      });
      
      await expect(category.save()).rejects.toThrow();
    });
    
    test('should uppercase category code', async () => {
      const category = await MaterialCategory.create({
        code: 'raw001',
        name: { zh: '测试' },
        createdBy: testAdmin._id
      });
      
      expect(category.code).toBe('RAW001');
    });
    
    test('should enforce unique code', async () => {
      await MaterialCategory.create({
        code: 'DUP001',
        name: { zh: '重复1' },
        createdBy: testAdmin._id
      });
      
      await expect(MaterialCategory.create({
        code: 'DUP001',
        name: { zh: '重复2' },
        createdBy: testAdmin._id
      })).rejects.toThrow();
    });
    
    test('should accept English name', async () => {
      const category = await MaterialCategory.create({
        code: 'ENG001',
        name: { zh: '中文', en: 'English' },
        createdBy: testAdmin._id
      });
      
      expect(category.name.en).toBe('English');
    });
    
    test('should set default values', async () => {
      const category = await MaterialCategory.create({
        code: 'DEF001',
        name: { zh: '默认值' },
        createdBy: testAdmin._id
      });
      
      expect(category.level).toBe(0);
      expect(category.path).toBe('/');
      expect(category.displayOrder).toBe(0);
      expect(category.isActive).toBe(true);
      expect(category.parent).toBeNull();
    });
  });
  
  describe('Hierarchy Management', () => {
    let rootCategory;
    
    beforeEach(async () => {
      rootCategory = await MaterialCategory.create({
        code: 'ROOT',
        name: { zh: '根分类' },
        createdBy: testAdmin._id
      });
    });
    
    test('should create child category with correct level and path', async () => {
      const child = await MaterialCategory.create({
        code: 'CHILD',
        name: { zh: '子分类' },
        parent: rootCategory._id,
        createdBy: testAdmin._id
      });
      
      expect(child.level).toBe(1);
      expect(child.path).toBe('/ROOT/');
      expect(child.parent.toString()).toBe(rootCategory._id.toString());
    });
    
    test('should create grandchild with correct level and path', async () => {
      const child = await MaterialCategory.create({
        code: 'CHILD',
        name: { zh: '子分类' },
        parent: rootCategory._id,
        createdBy: testAdmin._id
      });
      
      const grandchild = await MaterialCategory.create({
        code: 'GRAND',
        name: { zh: '孙分类' },
        parent: child._id,
        createdBy: testAdmin._id
      });
      
      expect(grandchild.level).toBe(2);
      expect(grandchild.path).toBe('/ROOT/CHILD/');
    });
    
    test('should throw error if parent not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(MaterialCategory.create({
        code: 'ORPHAN',
        name: { zh: '孤儿' },
        parent: fakeId,
        createdBy: testAdmin._id
      })).rejects.toThrow('Parent category not found');
    });
    
    test('should update level and path when parent changes', async () => {
      const child = await MaterialCategory.create({
        code: 'CHILD',
        name: { zh: '子分类' },
        createdBy: testAdmin._id
      });
      
      expect(child.level).toBe(0);
      expect(child.path).toBe('/');
      
      child.parent = rootCategory._id;
      await child.save();
      
      expect(child.level).toBe(1);
      expect(child.path).toBe('/ROOT/');
    });
  });
  
  describe('Instance Methods', () => {
    let root, child1, child2, grandchild;
    
    beforeEach(async () => {
      root = await MaterialCategory.create({
        code: 'ROOT',
        name: { zh: '根' },
        createdBy: testAdmin._id
      });
      
      child1 = await MaterialCategory.create({
        code: 'CHILD1',
        name: { zh: '子1' },
        parent: root._id,
        displayOrder: 1,
        createdBy: testAdmin._id
      });
      
      child2 = await MaterialCategory.create({
        code: 'CHILD2',
        name: { zh: '子2' },
        parent: root._id,
        displayOrder: 2,
        createdBy: testAdmin._id
      });
      
      grandchild = await MaterialCategory.create({
        code: 'GRAND',
        name: { zh: '孙' },
        parent: child1._id,
        createdBy: testAdmin._id
      });
    });
    
    test('getChildren() should return direct children', async () => {
      const children = await root.getChildren(false);
      
      expect(children).toHaveLength(2);
      expect(children[0].code).toBe('CHILD1');
      expect(children[1].code).toBe('CHILD2');
    });
    
    test('getChildren(true) should return all descendants', async () => {
      const descendants = await root.getChildren(true);
      
      expect(descendants).toHaveLength(3); // child1, child2, grandchild
      const codes = descendants.map(d => d.code);
      expect(codes).toContain('CHILD1');
      expect(codes).toContain('CHILD2');
      expect(codes).toContain('GRAND');
    });
    
    test('getAncestors() should return parent chain', async () => {
      const ancestors = await grandchild.getAncestors();
      
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].code).toBe('ROOT');
      expect(ancestors[1].code).toBe('CHILD1');
    });
    
    test('getAncestors() should return empty array for root', async () => {
      const ancestors = await root.getAncestors();
      
      expect(ancestors).toHaveLength(0);
    });
    
    test('getFullPath() should return complete path', () => {
      expect(root.getFullPath()).toBe('/ROOT');
      expect(child1.getFullPath()).toBe('/ROOT/CHILD1');
      expect(grandchild.getFullPath()).toBe('/ROOT/CHILD1/GRAND');
    });
    
    test('isAncestorOf() should detect ancestor relationship', () => {
      expect(root.isAncestorOf(child1)).toBe(true);
      expect(root.isAncestorOf(grandchild)).toBe(true);
      expect(child1.isAncestorOf(grandchild)).toBe(true);
      expect(child1.isAncestorOf(child2)).toBe(false);
      expect(grandchild.isAncestorOf(root)).toBe(false);
    });
    
    test('activate() should set isActive to true', async () => {
      child1.isActive = false;
      await child1.save();
      
      await child1.activate();
      
      expect(child1.isActive).toBe(true);
    });
    
    test('deactivate() should set isActive to false', async () => {
      await child1.deactivate();
      
      expect(child1.isActive).toBe(false);
    });
    
    test('format() should return formatted data', () => {
      const formatted = root.format();
      
      expect(formatted.id).toBeDefined();
      expect(formatted.code).toBe('ROOT');
      expect(formatted.name.zh).toBe('根');
      expect(formatted.level).toBe(0);
      expect(formatted.path).toBe('/');
      expect(formatted.fullPath).toBe('/ROOT');
      expect(formatted.isActive).toBe(true);
    });
  });
  
  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create hierarchy
      const root1 = await MaterialCategory.create({
        code: 'ROOT1',
        name: { zh: '根1' },
        displayOrder: 1,
        createdBy: testAdmin._id
      });
      
      const root2 = await MaterialCategory.create({
        code: 'ROOT2',
        name: { zh: '根2' },
        displayOrder: 2,
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create({
        code: 'CHILD1',
        name: { zh: '子1' },
        parent: root1._id,
        createdBy: testAdmin._id
      });
      
      await MaterialCategory.create({
        code: 'CHILD2',
        name: { zh: '子2' },
        parent: root1._id,
        createdBy: testAdmin._id
      });
      
      // Inactive category
      await MaterialCategory.create({
        code: 'INACTIVE',
        name: { zh: '停用' },
        isActive: false,
        createdBy: testAdmin._id
      });
    });
    
    test('getRootCategories() should return only root categories', async () => {
      const roots = await MaterialCategory.getRootCategories();
      
      expect(roots).toHaveLength(2);
      expect(roots[0].code).toBe('ROOT1');
      expect(roots[1].code).toBe('ROOT2');
      expect(roots.every(r => r.parent === null)).toBe(true);
    });
    
    test('getRootCategories() should not return inactive', async () => {
      const roots = await MaterialCategory.getRootCategories();
      
      const inactiveCat = roots.find(r => r.code === 'INACTIVE');
      expect(inactiveCat).toBeUndefined();
    });
    
    test('buildTree() should create hierarchical structure', async () => {
      const tree = await MaterialCategory.buildTree();
      
      expect(tree).toHaveLength(2); // Two root categories
      expect(tree[0].code).toBe('ROOT1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].code).toBe('CHILD1');
    });
    
    test('buildTree(parentId) should build subtree', async () => {
      const root1 = await MaterialCategory.findOne({ code: 'ROOT1' });
      const subtree = await MaterialCategory.buildTree(root1._id);
      
      expect(subtree).toHaveLength(2); // Two children
      expect(subtree[0].code).toBe('CHILD1');
    });
    
    test('findByCode() should find category by code', async () => {
      const category = await MaterialCategory.findByCode('ROOT1');
      
      expect(category).toBeDefined();
      expect(category.code).toBe('ROOT1');
    });
    
    test('findByCode() should be case-insensitive', async () => {
      const category = await MaterialCategory.findByCode('root1');
      
      expect(category).toBeDefined();
      expect(category.code).toBe('ROOT1');
    });
    
    test('getByLevel() should return categories at level', async () => {
      const level0 = await MaterialCategory.getByLevel(0);
      const level1 = await MaterialCategory.getByLevel(1);
      
      expect(level0).toHaveLength(2);
      expect(level1).toHaveLength(2);
      expect(level0.every(c => c.level === 0)).toBe(true);
      expect(level1.every(c => c.level === 1)).toBe(true);
    });
    
    test('search() should find by code', async () => {
      const results = await MaterialCategory.search('ROOT1');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.code === 'ROOT1')).toBe(true);
    });
    
    test('search() should find by Chinese name', async () => {
      const results = await MaterialCategory.search('根1');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.name.zh === '根1')).toBe(true);
    });
    
    test('search() should be case-insensitive', async () => {
      const results = await MaterialCategory.search('root');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
    
    test('getStatistics() should return category stats', async () => {
      const stats = await MaterialCategory.getStatistics();
      
      expect(stats.totalCategories).toBeGreaterThanOrEqual(4);
      expect(stats.maxLevel).toBeGreaterThanOrEqual(1);
    });
    
    test('validateNoCircularRef() should detect circular reference', async () => {
      const root = await MaterialCategory.findOne({ code: 'ROOT1' });
      const child = await MaterialCategory.findOne({ code: 'CHILD1' });
      
      // Try to make root a child of child (circular!)
      const isValid = await MaterialCategory.validateNoCircularRef(root._id, child._id);
      
      expect(isValid).toBe(false);
    });
    
    test('validateNoCircularRef() should allow valid parent', async () => {
      const root = await MaterialCategory.findOne({ code: 'ROOT1' });
      const root2 = await MaterialCategory.findOne({ code: 'ROOT2' });
      
      const isValid = await MaterialCategory.validateNoCircularRef(root._id, root2._id);
      
      expect(isValid).toBe(true);
    });
    
    test('validateNoCircularRef() should reject self-reference', async () => {
      const root = await MaterialCategory.findOne({ code: 'ROOT1' });
      
      const isValid = await MaterialCategory.validateNoCircularRef(root._id, root._id);
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('Indexes', () => {
    test('should have index on code', async () => {
      const indexes = MaterialCategory.schema.indexes();
      const codeIndex = indexes.find(idx => idx[0].code);
      
      expect(codeIndex).toBeDefined();
    });
    
    test('should have index on parent', async () => {
      const indexes = MaterialCategory.schema.indexes();
      const parentIndex = indexes.find(idx => idx[0].parent);
      
      expect(parentIndex).toBeDefined();
    });
    
    test('should have compound index on parent and displayOrder', async () => {
      const indexes = MaterialCategory.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].parent && idx[0].displayOrder
      );
      
      expect(compoundIndex).toBeDefined();
    });
  });
  
  describe('Pre-save Hook', () => {
    test('should update updatedAt on save', async () => {
      const category = await MaterialCategory.create({
        code: 'UPDATE',
        name: { zh: '更新测试' },
        createdBy: testAdmin._id
      });
      
      const originalUpdatedAt = category.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      category.description = 'Updated description';
      await category.save();
      
      expect(category.updatedAt).toBeDefined();
      if (originalUpdatedAt) {
        expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }
    });
  });
});

