const mongoose = require('mongoose');

/**
 * Permission Model
 * 
 * Defines granular permissions for RBAC (Role-Based Access Control).
 * Permissions control access to resources and actions.
 * 
 * Permission Structure:
 * - resource: The entity being accessed (e.g., 'supplier', 'purchase_order')
 * - action: The operation being performed (e.g., 'create', 'read', 'update', 'delete', 'approve', 'export')
 * - scope: The scope of access ('own', 'team', 'all')
 * - conditions: Additional conditions for permission (JSON object)
 * 
 * Example Permission:
 * {
 *   resource: 'purchase_order',
 *   action: 'approve',
 *   scope: 'all',
 *   conditions: { maxAmount: 100000, currency: 'CNY' }
 * }
 * 
 * Related Models: Role
 */

const permissionSchema = new mongoose.Schema({
  // Resource being controlled (e.g., 'supplier', 'material', 'purchase_order')
  resource: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  // Action being controlled (create, read, update, delete, approve, export, etc.)
  action: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'approve',
      'reject',
      'export',
      'import',
      'submit',
      'recall',
      'close',
      'cancel'
    ]
  },

  // Scope of permission
  scope: {
    type: String,
    required: true,
    enum: [
      'own',    // Only own records (created by user)
      'team',   // Records created by user and their subordinates
      'all'     // All records
    ],
    default: 'own'
  },

  // Additional conditions for this permission (flexible JSON)
  // Example: { maxAmount: 100000, currency: 'CNY' }
  // Example: { supplierLevel: ['A', 'B'] }
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Human-readable description
  description: {
    type: String,
    trim: true
  },

  // System permissions cannot be deleted
  isSystemPermission: {
    type: Boolean,
    default: false
  },

  // Soft delete flag
  removed: {
    type: Boolean,
    default: false
  },

  // Audit fields
  created: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient permission lookups
permissionSchema.index({ resource: 1, action: 1, scope: 1 });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ isSystemPermission: 1 });
permissionSchema.index({ removed: 1 });

// Prevent deletion of system permissions
permissionSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystemPermission) {
    return next(new Error('Cannot delete system permission'));
  }
  next();
});

// Virtual for generating permission key (resource:action:scope)
permissionSchema.virtual('permissionKey').get(function() {
  return `${this.resource}:${this.action}:${this.scope}`;
});

// Ensure virtuals are included in JSON
permissionSchema.set('toJSON', { virtuals: true });
permissionSchema.set('toObject', { virtuals: true });

// Static method to find by resource and action
permissionSchema.statics.findByResourceAction = function(resource, action) {
  return this.find({ 
    resource: resource.toLowerCase(), 
    action: action.toLowerCase(),
    removed: false 
  });
};

// Static method to find active permissions
permissionSchema.statics.findActive = function() {
  return this.find({ removed: false }).sort({ resource: 1, action: 1 });
};

// Static method to check if permission exists
permissionSchema.statics.checkPermission = async function(resource, action, scope = 'own') {
  const permission = await this.findOne({
    resource: resource.toLowerCase(),
    action: action.toLowerCase(),
    scope,
    removed: false
  });
  return !!permission;
};

// Instance method to match against conditions
permissionSchema.methods.matchesConditions = function(context) {
  if (!this.conditions || Object.keys(this.conditions).length === 0) {
    return true; // No conditions means always match
  }

  // Check each condition
  for (const [key, value] of Object.entries(this.conditions)) {
    const contextValue = context[key];
    
    if (Array.isArray(value)) {
      // If condition value is array, check if context value is in array
      if (!value.includes(contextValue)) {
        return false;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle complex conditions (e.g., { $gte: 100, $lte: 1000 })
      if (value.$gte !== undefined && contextValue < value.$gte) return false;
      if (value.$lte !== undefined && contextValue > value.$lte) return false;
      if (value.$gt !== undefined && contextValue <= value.$gt) return false;
      if (value.$lt !== undefined && contextValue >= value.$lt) return false;
      if (value.$eq !== undefined && contextValue !== value.$eq) return false;
      if (value.$ne !== undefined && contextValue === value.$ne) return false;
    } else {
      // Simple equality check
      if (contextValue !== value) {
        return false;
      }
    }
  }
  
  return true;
};

module.exports = mongoose.model('Permission', permissionSchema);

