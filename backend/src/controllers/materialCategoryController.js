const MaterialCategoryService = require('../services/MaterialCategoryService');

const materialCategoryController = {
  /**
   * Create new category
   */
  create: async (req, res, next) => {
    try {
      const category = await MaterialCategoryService.createCategory(
        req.body,
        req.admin._id
      );
      
      res.status(201).json({
        success: true,
        result: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all categories with filters
   */
  list: async (req, res, next) => {
    try {
      const { page, items, sortBy, sortOrder, ...filters } = req.query;
      
      const result = await MaterialCategoryService.listCategories(filters, {
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
   * Get category by ID
   */
  read: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      
      const options = {};
      if (populate) {
        options.populate = populate.split(',');
      }
      
      const category = await MaterialCategoryService.getCategory(id, options);
      
      res.status(200).json({
        success: true,
        result: category
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update category
   */
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const category = await MaterialCategoryService.updateCategory(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete (deactivate) category
   */
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const result = await MaterialCategoryService.deleteCategory(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result,
        message: 'Category deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get category tree
   */
  getTree: async (req, res, next) => {
    try {
      const { activeOnly } = req.query;
      
      const tree = await MaterialCategoryService.getCategoryTree(
        null,
        activeOnly === 'true'
      );
      
      res.status(200).json({
        success: true,
        result: tree
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get root categories
   */
  getRoots: async (req, res, next) => {
    try {
      const roots = await MaterialCategoryService.listCategories({
        level: 0
      });
      
      res.status(200).json({
        success: true,
        result: roots.result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get children of a category
   */
  getChildren: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const children = await MaterialCategoryService.getChildren(id);
      
      res.status(200).json({
        success: true,
        result: children
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get ancestors of a category
   */
  getAncestors: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const ancestors = await MaterialCategoryService.getAncestors(id);
      
      res.status(200).json({
        success: true,
        result: ancestors
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Activate category
   */
  activate: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const category = await MaterialCategoryService.activateCategory(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: category,
        message: 'Category activated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deactivate category
   */
  deactivate: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const category = await MaterialCategoryService.deactivateCategory(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: category,
        message: 'Category deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search categories
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
      
      const results = await MaterialCategoryService.searchCategories(q);
      
      res.status(200).json({
        success: true,
        result: results
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get category by code
   */
  getByCode: async (req, res, next) => {
    try {
      const { code } = req.params;
      
      const category = await MaterialCategoryService.getCategoryByCode(code);
      
      res.status(200).json({
        success: true,
        result: category
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get statistics
   */
  getStatistics: async (req, res, next) => {
    try {
      const stats = await MaterialCategoryService.getStatistics();
      
      res.status(200).json({
        success: true,
        result: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = materialCategoryController;

