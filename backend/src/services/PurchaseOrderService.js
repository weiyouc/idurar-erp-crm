/**
 * PurchaseOrderService
 * 
 * Business logic for purchase order management.
 * Handles CRUD operations, workflow, status transitions, and calculations.
 */

const PurchaseOrder = require('../models/appModels/PurchaseOrder');
const Material = require('../models/appModels/Material');
const Supplier = require('../models/appModels/Supplier');
const WorkflowEngine = require('./workflow/WorkflowEngine');
const AuditLogService = require('./AuditLogService');

class PurchaseOrderService {
  
  /**
   * Create new purchase order
   * 
   * @param {Object} poData - PO data
   * @param {ObjectId} userId - User creating the PO
   * @returns {Promise<PurchaseOrder>}
   */
  static async createPurchaseOrder(poData, userId) {
    try {
      // Validate supplier exists
      const supplier = await Supplier.findById(poData.supplier);
      if (!supplier || supplier.removed) {
        throw new Error('Supplier not found');
      }
      
      // Validate materials in items
      if (poData.items && poData.items.length > 0) {
        for (const item of poData.items) {
          const material = await Material.findById(item.material);
          if (!material || material.removed) {
            throw new Error(`Material ${item.material} not found`);
          }
          // Auto-populate description if not provided
          if (!item.description) {
            item.description = material.materialName?.zh || material.materialName?.en;
          }
          // Use material's base UOM if not specified
          if (!item.uom) {
            item.uom = material.baseUOM;
          }
        }
      }
      
      // Generate PO number
      const poNumber = await PurchaseOrder.generatePONumber();
      
      // Find applicable workflow
      const Workflow = require('../models/appModels/Workflow');
      const workflow = await Workflow.findOne({
        documentType: 'purchase_order',
        isActive: true,
        removed: false
      });
      
      // Create PO
      const po = await PurchaseOrder.create({
        ...poData,
        poNumber,
        createdBy: userId,
        status: 'draft',
        ...(workflow && {
          workflow: {
            workflowId: workflow._id,
            currentStep: 0,
            status: 'not_started'
          }
        })
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'PurchaseOrder',
        entityId: po._id,
        metadata: {
          extra: {
            poNumber: po.poNumber,
            supplier: supplier.companyName?.zh || supplier.supplierNumber,
            totalAmount: po.totalAmount,
            currency: po.currency
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }
  
  /**
   * Get purchase order by ID
   * 
   * @param {ObjectId} poId - PO ID
   * @param {Object} options - Query options
   * @returns {Promise<PurchaseOrder>}
   */
  static async getPurchaseOrder(poId, options = {}) {
    try {
      let query = PurchaseOrder.findOne({ _id: poId, removed: false });
      
      // Populate references if requested
      if (options.populate) {
        if (options.populate.includes('supplier')) {
          query = query.populate('supplier', 'supplierNumber companyName contact address');
        }
        if (options.populate.includes('items.material')) {
          query = query.populate('items.material', 'materialNumber materialName baseUOM');
        }
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
        if (options.populate.includes('workflow')) {
          query = query.populate('workflow.currentWorkflowId')
                       .populate('workflow.submittedBy', 'name email')
                       .populate('workflow.approvers.user', 'name email');
        }
        if (options.populate.includes('attachments')) {
          query = query.populate('attachments');
        }
      }
      
      const po = await query;
      
      if (!po) {
        throw new Error('Purchase order not found');
      }
      
      return po;
    } catch (error) {
      throw new Error(`Failed to get purchase order: ${error.message}`);
    }
  }
  
  /**
   * List purchase orders with pagination and filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async listPurchaseOrders(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        items = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;
      
      // Build query
      const query = { removed: false };
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.supplier) {
        query.supplier = filters.supplier;
      }
      
      if (filters.priority) {
        query.priority = filters.priority;
      }
      
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }
      
      if (filters.approvalStatus) {
        query['workflow.approvalStatus'] = filters.approvalStatus;
      }
      
      // Date range filters
      if (filters.orderDateFrom || filters.orderDateTo) {
        query.orderDate = {};
        if (filters.orderDateFrom) {
          query.orderDate.$gte = new Date(filters.orderDateFrom);
        }
        if (filters.orderDateTo) {
          query.orderDate.$lte = new Date(filters.orderDateTo);
        }
      }
      
      if (filters.expectedDeliveryFrom || filters.expectedDeliveryTo) {
        query.expectedDeliveryDate = {};
        if (filters.expectedDeliveryFrom) {
          query.expectedDeliveryDate.$gte = new Date(filters.expectedDeliveryFrom);
        }
        if (filters.expectedDeliveryTo) {
          query.expectedDeliveryDate.$lte = new Date(filters.expectedDeliveryTo);
        }
      }
      
      // Search by PO number
      if (filters.search) {
        query.poNumber = new RegExp(filters.search, 'i');
      }
      
      // Count total
      const total = await PurchaseOrder.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * items;
      const pages = Math.ceil(total / items);
      
      // Build sort - validate sort field exists
      const validSortFields = ['createdAt', 'updatedAt', 'poNumber', 'status', 'totalAmount', 'orderDate'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sort = {};
      sort[safeSortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query
      const pos = await PurchaseOrder.find(query)
        .sort(sort)
        .skip(skip)
        .limit(items)
        .populate('supplier', 'supplierNumber companyName')
        .populate('createdBy', 'name email')
        .populate('items.material', 'materialNumber materialName');
      
      return {
        success: true,
        result: pos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: pages,
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to list purchase orders: ${error.message}`);
    }
  }
  
  /**
   * Update purchase order
   * 
   * @param {ObjectId} poId - PO ID
   * @param {Object} updateData - Data to update
   * @param {ObjectId} userId - User performing update
   * @returns {Promise<PurchaseOrder>}
   */
  static async updatePurchaseOrder(poId, updateData, userId) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      // Check if PO can be edited
      if (!['draft', 'rejected'].includes(po.status)) {
        throw new Error(`Cannot edit PO with status: ${po.status}`);
      }
      
      const oldData = po.toObject();
      
      // Update fields
      Object.assign(po, updateData);
      po.updatedBy = userId;
      
      await po.save();
      
      const newData = po.toObject();
      const changes = this._getChanges(oldData, newData);
      
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            oldData,
            newData,
            changes
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to update purchase order: ${error.message}`);
    }
  }
  
  /**
   * Delete (soft) purchase order
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User performing deletion
   * @returns {Promise<Object>}
   */
  static async deletePurchaseOrder(poId, userId) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      // Can only delete draft or rejected POs
      if (!['draft', 'rejected'].includes(po.status)) {
        throw new Error(`Cannot delete PO with status: ${po.status}`);
      }
      
      await po.softDelete(userId);
      
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            poNumber: po.poNumber,
            totalAmount: po.totalAmount
          }
        }
      });
      
      return { success: true, message: 'Purchase order deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete purchase order: ${error.message}`);
    }
  }
  
  /**
   * Submit PO for approval
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User submitting
   * @returns {Promise<PurchaseOrder>}
   */
  static async submitForApproval(poId, userId) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      if (po.status !== 'draft') {
        throw new Error('Only draft POs can be submitted for approval');
      }
      
      if (!po.items || po.items.length === 0) {
        throw new Error('Cannot submit empty purchase order');
      }
      
      // Initiate workflow
      const workflowType = 'purchase_order_approval';
      const workflowInstance = await WorkflowEngine.initiateWorkflow({
        workflowType,
        documentId: poId,
        documentType: 'purchase_order',
        submittedBy: userId,
        submissionData: {
          poNumber: po.poNumber,
          totalAmount: po.totalAmount,
          currency: po.currency,
          supplier: po.supplier
        }
      });
      
      po.workflow.currentWorkflowId = workflowInstance._id;
      await po.submitForApproval(userId);
      
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'workflow_initiated',
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            workflowInstanceId: workflowInstance._id,
            message: 'PO submitted for approval',
            totalAmount: po.totalAmount
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to submit PO for approval: ${error.message}`);
    }
  }
  
  /**
   * Approve purchase order
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User approving
   * @param {String} comments - Approval comments
   * @returns {Promise<PurchaseOrder>}
   */
  static async approvePurchaseOrder(poId, userId, comments) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      if (!po.workflow || !po.workflow.currentWorkflowId) {
        throw new Error('No active workflow for this PO');
      }
      
      const workflowInstance = await WorkflowEngine.processApproval({
        workflowInstanceId: po.workflow.currentWorkflowId,
        approverId: userId,
        action: 'approve',
        comments
      });
      
      if (workflowInstance.status === 'approved') {
        await po.approve(userId, comments);
        
        await AuditLogService.logApproval({
          user: userId,
          entityType: 'PurchaseOrder',
          entityId: poId,
          metadata: {
            extra: {
              message: `PO ${po.poNumber} approved`,
              totalAmount: po.totalAmount,
              comments
            }
          }
        });
      }
      
      return po;
    } catch (error) {
      throw new Error(`Failed to approve PO: ${error.message}`);
    }
  }
  
  /**
   * Reject purchase order
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User rejecting
   * @param {String} reason - Rejection reason
   * @returns {Promise<PurchaseOrder>}
   */
  static async rejectPurchaseOrder(poId, userId, reason) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      if (!reason) {
        throw new Error('Rejection reason is required');
      }
      
      if (!po.workflow || !po.workflow.currentWorkflowId) {
        throw new Error('No active workflow for this PO');
      }
      
      const workflowInstance = await WorkflowEngine.processApproval({
        workflowInstanceId: po.workflow.currentWorkflowId,
        approverId: userId,
        action: 'reject',
        comments: reason
      });
      
      if (workflowInstance.status === 'rejected') {
        await po.reject(userId, reason);
        
        await AuditLogService.logRejection({
          user: userId,
          entityType: 'PurchaseOrder',
          entityId: poId,
          metadata: {
            extra: {
              message: `PO ${po.poNumber} rejected`,
              reason
            }
          }
        });
      }
      
      return po;
    } catch (error) {
      throw new Error(`Failed to reject PO: ${error.message}`);
    }
  }
  
  /**
   * Send PO to supplier
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User sending
   * @param {String} email - Supplier email
   * @returns {Promise<PurchaseOrder>}
   */
  static async sendToSupplier(poId, userId, email) {
    try {
      const po = await this.getPurchaseOrder(poId, { populate: ['supplier', 'items.material'] });
      
      await po.sendToSupplier(userId, email);
      
      // TODO: Integrate with email service to send PDF
      // await EmailService.sendPOToSupplier(po, email);
      
      await AuditLogService.logAction({
        user: userId,
        action: 'send_to_supplier',
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            message: `PO ${po.poNumber} sent to supplier`,
            email
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to send PO to supplier: ${error.message}`);
    }
  }
  
  /**
   * Confirm PO from supplier
   * 
   * @param {ObjectId} poId - PO ID
   * @param {String} confirmationNumber - Supplier's confirmation number
   * @returns {Promise<PurchaseOrder>}
   */
  static async confirmFromSupplier(poId, confirmationNumber) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      await po.confirmFromSupplier(confirmationNumber);
      
      await AuditLogService.logAction({
        user: po.createdBy,
        action: 'supplier_confirmed',
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            message: `PO ${po.poNumber} confirmed by supplier`,
            confirmationNumber
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to confirm PO: ${error.message}`);
    }
  }
  
  /**
   * Cancel purchase order
   * 
   * @param {ObjectId} poId - PO ID
   * @param {ObjectId} userId - User cancelling
   * @param {String} reason - Cancellation reason
   * @returns {Promise<PurchaseOrder>}
   */
  static async cancelPurchaseOrder(poId, userId, reason) {
    try {
      const po = await this.getPurchaseOrder(poId);
      
      await po.cancel(userId, reason);
      
      await AuditLogService.logAction({
        user: userId,
        action: 'cancel',
        entityType: 'PurchaseOrder',
        entityId: poId,
        metadata: {
          extra: {
            message: `PO ${po.poNumber} cancelled`,
            reason
          }
        }
      });
      
      return po;
    } catch (error) {
      throw new Error(`Failed to cancel PO: ${error.message}`);
    }
  }
  
  /**
   * Get PO by number
   * 
   * @param {String} poNumber - PO number
   * @returns {Promise<PurchaseOrder>}
   */
  static async getPurchaseOrderByNumber(poNumber) {
    try {
      const po = await PurchaseOrder.findByNumber(poNumber);
      if (!po) {
        throw new Error('Purchase order not found');
      }
      return po;
    } catch (error) {
      throw new Error(`Failed to get PO by number: ${error.message}`);
    }
  }
  
  /**
   * Get POs by supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getPurchaseOrdersBySupplier(supplierId, options = {}) {
    try {
      return await PurchaseOrder.findBySupplier(supplierId, options);
    } catch (error) {
      throw new Error(`Failed to get POs by supplier: ${error.message}`);
    }
  }
  
  /**
   * Get POs by material
   * 
   * @param {ObjectId} materialId - Material ID
   * @returns {Promise<Array>}
   */
  static async getPurchaseOrdersByMaterial(materialId) {
    try {
      return await PurchaseOrder.find({
        'items.material': materialId,
        removed: false
      }).populate('supplier', 'supplierNumber companyName');
    } catch (error) {
      throw new Error(`Failed to get POs by material: ${error.message}`);
    }
  }
  
  /**
   * Get pending approvals
   * 
   * @returns {Promise<Array>}
   */
  static async getPendingApprovals() {
    try {
      return await PurchaseOrder.findPendingApprovals()
        .populate('supplier', 'supplierNumber companyName')
        .populate('workflow.submittedBy', 'name email');
    } catch (error) {
      throw new Error(`Failed to get pending approvals: ${error.message}`);
    }
  }
  
  /**
   * Get statistics
   * 
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      return await PurchaseOrder.getStatistics();
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Helper: Get changes between documents
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

module.exports = PurchaseOrderService;

