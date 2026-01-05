const mongoose = require('mongoose');

/**
 * WorkflowInstance Model
 * 
 * Tracks the execution of a workflow for a specific document.
 * Each document going through approval has one WorkflowInstance.
 * 
 * Key Features:
 * - Tracks current approval level
 * - Maintains complete approval history
 * - Records all approvers, actions, and comments
 * - Links to the document being approved
 * - Status tracking (pending, approved, rejected, cancelled)
 * 
 * Workflow States:
 * - pending: Currently in approval process
 * - approved: All required approvals completed
 * - rejected: Rejected at some level
 * - cancelled: Workflow cancelled (e.g., document recalled)
 * 
 * Related Models: Workflow, Admin, [Document Models]
 */

const workflowInstanceSchema = new mongoose.Schema({
  // Reference to workflow definition
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },

  // Document information
  documentType: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
    // Examples: 'supplier', 'material_quotation', 'purchase_order', 'pre_payment'
  },

  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // For display purposes (e.g., PO Number, Supplier Name)
  documentNumber: {
    type: String,
    trim: true
  },

  // Current workflow state
  currentLevel: {
    type: Number,
    default: 0
    // 0 means not yet started, 1+ means at that approval level
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },

  // Approval history - chronological record of all actions
  approvalHistory: [{
    level: {
      type: Number,
      required: true
    },
    levelName: {
      type: String,
      trim: true
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'recall', 'request_changes'],
      required: true
    },
    comments: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    // Additional metadata for the approval action
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // Which levels are required for this specific instance
  // (determined by workflow routing rules at initiation)
  requiredLevels: [{
    type: Number,
    required: true
  }],

  // Which levels have been completed
  completedLevels: [{
    type: Number
  }],

  // Submitter information
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  submittedAt: {
    type: Date,
    default: Date.now
  },

  // Completion information
  completedAt: {
    type: Date
  },

  // Workflow statistics
  stats: {
    totalLevels: {
      type: Number,
      default: 0
    },
    completedLevelsCount: {
      type: Number,
      default: 0
    },
    totalApprovers: {
      type: Number,
      default: 0
    },
    durationHours: {
      type: Number,
      default: 0
    }
  },

  // Audit fields
  created: {
    type: Date,
    default: Date.now
  },

  updated: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient querying
workflowInstanceSchema.index({ documentType: 1, documentId: 1 }, { unique: true });
workflowInstanceSchema.index({ status: 1, currentLevel: 1 });
workflowInstanceSchema.index({ submittedBy: 1, status: 1 });
workflowInstanceSchema.index({ status: 1, submittedAt: -1 });

// Index for finding pending approvals for a user
workflowInstanceSchema.index({ 'approvalHistory.approver': 1, status: 1 });

// Update 'updated' timestamp and stats on save
workflowInstanceSchema.pre('save', function(next) {
  this.updated = Date.now();
  
  // Update statistics
  this.stats.totalLevels = this.requiredLevels.length;
  this.stats.completedLevelsCount = this.completedLevels.length;
  this.stats.totalApprovers = this.approvalHistory.length;
  
  // Calculate duration if completed
  if (this.completedAt && this.submittedAt) {
    const durationMs = this.completedAt - this.submittedAt;
    this.stats.durationHours = Math.round(durationMs / (1000 * 60 * 60) * 100) / 100;
  }
  
  next();
});

// Virtual to check if workflow is complete
workflowInstanceSchema.virtual('isComplete').get(function() {
  return this.status === 'approved' || this.status === 'rejected' || this.status === 'cancelled';
});

// Virtual to get progress percentage
workflowInstanceSchema.virtual('progressPercentage').get(function() {
  if (this.requiredLevels.length === 0) return 0;
  return Math.round((this.completedLevels.length / this.requiredLevels.length) * 100);
});

// Virtual to get next level
workflowInstanceSchema.virtual('nextLevel').get(function() {
  if (this.isComplete) return null;
  
  const remainingLevels = this.requiredLevels
    .filter(level => !this.completedLevels.includes(level))
    .sort((a, b) => a - b);
  
  return remainingLevels.length > 0 ? remainingLevels[0] : null;
});

// Ensure virtuals are included in JSON
workflowInstanceSchema.set('toJSON', { virtuals: true });
workflowInstanceSchema.set('toObject', { virtuals: true });

// Instance method to record approval action
workflowInstanceSchema.methods.recordApproval = function(level, approver, action, comments, metadata = null) {
  this.approvalHistory.push({
    level,
    levelName: `Level ${level}`,
    approver,
    action,
    comments,
    timestamp: new Date(),
    metadata
  });
  
  if (action === 'approve' && !this.completedLevels.includes(level)) {
    this.completedLevels.push(level);
  }
};

// Instance method to check if level is completed
workflowInstanceSchema.methods.isLevelCompleted = function(level) {
  return this.completedLevels.includes(level);
};

// Instance method to check if all levels completed
workflowInstanceSchema.methods.areAllLevelsCompleted = function() {
  return this.requiredLevels.every(level => this.completedLevels.includes(level));
};

// Instance method to get pending approvers for current level
workflowInstanceSchema.methods.getPendingApprovers = async function() {
  if (this.isComplete || this.currentLevel === 0) return [];
  
  const Workflow = mongoose.model('Workflow');
  const workflow = await Workflow.findById(this.workflow);
  
  if (!workflow) return [];
  
  const levelConfig = workflow.getLevelConfig(this.currentLevel);
  if (!levelConfig) return [];
  
  const Admin = mongoose.model('Admin');
  const approvers = await Admin.find({
    roles: { $in: levelConfig.approverRoles },
    enabled: true,
    removed: false
  });
  
  return approvers;
};

// Instance method to get approval summary
workflowInstanceSchema.methods.getApprovalSummary = function() {
  return {
    status: this.status,
    currentLevel: this.currentLevel,
    totalLevels: this.requiredLevels.length,
    completedLevels: this.completedLevels.length,
    progressPercentage: this.progressPercentage,
    submittedAt: this.submittedAt,
    completedAt: this.completedAt,
    durationHours: this.stats.durationHours,
    approvalCount: this.approvalHistory.length
  };
};

// Static method to find pending approvals for a user
workflowInstanceSchema.statics.findPendingApprovalsForUser = async function(userId, options = {}) {
  const { documentType, limit = 50, skip = 0 } = options;
  
  // Find user's roles
  const Admin = mongoose.model('Admin');
  const user = await Admin.findById(userId).populate('roles');
  
  if (!user || !user.roles || user.roles.length === 0) return [];
  
  const userRoleIds = user.roles.map(role => role._id);
  
  // Find all pending workflow instances
  let query = { status: 'pending' };
  if (documentType) query.documentType = documentType;
  
  const pendingInstances = await this.find(query)
    .populate('workflow')
    .skip(skip)
    .limit(limit)
    .sort({ submittedAt: -1 });
  
  // Filter instances where user has authority at current level
  const Workflow = mongoose.model('Workflow');
  const result = [];
  
  for (const instance of pendingInstances) {
    if (!instance.workflow) continue;
    
    const levelConfig = instance.workflow.getLevelConfig(instance.currentLevel);
    if (!levelConfig) continue;
    
    // Check if user's role is in approver roles for current level
    const hasAuthority = levelConfig.approverRoles.some(roleId => 
      userRoleIds.some(userRoleId => userRoleId.toString() === roleId.toString())
    );
    
    if (hasAuthority) {
      result.push(instance);
    }
  }
  
  return result;
};

// Static method to find by document
workflowInstanceSchema.statics.findByDocument = function(documentType, documentId) {
  return this.findOne({
    documentType: documentType.toLowerCase(),
    documentId
  }).populate('workflow submittedBy');
};

// Static method to find recent completions
workflowInstanceSchema.statics.findRecentCompletions = function(days = 7, limit = 50) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    status: { $in: ['approved', 'rejected'] },
    completedAt: { $gte: startDate }
  })
  .sort({ completedAt: -1 })
  .limit(limit)
  .populate('workflow submittedBy');
};

// Static method to get workflow statistics
workflowInstanceSchema.statics.getStatistics = async function(options = {}) {
  const { startDate, endDate, documentType } = options;
  
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.submittedAt = {};
    if (startDate) matchStage.submittedAt.$gte = startDate;
    if (endDate) matchStage.submittedAt.$lte = endDate;
  }
  
  if (documentType) matchStage.documentType = documentType;
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$stats.durationHours' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('WorkflowInstance', workflowInstanceSchema);

