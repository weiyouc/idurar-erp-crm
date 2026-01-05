const mongoose = require('mongoose');
const AttachmentService = require('../../src/services/AttachmentService');
const Attachment = require('../../src/models/coreModels/Attachment');
const Admin = require('../../src/models/coreModels/Admin');
const fs = require('fs').promises;
const path = require('path');

// Mock AuditLogService
jest.mock('../../src/services/AuditLogService');
const AuditLogService = require('../../src/services/AuditLogService');

describe('AttachmentService', () => {
  let testAdmin;
  let testEntityId;
  
  beforeAll(async () => {
    testAdmin = await Admin.create({
      email: 'attachment-service-test@test.com',
      password: 'password123',
      name: 'Service',
      surname: 'Tester',
      enabled: true
    });
    
    testEntityId = new mongoose.Types.ObjectId();
    
    // Ensure upload directory exists
    await fs.mkdir(AttachmentService.UPLOAD_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    await Attachment.deleteMany({});
    
    // Clean up uploaded files
    try {
      const files = await fs.readdir(AttachmentService.UPLOAD_DIR);
      for (const file of files) {
        await fs.unlink(path.join(AttachmentService.UPLOAD_DIR, file));
      }
    } catch (error) {
      // Ignore errors
    }
    
    jest.clearAllMocks();
  });
  
  describe('File Validation', () => {
    test('validateFile() should throw if no file provided', () => {
      expect(() => {
        AttachmentService.validateFile(null);
      }).toThrow('No file provided');
    });
    
    test('validateFile() should throw if file has no data', () => {
      expect(() => {
        AttachmentService.validateFile({ name: 'test.pdf' });
      }).toThrow('No file provided');
    });
    
    test('validateFile() should throw if file has no name', () => {
      expect(() => {
        AttachmentService.validateFile({ data: Buffer.from('test') });
      }).toThrow('File name is required');
    });
    
    test('validateFile() should throw if file has no mimetype', () => {
      expect(() => {
        AttachmentService.validateFile({
          name: 'test.pdf',
          data: Buffer.from('test')
        });
      }).toThrow('File MIME type is required');
    });
    
    test('validateFile() should throw if file is empty', () => {
      expect(() => {
        AttachmentService.validateFile({
          name: 'test.pdf',
          data: Buffer.from(''),
          mimetype: 'application/pdf',
          size: 0
        });
      }).toThrow('File is empty');
    });
    
    test('validateFileType() should throw for disallowed types', () => {
      expect(() => {
        AttachmentService.validateFileType('application/x-executable');
      }).toThrow('not allowed');
    });
    
    test('validateFileType() should accept allowed types', () => {
      const allowedTypes = AttachmentService.ALLOWED_TYPES;
      
      allowedTypes.forEach(type => {
        expect(() => {
          AttachmentService.validateFileType(type);
        }).not.toThrow();
      });
    });
    
    test('validateFileSize() should throw if file too large', () => {
      const tooLarge = AttachmentService.MAX_FILE_SIZE + 1;
      
      expect(() => {
        AttachmentService.validateFileSize(tooLarge);
      }).toThrow('exceeds maximum');
    });
    
    test('validateFileSize() should accept valid sizes', () => {
      expect(() => {
        AttachmentService.validateFileSize(1024);
      }).not.toThrow();
      
      expect(() => {
        AttachmentService.validateFileSize(AttachmentService.MAX_FILE_SIZE);
      }).not.toThrow();
    });
  });
  
  describe('uploadFile()', () => {
    test('should upload file successfully', async () => {
      const file = {
        name: 'test-upload.pdf',
        data: Buffer.from('test file content'),
        mimetype: 'application/pdf',
        size: 17
      };
      
      const attachment = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      expect(attachment).toBeDefined();
      expect(attachment.originalName).toBe('test-upload.pdf');
      expect(attachment.mimeType).toBe('application/pdf');
      expect(attachment.size).toBe(17);
      expect(attachment.entityType).toBe('Supplier');
      expect(attachment.entityId.toString()).toBe(testEntityId.toString());
      expect(attachment.uploadedBy.toString()).toBe(testAdmin._id.toString());
      
      // Verify file was saved
      const fileExists = await fs.access(attachment.path).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      // Verify audit log
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          action: 'file_upload'
        })
      );
    });
    
    test('should throw if required options missing', async () => {
      const file = {
        name: 'test.pdf',
        data: Buffer.from('test'),
        mimetype: 'application/pdf',
        size: 4
      };
      
      await expect(AttachmentService.uploadFile(file, {})).rejects.toThrow(
        'entityType, entityId, and uploadedBy are required'
      );
    });
    
    test('should use default fieldName if not provided', async () => {
      const file = {
        name: 'test.pdf',
        data: Buffer.from('test'),
        mimetype: 'application/pdf',
        size: 4
      };
      
      const attachment = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      expect(attachment.fieldName).toBe('attachments');
    });
    
    test('should save with custom fieldName', async () => {
      const file = {
        name: 'license.pdf',
        data: Buffer.from('license content'),
        mimetype: 'application/pdf',
        size: 15
      };
      
      const attachment = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        fieldName: 'businessLicense',
        uploadedBy: testAdmin._id
      });
      
      expect(attachment.fieldName).toBe('businessLicense');
    });
    
    test('should save description and tags', async () => {
      const file = {
        name: 'document.pdf',
        data: Buffer.from('content'),
        mimetype: 'application/pdf',
        size: 7
      };
      
      const attachment = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id,
        description: 'Important document',
        tags: ['legal', 'required']
      });
      
      expect(attachment.description).toBe('Important document');
      expect(attachment.tags).toEqual(['legal', 'required']);
    });
    
    test('should reject invalid file type', async () => {
      const file = {
        name: 'malware.exe',
        data: Buffer.from('malicious'),
        mimetype: 'application/x-executable',
        size: 9
      };
      
      await expect(AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      })).rejects.toThrow('not allowed');
    });
    
    test('should reject file too large', async () => {
      const largeData = Buffer.alloc(AttachmentService.MAX_FILE_SIZE + 1);
      const file = {
        name: 'huge.pdf',
        data: largeData,
        mimetype: 'application/pdf',
        size: largeData.length
      };
      
      await expect(AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      })).rejects.toThrow('exceeds maximum');
    });
  });
  
  describe('uploadMultiple()', () => {
    test('should upload multiple files', async () => {
      const files = [
        {
          name: 'file1.pdf',
          data: Buffer.from('content1'),
          mimetype: 'application/pdf',
          size: 8
        },
        {
          name: 'file2.pdf',
          data: Buffer.from('content2'),
          mimetype: 'application/pdf',
          size: 8
        }
      ];
      
      const result = await AttachmentService.uploadMultiple(files, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      expect(result.success).toBe(true);
      expect(result.uploaded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });
    
    test('should handle mixed success and failures', async () => {
      const files = [
        {
          name: 'valid.pdf',
          data: Buffer.from('valid'),
          mimetype: 'application/pdf',
          size: 5
        },
        {
          name: 'invalid.exe',
          data: Buffer.from('invalid'),
          mimetype: 'application/x-executable',
          size: 7
        }
      ];
      
      const result = await AttachmentService.uploadMultiple(files, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      expect(result.success).toBe(true);
      expect(result.uploaded).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
    });
    
    test('should handle single file as array', async () => {
      const file = {
        name: 'single.pdf',
        data: Buffer.from('single'),
        mimetype: 'application/pdf',
        size: 6
      };
      
      const result = await AttachmentService.uploadMultiple(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      expect(result.uploaded).toHaveLength(1);
    });
  });
  
  describe('getAttachments()', () => {
    test('should get all attachments for entity', async () => {
      await Attachment.create([
        {
          originalName: 'file1.pdf',
          storedName: 'stored1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/stored1.pdf',
          entityType: 'Supplier',
          entityId: testEntityId,
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'file2.pdf',
          storedName: 'stored2.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          path: './uploads/stored2.pdf',
          entityType: 'Supplier',
          entityId: testEntityId,
          uploadedBy: testAdmin._id
        }
      ]);
      
      const attachments = await AttachmentService.getAttachments('Supplier', testEntityId);
      
      expect(attachments).toHaveLength(2);
    });
    
    test('should filter by fieldName', async () => {
      await Attachment.create([
        {
          originalName: 'license.pdf',
          storedName: 'license.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/license.pdf',
          entityType: 'Supplier',
          entityId: testEntityId,
          fieldName: 'businessLicense',
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'cert.pdf',
          storedName: 'cert.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          path: './uploads/cert.pdf',
          entityType: 'Supplier',
          entityId: testEntityId,
          fieldName: 'certificate',
          uploadedBy: testAdmin._id
        }
      ]);
      
      const attachments = await AttachmentService.getAttachments('Supplier', testEntityId, {
        fieldName: 'businessLicense'
      });
      
      expect(attachments).toHaveLength(1);
      expect(attachments[0].fieldName).toBe('businessLicense');
    });
  });
  
  describe('getAttachment()', () => {
    test('should get single attachment', async () => {
      const created = await Attachment.create({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      const attachment = await AttachmentService.getAttachment(created._id);
      
      expect(attachment._id.toString()).toBe(created._id.toString());
      expect(attachment.originalName).toBe('test.pdf');
    });
    
    test('should throw if attachment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(AttachmentService.getAttachment(fakeId)).rejects.toThrow(
        'Attachment not found'
      );
    });
    
    test('should not return removed attachments', async () => {
      const attachment = await Attachment.create({
        originalName: 'removed.pdf',
        storedName: 'removed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/removed.pdf',
        entityType: 'Supplier',
        entityId: testEntityId,
        removed: true,
        uploadedBy: testAdmin._id
      });
      
      await expect(AttachmentService.getAttachment(attachment._id)).rejects.toThrow(
        'Attachment not found'
      );
    });
  });
  
  describe('deleteAttachment()', () => {
    test('should soft delete attachment', async () => {
      // Create file
      const file = {
        name: 'to-delete.pdf',
        data: Buffer.from('delete me'),
        mimetype: 'application/pdf',
        size: 9
      };
      
      const created = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      // Delete
      const deleted = await AttachmentService.deleteAttachment(created._id, testAdmin._id);
      
      expect(deleted.removed).toBe(true);
      expect(deleted.removedBy.toString()).toBe(testAdmin._id.toString());
      
      // Verify audit log
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testAdmin._id,
          action: 'file_delete'
        })
      );
    });
    
    test('should delete physical file', async () => {
      const file = {
        name: 'physical-delete.pdf',
        data: Buffer.from('delete physical'),
        mimetype: 'application/pdf',
        size: 15
      };
      
      const created = await AttachmentService.uploadFile(file, {
        entityType: 'Supplier',
        entityId: testEntityId,
        uploadedBy: testAdmin._id
      });
      
      const filePath = created.path;
      
      // Verify file exists
      let exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      // Delete
      await AttachmentService.deleteAttachment(created._id, testAdmin._id);
      
      // Verify file deleted
      exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });
  
  describe('Utility Methods', () => {
    test('generateStoredName() should create unique filename', () => {
      const name1 = AttachmentService.generateStoredName('test.pdf');
      const name2 = AttachmentService.generateStoredName('test.pdf');
      
      expect(name1).not.toBe(name2);
      expect(name1).toContain('.pdf');
      expect(name2).toContain('.pdf');
      expect(name1).toMatch(/^\d+-[a-z0-9]+\.pdf$/);
    });
    
    test('generateStoredName() should preserve extension', () => {
      const extensions = ['.pdf', '.docx', '.jpg', '.png'];
      
      extensions.forEach(ext => {
        const filename = `test${ext}`;
        const stored = AttachmentService.generateStoredName(filename);
        expect(stored).toContain(ext);
      });
    });
    
    test('formatBytes() should format bytes correctly', () => {
      expect(AttachmentService.formatBytes(0)).toBe('0 Bytes');
      expect(AttachmentService.formatBytes(1024)).toBe('1 KB');
      expect(AttachmentService.formatBytes(1048576)).toBe('1 MB');
      expect(AttachmentService.formatBytes(1073741824)).toBe('1 GB');
      expect(AttachmentService.formatBytes(1536)).toBe('1.5 KB');
    });
  });
  
  describe('getStorageStats()', () => {
    test('should return storage statistics', async () => {
      await Attachment.create([
        {
          originalName: 'file1.pdf',
          storedName: 'file1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/file1.pdf',
          entityType: 'Supplier',
          entityId: testEntityId,
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'file2.jpg',
          storedName: 'file2.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          path: './uploads/file2.jpg',
          entityType: 'Material',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        }
      ]);
      
      const stats = await AttachmentService.getStorageStats();
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(3072);
      expect(stats.totalSizeHuman).toBeDefined();
      expect(stats.byType['application/pdf']).toBe(1);
      expect(stats.byType['image/jpeg']).toBe(1);
      expect(stats.byEntity['Supplier']).toBe(1);
      expect(stats.byEntity['Material']).toBe(1);
    });
  });
});

