const express = require('express');
const router = express.Router();
const materialQuotationController = require('../controllers/materialQuotationController');

// Query operations (must come before /:id routes)
router.get('/statistics', materialQuotationController.statistics);

// CRUD operations
router.post('/', materialQuotationController.create);
router.get('/:id', materialQuotationController.read);
router.get('/', materialQuotationController.list);
router.put('/:id', materialQuotationController.update);
router.delete('/:id', materialQuotationController.delete);

// Business operations
router.post('/:id/send', materialQuotationController.send);
router.post('/:id/items/:itemId/quotes', materialQuotationController.addQuote);
router.post('/:id/items/:itemId/quotes/:quoteId/select', materialQuotationController.selectQuote);
router.post('/:id/complete', materialQuotationController.complete);
router.post('/:id/cancel', materialQuotationController.cancel);
router.post('/:id/convert-to-po', materialQuotationController.convertToPO);

module.exports = router;


