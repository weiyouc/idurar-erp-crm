/**
 * Migration: Extend Admin Model
 * 
 * Adds new fields to existing Admin documents to support RBAC and
 * organizational hierarchy features required for Silverplan.
 * 
 * New Fields Added:
 * - roles: Array of role references
 * - department: User's department
 * - managerOf: Array of subordinate references
 * - reportsTo: Manager reference
 * - approvalAuthority: Object with maxAmount, currency, documentTypes
 * - preferences: Object with language and notification settings
 * - updated: Timestamp of last update
 * 
 * This migration is idempotent - it can be run multiple times safely.
 * 
 * Usage:
 *   node migrations/001_extend_admin_model.js
 */

const mongoose = require('mongoose');
const Admin = require('../models/coreModels/Admin');

async function up() {
  console.log('Starting migration: Extend Admin Model...');
  
  try {
    // Update all existing Admin documents to add new fields with default values
    const result = await Admin.updateMany(
      {
        // Only update documents that don't have the new fields
        roles: { $exists: false }
      },
      {
        $set: {
          roles: [],
          department: null,
          managerOf: [],
          reportsTo: null,
          approvalAuthority: {
            maxAmount: 0,
            currency: 'CNY',
            documentTypes: []
          },
          preferences: {
            language: 'zh-CN',
            notifications: {
              email: true,
              inApp: true
            }
          },
          updated: new Date()
        }
      }
    );
    
    console.log(`✓ Migration successful: ${result.modifiedCount} Admin documents updated`);
    
    // Log statistics
    const totalAdmins = await Admin.countDocuments();
    console.log(`  Total Admin documents: ${totalAdmins}`);
    console.log(`  Documents updated: ${result.modifiedCount}`);
    console.log(`  Documents already migrated: ${totalAdmins - result.modifiedCount}`);
    
    return {
      success: true,
      modifiedCount: result.modifiedCount,
      totalCount: totalAdmins
    };
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

async function down() {
  console.log('Starting rollback: Remove extended Admin fields...');
  
  try {
    // Remove the new fields added by this migration
    const result = await Admin.updateMany(
      {},
      {
        $unset: {
          roles: '',
          department: '',
          managerOf: '',
          reportsTo: '',
          approvalAuthority: '',
          preferences: '',
          updated: ''
        }
      }
    );
    
    console.log(`✓ Rollback successful: ${result.modifiedCount} Admin documents reverted`);
    
    return {
      success: true,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
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
      console.log('Database connected');
      
      // Check command line arguments for rollback
      const isRollback = process.argv.includes('--rollback') || process.argv.includes('-r');
      
      if (isRollback) {
        await down();
      } else {
        await up();
      }
      
      await mongoose.disconnect();
      console.log('Database disconnected');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

module.exports = { up, down };

