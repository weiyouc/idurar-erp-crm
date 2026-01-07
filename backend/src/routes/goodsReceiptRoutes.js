const express = require('express');
const router = express.Router();
const goodsReceiptController = require('../controllers/goodsReceiptController');

// CRUD operations
router.post('/', goodsReceiptController.create);
router.get('/:id', goodsReceiptController.read);
router.get('/', goodsReceiptController.list);
router.put('/:id', goodsReceiptController.update);
router.delete('/:id', goodsReceiptController.delete);

// Business operations
router.post('/:id/complete', goodsReceiptController.complete);
router.post('/:id/quality-inspection', goodsReceiptController.qualityInspection);
router.post('/:id/cancel', goodsReceiptController.cancel);

// Query operations (must come before /:id routes)
router.get('/by-po/:poId', goodsReceiptController.getByPO);
router.get('/pending-inspections', goodsReceiptController.pendingInspections);
router.get('/statistics', goodsReceiptController.statistics);
router.get('/search', goodsReceiptController.search);

// Export operations
router.get('/export', goodsReceiptController.export);
router.get('/:id/pdf', goodsReceiptController.generatePDF);

module.exports = router;


