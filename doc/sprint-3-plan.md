# 📋 **Sprint 3: Supplier Management Module**

**Sprint:** 3  
**Duration:** Weeks 9-12 (Estimated: 2-3 weeks actual)  
**Started:** January 5, 2026  
**Status:** 📋 **Planning Complete → Ready for Execution**  
**Overall Progress:** 0%

---

## 🎯 **Sprint Goals**

1. ⏳ **Complete Supplier Management Module** with full CRUD operations
2. ⏳ **Implement Supplier Approval Workflow** for new supplier onboarding
3. ⏳ **Build Comprehensive Supplier UI** with forms, lists, filters
4. ⏳ **Integrate File Attachments** for supplier documents
5. ⏳ **Implement Supplier Excel Export** with Chinese localization

---

## 📊 **User Stories**

### **Story 1: Create Suppliers**
```
As a data entry personnel
I want to create new suppliers with complete information
So that we can manage our supplier database

Acceptance Criteria:
- Can enter all supplier information
- Can upload required documents
- Supplier gets unique auto-generated number
- System validates required fields
- Changes are audited
```

### **Story 2: Attach Documents**
```
As a data entry personnel
I want to attach required documents to suppliers
So that we have proof of credentials and certifications

Acceptance Criteria:
- Can upload multiple documents per supplier
- Can categorize documents (license, certificate, etc.)
- Can download and view documents
- Can delete documents with confirmation
```

### **Story 3: Search & Filter**
```
As a purchaser
I want to search and filter suppliers
So that I can quickly find suitable suppliers for purchases

Acceptance Criteria:
- Can search by name, code, category
- Can filter by status, type, rating
- Results display instantly
- Can export filtered results
```

### **Story 4: Approve Suppliers**
```
As a procurement manager
I want to approve new suppliers
So that only qualified suppliers are active in the system

Acceptance Criteria:
- New suppliers require approval
- Can review all supplier information
- Can approve or reject with comments
- Status changes are tracked
- Notifications sent to submitter
```

### **Story 5: Export to Excel**
```
As a user
I want to export supplier list to Excel
So that I can work with data offline or share with others

Acceptance Criteria:
- One-click export
- All fields included
- Chinese column headers
- Professional formatting
- Includes all filtered results
```

---

## 📅 **Sprint Timeline**

### **Week 1: Backend Foundation** (Days 1-5)

#### **Day 1: Supplier Model & Schema**
- [ ] Define Supplier model schema
- [ ] Add validation rules
- [ ] Create indexes
- [ ] Add instance methods
- [ ] Add static methods
- [ ] Write unit tests (25+ tests)

#### **Day 2-3: Supplier CRUD APIs**
- [ ] Create supplier controller
- [ ] Implement create endpoint
- [ ] Implement read/list endpoints
- [ ] Implement update endpoint
- [ ] Implement delete endpoint (soft delete)
- [ ] Add RBAC middleware
- [ ] Write API tests (30+ tests)

#### **Day 4: Supplier Number Generation**
- [ ] Create number generation service
- [ ] Implement auto-increment logic
- [ ] Add prefix configuration
- [ ] Handle concurrent requests
- [ ] Write tests

#### **Day 5: Supplier Workflow**
- [ ] Configure supplier approval workflow
- [ ] Create workflow instance on submission
- [ ] Integrate with WorkflowEngine
- [ ] Add approval/rejection endpoints
- [ ] Write workflow tests

---

### **Week 2: Frontend Components** (Days 6-10)

#### **Day 6-7: SupplierForm Component**
- [ ] Create form layout
- [ ] Add all input fields
- [ ] Implement validation
- [ ] Add file upload integration
- [ ] Add save/submit logic
- [ ] Handle edit mode
- [ ] Add loading states
- [ ] Bilingual support (EN/ZH)

#### **Day 8: SupplierDataTable Component**
- [ ] Create table with columns
- [ ] Add pagination
- [ ] Add sorting
- [ ] Add row actions (view, edit, delete)
- [ ] Add bulk actions
- [ ] Add search bar
- [ ] Integrate with backend API

#### **Day 9: SupplierDetail & Filter**
- [ ] Create detail view component
- [ ] Add tabs (info, documents, history)
- [ ] Create filter component
- [ ] Add filter chips
- [ ] Connect filters to table

