/**
 * Seed Script: System Roles and Permissions
 * 
 * Creates the 12 predefined system roles for Silverplan with their permissions.
 * This script is idempotent - it can be run multiple times safely.
 * 
 * System Roles (12):
 * 1. System Administrator
 * 2. General Manager
 * 3. Procurement Manager
 * 4. Cost Center
 * 5. Finance Director
 * 6. Finance Personnel
 * 7. Purchaser
 * 8. Data Entry Personnel
 * 9. MRP Planner
 * 10. Warehouse Personnel
 * 11. Engineering
 * 12. Auditor
 * 
 * Usage:
 *   node setup/seedRoles.js
 */

const mongoose = require('mongoose');
const Role = require('../models/coreModels/Role');
const Permission = require('../models/coreModels/Permission');

// Define all system roles
const systemRoles = [
  {
    name: 'system_administrator',
    displayName: {
      zh: '系统管理员',
      en: 'System Administrator'
    },
    description: 'Full system access for configuration and user management',
    isSystemRole: true,
    permissions: []  // Will be populated with all permissions
  },
  {
    name: 'general_manager',
    displayName: {
      zh: '总经理',
      en: 'General Manager'
    },
    description: 'Executive oversight and final approval authority',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'procurement_manager',
    displayName: {
      zh: '采购经理',
      en: 'Procurement Manager'
    },
    description: 'Procurement oversight, team management, and approval authority',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'cost_center',
    displayName: {
      zh: '成本中心',
      en: 'Cost Center'
    },
    description: 'Cost analysis, price review, and budget validation',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'finance_director',
    displayName: {
      zh: '财务总监',
      en: 'Finance Director'
    },
    description: 'Financial oversight and payment approval authority',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'finance_personnel',
    displayName: {
      zh: '财务人员',
      en: 'Finance Personnel'
    },
    description: 'Payment processing and financial tracking',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'purchaser',
    displayName: {
      zh: '采购员',
      en: 'Purchaser'
    },
    description: 'Create purchase orders, quotations, and manage procurement',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'data_entry_personnel',
    displayName: {
      zh: '数据录入人员',
      en: 'Data Entry Personnel'
    },
    description: 'Master data entry and maintenance',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'mrp_planner',
    displayName: {
      zh: 'MRP计划员',
      en: 'MRP Planner'
    },
    description: 'MRP execution and requirement planning',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'warehouse_personnel',
    displayName: {
      zh: '仓库人员',
      en: 'Warehouse Personnel'
    },
    description: 'Goods receipt and inventory management',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'engineering',
    displayName: {
      zh: '工程部',
      en: 'Engineering'
    },
    description: 'Material specification and technical review',
    isSystemRole: true,
    permissions: []
  },
  {
    name: 'auditor',
    displayName: {
      zh: '审计员',
      en: 'Auditor'
    },
    description: 'Audit review and compliance checking',
    isSystemRole: true,
    permissions: []
  }
];

