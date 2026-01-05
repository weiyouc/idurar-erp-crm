const mongoose = require('mongoose');

/**
 * Workflow Model
 * 
 * Defines configurable multi-level approval workflows for different document types.
 * Each workflow consists of multiple approval levels and routing rules.
 * 
 * Key Features:
 * - Multiple approval levels (up to 10 levels)
 * - Configurable approver roles per level
 * - Routing rules based on conditions (amount, supplier level, etc.)
 * - Support for sequential approval flow
 * - Approval mode per level (any one approver or all approvers must approve)
 * 
 * Document Types:
 * - supplier: New supplier onboarding
 * - material_quotation: Material price quotation
 * - purchase_order: Purchase order
 * - pre_payment: Pre-payment application
 * 
 * Related Models: Role, WorkflowInstance
 */

const workflowSchema = new mongoose.Schema({
  // Workflow identifier
  workflowName: {
    type: String,
    required: true,
    trim: true
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

  // Document type this workflow applies to
  documentType: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: ['supplier', 'material_quotation', 'purchase_order', 'pre_payment']
  },

  // Approval levels configuration
  levels: [{
    levelNumber: {
      type: Number,
      required: true,
      min: 1
    },
    levelName: {
      type: String,
      trim: true
      // Examples: 'Procurement Manager', 'Cost Center', 'General Manager'
    },
    // Roles that can approve at this level
    approverRoles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    }],
    // How many approvers needed if multiple roles
    approvalMode: {
      type: String,
      enum: ['any', 'all'],
      default: 'any'
      // 'any': Any one approver from the roles can approve
      // 'all': All approvers from the roles must approve
    },
    // Is this level mandatory in all cases
    isMandatory: {
      type: Boolean,
      default: true
    }
  }],

  // Routing rules to determine which levels are required
  routingRules: [{
    // Type of condition
    conditionType: {
      type: String,
      required: true,
      enum: ['amount', 'supplier_level', 'material_category', 'custom']
    },
    // Comparison operator
    operator: {
      type: String,
      required: true,
      enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne', 'in', 'not_in']
      // gt: greater than, gte: greater than or equal
      // lt: less than, lte: less than or equal
      // eq: equal, ne: not equal
      // in: in array, not_in: not in array
    },
    // Value to compare against
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
      // Can be number (for amount), string (for level), array (for 'in' operator)
    },
    // Which levels to activate if condition is true
    targetLevels: [{
      type: Number,
      required: true
    }]
  }],

  // Workflow settings
  allowRecall: {
    type: Boolean,
    default: true
    // Can submitter recall document before first approval?
  },

  onRejection: {
    type: String,
    enum: ['return_to_submitter', 'return_to_previous_level'],
    default: 'return_to_submitter'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Is this the default workflow for the document type
  isDefault: {
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

// Indexes
workflowSchema.index({ documentType: 1, isActive: 1 });
workflowSchema.index({ documentType: 1, isDefault: 1 });
workflowSchema.index({ removed: 1 });

// Update 'updated' timestamp on save
workflowSchema.pre('save', function(next) {
  this.updated = Date.now();
  next();
});

// Validation: Ensure only one default workflow per document type
workflowSchema.pre('save', async function(next) {
  if (this.isDefault && this.isActive && !this.removed) {
    const existingDefault = await this.constructor.findOne({
      documentType: this.documentType,
      isDefault: true,
      isActive: true,
      removed: false,
      _id: { $ne: this._id }
    });
    
    if (existingDefault) {
      return next(new Error(`A default workflow already exists for ${this.documentType}`));
    }
  }
  next();
});

// Validation: Ensure level numbers are sequential starting from 1
workflowSchema.pre('save', function(next) {
  if (this.levels && this.levels.length > 0) {
    const levelNumbers = this.levels.map(l => l.levelNumber).sort((a, b) => a - b);
    const expected = Array.from({ length: levelNumbers.length }, (_, i) => i + 1);
    
    const isSequential = levelNumbers.every((num, idx) => num === expected[idx]);
    if (!isSequential) {
      return next(new Error('Level numbers must be sequential starting from 1'));
    }
  }
  next();
});

// Virtual to get total number of levels
workflowSchema.virtual('totalLevels').get(function() {
  return this.levels ? this.levels.length : 0;
});

// Ensure virtuals are included in JSON
workflowSchema.set('toJSON', { virtuals: true });
workflowSchema.set('toObject', { virtuals: true });

// Instance method to get mandatory levels
workflowSchema.methods.getMandatoryLevels = function() {
  return this.levels
    .filter(level => level.isMandatory)
    .map(level => level.levelNumber);
};

// Instance method to evaluate routing rules
workflowSchema.methods.evaluateRoutingRules = function(documentData) {
  const additionalLevels = new Set();
  
  this.routingRules.forEach(rule => {
    const value = documentData[rule.conditionType];
    const ruleValue = rule.value;
    let conditionMet = false;
    
    switch (rule.operator) {
      case 'gt':
        conditionMet = value > ruleValue;
        break;
      case 'gte':
        conditionMet = value >= ruleValue;
        break;
      case 'lt':
        conditionMet = value < ruleValue;
        break;
      case 'lte':
        conditionMet = value <= ruleValue;
        break;
      case 'eq':
        conditionMet = value === ruleValue;
        break;
      case 'ne':
        conditionMet = value !== ruleValue;
        break;
      case 'in':
        conditionMet = Array.isArray(ruleValue) && ruleValue.includes(value);
        break;
      case 'not_in':
        conditionMet = Array.isArray(ruleValue) && !ruleValue.includes(value);
        break;
    }
    
    if (conditionMet) {
      rule.targetLevels.forEach(level => additionalLevels.add(level));
    }
  });
  
  return Array.from(additionalLevels);
};

// Instance method to get all required levels for a document
workflowSchema.methods.getRequiredLevels = function(documentData) {
  // Start with mandatory levels
  const requiredLevels = new Set(this.getMandatoryLevels());
  
  // Add levels from routing rules
  const ruleLevels = this.evaluateRoutingRules(documentData);
  ruleLevels.forEach(level => requiredLevels.add(level));
  
  // Return sorted array
  return Array.from(requiredLevels).sort((a, b) => a - b);
};

// Instance method to get level configuration
workflowSchema.methods.getLevelConfig = function(levelNumber) {
  return this.levels.find(level => level.levelNumber === levelNumber);
};

// Static method to find active workflows
workflowSchema.statics.findActive = function() {
  return this.find({ isActive: true, removed: false }).sort({ documentType: 1 });
};

// Static method to find default workflow for document type
workflowSchema.statics.findDefaultForDocumentType = function(documentType) {
  return this.findOne({
    documentType: documentType.toLowerCase(),
    isDefault: true,
    isActive: true,
    removed: false
  });
};

// Static method to find all workflows for document type
workflowSchema.statics.findByDocumentType = function(documentType) {
  return this.find({
    documentType: documentType.toLowerCase(),
    isActive: true,
    removed: false
  }).sort({ isDefault: -1, workflowName: 1 });
};

module.exports = mongoose.model('Workflow', workflowSchema);

