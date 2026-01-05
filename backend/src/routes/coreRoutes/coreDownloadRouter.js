const downloadPdf = require('@/handlers/downloadHandler/downloadPdf');
const attachmentController = require('@/controllers/attachmentController');
const { catchErrors } = require('@/handlers/errorHandlers');
const express = require('express');

const router = express.Router();

// Attachment download route (public)
router.get('/attachment/:id', catchErrors(attachmentController.downloadFile));

// Legacy PDF download route
router.route('/:directory/:file').get(function (req, res) {
  try {
    const { directory, file } = req.params;
    const id = file.slice(directory.length + 1).slice(0, -4); // extract id from file name
    downloadPdf(req, res, { directory, id });
  } catch (error) {
    return res.status(503).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
