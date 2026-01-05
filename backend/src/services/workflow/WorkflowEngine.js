/**
 * Workflow Engine Service
 * 
 * Core service for managing approval workflows including:
 * - Initiating new workflows
 * - Processing approvals/rejections
 * - Managing workflow state
 * - Determining next approval level
 * 
 * Usage:
 *   const { WorkflowEngine } = require('./services/workflow');
 *   
 *   // Initiate workflow
 *   const instance = await WorkflowEngine.initiateWorkflow({
 *     documentType: 'material_quotation',
 *     documentId: quotationId,
 *     initiatedBy: userId,
 *     metadata: { amount: 50000 }
 *   });
 *   
 *   // Process approval
 *   await WorkflowEngine.processApproval({
 *     workflowInstanceId: instance._id,
 *     approverId: approverId,
 *     action: 'approve',
 *     comments: 'Approved'
 *   });
 */

const Workflow = require('../../models/appModels/Workflow');
const WorkflowInstance = require('../../models/appModels/WorkflowInstance');
const ApprovalRouter = require('./ApprovalRouter');
const AuditLogService = require('../AuditLogService');

class WorkflowEngine {
  
  /**
   * Initiate a new workflow for a document
   * 
   * @param {Object} params
   * @param {string} params.documentType - Type of document (e.g., 'material_quotation')
   * @param {ObjectId} params.documentId - ID of the document
   * @param {ObjectId} params.initiatedBy - User who initiated the workflow
   * @param {Object} [params.metadata={}] - Additional metadata for routing
   * @returns {Promise<WorkflowInstance>} Created workflow instance
   */
  static async initiateWorkflow({ documentType, documentId, initiatedBy, metadata = {} }) {
    try {
      // Find the appropriate workflow for this document type
      const workflow = await Workflow.findOne({
        documentType: documentType.toLowerCase(),
        isActive: true,
        removed: false
      }).populate('createdBy');
      
      if (!workflow) {
        throw new Error(`No active workflow found for document type: ${documentType}`);
      }
      
      // Determine required approval levels based on routing rules
      const requiredLevels = await ApprovalRouter.determineApprovalPath(workflow, metadata);
      
      if (requiredLevels.length === 0) {
        throw new Error('No approval levels determined for this workflow');
      }
      
      // Create workflow instance
      const workflowInstance = await WorkflowInstance.create({
        workflow: workflow._id,
        documentType: documentType.toLowerCase(),
        documentId,
        submittedBy: initiatedBy,
        submittedAt: new Date(),
        requiredLevels,
        currentLevel: 1, // Start at level 1
        status: 'pending',
        metadata
      });
      
      // Log workflow initiation
      await AuditLogService.logWorkflowAction({
        user: initiatedBy,
        action: 'workflow_initiated',
        workflowInstanceId: workflowInstance._id,
        details: {
          documentType,
          documentId,
          requiredLevels: requiredLevels.length
        }
      });
      
      return workflowInstance.populate(['workflow', 'submittedBy']);
    } catch (error) {
      console.error('Error initiating workflow:', error);
      throw error;
    }
  }
  
