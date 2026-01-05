/**
 * Attachment Controller
 * 
 * Handles HTTP requests for file upload, download, and management.
 */

const AttachmentService = require('../services/AttachmentService');

/**
 * Upload a single file
 * 
 * POST /api/attachments/upload
 * 
 * Body:
 * - file: File (multipart/form-data)
 * - entityType: String
 * - entityId: String (ObjectId)
 * - fieldName: String (optional)
 * - description: String (optional)
 * - tags: String (JSON array, optional)
 */
exports.uploadFile = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please include a file in the request.'
      });
    }
    
    // Extract parameters
    const { entityType, entityId, fieldName, description, tags } = req.body;
    
    // Validate required fields
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType and entityId are required'
      });
    }
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format. Must be a JSON array.'
        });
      }
    }
    
    // Upload file
    const attachment = await AttachmentService.uploadFile(req.files.file, {
      entityType,
      entityId,
      fieldName,
      uploadedBy: req.admin._id,
      description,
      tags: parsedTags
    });
    
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      result: attachment.format()
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Upload multiple files
 * 
 * POST /api/attachments/upload-multiple
 * 
 * Body:
 * - files: File[] (multipart/form-data)
 * - entityType: String
 * - entityId: String (ObjectId)
 * - fieldName: String (optional)
 */
exports.uploadMultiple = async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || !req.files.files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded. Please include files in the request.'
      });
    }
    
    // Extract parameters
    const { entityType, entityId, fieldName } = req.body;
    
    // Validate required fields
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType and entityId are required'
      });
    }
    
    // Upload files
    const result = await AttachmentService.uploadMultiple(req.files.files, {
      entityType,
      entityId,
      fieldName,
      uploadedBy: req.admin._id
    });
    
    return res.status(201).json({
      success: result.success,
      message: `Uploaded ${result.summary.successful} of ${result.summary.total} files`,
      result: {
        uploaded: result.uploaded.map(a => a.format()),
        failed: result.failed,
        summary: result.summary
      }
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all attachments for an entity
 * 
 * GET /api/attachments/:entityType/:entityId
 * 
 * Query params:
 * - fieldName: String (optional) - filter by field name
 */
exports.getAttachments = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { fieldName } = req.query;
    
    const attachments = await AttachmentService.getAttachments(
      entityType,
      entityId,
      { fieldName }
    );
    
    return res.status(200).json({
      success: true,
      result: attachments.map(a => a.format()),
      count: attachments.length
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a single attachment
 * 
 * GET /api/attachments/:id
 */
exports.getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await AttachmentService.getAttachment(id);
    
    return res.status(200).json({
      success: true,
      result: attachment.format()
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Download a file
 * 
 * GET /api/attachments/:id/download
 * or
 * GET /download/attachment/:id (for public route)
 */
exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin ? req.admin._id : null;
    
    // Get file info
    const fileInfo = await AttachmentService.downloadFile(id, userId);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(fileInfo.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    res.setHeader('Content-Length', fileInfo.size);
    
    // Send file
    return res.sendFile(require('path').resolve(fileInfo.path));
  } catch (error) {
    console.error('Download error:', error);
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete an attachment
 * 
 * DELETE /api/attachments/:id
 */
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await AttachmentService.deleteAttachment(id, req.admin._id);
    
    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      result: attachment.format()
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete all attachments for an entity
 * 
 * DELETE /api/attachments/:entityType/:entityId
 */
exports.deleteEntityAttachments = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const result = await AttachmentService.deleteEntityAttachments(
      entityType,
      entityId,
      req.admin._id
    );
    
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deleted} of ${result.total} attachments`,
      result
    });
  } catch (error) {
    console.error('Delete entity attachments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get storage statistics
 * 
 * GET /api/attachments/stats
 */
exports.getStorageStats = async (req, res) => {
  try {
    const stats = await AttachmentService.getStorageStats();
    
    return res.status(200).json({
      success: true,
      result: stats
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

