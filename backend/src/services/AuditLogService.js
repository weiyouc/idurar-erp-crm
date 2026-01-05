/**
 * Audit Log Service
 * 
 * Centralized service for logging all system operations and changes.
 * Provides convenience methods for common audit logging scenarios.
 * 
 * Usage:
 *   const AuditLogService = require('./services/AuditLogService');
 *   
 *   // Log create operation
 *   await AuditLogService.logCreate({
 *     user: userId,
 *     entityType: 'Supplier',
 *     entityId: supplierId,
 *     newData: supplierData
 *   });
 *   
 *   // Log update operation
 *   await AuditLogService.logUpdate({
 *     user: userId,
 *     entityType: 'PurchaseOrder',
 *     entityId: poId,
 *     changes: changesArray
 *   });
 */

const AuditLog = require('../models/coreModels/AuditLog');

class AuditLogService {
  
  /**
   * Log a create operation
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.entityType - Type of entity created
   * @param {ObjectId} params.entityId - ID of the created entity
   * @param {Object} [params.newData={}] - New entity data (stored in metadata)
   * @param {Object} [params.metadata={}] - Additional metadata
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logCreate({ user, entityType, entityId, newData = {}, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: { newData, ...metadata }
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action: 'create',
        entityType,
        entityId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging create operation:', error);
      // Don't throw error to avoid disrupting main operation
      return null;
    }
  }
  
  /**
   * Log an update operation
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.entityType - Type of entity updated
   * @param {ObjectId} params.entityId - ID of the updated entity
   * @param {Array} [params.changes=[]] - Array of field changes
   * @param {Object} [params.oldData={}] - Old entity data (stored in metadata)
   * @param {Object} [params.newData={}] - New entity data (stored in metadata)
   * @param {Object} [params.metadata={}] - Additional metadata
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logUpdate({ user, entityType, entityId, changes = [], oldData = {}, newData = {}, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: { oldData, newData, ...metadata }
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action: 'update',
        entityType,
        entityId,
        changes,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging update operation:', error);
      return null;
    }
  }
  
  /**
   * Log a delete operation
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.entityType - Type of entity deleted
   * @param {ObjectId} params.entityId - ID of the deleted entity
   * @param {Object} [params.oldData={}] - Old entity data (stored in metadata)
   * @param {Object} [params.metadata={}] - Additional metadata
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logDelete({ user, entityType, entityId, oldData = {}, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: { oldData, ...metadata }
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action: 'delete',
        entityType,
        entityId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging delete operation:', error);
      return null;
    }
  }
  
  /**
   * Log an approval action
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.entityType - Type of entity approved
   * @param {ObjectId} params.entityId - ID of the approved entity
   * @param {Object} [params.metadata={}] - Additional metadata (e.g., comments, level)
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logApproval({ user, entityType, entityId, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: metadata
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action: 'approve',
        entityType,
        entityId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging approval:', error);
      return null;
    }
  }
  
  /**
   * Log a rejection action
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.entityType - Type of entity rejected
   * @param {ObjectId} params.entityId - ID of the rejected entity
   * @param {Object} [params.metadata={}] - Additional metadata (e.g., comments, reason)
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logRejection({ user, entityType, entityId, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: metadata
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action: 'reject',
        entityType,
        entityId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging rejection:', error);
      return null;
    }
  }
  
  /**
   * Log a workflow action
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.action - Workflow action (e.g., 'workflow_initiated', 'workflow_approved')
   * @param {ObjectId} params.workflowInstanceId - Workflow instance ID
   * @param {Object} [params.details={}] - Additional details
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logWorkflowAction({ user, action, workflowInstanceId, details = {} }) {
    try {
      const metadataDoc = {
        extra: details
      };
      if (details.ip) metadataDoc.ip = details.ip;
      if (details.userAgent) metadataDoc.userAgent = details.userAgent;
      if (details.requestId) metadataDoc.requestId = details.requestId;
      
      return await AuditLog.create({
        user,
        action,
        entityType: 'WorkflowInstance',
        entityId: workflowInstanceId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging workflow action:', error);
      return null;
    }
  }
  
  /**
   * Log a login event
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who logged in
   * @param {Object} [params.metadata={}] - Additional metadata (e.g., IP, user agent)
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logLogin({ user, metadata = {} }) {
    try {
      return await AuditLog.create({
        user,
        action: 'login',
        entityType: 'Admin',
        entityId: user,
        metadata
      });
    } catch (error) {
      console.error('Error logging login:', error);
      return null;
    }
  }
  
  /**
   * Log a logout event
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who logged out
   * @param {Object} [params.metadata={}] - Additional metadata
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logLogout({ user, metadata = {} }) {
    try {
      return await AuditLog.create({
        user,
        action: 'logout',
        entityType: 'Admin',
        entityId: user,
        metadata
      });
    } catch (error) {
      console.error('Error logging logout:', error);
      return null;
    }
  }
  
  /**
   * Log a generic action
   * 
   * @param {Object} params
   * @param {ObjectId} params.user - User who performed the action
   * @param {string} params.action - Action name
   * @param {string} [params.entityType] - Entity type
   * @param {ObjectId} [params.entityId] - Entity ID
   * @param {Object} [params.metadata={}] - Additional metadata
   * @returns {Promise<AuditLog>} Created audit log entry
   */
  static async logAction({ user, action, entityType, entityId, metadata = {} }) {
    try {
      const metadataDoc = {
        extra: metadata
      };
      if (metadata.ip) metadataDoc.ip = metadata.ip;
      if (metadata.userAgent) metadataDoc.userAgent = metadata.userAgent;
      if (metadata.requestId) metadataDoc.requestId = metadata.requestId;
      
      return await AuditLog.create({
        user,
        action,
        entityType,
        entityId,
        metadata: metadataDoc
      });
    } catch (error) {
      console.error('Error logging action:', error);
      return null;
    }
  }
  
  /**
   * Get audit logs for a specific entity
   * 
   * @param {string} entityType - Entity type
   * @param {ObjectId} entityId - Entity ID
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Array<AuditLog>>} Audit logs
   */
  static async getLogsForEntity(entityType, entityId, options = {}) {
    try {
      return await AuditLog.findByEntity(entityType, entityId, options);
    } catch (error) {
      console.error('Error getting logs for entity:', error);
      return [];
    }
  }
  
  /**
   * Get audit logs for a specific user
   * 
   * @param {ObjectId} userId - User ID
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Array<AuditLog>>} Audit logs
   */
  static async getLogsForUser(userId, options = {}) {
    try {
      return await AuditLog.findByUser(userId, options);
    } catch (error) {
      console.error('Error getting logs for user:', error);
      return [];
    }
  }
  
  /**
   * Search audit logs
   * 
   * @param {Object} filters - Search filters
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Array<AuditLog>>} Audit logs
   */
  static async searchLogs(filters, options = {}) {
    try {
      return await AuditLog.search(filters);
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  }
  
}

module.exports = AuditLogService;

