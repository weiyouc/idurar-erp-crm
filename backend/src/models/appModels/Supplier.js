const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
  // Basic Information
  supplierNumber: {
    type: String,
    unique: true,
    required: [true, 'Supplier number is required'],
    index: true
  },
  companyName: {
    zh: {
      type: String,
      trim: true,
      maxlength: [200, 'Chinese company name too long']
    },
    en: {
      type: String,
      trim: true,
      maxlength: [200, 'English company name too long']
    }
  },
  abbreviation: {
    type: String,
    trim: true,
    maxlength: [50, 'Abbreviation too long']
  },
  type: {
    type: String,
    enum: {
      values: ['manufacturer', 'distributor', 'agent', 'other'],
      message: '{VALUE} is not a valid supplier type'
    },
    default: 'manufacturer'
  },
  category: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending_approval', 'active', 'inactive', 'blacklisted'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft',
    index: true
  },
  
  // Contact Information
  contact: {
    primaryContact: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name too long']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format']
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, 'Invalid mobile number format']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    fax: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Address Information
  address: {
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name too long']
    },
    province: {
      type: String,
      trim: true,
      maxlength: [100, 'Province name too long']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name too long']
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District name too long']
    },
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address too long']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code too long']
    },
    fullAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Full address too long']
    }
  },
  
  // Business Information
  businessInfo: {
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Registration number too long']
    },
    taxNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Tax number too long']
    },
    legalRepresentative: {
      type: String,
      trim: true,
      maxlength: [100, 'Legal representative name too long']
    },
    registeredCapital: {
      type: Number,
      min: [0, 'Registered capital cannot be negative']
    },
    establishedDate: Date,
    businessScope: {
      type: String,
      trim: true,
      maxlength: [1000, 'Business scope too long']
    }
  },
  
  // Banking Information
  banking: {
    bankName: {
      type: String,
      trim: true,
      maxlength: [200, 'Bank name too long']
    },
    accountName: {
      type: String,
      trim: true,
      maxlength: [200, 'Account name too long']
    },
    accountNumber: {
      type: String,
      trim: true,
      minlength: [8, 'Account number too short'],
      maxlength: [50, 'Account number too long']
    },
    swiftCode: {
      type: String,
      trim: true,
      maxlength: [20, 'SWIFT code too long']
    },
    branchName: {
      type: String,
      trim: true,
      maxlength: [200, 'Branch name too long']
    }
  },
  
  // Credit Information
  creditInfo: {
    creditRating: {
      type: String,
      enum: {
        values: ['A', 'B', 'C', 'D', 'Unrated'],
        message: '{VALUE} is not a valid credit rating'
      },
      default: 'Unrated'
    },
    creditLimit: {
      type: Number,
      min: [0, 'Credit limit cannot be negative'],
      default: 0
    },
    paymentTerms: {
      type: String,
      default: '30 days',
      trim: true
    },
    currency: {
      type: String,
      enum: {
        values: ['CNY', 'USD', 'EUR', 'JPY', 'HKD'],
        message: '{VALUE} is not a supported currency'
      },
      default: 'CNY'
    }
  },
  
  // Qualification Documents (references to Attachment model)
  documents: {
    businessLicense: [{
      type: Schema.ObjectId,
      ref: 'Attachment'
    }],
    taxCertificate: [{
      type: Schema.ObjectId,
      ref: 'Attachment'
    }],
    qualityCertificates: [{
      type: Schema.ObjectId,
      ref: 'Attachment'
    }],
    otherDocuments: [{
      type: Schema.ObjectId,
      ref: 'Attachment'
    }]
  },
  
  // Performance Metrics
  performance: {
    qualityRating: {
      type: Number,
      min: [1, 'Quality rating must be between 1 and 5'],
      max: [5, 'Quality rating must be between 1 and 5'],
      default: 3
    },
    deliveryRating: {
      type: Number,
      min: [1, 'Delivery rating must be between 1 and 5'],
      max: [5, 'Delivery rating must be between 1 and 5'],
      default: 3
    },
    serviceRating: {
      type: Number,
      min: [1, 'Service rating must be between 1 and 5'],
      max: [5, 'Service rating must be between 1 and 5'],
      default: 3
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative']
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    onTimeDeliveryRate: {
      type: Number,
      min: [0, 'Rate must be between 0 and 100'],
      max: [100, 'Rate must be between 0 and 100'],
      default: 0
    },
    qualityPassRate: {
      type: Number,
      min: [0, 'Rate must be between 0 and 100'],
      max: [100, 'Rate must be between 0 and 100'],
      default: 0
    }
  },
  
  // Workflow Information
  workflow: {
    currentWorkflowId: {
      type: Schema.ObjectId,
      ref: 'WorkflowInstance'
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'none'],
        message: '{VALUE} is not a valid approval status'
      },
      default: 'none'
    },
    approvedBy: {
      type: Schema.ObjectId,
      ref: 'Admin'
    },
    approvedAt: Date,
    rejectedBy: {
      type: Schema.ObjectId,
      ref: 'Admin'
    },
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason too long']
    }
  },
  
  // Metadata
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Admin',
    required: [true, 'Creator is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.ObjectId,
    ref: 'Admin'
  },
  updatedAt: Date,
  removed: {
    type: Boolean,
    default: false,
    index: true
  },
  removedAt: Date,
  removedBy: {
    type: Schema.ObjectId,
    ref: 'Admin'
  },
  
  // Additional Fields
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes too long']
  },
  tags: {
    type: [String],
    default: []
  },
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  }
});

