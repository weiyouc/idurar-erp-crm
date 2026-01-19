/**
 * Workflow Management Controller
 * 
 * RESTful API endpoints for workflow and workflow instance management.
 * 
 * Workflow Routes:
 *   GET    /api/workflows              - List all workflows
 *   GET    /api/workflows/:id          - Get workflow by ID
 *   POST   /api/workflows              - Create new workflow
 *   PUT    /api/workflows/:id          - Update workflow
 *   DELETE /api/workflows/:id          - Delete workflow
 * 
 * Workflow Instance Routes:
 *   GET    /api/workflow-instances           - List workflow instances
 *   GET    /api/workflow-instances/:id       - Get instance by ID
 *   POST   /api/workflow-instances           - Initiate workflow
 *   POST   /api/workflow-instances/:id/approve - Approve workflow
 *   POST   /api/workflow-instances/:id/reject  - Reject workflow
 *   POST   /api/workflow-instances/:id/cancel  - Cancel workflow
 *   GET    /api/workflow-instances/pending/me  - Get my pending approvals
 */

const Workflow = require('../models/appModels/Workflow');
const WorkflowInstance = require('../models/appModels/WorkflowInstance');
const WorkflowEngine = require('../services/workflow/WorkflowEngine');
const AuditLogService = require('../services/AuditLogService');

// ============================================================================
// Workflow Management
// ============================================================================

/**
 * List all workflows
 * GET /api/workflows
 */
