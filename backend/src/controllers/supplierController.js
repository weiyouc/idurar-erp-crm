/**
 * Supplier Controller
 * 
 * Handles HTTP requests for supplier management operations.
 */

const SupplierService = require('../services/SupplierService');

/**
 * Create a new supplier
 * 
 * POST /api/suppliers
 */
exports.create = async (req, res) => {
  try {
    const supplier = await SupplierService.createSupplier(req.body, req.admin._id);
    
    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get supplier by ID
 * 
 * GET /api/suppliers/:id
 */
exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const { populate } = req.query;
    
    const options = {};
    if (populate) {
      options.populate = populate.split(',');
    }
    
    const supplier = await SupplierService.getSupplier(id, options);
    
    return res.status(200).json({
      success: true,
      result: supplier.format()
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    const status = error.message === 'Supplier not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * List suppliers with pagination and filters
 * 
 * GET /api/suppliers
 */
exports.list = async (req, res) => {
  try {
    const {
      page,
      items,
      sortBy,
      sortOrder,
      status,
      type,
      category,
      creditRating,
      search
    } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (creditRating) filters.creditRating = creditRating;
    if (search) filters.search = search;
    
    const options = {
      page: parseInt(page) || 1,
      items: parseInt(items) || 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await SupplierService.listSuppliers(filters, options);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('List suppliers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update supplier
 * 
 * PATCH /api/suppliers/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.updateSupplier(id, req.body, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    const status = error.message === 'Supplier not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete supplier (soft delete)
 * 
 * DELETE /api/suppliers/:id
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.deleteSupplier(id, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    const status = error.message === 'Supplier not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Submit supplier for approval
 * 
 * POST /api/suppliers/:id/submit
 */
exports.submit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.submitForApproval(id, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier submitted for approval',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Submit supplier error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Approve supplier
 * 
 * POST /api/suppliers/:id/approve
 */
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const supplier = await SupplierService.approveSupplier(id, req.admin._id, { comments });
    
    return res.status(200).json({
      success: true,
      message: 'Supplier approved successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Approve supplier error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reject supplier
 * 
 * POST /api/suppliers/:id/reject
 */
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const supplier = await SupplierService.rejectSupplier(id, req.admin._id, reason);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier rejected',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Reject supplier error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Activate supplier
 * 
 * POST /api/suppliers/:id/activate
 */
exports.activate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.activateSupplier(id, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier activated successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Activate supplier error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Deactivate supplier
 * 
 * POST /api/suppliers/:id/deactivate
 */
exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.deactivateSupplier(id, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier deactivated successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Deactivate supplier error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add supplier to blacklist
 * 
 * POST /api/suppliers/:id/blacklist
 */
exports.blacklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Blacklist reason is required'
      });
    }
    
    const supplier = await SupplierService.blacklistSupplier(id, req.admin._id, reason);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier blacklisted successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Blacklist supplier error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update supplier performance
 * 
 * PATCH /api/suppliers/:id/performance
 */
exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await SupplierService.updatePerformance(id, req.body, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Supplier performance updated successfully',
      result: supplier.format()
    });
  } catch (error) {
    console.error('Update performance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Search suppliers
 * 
 * GET /api/suppliers/search
 */
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const suppliers = await SupplierService.searchSuppliers(q);
    
    return res.status(200).json({
      success: true,
      result: suppliers.map(s => s.format()),
      count: suppliers.length
    });
  } catch (error) {
    console.error('Search suppliers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get supplier statistics
 * 
 * GET /api/suppliers/stats
 */
exports.statistics = async (req, res) => {
  try {
    const stats = await SupplierService.getStatistics();
    
    return res.status(200).json({
      success: true,
      result: stats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Find supplier by number
 * 
 * GET /api/suppliers/number/:supplierNumber
 */
exports.findByNumber = async (req, res) => {
  try {
    const { supplierNumber } = req.params;
    
    const supplier = await SupplierService.findByNumber(supplierNumber);
    
    return res.status(200).json({
      success: true,
      result: supplier.format()
    });
  } catch (error) {
    console.error('Find by number error:', error);
    const status = error.message === 'Supplier not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export suppliers to Excel
 * 
 * GET /api/suppliers/export
 */
exports.export = async (req, res) => {
  try {
    // This will be implemented when integrating with ExcelExportService
    // For now, return not implemented
    return res.status(501).json({
      success: false,
      message: 'Excel export not yet implemented'
    });
  } catch (error) {
    console.error('Export suppliers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

