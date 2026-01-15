/**
 * Create Test Users Script
 * 
 * Creates multiple users with different roles to mimic the procurement workflow.
 * This is useful for:
 * - Testing role-based access control
 * - Capturing screenshots from different user perspectives
 * - Demonstrating workflow with different user roles
 * 
 * Users Created:
 * 1. System Administrator (admin@admin.com) - Already exists
 * 2. Procurement Manager (procurement.manager@test.com)
 * 3. Purchaser (purchaser@test.com)
 * 4. Finance Director (finance.director@test.com)
 * 5. Finance Personnel (finance@test.com)
 * 6. General Manager (general.manager@test.com)
 * 7. MRP Planner (mrp.planner@test.com)
 * 8. Warehouse Personnel (warehouse@test.com)
 * 
 * Usage:
 *   node scripts/createTestUsers.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

const Admin = require('../src/models/coreModels/Admin');
const AdminPassword = require('../src/models/coreModels/AdminPassword');
const Role = require('../src/models/coreModels/Role');

// Default password for all test users
const DEFAULT_PASSWORD = 'test123456';

// Test users configuration
const testUsers = [
  {
    email: 'procurement.manager@test.com',
    name: 'Procurement',
    surname: 'Manager',
    department: 'Procurement',
    roleNames: ['procurement_manager'],
    approvalAuthority: {
      maxAmount: 100000,
      currency: 'CNY',
      documentTypes: ['purchase_order', 'supplier', 'material_quotation']
    },
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'purchaser@test.com',
    name: 'John',
    surname: 'Purchaser',
    department: 'Procurement',
    roleNames: ['purchaser'],
    reportsTo: 'procurement.manager@test.com', // Will be set after manager is created
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'finance.director@test.com',
    name: 'Finance',
    surname: 'Director',
    department: 'Finance',
    roleNames: ['finance_director'],
    approvalAuthority: {
      maxAmount: 500000,
      currency: 'CNY',
      documentTypes: ['pre_payment', 'purchase_order']
    },
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'finance@test.com',
    name: 'Finance',
    surname: 'Personnel',
    department: 'Finance',
    roleNames: ['finance_personnel'],
    reportsTo: 'finance.director@test.com',
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'general.manager@test.com',
    name: 'General',
    surname: 'Manager',
    department: 'Executive',
    roleNames: ['general_manager'],
    approvalAuthority: {
      maxAmount: 1000000,
      currency: 'CNY',
      documentTypes: ['purchase_order', 'supplier', 'material_quotation', 'pre_payment']
    },
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'mrp.planner@test.com',
    name: 'MRP',
    surname: 'Planner',
    department: 'Planning',
    roleNames: ['mrp_planner'],
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'warehouse@test.com',
    name: 'Warehouse',
    surname: 'Personnel',
    department: 'Warehouse',
    roleNames: ['warehouse_personnel'],
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  },
  {
    email: 'data.entry@test.com',
    name: 'Data',
    surname: 'Entry',
    department: 'Procurement',
    roleNames: ['data_entry_personnel'],
    preferences: {
      language: 'en-US',
      notifications: { email: true, inApp: true }
    }
  }
];

async function createTestUsers() {
  try {
    // Try multiple connection strings
    const mongoUri = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurarapp';
    
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}...`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Get all roles
    console.log('📝 Step 1: Loading roles...');
    const rolesMap = {};
    const allRoles = await Role.find({ removed: false });
    
    for (const role of allRoles) {
      rolesMap[role.name] = role;
    }
    
    console.log(`  ✓ Loaded ${allRoles.length} roles\n`);

    // Step 2: Create users
    console.log('📝 Step 2: Creating test users...');
    const createdUsers = {};
    const userEmailToId = {};

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        let user = await Admin.findOne({ email: userData.email, removed: false });
        
        if (user) {
          console.log(`  - User already exists: ${userData.email}`);
          // Update existing user
          user.name = userData.name;
          user.surname = userData.surname;
          user.department = userData.department;
          user.enabled = true;
          user.removed = false;
          
          // Assign roles
          const roleIds = userData.roleNames
            .map(roleName => rolesMap[roleName]?._id)
            .filter(Boolean);
          
          if (roleIds.length > 0) {
            user.roles = roleIds;
          }
          
          // Set approval authority if provided
          if (userData.approvalAuthority) {
            user.approvalAuthority = userData.approvalAuthority;
          }
          
          // Set preferences if provided
          if (userData.preferences) {
            user.preferences = userData.preferences;
          }
          
          await user.save();
          createdUsers[userData.email] = user;
          userEmailToId[userData.email] = user._id;
          console.log(`  ✓ Updated user: ${userData.email} (${userData.roleNames.join(', ')})`);
        } else {
          // Create new user
          const roleIds = userData.roleNames
            .map(roleName => rolesMap[roleName]?._id)
            .filter(Boolean);
          
          if (roleIds.length === 0) {
            console.log(`  ⚠ Warning: No roles found for ${userData.email}, skipping...`);
            continue;
          }
          
          user = await Admin.create({
            email: userData.email,
            name: userData.name,
            surname: userData.surname,
            department: userData.department,
            roles: roleIds,
            enabled: true,
            removed: false,
            approvalAuthority: userData.approvalAuthority || undefined,
            preferences: userData.preferences || {
              language: 'en-US',
              notifications: { email: true, inApp: true }
            }
          });
          
          createdUsers[userData.email] = user;
          userEmailToId[userData.email] = user._id;
          console.log(`  ✓ Created user: ${userData.email} (${userData.roleNames.join(', ')})`);
        }

        // Create or update password
        const salt = uniqueId();
        const passwordHash = bcrypt.hashSync(salt + DEFAULT_PASSWORD);
        
        let userPassword = await AdminPassword.findOne({ user: user._id });
        
        if (userPassword) {
          userPassword.password = passwordHash;
          userPassword.salt = salt;
          userPassword.removed = false;
          await userPassword.save();
        } else {
          await AdminPassword.create({
            user: user._id,
            password: passwordHash,
            salt: salt,
            emailVerified: true,
            removed: false
          });
        }
        
      } catch (error) {
        console.error(`  ✗ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Step 3: Set up manager relationships
    console.log('\n📝 Step 3: Setting up manager relationships...');
    for (const userData of testUsers) {
      if (userData.reportsTo) {
        const managerId = userEmailToId[userData.reportsTo];
        const userId = userEmailToId[userData.email];
        
        if (managerId && userId) {
          const user = await Admin.findById(userId);
          const manager = await Admin.findById(managerId);
          
          if (user && manager) {
            user.reportsTo = managerId;
            
            // Add user to manager's managerOf array if not already there
            if (!manager.managerOf || !manager.managerOf.includes(userId)) {
              if (!manager.managerOf) {
                manager.managerOf = [];
              }
              manager.managerOf.push(userId);
              await manager.save();
            }
            
            await user.save();
            console.log(`  ✓ ${userData.email} reports to ${userData.reportsTo}`);
          }
        }
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Users Created Successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  - Users created/updated: ${Object.keys(createdUsers).length}`);
    console.log(`  - Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('\n👥 Test Users:');
    
    for (const [email, user] of Object.entries(createdUsers)) {
      const roleNames = user.roles.map(roleId => {
        const role = allRoles.find(r => r._id.toString() === roleId.toString());
        return role ? role.displayName.en : 'Unknown';
      }).join(', ');
      
      console.log(`  - ${email}`);
      console.log(`    Name: ${user.name} ${user.surname || ''}`);
      console.log(`    Department: ${user.department || 'N/A'}`);
      console.log(`    Roles: ${roleNames}`);
      if (user.approvalAuthority && user.approvalAuthority.maxAmount > 0) {
        console.log(`    Approval Authority: ${user.approvalAuthority.maxAmount} ${user.approvalAuthority.currency}`);
      }
      console.log('');
    }
    
    console.log('\n💡 Usage:');
    console.log('  - Login with any of the test user emails');
    console.log(`  - Password: ${DEFAULT_PASSWORD}`);
    console.log('  - Use different users to test role-based access control');
    console.log('  - Use for capturing screenshots from different perspectives');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createTestUsers();
}

module.exports = createTestUsers;
