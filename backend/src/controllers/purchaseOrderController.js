const PurchaseOrderService = require('../services/PurchaseOrderService');

const purchaseOrderController = {
  /**
   * Create new purchase order
   */
  create: async (req, res, next) => {
    try {
      const po = await PurchaseOrderService.createPurchaseOrder(
        req.body,
        req.admin._id
      );
      
      res.status(201).json({
        success: true,
        result: po,
        message: 'Purchase order created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List purchase orders with filters
   */
  list: async (req, res, next) => {
    try {
      const { page, items, sortBy, sortOrder, ...filters } = req.query;
      
      const result = await PurchaseOrderService.listPurchaseOrders(filters, {
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
   * Get purchase order by ID
   */
  read: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      
      const options = {};
      if (populate) {
        options.populate = populate.split(',');
      }
      
      const po = await PurchaseOrderService.getPurchaseOrder(id, options);
      
      res.status(200).json({
        success: true,
        result: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update purchase order
   */
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const po = await PurchaseOrderService.updatePurchaseOrder(
        id,
        req.body,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete purchase order
   */
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const result = await PurchaseOrderService.deletePurchaseOrder(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit PO for approval
   */
  submitForApproval: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const po = await PurchaseOrderService.submitForApproval(
        id,
        req.admin._id
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order submitted for approval'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Approve purchase order
   */
  approve: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      
      const po = await PurchaseOrderService.approvePurchaseOrder(
        id,
        req.admin._id,
        comments
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order approved'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject purchase order
   */
  reject: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      const po = await PurchaseOrderService.rejectPurchaseOrder(
        id,
        req.admin._id,
        reason
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order rejected'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel purchase order
   */
  cancel: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required'
        });
      }
      
      const po = await PurchaseOrderService.cancelPurchaseOrder(
        id,
        req.admin._id,
        reason
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order cancelled'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send PO to supplier
   */
  sendToSupplier: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Supplier email is required'
        });
      }
      
      const po = await PurchaseOrderService.sendToSupplier(
        id,
        req.admin._id,
        email
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order sent to supplier'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Confirm PO from supplier
   */
  confirm: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { confirmationNumber } = req.body;
      
      const po = await PurchaseOrderService.confirmFromSupplier(
        id,
        confirmationNumber
      );
      
      res.status(200).json({
        success: true,
        result: po,
        message: 'Purchase order confirmed'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get PO by number
   */
  getByNumber: async (req, res, next) => {
    try {
      const { number } = req.params;
      
      const po = await PurchaseOrderService.getPurchaseOrderByNumber(number);
      
      res.status(200).json({
        success: true,
        result: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get POs by supplier
   */
  getBySupplier: async (req, res, next) => {
    try {
      const { supplierId } = req.params;
      const { limit, sort } = req.query;
      
      const pos = await PurchaseOrderService.getPurchaseOrdersBySupplier(
        supplierId,
        { limit: parseInt(limit) || 100, sort }
      );
      
      res.status(200).json({
        success: true,
        result: pos
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get POs by material
   */
  getByMaterial: async (req, res, next) => {
    try {
      const { materialId } = req.params;
      
      const pos = await PurchaseOrderService.getPurchaseOrdersByMaterial(materialId);
      
      res.status(200).json({
        success: true,
        result: pos
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get pending approvals
   */
  getPendingApprovals: async (req, res, next) => {
    try {
      const pos = await PurchaseOrderService.getPendingApprovals();
      
      res.status(200).json({
        success: true,
        result: pos
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
      const stats = await PurchaseOrderService.getStatistics();
      
      res.status(200).json({
        success: true,
        result: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = purchaseOrderController;




