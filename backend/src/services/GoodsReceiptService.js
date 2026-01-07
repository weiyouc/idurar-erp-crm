const GoodsReceipt = require('../models/appModels/GoodsReceipt');
const PurchaseOrder = require('../models/appModels/PurchaseOrder');
const Material = require('../models/appModels/Material');
const AuditLogService = require('./AuditLogService');

class GoodsReceiptService {
  /**
   * Create a new goods receipt
   * 
   * @param {Object} receiptData - Receipt data
   * @param {ObjectId} userId - User creating the receipt
   * @returns {Promise<GoodsReceipt>}
   */
  static async createGoodsReceipt(receiptData, userId) {
    try {
      // Validate PO exists and is approved
      const po = await PurchaseOrder.findById(receiptData.purchaseOrder);
      if (!po || po.removed) {
        throw new Error('Purchase order not found');
      }
      
      if (po.status !== 'approved') {
        throw new Error('Can only create receipts for approved purchase orders');
      }
      
      // Generate receipt number if not provided
      const receiptNumber = receiptData.receiptNumber || 
        await GoodsReceipt.generateReceiptNumber();
      
      // Create receipt with PO details
      const receipt = await GoodsReceipt.create({
        ...receiptData,
        receiptNumber,
        poNumber: po.poNumber,
        supplier: po.supplier,
        createdBy: userId
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'GoodsReceipt',
        entityId: receipt._id,
        metadata: {
          extra: {
            receiptNumber: receipt.receiptNumber,
            poNumber: po.poNumber,
            totalReceived: receipt.totalReceived
          }
        }
      });
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to create goods receipt: ${error.message}`);
    }
  }
  
  /**
   * Get goods receipt by ID
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {Object} options - Query options
   * @returns {Promise<GoodsReceipt>}
   */
  static async getGoodsReceipt(receiptId, options = {}) {
    try {
      let query = GoodsReceipt.findOne({ _id: receiptId, removed: false });
      
      // Apply population if requested
      if (options.populate) {
        if (options.populate.includes('purchaseOrder')) {
          query = query.populate('purchaseOrder');
        }
        if (options.populate.includes('supplier')) {
          query = query.populate('supplier', 'companyName supplierNumber');
        }
        if (options.populate.includes('items.material')) {
          query = query.populate('items.material', 'materialNumber materialName baseUOM');
        }
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
        if (options.populate.includes('qualityInspection.inspector')) {
          query = query.populate('qualityInspection.inspector', 'name email');
        }
      }
      
      const receipt = await query;
      
      if (!receipt) {
        throw new Error('Goods receipt not found');
      }
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to get goods receipt: ${error.message}`);
    }
  }
  
  /**
   * List goods receipts with pagination and filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async listGoodsReceipts(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        items = 10,
        sortBy = 'receiptDate',
        sortOrder = 'desc'
      } = options;
      
      // Build query
      const query = { removed: false };
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.purchaseOrder) {
        query.purchaseOrder = filters.purchaseOrder;
      }
      
      if (filters.supplier) {
        query.supplier = filters.supplier;
      }
      
      if (filters.qualityStatus) {
        query['qualityInspection.result'] = filters.qualityStatus;
      }
      
      // Date range filters
      if (filters.receiptDateFrom || filters.receiptDateTo) {
        query.receiptDate = {};
        if (filters.receiptDateFrom) {
          query.receiptDate.$gte = new Date(filters.receiptDateFrom);
        }
        if (filters.receiptDateTo) {
          query.receiptDate.$lte = new Date(filters.receiptDateTo);
        }
      }
      
      // Search by receipt number or PO number
      if (filters.search) {
        query.$or = [
          { receiptNumber: new RegExp(filters.search, 'i') },
          { poNumber: new RegExp(filters.search, 'i') }
        ];
      }
      
      // Pagination
      const skip = (page - 1) * items;
      const limit = items;
      
      // Execute query
      const [receipts, totalItems] = await Promise.all([
        GoodsReceipt.find(query)
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .populate('supplier', 'companyName supplierNumber')
          .populate('purchaseOrder', 'poNumber')
          .populate('createdBy', 'name email'),
        GoodsReceipt.countDocuments(query)
      ]);
      
      return {
        success: true,
        result: receipts,
        pagination: {
          page,
          items,
          count: totalItems,
          pages: Math.ceil(totalItems / items)
        }
      };
    } catch (error) {
      throw new Error(`Failed to list goods receipts: ${error.message}`);
    }
  }
  
  /**
   * Update goods receipt
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {Object} updateData - Update data
   * @param {ObjectId} userId - User performing update
   * @returns {Promise<GoodsReceipt>}
   */
  static async updateGoodsReceipt(receiptId, updateData, userId) {
    try {
      const receipt = await this.getGoodsReceipt(receiptId);
      
      // Only draft receipts can be updated
      if (receipt.status !== 'draft') {
        throw new Error(`Cannot edit receipt with status: ${receipt.status}`);
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'receiptNumber' && key !== 'createdBy') {
          receipt[key] = updateData[key];
        }
      });
      
      receipt.updatedBy = userId;
      await receipt.save();
      
      // Log update
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'GoodsReceipt',
        entityId: receipt._id,
        metadata: {
          extra: {
            receiptNumber: receipt.receiptNumber,
            updatedFields: Object.keys(updateData)
          }
        }
      });
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to update goods receipt: ${error.message}`);
    }
  }
  
  /**
   * Complete goods receipt and update inventory
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {ObjectId} userId - User completing the receipt
   * @returns {Promise<GoodsReceipt>}
   */
  static async completeGoodsReceipt(receiptId, userId) {
    try {
      const receipt = await this.getGoodsReceipt(receiptId);
      
      // Complete the receipt
      await receipt.complete(userId);
      
      // Update purchase order receiving status
      await this.updatePOReceivingStatus(receipt.purchaseOrder);
      
      // Update inventory for accepted items
      await this.updateInventoryFromReceipt(receipt);
      
      // Log completion
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'GoodsReceipt',
        entityId: receipt._id,
        metadata: {
          extra: {
            action: 'completed',
            receiptNumber: receipt.receiptNumber,
            totalAccepted: receipt.totalAccepted,
            totalRejected: receipt.totalRejected
          }
        }
      });
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to complete goods receipt: ${error.message}`);
    }
  }
  
  /**
   * Record quality inspection
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {Object} inspectionData - Inspection data
   * @param {ObjectId} userId - Inspector user ID
   * @returns {Promise<GoodsReceipt>}
   */
  static async recordQualityInspection(receiptId, inspectionData, userId) {
    try {
      const receipt = await this.getGoodsReceipt(receiptId);
      
      // Record inspection
      await receipt.recordInspection(inspectionData, userId);
      
      // Log inspection
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'quality_inspection',
        entityType: 'GoodsReceipt',
        entityId: receipt._id,
        metadata: {
          extra: {
            receiptNumber: receipt.receiptNumber,
            result: inspectionData.result,
            notes: inspectionData.notes
          }
        }
      });
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to record quality inspection: ${error.message}`);
    }
  }
  
  /**
   * Delete goods receipt (soft delete)
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {ObjectId} userId - User deleting
   * @returns {Promise<Object>}
   */
  static async deleteGoodsReceipt(receiptId, userId) {
    try {
      const receipt = await this.getGoodsReceipt(receiptId);
      
      await receipt.softDelete(userId);
      
      // Log deletion
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'GoodsReceipt',
        entityId: receiptId,
        metadata: {
          extra: {
            receiptNumber: receipt.receiptNumber
          }
        }
      });
      
      return { success: true, message: 'Goods receipt deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete goods receipt: ${error.message}`);
    }
  }
  
  /**
   * Cancel goods receipt
   * 
   * @param {ObjectId} receiptId - Receipt ID
   * @param {String} reason - Cancellation reason
   * @param {ObjectId} userId - User cancelling
   * @returns {Promise<GoodsReceipt>}
   */
  static async cancelGoodsReceipt(receiptId, reason, userId) {
    try {
      if (!reason) {
        throw new Error('Cancellation reason is required');
      }
      
      const receipt = await this.getGoodsReceipt(receiptId);
      
      await receipt.cancel(userId, reason);
      
      // Log cancellation
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'cancelled',
        entityType: 'GoodsReceipt',
        entityId: receipt._id,
        metadata: {
          extra: {
            receiptNumber: receipt.receiptNumber,
            reason
          }
        }
      });
      
      return receipt;
    } catch (error) {
      throw new Error(`Failed to cancel goods receipt: ${error.message}`);
    }
  }
  
  /**
   * Get receipts for a purchase order
   * 
   * @param {ObjectId} poId - Purchase order ID
   * @returns {Promise<Array>}
   */
  static async getReceiptsByPO(poId) {
    try {
      const receipts = await GoodsReceipt.findByPO(poId);
      return receipts;
    } catch (error) {
      throw new Error(`Failed to get receipts for PO: ${error.message}`);
    }
  }
  
  /**
   * Get pending quality inspections
   * 
   * @returns {Promise<Array>}
   */
  static async getPendingInspections() {
    try {
      const receipts = await GoodsReceipt.getPendingInspections();
      return receipts;
    } catch (error) {
      throw new Error(`Failed to get pending inspections: ${error.message}`);
    }
  }
  
  /**
   * Get goods receipt statistics
   * 
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>}
   */
  static async getStatistics(filters = {}) {
    try {
      const query = { removed: false };
      
      if (filters.dateFrom || filters.dateTo) {
        query.receiptDate = {};
        if (filters.dateFrom) {
          query.receiptDate.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.receiptDate.$lte = new Date(filters.dateTo);
        }
      }
      
      if (filters.supplier) {
        query.supplier = filters.supplier;
      }
      
      const stats = await GoodsReceipt.getStatistics(query);
      
      return {
        success: true,
        result: stats
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Update purchase order receiving status
   * 
   * @param {ObjectId} poId - Purchase order ID
   * @private
   */
  static async updatePOReceivingStatus(poId) {
    try {
      const po = await PurchaseOrder.findById(poId);
      if (!po) return;
      
      const receipts = await GoodsReceipt.find({
        purchaseOrder: poId,
        removed: false,
        status: 'completed'
      });
      
      // Calculate total received per item
      const itemsReceived = {};
      receipts.forEach(receipt => {
        receipt.items.forEach(item => {
          const materialId = item.material.toString();
          if (!itemsReceived[materialId]) {
            itemsReceived[materialId] = {
              received: 0,
              accepted: 0,
              rejected: 0
            };
          }
          itemsReceived[materialId].received += item.receivedQuantity || 0;
          itemsReceived[materialId].accepted += item.acceptedQuantity || 0;
          itemsReceived[materialId].rejected += item.rejectedQuantity || 0;
        });
      });
      
      // Update PO items
      let allFullyReceived = true;
      let anyPartiallyReceived = false;
      
      po.items.forEach(item => {
        const materialId = item.material.toString();
        const received = itemsReceived[materialId] || { received: 0, accepted: 0, rejected: 0 };
        
        item.receivedQuantity = received.accepted;
        item.remainingQuantity = item.quantity - received.accepted;
        
        if (item.remainingQuantity > 0) {
          allFullyReceived = false;
        }
        if (received.accepted > 0) {
          anyPartiallyReceived = true;
        }
        
        if (item.remainingQuantity <= 0) {
          item.receiptStatus = 'complete';
        } else if (received.accepted > 0) {
          item.receiptStatus = 'partial';
        } else {
          item.receiptStatus = 'pending';
        }
      });
      
      // Update PO receiving status
      if (allFullyReceived) {
        if (!po.receiving) po.receiving = {};
        po.receiving.status = 'fully_received';
      } else if (anyPartiallyReceived) {
        if (!po.receiving) po.receiving = {};
        po.receiving.status = 'partially_received';
      } else {
        if (!po.receiving) po.receiving = {};
        po.receiving.status = 'not_received';
      }
      
      // Update receipt list
      if (!po.receiving) po.receiving = {};
      po.receiving.receipts = receipts.map(r => r._id);
      po.receiving.lastReceiptDate = receipts.length > 0 
        ? receipts[receipts.length - 1].receiptDate 
        : null;
      
      await po.save();
    } catch (error) {
      console.error('Error updating PO receiving status:', error);
    }
  }
  
  /**
   * Update inventory from receipt
   * 
   * @param {GoodsReceipt} receipt - Goods receipt
   * @private
   */
  static async updateInventoryFromReceipt(receipt) {
    try {
      for (const item of receipt.items) {
        if (item.acceptedQuantity > 0) {
          const material = await Material.findById(item.material);
          if (material) {
            // Initialize inventory object if it doesn't exist
            if (!material.inventory) {
              material.inventory = {
                onHand: 0,
                onOrder: 0,
                available: 0,
                reserved: 0
              };
            }
            
            // Add accepted quantity to on-hand inventory
            material.inventory.onHand = (material.inventory.onHand || 0) + item.acceptedQuantity;
            
            // Decrease on-order quantity
            material.inventory.onOrder = Math.max(0, (material.inventory.onOrder || 0) - item.acceptedQuantity);
            
            // Recalculate available quantity
            material.inventory.available = (material.inventory.onHand || 0) - (material.inventory.reserved || 0);
            
            // Update last receipt date
            material.inventory.lastReceiptDate = receipt.receiptDate;
            
            await material.save();
          }
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  }
}

module.exports = GoodsReceiptService;