#### **Day 10: Integration & Polish**
- [ ] Integrate FileUpload component
- [ ] Add ExportButton component
- [ ] Connect all components
- [ ] Add routing
- [ ] UI/UX polish

---

### **Week 3: Testing & Documentation** (Days 11-15)

#### **Day 11-12: Backend Testing**
- [ ] Run all backend tests
- [ ] Fix any failures
- [ ] Add edge case tests
- [ ] Test workflow integration
- [ ] Test file attachments

#### **Day 13: Frontend Testing**
- [ ] Manual UI testing
- [ ] Test all CRUD operations
- [ ] Test file upload/download
- [ ] Test Excel export
- [ ] Test filters and search
- [ ] Cross-browser testing

#### **Day 14: Integration Testing**
- [ ] End-to-end workflow test
- [ ] Test with real data
- [ ] Performance testing
- [ ] Security testing
- [ ] Load testing

#### **Day 15: Documentation**
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Sprint summary

---

## 🗂️ **Technical Specifications**

### **1. Supplier Model**

**File:** `backend/src/models/appModels/Supplier.js`

**Schema:**
```javascript
{
  // Basic Information
  supplierNumber: String,          // Auto-generated, unique (SUP-20260105-001)
  companyName: {
    zh: String,                    // Chinese name
    en: String                     // English name
  },
  abbreviation: String,            // Short name
  type: String,                    // 'manufacturer', 'distributor', 'agent'
  category: [String],              // ['Electronics', 'Components']
  status: String,                  // 'draft', 'pending_approval', 'active', 'inactive', 'blacklisted'
  
  // Contact Information
  contact: {
    primaryContact: String,
    phone: String,
    mobile: String,
    email: String,
    fax: String,
    website: String
  },
  
  // Address Information
  address: {
    country: String,
    province: String,
    city: String,
    district: String,
    street: String,
    postalCode: String,
    fullAddress: String
  },
  
  // Business Information
  businessInfo: {
    registrationNumber: String,     // 营业执照号
    taxNumber: String,              // 税号
    legalRepresentative: String,    // 法人代表
    registeredCapital: Number,      // 注册资本
    establishedDate: Date,          // 成立日期
    businessScope: String           // 经营范围
  },
  
  // Banking Information
  banking: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    swiftCode: String,
    branchName: String
  },
  
  // Credit Information
  creditInfo: {
    creditRating: String,           // 'A', 'B', 'C', 'D'
    creditLimit: Number,            // 信用额度
    paymentTerms: String,           // '30 days', '60 days', etc.
    currency: String                // 'CNY', 'USD', etc.
  },
  
  // Qualification Documents
  documents: {
    businessLicense: [ObjectId],    // Attachment IDs
    taxCertificate: [ObjectId],
    qualityCertificates: [ObjectId],
    otherDocuments: [ObjectId]
  },
  
  // Performance Metrics
  performance: {
    qualityRating: Number,          // 1-5
    deliveryRating: Number,         // 1-5
    serviceRating: Number,          // 1-5
    totalOrders: Number,
    totalAmount: Number,
    onTimeDeliveryRate: Number,     // Percentage
    qualityPassRate: Number         // Percentage
  },
  
  // Workflow
  workflow: {
    currentWorkflowId: ObjectId,
    approvalStatus: String,         // 'pending', 'approved', 'rejected'
    approvedBy: ObjectId,
    approvedAt: Date,
    rejectedBy: ObjectId,
    rejectedAt: Date,
    rejectionReason: String
  },
  
  // Metadata
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date,
  removed: Boolean,
  removedAt: Date,
  removedBy: ObjectId,
  
  // Additional Fields
  notes: String,
  tags: [String],
  customFields: Map                 // For extensibility
}
```

**Validation Rules:**
- `companyName.zh` or `companyName.en` required
- `supplierNumber` unique, auto-generated
- `type` enum: ['manufacturer', 'distributor', 'agent', 'other']
- `status` enum: ['draft', 'pending_approval', 'active', 'inactive', 'blacklisted']
- `contact.email` format validation
- `contact.phone` format validation
- `banking.accountNumber` min length 8

**Indexes:**
- `supplierNumber` (unique)
- `companyName.zh` (text search)
- `companyName.en` (text search)
- `status`
- `type`
- `createdAt` (descending)

