const mongoose = require('mongoose');

/**
 * Goods Receipt Schema
 * Tracks material receiving against purchase orders
 */
const goodsReceiptSchema = new mongoose.Schema({
  // Receipt identification
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^GR-\d{8}-\d{4}$/
  },
  
  // Purchase order reference
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
    index: true
  },
  poNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Supplier reference
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  
  // Receipt date
  receiptDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Received items
  items: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    materialNumber: String,
    materialName: {
      zh: String,
      en: String
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    acceptedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    rejectedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    uom: {
      type: String,
      required: true
    },
    batchNumber: String,
    expiryDate: Date,
    qualityStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'partial'],
      default: 'pending'
    },
    inspectionNotes: String,
    storageLocation: String
  }],
  
  // Receipt status
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Quality inspection
  qualityInspection: {
    required: {
      type: Boolean,
      default: false
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    inspectionDate: Date,
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'partial']
    },
    notes: String
  },
  
  // Delivery note
  deliveryNote: {
    number: String,
    date: Date,
    attachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload'
    }
  },
  
  // Warehouse information
  warehouse: {
    location: String,
    binLocation: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  
  // Summary totals
  totalReceived: {
    type: Number,
    default: 0
  },
  totalAccepted: {
    type: Number,
    default: 0
  },
  totalRejected: {
    type: Number,
    default: 0
  },
  
  // Additional information
  notes: String,
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }],
  
  // Soft delete
  removed: {
    type: Boolean,
    default: false
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
goodsReceiptSchema.index({ receiptDate: -1 });
goodsReceiptSchema.index({ status: 1, receiptDate: -1 });
goodsReceiptSchema.index({ 'qualityInspection.result': 1 });
goodsReceiptSchema.index({ removed: 1 });

// Virtual for completion percentage
goodsReceiptSchema.virtual('completionPercentage').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const totalOrdered = this.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  
  return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
});

// Virtual for acceptance rate
goodsReceiptSchema.virtual('acceptanceRate').get(function() {
  const totalReceived = this.totalReceived || 0;
  const totalAccepted = this.totalAccepted || 0;
  
  return totalReceived > 0 ? Math.round((totalAccepted / totalReceived) * 100) : 0;
});

/**
 * Generate receipt number: GR-YYYYMMDD-NNNN
 */
goodsReceiptSchema.statics.generateReceiptNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `GR-${dateStr}-`;
  
  // Find the highest number for today
  const lastReceipt = await this.findOne({
    receiptNumber: new RegExp(`^${prefix}`)
  }).sort({ receiptNumber: -1 });
  
  let sequence = 1;
  if (lastReceipt) {
    const lastSequence = parseInt(lastReceipt.receiptNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

/**
 * Find receipt by number
 */
goodsReceiptSchema.statics.findByNumber = function(receiptNumber) {
  return this.findOne({ receiptNumber, removed: false });
};

/**
 * Find receipts by PO
 */
goodsReceiptSchema.statics.findByPO = function(purchaseOrderId) {
  return this.find({ 
    purchaseOrder: purchaseOrderId, 
    removed: false 
  }).sort({ receiptDate: -1 });
};

/**
 * Get pending quality inspections
 */
goodsReceiptSchema.statics.getPendingInspections = function() {
  return this.find({
    removed: false,
    'qualityInspection.required': true,
    'qualityInspection.result': { $in: ['pending', null] }
  }).populate('supplier', 'companyName supplierNumber')
    .populate('purchaseOrder', 'poNumber')
    .sort({ receiptDate: 1 });
};

/**
 * Get statistics
 */
goodsReceiptSchema.statics.getStatistics = async function(filters = {}) {
  const query = { removed: false, ...filters };
  
  const [totalReceipts, completedReceipts, pendingInspections, stats] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, status: 'completed' }),
    this.countDocuments({ 
      ...query,
      'qualityInspection.required': true,
      'qualityInspection.result': 'pending'
    }),
    this.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: '$totalReceived' },
          totalAccepted: { $sum: '$totalAccepted' },
          totalRejected: { $sum: '$totalRejected' }
        }
      }
    ])
  ]);
  
  const aggregateStats = stats[0] || { 
    totalReceived: 0, 
    totalAccepted: 0, 
    totalRejected: 0 
  };
  
  return {
    totalReceipts,
    completedReceipts,
    pendingInspections,
    ...aggregateStats,
    acceptanceRate: aggregateStats.totalReceived > 0 
      ? Math.round((aggregateStats.totalAccepted / aggregateStats.totalReceived) * 100) 
      : 0
  };
};

