const MaterialQuotationService = require('../services/MaterialQuotationService');

const materialQuotationController = {
  /**
   * Create new quotation
   * POST /api/material-quotations
   */
  create: async (req, res) => {
    try {
      const quotationData = req.body;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.createQuotation(quotationData, userId);
      
      res.status(201).json({
        success: true,
        result: quotation.format(),
        message: 'Quotation created successfully'
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
   * Get quotation by ID
   * GET /api/material-quotations/:id
   */
  read: async (req, res) => {
    try {
      const { id } = req.params;
      const populate = req.query.populate ? req.query.populate.split(',') : [];
      
      const quotation = await MaterialQuotationService.getQuotation(id, { populate });
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Successfully fetched quotation'
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
   * List quotations with filters
   * GET /api/material-quotations
   */
  list: async (req, res) => {
    try {
      const {
        page,
        items,
        sortBy,
        sortOrder,
        status,
        supplier,
        approvalStatus,
        requestDateFrom,
        requestDateTo,
        search
      } = req.query;
      
      const filters = {
        ...(status && { status }),
        ...(supplier && { supplier }),
        ...(approvalStatus && { approvalStatus }),
        ...(requestDateFrom && { requestDateFrom }),
        ...(requestDateTo && { requestDateTo }),
        ...(search && { search })
      };
      
      const options = {
        page: parseInt(page) || 1,
        items: parseInt(items) || 10,
        sortBy: sortBy || 'requestDate',
        sortOrder: sortOrder || 'desc'
      };
      
      const result = await MaterialQuotationService.listQuotations(filters, options);
      
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
   * Update quotation
   * PUT /api/material-quotations/:id
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.updateQuotation(id, updateData, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quotation updated successfully'
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
   * Delete quotation (soft delete)
   * DELETE /api/material-quotations/:id
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const result = await MaterialQuotationService.deleteQuotation(id, userId);
      
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
   * Send quotation to suppliers
   * POST /api/material-quotations/:id/send
   */
  send: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.sendQuotation(id, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quotation sent successfully'
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
   * Add supplier quote to item
   * POST /api/material-quotations/:id/items/:itemId/quotes
   */
  addQuote: async (req, res) => {
    try {
      const { id, itemId } = req.params;
      const quoteData = req.body;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.addQuote(id, itemId, quoteData, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quote added successfully'
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
   * Select quote for item
   * POST /api/material-quotations/:id/items/:itemId/quotes/:quoteId/select
   */
  selectQuote: async (req, res) => {
    try {
      const { id, itemId, quoteId } = req.params;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.selectQuote(id, itemId, quoteId, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quote selected successfully'
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
   * Complete quotation
   * POST /api/material-quotations/:id/complete
   */
  complete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.completeQuotation(id, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quotation completed successfully'
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
   * Cancel quotation
   * POST /api/material-quotations/:id/cancel
   */
  cancel: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.admin._id;
      
      const quotation = await MaterialQuotationService.cancelQuotation(id, reason, userId);
      
      res.status(200).json({
        success: true,
        result: quotation.format(),
        message: 'Quotation cancelled successfully'
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
   * Convert to purchase orders
   * POST /api/material-quotations/:id/convert-to-po
   */
  convertToPO: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin._id;
      
      const result = await MaterialQuotationService.convertToPurchaseOrders(id, userId);
      
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
   * Get statistics
   * GET /api/material-quotations/statistics
   */
  statistics: async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const filters = {
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      };
      
      const result = await MaterialQuotationService.getStatistics(filters);
      
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

module.exports = materialQuotationController;


