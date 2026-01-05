const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const materialSchema = new Schema({
  // Basic Information
  materialNumber: {
    type: String,
    unique: true,
    required: [true, 'Material number is required'],
    index: true
  },
  materialName: {
    zh: {
      type: String,
      required: [true, 'Chinese material name is required'],
      trim: true,
      maxlength: [200, 'Chinese name too long']
    },
    en: {
      type: String,
      trim: true,
      maxlength: [200, 'English name too long']
    }
  },
  abbreviation: {
    type: String,
    trim: true,
    maxlength: [50, 'Abbreviation too long']
  },
  category: {
    type: Schema.ObjectId,
    ref: 'MaterialCategory',
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['raw', 'semi-finished', 'finished', 'packaging', 'consumable', 'other'],
      message: '{VALUE} is not a valid material type'
    },
    default: 'raw',
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'obsolete', 'discontinued'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft',
    index: true
  },
  
  // Classification
  hsCode: {
    type: String,
    trim: true,
    maxlength: [20, 'HS code too long']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name too long']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, 'Model number too long']
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [200, 'Manufacturer name too long']
  },
  
  // Units of Measure
  baseUOM: {
    type: String,
    required: [true, 'Base UOM is required'],
    default: 'pcs',
    trim: true,
    lowercase: true
  },
  alternativeUOMs: [{
    uom: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    conversionFactor: {
      type: Number,
      required: true,
      min: [0.0001, 'Conversion factor too small']
    },
    isPurchasing: {
      type: Boolean,
      default: false
    },
    isInventory: {
      type: Boolean,
      default: false
    }
  }],
  
  // Specifications
  specifications: {
    length: Number, // in mm
    width: Number,  // in mm
    height: Number, // in mm
    weight: Number, // in kg
    volume: Number, // in m³
    color: String,
    material: String, // e.g., "Aluminum", "Plastic"
    finish: String,   // e.g., "Anodized", "Powder Coated"
    customFields: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  
  // Purchasing
  preferredSuppliers: [{
    supplier: {
      type: Schema.ObjectId,
      ref: 'Supplier',
      required: true
    },
    supplierPN: {
      type: String, // Supplier part number
      trim: true
    },
    leadTime: {
      type: Number, // in days
      min: [0, 'Lead time cannot be negative']
    },
    moq: {
      type: Number, // Minimum order quantity
      min: [0, 'MOQ cannot be negative']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  defaultLeadTime: {
    type: Number,
    default: 0,
    min: [0, 'Lead time cannot be negative']
  },
  minimumOrderQty: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  
  // Pricing
  standardCost: {
    type: Number,
    default: 0,
    min: [0, 'Standard cost cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: ['CNY', 'USD', 'EUR', 'JPY', 'HKD'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'CNY'
  },
  lastPurchasePrice: {
    type: Number,
    min: [0, 'Last purchase price cannot be negative']
  },
  lastPurchaseDate: Date,
  
  // Inventory
  safetyStock: {
    type: Number,
    default: 0,
    min: [0, 'Safety stock cannot be negative']
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: [0, 'Reorder point cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 0,
    min: [0, 'Max stock level cannot be negative']
  },
  
  // Attachments
  images: [{
    type: Schema.ObjectId,
    ref: 'Attachment'
  }],
  documents: [{
    type: Schema.ObjectId,
    ref: 'Attachment'
  }],
  
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
  
  // Additional
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
materialSchema.index({ materialNumber: 1 });
materialSchema.index({ 'materialName.zh': 'text', 'materialName.en': 'text' });
materialSchema.index({ category: 1 });
materialSchema.index({ type: 1 });
materialSchema.index({ status: 1 });
materialSchema.index({ removed: 1 });
materialSchema.index({ createdAt: -1 });

// Compound indexes
materialSchema.index({ status: 1, type: 1 });
materialSchema.index({ status: 1, removed: 1 });
materialSchema.index({ category: 1, status: 1 });

// Pre-save middleware
materialSchema.pre('save', function(next) {
  // Update timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Ensure only one primary supplier
  if (this.preferredSuppliers && this.preferredSuppliers.length > 0) {
    const primaryCount = this.preferredSuppliers.filter(s => s.isPrimary).length;
    if (primaryCount > 1) {
      return next(new Error('Only one primary supplier allowed'));
    }
  }
  
  next();
});

/**
 * Instance Methods
 */

/**
 * Convert quantity from one UOM to base UOM
 * @param {Number} quantity
 * @param {String} fromUOM
 * @returns {Number}
 */
materialSchema.methods.convertToBaseUOM = function(quantity, fromUOM) {
  if (fromUOM.toLowerCase() === this.baseUOM.toLowerCase()) {
    return quantity;
  }
  
  const altUOM = this.alternativeUOMs.find(
    u => u.uom.toLowerCase() === fromUOM.toLowerCase()
  );
  
  if (!altUOM) {
    throw new Error(`UOM ${fromUOM} not found for material ${this.materialNumber}`);
  }
  
  return quantity * altUOM.conversionFactor;
};

/**
 * Convert quantity from base UOM to another UOM
 * @param {Number} quantity
 * @param {String} toUOM
 * @returns {Number}
 */
materialSchema.methods.convertFromBaseUOM = function(quantity, toUOM) {
  if (toUOM.toLowerCase() === this.baseUOM.toLowerCase()) {
    return quantity;
  }
  
  const altUOM = this.alternativeUOMs.find(
    u => u.uom.toLowerCase() === toUOM.toLowerCase()
  );
  
  if (!altUOM) {
    throw new Error(`UOM ${toUOM} not found for material ${this.materialNumber}`);
  }
  
  return quantity / altUOM.conversionFactor;
};

/**
 * Get primary supplier
 * @returns {Object|null}
 */
materialSchema.methods.getPrimarySupplier = function() {
  if (!this.preferredSuppliers || this.preferredSuppliers.length === 0) {
    return null;
  }
  
  return this.preferredSuppliers.find(s => s.isPrimary) || this.preferredSuppliers[0];
};

/**
 * Add preferred supplier
 * @param {Object} supplierData
 * @returns {Promise<Material>}
 */
materialSchema.methods.addPreferredSupplier = async function(supplierData) {
  // Check if supplier already exists
  const exists = this.preferredSuppliers.some(
    s => s.supplier.toString() === supplierData.supplier.toString()
  );
  
  if (exists) {
    throw new Error('Supplier already in preferred list');
  }
  
  // If this is the first supplier or marked as primary, make it primary
  if (this.preferredSuppliers.length === 0 || supplierData.isPrimary) {
    // Remove primary flag from others
    this.preferredSuppliers.forEach(s => s.isPrimary = false);
    supplierData.isPrimary = true;
  }
  
  this.preferredSuppliers.push(supplierData);
  return await this.save();
};

/**
 * Remove preferred supplier
 * @param {ObjectId} supplierId
 * @returns {Promise<Material>}
 */
materialSchema.methods.removePreferredSupplier = async function(supplierId) {
  const index = this.preferredSuppliers.findIndex(
    s => s.supplier.toString() === supplierId.toString()
  );
  
  if (index === -1) {
    throw new Error('Supplier not found in preferred list');
  }
  
  const wasPrimary = this.preferredSuppliers[index].isPrimary;
  this.preferredSuppliers.splice(index, 1);
  
  // If removed supplier was primary, make first remaining supplier primary
  if (wasPrimary && this.preferredSuppliers.length > 0) {
    this.preferredSuppliers[0].isPrimary = true;
  }
  
  return await this.save();
};

/**
 * Activate material
 * @returns {Promise<Material>}
 */
materialSchema.methods.activate = async function() {
  this.status = 'active';
  return await this.save();
};

/**
 * Deactivate material
 * @returns {Promise<Material>}
 */
materialSchema.methods.deactivate = async function() {
  this.status = 'obsolete';
  return await this.save();
};

/**
 * Soft delete
 * @param {ObjectId} userId
 * @returns {Promise<Material>}
 */
materialSchema.methods.softDelete = async function(userId) {
  this.removed = true;
  this.removedAt = new Date();
  this.removedBy = userId;
  return await this.save();
};

/**
 * Restore deleted material
 * @returns {Promise<Material>}
 */
materialSchema.methods.restore = async function() {
  this.removed = false;
  this.removedAt = undefined;
  this.removedBy = undefined;
  return await this.save();
};

/**
 * Format material data for API response
 * @returns {Object}
 */
materialSchema.methods.format = function() {
  return {
    id: this._id,
    materialNumber: this.materialNumber,
    materialName: this.materialName,
    abbreviation: this.abbreviation,
    category: this.category,
    type: this.type,
    status: this.status,
    hsCode: this.hsCode,
    brand: this.brand,
    model: this.model,
    manufacturer: this.manufacturer,
    baseUOM: this.baseUOM,
    alternativeUOMs: this.alternativeUOMs,
    specifications: this.specifications,
    preferredSuppliers: this.preferredSuppliers,
    defaultLeadTime: this.defaultLeadTime,
    minimumOrderQty: this.minimumOrderQty,
    standardCost: this.standardCost,
    currency: this.currency,
    lastPurchasePrice: this.lastPurchasePrice,
    lastPurchaseDate: this.lastPurchaseDate,
    safetyStock: this.safetyStock,
    reorderPoint: this.reorderPoint,
    maxStockLevel: this.maxStockLevel,
    images: this.images,
    documents: this.documents,
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
 * Generate unique material number
 * Format: MAT-YYYYMMDD-NNN
 * @returns {Promise<string>}
 */
materialSchema.statics.generateMaterialNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Find the last material number for today
  const lastMaterial = await this.findOne({
    materialNumber: new RegExp(`^MAT-${datePrefix}-`)
  }).sort({ materialNumber: -1 });
  
  let sequence = 1;
  if (lastMaterial) {
    const lastNumber = lastMaterial.materialNumber.split('-')[2];
    sequence = parseInt(lastNumber) + 1;
  }
  
  const sequenceStr = String(sequence).padStart(3, '0');
  return `MAT-${datePrefix}-${sequenceStr}`;
};

/**
 * Find material by number
 * @param {String} number
 * @returns {Promise<Material>}
 */
materialSchema.statics.findByNumber = function(number) {
  return this.findOne({ materialNumber: number, removed: false });
};

/**
 * Find materials by category
 * @param {ObjectId} categoryId
 * @param {Boolean} includeSubcategories
 * @returns {Promise<Array>}
 */
materialSchema.statics.findByCategory = async function(categoryId, includeSubcategories = false) {
  if (!includeSubcategories) {
    return this.find({ category: categoryId, removed: false }).sort({ createdAt: -1 });
  }
  
  // Get category and all subcategories
  const MaterialCategory = mongoose.model('MaterialCategory');
  const category = await MaterialCategory.findById(categoryId);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Find all materials in this category or subcategories
  const categoryPath = category.getFullPath();
  const subcategories = await MaterialCategory.find({
    path: new RegExp(`^${categoryPath}`)
  });
  
  const categoryIds = [categoryId, ...subcategories.map(c => c._id)];
  
  return this.find({
    category: { $in: categoryIds },
    removed: false
  }).sort({ createdAt: -1 });
};

/**
 * Find materials by type
 * @param {String} type
 * @returns {Promise<Array>}
 */
materialSchema.statics.findByType = function(type) {
  return this.find({ type, removed: false }).sort({ createdAt: -1 });
};

/**
 * Find materials by status
 * @param {String} status
 * @returns {Promise<Array>}
 */
materialSchema.statics.findByStatus = function(status) {
  return this.find({ status, removed: false }).sort({ createdAt: -1 });
};

/**
 * Search materials
 * @param {String} query
 * @returns {Promise<Array>}
 */
materialSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { materialNumber: searchRegex },
      { 'materialName.zh': searchRegex },
      { 'materialName.en': searchRegex },
      { abbreviation: searchRegex },
      { brand: searchRegex },
      { model: searchRegex }
    ],
    removed: false
  }).sort({ createdAt: -1 });
};

/**
 * Get material statistics
 * @returns {Promise<Object>}
 */
materialSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { removed: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        obsolete: {
          $sum: { $cond: [{ $eq: ['$status', 'obsolete'] }, 1, 0] }
        },
        discontinued: {
          $sum: { $cond: [{ $eq: ['$status', 'discontinued'] }, 1, 0] }
        },
        raw: {
          $sum: { $cond: [{ $eq: ['$type', 'raw'] }, 1, 0] }
        },
        semiFinished: {
          $sum: { $cond: [{ $eq: ['$type', 'semi-finished'] }, 1, 0] }
        },
        finished: {
          $sum: { $cond: [{ $eq: ['$type', 'finished'] }, 1, 0] }
        },
        packaging: {
          $sum: { $cond: [{ $eq: ['$type', 'packaging'] }, 1, 0] }
        },
        consumable: {
          $sum: { $cond: [{ $eq: ['$type', 'consumable'] }, 1, 0] }
        },
        avgStandardCost: { $avg: '$standardCost' },
        totalStandardCost: { $sum: '$standardCost' }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    draft: 0,
    obsolete: 0,
    discontinued: 0,
    raw: 0,
    semiFinished: 0,
    finished: 0,
    packaging: 0,
    consumable: 0,
    avgStandardCost: 0,
    totalStandardCost: 0
  };
};

module.exports = mongoose.model('Material', materialSchema);

