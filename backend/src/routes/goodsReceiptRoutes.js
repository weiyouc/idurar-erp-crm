const express = require('express');
const router = express.Router();
const goodsReceiptController = require('../controllers/goodsReceiptController');

// Query operations (must come before /:id routes)
router.get('/by-po/:poId', goodsReceiptController.getByPO);
router.get('/pending-inspections', goodsReceiptController.pendingInspections);
router.get('/statistics', goodsReceiptController.statistics);
router.get('/search', goodsReceiptController.search);
router.get('/export', goodsReceiptController.export);

// CRUD operations
router.post('/', goodsReceiptController.create);
router.get('/', goodsReceiptController.list);

// Business operations (must come before /:id routes)
router.post('/:id/complete', goodsReceiptController.complete);
router.post('/:id/quality-inspection', goodsReceiptController.qualityInspection);
router.post('/:id/cancel', goodsReceiptController.cancel);
router.get('/:id/pdf', goodsReceiptController.generatePDF);

// Parameterized routes (must come last)
router.get('/:id', goodsReceiptController.read);
router.put('/:id', goodsReceiptController.update);
router.delete('/:id', goodsReceiptController.delete);

module.exports = router;


