const mongoose = require('mongoose');

/**
 * Material Quotation Schema
 * For requesting and comparing prices from multiple suppliers
 */
const materialQuotationSchema = new mongoose.Schema({
  // Quotation identification
  quotationNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^MQ-\d{8}-\d{4}$/
  },
  
  // Quotation title and description
  title: {
    zh: String,
    en: String
  },
  description: String,
  
  // Requested items
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
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    uom: {
      type: String,
      required: true
    },
    specifications: String,
    targetPrice: Number, // Target price per unit
    // Supplier quotes for this item
    quotes: [{
      supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        zh: String,
        en: String
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      },
      leadTime: Number, // Days
      moq: Number, // Minimum order quantity
      validUntil: Date,
      paymentTerms: String,
      deliveryTerms: String,
      warranty: String,
      notes: String,
      attachments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Upload'
      }],
      isSelected: {
        type: Boolean,
        default: false
      },
      rank: Number // Price ranking (1 = lowest)
    }]
  }],
  
  // Target suppliers
  targetSuppliers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }],
  
  // Dates
  requestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  responseDeadline: {
    type: Date,
    required: true
  },
  validUntil: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'in_review', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Workflow integration
  workflow: {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow'
    },
    currentWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowInstance'
    },
    approvalStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  
  // Selected quotes summary
  selectedQuotes: {
    totalValue: Number,
    averageSavings: Number, // % below target
    supplierCount: Number
  },
  
  // Conversion to PO
  purchaseOrders: [{
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder'
    },
    createdAt: Date
  }],
  
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
materialQuotationSchema.index({ requestDate: -1 });
materialQuotationSchema.index({ responseDeadline: 1 });
materialQuotationSchema.index({ status: 1, requestDate: -1 });
materialQuotationSchema.index({ 'workflow.approvalStatus': 1 });
materialQuotationSchema.index({ removed: 1 });

// Virtual for response count
materialQuotationSchema.virtual('responseCount').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const uniqueSuppliers = new Set();
  this.items.forEach(item => {
    if (item.quotes && item.quotes.length > 0) {
      item.quotes.forEach(quote => {
        uniqueSuppliers.add(quote.supplier.toString());
      });
    }
  });
  
  return uniqueSuppliers.size;
});

// Virtual for completion percentage
materialQuotationSchema.virtual('completionPercentage').get(function() {
  if (!this.targetSuppliers || this.targetSuppliers.length === 0) return 0;
  if (!this.items || this.items.length === 0) return 0;
  
  const targetResponseCount = this.targetSuppliers.length;
  const actualResponseCount = this.responseCount;
  
  return Math.round((actualResponseCount / targetResponseCount) * 100);
});

/**
 * Generate quotation number: MQ-YYYYMMDD-NNNN
 */
materialQuotationSchema.statics.generateQuotationNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `MQ-${dateStr}-`;
  
  // Find the highest number for today
  const lastQuotation = await this.findOne({
    quotationNumber: new RegExp(`^${prefix}`)
  }).sort({ quotationNumber: -1 });
  
  let sequence = 1;
  if (lastQuotation) {
    const lastSequence = parseInt(lastQuotation.quotationNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

/**
 * Find quotation by number
 */
materialQuotationSchema.statics.findByNumber = function(quotationNumber) {
  return this.findOne({ quotationNumber, removed: false });
};

/**
 * Find pending quotations (awaiting responses)
 */
materialQuotationSchema.statics.findPending = function() {
  return this.find({
    removed: false,
    status: 'sent',
    responseDeadline: { $gte: new Date() }
  }).sort({ responseDeadline: 1 });
};

/**
 * Find overdue quotations
 */
materialQuotationSchema.statics.findOverdue = function() {
  return this.find({
    removed: false,
    status: 'sent',
    responseDeadline: { $lt: new Date() }
  }).sort({ responseDeadline: 1 });
};

/**
 * Get statistics
 */
materialQuotationSchema.statics.getStatistics = async function(filters = {}) {
  const query = { removed: false, ...filters };
  
  const [
    totalQuotations,
    draftCount,
    sentCount,
    completedCount,
    avgResponseCount,
    totalSavings
  ] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, status: 'draft' }),
    this.countDocuments({ ...query, status: 'sent' }),
    this.countDocuments({ ...query, status: 'completed' }),
    this.aggregate([
      { $match: query },
      { $unwind: '$items' },
      { $unwind: '$items.quotes' },
      {
        $group: {
          _id: null,
          avgQuotesPerItem: { $avg: { $size: '$items.quotes' } }
        }
      }
    ]),
    this.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$selectedQuotes.totalValue' }
        }
      }
    ])
  ]);
  
  return {
    totalQuotations,
    draftCount,
    sentCount,
    completedCount,
    avgResponseCount: avgResponseCount[0]?.avgQuotesPerItem || 0,
    totalSavings: totalSavings[0]?.totalSavings || 0
  };
};

/**
 * Pre-save middleware: Auto-calculate totals and rankings
 */
