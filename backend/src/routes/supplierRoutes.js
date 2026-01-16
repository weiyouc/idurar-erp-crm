/**
 * Supplier Routes
 * 
 * API routes for supplier management operations.
 */

const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const supplierController = require('@/controllers/supplierController');
const { checkPermission } = require('@/middlewares/rbac');

// Statistics and search routes (must come before /:id routes)
router.get(
  '/stats',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.statistics)
);

router.get(
  '/search',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.search)
);

router.get(
  '/number/:supplierNumber',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.findByNumber)
);

router.get(
  '/export',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.export)
);

// CRUD routes
router.post(
  '/create',
  checkPermission('supplier', 'create'),
  catchErrors(supplierController.create)
);

router.get(
  '/read/:id',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.read)
);

router.patch(
  '/update/:id',
  checkPermission('supplier', 'update'),
  catchErrors(supplierController.update)
);

router.delete(
  '/delete/:id',
  checkPermission('supplier', 'delete'),
  catchErrors(supplierController.remove)
);

router.post(
  '/',
  checkPermission('supplier', 'create'),
  catchErrors(supplierController.create)
);

router.get(
  '/list',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.list)
);

router.get(
  '/',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.list)
);

router.get(
  '/:id',
  checkPermission('supplier', 'read'),
  catchErrors(supplierController.read)
);

router.patch(
  '/:id',
  checkPermission('supplier', 'update'),
  catchErrors(supplierController.update)
);

router.delete(
  '/:id',
  checkPermission('supplier', 'delete'),
  catchErrors(supplierController.remove)
);

// Workflow routes
router.post(
  '/:id/submit',
  checkPermission('supplier', 'submit'),
  catchErrors(supplierController.submit)
);

router.post(
  '/:id/approve',
  checkPermission('supplier', 'approve'),
  catchErrors(supplierController.approve)
);

router.post(
  '/:id/reject',
  checkPermission('supplier', 'approve'),  // Same permission as approve
  catchErrors(supplierController.reject)
);

// Status management routes
router.post(
  '/:id/activate',
  checkPermission('supplier', 'update'),
  catchErrors(supplierController.activate)
);

router.post(
  '/:id/deactivate',
  checkPermission('supplier', 'update'),
  catchErrors(supplierController.deactivate)
);

router.post(
  '/:id/blacklist',
  checkPermission('supplier', 'delete'),  // Requires delete permission
  catchErrors(supplierController.blacklist)
);

// Performance update route
router.patch(
  '/:id/performance',
  checkPermission('supplier', 'update'),
  catchErrors(supplierController.updatePerformance)
);

module.exports = router;

