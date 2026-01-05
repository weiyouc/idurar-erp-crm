const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Admin Model (Extended for Silverplan)
 * 
 * Core user model extended with RBAC (Role-Based Access Control) capabilities
 * and approval authority management.
 * 
 * Key Extensions:
 * - Multiple roles support (roles array)
 * - Organizational hierarchy (department, manager, reports to)
 * - Approval authority with amount thresholds
 * - User preferences (language, notifications)
 * 
 * Backward Compatibility:
 * - Existing 'role' field maintained for legacy support
 * - New 'roles' array for multi-role RBAC
 * 
 * Related Models: Role, Permission
 */

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  
  // Legacy role field (maintained for backward compatibility)
  role: {
    type: String,
    default: 'owner',
    enum: ['owner'],
  },

  // ========== NEW FIELDS FOR SILVERPLAN ==========

  // Multiple roles support for RBAC
  roles: [{
    type: Schema.Types.ObjectId,
    ref: 'Role',
    autopopulate: false
  }],

  // Organizational structure
  department: {
    type: String,
    trim: true
    // Examples: 'Procurement', 'Finance', 'Engineering', 'Warehouse'
  },

  // Manager relationship - users this admin manages
  managerOf: [{
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    autopopulate: false
  }],

  // Reports to - this admin's manager
  reportsTo: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    autopopulate: false
  },

  // Approval authority
  approvalAuthority: {
    // Maximum amount this user can approve
    maxAmount: {
      type: Number,
      default: 0
    },
    // Currency for the max amount
    currency: {
      type: String,
      default: 'CNY'
    },
    // Document types this user can approve
    // Examples: ['supplier', 'material_quotation', 'purchase_order', 'pre_payment']
    documentTypes: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },

  // User preferences
  preferences: {
    // Language preference
    language: {
      type: String,
      default: 'zh-CN',
      enum: ['zh-CN', 'en-US']
    },
    // Notification settings
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    }
  },

  // Last updated timestamp
  updated: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ roles: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ reportsTo: 1 });
adminSchema.index({ removed: 1, enabled: 1 });

// Update 'updated' timestamp on save
adminSchema.pre('save', function(next) {
  this.updated = Date.now();
  next();
});

// Virtual to get full name
adminSchema.virtual('fullName').get(function() {
  return this.surname ? `${this.name} ${this.surname}` : this.name;
});

// Virtual to check if user has approval authority
adminSchema.virtual('hasApprovalAuthority').get(function() {
  return this.approvalAuthority && 
         this.approvalAuthority.maxAmount > 0 && 
         this.approvalAuthority.documentTypes && 
         this.approvalAuthority.documentTypes.length > 0;
});

// Ensure virtuals are included in JSON
adminSchema.set('toJSON', { virtuals: true });
adminSchema.set('toObject', { virtuals: true });

// Instance method to check if user has specific role
adminSchema.methods.hasRole = function(roleName) {
  if (!this.roles || this.roles.length === 0) return false;
  
  // If roles are populated
  if (this.roles[0] && this.roles[0].name) {
    return this.roles.some(role => role.name === roleName);
  }
  
  // If roles are just IDs, need to populate first
  return false;
};

// Instance method to check if user can approve amount for document type
adminSchema.methods.canApprove = function(documentType, amount, currency = 'CNY') {
  if (!this.hasApprovalAuthority) return false;
  
  // Check document type
  if (!this.approvalAuthority.documentTypes.includes(documentType)) {
    return false;
  }
  
  // Check amount (simplified - assumes same currency)
  if (currency !== this.approvalAuthority.currency) {
    // TODO: Implement currency conversion
    console.warn('Currency mismatch in approval authority check');
    return false;
  }
  
  return amount <= this.approvalAuthority.maxAmount;
};

// Instance method to get all permissions (from all roles)
adminSchema.methods.getAllPermissions = async function() {
  if (!this.roles || this.roles.length === 0) return [];
  
  const Role = mongoose.model('Role');
  const allPermissions = new Set();
  
  for (const roleId of this.roles) {
    const role = await Role.findById(roleId).populate('permissions');
    if (role) {
      const rolePermissions = await role.getAllPermissions();
      rolePermissions.forEach(p => allPermissions.add(p));
    }
  }
  
  return Array.from(allPermissions);
};

// Instance method to check if user has permission
adminSchema.methods.hasPermission = async function(resource, action, scope = 'own') {
  const permissions = await this.getAllPermissions();
  const Permission = mongoose.model('Permission');
  
  for (const permissionId of permissions) {
    const permission = await Permission.findById(permissionId);
    if (permission && 
        permission.resource === resource && 
        permission.action === action &&
        (permission.scope === scope || permission.scope === 'all')) {
      return true;
    }
  }
  
  return false;
};

// Instance method to get team members (subordinates)
adminSchema.methods.getTeamMembers = async function() {
  if (!this.managerOf || this.managerOf.length === 0) return [];
  
  const Admin = mongoose.model('Admin');
  return await Admin.find({ 
    _id: { $in: this.managerOf },
    removed: false,
    enabled: true
  });
};

// Static method to find by role
adminSchema.statics.findByRole = function(roleName) {
  const Role = mongoose.model('Role');
  return Role.findOne({ name: roleName })
    .then(role => {
      if (!role) return [];
      return this.find({ 
        roles: role._id,
        removed: false,
        enabled: true
      });
    });
};

// Static method to find by department
adminSchema.statics.findByDepartment = function(department) {
  return this.find({ 
    department,
    removed: false,
    enabled: true
  });
};

// Static method to find active users
adminSchema.statics.findActive = function() {
  return this.find({ 
    removed: false,
    enabled: true
  }).sort({ name: 1 });
};

module.exports = mongoose.model('Admin', adminSchema);
