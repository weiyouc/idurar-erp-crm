import React, { useState } from 'react';
import { Upload, message, Button, List, Typography, Space, Tag, Modal } from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileZipOutlined
} from '@ant-design/icons';
import { request } from '@/request';
import { useEffect } from 'react';

const { Dragger } = Upload;
const { Text } = Typography;

/**
 * FileUpload Component
 * 
 * A reusable file upload component with drag & drop support.
 * Supports single and multiple file uploads, file list display, and deletion.
 * 
 * @param {Object} props
 * @param {string} props.entityType - Type of entity (e.g., 'Supplier', 'Material')
 * @param {string} props.entityId - ID of the entity
 * @param {string} [props.fieldName='attachments'] - Field name for categorization
 * @param {boolean} [props.multiple=true] - Allow multiple files
 * @param {string} [props.accept] - Accepted file types (e.g., '.pdf,.jpg,.png')
 * @param {number} [props.maxSize=10485760] - Max file size in bytes (default 10MB)
 * @param {Function} [props.onChange] - Callback when files change
 * @param {boolean} [props.showUploadList=true] - Show upload list
 * @param {string} [props.listType='text'] - List type ('text', 'picture', 'picture-card')
 * @param {boolean} [props.disabled=false] - Disable upload
 */
const FileUpload = ({
  entityType,
  entityId,
  fieldName = 'attachments',
  multiple = true,
  accept,
  maxSize = 10485760, // 10MB
  onChange,
  showUploadList = true,
  listType = 'text',
  disabled = false
}) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing attachments
  useEffect(() => {
    if (entityType && entityId) {
      loadAttachments();
    }
  }, [entityType, entityId, fieldName]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const response = await request.get({
        entity: `attachments/${entityType}/${entityId}`,
        options: {
          params: { fieldName }
        }
      });

      if (response.success && response.result) {
        const attachments = response.result.map(file => ({
          uid: file.id,
          name: file.originalName,
          status: 'done',
          url: file.url,
          size: file.size,
          type: file.mimeType,
          response: file
        }));
        setFileList(attachments);
        onChange && onChange(attachments);
      }
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const customUpload = async ({ file, onSuccess, onError, onProgress }) => {
    if (!entityType || !entityId) {
      message.error('Entity type and ID are required');
      onError(new Error('Entity type and ID required'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('fieldName', fieldName);

    try {
      setUploading(true);

      const response = await request.upload({
        entity: 'attachments/upload',
        data: formData,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent });
        }
      });

      if (response.success) {
        message.success(`${file.name} uploaded successfully`);
        onSuccess(response.result, file);
        
        // Reload attachments
        loadAttachments();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      message.error(`${file.name} upload failed: ${error.message}`);
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (file) => {
    Modal.confirm({
      title: 'Delete File',
      content: `Are you sure you want to delete "${file.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const attachmentId = file.uid || file.response?.id;
          
          const response = await request.delete({
            entity: `attachments/${attachmentId}`
          });

          if (response.success) {
            message.success('File deleted successfully');
            
            // Update file list
            setFileList(prev => prev.filter(f => f.uid !== file.uid));
            onChange && onChange(fileList.filter(f => f.uid !== file.uid));
          } else {
            throw new Error(response.message || 'Delete failed');
          }
        } catch (error) {
          message.error(`Failed to delete file: ${error.message}`);
        }
      }
    });
  };

  const handleDownload = async (file) => {
    try {
      const attachmentId = file.uid || file.response?.id;
      const url = file.url || `/download/attachment/${attachmentId}`;
      
      // Open in new tab to trigger download
      window.open(url, '_blank');
      message.success('Download started');
    } catch (error) {
      message.error(`Failed to download file: ${error.message}`);
    }
  };

  const beforeUpload = (file) => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      message.error(`File size ${fileSizeMB}MB exceeds maximum ${maxSizeMB}MB`);
      return Upload.LIST_IGNORE;
    }

    // Check file type if accept is specified
    if (accept) {
      const allowedTypes = accept.split(',').map(t => t.trim());
      const fileExt = '.' + file.name.split('.').pop();
      
      if (!allowedTypes.includes(fileExt)) {
        message.error(`File type ${fileExt} is not allowed. Allowed types: ${accept}`);
        return Upload.LIST_IGNORE;
      }
    }

    return true;
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileOutlined />;
    
    if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (mimeType.includes('word')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) 
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (mimeType.includes('image')) return <FileImageOutlined style={{ color: '#722ed1' }} />;
    if (mimeType.includes('text')) return <FileTextOutlined />;
    if (mimeType.includes('zip')) return <FileZipOutlined />;
    
    return <FileOutlined />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadProps = {
    multiple,
    fileList,
    customRequest: customUpload,
    beforeUpload,
    onRemove: handleRemove,
    disabled: disabled || !entityType || !entityId,
    showUploadList: false, // We'll use custom list
    accept
  };

  return (
    <div className="file-upload-container">
      <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          {multiple ? 'Support for single or bulk upload.' : 'Support for single file upload.'}
          {accept && ` Accepted formats: ${accept}`}
          {` Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
        </p>
      </Dragger>

      {showUploadList && fileList.length > 0 && (
        <List
          loading={loading}
          dataSource={fileList}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(file)}
                  size="small"
                >
                  Download
                </Button>,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file)}
                  size="small"
                  disabled={disabled}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.type)}
                title={
                  <Space>
                    <Text>{file.name}</Text>
                    {file.status === 'uploading' && <Tag color="processing">Uploading</Tag>}
                    {file.status === 'done' && <Tag color="success">Uploaded</Tag>}
                    {file.status === 'error' && <Tag color="error">Failed</Tag>}
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">{formatFileSize(file.size)}</Text>
                    {file.response?.uploadedAt && (
                      <Text type="secondary">
                        • {new Date(file.response.uploadedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      {!entityType || !entityId ? (
        <Text type="warning">
          Please save the record first before uploading files.
        </Text>
      ) : null}
    </div>
  );
};

export default FileUpload;

