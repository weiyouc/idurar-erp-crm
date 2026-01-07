const MaterialQuotation = require('../models/appModels/MaterialQuotation');
const Supplier = require('../models/appModels/Supplier');
const Material = require('../models/appModels/Material');
const PurchaseOrder = require('../models/appModels/PurchaseOrder');
const AuditLogService = require('./AuditLogService');

class MaterialQuotationService {
  /**
   * Create a new material quotation
   */
  static async createQuotation(quotationData, userId) {
    try {
      // Generate quotation number if not provided
      const quotationNumber = quotationData.quotationNumber || 
        await MaterialQuotation.generateQuotationNumber();
      
      // Create quotation
      const quotation = await MaterialQuotation.create({
        ...quotationData,
        quotationNumber,
        createdBy: userId
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            quotationNumber: quotation.quotationNumber,
            itemCount: quotation.items.length,
            supplierCount: quotation.targetSuppliers.length
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to create quotation: ${error.message}`);
    }
  }
  
  /**
   * Get quotation by ID
   */
  static async getQuotation(quotationId, options = {}) {
    try {
      let query = MaterialQuotation.findOne({ _id: quotationId, removed: false });
      
      // Apply population if requested
      if (options.populate) {
        if (options.populate.includes('targetSuppliers')) {
          query = query.populate('targetSuppliers', 'companyName supplierNumber');
        }
        if (options.populate.includes('items.material')) {
          query = query.populate('items.material', 'materialNumber materialName baseUOM');
        }
        if (options.populate.includes('items.quotes.supplier')) {
          query = query.populate('items.quotes.supplier', 'companyName supplierNumber');
        }
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
      }
      
      const quotation = await query;
      
      if (!quotation) {
        throw new Error('Quotation not found');
      }
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to get quotation: ${error.message}`);
    }
  }
  
  /**
   * List quotations with pagination and filters
   */
  static async listQuotations(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        items = 10,
        sortBy = 'requestDate',
        sortOrder = 'desc'
      } = options;
      
      // Build query
      const query = { removed: false };
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.supplier) {
        query.targetSuppliers = filters.supplier;
      }
      
      if (filters.approvalStatus) {
        query['workflow.approvalStatus'] = filters.approvalStatus;
      }
      
      // Date range filters
      if (filters.requestDateFrom || filters.requestDateTo) {
        query.requestDate = {};
        if (filters.requestDateFrom) {
          query.requestDate.$gte = new Date(filters.requestDateFrom);
        }
        if (filters.requestDateTo) {
          query.requestDate.$lte = new Date(filters.requestDateTo);
        }
      }
      
      // Search by quotation number
      if (filters.search) {
        query.quotationNumber = new RegExp(filters.search, 'i');
      }
      
      // Pagination
      const skip = (page - 1) * items;
      const limit = items;
      
      // Execute query
      const [quotations, totalItems] = await Promise.all([
        MaterialQuotation.find(query)
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .populate('targetSuppliers', 'companyName supplierNumber')
          .populate('createdBy', 'name email'),
        MaterialQuotation.countDocuments(query)
      ]);
      
