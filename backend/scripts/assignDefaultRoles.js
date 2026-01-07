/**
 * Script to assign default roles to admin users
 * 
 * This script assigns the 'system_administrator' role to all admin users
 * who don't have any roles assigned.
 * 
 * Usage:
 *   node scripts/assignDefaultRoles.js
 * 
 * Or run from MongoDB shell:
 *   mongo your-database-name scripts/assignDefaultRoles.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../src/models/coreModels/Admin');
const Role = require('../src/models/coreModels/Role');

async function assignDefaultRoles() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/idurar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find or create the system_administrator role
    let adminRole = await Role.findOne({ name: 'system_administrator' });
    
    if (!adminRole) {
      console.log('⚠️  system_administrator role not found. Creating it...');
      adminRole = await Role.create({
        name: 'system_administrator',
        displayName: { en: 'System Administrator', zh: '系统管理员' },
        description: { en: 'Full system access', zh: '完整系统访问权限' },
        isSystem: true,
        permissions: [] // Will need to assign permissions separately
      });
      console.log('✅ Created system_administrator role');
    }

    // Find all admins without roles
    const adminsWithoutRoles = await Admin.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    console.log(`\n📊 Found ${adminsWithoutRoles.length} admin(s) without roles`);

    if (adminsWithoutRoles.length === 0) {
      console.log('✅ All admins already have roles assigned');
      await mongoose.disconnect();
      return;
    }

    // Assign the system_administrator role to each admin
    let updatedCount = 0;
    for (const admin of adminsWithoutRoles) {
      admin.roles = [adminRole._id];
      await admin.save();
      updatedCount++;
      console.log(`✅ Assigned system_administrator role to: ${admin.email || admin.name}`);
    }

    console.log(`\n✅ Successfully assigned roles to ${updatedCount} admin(s)`);
    console.log('\n📝 Note: You may want to assign more specific roles (e.g., procurement_manager)');
    console.log('   based on each user\'s responsibilities.');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  assignDefaultRoles();
}

module.exports = assignDefaultRoles;

