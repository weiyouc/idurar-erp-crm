const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * PurchaseOrder Model
 * 
 * Manages purchase orders from creation through completion.
 * Integrates with Supplier, Material, and Workflow systems.
 */

const purchaseOrderItemSchema = new Schema({
  material: {
    type: Schema.ObjectId,
    ref: 'Material',
    required: [true, 'Material is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description too long']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.001, 'Quantity must be positive']
  },
  uom: {
    type: String,
    required: [true, 'Unit of measure is required'],
    trim: true
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total price cannot be negative']
  },
  lineTotal: {
    type: Number,
    default: 0
  },
  expectedDeliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long']
  },
  // Tracking
  receivedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Received quantity cannot be negative']
  },
  remainingQuantity: {
    type: Number,
    default: 0
  }
}, { _id: true });

const purchaseOrderSchema = new Schema({
  // Identification
  poNumber: {
    type: String,
    unique: true,
    required: [true, 'PO number is required'],
    index: true
  },
  
  // Supplier Information
  supplier: {
    type: Schema.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required'],
    index: true
  },
  
  // Dates
  orderDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Order date is required']
  },
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Expected delivery date is required']
  },
  actualDeliveryDate: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: {
      values: [
        'draft',
        'pending_approval',
        'approved',
        'rejected',
        'sent_to_supplier',
        'confirmed',
        'in_production',
        'partially_shipped',
        'shipped',
        'partially_received',
        'received',
        'completed',
        'cancelled'
      ],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft',
    index: true
  },
  
  // Line Items
  items: [purchaseOrderItemSchema],
  
  // Financial Summary
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: ['CNY', 'USD', 'EUR', 'JPY', 'HKD'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'CNY'
  },
  
  // Workflow Integration
  workflow: {
    currentWorkflowId: {
      type: Schema.ObjectId,
      ref: 'WorkflowInstance'
    },
    submittedBy: {
      type: Schema.ObjectId,
      ref: 'Admin'
    },
    submittedAt: Date,
    approvalStatus: {
      type: String,
      enum: {
        values: ['none', 'pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid approval status'
      },
      default: 'none'
    },
    approvers: [{
      user: {
        type: Schema.ObjectId,
        ref: 'Admin'
      },
      action: {
        type: String,
        enum: ['approved', 'rejected', 'recalled']
      },
      comments: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Delivery Information
  deliveryAddress: {
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name too long']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, 'Invalid phone number']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address too long']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes too long']
    }
  },
  
  // Documents
  attachments: [{
    type: Schema.ObjectId,
    ref: 'Attachment'
  }],
  
  // Communication with Supplier
  sentToSupplier: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    sentBy: {
      type: Schema.ObjectId,
      ref: 'Admin'
    },
    email: String,
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    confirmationNumber: String
  },
  
  // Additional Fields
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes too long']
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Internal notes too long']
  },
  paymentTerms: {
    type: String,
    trim: true,
    default: 'Net 30',
    maxlength: [200, 'Payment terms too long']
  },
  shippingMethod: {
    type: String,
    trim: true,
    maxlength: [100, 'Shipping method too long']
  },
  priority: {
    type: String,
    enum: {
      values: ['normal', 'urgent', 'critical'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'normal'
  },
  
  // Metadata
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Admin',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: Schema.ObjectId,
    ref: 'Admin'
  },
  removed: {
    type: Boolean,
    default: false,
    index: true
  },
  removedAt: Date,
  removedBy: {
    type: Schema.ObjectId,
    ref: 'Admin'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for performance
 */
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ status: 1, orderDate: -1 });
purchaseOrderSchema.index({ createdBy: 1 });
purchaseOrderSchema.index({ 'workflow.submittedBy': 1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

/**
 * Pre-save middleware
 */
purchaseOrderSchema.pre('save', async function(next) {
  // Generate PO number if new
  if (this.isNew && !this.poNumber) {
    this.poNumber = await this.constructor.generatePONumber();
  }
  
  // Calculate line totals
  this.items.forEach(item => {
    // Simple total price (quantity * unitPrice)
    item.totalPrice = item.quantity * item.unitPrice;
    
    // Line total with tax and discount
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const lineTax = (lineSubtotal - lineDiscount) * ((item.taxRate || 0) / 100);
    item.lineTotal = lineSubtotal - lineDiscount + lineTax;
    item.remainingQuantity = item.quantity - (item.receivedQuantity || 0);
  });
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
  
  this.taxAmount = this.items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unitPrice - (item.discount || 0);
    return sum + (lineSubtotal * (item.taxRate / 100));
  }, 0);
  
  const itemDiscounts = this.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  this.totalAmount = this.subtotal - itemDiscounts - (this.discount || 0) + this.taxAmount + (this.shippingCost || 0);
  
  // Update timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  next();
});