/**
 * Pre-save middleware: Calculate totals
 */
goodsReceiptSchema.pre('save', function(next) {
  // Generate receipt number if new
  if (this.isNew && !this.receiptNumber) {
    this.constructor.generateReceiptNumber()
      .then(number => {
        this.receiptNumber = number;
        next();
      })
      .catch(next);
    return;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.totalReceived = this.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    this.totalAccepted = this.items.reduce((sum, item) => sum + (item.acceptedQuantity || 0), 0);
    this.totalRejected = this.items.reduce((sum, item) => sum + (item.rejectedQuantity || 0), 0);
  }
  
  next();
});

/**
 * Instance method: Complete receipt
 */
goodsReceiptSchema.methods.complete = async function(userId) {
  if (this.status === 'completed') {
    throw new Error('Receipt is already completed');
  }
  
  if (this.status === 'cancelled') {
    throw new Error('Cannot complete a cancelled receipt');
  }
  
  // Validate that all items have been processed
  const hasUnprocessedItems = this.items.some(item => 
    item.receivedQuantity > 0 && item.acceptedQuantity === 0 && item.rejectedQuantity === 0
  );
  
  if (hasUnprocessedItems && this.qualityInspection.required) {
    throw new Error('Quality inspection required for all received items');
  }
  
  this.status = 'completed';
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Record quality inspection
 */
goodsReceiptSchema.methods.recordInspection = async function(inspectionData, userId) {
  if (this.status === 'cancelled') {
    throw new Error('Cannot inspect a cancelled receipt');
  }
  
  // Update quality inspection
  this.qualityInspection.inspector = userId;
  this.qualityInspection.inspectionDate = new Date();
  this.qualityInspection.result = inspectionData.result;
  this.qualityInspection.notes = inspectionData.notes;
  
  // Update item-level inspection results
  if (inspectionData.items && Array.isArray(inspectionData.items)) {
    inspectionData.items.forEach(inspItem => {
      const item = this.items.id(inspItem.itemId);
      if (item) {
        item.acceptedQuantity = inspItem.acceptedQuantity || 0;
        item.rejectedQuantity = inspItem.rejectedQuantity || 0;
        item.qualityStatus = inspItem.qualityStatus || 'passed';
        item.inspectionNotes = inspItem.inspectionNotes;
      }
    });
  }
  
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Cancel receipt
 */
goodsReceiptSchema.methods.cancel = async function(userId, reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed receipt');
  }
  
  this.status = 'cancelled';
  this.notes = this.notes 
    ? `${this.notes}\n[Cancelled: ${reason}]` 
    : `[Cancelled: ${reason}]`;
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Soft delete
 */
goodsReceiptSchema.methods.softDelete = async function(userId) {
  if (this.status === 'completed') {
    throw new Error('Cannot delete a completed receipt. Cancel it first.');
  }
  
  this.removed = true;
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Format for JSON response
 */
goodsReceiptSchema.methods.format = function() {
  return {
    _id: this._id,
    receiptNumber: this.receiptNumber,
    purchaseOrder: this.purchaseOrder,
    poNumber: this.poNumber,
    supplier: this.supplier,
    receiptDate: this.receiptDate,
    items: this.items,
    status: this.status,
    qualityInspection: this.qualityInspection,
    deliveryNote: this.deliveryNote,
    warehouse: this.warehouse,
    totalReceived: this.totalReceived,
    totalAccepted: this.totalAccepted,
    totalRejected: this.totalRejected,
    completionPercentage: this.completionPercentage,
    acceptanceRate: this.acceptanceRate,
    notes: this.notes,
    attachments: this.attachments,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);

module.exports = GoodsReceipt;