**Instance Methods:**
- `submitForApproval()` - Start approval workflow
- `approve(userId)` - Approve supplier
- `reject(userId, reason)` - Reject supplier
- `activate()` - Set status to active
- `deactivate()` - Set status to inactive
- `addToBlacklist(reason)` - Blacklist supplier
- `updatePerformance(metrics)` - Update performance metrics
- `format()` - Format for API response

**Static Methods:**
- `generateSupplierNumber()` - Generate unique number
- `findByNumber(number)` - Find by supplier number
- `search(query)` - Full-text search
- `findByStatus(status)` - Find by status
- `findByType(type)` - Find by type
- `getStatistics()` - Get supplier statistics

---

### **2. Supplier API Endpoints**

**Base Path:** `/api/suppliers`

#### **Create Supplier**
```
POST /api/suppliers
Auth: Required
Permission: supplier:create

Body:
{
  "companyName": { "zh": "供应商名称", "en": "Supplier Name" },
  "type": "manufacturer",
  "contact": { "email": "...", "phone": "..." },
  ...
}

Response:
{
  "success": true,
  "message": "Supplier created successfully",
  "result": { supplier data }
}
```

#### **List Suppliers**
```
GET /api/suppliers
Auth: Required
Permission: supplier:read

Query Params:
- page: 1
- items: 10
- status: 'active'
- type: 'manufacturer'
- search: 'keyword'
- sortBy: 'createdAt'
- sortOrder: 'desc'

Response:
{
  "success": true,
  "result": [{ supplier1 }, { supplier2 }, ...],
  "pagination": {
    "page": 1,
    "pages": 10,
    "count": 100
  }
}
```

#### **Get Supplier**
```
GET /api/suppliers/:id
Auth: Required
Permission: supplier:read

Response:
{
  "success": true,
  "result": { supplier data with populated references }
}
```

#### **Update Supplier**
```
PATCH /api/suppliers/:id
Auth: Required
Permission: supplier:update

Body: { fields to update }

Response:
{
  "success": true,
  "message": "Supplier updated successfully",
  "result": { updated supplier }
}
```

#### **Delete Supplier**
```
DELETE /api/suppliers/:id
Auth: Required
Permission: supplier:delete

Response:
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

#### **Submit for Approval**
```
POST /api/suppliers/:id/submit
Auth: Required
Permission: supplier:submit

Response:
{
  "success": true,
  "message": "Supplier submitted for approval",
  "result": { supplier with workflow info }
}
```

#### **Approve Supplier**
```
POST /api/suppliers/:id/approve
Auth: Required
Permission: supplier:approve

Body: { "comments": "Approved for quality" }

Response:
{
  "success": true,
  "message": "Supplier approved successfully",
  "result": { approved supplier }
}
```

#### **Reject Supplier**
```
POST /api/suppliers/:id/reject
Auth: Required
Permission: supplier:approve

Body: { "reason": "Incomplete documents" }

Response:
{
  "success": true,
  "message": "Supplier rejected",
  "result": { rejected supplier }
}
```

#### **Export Suppliers**
```
GET /api/suppliers/export
Auth: Required
Permission: supplier:read

Query Params: (same as list)