/**
 * Virtual: Check if fully received
 */
purchaseOrderSchema.virtual('isFullyReceived').get(function() {
  return this.items.every(item => item.receivedQuantity >= item.quantity);
});

/**
 * Virtual: Check if partially received
 */
purchaseOrderSchema.virtual('isPartiallyReceived').get(function() {
  return this.items.some(item => item.receivedQuantity > 0 && item.receivedQuantity < item.quantity);
});

/**
 * Virtual: Total items count
 */
purchaseOrderSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

/**
 * INSTANCE METHODS
 */

/**
 * Submit for approval
 */
purchaseOrderSchema.methods.submitForApproval = async function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft POs can be submitted for approval');
  }
  
  this.status = 'pending_approval';
  this.workflow.submittedBy = userId;
  this.workflow.submittedAt = new Date();
  this.workflow.approvalStatus = 'pending';
  
  return await this.save();
};

/**
 * Approve PO
 */
purchaseOrderSchema.methods.approve = async function(userId, comments) {
  if (this.workflow.approvalStatus !== 'pending') {
    throw new Error('PO is not pending approval');
  }
  
  this.status = 'approved';
  this.workflow.approvalStatus = 'approved';
  this.workflow.approvers.push({
    user: userId,
    action: 'approved',
    comments: comments || '',
    timestamp: new Date()
  });
  
  return await this.save();
};

/**
 * Reject PO
 */
purchaseOrderSchema.methods.reject = async function(userId, reason) {
  if (this.workflow.approvalStatus !== 'pending') {
    throw new Error('PO is not pending approval');
  }
  
  if (!reason) {
    throw new Error('Rejection reason is required');
  }
  
  this.status = 'rejected';
  this.workflow.approvalStatus = 'rejected';
  this.workflow.approvers.push({
    user: userId,
    action: 'rejected',
    comments: reason,
    timestamp: new Date()
  });
  
  return await this.save();
};

/**
 * Send to supplier
 */
purchaseOrderSchema.methods.sendToSupplier = async function(userId, email) {
  if (this.status !== 'approved') {
    throw new Error('Only approved POs can be sent to supplier');
  }
  
  this.status = 'sent_to_supplier';
  this.sentToSupplier = {
    sent: true,
    sentAt: new Date(),
    sentBy: userId,
    email: email,
    acknowledged: false
  };
  
  return await this.save();
};

/**
 * Confirm from supplier
 */
purchaseOrderSchema.methods.confirmFromSupplier = async function(confirmationNumber) {
  if (this.status !== 'sent_to_supplier') {
    throw new Error('PO must be sent to supplier first');
  }
  
  this.status = 'confirmed';
  this.sentToSupplier.acknowledged = true;
  this.sentToSupplier.acknowledgedAt = new Date();
  this.sentToSupplier.confirmationNumber = confirmationNumber;
  
  return await this.save();
};

/**
 * Cancel PO
 */