// Define system permissions
const systemPermissions = [
  // Supplier permissions
  { resource: 'supplier', action: 'create', scope: 'all', description: 'Create new suppliers' },
  { resource: 'supplier', action: 'read', scope: 'all', description: 'View supplier information' },
  { resource: 'supplier', action: 'update', scope: 'all', description: 'Update supplier information' },
  { resource: 'supplier', action: 'delete', scope: 'all', description: 'Delete suppliers' },
  { resource: 'supplier', action: 'approve', scope: 'all', description: 'Approve new suppliers' },
  { resource: 'supplier', action: 'export', scope: 'all', description: 'Export supplier list' },
  
  // Material permissions
  { resource: 'material', action: 'create', scope: 'all', description: 'Create new materials' },
  { resource: 'material', action: 'read', scope: 'all', description: 'View material information' },
  { resource: 'material', action: 'update', scope: 'all', description: 'Update material information' },
  { resource: 'material', action: 'delete', scope: 'all', description: 'Delete materials' },
  { resource: 'material', action: 'export', scope: 'all', description: 'Export material list' },
  
  // Quotation permissions
  { resource: 'material_quotation', action: 'create', scope: 'own', description: 'Create quotations' },
  { resource: 'material_quotation', action: 'read', scope: 'all', description: 'View quotations' },
  { resource: 'material_quotation', action: 'update', scope: 'own', description: 'Update own quotations' },
  { resource: 'material_quotation', action: 'submit', scope: 'own', description: 'Submit quotations for approval' },
  { resource: 'material_quotation', action: 'approve', scope: 'all', description: 'Approve quotations' },
  
  // Purchase Order permissions
  { resource: 'purchase_order', action: 'create', scope: 'own', description: 'Create purchase orders' },
  { resource: 'purchase_order', action: 'read', scope: 'all', description: 'View purchase orders' },
  { resource: 'purchase_order', action: 'update', scope: 'own', description: 'Update own purchase orders' },
  { resource: 'purchase_order', action: 'submit', scope: 'own', description: 'Submit POs for approval' },
  { resource: 'purchase_order', action: 'approve', scope: 'all', description: 'Approve purchase orders' },
  { resource: 'purchase_order', action: 'export', scope: 'all', description: 'Export PO list' },
  
  // Pre-payment permissions
  { resource: 'pre_payment', action: 'create', scope: 'own', description: 'Create pre-payment applications' },
  { resource: 'pre_payment', action: 'read', scope: 'all', description: 'View pre-payment applications' },
  { resource: 'pre_payment', action: 'submit', scope: 'own', description: 'Submit pre-payments for approval' },
  { resource: 'pre_payment', action: 'approve', scope: 'all', description: 'Approve pre-payments' },
  
  // MRP permissions
  { resource: 'mrp', action: 'create', scope: 'all', description: 'Run MRP calculation' },
  { resource: 'mrp', action: 'read', scope: 'all', description: 'View MRP results' },
  { resource: 'mrp', action: 'update', scope: 'all', description: 'Update MRP status' },
  { resource: 'mrp', action: 'export', scope: 'all', description: 'Export MRP list' },
  
  // Role and Permission management
  { resource: 'role', action: 'create', scope: 'all', description: 'Create roles' },
  { resource: 'role', action: 'read', scope: 'all', description: 'View roles' },
  { resource: 'role', action: 'update', scope: 'all', description: 'Update roles' },
  { resource: 'role', action: 'delete', scope: 'all', description: 'Delete roles' },
  
  { resource: 'permission', action: 'create', scope: 'all', description: 'Create permissions' },
  { resource: 'permission', action: 'read', scope: 'all', description: 'View permissions' },
  
  // User management
  { resource: 'admin', action: 'create', scope: 'all', description: 'Create users' },
  { resource: 'admin', action: 'read', scope: 'all', description: 'View users' },
  { resource: 'admin', action: 'update', scope: 'all', description: 'Update users' },
  { resource: 'admin', action: 'delete', scope: 'all', description: 'Delete users' },
  
  // Audit log
  { resource: 'audit_log', action: 'read', scope: 'all', description: 'View audit logs' },
  { resource: 'audit_log', action: 'export', scope: 'all', description: 'Export audit logs' },
  
  // Goods receipt
  { resource: 'goods_receipt', action: 'create', scope: 'all', description: 'Record goods receipt' },
  { resource: 'goods_receipt', action: 'read', scope: 'all', description: 'View goods receipts' }
];

async function seedPermissions() {
  console.log('Seeding permissions...');
  
  const createdPermissions = [];
  
  for (const permData of systemPermissions) {
    try {
      // Check if permission already exists
      let permission = await Permission.findOne({
        resource: permData.resource,
        action: permData.action,
        scope: permData.scope
      });
      
      if (!permission) {
        // Create new permission
        permission = await Permission.create({
          ...permData,
          isSystemPermission: true
        });
        console.log(`  ✓ Created permission: ${permission.permissionKey}`);
      } else {
        console.log(`  - Permission already exists: ${permission.permissionKey}`);
      }
      
      createdPermissions.push(permission);
    } catch (error) {
      console.error(`  ✗ Error creating permission ${permData.resource}:${permData.action}:`, error.message);
    }
  }
  
  return createdPermissions;
}

