/**
 * Attachment Routes
 * 
 * API routes for file upload, download, and management.
 */

const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const attachmentController = require('@/controllers/attachmentController');

// Upload routes
router.post(
  '/upload',
  catchErrors(attachmentController.uploadFile)
);

router.post(
  '/upload-multiple',
  catchErrors(attachmentController.uploadMultiple)
);

// Retrieval routes
router.get(
  '/stats',
  catchErrors(attachmentController.getStorageStats)
);

router.get(
  '/:entityType/:entityId',
  catchErrors(attachmentController.getAttachments)
);

router.get(
  '/:id',
  catchErrors(attachmentController.getAttachment)
);

router.get(
  '/:id/download',
  catchErrors(attachmentController.downloadFile)
);

// Delete routes
router.delete(
  '/:entityType/:entityId',
  catchErrors(attachmentController.deleteEntityAttachments)
);

router.delete(
  '/:id',
  catchErrors(attachmentController.deleteAttachment)
);

module.exports = router;