Response: Excel file (binary)
```

---

### **3. Frontend Components**

#### **SupplierForm**
- **Path:** `frontend/src/forms/SupplierForm.jsx`
- **Features:**
  - Multi-tab layout (Basic, Contact, Business, Banking, Documents)
  - Bilingual input (ZH/EN for company name)
  - File upload integration
  - Validation
  - Save draft / Submit for approval
  - Edit existing supplier
  - Loading states

#### **SupplierModule**
- **Path:** `frontend/src/modules/SupplierModule/index.jsx`
- **Features:**
  - DataTable with pagination
  - Search and filters
  - Row actions (view, edit, delete, approve)
  - Bulk actions
  - Export button
  - Create new supplier button

#### **SupplierPage**
- **Path:** `frontend/src/pages/Supplier/index.jsx`
- **Features:**
  - Breadcrumb navigation
  - Page header with actions
  - Integration with SupplierModule
  - Route configuration

#### **SupplierDetailView**
- **Path:** `frontend/src/pages/SupplierDetail/index.jsx`
- **Features:**
  - Tabbed interface
  - Basic information display
  - Documents list
  - Approval history
  - Performance metrics
  - Edit/Approve buttons

---

## ✅ **Definition of Done**

Sprint 3 is complete when:

### **Backend:**
- [x] ✅ Supplier model created with validations
- [ ] ⏳ Supplier CRUD APIs implemented
- [ ] ⏳ Supplier number generation working
- [ ] ⏳ Supplier approval workflow integrated
- [ ] ⏳ File attachments integrated
- [ ] ⏳ Excel export implemented
- [ ] ⏳ 80%+ test coverage
- [ ] ⏳ API documentation complete

### **Frontend:**
- [ ] ⏳ SupplierForm component complete
- [ ] ⏳ SupplierDataTable component complete
- [ ] ⏳ SupplierDetail component complete
- [ ] ⏳ Filter component complete
- [ ] ⏳ Routing configured
- [ ] ⏳ Integration with backend working
- [ ] ⏳ Responsive design
- [ ] ⏳ Bilingual support (EN/ZH)

### **Testing:**
- [ ] ⏳ All unit tests passing
- [ ] ⏳ Integration tests passing
- [ ] ⏳ Manual testing complete
- [ ] ⏳ Performance acceptable
- [ ] ⏳ No critical bugs

### **Documentation:**
- [ ] ⏳ API endpoints documented
- [ ] ⏳ Component usage documented
- [ ] ⏳ User guide created
- [ ] ⏳ Admin guide created
- [ ] ⏳ Sprint summary written

---

## 📈 **Success Metrics**

### **Functional:**
- ✅ Users can create suppliers
- ✅ Users can attach documents
- ✅ Users can search/filter suppliers
- ✅ Managers can approve suppliers
- ✅ Users can export to Excel
- ✅ Workflow progresses correctly

### **Performance:**
- ✅ List loads < 2s for 1000 suppliers
- ✅ Search results < 1s
- ✅ Form save < 1s
- ✅ Excel export < 10s for 1000 suppliers

### **Quality:**
- ✅ 80%+ test coverage
- ✅ No critical bugs
- ✅ Security validated
- ✅ RBAC enforced

---

## 🚧 **Risks & Mitigation**

### **Risk 1: Complex Form**
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:** Use tabs to organize, progressive disclosure, save drafts

### **Risk 2: File Upload Performance**
**Impact:** Medium  
**Probability:** Low  
**Mitigation:** Use Sprint 2 FileUpload component, already tested

### **Risk 3: Workflow Complexity**
**Impact:** High  
**Probability:** Low  
**Mitigation:** Use Sprint 1 WorkflowEngine, already tested

### **Risk 4: Data Migration**
**Impact:** Low  
**Probability:** Low  
**Mitigation:** No existing data to migrate for new module

---

## 🎓 **Learning Resources**

- Sprint 1 WorkflowEngine documentation
- Sprint 2 FileUpload component guide
- Ant Design Form components
- Ant Design Table components
- MongoDB text search
- ExcelJS library

---

## 📝 **Notes**

### **Decision: Bilingual Support**
- Both Chinese and English for company names
- UI supports language toggle
- Excel export headers in Chinese
- API responses support both languages

### **Decision: Soft Delete**
- Suppliers are never hard deleted
- Maintain history and audit trail
- Can be restored if needed

### **Decision: Auto-Number Generation**
- Format: SUP-YYYYMMDD-NNN
- Sequential within day
- Prevents duplicates

### **Decision: Approval Workflow**
- New suppliers require approval
- Use existing WorkflowEngine from Sprint 1
- Configurable approval levels
- Email notifications (future)

---

## ✅ **Next Steps**

To start Sprint 3:

1. **Review this plan** with team ✅
2. **Start with Supplier model** (Day 1)
3. **Build incrementally** (test as you go)
4. **Deploy to staging** when complete

---

**Status:** 📋 **Plan Ready - Starting Execution Now**  
**Estimated Completion:** 2-3 weeks from start  
**Blockers:** None  
**Dependencies:** Sprint 1 & Sprint 2 complete ✅

---

**Created:** January 5, 2026  
**Last Updated:** January 5, 2026  
**Sprint Lead:** Development Team

