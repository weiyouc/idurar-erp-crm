/**
 * Admin Model Unit Tests
 * 
 * Tests for Admin model with RBAC extensions.
 */

const mongoose = require('mongoose');
const Admin = require('../../src/models/coreModels/Admin');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');
const { adminData, roleData, permissionData, generateObjectId } = require('../helpers/testData');

describe('Admin Model', () => {
  
  describe('Schema Validation', () => {
    
    test('should create a valid admin', async () => {
      const admin = await Admin.create(adminData.valid);
      
      expect(admin._id).toBeDefined();
      expect(admin.email).toBe(adminData.valid.email);
      expect(admin.name).toBe(adminData.valid.name);
      expect(admin.enabled).toBe(true);
      expect(admin.removed).toBe(false);
    });
    
    test('should require email field', async () => {
      const admin = new Admin({
        name: 'Test'
      });
      
      await expect(admin.save()).rejects.toThrow();
    });
    
    test('should require name field', async () => {
      const admin = new Admin({
        email: 'test@example.com'
      });
      
      await expect(admin.save()).rejects.toThrow();
    });
    
    test('should convert email to lowercase', async () => {
      const admin = await Admin.create({
        email: 'TEST@EXAMPLE.COM',
        name: 'Test',
        role: 'owner'
      });
      
      expect(admin.email).toBe('test@example.com');
    });
    
    test('should default enabled to false', async () => {
      const admin = await Admin.create({
        email: 'test@example.com',
        name: 'Test',
        role: 'owner'
      });
      
      expect(admin.enabled).toBe(false);
    });
    
    test('should default removed to false', async () => {
      const admin = await Admin.create(adminData.valid);
      
      expect(admin.removed).toBe(false);
    });
    
    test('should default role to "owner"', async () => {
      const admin = await Admin.create({
        email: 'test@example.com',
        name: 'Test'
      });
      
      expect(admin.role).toBe('owner');
    });
    
  });
  
  describe('RBAC Extension Fields', () => {
    
    test('should accept roles array', async () => {
      const role = await Role.create(roleData.valid);
      
      const admin = await Admin.create({
        ...adminData.valid,
        roles: [role._id]
      });
      
      expect(admin.roles).toHaveLength(1);
      expect(admin.roles[0].toString()).toBe(role._id.toString());
    });
    
    test('should accept multiple roles', async () => {
      const role1 = await Role.create({
        ...roleData.valid,
        name: 'role1'
      });
      const role2 = await Role.create({
        ...roleData.valid,
        name: 'role2'
      });
      
      const admin = await Admin.create({
        ...adminData.valid,
        roles: [role1._id, role2._id]
      });
      
      expect(admin.roles).toHaveLength(2);
    });
    
    test('should accept department field', async () => {
      const admin = await Admin.create({
        ...adminData.withRoles,
        department: 'Procurement'
      });
      
      expect(admin.department).toBe('Procurement');
    });
    
    test('should accept reportsTo field', async () => {
      const manager = await Admin.create({
        email: 'manager@example.com',
        name: 'Manager',
        role: 'owner'
      });
      
      const employee = await Admin.create({
        ...adminData.valid,
        reportsTo: manager._id
      });
      
      expect(employee.reportsTo.toString()).toBe(manager._id.toString());
    });
    
    test('should accept managerOf array', async () => {
      const employee1 = await Admin.create({
        email: 'emp1@example.com',
        name: 'Employee1',
        role: 'owner'
      });
      const employee2 = await Admin.create({
        email: 'emp2@example.com',
        name: 'Employee2',
        role: 'owner'
      });
      
      const manager = await Admin.create({
        ...adminData.valid,
        managerOf: [employee1._id, employee2._id]
      });
      
      expect(manager.managerOf).toHaveLength(2);
    });
    
    test('should accept approvalAuthority', async () => {
      const admin = await Admin.create(adminData.withRoles);
      
      expect(admin.approvalAuthority.maxAmount).toBe(50000);
      expect(admin.approvalAuthority.currency).toBe('CNY');
      expect(admin.approvalAuthority.documentTypes).toContain('purchase_order');
    });
    
    test('should default approvalAuthority.currency to CNY', async () => {
      const admin = await Admin.create({
        ...adminData.valid,
        approvalAuthority: {
          maxAmount: 10000,
          documentTypes: ['purchase_order']
        }
      });
      
      expect(admin.approvalAuthority.currency).toBe('CNY');
    });
    
    test('should accept preferences', async () => {
      const admin = await Admin.create(adminData.withRoles);
      
      expect(admin.preferences.language).toBe('zh-CN');
      expect(admin.preferences.notifications.email).toBe(true);
      expect(admin.preferences.notifications.inApp).toBe(true);
    });
    
    test('should default preferences.language to zh-CN', async () => {
      const admin = await Admin.create(adminData.valid);
      
      expect(admin.preferences.language).toBe('zh-CN');
    });
    
  });
  
  describe('Middleware', () => {
    
    test('should update "updated" timestamp on save', async () => {
      const admin = await Admin.create(adminData.valid);
      const originalUpdated = admin.updated;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      admin.name = 'Updated Name';
      await admin.save();
      
      expect(admin.updated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
    
  });
  
  describe('Virtuals', () => {
    
    test('should have fullName virtual', async () => {
      const admin = await Admin.create(adminData.valid);
      
      expect(admin.fullName).toBe('Test User');
    });
    
    test('should have fullName virtual without surname', async () => {
      const admin = await Admin.create({
        email: 'test@example.com',
        name: 'TestOnly',
        role: 'owner'
      });
      
      expect(admin.fullName).toBe('TestOnly');
    });
    
    test('should have hasApprovalAuthority virtual', async () => {
      const adminWithAuth = await Admin.create(adminData.withRoles);
      const adminWithoutAuth = await Admin.create(adminData.valid);
      
      expect(adminWithAuth.hasApprovalAuthority).toBe(true);
      expect(adminWithoutAuth.hasApprovalAuthority).toBe(false);
    });
    
    test('should include virtuals in JSON', () => {
      const admin = new Admin(adminData.valid);
      const json = admin.toJSON();
      
      expect(json.fullName).toBeDefined();
      expect(json.hasApprovalAuthority).toBeDefined();
    });
    
  });
  
  describe('Instance Methods', () => {
    
    describe('hasRole', () => {
      
      test('should return true if user has role', async () => {
        const role = await Role.create(roleData.valid);
        const admin = await Admin.create({
          ...adminData.valid,
          roles: [role._id]
        });
        
        const populatedAdmin = await Admin.findById(admin._id).populate('roles');
        
        expect(populatedAdmin.hasRole('test_role')).toBe(true);
      });
      
      test('should return false if user does not have role', async () => {
        const role = await Role.create(roleData.valid);
        const admin = await Admin.create({
          ...adminData.valid,
          roles: [role._id]
        });
        
        const populatedAdmin = await Admin.findById(admin._id).populate('roles');
        
        expect(populatedAdmin.hasRole('other_role')).toBe(false);
      });
      
      test('should return false if user has no roles', async () => {
        const admin = await Admin.create(adminData.valid);
        
        expect(admin.hasRole('test_role')).toBe(false);
      });
      
    });
    
    describe('canApprove', () => {
      
      test('should return true if within approval authority', async () => {
        const admin = await Admin.create(adminData.withRoles);
        
        expect(admin.canApprove('purchase_order', 30000, 'CNY')).toBe(true);
      });
      
      test('should return false if amount exceeds authority', async () => {
        const admin = await Admin.create(adminData.withRoles);
        
        expect(admin.canApprove('purchase_order', 100000, 'CNY')).toBe(false);
      });
      
      test('should return false if document type not in authority', async () => {
        const admin = await Admin.create(adminData.withRoles);
        
        expect(admin.canApprove('supplier', 10000, 'CNY')).toBe(false);
      });
      
      test('should return false if user has no approval authority', async () => {
        const admin = await Admin.create(adminData.valid);
        
        expect(admin.canApprove('purchase_order', 1000, 'CNY')).toBe(false);
      });
      
      test('should return false for currency mismatch', async () => {
        const admin = await Admin.create(adminData.withRoles);
        
        expect(admin.canApprove('purchase_order', 30000, 'USD')).toBe(false);
      });
      
      test('should return true if amount equals max authority', async () => {
        const admin = await Admin.create(adminData.withRoles);
        
        expect(admin.canApprove('purchase_order', 50000, 'CNY')).toBe(true);
      });
      
    });
    
    describe('getAllPermissions', () => {
      
      test('should return all permissions from all roles', async () => {
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
        
        const role1 = await Role.create({
          ...roleData.valid,
          name: 'role1',
          permissions: [perm1._id]
        });
        const role2 = await Role.create({
          ...roleData.valid,
          name: 'role2',
          permissions: [perm2._id]
        });
        
        const admin = await Admin.create({
          ...adminData.valid,
          roles: [role1._id, role2._id]
        });
        
        const permissions = await admin.getAllPermissions();
        
        expect(permissions).toHaveLength(2);
      });
      
      test('should return empty array if no roles', async () => {
        const admin = await Admin.create(adminData.valid);
        
        const permissions = await admin.getAllPermissions();
        
        expect(permissions).toHaveLength(0);
      });
      
    });
    
    describe('hasPermission', () => {
      
      test('should return true if user has permission', async () => {
        const permission = await Permission.create(permissionData.valid);
        const role = await Role.create({
          ...roleData.valid,
          permissions: [permission._id]
        });
        const admin = await Admin.create({
          ...adminData.valid,
          roles: [role._id]
        });
        
        const hasPermission = await admin.hasPermission('supplier', 'create', 'own');
        
        expect(hasPermission).toBe(true);
      });
      
      test('should return false if user does not have permission', async () => {
        const role = await Role.create(roleData.valid);
        const admin = await Admin.create({
          ...adminData.valid,
          roles: [role._id]
        });
        
        const hasPermission = await admin.hasPermission('supplier', 'delete', 'all');
        
        expect(hasPermission).toBe(false);
      });
      
    });
    
    describe('getTeamMembers', () => {
      
      test('should return team members', async () => {
        const employee1 = await Admin.create({
          email: 'emp1@example.com',
          name: 'Employee1',
          enabled: true,
          role: 'owner'
        });
        const employee2 = await Admin.create({
          email: 'emp2@example.com',
          name: 'Employee2',
          enabled: true,
          role: 'owner'
        });
        
        const manager = await Admin.create({
          ...adminData.valid,
          enabled: true,
          managerOf: [employee1._id, employee2._id]
        });
        
        const team = await manager.getTeamMembers();
        
        expect(team).toHaveLength(2);
      });
      
      test('should return empty array if no team members', async () => {
        const admin = await Admin.create(adminData.valid);
        
        const team = await admin.getTeamMembers();
        
        expect(team).toHaveLength(0);
      });
      
      test('should not return removed team members', async () => {
        const employee1 = await Admin.create({
          email: 'emp1@example.com',
          name: 'Employee1',
          enabled: true,
          removed: true,
          role: 'owner'
        });
        
        const manager = await Admin.create({
          ...adminData.valid,
          managerOf: [employee1._id]
        });
        
        const team = await manager.getTeamMembers();
        
        expect(team).toHaveLength(0);
      });
      
    });
    
  });
  
  describe('Static Methods', () => {
    
    describe('findByRole', () => {
      
      test('should find admins by role name', async () => {
        const role = await Role.create(roleData.valid);
        
        await Admin.create({
          ...adminData.valid,
          enabled: true,
          roles: [role._id]
        });
        await Admin.create({
          email: 'user2@example.com',
          name: 'User2',
          enabled: true,
          role: 'owner',
          roles: [role._id]
        });
        
        const admins = await Admin.findByRole('test_role');
        
        expect(admins).toHaveLength(2);
      });
      
      test('should return empty array for non-existent role', async () => {
        const admins = await Admin.findByRole('non_existent_role');
        
        expect(admins).toHaveLength(0);
      });
      
    });
    
    describe('findByDepartment', () => {
      
      test('should find admins by department', async () => {
        await Admin.create({
          ...adminData.valid,
          enabled: true,
          department: 'Procurement'
        });
        await Admin.create({
          email: 'user2@example.com',
          name: 'User2',
          enabled: true,
          role: 'owner',
          department: 'Procurement'
        });
        
        const admins = await Admin.findByDepartment('Procurement');
        
        expect(admins).toHaveLength(2);
      });
      
      test('should not return removed admins', async () => {
        await Admin.create({
          ...adminData.valid,
          enabled: true,
          removed: true,
          department: 'Procurement'
        });
        
        const admins = await Admin.findByDepartment('Procurement');
        
        expect(admins).toHaveLength(0);
      });
      
    });
    
    describe('findActive', () => {
      
      test('should return only active admins', async () => {
        await Admin.create({
          ...adminData.valid,
          enabled: true
        });
        await Admin.create({
          email: 'removed@example.com',
          name: 'Removed',
          enabled: true,
          removed: true,
          role: 'owner'
        });
        await Admin.create({
          email: 'disabled@example.com',
          name: 'Disabled',
          enabled: false,
          role: 'owner'
        });
        
        const admins = await Admin.findActive();
        
        expect(admins).toHaveLength(1);
        expect(admins[0].email).toBe(adminData.valid.email);
      });
      
    });
    
  });
  
});

