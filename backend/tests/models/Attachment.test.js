const mongoose = require('mongoose');
const Attachment = require('../../src/models/coreModels/Attachment');
const Admin = require('../../src/models/coreModels/Admin');

describe('Attachment Model', () => {
  let testAdmin;
  
  beforeAll(async () => {
    // Create test admin
    testAdmin = await Admin.create({
      email: 'attachment-test@test.com',
      password: 'password123',
      name: 'Attachment',
      surname: 'Tester',
      enabled: true
    });
  });
  
  afterEach(async () => {
    // Clean up attachments after each test
    await Attachment.deleteMany({});
  });
  
  describe('Schema Validation', () => {
    test('should create attachment with all required fields', async () => {
      const attachmentData = {
        originalName: 'test-document.pdf',
        storedName: '1234567890-abc.pdf',
        mimeType: 'application/pdf',
        size: 524288,
        path: './uploads/1234567890-abc.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      };
      
      const attachment = await Attachment.create(attachmentData);
      
      expect(attachment.originalName).toBe(attachmentData.originalName);
      expect(attachment.storedName).toBe(attachmentData.storedName);
      expect(attachment.mimeType).toBe(attachmentData.mimeType);
      expect(attachment.size).toBe(attachmentData.size);
      expect(attachment.path).toBe(attachmentData.path);
      expect(attachment.entityType).toBe(attachmentData.entityType);
      expect(attachment.entityId.toString()).toBe(attachmentData.entityId.toString());
      expect(attachment.uploadedBy.toString()).toBe(testAdmin._id.toString());
      expect(attachment.removed).toBe(false);
      expect(attachment.isPublic).toBe(false);
      expect(attachment.uploadedAt).toBeDefined();
    });
    
    test('should fail without required fields', async () => {
      const attachment = new Attachment({});
      
      await expect(attachment.save()).rejects.toThrow();
    });
    
    test('should validate MIME type whitelist', async () => {
      const attachment = new Attachment({
        originalName: 'test.exe',
        storedName: 'test.exe',
        mimeType: 'application/x-executable', // Not allowed
        size: 1024,
        path: './uploads/test.exe',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      await expect(attachment.save()).rejects.toThrow();
    });
    
    test('should accept valid MIME types', async () => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/zip'
      ];
      
      for (const mimeType of validTypes) {
        const attachment = await Attachment.create({
          originalName: 'test-file',
          storedName: `test-${Date.now()}.file`,
          mimeType,
          size: 1024,
          path: './uploads/test.file',
          entityType: 'Supplier',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        });
        
        expect(attachment.mimeType).toBe(mimeType);
      }
    });
    
    test('should validate file size limits', async () => {
      const attachment = new Attachment({
        originalName: 'large-file.pdf',
        storedName: 'large.pdf',
        mimeType: 'application/pdf',
        size: 20 * 1024 * 1024, // 20MB - exceeds 10MB limit
        path: './uploads/large.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      await expect(attachment.save()).rejects.toThrow();
    });
    
    test('should validate entityType enum', async () => {
      const attachment = new Attachment({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'InvalidEntity',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      await expect(attachment.save()).rejects.toThrow();
    });
    
    test('should set default values', async () => {
      const attachment = await Attachment.create({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      expect(attachment.fieldName).toBe('attachments');
      expect(attachment.storageType).toBe('local');
      expect(attachment.isPublic).toBe(false);
      expect(attachment.removed).toBe(false);
      expect(attachment.uploadedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('Instance Methods', () => {
    test('getPublicUrl() should return download URL for local storage', async () => {
      const attachment = await Attachment.create({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        storageType: 'local',
        uploadedBy: testAdmin._id
      });
      
      const url = attachment.getPublicUrl();
      expect(url).toBe(`/download/attachment/${attachment._id}`);
    });
    
    test('getPublicUrl() should return S3 URL for S3 storage', async () => {
      const s3Url = 'https://s3.amazonaws.com/bucket/file.pdf';
      const attachment = await Attachment.create({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        url: s3Url,
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        storageType: 's3',
        s3Bucket: 'bucket',
        s3Key: 'file.pdf',
        uploadedBy: testAdmin._id
      });
      
      const url = attachment.getPublicUrl();
      expect(url).toBe(s3Url);
    });
    
    test('markAsDeleted() should soft delete attachment', async () => {
      const attachment = await Attachment.create({
        originalName: 'test.pdf',
        storedName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      await attachment.markAsDeleted(testAdmin._id);
      
      expect(attachment.removed).toBe(true);
      expect(attachment.removedAt).toBeInstanceOf(Date);
      expect(attachment.removedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('format() should return formatted attachment data', async () => {
      const entityId = new mongoose.Types.ObjectId();
      const attachment = await Attachment.create({
        originalName: 'test-document.pdf',
        storedName: 'stored.pdf',
        mimeType: 'application/pdf',
        size: 524288,
        path: './uploads/stored.pdf',
        entityType: 'Supplier',
        entityId,
        fieldName: 'license',
        description: 'Business license',
        tags: ['legal', 'required'],
        uploadedBy: testAdmin._id
      });
      
      const formatted = attachment.format();
      
      expect(formatted.id.toString()).toBe(attachment._id.toString());
      expect(formatted.originalName).toBe('test-document.pdf');
      expect(formatted.mimeType).toBe('application/pdf');
      expect(formatted.size).toBe(524288);
      expect(formatted.entityType).toBe('Supplier');
      expect(formatted.entityId.toString()).toBe(entityId.toString());
      expect(formatted.fieldName).toBe('license');
      expect(formatted.description).toBe('Business license');
      expect(formatted.tags).toEqual(['legal', 'required']);
      expect(formatted.uploadedBy).toBeDefined();
      expect(formatted.uploadedBy).not.toBeNull();
      // uploadedBy.id should match testAdmin
      expect(formatted.uploadedBy.id.toString()).toBe(testAdmin._id.toString());
      // name is either null (not populated) or a string (populated)
      expect(formatted.uploadedBy.name === null || typeof formatted.uploadedBy.name === 'string').toBe(true);
    });
  });
  
  describe('Static Methods', () => {
    test('findByEntity() should find all attachments for entity', async () => {
      const entityId = new mongoose.Types.ObjectId();
      
      await Attachment.create([
        {
          originalName: 'file1.pdf',
          storedName: 'file1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/file1.pdf',
          entityType: 'Supplier',
          entityId,
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'file2.pdf',
          storedName: 'file2.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          path: './uploads/file2.pdf',
          entityType: 'Supplier',
          entityId,
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'other.pdf',
          storedName: 'other.pdf',
          mimeType: 'application/pdf',
          size: 512,
          path: './uploads/other.pdf',
          entityType: 'Material',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        }
      ]);
      
      const attachments = await Attachment.findByEntity('Supplier', entityId);
      
      expect(attachments).toHaveLength(2);
      expect(attachments[0].entityId.toString()).toBe(entityId.toString());
      expect(attachments[1].entityId.toString()).toBe(entityId.toString());
    });
    
    test('findByEntity() should not return removed attachments', async () => {
      const entityId = new mongoose.Types.ObjectId();
      
      const attachment = await Attachment.create({
        originalName: 'removed.pdf',
        storedName: 'removed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/removed.pdf',
        entityType: 'Supplier',
        entityId,
        removed: true,
        uploadedBy: testAdmin._id
      });
      
      const attachments = await Attachment.findByEntity('Supplier', entityId);
      
      expect(attachments).toHaveLength(0);
    });
    
    test('findByUser() should find all uploads by user', async () => {
      const anotherAdmin = await Admin.create({
        email: 'another-admin@test.com',
        password: 'password123',
        name: 'Another',
        surname: 'Admin',
        enabled: true
      });
      
      await Attachment.create([
        {
          originalName: 'user1-file1.pdf',
          storedName: 'user1-file1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/user1-file1.pdf',
          entityType: 'Supplier',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'user1-file2.pdf',
          storedName: 'user1-file2.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          path: './uploads/user1-file2.pdf',
          entityType: 'Material',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'user2-file1.pdf',
          storedName: 'user2-file1.pdf',
          mimeType: 'application/pdf',
          size: 512,
          path: './uploads/user2-file1.pdf',
          entityType: 'Supplier',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: anotherAdmin._id
        }
      ]);
      
      const attachments = await Attachment.findByUser(testAdmin._id);
      
      expect(attachments).toHaveLength(2);
      // Check that all attachments belong to testAdmin
      attachments.forEach(a => {
        const uploaderId = a.uploadedBy && a.uploadedBy._id ? a.uploadedBy._id : a.uploadedBy;
        expect(uploaderId.toString()).toBe(testAdmin._id.toString());
      });
    });
    
    test('findByUser() should filter by entityType', async () => {
      await Attachment.create([
        {
          originalName: 'supplier.pdf',
          storedName: 'supplier.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: './uploads/supplier.pdf',
          entityType: 'Supplier',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        },
        {
          originalName: 'material.pdf',
          storedName: 'material.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          path: './uploads/material.pdf',
          entityType: 'Material',
          entityId: new mongoose.Types.ObjectId(),
          uploadedBy: testAdmin._id
        }
      ]);
      
      const supplierAttachments = await Attachment.findByUser(testAdmin._id, {
        entityType: 'Supplier'
      });
      
      expect(supplierAttachments).toHaveLength(1);
      expect(supplierAttachments[0].entityType).toBe('Supplier');
    });
  });
  
  describe('Pre-save Hook', () => {
    test('should auto-generate storedName if not provided', async () => {
      const attachment = await Attachment.create({
        originalName: 'test-auto-name.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/auto.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      expect(attachment.storedName).toBeDefined();
      expect(attachment.storedName).toContain('.pdf');
      expect(attachment.storedName).toMatch(/^\d+-[a-z0-9]+\.pdf$/);
    });
    
    test('should not override provided storedName', async () => {
      const storedName = 'custom-stored-name.pdf';
      const attachment = await Attachment.create({
        originalName: 'test.pdf',
        storedName,
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test.pdf',
        entityType: 'Supplier',
        entityId: new mongoose.Types.ObjectId(),
        uploadedBy: testAdmin._id
      });
      
      expect(attachment.storedName).toBe(storedName);
    });
  });
  
  describe('Indexes', () => {
    test('should have compound index on entityType and entityId', async () => {
      const indexes = Attachment.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].entityType === 1 && idx[0].entityId === 1
      );
      
      expect(compoundIndex).toBeDefined();
    });
    
    test('should have index on uploadedBy', async () => {
      const indexes = Attachment.schema.indexes();
      const uploadedByIndex = indexes.find(idx => idx[0].uploadedBy);
      
      expect(uploadedByIndex).toBeDefined();
    });
    
    test('should have index on removed', async () => {
      const indexes = Attachment.schema.indexes();
      const removedIndex = indexes.find(idx => idx[0].removed);
      
      expect(removedIndex).toBeDefined();
    });
  });
});

