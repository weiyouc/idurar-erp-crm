const MaterialService = require('../services/MaterialService');

const materialController = {
  /**
   * Create new material
   */
  create: async (req, res, next) => {
    try {
      const material = await MaterialService.createMaterial(
        req.body,
        req.admin._id
      );
      
      res.status(201).json({
        success: true,
        result: material,
        message: 'Material created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List materials with filters and pagination
   */
  list: async (req, res, next) => {
    try {
      const { page, items, sortBy, sortOrder, search, ...filters } = req.query;
      
      // Add search to filters if present
      if (search) {
        filters.search = search;
      }
      
      const result = await MaterialService.listMaterials(filters, {
        page: parseInt(page) || 1,
        items: parseInt(items) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      });
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get material by ID
   */
  read: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      
      const options = {};
      if (populate) {
        options.populate = populate.split(',');
      }
      
      const material = await MaterialService.getMaterial(id, options);
      
      res.status(200).json({
        success: true,
        result: material
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update material
   */
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.updateMaterial(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Material updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Soft delete material
   */
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const result = await MaterialService.deleteMaterial(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Restore soft-deleted material
   */
  restore: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.restoreMaterial(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Material restored successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Activate material
   */
  activate: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.activateMaterial(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Material activated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deactivate material
   */
  deactivate: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.deactivateMaterial(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Material deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add preferred supplier to material
   */
  addSupplier: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.addPreferredSupplier(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Supplier added successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove preferred supplier from material
   */
  removeSupplier: async (req, res, next) => {
    try {
      const { id, supplierId } = req.params;
      
      const material = await MaterialService.removePreferredSupplier(
        id,
        supplierId,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Supplier removed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update material pricing
   */
  updatePricing: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.updatePricing(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Pricing updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update inventory parameters
   */
  updateInventory: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const material = await MaterialService.updateInventoryParams(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: material,
        message: 'Inventory parameters updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Convert quantity between UOMs
   */
  convertQuantity: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity, fromUOM, toUOM } = req.body;
      
      if (!quantity || !fromUOM || !toUOM) {
        return res.status(400).json({
          success: false,
          message: 'quantity, fromUOM, and toUOM are required'
        });
      }
      
      const result = await MaterialService.convertQuantity(
        id,
        parseFloat(quantity),
        fromUOM,
        toUOM
      );
      
      res.status(200).json({
        success: true,
        result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search materials
   */
  search: async (req, res, next) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const results = await MaterialService.searchMaterials(q);
      
      res.status(200).json({
        success: true,
        result: results
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get material by number
   */
  getByNumber: async (req, res, next) => {
    try {
      const { number } = req.params;
      
      const material = await MaterialService.getMaterialByNumber(number);
      
      res.status(200).json({
        success: true,
        result: material
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get materials by category
   */
  getByCategory: async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { includeSubcategories } = req.query;
      
      const materials = await MaterialService.getMaterialsByCategory(
        categoryId,
        includeSubcategories === 'true'
      );
      
      res.status(200).json({
        success: true,
        result: materials
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get materials by supplier
   */
  getBySupplier: async (req, res, next) => {
    try {
      const { supplierId } = req.params;
      
      const materials = await MaterialService.getMaterialsBySupplier(supplierId);
      
      res.status(200).json({
        success: true,
        result: materials
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get material statistics
   */
  getStatistics: async (req, res, next) => {
    try {
      const stats = await MaterialService.getStatistics();
      
      res.status(200).json({
        success: true,
        result: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = materialController;

