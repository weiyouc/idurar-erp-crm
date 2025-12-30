require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE);

async function updateAdminName() {
  try {
    const Admin = require('../models/coreModels/Admin');
    
    // Find the admin user with email admin@admin.com
    const admin = await Admin.findOne({ email: 'admin@admin.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found with email: admin@admin.com');
      process.exit(1);
    }
    
    // Update the name to Silverplan
    admin.name = 'Silverplan';
    await admin.save();
    
    console.log('👍 Admin name updated successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Surname: ${admin.surname}`);
    
    process.exit(0);
  } catch (e) {
    console.log('\n🚫 Error! The Error info is below');
    console.log(e);
    process.exit(1);
  }
}

updateAdminName();