materialQuotationSchema.pre('save', function(next) {
  // Generate quotation number if new
  if (this.isNew && !this.quotationNumber) {
    this.constructor.generateQuotationNumber()
      .then(number => {
        this.quotationNumber = number;
        next();
      })
      .catch(next);
    return;
  }
  
  // Calculate item-level totals and rankings
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      if (item.quotes && item.quotes.length > 0) {
        // Calculate total price for each quote
        item.quotes.forEach(quote => {
          quote.totalPrice = quote.unitPrice * item.quantity;
        });
        
        // Rank quotes by price (lowest = 1)
        const sortedQuotes = [...item.quotes].sort((a, b) => a.unitPrice - b.unitPrice);
        sortedQuotes.forEach((quote, index) => {
          const originalQuote = item.quotes.find(q => 
            q.supplier.toString() === quote.supplier.toString()
          );
          if (originalQuote) {
            originalQuote.rank = index + 1;
          }
        });
      }
    });
  }
  
  // Calculate selected quotes summary
  this._calculateSelectedQuotesSummary();
  
  next();
});

/**
 * Instance method: Calculate selected quotes summary
 * @private
 */
materialQuotationSchema.methods._calculateSelectedQuotesSummary = function() {
  if (!this.items || this.items.length === 0) {
    this.selectedQuotes = {
      totalValue: 0,
      averageSavings: 0,
      supplierCount: 0
    };
    return;
  }
  
  let totalValue = 0;
  let totalSavings = 0;
  let savingsCount = 0;
  const selectedSuppliers = new Set();
  
  this.items.forEach(item => {
    if (item.quotes && item.quotes.length > 0) {
      const selectedQuote = item.quotes.find(q => q.isSelected);
      if (selectedQuote) {
        totalValue += selectedQuote.totalPrice;
        selectedSuppliers.add(selectedQuote.supplier.toString());
        
        // Calculate savings if target price exists
        if (item.targetPrice && item.targetPrice > 0) {
          const targetTotal = item.targetPrice * item.quantity;
          const savings = ((targetTotal - selectedQuote.totalPrice) / targetTotal) * 100;
          totalSavings += savings;
          savingsCount++;
        }
      }
    }
  });
  
  this.selectedQuotes = {
    totalValue: totalValue,
    averageSavings: savingsCount > 0 ? totalSavings / savingsCount : 0,
    supplierCount: selectedSuppliers.size
  };
};

/**
 * Instance method: Send to suppliers
 */
materialQuotationSchema.methods.send = async function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft quotations can be sent');
  }
  
  if (!this.targetSuppliers || this.targetSuppliers.length === 0) {
    throw new Error('At least one target supplier is required');
  }
  
  if (!this.items || this.items.length === 0) {
    throw new Error('At least one item is required');
  }
  
  this.status = 'sent';
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Add supplier quote
 */
materialQuotationSchema.methods.addQuote = async function(itemId, quoteData, userId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Check if supplier already quoted for this item
  const existingQuote = item.quotes.find(q => 
    q.supplier.toString() === quoteData.supplier.toString()
  );
  
  if (existingQuote) {
    throw new Error('Supplier has already provided a quote for this item');
  }
  
  item.quotes.push(quoteData);
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Select quote for an item
 */
materialQuotationSchema.methods.selectQuote = async function(itemId, quoteId, userId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Deselect all quotes for this item
  item.quotes.forEach(q => {
    q.isSelected = false;
  });
  
  // Select the specified quote
  const selectedQuote = item.quotes.id(quoteId);
  if (!selectedQuote) {
    throw new Error('Quote not found');
  }
  
  selectedQuote.isSelected = true;
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Complete quotation
 */
materialQuotationSchema.methods.complete = async function(userId) {
  if (this.status !== 'sent' && this.status !== 'in_review') {
    throw new Error('Only sent or in-review quotations can be completed');
  }
  
  // Verify that at least one quote is selected for each item
  const hasUnselectedItems = this.items.some(item => 
    !item.quotes || item.quotes.length === 0 || !item.quotes.some(q => q.isSelected)
  );
  
  if (hasUnselectedItems) {
    throw new Error('All items must have a selected quote');
  }
  
  this.status = 'completed';
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Cancel quotation
 */
materialQuotationSchema.methods.cancel = async function(userId, reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed quotation');
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
materialQuotationSchema.methods.softDelete = async function(userId) {
  if (this.status === 'completed') {
    throw new Error('Cannot delete a completed quotation. Cancel it first.');
  }
  
  this.removed = true;
  this.updatedBy = userId;
  
  return await this.save();
};

/**
 * Instance method: Format for JSON response
 */
materialQuotationSchema.methods.format = function() {
  return {
    _id: this._id,
    quotationNumber: this.quotationNumber,
    title: this.title,
    description: this.description,
    items: this.items,
    targetSuppliers: this.targetSuppliers,
    requestDate: this.requestDate,
    responseDeadline: this.responseDeadline,
    validUntil: this.validUntil,
    status: this.status,
    workflow: this.workflow,
    selectedQuotes: this.selectedQuotes,
    purchaseOrders: this.purchaseOrders,
    responseCount: this.responseCount,
    completionPercentage: this.completionPercentage,
    notes: this.notes,
    attachments: this.attachments,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const MaterialQuotation = mongoose.model('MaterialQuotation', materialQuotationSchema);

module.exports = MaterialQuotation;


