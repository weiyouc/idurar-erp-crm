const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { checkPermission } = require('../middlewares/rbac');

// Special queries and actions
router.route('/pending-approvals')
  .get(
    checkPermission('purchase_order', 'approve'),
    purchaseOrderController.getPendingApprovals
  );

router.route('/statistics')
  .get(
    checkPermission('purchase_order', 'list'),
    purchaseOrderController.getStatistics
  );

router.route('/number/:number')
  .get(
    checkPermission('purchase_order', 'read'),
    purchaseOrderController.getByNumber
  );

router.route('/supplier/:supplierId')
  .get(
    checkPermission('purchase_order', 'list'),
    purchaseOrderController.getBySupplier
  );

router.route('/material/:materialId')
  .get(
    checkPermission('purchase_order', 'list'),
    purchaseOrderController.getByMaterial
  );

router.route('/export')
  .get(
    checkPermission('purchase_order', 'export'),
    purchaseOrderController.export
  );

// CRUD operations
router.route('/')
  .post(
    checkPermission('purchase_order', 'create'),
    purchaseOrderController.create
  )
  .get(
    checkPermission('purchase_order', 'list'),
    purchaseOrderController.list
  );

router.route('/:id')
  .get(
    checkPermission('purchase_order', 'read'),
    purchaseOrderController.read
  )
  .patch(
    checkPermission('purchase_order', 'update'),
    purchaseOrderController.update
  )
  .delete(
    checkPermission('purchase_order', 'delete'),
    purchaseOrderController.delete
  );

// Workflow operations
router.route('/:id/submit')
  .post(
    checkPermission('purchase_order', 'submit'),
    purchaseOrderController.submitForApproval
  );

router.route('/:id/approve')
  .post(
    checkPermission('purchase_order', 'approve'),
    purchaseOrderController.approve
  );

router.route('/:id/reject')
  .post(
    checkPermission('purchase_order', 'approve'),
    purchaseOrderController.reject
  );

router.route('/:id/cancel')
  .post(
    checkPermission('purchase_order', 'cancel'),
    purchaseOrderController.cancel
  );

// Supplier communication
router.route('/:id/send')
  .post(
    checkPermission('purchase_order', 'send'),
    purchaseOrderController.sendToSupplier
  );

router.route('/:id/confirm')
  .post(
    checkPermission('purchase_order', 'update'),
    purchaseOrderController.confirm
  );

module.exports = router;




