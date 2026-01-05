/**
 * AttachmentService
 * 
 * Service layer for handling file uploads, downloads, and management.
 * Abstracts storage layer (local vs S3) and provides consistent interface.
 */

const Attachment = require('../models/coreModels/Attachment');
const AuditLogService = require('./AuditLogService');
const fs = require('fs').promises;
const path = require('path');

class AttachmentService {
  
  // Configuration
  static ALLOWED_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Other
    'text/plain',
    'application/zip'
  ];
  
  static MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || (10 * 1024 * 1024); // 10MB default
  static UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
  
  /**
   * Upload a single file
   * 
   * @param {Object} file - File object from express-fileupload
   * @param {Object} options - Upload options
   * @param {string} options.entityType - Type of entity (Supplier, Material, etc.)
   * @param {ObjectId} options.entityId - ID of entity
   * @param {string} [options.fieldName='attachments'] - Field name
   * @param {ObjectId} options.uploadedBy - User ID
   * @param {string} [options.description] - File description
   * @param {string[]} [options.tags=[]] - Tags for categorization
   * @returns {Promise<Attachment>} Created attachment record
   */
  static async uploadFile(file, options = {}) {
    const {
      entityType,
      entityId,
      fieldName = 'attachments',
      uploadedBy,
      description,
      tags = []
    } = options;
    
    // Validate
    this.validateFile(file);
    
    // Validate required options
    if (!entityType || !entityId || !uploadedBy) {
      throw new Error('entityType, entityId, and uploadedBy are required');
    }
    
    // Generate unique filename
    const storedName = this.generateStoredName(file.name);
    const uploadPath = path.join(this.UPLOAD_DIR, storedName);
    
    try {
      // Ensure directory exists
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      
      // Save file to disk
      await fs.writeFile(uploadPath, file.data);
      
      // Create attachment record
      const attachment = await Attachment.create({
        originalName: file.name,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
        path: uploadPath,
        entityType,
        entityId,
        fieldName,
        storageType: 'local',
        uploadedBy,
        description,
        tags
      });
      
      // Log upload action
      await AuditLogService.logAction({
        user: uploadedBy,
        action: 'file_upload',
        entityType: 'Attachment',
        entityId: attachment._id,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.mimetype,
          associatedWith: `${entityType}:${entityId}`
        }
      });
      
      return attachment;
    } catch (error) {
      // Cleanup on error - delete physical file if created
      try {
        await fs.unlink(uploadPath);
      } catch (unlinkError) {
        // Ignore cleanup errors
        console.error('Failed to cleanup file after error:', unlinkError.message);
      }
      
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  
  /**
   * Upload multiple files
   * 
   * @param {Array|Object} files - File(s) from express-fileupload
   * @param {Object} options - Upload options (same as uploadFile)
   * @returns {Promise<Object>} Results object with successful uploads and errors
   */
  static async uploadMultiple(files, options = {}) {
    // Ensure files is an array
    const uploads = Array.isArray(files) ? files : [files];
    
    const results = [];
    const errors = [];
    
    for (const file of uploads) {
      try {
        const attachment = await this.uploadFile(file, options);
        results.push(attachment);
      } catch (error) {
        errors.push({
          filename: file.name,
          error: error.message
        });
      }
    }
    
    return {
      success: results.length > 0,
      uploaded: results,
      failed: errors,
      summary: {
        total: uploads.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }
  
  /**
   * Get all attachments for an entity
   * 
   * @param {string} entityType - Type of entity
   * @param {ObjectId} entityId - ID of entity
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Attachment[]>} Array of attachments
   */
  static async getAttachments(entityType, entityId, options = {}) {
    const attachments = await Attachment.findByEntity(entityType, entityId);
    
    if (options.fieldName) {
      return attachments.filter(a => a.fieldName === options.fieldName);
    }
    
    return attachments;
  }
  
  /**
   * Get a single attachment by ID
   * 
   * @param {ObjectId} attachmentId - Attachment ID
   * @returns {Promise<Attachment>} Attachment document
   * @throws {Error} If attachment not found
   */
  static async getAttachment(attachmentId) {
    const attachment = await Attachment.findOne({
      _id: attachmentId,
      removed: false
    }).populate('uploadedBy', 'name email');
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    
    return attachment;
  }
  
  /**
   * Get all uploads by a user
   * 
   * @param {ObjectId} userId - User ID
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Attachment[]>} Array of attachments
   */
  static async getUserUploads(userId, options = {}) {
    return await Attachment.findByUser(userId, options);
  }
  
  /**
   * Download a file
   * 
   * @param {ObjectId} attachmentId - Attachment ID
   * @param {ObjectId} userId - User requesting download (for audit)
   * @returns {Promise<Object>} Download info (path, mimeType, originalName)
   */
  static async downloadFile(attachmentId, userId) {
    const attachment = await this.getAttachment(attachmentId);
    
    // Check if file exists on disk
    try {
      await fs.access(attachment.path);
    } catch (error) {
      throw new Error('File not found on server');
    }
    
    // Log download action
    if (userId) {
      await AuditLogService.logAction({
        user: userId,
        action: 'file_download',
        entityType: 'Attachment',
        entityId: attachmentId,
        metadata: {
          originalName: attachment.originalName,
          associatedWith: `${attachment.entityType}:${attachment.entityId}`
        }
      });
    }
    
    return {
      path: attachment.path,
      mimeType: attachment.mimeType,
      originalName: attachment.originalName,
      size: attachment.size
    };
  }
  
  /**
   * Delete an attachment (soft delete)
   * 
   * @param {ObjectId} attachmentId - Attachment ID
   * @param {ObjectId} userId - User performing deletion
   * @returns {Promise<Attachment>} Deleted attachment
   */
  static async deleteAttachment(attachmentId, userId) {
    const attachment = await this.getAttachment(attachmentId);
    
    // Soft delete the record
    await attachment.markAsDeleted(userId);
    
    // Delete physical file
    try {
      await fs.unlink(attachment.path);
    } catch (error) {
      console.error('Failed to delete physical file:', error.message);
      // Don't throw - soft delete still succeeded
    }
    
    // Log deletion
    await AuditLogService.logAction({
      user: userId,
      action: 'file_delete',
      entityType: 'Attachment',
      entityId: attachmentId,
      metadata: {
        originalName: attachment.originalName,
        size: attachment.size,
        associatedWith: `${attachment.entityType}:${attachment.entityId}`
      }
    });
    
    return attachment;
  }
  
  /**
   * Delete all attachments for an entity
   * 
   * @param {string} entityType - Type of entity
   * @param {ObjectId} entityId - ID of entity
   * @param {ObjectId} userId - User performing deletion
   * @returns {Promise<Object>} Deletion summary
   */
  static async deleteEntityAttachments(entityType, entityId, userId) {
    const attachments = await this.getAttachments(entityType, entityId);
    
    const results = {
      total: attachments.length,
      deleted: 0,
      errors: []
    };
    
    for (const attachment of attachments) {
      try {
        await this.deleteAttachment(attachment._id, userId);
        results.deleted++;
      } catch (error) {
        results.errors.push({
          attachmentId: attachment._id,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validate a file
   * 
   * @param {Object} file - File object
   * @throws {Error} If file is invalid
   */
  static validateFile(file) {
    if (!file || !file.data) {
      throw new Error('No file provided');
    }
    
    if (!file.name) {
      throw new Error('File name is required');
    }
    
    if (!file.mimetype) {
      throw new Error('File MIME type is required');
    }
    
    if (!file.size || file.size === 0) {
      throw new Error('File is empty');
    }
    
    this.validateFileType(file.mimetype);
    this.validateFileSize(file.size);
  }
  
  /**
   * Validate file type
   * 
   * @param {string} mimeType - MIME type
   * @throws {Error} If type not allowed
   */
  static validateFileType(mimeType) {
    if (!this.ALLOWED_TYPES.includes(mimeType)) {
      throw new Error(
        `File type '${mimeType}' is not allowed. ` +
        `Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      );
    }
  }
  
  /**
   * Validate file size
   * 
   * @param {number} size - File size in bytes
   * @throws {Error} If size exceeds limit
   */
  static validateFileSize(size) {
    if (size > this.MAX_FILE_SIZE) {
      const maxSizeMB = (this.MAX_FILE_SIZE / 1024 / 1024).toFixed(2);
      const fileSizeMB = (size / 1024 / 1024).toFixed(2);
      throw new Error(
        `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`
      );
    }
  }
  
  /**
   * Generate unique stored filename
   * 
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  static generateStoredName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(originalName);
    return `${timestamp}-${random}${ext}`;
  }
  
  /**
   * Get storage statistics
   * 
   * @returns {Promise<Object>} Storage statistics
   */
  static async getStorageStats() {
    const attachments = await Attachment.find({ removed: false });
    
    const stats = {
      totalFiles: attachments.length,
      totalSize: attachments.reduce((sum, a) => sum + a.size, 0),
      byType: {},
      byEntity: {}
    };
    
    // Group by MIME type
    attachments.forEach(a => {
      stats.byType[a.mimeType] = (stats.byType[a.mimeType] || 0) + 1;
      stats.byEntity[a.entityType] = (stats.byEntity[a.entityType] || 0) + 1;
    });
    
    // Convert total size to human-readable
    stats.totalSizeHuman = this.formatBytes(stats.totalSize);
    
    return stats;
  }
  
  /**
   * Format bytes to human-readable string
   * 
   * @param {number} bytes - Bytes
   * @param {number} [decimals=2] - Decimal places
   * @returns {string} Formatted string
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

module.exports = AttachmentService;

