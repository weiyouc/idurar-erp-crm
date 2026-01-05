const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { checkPermission } = require('../middlewares/rbac');

// Search and special queries
router.route('/search')
  .get(
    checkPermission('material', 'list'),
    materialController.search
  );

router.route('/statistics')
  .get(
    checkPermission('material', 'list'),
    materialController.getStatistics
  );

router.route('/number/:number')
  .get(
    checkPermission('material', 'read'),
    materialController.getByNumber
  );

router.route('/category/:categoryId')
  .get(
    checkPermission('material', 'list'),
    materialController.getByCategory
  );

router.route('/supplier/:supplierId')
  .get(
    checkPermission('material', 'list'),
    materialController.getBySupplier
  );

// CRUD operations
router.route('/')
  .post(
    checkPermission('material', 'create'),
    materialController.create
  )
  .get(
    checkPermission('material', 'list'),
    materialController.list
  );

router.route('/:id')
  .get(
    checkPermission('material', 'read'),
    materialController.read
  )
  .patch(
    checkPermission('material', 'update'),
    materialController.update
  )
  .delete(
    checkPermission('material', 'delete'),
    materialController.delete
  );

// Status management
router.route('/:id/restore')
  .patch(
    checkPermission('material', 'update'),
    materialController.restore
  );

router.route('/:id/activate')
  .patch(
    checkPermission('material', 'update'),
    materialController.activate
  );

router.route('/:id/deactivate')
  .patch(
    checkPermission('material', 'update'),
    materialController.deactivate
  );

// Supplier management
router.route('/:id/suppliers')
  .post(
    checkPermission('material', 'update'),
    materialController.addSupplier
  );

router.route('/:id/suppliers/:supplierId')
  .delete(
    checkPermission('material', 'update'),
    materialController.removeSupplier
  );

// Pricing and inventory
router.route('/:id/pricing')
  .patch(
    checkPermission('material', 'update'),
    materialController.updatePricing
  );

router.route('/:id/inventory')
  .patch(
    checkPermission('material', 'update'),
    materialController.updateInventory
  );

// UOM conversion
router.route('/:id/convert')
  .post(
    checkPermission('material', 'read'),
    materialController.convertQuantity
  );

module.exports = router;