  /**
   * Process an approval or rejection
   * 
   * @param {Object} params
   * @param {ObjectId} params.workflowInstanceId - Workflow instance ID
   * @param {ObjectId} params.approverId - User performing the action
   * @param {string} params.action - 'approve' or 'reject'
   * @param {string} [params.comments=''] - Approval/rejection comments
   * @returns {Promise<WorkflowInstance>} Updated workflow instance
   */
  static async processApproval({ workflowInstanceId, approverId, action, comments = '' }) {
    try {
      // Validate action
      if (!['approve', 'reject'].includes(action.toLowerCase())) {
        throw new Error('Action must be either "approve" or "reject"');
      }
      
      // Get workflow instance
      const instance = await WorkflowInstance.findById(workflowInstanceId)
        .populate(['workflow', 'submittedBy']);
      
      if (!instance) {
        throw new Error('Workflow instance not found');
      }
      
      // Check if workflow is already complete or rejected
      if (instance.status !== 'pending') {
        throw new Error(`Workflow is already ${instance.status}`);
      }
      
      // Check if approver is authorized for current level
      const currentLevelData = instance.requiredLevels[instance.currentLevel - 1];
      if (!currentLevelData) {
        throw new Error('Invalid workflow level');
      }
      
      const isAuthorized = currentLevelData.approvers.some(
        approver => approver.toString() === approverId.toString()
      );
      
      if (!isAuthorized) {
        throw new Error('User not authorized to approve at this level');
      }
      
      // Check if approver has already acted on this level
      const existingApproval = instance.approvalHistory.find(
        h => h.level === instance.currentLevel && 
             h.approver.toString() === approverId.toString()
      );
      
      if (existingApproval) {
        throw new Error('Approver has already acted on this level');
      }
      
      // Record the approval/rejection
      await instance.recordApproval({
        approver: approverId,
        action: action.toLowerCase(),
        comments
      });
      
      // Refresh instance
      await instance.populate(['workflow', 'initiatedBy', 'requiredLevels.approvers']);
      
      // Log the action
      await AuditLogService.logWorkflowAction({
        user: approverId,
        action: action === 'approve' ? 'workflow_approved' : 'workflow_rejected',
        workflowInstanceId: instance._id,
        details: {
          level: instance.currentLevel,
          comments,
          finalStatus: instance.status
        }
      });
      
      return instance;
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }
  
  /**
   * Get pending approvals for a user
   * 
   * @param {ObjectId} userId - User ID
   * @param {Object} [options={}] - Query options
   * @param {string} [options.documentType] - Filter by document type
   * @param {number} [options.limit=50] - Maximum number of results
   * @returns {Promise<Array<WorkflowInstance>>} Pending workflow instances
   */
  static async getPendingApprovalsForUser(userId, options = {}) {
    try {
      return await WorkflowInstance.findPendingApprovalsForUser(userId, options);
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a workflow
   * 
   * @param {ObjectId} workflowInstanceId - Workflow instance ID
   * @param {ObjectId} cancelledBy - User cancelling the workflow
   * @param {string} [reason=''] - Cancellation reason
   * @returns {Promise<WorkflowInstance>} Cancelled workflow instance
   */
  static async cancelWorkflow(workflowInstanceId, cancelledBy, reason = '') {
    try {
      const instance = await WorkflowInstance.findById(workflowInstanceId);
      
      if (!instance) {
        throw new Error('Workflow instance not found');
      }
      
      if (instance.status !== 'pending') {
        throw new Error(`Cannot cancel workflow with status: ${instance.status}`);
      }
      
      // Update status to rejected (cancelled)
      instance.status = 'rejected';
      instance.approvalHistory.push({
        level: instance.currentLevel,
        approver: cancelledBy,
        action: 'reject',
        comments: `Cancelled: ${reason}`,
        timestamp: new Date()
      });
      
      await instance.save();
      
      // Log cancellation
      await AuditLogService.logWorkflowAction({
        user: cancelledBy,
        action: 'workflow_cancelled',
        workflowInstanceId: instance._id,
        details: { reason }
      });
      
      return instance;
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      throw error;
    }
  }
  
  /**
   * Get workflow statistics
   * 
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.documentType] - Filter by document type
   * @param {Date} [filters.startDate] - Start date for date range
   * @param {Date} [filters.endDate] - End date for date range
   * @returns {Promise<Object>} Workflow statistics
   */
  static async getStatistics(filters = {}) {
    try {
      return await WorkflowInstance.getStatistics(filters);
    } catch (error) {
      console.error('Error getting workflow statistics:', error);
      throw error;
    }
  }
  
}

module.exports = WorkflowEngine;

