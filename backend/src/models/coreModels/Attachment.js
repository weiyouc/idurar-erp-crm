const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
  // File Information
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Filename too long']
  },
  storedName: {
    type: String,
    required: false,  // Auto-generated in pre-save hook if not provided
    unique: true,
    index: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: {
      values: [
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
      ],
      message: '{VALUE} is not a supported file type'
    }
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [10485760, 'File size exceeds 10MB limit']  // 10MB default
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: String,
  
  // Association with other entities
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['Supplier', 'Material', 'MaterialQuotation', 'PurchaseOrder', 'PrePayment', 'GoodsReceipt', 'Admin'],
      message: '{VALUE} is not a valid entity type'
    },
    index: true
  },
  entityId: {
    type: Schema.ObjectId,
    required: [true, 'Entity ID is required'],
    refPath: 'entityType',
    index: true
  },
  fieldName: {
    type: String,
    default: 'attachments',
    trim: true,
    maxlength: [100, 'Field name too long']
  },
  
  // Storage configuration
  storageType: {
    type: String,
    enum: {
      values: ['local', 's3'],
      message: '{VALUE} is not a valid storage type'
    },
    default: 'local'
  },
  s3Bucket: {
    type: String,
    trim: true
  },
  s3Key: {
    type: String,
    trim: true
  },
  
  // Metadata
  uploadedBy: {
    type: Schema.ObjectId,
    ref: 'Admin',
    required: [true, 'Uploader is required'],
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description too long']
  },
  tags: {
    type: [String],
    default: []
  },
  
  // Status tracking
  isPublic: {
    type: Boolean,
    default: false
  },
  removed: {
    type: Boolean,
    default: false,
    index: true
  },
  removedAt: Date,
  removedBy: {
    type: Schema.ObjectId,
    ref: 'Admin'
  }
});

// Compound index for efficient entity queries
attachmentSchema.index({ entityType: 1, entityId: 1 });

// Compound index for user uploads
attachmentSchema.index({ uploadedBy: 1, removed: 1 });

/**
 * Instance Methods
 */

/**
 * Get public URL for accessing the attachment
 * @returns {string} Public URL
 */
attachmentSchema.methods.getPublicUrl = function() {
  if (this.storageType === 's3' && this.url) {
    return this.url;
  }
  // For local storage, return download endpoint
  return `/download/attachment/${this._id}`;
};

/**
 * Soft delete the attachment
 * @param {ObjectId} userId - User performing the deletion
 * @returns {Promise<Attachment>} Updated attachment
 */
attachmentSchema.methods.markAsDeleted = function(userId) {
  this.removed = true;
  this.removedAt = new Date();
  this.removedBy = userId;
  return this.save();
};

/**
 * Format attachment data for API response
 * @returns {Object} Formatted attachment data
 */
attachmentSchema.methods.format = function() {
  // Handle uploadedBy - could be populated (object) or just an ObjectId
  let uploadedByFormatted = null;
  if (this.uploadedBy) {
    // Check if it's populated (has _id and name properties)
    if (typeof this.uploadedBy === 'object' && this.uploadedBy._id) {
      uploadedByFormatted = {
        id: this.uploadedBy._id,
        name: this.uploadedBy.name || 'Unknown'
      };
    } else {
      // Just an ObjectId
      uploadedByFormatted = {
        id: this.uploadedBy,
        name: null
      };
    }
  }
  
  return {
    id: this._id,
    originalName: this.originalName,
    mimeType: this.mimeType,
    size: this.size,
    url: this.getPublicUrl(),
    entityType: this.entityType,
    entityId: this.entityId,
    fieldName: this.fieldName,
    uploadedBy: uploadedByFormatted,
    uploadedAt: this.uploadedAt,
    description: this.description,
    tags: this.tags,
    isPublic: this.isPublic
  };
};

/**
 * Static Methods
 */

/**
 * Find all attachments for a specific entity
 * @param {string} entityType - Type of entity
 * @param {ObjectId} entityId - ID of entity
 * @returns {Promise<Attachment[]>} Array of attachments
 */
attachmentSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId, removed: false })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'name email');
};

/**
 * Find all attachments uploaded by a user
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Attachment[]>} Array of attachments
 */
attachmentSchema.statics.findByUser = function(userId, options = {}) {
  const query = { uploadedBy: userId, removed: false };
  
  if (options.entityType) {
    query.entityType = options.entityType;
  }
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .limit(options.limit || 100);
};

/**
 * Find orphaned attachments (entity no longer exists)
 * @returns {Promise<Attachment[]>} Array of orphaned attachments
 */
attachmentSchema.statics.findOrphaned = async function() {
  // This would require checking if referenced entities exist
  // Implementation depends on entity models
  // For now, return empty array
  return [];
};

/**
 * Pre-save Hook
 * Generate unique stored name if not provided
 */
attachmentSchema.pre('save', function(next) {
  if (this.isNew && !this.storedName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = this.originalName.split('.').pop();
    this.storedName = `${timestamp}-${random}.${ext}`;
  }
  next();
});

/**
 * Pre-deleteOne Hook
 * Cleanup when attachment is deleted
 */
attachmentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Delete physical file if local storage
    if (this.storageType === 'local' && this.path) {
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        await fs.unlink(path.resolve(this.path));
      } catch (error) {
        console.error('Failed to delete physical file:', error.message);
        // Don't block deletion if file doesn't exist
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Attachment', attachmentSchema);

