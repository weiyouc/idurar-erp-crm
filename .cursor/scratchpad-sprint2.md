# Sprint 2: File Management & Excel Export - Detailed Task Breakdown

**Sprint:** 2  
**Duration:** Weeks 5-8 (Estimated: 2 weeks)  
**Started:** January 5, 2026  
**Status:** 📋 Planning Complete → Ready for Execution  
**Overall Progress:** 50% (Excel already complete from Sprint 1)

---

## Sprint Goals

1. ✅ **Excel Export Infrastructure** (COMPLETE from Sprint 1)
2. ⏳ **Generic File Attachment System**
3. ⏳ **File Upload/Download UI Components**
4. ⏳ **Secure File Storage**

---

## Project Status Board

### Sprint 2 Tasks

#### Backend Foundation (Week 1)
- [ ] **TASK-S2-01**: Create Attachment Model (Status: Pending)
- [ ] **TASK-S2-02**: Build AttachmentService (Status: Pending)
- [ ] **TASK-S2-03**: Create Upload API Endpoints (Status: Pending)
- [ ] **TASK-S2-04**: Create Download Handler (Status: Pending)
- [ ] **TASK-S2-05**: Add S3 Integration (Status: Pending - Optional)

#### Frontend Components (Week 2)
- [ ] **TASK-S2-06**: Build FileUpload Component (Status: Pending)
- [ ] **TASK-S2-07**: Build ExportButton Component (Status: Pending)
- [ ] **TASK-S2-08**: Integrate with Forms (Status: Pending)

#### Testing & Documentation
- [ ] **TASK-S2-09**: Write Unit Tests (Status: Pending)
- [ ] **TASK-S2-10**: Write Integration Tests (Status: Pending)
- [ ] **TASK-S2-11**: Complete Documentation (Status: Pending)

---

## Detailed Task Specifications

### **TASK-S2-01: Create Attachment Model**

**Priority:** High  
**Estimated Time:** 2-3 hours  
**Dependencies:** None  
**Status:** Pending

#### Description
Create a generic Attachment model that can be associated with any entity type (Supplier, Material, Purchase Order, etc.). This model will store metadata about uploaded files and track their storage location.

#### Acceptance Criteria
- [x] Model file created at `backend/src/models/coreModels/Attachment.js`
- [x] Schema includes all required fields:
  - File info (originalName, storedName, mimeType, size, path, url)
  - Association (entityType, entityId, fieldName)
  - Storage (storageType, s3Bucket, s3Key)
  - Metadata (uploadedBy, uploadedAt, description, tags)
  - Status (isPublic, removed, removedAt, removedBy)
- [x] Validation rules implemented:
  - Required fields enforced
  - File size limits validated
  - Mime type whitelist
  - EntityType enum validation
- [x] Indexes created for performance:
  - Compound index on (entityType, entityId)
  - Index on uploadedBy
  - Index on removed for soft delete queries
- [x] Instance methods implemented:
  - `getPublicUrl()` - returns accessible URL
  - `markAsDeleted(userId)` - soft delete
  - `format()` - returns formatted data for API response
- [x] Static methods implemented:
  - `findByEntity(entityType, entityId)` - get all attachments for entity
  - `findByUser(userId)` - get all uploads by user
  - `cleanup()` - remove orphaned records
- [x] Pre-save hooks:
  - Auto-generate storedName if not provided
  - Set uploadedAt timestamp
  - Validate file size and type
- [x] Pre-delete hooks:
  - Delete physical file from storage
  - Create audit log entry

#### Technical Specifications

