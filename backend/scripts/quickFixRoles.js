/**
 * Quick Fix: Assign system_administrator role to all admins without roles
 * 
 * Run this script to quickly fix the "403 forbidden, no role assigned" error
 * 
 * Usage:
 *   node scripts/quickFixRoles.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function quickFixRoles() {
  try {
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/idurar';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const Admin = mongoose.model('Admin', new mongoose.Schema({}, { strict: false }));
    const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }));

    // Find or create system_administrator role
    let adminRole = await Role.findOne({ name: 'system_administrator' });
    
    if (!adminRole) {
      console.log('⚠️  Creating system_administrator role...');
      adminRole = await Role.create({
        name: 'system_administrator',
        displayName: { en: 'System Administrator', zh: '系统管理员' },
        description: { en: 'Full system access', zh: '完整系统访问权限' },
        isSystem: true
      });
      console.log('✅ Created role');
    }

    // Update all admins without roles
    const result = await Admin.updateMany(
      {
        $or: [
          { roles: { $exists: false } },
          { roles: { $size: 0 } },
          { roles: null }
        ]
      },
      {
        $set: { roles: [adminRole._id] }
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} admin(s) with system_administrator role`);
    console.log('✅ All admins now have roles assigned');
    console.log('\n📝 You can now access procurement routes without 403 errors');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickFixRoles();