purchaseOrderSchema.methods.cancel = async function(userId, reason) {
  const allowedStatuses = ['draft', 'pending_approval', 'approved', 'sent_to_supplier'];
  if (!allowedStatuses.includes(this.status)) {
    throw new Error(`Cannot cancel PO with status: ${this.status}`);
  }
  
  this.status = 'cancelled';
  this.internalNotes = (this.internalNotes || '') + `\nCancelled: ${reason}`;
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Receive goods (update received quantities)
 */
purchaseOrderSchema.methods.receiveGoods = async function(receivedItems) {
  receivedItems.forEach(received => {
    const item = this.items.id(received.itemId);
    if (item) {
      item.receivedQuantity = (item.receivedQuantity || 0) + received.quantity;
      item.remainingQuantity = item.quantity - item.receivedQuantity;
    }
  });
  
  // Update status based on received quantities
  if (this.isFullyReceived) {
    this.status = 'received';
    if (this.items.every(item => item.receivedQuantity === item.quantity)) {
      this.actualDeliveryDate = new Date();
    }
  } else if (this.isPartiallyReceived) {
    this.status = 'partially_received';
  }
  
  return await this.save();
};

/**
 * Complete PO
 */
purchaseOrderSchema.methods.complete = async function() {
  if (this.status !== 'received') {
    throw new Error('PO must be fully received before completion');
  }
  
  this.status = 'completed';
  return await this.save();
};

/**
 * Soft delete
 */
purchaseOrderSchema.methods.softDelete = async function(userId) {
  this.removed = true;
  this.removedAt = new Date();
  this.removedBy = userId;
  return await this.save();
};

/**
 * Format for API response
 */
purchaseOrderSchema.methods.format = function() {
  return {
    id: this._id,
    poNumber: this.poNumber,
    supplier: this.supplier,
    orderDate: this.orderDate,
    expectedDeliveryDate: this.expectedDeliveryDate,
    actualDeliveryDate: this.actualDeliveryDate,
    status: this.status,
    items: this.items,
    subtotal: this.subtotal,
    taxAmount: this.taxAmount,
    shippingCost: this.shippingCost,
    discount: this.discount,
    totalAmount: this.totalAmount,
    currency: this.currency,
    workflow: {
      approvalStatus: this.workflow.approvalStatus,
      submittedBy: this.workflow.submittedBy,
      submittedAt: this.workflow.submittedAt,
      approvers: this.workflow.approvers
    },
    deliveryAddress: this.deliveryAddress,
    sentToSupplier: this.sentToSupplier,
    notes: this.notes,
    paymentTerms: this.paymentTerms,
    shippingMethod: this.shippingMethod,
    priority: this.priority,
    isFullyReceived: this.isFullyReceived,
    isPartiallyReceived: this.isPartiallyReceived,
    totalItems: this.totalItems,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * STATIC METHODS
 */

/**
 * Generate unique PO number
 * Format: PO-YYYYMMDD-NNN
 */
purchaseOrderSchema.statics.generatePONumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  const lastPO = await this.findOne({
    poNumber: new RegExp(`^PO-${datePrefix}-`)
  }).sort({ poNumber: -1 });
  
  let sequence = 1;
  if (lastPO) {
    const lastNumber = lastPO.poNumber.split('-')[2];
    sequence = parseInt(lastNumber) + 1;
  }
  
  const sequenceStr = String(sequence).padStart(3, '0');
  return `PO-${datePrefix}-${sequenceStr}`;
};

/**
 * Find by PO number
 */
purchaseOrderSchema.statics.findByNumber = function(poNumber) {
  return this.findOne({ poNumber, removed: false });
};

/**
 * Find by supplier
 */
purchaseOrderSchema.statics.findBySupplier = function(supplierId, options = {}) {
  return this.find({ supplier: supplierId, removed: false })
    .sort(options.sort || { orderDate: -1 })
    .limit(options.limit || 100);
};

/**
 * Find by status
 */
purchaseOrderSchema.statics.findByStatus = function(status) {
  return this.find({ status, removed: false }).sort({ orderDate: -1 });
};

/**
 * Find pending approvals
 */
purchaseOrderSchema.statics.findPendingApprovals = function() {
  return this.find({
    status: 'pending_approval',
    'workflow.approvalStatus': 'pending',
    removed: false
  }).sort({ 'workflow.submittedAt': 1 });
};

/**
 * Get statistics
 */
purchaseOrderSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { removed: false } },
    {
      $group: {
        _id: null,
        totalPOs: { $sum: 1 },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        pendingApproval: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent_to_supplier'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        received: { $sum: { $cond: [{ $in: ['$status', ['received', 'partially_received']] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalValue: { $sum: '$totalAmount' },
        avgValue: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPOs: 0,
    draft: 0,
    pendingApproval: 0,
    approved: 0,
    sent: 0,
    confirmed: 0,
    received: 0,
    completed: 0,
    cancelled: 0,
    totalValue: 0,
    avgValue: 0
  };
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

