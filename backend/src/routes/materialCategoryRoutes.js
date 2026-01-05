const express = require('express');
const router = express.Router();
const materialCategoryController = require('../controllers/materialCategoryController');
const { checkPermission } = require('../middlewares/rbac');

// Tree operations
router.route('/tree')
  .get(
    checkPermission('material_category', 'list'),
    materialCategoryController.getTree
  );

router.route('/roots')
  .get(
    checkPermission('material_category', 'list'),
    materialCategoryController.getRoots
  );

router.route('/search')
  .get(
    checkPermission('material_category', 'list'),
    materialCategoryController.search
  );

router.route('/statistics')
  .get(
    checkPermission('material_category', 'list'),
    materialCategoryController.getStatistics
  );

router.route('/code/:code')
  .get(
    checkPermission('material_category', 'read'),
    materialCategoryController.getByCode
  );

// CRUD operations
router.route('/')
  .post(
    checkPermission('material_category', 'create'),
    materialCategoryController.create
  )
  .get(
    checkPermission('material_category', 'list'),
    materialCategoryController.list
  );

router.route('/:id')
  .get(
    checkPermission('material_category', 'read'),
    materialCategoryController.read
  )
  .patch(
    checkPermission('material_category', 'update'),
    materialCategoryController.update
  )
  .delete(
    checkPermission('material_category', 'delete'),
    materialCategoryController.delete
  );

router.route('/:id/children')
  .get(
    checkPermission('material_category', 'read'),
    materialCategoryController.getChildren
  );

router.route('/:id/ancestors')
  .get(
    checkPermission('material_category', 'read'),
    materialCategoryController.getAncestors
  );

router.route('/:id/activate')
  .patch(
    checkPermission('material_category', 'update'),
    materialCategoryController.activate
  );

router.route('/:id/deactivate')
  .patch(
    checkPermission('material_category', 'update'),
    materialCategoryController.deactivate
  );

module.exports = router;