// Indexes
supplierSchema.index({ 'companyName.zh': 'text', 'companyName.en': 'text' });
supplierSchema.index({ supplierNumber: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ removed: 1 });
supplierSchema.index({ createdAt: -1 });

// Compound indexes for common queries
supplierSchema.index({ status: 1, type: 1 });
supplierSchema.index({ status: 1, removed: 1 });

// Pre-save validation: At least one company name (ZH or EN) is required
supplierSchema.pre('save', function(next) {
  const hasZh = this.companyName && this.companyName.zh && this.companyName.zh.trim();
  const hasEn = this.companyName && this.companyName.en && this.companyName.en.trim();
  
  if (!hasZh && !hasEn) {
    next(new Error('At least one company name (Chinese or English) is required'));
  } else {
    // Update timestamps
    if (!this.isNew) {
      this.updatedAt = new Date();
    }
    next();
  }
});

/**
 * Instance Methods
 */

/**
 * Submit supplier for approval
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.submitForApproval = async function() {
  // Will integrate with WorkflowEngine in next task
  this.status = 'pending_approval';
  this.workflow.approvalStatus = 'pending';
  return await this.save();
};

/**
 * Approve supplier
 * @param {ObjectId} userId - User performing the approval
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.approve = async function(userId) {
  this.status = 'active';
  this.workflow.approvalStatus = 'approved';
  this.workflow.approvedBy = userId;
  this.workflow.approvedAt = new Date();
  return await this.save();
};

/**
 * Reject supplier
 * @param {ObjectId} userId - User performing the rejection
 * @param {string} reason - Rejection reason
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.reject = async function(userId, reason) {
  this.status = 'draft';
  this.workflow.approvalStatus = 'rejected';
  this.workflow.rejectedBy = userId;
  this.workflow.rejectedAt = new Date();
  this.workflow.rejectionReason = reason;
  return await this.save();
};

/**
 * Activate supplier
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.activate = async function() {
  this.status = 'active';
  return await this.save();
};

/**
 * Deactivate supplier
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.deactivate = async function() {
  this.status = 'inactive';
  return await this.save();
};

/**
 * Add to blacklist
 * @param {string} reason - Blacklist reason
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.addToBlacklist = async function(reason) {
  this.status = 'blacklisted';
  this.notes = (this.notes ? this.notes + '\n' : '') + `Blacklisted: ${reason}`;
  return await this.save();
};

/**
 * Update performance metrics
 * @param {Object} metrics - Performance metrics to update
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.updatePerformance = async function(metrics) {
  Object.assign(this.performance, metrics);
  return await this.save();
};

/**
 * Soft delete
 * @param {ObjectId} userId - User performing the deletion
 * @returns {Promise<Supplier>}
 */
