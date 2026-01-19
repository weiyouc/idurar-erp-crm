/**
 * Workflow Instance Routes (compatibility)
 *
 * Provides /api/workflow-instances endpoints expected by the frontend.
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { checkPermission } = require('../middlewares/rbac');

// List workflow instances (compatibility for request.list)
router.get('/list',
  checkPermission('workflow', 'read', 'all'),
  workflowController.listInstances
);

// List workflow instances (non-list usage)
router.get('/',
  checkPermission('workflow', 'read', 'all'),
  workflowController.listInstances
);

// Get my pending approvals
router.get('/pending/me',
  workflowController.getMyPendingApprovals
);

// Get instance by ID
router.get('/:id',
  checkPermission('workflow', 'read'),
  workflowController.getInstance
);

// Initiate workflow
router.post('/',
  checkPermission('workflow', 'create'),
  workflowController.initiateWorkflow
);

// Approve workflow
router.post('/:id/approve',
  workflowController.approve
);

// Reject workflow
router.post('/:id/reject',
  workflowController.reject
);

// Cancel workflow
router.post('/:id/cancel',
  workflowController.cancel
);

module.exports = router;