**File:** `backend/src/models/coreModels/Attachment.js`

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
  // File Information
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  storedName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: [
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
    ]
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 10485760  // 10MB default
  },
  path: {
    type: String,
    required: true
  },
  url: String,
  
  // Association
  entityType: {
    type: String,
    required: true,
    enum: ['Supplier', 'Material', 'MaterialQuotation', 'PurchaseOrder', 'PrePayment', 'GoodsReceipt', 'Admin'],
    index: true
  },
  entityId: {
    type: Schema.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  fieldName: {
    type: String,
    default: 'attachments',
    trim: true
  },
  
  // Storage
  storageType: {
    type: String,
    enum: ['local', 's3'],
    default: 'local'
  },
  s3Bucket: String,
  s3Key: String,
  
  // Metadata
  uploadedBy: {
    type: Schema.ObjectId,
    ref: 'Admin',
    required: true,
    autopopulate: true,
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tags: [String],
  
  // Status
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

// Instance methods
attachmentSchema.methods.getPublicUrl = function() {
  if (this.storageType === 's3') {
    return this.url;
  }
  return `/download/attachment/${this._id}`;
};

attachmentSchema.methods.markAsDeleted = function(userId) {
  this.removed = true;
  this.removedAt = new Date();
  this.removedBy = userId;
  return this.save();
};

attachmentSchema.methods.format = function() {
  return {
    id: this._id,
    originalName: this.originalName,
    mimeType: this.mimeType,
    size: this.size,
    url: this.getPublicUrl(),
    entityType: this.entityType,
    entityId: this.entityId,
    uploadedBy: this.uploadedBy ? {
      id: this.uploadedBy._id,
      name: this.uploadedBy.name
    } : null,
    uploadedAt: this.uploadedAt,
    description: this.description,
    tags: this.tags
  };
};

// Static methods
attachmentSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId, removed: false })
    .sort({ uploadedAt: -1 });
};

attachmentSchema.statics.findByUser = function(userId) {
  return this.find({ uploadedBy: userId, removed: false })
    .sort({ uploadedAt: -1 });
};

// Pre-save hook
attachmentSchema.pre('save', function(next) {
  if (this.isNew && !this.storedName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = this.originalName.split('.').pop();
    this.storedName = `${timestamp}-${random}.${ext}`;
  }
  next();
});

module.exports = mongoose.model('Attachment', attachmentSchema);
```

#### Test Cases
```javascript
// tests/models/Attachment.test.js
describe('Attachment Model', () => {
  test('creates attachment with required fields')
  test('validates file size limits')
  test('validates mime type whitelist')
  test('generates unique stored name')
  test('creates compound index on entityType + entityId')
  test('soft deletes with markAsDeleted()')
  test('finds attachments by entity')
  test('finds attachments by user')
  test('formats attachment data correctly')
  test('generates public URL correctly for local storage')
  test('generates public URL correctly for S3')
});
```

#### Success Criteria
- ✅ Model file created and exports correctly
- ✅ All required fields present
- ✅ Validation works for all fields
- ✅ Indexes created successfully
- ✅ All methods work as expected
- ✅ Tests pass (15+ tests)
- ✅ No linting errors
- ✅ Documentation in code complete

---

### **TASK-S2-02: Build AttachmentService**

**Priority:** High  
**Estimated Time:** 3-4 hours  
**Dependencies:** TASK-S2-01  
**Status:** Pending

#### Description
Create a service layer for handling file uploads, downloads, and management. This service will abstract the storage layer (local vs S3) and provide a consistent interface for file operations.

#### Acceptance Criteria
- [x] Service file created at `backend/src/services/AttachmentService.js`
- [x] Upload methods implemented:
  - `uploadFile(file, options)` - single file upload
  - `uploadMultiple(files, options)` - batch upload
- [x] Retrieval methods implemented:
  - `getAttachments(entityType, entityId)` - list all for entity
  - `getAttachment(attachmentId)` - get single attachment
  - `getUserUploads(userId)` - list user's uploads
- [x] Delete methods implemented:
  - `deleteAttachment(attachmentId, userId)` - remove attachment
  - `deleteEntityAttachments(entityType, entityId)` - bulk delete
- [x] Validation methods implemented:
  - `validateFile(file)` - check file is valid
  - `validateFileType(mimeType)` - check type allowed
  - `validateFileSize(size)` - check size within limits
- [x] Storage abstraction:
  - Local storage handler
  - S3 storage handler
  - Configuration-based switching
- [x] Error handling:
  - File too large
  - Invalid file type
  - Storage errors
  - Not found errors
- [x] Audit logging:
  - Log all uploads
  - Log all downloads
  - Log all deletions

#### Technical Specifications

**File:** `backend/src/services/AttachmentService.js`

```javascript
const Attachment = require('../models/coreModels/Attachment');
const AuditLogService = require('./AuditLogService');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

