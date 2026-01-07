/**
 * Setup Permissions Script
 * 
 * Creates all necessary permissions and assigns them to roles.
 * This fixes the "Access denied: No permissions assigned to your roles" error.
 * 
 * Usage:
 *   node scripts/setupPermissions.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Role = require('../src/models/coreModels/Role');
const Permission = require('../src/models/coreModels/Permission');

// Define all permissions needed for the system
const systemPermissions = [
  // Supplier permissions
  { resource: 'supplier', action: 'create', scope: 'own', description: 'Create suppliers' },
  { resource: 'supplier', action: 'read', scope: 'all', description: 'View suppliers' },
  { resource: 'supplier', action: 'update', scope: 'own', description: 'Update suppliers' },
  { resource: 'supplier', action: 'delete', scope: 'all', description: 'Delete suppliers' },
  { resource: 'supplier', action: 'approve', scope: 'all', description: 'Approve suppliers' },
  { resource: 'supplier', action: 'submit', scope: 'own', description: 'Submit suppliers for approval' },
  { resource: 'supplier', action: 'export', scope: 'all', description: 'Export suppliers' },
  
  // Material permissions
  { resource: 'material', action: 'create', scope: 'own', description: 'Create materials' },
  { resource: 'material', action: 'read', scope: 'all', description: 'View materials' },
  { resource: 'material', action: 'update', scope: 'own', description: 'Update materials' },
  { resource: 'material', action: 'delete', scope: 'all', description: 'Delete materials' },
  { resource: 'material', action: 'export', scope: 'all', description: 'Export materials' },
  
  // Material Category permissions
  { resource: 'material_category', action: 'create', scope: 'own', description: 'Create material categories' },
  { resource: 'material_category', action: 'read', scope: 'all', description: 'View material categories' },
  { resource: 'material_category', action: 'update', scope: 'own', description: 'Update material categories' },
  { resource: 'material_category', action: 'delete', scope: 'all', description: 'Delete material categories' },
  
  // Purchase Order permissions
  { resource: 'purchase_order', action: 'create', scope: 'own', description: 'Create purchase orders' },
  { resource: 'purchase_order', action: 'read', scope: 'all', description: 'View purchase orders' },
  { resource: 'purchase_order', action: 'update', scope: 'own', description: 'Update purchase orders' },
  { resource: 'purchase_order', action: 'delete', scope: 'all', description: 'Delete purchase orders' },
  { resource: 'purchase_order', action: 'approve', scope: 'all', description: 'Approve purchase orders' },
  { resource: 'purchase_order', action: 'submit', scope: 'own', description: 'Submit purchase orders for approval' },
  { resource: 'purchase_order', action: 'export', scope: 'all', description: 'Export purchase orders' },
  
  // Goods Receipt permissions
  { resource: 'goods_receipt', action: 'create', scope: 'own', description: 'Create goods receipts' },
  { resource: 'goods_receipt', action: 'read', scope: 'all', description: 'View goods receipts' },
  { resource: 'goods_receipt', action: 'update', scope: 'own', description: 'Update goods receipts' },
  { resource: 'goods_receipt', action: 'delete', scope: 'all', description: 'Delete goods receipts' },
  { resource: 'goods_receipt', action: 'export', scope: 'all', description: 'Export goods receipts' },
  
  // Material Quotation permissions
  { resource: 'material_quotation', action: 'create', scope: 'own', description: 'Create material quotations' },
  { resource: 'material_quotation', action: 'read', scope: 'all', description: 'View material quotations' },
  { resource: 'material_quotation', action: 'update', scope: 'own', description: 'Update material quotations' },
  { resource: 'material_quotation', action: 'delete', scope: 'all', description: 'Delete material quotations' },
  { resource: 'material_quotation', action: 'export', scope: 'all', description: 'Export material quotations' },
  
  // Role permissions
  { resource: 'role', action: 'create', scope: 'all', description: 'Create roles' },
  { resource: 'role', action: 'read', scope: 'all', description: 'View roles' },
  { resource: 'role', action: 'update', scope: 'all', description: 'Update roles' },
  { resource: 'role', action: 'delete', scope: 'all', description: 'Delete roles' },
  
  // Workflow permissions
  { resource: 'workflow', action: 'create', scope: 'all', description: 'Create workflows' },
  { resource: 'workflow', action: 'read', scope: 'all', description: 'View workflows' },
  { resource: 'workflow', action: 'update', scope: 'all', description: 'Update workflows' },
  { resource: 'workflow', action: 'delete', scope: 'all', description: 'Delete workflows' },
];

async function setupPermissions() {
  try {
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/idurar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create all permissions
    console.log('📝 Step 1: Creating permissions...');
    const createdPermissions = [];
    
    for (const permData of systemPermissions) {
      try {
        let permission = await Permission.findOne({
          resource: permData.resource,
          action: permData.action,
          scope: permData.scope
        });
        
        if (!permission) {
          permission = await Permission.create(permData);
          console.log(`  ✓ Created: ${permData.resource}:${permData.action} (${permData.scope})`);
        } else {
          console.log(`  - Exists: ${permData.resource}:${permData.action} (${permData.scope})`);
        }
        
        createdPermissions.push(permission);
      } catch (error) {
        console.error(`  ✗ Error creating permission ${permData.resource}:${permData.action}:`, error.message);
      }
    }
    
    console.log(`\n✅ Created/verified ${createdPermissions.length} permissions\n`);

    // Step 2: Find or create system_administrator role
    console.log('📝 Step 2: Setting up system_administrator role...');
    let systemAdminRole = await Role.findOne({ name: 'system_administrator' });
    
    if (!systemAdminRole) {
      systemAdminRole = await Role.create({
        name: 'system_administrator',
        displayName: { en: 'System Administrator', zh: '系统管理员' },
        description: 'Full system access',
        isSystemRole: true,
        permissions: [] // System admin bypasses permission checks, but we'll assign all anyway
      });
      console.log('  ✓ Created system_administrator role');
    } else {
      console.log('  - system_administrator role already exists');
      // Fix description format using direct update (bypasses validation)
      const roleDoc = await Role.findById(systemAdminRole._id).lean();
      if (roleDoc.description && typeof roleDoc.description === 'object') {
        await Role.updateOne(
          { _id: systemAdminRole._id },
          { $set: { description: roleDoc.description.en || roleDoc.description.zh || 'Full system access' } }
        );
        console.log('  ✓ Fixed description format');
        // Re-fetch the role
        systemAdminRole = await Role.findById(systemAdminRole._id);
      }
    }

    // Step 3: Assign all permissions to system_administrator (optional, but good for consistency)
    systemAdminRole.permissions = createdPermissions.map(p => p._id);
    await systemAdminRole.save();
    console.log(`  ✓ Assigned ${createdPermissions.length} permissions to system_administrator\n`);

    // Step 4: Update all existing roles to have permissions
    console.log('📝 Step 3: Updating existing roles with permissions...');
    const allRoles = await Role.find({ removed: false }).lean();
    
    for (const roleData of allRoles) {
      // Skip if it's system_administrator (already done)
      if (roleData.name === 'system_administrator') {
        continue;
      }
      
      // Get the actual Mongoose document
      const role = await Role.findById(roleData._id);
      if (!role) continue;
      
      // Fix description format using direct update if needed
      if (roleData.description && typeof roleData.description === 'object') {
        await Role.updateOne(
          { _id: roleData._id },
          { $set: { description: roleData.description.en || roleData.description.zh || '' } }
        );
        // Re-fetch the role
        const updatedRole = await Role.findById(roleData._id);
        if (updatedRole) Object.assign(role, updatedRole.toObject());
      }
      
      // Assign permissions based on role name
      let rolePermissions = [];
      
      if (role.name === 'purchaser' || role.name.includes('purchaser')) {
        rolePermissions = createdPermissions.filter(p => 
          ['supplier', 'material', 'material_category', 'purchase_order', 'material_quotation'].includes(p.resource) &&
          ['create', 'read', 'update', 'submit'].includes(p.action)
        );
      } else if (role.name === 'procurement_manager' || role.name.includes('procurement')) {
        rolePermissions = createdPermissions.filter(p => 
          ['supplier', 'material', 'material_category', 'purchase_order', 'material_quotation', 'goods_receipt'].includes(p.resource)
        );
      } else {
        // Default: assign read permissions for all resources
        rolePermissions = createdPermissions.filter(p => p.action === 'read');
      }
      
      if (rolePermissions.length > 0) {
        role.permissions = rolePermissions.map(p => p._id);
        await role.save();
        console.log(`  ✓ Updated ${role.displayName?.en || role.name}: ${rolePermissions.length} permissions`);
      } else {
        // Still save to ensure role is updated
        await role.save();
        console.log(`  - ${role.displayName?.en || role.name}: No permissions assigned (using defaults)`);
      }
    }

    // Step 5: Assign system_administrator to all admins without roles
    console.log('\n📝 Step 4: Assigning roles to admins...');
    const Admin = require('../src/models/coreModels/Admin');
    
    const adminsWithoutRoles = await Admin.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    if (adminsWithoutRoles.length > 0) {
      for (const admin of adminsWithoutRoles) {
        admin.roles = [systemAdminRole._id];
        await admin.save();
        console.log(`  ✓ Assigned system_administrator to: ${admin.email || admin.name}`);
      }
      console.log(`\n✅ Updated ${adminsWithoutRoles.length} admin(s) with system_administrator role`);
    } else {
      console.log('  - All admins already have roles assigned');
    }

    // Step 6: Verify roles have permissions
    console.log('\n📝 Step 5: Verifying role permissions...');
    const rolesWithPermissions = await Role.find({ 
      removed: false,
      permissions: { $exists: true, $ne: [], $not: { $size: 0 } }
    }).populate('permissions');
    
    console.log(`\n✅ Roles with permissions: ${rolesWithPermissions.length}`);
    for (const role of rolesWithPermissions) {
      console.log(`  - ${role.displayName?.en || role.name}: ${role.permissions.length} permissions`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  - Permissions: ${createdPermissions.length}`);
    console.log(`  - Roles updated: ${allRoles.length}`);
    console.log(`  - Admins updated: ${adminsWithoutRoles.length}`);
    console.log('\n🎉 You should now be able to access all routes without permission errors!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  setupPermissions();
}

module.exports = setupPermissions;

