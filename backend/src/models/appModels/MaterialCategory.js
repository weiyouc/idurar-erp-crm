const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const materialCategorySchema = new Schema({
  // Basic Information
  code: {
    type: String,
    required: [true, 'Category code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Category code too long']
  },
  name: {
    zh: {
      type: String,
      required: [true, 'Chinese category name is required'],
      trim: true,
      maxlength: [100, 'Chinese name too long']
    },
    en: {
      type: String,
      trim: true,
      maxlength: [100, 'English name too long']
    }
  },
  
  // Hierarchy
  parent: {
    type: Schema.ObjectId,
    ref: 'MaterialCategory',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
  },
  path: {
    type: String,
    default: '/'
  },
  
  // Details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description too long']
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
  updatedAt: Date
});

// Indexes
materialCategorySchema.index({ code: 1 });
materialCategorySchema.index({ parent: 1 });
materialCategorySchema.index({ level: 1 });
materialCategorySchema.index({ path: 1 });
materialCategorySchema.index({ isActive: 1 });
materialCategorySchema.index({ displayOrder: 1 });

// Compound indexes
materialCategorySchema.index({ parent: 1, displayOrder: 1 });
materialCategorySchema.index({ level: 1, displayOrder: 1 });

/**
 * Pre-save middleware to update path and level
 */
materialCategorySchema.pre('save', async function(next) {
  // Update timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Calculate level and path if parent changed or is new
  if (this.isModified('parent') || this.isNew) {
    if (this.parent) {
      try {
        const parentCat = await this.constructor.findById(this.parent);
        if (!parentCat) {
          return next(new Error('Parent category not found'));
        }
        this.level = parentCat.level + 1;
        this.path = `${parentCat.path}${parentCat.code}/`;
      } catch (error) {
        return next(error);
      }
    } else {
      this.level = 0;
      this.path = '/';
    }
  }
  
  next();
});

/**
 * Instance Methods
 */

/**
 * Get all child categories
 * @param {Boolean} recursive - Whether to get all descendants
 * @returns {Promise<Array>}
 */
materialCategorySchema.methods.getChildren = async function(recursive = false) {
  if (recursive) {
    // Get all descendants
    return this.constructor.find({
      path: new RegExp(`^${this.path}${this.code}/`)
    }).sort({ displayOrder: 1 });
  } else {
    // Get direct children only
    return this.constructor.find({ parent: this._id }).sort({ displayOrder: 1 });
  }
};

/**
 * Get parent chain
 * @returns {Promise<Array>}
 */
materialCategorySchema.methods.getAncestors = async function() {
  if (!this.parent) {
    return [];
  }
  
  const ancestors = [];
  let current = await this.constructor.findById(this.parent);
  
  while (current) {
    ancestors.unshift(current);
    if (current.parent) {
      current = await this.constructor.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return ancestors;
};

/**
 * Get full path as string
 * @returns {String}
 */
materialCategorySchema.methods.getFullPath = function() {
  return `${this.path}${this.code}`;
};

/**
 * Check if this category is an ancestor of another
 * @param {ObjectId|MaterialCategory} category
 * @returns {Boolean}
 */
materialCategorySchema.methods.isAncestorOf = function(category) {
  const targetPath = category.path || category;
  return targetPath.startsWith(`${this.path}${this.code}/`);
};

/**
 * Activate category
 * @returns {Promise<MaterialCategory>}
 */
materialCategorySchema.methods.activate = async function() {
  this.isActive = true;
  return await this.save();
};

/**
 * Deactivate category
 * @returns {Promise<MaterialCategory>}
 */
materialCategorySchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

/**
 * Format category data for API response
 * @returns {Object}
 */
materialCategorySchema.methods.format = function() {
  return {
    id: this._id,
    code: this.code,
    name: this.name,
    parent: this.parent,
    level: this.level,
    path: this.path,
    fullPath: this.getFullPath(),
    description: this.description,
    displayOrder: this.displayOrder,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Static Methods
 */

/**
 * Get root categories
 * @returns {Promise<Array>}
 */
materialCategorySchema.statics.getRootCategories = function() {
  return this.find({ parent: null, isActive: true }).sort({ displayOrder: 1 });
};

/**
 * Build category tree
 * @param {ObjectId} parentId - Root parent ID (null for full tree)
 * @returns {Promise<Array>}
 */
materialCategorySchema.statics.buildTree = async function(parentId = null) {
  const categories = await this.find({
    parent: parentId,
    isActive: true
  }).sort({ displayOrder: 1 });
  
  const tree = [];
  for (const category of categories) {
    const node = category.toObject();
    node.children = await this.buildTree(category._id);
    tree.push(node);
  }
  
  return tree;
};

/**
 * Find category by code
 * @param {String} code
 * @returns {Promise<MaterialCategory>}
 */
materialCategorySchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

/**
 * Get categories by level
 * @param {Number} level
 * @returns {Promise<Array>}
 */
materialCategorySchema.statics.getByLevel = function(level) {
  return this.find({ level, isActive: true }).sort({ displayOrder: 1 });
};

/**
 * Search categories
 * @param {String} query
 * @returns {Promise<Array>}
 */
materialCategorySchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { code: searchRegex },
      { 'name.zh': searchRegex },
      { 'name.en': searchRegex }
    ],
    isActive: true
  }).sort({ level: 1, displayOrder: 1 });
};

/**
 * Get category statistics
 * @returns {Promise<Object>}
 */
materialCategorySchema.statics.getStatistics = async function() {
  const Material = mongoose.model('Material');
  
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byLevel: {
          $push: {
            level: '$level',
            count: 1
          }
        }
      }
    }
  ]);
  
  // Count materials per category
  const materialCounts = await Material.aggregate([
    { $match: { removed: false } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const categoriesWithMaterials = materialCounts.filter(c => c._id !== null).length;
  
  return {
    totalCategories: stats[0]?.total || 0,
    categoriesWithMaterials,
    maxLevel: await this.findOne().sort({ level: -1 }).select('level').then(c => c?.level || 0)
  };
};

/**
 * Validate no circular reference
 * @param {ObjectId} categoryId
 * @param {ObjectId} parentId
 * @returns {Promise<Boolean>}
 */
materialCategorySchema.statics.validateNoCircularRef = async function(categoryId, parentId) {
  if (!parentId) return true;
  if (categoryId.toString() === parentId.toString()) return false;
  
  const parent = await this.findById(parentId);
  if (!parent) return false;
  
  // Check if category is in parent's path
  if (parent.path.includes(categoryId.toString())) {
    return false;
  }
  
  return true;
};

module.exports = mongoose.model('MaterialCategory', materialCategorySchema);

