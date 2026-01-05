/**
 * MaterialCategoryService
 * 
 * Service layer for material category management operations.
 * Handles CRUD, hierarchy management, and tree building.
 */

const MaterialCategory = require('../models/appModels/MaterialCategory');
const AuditLogService = require('./AuditLogService');

class MaterialCategoryService {
  
  /**
   * Create a new material category
   * 
   * @param {Object} categoryData - Category data
   * @param {ObjectId} userId - User creating the category
   * @returns {Promise<MaterialCategory>}
   */
  static async createCategory(categoryData, userId) {
    try {
      // Validate parent exists if specified
      if (categoryData.parent) {
        const parentExists = await MaterialCategory.findById(categoryData.parent);
        if (!parentExists) {
          throw new Error('Parent category not found');
        }
        
        const isValid = await MaterialCategory.validateNoCircularRef(
          null, // New category, no ID yet
          categoryData.parent
        );
        
        if (!isValid) {
          throw new Error('Invalid parent category');
        }
      }
      
      // Create category
      const category = await MaterialCategory.create({
        ...categoryData,
        createdBy: userId
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'MaterialCategory',
        entityId: category._id,
        metadata: {
          code: category.code,
          name: category.name
        }
      });
      
      return category;
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }
  
  /**
   * Get category by ID
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<MaterialCategory>}
   */
  static async getCategory(categoryId, options = {}) {
    try {
      let query = MaterialCategory.findById(categoryId);
      
      // Populate references if requested
      if (options.populate) {
        if (options.populate.includes('parent')) {
          query = query.populate('parent', 'code name');
        }
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
        if (options.populate.includes('updatedBy')) {
          query = query.populate('updatedBy', 'name email');
        }
      }
      
      const category = await query;
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      throw new Error(`Failed to get category: ${error.message}`);
    }
  }
  
  /**
   * List categories with filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async listCategories(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        items = 50,
        sortBy = 'displayOrder',
        sortOrder = 'asc'
      } = options;
      
      // Build query
      const query = {};
      
      // Apply filters
      if (filters.parent !== undefined) {
        query.parent = filters.parent;
      }
      
      if (filters.level !== undefined) {
        query.level = filters.level;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
          { code: searchRegex },
          { 'name.zh': searchRegex },
          { 'name.en': searchRegex }
        ];
      }
      
      // Count total
      const total = await MaterialCategory.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * items;
      const pages = Math.ceil(total / items);
      
      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query
      const categories = await MaterialCategory.find(query)
        .sort(sort)
        .skip(skip)
        .limit(items)
        .populate('parent', 'code name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      return {
        success: true,
        result: categories,
        pagination: {
          page: parseInt(page),
          pages,
          count: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to list categories: ${error.message}`);
    }
  }
  
  /**
   * Get category tree structure
   * 
   * @param {ObjectId} parentId - Root parent ID (null for full tree)
   * @param {Boolean} activeOnly - Only include active categories
   * @returns {Promise<Array>}
   */
  static async getCategoryTree(parentId = null, activeOnly = true) {
    try {
      const filter = { parent: parentId };
      if (activeOnly) {
        filter.isActive = true;
      }
      
      const categories = await MaterialCategory.find(filter)
        .sort({ displayOrder: 1 })
        .populate('parent', 'code name');
      
      const tree = [];
      for (const category of categories) {
        const node = category.toObject();
        node.children = await this.getCategoryTree(category._id, activeOnly);
        tree.push(node);
      }
      
      return tree;
    } catch (error) {
      throw new Error(`Failed to get category tree: ${error.message}`);
    }
  }
  
  /**
   * Get root categories
   * 
   * @returns {Promise<Array>}
   */
  static async getRootCategories() {
    try {
      return await MaterialCategory.getRootCategories();
    } catch (error) {
      throw new Error(`Failed to get root categories: ${error.message}`);
    }
  }
  
  /**
   * Update category
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @param {ObjectId} userId - User performing the update
   * @returns {Promise<MaterialCategory>}
   */
  static async updateCategory(categoryId, updateData, userId) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      // Validate no circular reference if parent is being changed
      if (updateData.parent !== undefined && updateData.parent !== category.parent) {
        const isValid = await MaterialCategory.validateNoCircularRef(
          categoryId,
          updateData.parent
        );
        
        if (!isValid) {
          throw new Error('Cannot set parent: would create circular reference');
        }
      }
      
      // Store old data for audit
      const oldData = category.toObject();
      
      // Update category
      Object.assign(category, updateData);
      category.updatedBy = userId;
      await category.save();
      
      // Log update
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'MaterialCategory',
        entityId: categoryId,
        oldData,
        newData: category.toObject(),
        changes: this._getChanges(oldData, category.toObject())
      });
      
      return category;
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }
  
  /**
   * Delete category (soft delete)
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {ObjectId} userId - User performing the deletion
   * @returns {Promise<void>}
   */
  static async deleteCategory(categoryId, userId) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      // Check if category has children
      const children = await category.getChildren(false);
      if (children.length > 0) {
        throw new Error('Cannot delete category with children. Delete or reassign children first.');
      }
      
      // Check if category has materials (requires Material model)
      try {
        const Material = require('../models/appModels/Material');
        const materialCount = await Material.countDocuments({ 
          category: categoryId, 
          removed: false 
        });
        
        if (materialCount > 0) {
          throw new Error(`Cannot delete category. ${materialCount} material(s) are assigned to this category.`);
        }
      } catch (error) {
        if (!error.message.includes('Cannot delete category')) {
          // Material model not registered, skip this check
        } else {
          throw error;
        }
      }
      
      // Soft delete by deactivating
      category.isActive = false;
      category.updatedBy = userId;
      await category.save();
      
      // Log deletion
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'MaterialCategory',
        entityId: categoryId,
        oldData: category.toObject()
      });
    } catch (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
  
  /**
   * Activate category
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {ObjectId} userId - User performing the activation
   * @returns {Promise<MaterialCategory>}
   */
  static async activateCategory(categoryId, userId) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      await category.activate();
      category.updatedBy = userId;
      await category.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'activate',
        entityType: 'MaterialCategory',
        entityId: categoryId,
        metadata: { message: `Category ${category.code} activated` }
      });
      
      return category;
    } catch (error) {
      throw new Error(`Failed to activate category: ${error.message}`);
    }
  }
  
  /**
   * Deactivate category
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {ObjectId} userId - User performing the deactivation
   * @returns {Promise<MaterialCategory>}
   */
  static async deactivateCategory(categoryId, userId) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      await category.deactivate();
      category.updatedBy = userId;
      await category.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'deactivate',
        entityType: 'MaterialCategory',
        entityId: categoryId,
        metadata: { message: `Category ${category.code} deactivated` }
      });
      
      return category;
    } catch (error) {
      throw new Error(`Failed to deactivate category: ${error.message}`);
    }
  }
  
  /**
   * Search categories
   * 
   * @param {String} query - Search query
   * @returns {Promise<Array>}
   */
  static async searchCategories(query) {
    try {
      return await MaterialCategory.search(query);
    } catch (error) {
      throw new Error(`Failed to search categories: ${error.message}`);
    }
  }
  
  /**
   * Get category by code
   * 
   * @param {String} code - Category code
   * @returns {Promise<MaterialCategory>}
   */
  static async getCategoryByCode(code) {
    try {
      const category = await MaterialCategory.findByCode(code);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      throw new Error(`Failed to get category by code: ${error.message}`);
    }
  }
  
  /**
   * Get category statistics
   * 
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      return await MaterialCategory.getStatistics();
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Get children of a category
   * 
   * @param {ObjectId} categoryId - Parent category ID
   * @param {Boolean} recursive - Get all descendants
   * @returns {Promise<Array>}
   */
  static async getChildren(categoryId, recursive = false) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return await category.getChildren(recursive);
    } catch (error) {
      throw new Error(`Failed to get children: ${error.message}`);
    }
  }
  
  /**
   * Get ancestors of a category
   * 
   * @param {ObjectId} categoryId - Category ID
   * @returns {Promise<Array>}
   */
  static async getAncestors(categoryId) {
    try {
      const category = await this.getCategory(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return await category.getAncestors();
    } catch (error) {
      throw new Error(`Failed to get ancestors: ${error.message}`);
    }
  }
  
  /**
   * Helper: Get changes between old and new data
   * @private
   */
  static _getChanges(oldDoc, newDoc) {
    const changes = {};
    for (const key in newDoc) {
      if (JSON.stringify(oldDoc[key]) !== JSON.stringify(newDoc[key])) {
        changes[key] = { old: oldDoc[key], new: newDoc[key] };
      }
    }
    return changes;
  }
}

module.exports = MaterialCategoryService;

