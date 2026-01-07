const GoodsReceiptService = require('../services/GoodsReceiptService');

const goodsReceiptController = {
  /**
   * Create a new goods receipt
   * POST /api/goods-receipts
   */
  create: async (req, res) => {
    try {
      const receiptData = req.body;
      const userId = req.admin._id;
      
      const receipt = await GoodsReceiptService.createGoodsReceipt(receiptData, userId);
      
      res.status(201).json({
        success: true,
        result: receipt.format(),
        message: 'Goods receipt created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Get goods receipt by ID
   * GET /api/goods-receipts/:id
   */
  read: async (req, res) => {
    try {
      const { id } = req.params;
      const populate = req.query.populate ? req.query.populate.split(',') : [];
      
      const receipt = await GoodsReceiptService.getGoodsReceipt(id, { populate });
      
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'Successfully fetched goods receipt'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * List goods receipts with filters
   * GET /api/goods-receipts
   */
  list: async (req, res) => {
    try {
      const {
        page,
        items,
        sortBy,
        sortOrder,
        status,
        purchaseOrder,
        supplier,
        qualityStatus,
        receiptDateFrom,
        receiptDateTo,
        search
      } = req.query;
      
      const filters = {
        ...(status && { status }),
        ...(purchaseOrder && { purchaseOrder }),
        ...(supplier && { supplier }),
        ...(qualityStatus && { qualityStatus }),
        ...(receiptDateFrom && { receiptDateFrom }),
        ...(receiptDateTo && { receiptDateTo }),
        ...(search && { search })
      };
      
      const options = {
        page: parseInt(page) || 1,
        items: parseInt(items) || 10,
        sortBy: sortBy || 'receiptDate',
        sortOrder: sortOrder || 'desc'
      };
      
      const result = await GoodsReceiptService.listGoodsReceipts(filters, options);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Update goods receipt
   * PUT /api/goods-receipts/:id
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.admin._id;
      
      const receipt = await GoodsReceiptService.updateGoodsReceipt(id, updateData, userId);
      
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'Goods receipt updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Delete goods receipt (soft delete)
   * DELETE /api/goods-receipts/:id
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const result = await GoodsReceiptService.deleteGoodsReceipt(id, userId);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Complete goods receipt
   * POST /api/goods-receipts/:id/complete
   */
  complete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const receipt = await GoodsReceiptService.completeGoodsReceipt(id, userId);
      
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'Goods receipt completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Record quality inspection
   * POST /api/goods-receipts/:id/quality-inspection
   */
  qualityInspection: async (req, res) => {
    try {
      const { id } = req.params;
      const inspectionData = req.body;
      const userId = req.admin._id;
      
      const receipt = await GoodsReceiptService.recordQualityInspection(id, inspectionData, userId);
      
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'Quality inspection recorded successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Cancel goods receipt
   * POST /api/goods-receipts/:id/cancel
   */
  cancel: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.admin._id;
      
      const receipt = await GoodsReceiptService.cancelGoodsReceipt(id, reason, userId);
      
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'Goods receipt cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Get receipts for a purchase order
   * GET /api/goods-receipts/by-po/:poId
   */
  getByPO: async (req, res) => {
    try {
      const { poId } = req.params;
      
      const receipts = await GoodsReceiptService.getReceiptsByPO(poId);
      
      res.status(200).json({
        success: true,
        result: receipts.map(r => r.format()),
        count: receipts.length,
        message: 'Successfully fetched receipts for purchase order'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Get pending quality inspections
   * GET /api/goods-receipts/pending-inspections
   */
  pendingInspections: async (req, res) => {
    try {
      const receipts = await GoodsReceiptService.getPendingInspections();
      
      res.status(200).json({
        success: true,
        result: receipts,
        count: receipts.length,
        message: 'Successfully fetched pending inspections'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Get statistics
   * GET /api/goods-receipts/statistics
   */
  statistics: async (req, res) => {
    try {
      const { dateFrom, dateTo, supplier } = req.query;
      
      const filters = {
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(supplier && { supplier })
      };
      
      const result = await GoodsReceiptService.getStatistics(filters);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Export to Excel
   * GET /api/goods-receipts/export
   */
  export: async (req, res) => {
    try {
      const {
        status,
        purchaseOrder,
        supplier,
        receiptDateFrom,
        receiptDateTo,
        search
      } = req.query;
      
      const filters = {
        ...(status && { status }),
        ...(purchaseOrder && { purchaseOrder }),
        ...(supplier && { supplier }),
        ...(receiptDateFrom && { receiptDateFrom }),
        ...(receiptDateTo && { receiptDateTo }),
        ...(search && { search })
      };
      
      // Get all receipts (no pagination for export)
      const result = await GoodsReceiptService.listGoodsReceipts(filters, { 
        page: 1, 
        items: 10000 
      });
      
      // Import ExcelExportService
      const ExcelExportService = require('../services/ExcelExportService');
      
      // Generate Excel file
      const workbook = await ExcelExportService.exportGoodsReceipts(result.result);
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=goods-receipts-${Date.now()}.xlsx`
      );
      
      // Send file
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Generate PDF for receipt
   * GET /api/goods-receipts/:id/pdf
   */
  generatePDF: async (req, res) => {
    try {
      const { id } = req.params;
      
      const receipt = await GoodsReceiptService.getGoodsReceipt(id, {
        populate: ['purchaseOrder', 'supplier', 'items.material', 'createdBy']
      });
      
      // TODO: Implement PDF generation
      // For now, return receipt data
      res.status(200).json({
        success: true,
        result: receipt.format(),
        message: 'PDF generation not yet implemented'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  },

  /**
   * Search goods receipts
   * GET /api/goods-receipts/search
   */
  search: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Search query is required'
        });
      }
      
      const result = await GoodsReceiptService.listGoodsReceipts(
        { search: q },
        { page: 1, items: parseInt(limit) }
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        result: null,
        message: error.message
      });
    }
  }
};

module.exports = goodsReceiptController;


