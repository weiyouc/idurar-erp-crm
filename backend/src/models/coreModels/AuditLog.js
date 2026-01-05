const mongoose = require('mongoose');

/**
 * AuditLog Model
 * 
 * Tracks all significant operations in the system for audit, compliance,
 * and troubleshooting purposes.
 * 
 * Key Features:
 * - Records user actions (create, update, delete, approve, reject)
 * - Tracks field-level changes (old value → new value)
 * - Captures metadata (IP address, user agent, request ID)
 * - Optimized indexes for efficient querying
 * - Immutable records (cannot be modified once created)
 * 
 * Use Cases:
 * - Compliance auditing
 * - Change history tracking
 * - Security investigation
 * - User activity monitoring
 * 
 * Related Models: Admin (user who performed action)
 */

const auditLogSchema = new mongoose.Schema({
  // User who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  // Action performed
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',        // For sensitive data access
      'update',
      'delete',
      'approve',
      'reject',
      'submit',
      'recall',
      'export',
      'import',
      'login',
      'logout',
      'password_change',
      'permission_change',
      'role_change',
      'workflow_initiated',
      'workflow_approved',
      'workflow_rejected',
      'workflow_cancelled',
      'custom_action'  // For any other actions
    ]
  },

  // Entity type being acted upon
  entityType: {
    type: String,
    required: true,
    trim: true
    // Examples: 'Supplier', 'Material', 'PurchaseOrder', 'Admin', 'Role'
  },

  // Entity ID
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Entity name/identifier for display purposes
  entityName: {
    type: String,
    trim: true
  },

  // Field-level changes (for update actions)
  changes: [{
    field: {
      type: String,
      required: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // Additional metadata
  metadata: {
    ip: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    requestId: {
      type: String,
      trim: true
    },
    // Additional context-specific metadata
    extra: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true  // Cannot be changed after creation
  },

  // Flag for indexing status (for potential search optimization)
  indexed: {
    type: Boolean,
    default: false
  }
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, action: 1, timestamp: -1 });

// Make audit logs immutable - prevent updates and deletes
auditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs cannot be modified'));
  }
  next();
});

auditLogSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  return next(new Error('Audit logs cannot be deleted'));
});

auditLogSchema.pre('findOneAndUpdate', function(next) {
  return next(new Error('Audit logs cannot be modified'));
});

auditLogSchema.pre('updateOne', function(next) {
  return next(new Error('Audit logs cannot be modified'));
});

auditLogSchema.pre('updateMany', function(next) {
  return next(new Error('Audit logs cannot be modified'));
});

// Static method to create audit log entry
auditLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging failure shouldn't break the main operation
    return null;
  }
};

// Static method to query logs by user
auditLogSchema.statics.findByUser = function(userId, options = {}) {
  const { startDate, endDate, limit = 100, action, entityType } = options;
  
  const query = { user: userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name surname email');
};

// Static method to query logs by entity
auditLogSchema.statics.findByEntity = function(entityType, entityId, options = {}) {
  const { startDate, endDate, limit = 100, action } = options;
  
  const query = { entityType, entityId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  if (action) query.action = action;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name surname email');
};

// Static method to query logs by action
auditLogSchema.statics.findByAction = function(action, options = {}) {
  const { startDate, endDate, limit = 100, entityType } = options;
  
  const query = { action };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  if (entityType) query.entityType = entityType;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name surname email');
};

// Static method for advanced search
auditLogSchema.statics.search = function(criteria) {
  const {
    user,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    limit = 100,
    skip = 0
  } = criteria;
  
  const query = {};
  
  if (user) query.user = user;
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name surname email');
};

// Instance method to format for display
auditLogSchema.methods.format = function() {
  return {
    id: this._id,
    user: this.user ? `${this.user.name} ${this.user.surname}` : 'System',
    action: this.action,
    entityType: this.entityType,
    entityName: this.entityName,
    timestamp: this.timestamp,
    changes: this.changes,
    metadata: {
      ip: this.metadata?.ip,
      userAgent: this.metadata?.userAgent
    }
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

