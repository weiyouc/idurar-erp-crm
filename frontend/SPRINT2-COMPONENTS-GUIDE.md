# 📦 Sprint 2 Components Guide

**Components:** FileUpload & ExportButton  
**Created:** January 5, 2026  
**Status:** ✅ Complete

---

## 📑 Table of Contents

1. [FileUpload Component](#fileupload-component)
2. [ExportButton Component](#exportbutton-component)
3. [Integration Examples](#integration-examples)
4. [API Reference](#api-reference)
5. [Troubleshooting](#troubleshooting)

---

## 🗂️ FileUpload Component

### **Overview**

A comprehensive file upload component with drag & drop support, file list display, and management capabilities.

### **Features**

✅ Drag & drop file upload  
✅ Multiple file upload support  
✅ File type validation  
✅ File size validation  
✅ Upload progress indication  
✅ File list display with icons  
✅ Download functionality  
✅ Delete with confirmation  
✅ Automatic attachment loading  
✅ Bilingual support (EN/ZH)

### **Location**

```
frontend/src/components/FileUpload/index.jsx
```

### **Basic Usage**

```jsx
import FileUpload from '@/components/FileUpload';

// In your component
<FileUpload
  entityType="Supplier"
  entityId={supplierId}
  fieldName="businessLicense"
  accept=".pdf,.jpg,.png"
  maxSize={10485760}  // 10MB
  multiple={false}
/>
```

### **Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | string | **Required** | Entity type ('Supplier', 'Material', etc.) |
| `entityId` | string | **Required** | ID of the entity |
| `fieldName` | string | `'attachments'` | Field name for categorization |
| `multiple` | boolean | `true` | Allow multiple files |
| `accept` | string | - | Accepted file types (e.g., '.pdf,.jpg') |
| `maxSize` | number | `10485760` | Max file size in bytes (10MB default) |
| `onChange` | function | - | Callback when files change |
| `showUploadList` | boolean | `true` | Show upload list |
| `listType` | string | `'text'` | List type ('text', 'picture', 'picture-card') |
| `disabled` | boolean | `false` | Disable upload |

### **Examples**

#### **Example 1: Single PDF Upload**

```jsx
<FileUpload
  entityType="Supplier"
  entityId={supplier._id}
  fieldName="businessLicense"
  accept=".pdf"
  multiple={false}
  maxSize={5242880}  // 5MB
/>
```

#### **Example 2: Multiple Image Upload**

```jsx
<FileUpload
  entityType="Material"
  entityId={material._id}
  fieldName="productImages"
  accept=".jpg,.jpeg,.png"
  multiple={true}
  listType="picture-card"
  onChange={(files) => console.log('Files changed:', files)}
/>
```

#### **Example 3: Document Upload with Callback**

```jsx
<FileUpload
  entityType="PurchaseOrder"
  entityId={po._id}
  fieldName="attachments"
  accept=".pdf,.doc,.docx,.xls,.xlsx"
  onChange={(files) => {
    setAttachmentCount(files.length);
  }}
/>
```

### **Supported File Types**

The component automatically displays appropriate icons for:

- 📄 **PDF** - Red icon
- 📘 **Word** - Blue icon
- 📗 **Excel** - Green icon
- 🖼️ **Images** - Purple icon
- 📝 **Text** - Default icon
- 🗜️ **ZIP** - Archive icon

### **File Size Formatting**

Automatically formats file sizes:
- < 1KB: "X Bytes"
- < 1MB: "X.XX KB"
- < 1GB: "X.XX MB"
- ≥ 1GB: "X.XX GB"

### **Error Handling**

- Shows error message if entity type/ID missing
- Validates file size before upload
- Validates file type before upload
- Displays upload errors
- Handles delete errors

---

## 📤 ExportButton Component

### **Overview**

A reusable button component for exporting data to Excel format with loading states and success feedback.

### **Features**

✅ One-click export to Excel  
✅ Loading state indication  
✅ Success/error feedback  
✅ Custom filenames  
✅ Filter support  
✅ Dropdown for multiple export types  
✅ Automatic timestamp in filename  

### **Location**

```
frontend/src/components/ExportButton/index.jsx
```

### **Basic Usage**

```jsx
import ExportButton from '@/components/ExportButton';

// In your component
<ExportButton
  entity="suppliers"
  exportType="supplier"
  filters={{ status: 'active' }}
  filename="active-suppliers"
/>
```

### **Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | string | **Required** | Entity type to export |
| `exportType` | string | - | Specific export type |
| `filters` | object | `{}` | Filters to apply |
| `filename` | string | auto-generated | Custom filename (without .xlsx) |
| `buttonText` | string | `'Export to Excel'` | Button text |
| `buttonType` | string | `'default'` | Button type |
| `size` | string | `'middle'` | Button size |
| `icon` | boolean | `true` | Show icon |
| `disabled` | boolean | `false` | Disable button |
| `onSuccess` | function | - | Success callback |
| `onError` | function | - | Error callback |
| `exportOptions` | array | - | Multiple export options |

### **Examples**

#### **Example 1: Simple Export**

```jsx
<ExportButton
  entity="suppliers"
  exportType="supplier"
  buttonText="Export Suppliers"
  buttonType="primary"
/>
```

#### **Example 2: Export with Filters**

```jsx
<ExportButton
  entity="materials"
  exportType="material"
  filters={{
    category: 'Electronics',
    status: 'active',
    supplier: selectedSupplier
  }}
  filename="electronics-materials"
  onSuccess={(filename) => {
    console.log('Exported:', filename);
  }}
/>
```

#### **Example 3: Multiple Export Options (Dropdown)**

```jsx
<ExportButton
  entity="reports"
  buttonText="Export Reports"
  exportOptions={[
    {
      key: 'supplier',
      label: 'Supplier List',
      exportType: 'supplier',
      filename: 'suppliers'
    },
    {
      key: 'material',
      label: 'Material List',
      exportType: 'material',
      filename: 'materials'
    },
    {
      key: 'mrp',
      label: 'MRP Report',
      exportType: 'mrp',
      filename: 'mrp-report'
    }
  ]}
/>
```

#### **Example 4: Export with Callbacks**

```jsx
<ExportButton
  entity="purchaseOrders"
  exportType="purchaseOrder"
  filters={currentFilters}
  onSuccess={(filename) => {
    message.success(`Successfully exported: ${filename}`);
    logExportAction('purchaseOrder', filename);
  }}
  onError={(error) => {
    console.error('Export failed:', error);
    reportError('export_error', error);
  }}
/>
```

### **Export Types Available**

Based on Sprint 1 ExcelExportService:

1. **`supplier`** - Supplier list export
2. **`material`** - Material list export
3. **`mrp`** - MRP calculation report
4. **`purchaseOrder`** - Purchase order list
5. **`inventory`** - Inventory report
6. **`custom`** - Custom data export

---

## 🔗 Integration Examples

### **Integration 1: Supplier Form**

```jsx
import React, { useState } from 'react';
import { Form, Input, Button, Divider } from 'antd';
import FileUpload from '@/components/FileUpload';

const SupplierForm = ({ supplier, onSubmit }) => {
  const [form] = Form.useForm();
  const [supplierId, setSupplierId] = useState(supplier?._id);

  const handleSubmit = async (values) => {
    const result = await onSubmit(values);
    if (result && result._id) {
      setSupplierId(result._id);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item label="Company Name" name="companyName">
        <Input />
      </Form.Item>
      
      <Form.Item label="Contact Person" name="contactPerson">
        <Input />
      </Form.Item>

      <Divider>Attachments</Divider>

      <Form.Item label="Business License">
        <FileUpload
          entityType="Supplier"
          entityId={supplierId}
          fieldName="businessLicense"
          accept=".pdf,.jpg,.png"
          multiple={false}
        />
      </Form.Item>

      <Form.Item label="Certificates">
        <FileUpload
          entityType="Supplier"
          entityId={supplierId}
          fieldName="certificates"
          accept=".pdf"
          multiple={true}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save Supplier
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SupplierForm;
```

### **Integration 2: List Page with Export**

```jsx
import React, { useState, useEffect } from 'react';
import { Table, Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ExportButton from '@/components/ExportButton';
import { request } from '@/request';

const SupplierListPage = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const response = await request.get({
      entity: 'suppliers',
      options: { params: filters }
    });
    setData(response.result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const columns = [
    { title: 'Company Name', dataIndex: 'companyName', key: 'companyName' },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Status', dataIndex: 'status', key: 'status' }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Supplier
        </Button>
        
        <ExportButton
          entity="suppliers"
          exportType="supplier"
          filters={filters}
          filename="suppliers-export"
          buttonText="Export to Excel"
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="_id"
      />
    </div>
  );
};

export default SupplierListPage;
```

### **Integration 3: Detail View with Attachments**

```jsx
import React from 'react';
import { Descriptions, Card, Tabs } from 'antd';
import FileUpload from '@/components/FileUpload';

const { TabPane } = Tabs;

const SupplierDetailView = ({ supplier }) => {
  return (
    <Card>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Basic Info" key="1">
          <Descriptions bordered>
            <Descriptions.Item label="Company Name">
              {supplier.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Person">
              {supplier.contactPerson}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {supplier.status}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        <TabPane tab="Attachments" key="2">
          <Card title="Business License" style={{ marginBottom: 16 }}>
            <FileUpload
              entityType="Supplier"
              entityId={supplier._id}
              fieldName="businessLicense"
              accept=".pdf,.jpg,.png"
              multiple={false}
            />
          </Card>

          <Card title="Certificates">
            <FileUpload
              entityType="Supplier"
              entityId={supplier._id}
              fieldName="certificates"
              accept=".pdf"
              multiple={true}
            />
          </Card>

          <Card title="Other Documents" style={{ marginTop: 16 }}>
            <FileUpload
              entityType="Supplier"
              entityId={supplier._id}
              fieldName="documents"
              multiple={true}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default SupplierDetailView;
```

---

## 📡 API Reference

### **Backend Endpoints**

#### **Upload Endpoints**

```
POST /api/attachments/upload
Body (multipart/form-data):
  - file: File
  - entityType: String
  - entityId: String
  - fieldName: String (optional)
  - description: String (optional)
  - tags: String (JSON array, optional)

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "result": {
    "id": "...",
    "originalName": "...",
    "url": "...",
    ...
  }
}
```

```
POST /api/attachments/upload-multiple
Body (multipart/form-data):
  - files: File[]
  - entityType: String
  - entityId: String
  - fieldName: String (optional)

Response:
{
  "success": true,
  "message": "Uploaded 3 of 3 files",
  "result": {
    "uploaded": [...],
    "failed": [],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  }
}
```

#### **Retrieval Endpoints**

```
GET /api/attachments/:entityType/:entityId?fieldName=...
Response:
{
  "success": true,
  "result": [
    {
      "id": "...",
      "originalName": "...",
      "mimeType": "...",
      "size": 123456,
      "url": "...",
      ...
    }
  ],
  "count": 2
}
```

```
GET /api/attachments/:id
GET /download/attachment/:id
```

#### **Delete Endpoints**

```
DELETE /api/attachments/:id
DELETE /api/attachments/:entityType/:entityId
```

#### **Export Endpoints**

```
GET /api/:entity/export?exportType=...&filters...
Response: Binary (Excel file)
```

---

## 🔧 Troubleshooting

### **Issue 1: "Please save the record first"**

**Problem:** FileUpload shows warning message  
**Cause:** `entityId` is not provided  
**Solution:** Ensure the record is saved before showing FileUpload

```jsx
{savedRecord?._id && (
  <FileUpload
    entityType="Supplier"
    entityId={savedRecord._id}
  />
)}
```

### **Issue 2: Files not uploading**

**Checklist:**
1. ✅ Is `entityType` provided?
2. ✅ Is `entityId` provided?
3. ✅ Is file size within limit?
4. ✅ Is file type accepted?
5. ✅ Is backend running?
6. ✅ Check browser console for errors

### **Issue 3: Export not working**

**Checklist:**
1. ✅ Is `entity` prop provided?
2. ✅ Does backend have export endpoint?
3. ✅ Check network tab for 404/500 errors
4. ✅ Verify `exportType` matches backend
5. ✅ Check browser popup blocker

### **Issue 4: Download not working**

**Problem:** Download link doesn't work  
**Solution:** Ensure backend `/download/attachment/:id` route is accessible

### **Issue 5: File size validation**

**Problem:** Large files rejected  
**Solution:** Adjust `maxSize` prop or update backend `MAX_FILE_SIZE`

```jsx
<FileUpload
  maxSize={20971520}  // 20MB
  ...
/>
```

```javascript
// Backend: .env
MAX_FILE_SIZE=20971520
```

---

## 🎨 Styling

### **Custom Styles**

```css
/* In your component CSS */
.file-upload-container .ant-upload-drag {
  border-color: #1890ff;
}

.file-upload-container .ant-upload-drag:hover {
  border-color: #40a9ff;
}

.file-upload-container .ant-list-item-meta-avatar {
  font-size: 24px;
}
```

### **Theming**

Both components use Ant Design theming. Customize via ConfigProvider:

```jsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#00b96b',
    },
  }}
>
  <FileUpload ... />
  <ExportButton ... />
</ConfigProvider>
```

---

## ✅ Best Practices

### **FileUpload**

1. ✅ Always validate on both client and server
2. ✅ Set reasonable `maxSize` limits
3. ✅ Use `accept` to limit file types
4. ✅ Provide clear feedback on errors
5. ✅ Disable upload until record is saved
6. ✅ Use descriptive `fieldName` values

### **ExportButton**

1. ✅ Use descriptive filenames
2. ✅ Include timestamp in filename
3. ✅ Provide loading feedback
4. ✅ Handle errors gracefully
5. ✅ Use dropdown for multiple export types
6. ✅ Apply filters before export

---

## 📚 Additional Resources

- [Ant Design Upload](https://ant.design/components/upload)
- [Ant Design Button](https://ant.design/components/button)
- [Backend API Documentation](../backend/src/models/README.md)
- [Sprint 2 Progress Report](../doc/sprint-2-progress.md)

---

**Last Updated:** January 5, 2026  
**Version:** 1.0.0

