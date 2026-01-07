/**
 * SupplierService
 * 
 * Service layer for supplier management operations.
 * Handles CRUD, workflow integration, and business logic.
 */

const Supplier = require('../models/appModels/Supplier');
const WorkflowEngine = require('./workflow/WorkflowEngine');
const AuditLogService = require('./AuditLogService');

class SupplierService {
  
  /**
   * Create a new supplier
   * 
   * @param {Object} supplierData - Supplier data
   * @param {ObjectId} userId - User creating the supplier
   * @returns {Promise<Supplier>}
   */
  static async createSupplier(supplierData, userId) {
    try {
      // Generate supplier number
      const supplierNumber = await Supplier.generateSupplierNumber();
      
      // Create supplier
      const supplier = await Supplier.create({
        ...supplierData,
        supplierNumber,
        createdBy: userId,
        status: 'draft'
      });
      
      // Log creation
      await AuditLogService.logCreate({
        user: userId,
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          companyName: supplier.companyName
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to create supplier: ${error.message}`);
    }
  }
  
  /**
   * Get supplier by ID
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {Object} options - Query options
   * @returns {Promise<Supplier>}
   */
  static async getSupplier(supplierId, options = {}) {
    try {
      let query = Supplier.findOne({ _id: supplierId, removed: false });
      
      // Populate references if requested
      if (options.populate) {
        if (options.populate.includes('createdBy')) {
          query = query.populate('createdBy', 'name email');
        }
        if (options.populate.includes('updatedBy')) {
          query = query.populate('updatedBy', 'name email');
        }
        if (options.populate.includes('documents')) {
          query = query.populate('documents.businessLicense')
                       .populate('documents.taxCertificate')
                       .populate('documents.qualityCertificates')
                       .populate('documents.otherDocuments');
        }
        if (options.populate.includes('workflow')) {
          query = query.populate('workflow.currentWorkflowId')
                       .populate('workflow.approvedBy', 'name email')
                       .populate('workflow.rejectedBy', 'name email');
        }
      }
      
      const supplier = await query;
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to get supplier: ${error.message}`);
    }
  }
  
  /**
   * List suppliers with pagination and filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async listSuppliers(filters = {}, options = {}) {
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
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.category) {
        query.category = { $in: [filters.category] };
      }
      
      if (filters.creditRating) {
        query['creditInfo.creditRating'] = filters.creditRating;
      }
      
      if (filters.search && filters.search.trim()) {
        // Search on company names, supplier number, and abbreviation using regex
        const searchRegex = new RegExp(filters.search.trim(), 'i');
        query.$or = [
          { 'companyName.zh': searchRegex },
          { 'companyName.en': searchRegex },
          { supplierNumber: searchRegex },
          { abbreviation: searchRegex }
        ];
      }
      
      // Count total
      const total = await Supplier.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * items;
      const pages = Math.ceil(total / items);
      
      // Build sort - default to createdAt if invalid field
      const sort = {};
      const validSortFields = ['createdAt', 'updatedAt', 'supplierNumber', 'status', 'type'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      sort[safeSortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query - populate will return null if references don't exist (won't throw error)
      const suppliers = await Supplier.find(query)
        .sort(sort)
        .skip(skip)
        .limit(items)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      // Convert Mongoose documents to plain objects for JSON serialization
      const suppliersData = suppliers.map(supplier => {
        const supplierObj = supplier.toObject ? supplier.toObject() : supplier;
        return supplierObj;
      });
      
      return {
        success: true,
        result: suppliersData,
        pagination: {
          page: parseInt(page),
          pages,
          count: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to list suppliers: ${error.message}`);
    }
  }
  
  /**
   * Update supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {Object} updateData - Data to update
   * @param {ObjectId} userId - User performing the update
   * @returns {Promise<Supplier>}
   */
  static async updateSupplier(supplierId, updateData, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      // Store old data for audit
      const oldData = supplier.toObject();
      
      // Determine if critical fields are being updated
      const criticalFields = [
        'banking.bankName',
        'banking.accountNumber',
        'businessInfo.registrationNumber',
        'businessInfo.taxNumber'
      ];
      
      const isCriticalUpdate = Object.keys(updateData).some(key =>
        criticalFields.some(field => key.startsWith(field.split('.')[0]))
      );
      
      // If critical update and supplier is active, require re-approval
      if (isCriticalUpdate && supplier.status === 'active') {
        updateData.status = 'pending_approval';
        updateData.workflow = {
          ...supplier.workflow,
          approvalStatus: 'pending'
        };
      }
      
      // Update supplier
      Object.assign(supplier, updateData);
      supplier.updatedBy = userId;
      await supplier.save();
      
      // Log update
      await AuditLogService.logUpdate({
        user: userId,
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          oldData,
          newData: supplier.toObject(),
          changes: updateData
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  }
  
  /**
   * Delete supplier (soft delete)
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User performing the deletion
   * @returns {Promise<Supplier>}
   */
  static async deleteSupplier(supplierId, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      // Soft delete
      await supplier.softDelete(userId);
      
      // Log deletion
      await AuditLogService.logDelete({
        user: userId,
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          companyName: supplier.companyName
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  }
  
  /**
   * Submit supplier for approval
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User submitting for approval
   * @returns {Promise<Supplier>}
   */
  static async submitForApproval(supplierId, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      // Check if already submitted or approved
      if (supplier.status === 'pending_approval') {
        throw new Error('Supplier is already pending approval');
      }
      
      if (supplier.status === 'active') {
        throw new Error('Supplier is already approved and active');
      }
      
      // Initiate workflow
      const workflowInstance = await WorkflowEngine.initiateWorkflow({
        documentType: 'supplier',
        documentId: supplier._id,
        submittedBy: userId,
        data: {
          supplierNumber: supplier.supplierNumber,
          companyName: supplier.companyName,
          type: supplier.type
        }
      });
      
      // Update supplier status
      supplier.status = 'pending_approval';
      supplier.workflow.currentWorkflowId = workflowInstance._id;
      supplier.workflow.approvalStatus = 'pending';
      await supplier.save();
      
      // Log submission
      await AuditLogService.logWorkflowAction({
        user: userId,
        action: 'workflow_initiated',
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          workflowId: workflowInstance._id,
          supplierNumber: supplier.supplierNumber
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to submit supplier for approval: ${error.message}`);
    }
  }
  
  /**
   * Approve supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User approving
   * @param {Object} options - Approval options
   * @returns {Promise<Supplier>}
   */
  static async approveSupplier(supplierId, userId, options = {}) {
    try {
      const supplier = await this.getSupplier(supplierId, { populate: ['workflow'] });
      
      // Check if pending approval
      if (supplier.status !== 'pending_approval') {
        throw new Error('Supplier is not pending approval');
      }
      
      // Approve in workflow engine
      if (supplier.workflow.currentWorkflowId) {
        await WorkflowEngine.processApproval({
          workflowInstanceId: supplier.workflow.currentWorkflowId,
          action: 'approve',
          userId,
          comments: options.comments
        });
      }
      
      // Update supplier
      await supplier.approve(userId);
      
      // Log approval
      await AuditLogService.logApproval({
        user: userId,
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          comments: options.comments
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to approve supplier: ${error.message}`);
    }
  }
  
  /**
   * Reject supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User rejecting
   * @param {string} reason - Rejection reason
   * @returns {Promise<Supplier>}
   */
  static async rejectSupplier(supplierId, userId, reason) {
    try {
      const supplier = await this.getSupplier(supplierId, { populate: ['workflow'] });
      
      // Check if pending approval
      if (supplier.status !== 'pending_approval') {
        throw new Error('Supplier is not pending approval');
      }
      
      // Reject in workflow engine
      if (supplier.workflow.currentWorkflowId) {
        await WorkflowEngine.processApproval({
          workflowInstanceId: supplier.workflow.currentWorkflowId,
          action: 'reject',
          userId,
          comments: reason
        });
      }
      
      // Update supplier
      await supplier.reject(userId, reason);
      
      // Log rejection
      await AuditLogService.logRejection({
        user: userId,
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          reason
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to reject supplier: ${error.message}`);
    }
  }
  
  /**
   * Activate supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User performing the action
   * @returns {Promise<Supplier>}
   */
  static async activateSupplier(supplierId, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      await supplier.activate();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'activate',
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to activate supplier: ${error.message}`);
    }
  }
  
  /**
   * Deactivate supplier
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User performing the action
   * @returns {Promise<Supplier>}
   */
  static async deactivateSupplier(supplierId, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      await supplier.deactivate();
      
      await AuditLogService.logAction({
        user: userId,
        action: 'deactivate',
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to deactivate supplier: ${error.message}`);
    }
  }
  
  /**
   * Add supplier to blacklist
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {ObjectId} userId - User performing the action
   * @param {string} reason - Blacklist reason
   * @returns {Promise<Supplier>}
   */
  static async blacklistSupplier(supplierId, userId, reason) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      await supplier.addToBlacklist(reason);
      
      await AuditLogService.logAction({
        user: userId,
        action: 'blacklist',
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          reason
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to blacklist supplier: ${error.message}`);
    }
  }
  
  /**
   * Update supplier performance metrics
   * 
   * @param {ObjectId} supplierId - Supplier ID
   * @param {Object} metrics - Performance metrics
   * @param {ObjectId} userId - User updating metrics
   * @returns {Promise<Supplier>}
   */
  static async updatePerformance(supplierId, metrics, userId) {
    try {
      const supplier = await this.getSupplier(supplierId);
      
      await supplier.updatePerformance(metrics);
      
      await AuditLogService.logAction({
        user: userId,
        action: 'update_performance',
        entityType: 'Supplier',
        entityId: supplier._id,
        metadata: {
          supplierNumber: supplier.supplierNumber,
          metrics
        }
      });
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to update supplier performance: ${error.message}`);
    }
  }
  
  /**
   * Get supplier statistics
   * 
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      return await Supplier.getStatistics();
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  
  /**
   * Search suppliers
   * 
   * @param {string} query - Search query
   * @returns {Promise<Supplier[]>}
   */
  static async searchSuppliers(query) {
    try {
      return await Supplier.search(query);
    } catch (error) {
      throw new Error(`Failed to search suppliers: ${error.message}`);
    }
  }
  
  /**
   * Find supplier by number
   * 
   * @param {string} supplierNumber - Supplier number
   * @returns {Promise<Supplier>}
   */
  static async findByNumber(supplierNumber) {
    try {
      const supplier = await Supplier.findByNumber(supplierNumber);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      return supplier;
    } catch (error) {
      throw new Error(`Failed to find supplier: ${error.message}`);
    }
  }
}

module.exports = SupplierService;

