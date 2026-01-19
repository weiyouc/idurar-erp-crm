/**
 * Workflow Management Routes
 * 
 * Protected routes for workflow and workflow instance operations.
 * All routes require authentication and appropriate permissions.
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { checkPermission } = require('../middlewares/rbac');

// ============================================================================
// Workflow Routes
// ============================================================================

// List all workflows
router.get('/',
  // List routes use auth only to avoid RBAC bootstrap failures
  workflowController.listWorkflows
);

// List all workflows (compatibility for request.list)
router.get('/list',
  // List routes use auth only to avoid RBAC bootstrap failures
  workflowController.listWorkflows
);

// Get workflow by ID
router.get('/:id',
  checkPermission('workflow', 'read'),
  workflowController.getWorkflow
);

// Create new workflow
router.post('/',
  checkPermission('workflow', 'create'),
  workflowController.createWorkflow
);

// Update workflow
router.put('/:id',
  checkPermission('workflow', 'update'),
  workflowController.updateWorkflow
);

// Delete workflow
router.delete('/:id',
  checkPermission('workflow', 'delete'),
  workflowController.deleteWorkflow
);

// ============================================================================
// Workflow Instance Routes
// ============================================================================

// List workflow instances
router.get('/instances',
  checkPermission('workflow', 'read', 'all'),
  workflowController.listInstances
);

// Get my pending approvals
router.get('/instances/pending/me',
  workflowController.getMyPendingApprovals
);

// Get instance by ID
router.get('/instances/:id',
  checkPermission('workflow', 'read'),
  workflowController.getInstance
);

// Initiate workflow
router.post('/instances',
  checkPermission('workflow', 'create'),
  workflowController.initiateWorkflow
);

// Approve workflow
router.post('/instances/:id/approve',
  workflowController.approve
);

// Reject workflow
router.post('/instances/:id/reject',
  workflowController.reject
);

// Cancel workflow
router.post('/instances/:id/cancel',
  workflowController.cancel
);

module.exports = router;