async function seedRoles(permissions) {
  console.log('\nSeeding roles...');
  
  // Permission mapping for each role
  const rolePermissions = {
    system_administrator: permissions.map(p => p._id), // All permissions
    
    general_manager: permissions
      .filter(p => p.action === 'read' || p.action === 'approve' || p.action === 'export')
      .map(p => p._id),
    
    procurement_manager: permissions
      .filter(p => 
        ['supplier', 'material', 'material_quotation', 'purchase_order', 'mrp'].includes(p.resource) ||
        (p.resource === 'admin' && p.action === 'read')
      )
      .map(p => p._id),
    
    cost_center: permissions
      .filter(p => 
        ['material_quotation', 'purchase_order', 'mrp'].includes(p.resource) &&
        ['read', 'approve', 'export'].includes(p.action)
      )
      .map(p => p._id),
    
    finance_director: permissions
      .filter(p => 
        ['pre_payment', 'purchase_order'].includes(p.resource) &&
        ['read', 'approve', 'export'].includes(p.action)
      )
      .map(p => p._id),
    
    finance_personnel: permissions
      .filter(p => 
        ['pre_payment', 'purchase_order'].includes(p.resource) &&
        ['read', 'export'].includes(p.action)
      )
      .map(p => p._id),
    
    purchaser: permissions
      .filter(p => 
        ['material_quotation', 'purchase_order', 'supplier', 'material', 'mrp'].includes(p.resource) &&
        ['create', 'read', 'update', 'submit'].includes(p.action)
      )
      .map(p => p._id),
    
    data_entry_personnel: permissions
      .filter(p => 
        ['supplier', 'material'].includes(p.resource) &&
        ['create', 'read', 'update'].includes(p.action)
      )
      .map(p => p._id),
    
    mrp_planner: permissions
      .filter(p => 
        ['mrp', 'material', 'supplier', 'purchase_order'].includes(p.resource)
      )
      .map(p => p._id),
    
    warehouse_personnel: permissions
      .filter(p => 
        ['goods_receipt', 'purchase_order', 'material'].includes(p.resource) &&
        ['create', 'read', 'update'].includes(p.action)
      )
      .map(p => p._id),
    
    engineering: permissions
      .filter(p => 
        p.resource === 'material' &&
        ['create', 'read', 'update'].includes(p.action)
      )
      .map(p => p._id),
    
    auditor: permissions
      .filter(p => p.action === 'read' || p.resource === 'audit_log')
      .map(p => p._id)
  };
  
  const createdRoles = [];
  
  for (const roleData of systemRoles) {
    try {
      // Check if role already exists
      let role = await Role.findOne({ name: roleData.name });
      
      if (!role) {
        // Create new role with permissions
        role = await Role.create({
          ...roleData,
          permissions: rolePermissions[roleData.name] || []
        });
        console.log(`  ✓ Created role: ${role.displayName.en} (${role.permissions.length} permissions)`);
      } else {
        // Update existing role's permissions
        role.permissions = rolePermissions[roleData.name] || [];
        await role.save();
        console.log(`  - Role already exists: ${role.displayName.en} (updated ${role.permissions.length} permissions)`);
      }
      
      createdRoles.push(role);
    } catch (error) {
      console.error(`  ✗ Error creating role ${roleData.name}:`, error.message);
    }
  }
  
  return createdRoles;
}

async function seed() {
  console.log('='.repeat(60));
  console.log('Starting seed: System Roles and Permissions');
  console.log('='.repeat(60));
  
  try {
    // Seed permissions first
    const permissions = await seedPermissions();
    console.log(`\n✓ Total permissions created/verified: ${permissions.length}`);
    
    // Seed roles with permissions
    const roles = await seedRoles(permissions);
    console.log(`\n✓ Total roles created/verified: ${roles.length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Seed completed successfully!');
    console.log('='.repeat(60));
    console.log('\nSystem Roles Summary:');
    
    for (const role of roles) {
      console.log(`  - ${role.displayName.en} (${role.displayName.zh}): ${role.permissions.length} permissions`);
    }
    
    return { success: true, permissions: permissions.length, roles: roles.length };
  } catch (error) {
    console.error('\n✗ Seed failed:', error.message);
    throw error;
  }
}

// Allow running as standalone script
if (require.main === module) {
  const dbUrl = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';
  
  mongoose
    .connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(async () => {
      console.log('Database connected\n');
      
      await seed();
      
      await mongoose.disconnect();
      console.log('\nDatabase disconnected');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

module.exports = { seed };