supplierSchema.methods.softDelete = async function(userId) {
  this.removed = true;
  this.removedAt = new Date();
  this.removedBy = userId;
  return await this.save();
};

/**
 * Format supplier data for API response
 * @returns {Object}
 */
supplierSchema.methods.format = function() {
  return {
    id: this._id,
    supplierNumber: this.supplierNumber,
    companyName: this.companyName,
    abbreviation: this.abbreviation,
    type: this.type,
    category: this.category,
    status: this.status,
    contact: this.contact,
    address: this.address,
    businessInfo: this.businessInfo,
    banking: this.banking,
    creditInfo: this.creditInfo,
    performance: this.performance,
    workflow: {
      approvalStatus: this.workflow.approvalStatus,
      approvedAt: this.workflow.approvedAt,
      rejectedAt: this.workflow.rejectedAt,
      rejectionReason: this.workflow.rejectionReason
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    notes: this.notes,
    tags: this.tags
  };
};

/**
 * Static Methods
 */

/**
 * Generate unique supplier number
 * Format: SUP-YYYYMMDD-NNN
 * @returns {Promise<string>}
 */
supplierSchema.statics.generateSupplierNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Find the last supplier number for today
  const lastSupplier = await this.findOne({
    supplierNumber: new RegExp(`^SUP-${datePrefix}-`)
  }).sort({ supplierNumber: -1 });
  
  let sequence = 1;
  if (lastSupplier) {
    const lastNumber = lastSupplier.supplierNumber.split('-')[2];
    sequence = parseInt(lastNumber) + 1;
  }
  
  const sequenceStr = String(sequence).padStart(3, '0');
  return `SUP-${datePrefix}-${sequenceStr}`;
};

/**
 * Find supplier by number
 * @param {string} number - Supplier number
 * @returns {Promise<Supplier>}
 */
supplierSchema.statics.findByNumber = function(number) {
  return this.findOne({ supplierNumber: number, removed: false });
};

/**
 * Full-text search
 * @param {string} query - Search query
 * @returns {Promise<Supplier[]>}
 */
supplierSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    removed: false
  }).sort({ score: { $meta: 'textScore' } });
};

/**
 * Find by status
 * @param {string} status - Status value
 * @returns {Promise<Supplier[]>}
 */
supplierSchema.statics.findByStatus = function(status) {
  return this.find({ status, removed: false }).sort({ createdAt: -1 });
};

/**
 * Find by type
 * @param {string} type - Supplier type
 * @returns {Promise<Supplier[]>}
 */
supplierSchema.statics.findByType = function(type) {
  return this.find({ type, removed: false }).sort({ createdAt: -1 });
};

/**
 * Get supplier statistics
 * @returns {Promise<Object>}
 */
supplierSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { removed: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] }
        },
        blacklisted: {
          $sum: { $cond: [{ $eq: ['$status', 'blacklisted'] }, 1, 0] }
        },
        manufacturers: {
          $sum: { $cond: [{ $eq: ['$type', 'manufacturer'] }, 1, 0] }
        },
        distributors: {
          $sum: { $cond: [{ $eq: ['$type', 'distributor'] }, 1, 0] }
        },
        avgQualityRating: { $avg: '$performance.qualityRating' },
        avgDeliveryRating: { $avg: '$performance.deliveryRating' },
        avgServiceRating: { $avg: '$performance.serviceRating' }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    blacklisted: 0,
    manufacturers: 0,
    distributors: 0,
    avgQualityRating: 0,
    avgDeliveryRating: 0,
    avgServiceRating: 0
  };
};

module.exports = mongoose.model('Supplier', supplierSchema);

