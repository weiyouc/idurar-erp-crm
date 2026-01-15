/**
 * Verify Test Users Script
 * 
 * Checks if test users exist in MongoDB and displays their information
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Admin = require('../src/models/coreModels/Admin');
const Role = require('../src/models/coreModels/Role');

const testUserEmails = [
  'procurement.manager@test.com',
  'purchaser@test.com',
  'finance.director@test.com',
  'finance@test.com',
  'general.manager@test.com',
  'mrp.planner@test.com',
  'warehouse@test.com',
  'data.entry@test.com'
];

async function verifyTestUsers() {
  try {
    const mongoUri = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurarapp';
    
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('📝 Verifying test users...\n');
    
    const allRoles = await Role.find({ removed: false });
    const rolesMap = {};
    for (const role of allRoles) {
      rolesMap[role._id.toString()] = role;
    }

    let foundCount = 0;
    let missingCount = 0;
    const missingUsers = [];

    for (const email of testUserEmails) {
      const user = await Admin.findOne({ 
        email: email, 
        removed: false 
      }).populate('roles');

      if (user) {
        foundCount++;
        const roleNames = user.roles.map(role => {
          if (typeof role === 'object' && role.displayName) {
            return role.displayName.en || role.name;
          }
          const roleObj = rolesMap[role.toString()];
          return roleObj ? (roleObj.displayName?.en || roleObj.name) : 'Unknown';
        }).join(', ');

        console.log(`✅ ${email}`);
        console.log(`   Name: ${user.name} ${user.surname || ''}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Roles: ${roleNames}`);
        console.log(`   Enabled: ${user.enabled ? 'Yes' : 'No'}`);
        if (user.approvalAuthority && user.approvalAuthority.maxAmount > 0) {
          console.log(`   Approval Authority: ${user.approvalAuthority.maxAmount} ${user.approvalAuthority.currency}`);
        }
        console.log('');
      } else {
        missingCount++;
        missingUsers.push(email);
        console.log(`❌ ${email} - NOT FOUND`);
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`  ✅ Found: ${foundCount} users`);
    console.log(`  ❌ Missing: ${missingCount} users`);
    
    if (missingUsers.length > 0) {
      console.log('\n⚠️  Missing users:');
      missingUsers.forEach(email => console.log(`  - ${email}`));
      console.log('\n💡 To create missing users, run:');
      console.log('   cd backend && node scripts/createTestUsers.js');
    } else {
      console.log('\n✅ All test users are present in the database!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  verifyTestUsers();
}

module.exports = verifyTestUsers;
