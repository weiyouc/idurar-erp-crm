/**
 * Role Model Unit Tests
 * 
 * Tests for Role model validation, methods, and behavior.
 */

const mongoose = require('mongoose');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');
const { roleData, permissionData, generateObjectId } = require('../helpers/testData');

describe('Role Model', () => {
  
  describe('Schema Validation', () => {
    
    test('should create a valid role', async () => {
      const role = new Role(roleData.valid);
      const savedRole = await role.save();
      
      expect(savedRole._id).toBeDefined();
      expect(savedRole.name).toBe(roleData.valid.name);
      expect(savedRole.displayName.zh).toBe(roleData.valid.displayName.zh);
      expect(savedRole.displayName.en).toBe(roleData.valid.displayName.en);
      expect(savedRole.removed).toBe(false);
      expect(savedRole.created).toBeDefined();
      expect(savedRole.updated).toBeDefined();
    });
    
    test('should require name field', async () => {
      const role = new Role({
        displayName: { zh: '测试', en: 'Test' }
      });
      
      await expect(role.save()).rejects.toThrow();
    });
    
    test('should require displayName.zh field', async () => {
      const role = new Role({
        name: 'test_role',
        displayName: { en: 'Test' }
      });
      
      await expect(role.save()).rejects.toThrow();
    });
    
    test('should require displayName.en field', async () => {
      const role = new Role({
        name: 'test_role',
        displayName: { zh: '测试' }
      });
      
      await expect(role.save()).rejects.toThrow();
    });
    
    test('should enforce unique name', async () => {
      await Role.create(roleData.valid);
      
      const duplicate = new Role(roleData.valid);
      await expect(duplicate.save()).rejects.toThrow();
    });
    
    test('should convert name to lowercase', async () => {
      const role = await Role.create({
        name: 'TEST_ROLE',
        displayName: { zh: '测试', en: 'Test' }
      });
      
      expect(role.name).toBe('test_role');
    });
    
    test('should validate name format (alphanumeric and underscores only)', async () => {
      const role = new Role(roleData.invalidName);
      
      await expect(role.save()).rejects.toThrow(/can only contain lowercase letters/);
    });
    
    test('should default isSystemRole to false', async () => {
      const role = await Role.create(roleData.valid);
      
      expect(role.isSystemRole).toBe(false);
    });
    
    test('should default removed to false', async () => {
      const role = await Role.create(roleData.valid);
      
      expect(role.removed).toBe(false);
    });
    
  });
  
  describe('Middleware', () => {
    
    test('should update "updated" timestamp on save', async () => {
      const role = await Role.create(roleData.valid);
      const originalUpdated = role.updated;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      role.description = 'Updated description';
      await role.save();
      
      expect(role.updated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
    
    test('should prevent deletion of system roles', async () => {
      const role = await Role.create(roleData.systemRole);
      
      await expect(role.deleteOne()).rejects.toThrow('Cannot delete system role');
    });
    
    test('should allow deletion of non-system roles', async () => {
      const role = await Role.create(roleData.valid);
      
      await expect(role.deleteOne()).resolves.toBeDefined();
    });
    
  });
  
  describe('Virtuals', () => {
    
    test('should have isDeletable virtual', async () => {
      const regularRole = await Role.create(roleData.valid);
      const systemRole = await Role.create(roleData.systemRole);
      
      expect(regularRole.isDeletable).toBe(true);
      expect(systemRole.isDeletable).toBe(false);
    });
    
    test('should include virtuals in JSON', () => {
      const role = new Role(roleData.valid);
      const json = role.toJSON();
      
      expect(json.isDeletable).toBeDefined();
    });
    
  });
  
  describe('Instance Methods', () => {
    
    test('getAllPermissions should return all permissions including inherited', async () => {
      // Create permissions
      const perm1 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'create'
      });
      const perm2 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'read'
      });
      const perm3 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'update'
      });
      
      // Create parent role with perm1
      const parentRole = await Role.create({
        name: 'parent_role',
        displayName: { zh: '父角色', en: 'Parent Role' },
        permissions: [perm1._id]
      });
      
      // Create child role with perm2, inheriting from parent
      const childRole = await Role.create({
        name: 'child_role',
        displayName: { zh: '子角色', en: 'Child Role' },
        permissions: [perm2._id],
        inheritsFrom: [parentRole._id]
      });
      
      const allPermissions = await childRole.getAllPermissions();
      
      expect(allPermissions).toHaveLength(2);
      expect(allPermissions.map(p => p.toString())).toContain(perm1._id.toString());
      expect(allPermissions.map(p => p.toString())).toContain(perm2._id.toString());
    });
    
    test('getAllPermissions should handle no permissions', async () => {
      const role = await Role.create(roleData.valid);
      const allPermissions = await role.getAllPermissions();
      
      expect(allPermissions).toHaveLength(0);
    });
    
    test('getAllPermissions should handle multiple inheritance levels', async () => {
      // Create permissions
      const perm1 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'create'
      });
      const perm2 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'read'
      });
      const perm3 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'update'
      });
      
      // Grandparent role
      const grandparentRole = await Role.create({
        name: 'grandparent_role',
        displayName: { zh: '祖父角色', en: 'Grandparent Role' },
        permissions: [perm1._id]
      });
      
      // Parent role
      const parentRole = await Role.create({
        name: 'parent_role',
        displayName: { zh: '父角色', en: 'Parent Role' },
        permissions: [perm2._id],
        inheritsFrom: [grandparentRole._id]
      });
      
      // Child role
      const childRole = await Role.create({
        name: 'child_role',
        displayName: { zh: '子角色', en: 'Child Role' },
        permissions: [perm3._id],
        inheritsFrom: [parentRole._id]
      });
      
      const allPermissions = await childRole.getAllPermissions();
      
      expect(allPermissions).toHaveLength(3);
      expect(allPermissions.map(p => p.toString())).toContain(perm1._id.toString());
      expect(allPermissions.map(p => p.toString())).toContain(perm2._id.toString());
      expect(allPermissions.map(p => p.toString())).toContain(perm3._id.toString());
    });
    
  });
  
  describe('Static Methods', () => {
    
    test('findActive should return only non-removed roles', async () => {
      const activeRole = await Role.create(roleData.valid);
      const removedRole = await Role.create({
        name: 'removed_role',
        displayName: { zh: '已删除', en: 'Removed' },
        removed: true
      });
      
      const activeRoles = await Role.findActive();
      
      expect(activeRoles).toHaveLength(1);
      expect(activeRoles[0]._id.toString()).toBe(activeRole._id.toString());
    });
    
    test('findSystemRoles should return only system roles', async () => {
      const regularRole = await Role.create(roleData.valid);
      const systemRole = await Role.create(roleData.systemRole);
      
      const systemRoles = await Role.findSystemRoles();
      
      expect(systemRoles).toHaveLength(1);
      expect(systemRoles[0]._id.toString()).toBe(systemRole._id.toString());
    });
    
    test('findSystemRoles should not return removed system roles', async () => {
      await Role.create({
        ...roleData.systemRole,
        removed: true
      });
      
      const systemRoles = await Role.findSystemRoles();
      
      expect(systemRoles).toHaveLength(0);
    });
    
  });
  
  describe('Permissions Assignment', () => {
    
    test('should accept permission references', async () => {
      const permission = await Permission.create(permissionData.valid);
      
      const role = await Role.create({
        ...roleData.valid,
        permissions: [permission._id]
      });
      
      expect(role.permissions).toHaveLength(1);
      expect(role.permissions[0].toString()).toBe(permission._id.toString());
    });
    
    test('should handle multiple permissions', async () => {
      const perm1 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'create'
      });
      const perm2 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'read'
      });
      const perm3 = await Permission.create({
        ...permissionData.valid,
        resource: 'supplier',
        action: 'update'
      });
      
      const role = await Role.create({
        ...roleData.valid,
        permissions: [perm1._id, perm2._id, perm3._id]
      });
      
      expect(role.permissions).toHaveLength(3);
    });
    
  });
  
  describe('Role Hierarchy', () => {
    
    test('should support inheritsFrom field', async () => {
      const parentRole = await Role.create({
        name: 'parent_role',
        displayName: { zh: '父角色', en: 'Parent Role' }
      });
      
      const childRole = await Role.create({
        name: 'child_role',
        displayName: { zh: '子角色', en: 'Child Role' },
        inheritsFrom: [parentRole._id]
      });
      
      expect(childRole.inheritsFrom).toHaveLength(1);
      expect(childRole.inheritsFrom[0].toString()).toBe(parentRole._id.toString());
    });
    
    test('should support multiple parent roles', async () => {
      const parent1 = await Role.create({
        name: 'parent1',
        displayName: { zh: '父角色1', en: 'Parent Role 1' }
      });
      
      const parent2 = await Role.create({
        name: 'parent2',
        displayName: { zh: '父角色2', en: 'Parent Role 2' }
      });
      
      const childRole = await Role.create({
        name: 'child_role',
        displayName: { zh: '子角色', en: 'Child Role' },
        inheritsFrom: [parent1._id, parent2._id]
      });
      
      expect(childRole.inheritsFrom).toHaveLength(2);
    });
    
  });
  
});

