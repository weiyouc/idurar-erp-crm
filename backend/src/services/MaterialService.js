/**
 * MaterialService
 * 
 * Service layer for material management operations.
 * Handles CRUD, UOM conversions, supplier management, and business logic.
 */

const Material = require('../models/appModels/Material');
const AuditLogService = require('./AuditLogService');
const mongoose = require('mongoose');

class MaterialService {
  
  /**
   * Create a new material
   * 
   * @param {Object} materialData - Material data
   * @param {ObjectId} userId - User creating the material
   * @returns {Promise<Material>}
   */
  static async createMaterial(materialData, userId) {
    try {
      // Generate material number if not provided
      let materialNumber = materialData.materialNumber;
      if (!materialNumber) {
        materialNumber = await Material.generateMaterialNumber();
      }
      
      // Create material
      const material = await Material.create({
        ...materialData,
        materialNumber,
        createdBy: userId,
        status: 'draft'
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'Material',
        entityId: material._id,
        metadata: {
          materialNumber: material.materialNumber,
          materialName: material.materialName
        }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to create material: ${error.message}`);
    }
  }
  
  /**
   * Get material by ID
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Object} options - Query options
   * @returns {Promise<Material>}
   */
  static async getMaterial(materialId, options = {}) {
    try {
      let query = Material.findOne({ _id: materialId, removed: false });
      
      // Populate references if requested
      if (options.populate) {
        if (options.populate.includes('category')) {
          query = query.populate('category', 'code name');
        }
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
        if (options.populate.includes('updatedBy')) {
          query = query.populate('updatedBy', 'name email');
        }
        if (options.populate.includes('suppliers')) {
          query = query.populate('preferredSuppliers.supplier', 'supplierNumber companyName');
        }
        if (options.populate.includes('images')) {
          query = query.populate('images');
        }
        if (options.populate.includes('documents')) {
          query = query.populate('documents');
        }
      }
      
      const material = await query;
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      return material;
    } catch (error) {
      throw new Error(`Failed to get material: ${error.message}`);
    }
  }
  
  /**
   * List materials with pagination and filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async listMaterials(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        items = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;
      
      // Build query
      const query = { removed: false };
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.search) {
        // Text search on multiple fields
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
          { materialNumber: searchRegex },
          { 'materialName.zh': searchRegex },
          { 'materialName.en': searchRegex },
          { abbreviation: searchRegex },
          { brand: searchRegex },
          { model: searchRegex }
        ];
      }
      
      // Count total
      const total = await Material.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * items;
      const pages = Math.ceil(total / items);
      
      // Build sort - validate sort field exists
      const validSortFields = ['createdAt', 'updatedAt', 'materialNumber', 'materialName', 'status', 'type'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sort = {};
      sort[safeSortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query
      const materials = await Material.find(query)
        .sort(sort)
        .skip(skip)
        .limit(items)
        .populate('category', 'code name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      return {
        success: true,
        result: materials,
        pagination: {
          page: parseInt(page),
          pages,
          count: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to list materials: ${error.message}`);
    }
  }
  
  /**
   * Update material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Object} updateData - Data to update
   * @param {ObjectId} userId - User performing the update
   * @returns {Promise<Material>}
   */
  static async updateMaterial(materialId, updateData, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      // Store old data for audit
      const oldData = material.toObject();
      
      // Don't allow updating materialNumber
      delete updateData.materialNumber;
      
      // Update material
      Object.assign(material, updateData);
      material.updatedBy = userId;
      await material.save();
      
      // Log update
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'Material',
        entityId: materialId,
        oldData,
        newData: material.toObject(),
        changes: this._getChanges(oldData, material.toObject())
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to update material: ${error.message}`);
    }
  }
  
  /**
   * Delete material (soft delete)
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {ObjectId} userId - User performing the deletion
   * @returns {Promise<void>}
   */
  static async deleteMaterial(materialId, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      // Soft delete
      await material.softDelete(userId);
      
      // Log deletion
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'Material',
        entityId: materialId,
        oldData: material.toObject()
      });
    } catch (error) {
      throw new Error(`Failed to delete material: ${error.message}`);
    }
  }
  
  /**
   * Restore deleted material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {ObjectId} userId - User performing the restoration
   * @returns {Promise<Material>}
   */
  static async restoreMaterial(materialId, userId) {
    try {
      const material = await Material.findById(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      await material.restore();
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'restore',
        entityType: 'Material',
        entityId: materialId,
        metadata: { message: `Material ${material.materialNumber} restored` }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to restore material: ${error.message}`);
    }
  }
  
  /**
   * Activate material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {ObjectId} userId - User performing the activation
   * @returns {Promise<Material>}
   */
  static async activateMaterial(materialId, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      await material.activate();
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'activate',
        entityType: 'Material',
        entityId: materialId,
        metadata: { message: `Material ${material.materialNumber} activated` }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to activate material: ${error.message}`);
    }
  }
  
  /**
   * Deactivate material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {ObjectId} userId - User performing the deactivation
   * @returns {Promise<Material>}
   */
  static async deactivateMaterial(materialId, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      await material.deactivate();
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'deactivate',
        entityType: 'Material',
        entityId: materialId,
        metadata: { message: `Material ${material.materialNumber} deactivated` }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to deactivate material: ${error.message}`);
    }
  }
  
  /**
   * Add preferred supplier to material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Object} supplierData - Supplier data
   * @param {ObjectId} userId - User performing the action
   * @returns {Promise<Material>}
   */
  static async addPreferredSupplier(materialId, supplierData, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      await material.addPreferredSupplier(supplierData);
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'add_supplier',
        entityType: 'Material',
        entityId: materialId,
        metadata: { 
          supplier: supplierData.supplier,
          isPrimary: supplierData.isPrimary
        }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to add preferred supplier: ${error.message}`);
    }
  }
  
  /**
   * Remove preferred supplier from material
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User performing the action
   * @returns {Promise<Material>}
   */
  static async removePreferredSupplier(materialId, supplierId, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      await material.removePreferredSupplier(supplierId);
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'remove_supplier',
        entityType: 'Material',
        entityId: materialId,
        metadata: { supplier: supplierId }
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to remove preferred supplier: ${error.message}`);
    }
  }
  
  /**
   * Convert quantity between UOMs
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Number} quantity - Quantity to convert
   * @param {String} fromUOM - Source UOM
   * @param {String} toUOM - Target UOM
   * @returns {Promise<Number>}
   */
  static async convertQuantity(materialId, quantity, fromUOM, toUOM) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      // Convert to base UOM first
      const baseQuantity = material.convertToBaseUOM(quantity, fromUOM);
      
      // Then convert to target UOM
      const targetQuantity = material.convertFromBaseUOM(baseQuantity, toUOM);
      
      return targetQuantity;
    } catch (error) {
      throw new Error(`Failed to convert quantity: ${error.message}`);
    }
  }
  
  /**
   * Search materials
   * 
   * @param {String} query - Search query
   * @returns {Promise<Array>}
   */
  static async searchMaterials(query) {
    try {
      return await Material.search(query);
    } catch (error) {
      throw new Error(`Failed to search materials: ${error.message}`);
    }
  }
  
  /**
   * Get material by number
   * 
   * @param {String} materialNumber - Material number
   * @returns {Promise<Material>}
   */
  static async getMaterialByNumber(materialNumber) {
    try {
      const material = await Material.findByNumber(materialNumber);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      return material;
    } catch (error) {
      throw new Error(`Failed to get material by number: ${error.message}`);
    }
  }
  
  /**
   * Get materials by category
   * 
   * @param {ObjectId} categoryId - Category ID
   * @param {Boolean} includeSubcategories - Include subcategory materials
   * @returns {Promise<Array>}
   */
  static async getMaterialsByCategory(categoryId, includeSubcategories = false) {
    try {
      return await Material.findByCategory(categoryId, includeSubcategories);
    } catch (error) {
      throw new Error(`Failed to get materials by category: ${error.message}`);
    }
  }
  
  /**
   * Get material statistics
   * 
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      return await Material.getStatistics();
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Update material pricing
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Object} pricingData - Pricing data
   * @param {ObjectId} userId - User performing the update
   * @returns {Promise<Material>}
   */
  static async updatePricing(materialId, pricingData, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      // Update pricing fields
      if (pricingData.standardCost !== undefined) {
        material.standardCost = pricingData.standardCost;
      }
      if (pricingData.currency !== undefined) {
        material.currency = pricingData.currency;
      }
      if (pricingData.lastPurchasePrice !== undefined) {
        material.lastPurchasePrice = pricingData.lastPurchasePrice;
        material.lastPurchaseDate = new Date();
      }
      
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'update_pricing',
        entityType: 'Material',
        entityId: materialId,
        metadata: pricingData
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to update pricing: ${error.message}`);
    }
  }
  
  /**
   * Update material inventory parameters
   * 
   * @param {ObjectId} materialId - Material ID
   * @param {Object} inventoryData - Inventory data
   * @param {ObjectId} userId - User performing the update
   * @returns {Promise<Material>}
   */
  static async updateInventoryParams(materialId, inventoryData, userId) {
    try {
      const material = await this.getMaterial(materialId);
      
      if (!material) {
        throw new Error('Material not found');
      }
      
      // Update inventory fields
      if (inventoryData.safetyStock !== undefined) {
        material.safetyStock = inventoryData.safetyStock;
      }
      if (inventoryData.reorderPoint !== undefined) {
        material.reorderPoint = inventoryData.reorderPoint;
      }
      if (inventoryData.maxStockLevel !== undefined) {
        material.maxStockLevel = inventoryData.maxStockLevel;
      }
      
      material.updatedBy = userId;
      await material.save();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'update_inventory_params',
        entityType: 'Material',
        entityId: materialId,
        metadata: inventoryData
      });
      
      return material;
    } catch (error) {
      throw new Error(`Failed to update inventory parameters: ${error.message}`);
    }
  }
  
  /**
   * Get materials by supplier
   * @param {ObjectId} supplierId - Supplier ID
   * @returns {Promise<Array>}
   */
  static async getMaterialsBySupplier(supplierId) {
    try {
      return await Material.find({
        'preferredSuppliers.supplier': supplierId,
        removed: false
      }).populate('category', 'code name');
    } catch (error) {
      throw new Error(`Failed to get materials by supplier: ${error.message}`);
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

module.exports = MaterialService;