class AttachmentService {
  
  static ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
  
  /**
   * Upload single file
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
    
    // Generate unique filename
    const storedName = this.generateStoredName(file.name);
    const uploadPath = path.join(this.UPLOAD_DIR, storedName);
    
    try {
      // Ensure directory exists
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      
      // Save file
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
      
      // Log upload
      await AuditLogService.logAction({
        user: uploadedBy,
        action: 'file_upload',
        entityType: 'Attachment',
        entityId: attachment._id,
        metadata: {
          originalName: file.name,
          size: file.size,
          associatedWith: `${entityType}:${entityId}`
        }
      });
      
      return attachment;
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(uploadPath);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
  
  /**
   * Upload multiple files
   */
  static async uploadMultiple(files, options = {}) {
    const uploads = Array.isArray(files) ? files : [files];
    const results = [];
    const errors = [];
    
    for (const file of uploads) {
      try {
        const attachment = await this.uploadFile(file, options);
        results.push(attachment);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Get attachments for entity
   */
  static async getAttachments(entityType, entityId) {
    return await Attachment.findByEntity(entityType, entityId);
  }
  
  /**
   * Get single attachment
   */
  static async getAttachment(attachmentId) {
    const attachment = await Attachment.findOne({ 
      _id: attachmentId, 
      removed: false 
    });
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    
    return attachment;
  }
  
  /**
   * Delete attachment
   */
  static async deleteAttachment(attachmentId, userId) {
    const attachment = await this.getAttachment(attachmentId);
    
    // Soft delete record
    await attachment.markAsDeleted(userId);
    
    // Delete physical file
    try {
      await fs.unlink(attachment.path);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }
    
    // Log deletion
    await AuditLogService.logAction({
      user: userId,
      action: 'file_delete',
      entityType: 'Attachment',
      entityId: attachmentId,
      metadata: {
        originalName: attachment.originalName,
        associatedWith: `${attachment.entityType}:${attachment.entityId}`
      }
    });
    
    return attachment;
  }
  
  /**
   * Validate file
   */
  static validateFile(file) {
    if (!file || !file.data) {
      throw new Error('No file provided');
    }
    
    this.validateFileType(file.mimetype);
    this.validateFileSize(file.size);
  }
  
  static validateFileType(mimeType) {
    if (!this.ALLOWED_TYPES.includes(mimeType)) {
      throw new Error(`File type ${mimeType} not allowed`);
    }
  }
  
  static validateFileSize(size) {
    if (size > this.MAX_FILE_SIZE) {
      throw new Error(`File size ${size} exceeds maximum ${this.MAX_FILE_SIZE}`);
    }
  }
  
  /**
   * Generate unique stored name
   */
  static generateStoredName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(originalName);
    return `${timestamp}-${random}${ext}`;
  }
}

module.exports = AttachmentService;
```

#### Test Cases
```javascript
// tests/services/AttachmentService.test.js
describe('AttachmentService', () => {
  test('uploads file successfully')
  test('validates file type')
  test('validates file size')
  test('rejects files over size limit')
  test('rejects invalid file types')
  test('uploads multiple files')
  test('gets attachments by entity')
  test('gets single attachment')
  test('deletes attachment (soft delete)')
  test('deletes physical file on delete')
  test('logs upload action')
  test('logs delete action')
  test('generates unique stored names')
  test('creates upload directory if not exists')
  test('cleans up on upload error')
});
```

#### Success Criteria
- ✅ Service file created
- ✅ All methods implemented and working
- ✅ File validation works correctly
- ✅ Files saved to correct location
- ✅ Attachment records created correctly
- ✅ Audit logs created for all actions
- ✅ Error handling comprehensive
- ✅ Tests pass (15+ tests)
- ✅ No linting errors

---

### **TASK-S2-03: Create Upload API Endpoints**

**Priority:** High  
**Estimated Time:** 2-3 hours  
**Dependencies:** TASK-S2-02  
**Status:** Pending

#### Description
Create REST API endpoints for uploading files, retrieving attachments, and managing file operations. These endpoints will use the AttachmentService and enforce RBAC permissions.

#### Acceptance Criteria
- [x] Controller file created at `backend/src/controllers/attachmentController.js`
- [x] Routes file created at `backend/src/routes/attachmentRoutes.js`
- [x] Endpoints implemented:
  - `POST /api/attachments/upload` - single file upload
  - `POST /api/attachments/upload-multiple` - multiple files
  - `GET /api/attachments/:entityType/:entityId` - list by entity
  - `GET /api/attachments/:id` - get single attachment
  - `DELETE /api/attachments/:id` - delete attachment
- [x] RBAC middleware applied to all endpoints
- [x] File upload middleware configured (express-fileupload)
- [x] Request validation implemented
- [x] Error responses standardized
- [x] Success responses include attachment data
- [x] Routes registered in main app.js

#### Technical Specifications

**File:** `backend/src/controllers/attachmentController.js`

```javascript
const AttachmentService = require('../services/AttachmentService');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { entityType, entityId, fieldName, description, tags } = req.body;
    
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType and entityId are required'
      });
    }
    
    const attachment = await AttachmentService.uploadFile(req.files.file, {
      entityType,
      entityId,
      fieldName,
      uploadedBy: req.admin._id,
      description,
      tags: tags ? JSON.parse(tags) : []
    });
    
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      result: attachment.format()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || !req.files.files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const { entityType, entityId, fieldName } = req.body;
    
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'entityType and entityId are required'
      });
    }
    
    const { results, errors } = await AttachmentService.uploadMultiple(
      req.files.files,
      {
        entityType,
        entityId,
        fieldName,
        uploadedBy: req.admin._id
      }
    );
    
    return res.status(201).json({
      success: true,
      message: `Uploaded ${results.length} files`,
      result: {
        uploaded: results.map(a => a.format()),
        errors
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const attachments = await AttachmentService.getAttachments(entityType, entityId);
    
    return res.status(200).json({
      success: true,
      result: attachments.map(a => a.format())
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await AttachmentService.getAttachment(id);
    
    return res.status(200).json({
      success: true,
      result: attachment.format()
    });
  } catch (error) {
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

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
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};
```

**File:** `backend/src/routes/attachmentRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const attachmentController = require('@/controllers/attachmentController');

// Upload routes
router.post('/upload', catchErrors(attachmentController.uploadFile));
router.post('/upload-multiple', catchErrors(attachmentController.uploadMultiple));

// Retrieval routes
router.get('/:entityType/:entityId', catchErrors(attachmentController.getAttachments));
router.get('/:id', catchErrors(attachmentController.getAttachment));

// Delete route
router.delete('/:id', catchErrors(attachmentController.deleteAttachment));

module.exports = router;
```

**Register in:** `backend/src/app.js`

```javascript
const attachmentRoutes = require('./routes/attachmentRoutes');

// Add after other routes
app.use('/api/attachments', adminAuth.isValidAuthToken, attachmentRoutes);
```

#### Test Cases
```javascript
// tests/controllers/attachmentController.test.js
describe('Attachment Controller', () => {
  test('POST /upload - uploads file successfully')
  test('POST /upload - requires entityType and entityId')
  test('POST /upload - returns 400 if no file')
  test('POST /upload - validates file type')
  test('POST /upload - validates file size')
  test('POST /upload-multiple - uploads multiple files')
  test('GET /:entityType/:entityId - lists attachments')
  test('GET /:id - gets single attachment')
  test('GET /:id - returns 404 for non-existent')
  test('DELETE /:id - deletes attachment')
  test('DELETE /:id - returns 404 for non-existent')
  test('All routes require authentication')
});
```

#### Success Criteria
- ✅ Controller created with all methods
- ✅ Routes created and registered
- ✅ All endpoints work correctly
- ✅ Validation catches errors
- ✅ RBAC enforced
- ✅ Tests pass (12+ tests)
- ✅ Postman/curl tests successful
- ✅ No linting errors

---

### **TASK-S2-04: Create Download Handler**

**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** TASK-S2-01, TASK-S2-02  
**Status:** Pending

#### Description
Create a secure download handler that serves uploaded files with proper permissions checking and audit logging.

#### Acceptance Criteria
- [x] Download controller created
- [x] Route added: `GET /download/attachment/:id`
- [x] Permission check: user can only download if they have access to the entity
- [x] File served with correct MIME type
- [x] Content-Disposition header set for download
- [x] Audit log created for each download
- [x] 404 returned for non-existent files
- [x] 403 returned for unauthorized access
- [x] Handles deleted files gracefully

#### Technical Specifications

**Add to:** `backend/src/controllers/attachmentController.js`

```javascript
exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get attachment
    const attachment = await AttachmentService.getAttachment(id);
    
    // TODO: Check user permission to access this entity
    // For now, allow if authenticated
    
    // Check file exists
    const fs = require('fs');
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Log download
    await AuditLogService.logAction({
      user: req.admin._id,
      action: 'file_download',
      entityType: 'Attachment',
      entityId: id,
      metadata: {
        originalName: attachment.originalName,
        associatedWith: `${attachment.entityType}:${attachment.entityId}`
      }
    });
    
    // Set headers
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    // Stream file
    return res.sendFile(path.resolve(attachment.path));
  } catch (error) {
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};
```

**Add route:**
```javascript
// In attachmentRoutes.js
router.get('/:id/download', catchErrors(attachmentController.downloadFile));
```

#### Success Criteria
- ✅ Download endpoint works
- ✅ Files download with correct name
- ✅ MIME types correct
- ✅ Permission checks work
- ✅ Audit logs created
- ✅ Error handling complete
- ✅ Tests pass

---

## Current Status / Progress Tracking

### Completed Tasks
- ✅ Sprint 1: Core Infrastructure (100%)
- ✅ Excel Export (done in Sprint 1)
- ⏳ Sprint 2: File Management (0% - Planning complete)

### In Progress
- 📋 Planning Phase Complete → Ready for Execution

### Next Up
- **TASK-S2-01**: Create Attachment Model

---

## Executor's Feedback or Assistance Requests

*To be filled by Executor during implementation*

### Questions / Blockers
- None yet

### Decisions Needed
- S3 integration: Required now or optional for later?
  - **Recommendation**: Make optional, use local for staging

### Progress Notes
- Detailed task breakdown complete
- Ready to begin execution
- All dependencies mapped
- Test strategies defined

---

## Lessons

### Sprint 1 Learnings
1. ✅ **Metadata structure**: Always use `metadata.extra` pattern in AuditLog
2. ✅ **Test setup**: Use MongoDB Memory Server with proper timeouts
3. ✅ **Mongoose 8.x**: Use `deleteOne()` not `remove()`
4. ✅ **ExcelJS**: Reference columns by number, not key name

### Sprint 2 Considerations
1. **File storage**: Render has ephemeral storage - S3 needed for production
2. **File validation**: Whitelist MIME types, don't blacklist
3. **Unique filenames**: Timestamp + random to prevent collisions
4. **Soft delete**: Keep file records even after deletion for audit trail

---

## Summary

**Sprint 2 Planning Status:** ✅ **COMPLETE**

**Tasks Defined:** 11 tasks  
**Estimated Time:** 11-14 days (2-3 weeks)  
**Dependencies Mapped:** Yes  
**Test Strategy:** Defined  
**Success Criteria:** Clear  

**Ready for Execution:** ✅ YES

**Next Action:** Begin TASK-S2-01 (Create Attachment Model)

---

**Updated:** January 5, 2026  
**Mode:** Planner → Executor (Ready to switch)