      return {
        success: true,
        result: quotations,
        pagination: {
          page,
          items,
          count: totalItems,
          pages: Math.ceil(totalItems / items)
        }
      };
    } catch (error) {
      throw new Error(`Failed to list quotations: ${error.message}`);
    }
  }
  
  /**
   * Update quotation
   */
  static async updateQuotation(quotationId, updateData, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      // Only draft quotations can be updated
      if (quotation.status !== 'draft') {
        throw new Error(`Cannot edit quotation with status: ${quotation.status}`);
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'quotationNumber' && key !== 'createdBy') {
          quotation[key] = updateData[key];
        }
      });
      
      quotation.updatedBy = userId;
      await quotation.save();
      
      // Log update
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            quotationNumber: quotation.quotationNumber,
            updatedFields: Object.keys(updateData)
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to update quotation: ${error.message}`);
    }
  }
  
  /**
   * Send quotation to suppliers
   */
  static async sendQuotation(quotationId, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.send(userId);
      
      // Log send
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'sent',
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            quotationNumber: quotation.quotationNumber,
            supplierCount: quotation.targetSuppliers.length
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to send quotation: ${error.message}`);
    }
  }
  
  /**
   * Add supplier quote to an item
   */
  static async addQuote(quotationId, itemId, quoteData, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.addQuote(itemId, quoteData, userId);
      
      // Log quote addition
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            action: 'add_quote',
            quotationNumber: quotation.quotationNumber,
            supplier: quoteData.supplier,
            unitPrice: quoteData.unitPrice
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to add quote: ${error.message}`);
    }
  }
  
  /**
   * Select quote for an item
   */
  static async selectQuote(quotationId, itemId, quoteId, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.selectQuote(itemId, quoteId, userId);
      
      // Log quote selection
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            action: 'select_quote',
            quotationNumber: quotation.quotationNumber,
            itemId,
            quoteId
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to select quote: ${error.message}`);
    }
  }
  
  /**
   * Complete quotation
   */
  static async completeQuotation(quotationId, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.complete(userId);
      
      // Log completion
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            action: 'completed',
            quotationNumber: quotation.quotationNumber,
            totalValue: quotation.selectedQuotes.totalValue
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to complete quotation: ${error.message}`);
    }
  }
  
  /**
   * Cancel quotation
   */
  static async cancelQuotation(quotationId, reason, userId) {
    try {
      if (!reason) {
        throw new Error('Cancellation reason is required');
      }
      
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.cancel(userId, reason);
      
      // Log cancellation
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'cancelled',
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            quotationNumber: quotation.quotationNumber,
            reason
          }
        }
      });
      
      return quotation;
    } catch (error) {
      throw new Error(`Failed to cancel quotation: ${error.message}`);
    }
  }
  
  /**
   * Delete quotation (soft delete)
   */
  static async deleteQuotation(quotationId, userId) {
    try {
      const quotation = await this.getQuotation(quotationId);
      
      await quotation.softDelete(userId);
      
      // Log deletion
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotationId,
        metadata: {
          extra: {
            quotationNumber: quotation.quotationNumber
          }
        }
      });
      
      return { success: true, message: 'Quotation deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete quotation: ${error.message}`);
    }
  }
  
  /**
   * Get pending quotations
   */
  static async getPendingQuotations() {
    try {
      const quotations = await MaterialQuotation.findPending();
      return quotations;
    } catch (error) {
      throw new Error(`Failed to get pending quotations: ${error.message}`);
    }
  }
  
  /**
   * Get overdue quotations
   */
  static async getOverdueQuotations() {
    try {
      const quotations = await MaterialQuotation.findOverdue();
      return quotations;
    } catch (error) {
      throw new Error(`Failed to get overdue quotations: ${error.message}`);
    }
  }
  
  /**
   * Get statistics
   */
  static async getStatistics(filters = {}) {
    try {
      const query = { removed: false };
      
      if (filters.dateFrom || filters.dateTo) {
        query.requestDate = {};
        if (filters.dateFrom) {
          query.requestDate.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.requestDate.$lte = new Date(filters.dateTo);
        }
      }
      
      const stats = await MaterialQuotation.getStatistics(query);
      
      return {
        success: true,
        result: stats
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Convert selected quotes to purchase orders
   */
  static async convertToPurchaseOrders(quotationId, userId) {
    try {
      const quotation = await this.getQuotation(quotationId, {
        populate: ['items.material', 'items.quotes.supplier']
      });
      
      if (quotation.status !== 'completed') {
        throw new Error('Only completed quotations can be converted to purchase orders');
      }
      
      // Group selected quotes by supplier
      const supplierQuotes = new Map();
      
      quotation.items.forEach(item => {
        const selectedQuote = item.quotes.find(q => q.isSelected);
        if (selectedQuote) {
          const supplierId = selectedQuote.supplier._id.toString();
          if (!supplierQuotes.has(supplierId)) {
            supplierQuotes.set(supplierId, {
              supplier: selectedQuote.supplier,
              items: []
            });
          }
          
          supplierQuotes.get(supplierId).items.push({
            material: item.material._id,
            quantity: item.quantity,
            unitPrice: selectedQuote.unitPrice,
            uom: item.uom,
            notes: selectedQuote.notes
          });
        }
      });
      
      // Create PO for each supplier
      const createdPOs = [];
      
      for (const [supplierId, data] of supplierQuotes) {
        // Calculate totals
        const subtotal = data.items.reduce((sum, item) => 
          sum + (item.quantity * item.unitPrice), 0
        );
        
        // Generate PO number
        const poNumber = await PurchaseOrder.generatePONumber();
        
        const po = await PurchaseOrder.create({
          poNumber,
          supplier: data.supplier._id,
          items: data.items,
          orderDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          subtotal,
          totalAmount: subtotal, // Tax can be added later
          notes: `Generated from quotation: ${quotation.quotationNumber}`,
          createdBy: userId
        });
        
        createdPOs.push({
          supplier: data.supplier._id,
          purchaseOrder: po._id,
          createdAt: new Date()
        });
      }
      
      // Update quotation with PO references
      quotation.purchaseOrders = createdPOs;
      await quotation.save();
      
      // Log conversion
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'MaterialQuotation',
        entityId: quotation._id,
        metadata: {
          extra: {
            action: 'converted_to_po',
            quotationNumber: quotation.quotationNumber,
            poCount: createdPOs.length
          }
        }
      });
      
      return {
        success: true,
        purchaseOrders: createdPOs,
        message: `Created ${createdPOs.length} purchase order(s)`
      };
    } catch (error) {
      throw new Error(`Failed to convert to purchase orders: ${error.message}`);
    }
  }
}

module.exports = MaterialQuotationService;