exports.listWorkflows = async (req, res) => {
  try {
    const { documentType, activeOnly = 'true' } = req.query;
    
    let query = {};
    
    if (documentType) {
      query.documentType = documentType.toLowerCase();
    }
    
    if (activeOnly === 'true') {
      query.isActive = true;
      query.removed = false;
    }
    
    let workflows = [];
    try {
      workflows = await Workflow.find(query)
        .populate('createdBy', 'name email')
        .sort({ documentType: 1, name: 1 });
    } catch (queryError) {
      console.error('Error listing workflows (query failed):', queryError);
      return res.json({
        success: true,
        result: [],
        count: 0,
        warning: `Workflow list fallback: ${queryError.message}`
      });
    }

    res.json({
      success: true,
      result: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving workflows: ${error.message}`,
      error: error.message
    });
  }
};

/**
 * Get workflow by ID
 * GET /api/workflows/:id
 */
exports.getWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await Workflow.findById(id)
      .populate('createdBy', 'name email')
      .populate('levels.approverRoles', 'name displayName');
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      result: workflow
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow',
      error: error.message
    });
  }
};

/**
 * Create new workflow
 * POST /api/workflows
 */
exports.createWorkflow = async (req, res) => {
  try {
    const { workflowName, displayName, documentType, description, levels, routingRules, isDefault } = req.body;
    
    // Validation
    if (!workflowName || !displayName || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'workflowName, displayName, and documentType are required'
      });
    }
    
    // Create workflow
    const workflow = await Workflow.create({
      workflowName,
      displayName,
      documentType: documentType.toLowerCase(),
      description,
      levels: levels || [],
      routingRules: routingRules || [],
      isDefault: isDefault || false,
      isActive: true,
      createdBy: req.admin._id
    });
    
    // Log creation
    await AuditLogService.logCreate({
      user: req.admin._id,
      entityType: 'Workflow',
      entityId: workflow._id,
      newData: { workflowName, displayName, documentType, levelsCount: levels?.length || 0 }
    });
    
    // Populate and return
    const populatedWorkflow = await Workflow.findById(workflow._id)
      .populate('createdBy', 'name email')
      .populate('levels.approverRoles', 'name displayName');
    
    res.status(201).json({
      success: true,
      data: populatedWorkflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workflow',
      error: error.message
    });
  }
};

/**
 * Update workflow
 * PUT /api/workflows/:id
 */
exports.updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const workflow = await Workflow.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Track changes
    const changes = [];
    const oldData = workflow.toObject();
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (workflow[key] !== undefined) {
        if (JSON.stringify(workflow[key]) !== JSON.stringify(updates[key])) {
          changes.push({
            field: key,
            oldValue: workflow[key],
            newValue: updates[key]
          });
          workflow[key] = updates[key];
        }
      }
    });
    
    await workflow.save();
    
    // Log update
    if (changes.length > 0) {
      await AuditLogService.logUpdate({
        user: req.admin._id,
        entityType: 'Workflow',
        entityId: workflow._id,
        changes,
        oldData,
        newData: workflow.toObject()
      });
    }
    
    // Populate and return
    const populatedWorkflow = await Workflow.findById(workflow._id)
      .populate('createdBy', 'name email')
      .populate('levels.approverRoles', 'name displayName');
    
    res.json({
      success: true,
      data: populatedWorkflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workflow',
      error: error.message
    });
  }
};

/**
 * Delete workflow (soft delete)
 * DELETE /api/workflows/:id
 */
exports.deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await Workflow.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Soft delete
    workflow.removed = true;
    workflow.isActive = false;
    await workflow.save();
    
    // Log deletion
    await AuditLogService.logDelete({
      user: req.admin._id,
      entityType: 'Workflow',
      entityId: workflow._id,
      oldData: workflow.toObject()
    });
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workflow',
      error: error.message
    });
  }
};

// ============================================================================
// Workflow Instance Management
// ============================================================================

/**
 * List workflow instances
 * GET /api/workflow-instances
 */
exports.listInstances = async (req, res) => {
  try {
    const { documentType, status, limit = 50 } = req.query;
    
    let query = {};
    
    if (documentType) {
      query.documentType = documentType.toLowerCase();
    }
    
    if (status) {
      query.status = status;
    }
    
    const instances = await WorkflowInstance.find(query)
      .populate('workflow', 'workflowName documentType')
      .populate('submittedBy', 'name email')
      .sort({ created: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: instances,
      count: instances.length
    });
  } catch (error) {
    console.error('Error listing workflow instances:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow instances',
      error: error.message
    });
  }
};

/**
 * Get workflow instance by ID
 * GET /api/workflow-instances/:id
 */
exports.getInstance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const instance = await WorkflowInstance.findById(id)
      .populate('workflow', 'workflowName documentType')
      .populate('submittedBy', 'name email')
      .populate('approvalHistory.approver', 'name email');
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Workflow instance not found'
      });
    }
    
    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error getting workflow instance:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow instance',
      error: error.message
    });
  }
};

/**
 * Initiate new workflow instance
 * POST /api/workflow-instances
 * 
 * Body:
 *   - documentType: string (required)
 *   - documentId: ObjectId (required)
 *   - metadata: object (optional)
 */
exports.initiateWorkflow = async (req, res) => {
  try {
    const { documentType, documentId, metadata } = req.body;
    
    if (!documentType || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentId are required'
      });
    }
    
    // Initiate workflow using engine
    const instance = await WorkflowEngine.initiateWorkflow({
      documentType,
      documentId,
      initiatedBy: req.admin._id,
      metadata: metadata || {}
    });
    
    res.status(201).json({
      success: true,
      data: instance,
      message: 'Workflow initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating workflow',
      error: error.message
    });
  }
};

/**
 * Approve workflow
 * POST /api/workflow-instances/:id/approve
 * 
 * Body:
 *   - comments: string (optional)
 */
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = '' } = req.body;
    
    const instance = await WorkflowEngine.processApproval({
      workflowInstanceId: id,
      approverId: req.admin._id,
      action: 'approve',
      comments
    });
    
    res.json({
      success: true,
      data: instance,
      message: 'Approval processed successfully'
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing approval',
      error: error.message
    });
  }
};

/**
 * Reject workflow
 * POST /api/workflow-instances/:id/reject
 * 
 * Body:
 *   - comments: string (optional)
 */
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = '' } = req.body;
    
    const instance = await WorkflowEngine.processApproval({
      workflowInstanceId: id,
      approverId: req.admin._id,
      action: 'reject',
      comments
    });
    
    res.json({
      success: true,
      data: instance,
      message: 'Rejection processed successfully'
    });
  } catch (error) {
    console.error('Error rejecting workflow:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing rejection',
      error: error.message
    });
  }
};

/**
 * Cancel workflow
 * POST /api/workflow-instances/:id/cancel
 * 
 * Body:
 *   - reason: string (optional)
 */
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    
    const instance = await WorkflowEngine.cancelWorkflow(
      id,
      req.admin._id,
      reason
    );
    
    res.json({
      success: true,
      data: instance,
      message: 'Workflow cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling workflow:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error cancelling workflow',
      error: error.message
    });
  }
};

/**
 * Get my pending approvals
 * GET /api/workflow-instances/pending/me
 */
exports.getMyPendingApprovals = async (req, res) => {
  try {
    const { documentType, limit = 50 } = req.query;
    
    const options = {
      limit: parseInt(limit)
    };
    
    if (documentType) {
      options.documentType = documentType;
    }
    
    const instances = await WorkflowEngine.getPendingApprovalsForUser(
      req.admin._id,
      options
    );
    
    res.json({
      success: true,
      data: instances,
      count: instances.length
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending approvals',
      error: error.message
    });
  }
};

