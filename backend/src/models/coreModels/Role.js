const mongoose = require('mongoose');

/**
 * Role Model
 * 
 * Defines system roles for RBAC (Role-Based Access Control).
 * Each role has a set of permissions and can inherit from other roles.
 * 
 * Key Features:
 * - Multilingual display names (Chinese and English)
 * - Permission assignment
 * - Role hierarchy (inheritsFrom)
 * - System roles cannot be deleted
 * 
 * Related Models: Permission, Admin
 */

const roleSchema = new mongoose.Schema({
  // Unique role identifier (e.g., 'system_administrator', 'procurement_manager')
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only alphanumeric and underscores
        return /^[a-z0-9_]+$/.test(v);
      },
      message: 'Role name can only contain lowercase letters, numbers, and underscores'
    }
  },

  // Display names for UI
  displayName: {
    zh: {
      type: String,
      required: true,
      trim: true
    },
    en: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Role description
  description: {
    type: String,
    trim: true
  },

  // Permissions assigned to this role
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    autopopulate: false
  }],

  // Role hierarchy - this role inherits permissions from parent roles
  inheritsFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    autopopulate: false
  }],

  // System roles cannot be deleted or have their name changed
  isSystemRole: {
    type: Boolean,
    default: false
  },

  // Soft delete flag
  removed: {
    type: Boolean,
    default: false
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  created: {
    type: Date,
    default: Date.now
  },

  updated: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
roleSchema.index({ name: 1 });
roleSchema.index({ isSystemRole: 1 });
roleSchema.index({ removed: 1 });

// Update 'updated' timestamp on save
roleSchema.pre('save', function(next) {
  this.updated = Date.now();
  next();
});

// Prevent deletion of system roles
roleSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystemRole) {
    return next(new Error('Cannot delete system role'));
  }
  next();
});

// Virtual for checking if role is deletable
roleSchema.virtual('isDeletable').get(function() {
  return !this.isSystemRole;
});

// Ensure virtuals are included in JSON
roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

// Instance method to get all permissions (including inherited)
roleSchema.methods.getAllPermissions = async function() {
  const allPermissions = new Set();
  
  // Add this role's permissions (ensure they're strings)
  this.permissions.forEach(p => {
    const permId = p._id ? p._id.toString() : p.toString();
    allPermissions.add(permId);
  });
  
  // Add inherited permissions
  if (this.inheritsFrom && this.inheritsFrom.length > 0) {
    const Role = mongoose.model('Role');
    for (const parentRoleId of this.inheritsFrom) {
      const parentRole = await Role.findById(parentRoleId);
      if (parentRole) {
        const parentPermissions = await parentRole.getAllPermissions();
        parentPermissions.forEach(p => allPermissions.add(p));
      }
    }
  }
  
  return Array.from(allPermissions);
};

// Static method to find active roles
roleSchema.statics.findActive = function() {
  return this.find({ removed: false }).sort({ 'displayName.zh': 1 });
};

// Static method to find system roles
roleSchema.statics.findSystemRoles = function() {
  return this.find({ isSystemRole: true, removed: false }).sort({ 'displayName.zh': 1 });
};

module.exports = mongoose.model('Role', roleSchema);

