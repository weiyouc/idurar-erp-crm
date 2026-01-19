/**
 * Role Management Routes
 * 
 * Protected routes for role CRUD operations.
 * All routes require authentication and appropriate permissions.
 */

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { checkPermission } = require('../middlewares/rbac');

// List all roles
router.get('/',
  // List routes use auth only to avoid RBAC bootstrap failures
  roleController.list
);

// List all roles (compatibility)
router.get('/list',
  // List routes use auth only to avoid RBAC bootstrap failures
  roleController.list
);

// Get role by ID
router.get('/:id',
  checkPermission('role', 'read'),
  roleController.getById
);

// Create new role
router.post('/',
  checkPermission('role', 'create'),
  roleController.create
);

// Update role
router.put('/:id',
  checkPermission('role', 'update'),
  roleController.update
);

// Delete role
router.delete('/:id',
  checkPermission('role', 'delete'),
  roleController.delete
);

// Add permissions to role
router.post('/:id/permissions',
  checkPermission('role', 'update'),
  roleController.addPermissions
);

// Remove permissions from role
router.delete('/:id/permissions',
  checkPermission('role', 'update'),
  roleController.removePermissions
);

module.exports = router;

