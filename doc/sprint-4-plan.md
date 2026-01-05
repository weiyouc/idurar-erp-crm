# 📋 Sprint 4: Material Management

## 🎯 Goals
Complete material management module with full CRUD, categorization, UOM management, and Excel export.

## 📊 Sprint Overview
**Duration:** Weeks 13-16 (4 weeks)  
**Status:** 🚀 In Progress  
**Priority:** High

---

## 👥 User Stories

### US-4.1: Material Creation
**As an** engineer  
**I want to** create new materials with all necessary details  
**So that** I can manage our product catalog effectively

**Acceptance Criteria:**
- Material number auto-generation (MAT-YYYYMMDD-NNN format)
- Support for Chinese and English names
- Category assignment
- Multiple UOM support (base UOM + conversion factors)
- Specifications and technical details
- Supplier associations
- Image/document attachments

### US-4.2: Material Categories
**As a** user  
**I want to** define and manage material categories in a hierarchy  
**So that** materials are organized logically

**Acceptance Criteria:**
- Create/edit/delete categories
- Parent-child relationships
- Category codes
- Multiple levels of hierarchy
- Material count per category

### US-4.3: Unit of Measure (UOM) Management
**As a** user  
**I want to** manage multiple units of measure for materials  
**So that** I can handle different ordering and inventory units

**Acceptance Criteria:**
- Base UOM for each material
- Alternative UOMs with conversion factors
- Standard UOMs (pcs, kg, m, etc.)
- Custom UOMs

### US-4.4: Material Search
**As a** purchaser  
**I want to** search materials by various criteria  
**So that** I can quickly find what I need

**Acceptance Criteria:**
- Search by material number
- Search by name (CH/EN)
- Filter by category
- Filter by supplier
- Filter by status
- Full-text search

### US-4.5: Material Export
**As a** user  
**I want to** export material list to Excel  
**So that** I can share and analyze data offline

**Acceptance Criteria:**
- Export current list with filters applied
- Include all key fields
- Chinese column headers
- Proper formatting
- Download as .xlsx file

---

## 🗂️ Database Schema

### Material Model
```javascript
{
  // Basic Information
  materialNumber: String (unique, auto-generated),
  materialName: {
    zh: String (required),
    en: String
  },
  abbreviation: String,
  category: ObjectId (ref: 'MaterialCategory'),
  type: Enum ['raw', 'semi-finished', 'finished', 'packaging', 'consumable', 'other'],
  status: Enum ['draft', 'active', 'obsolete', 'discontinued'],
  
  // Classification
  hsCode: String, // Harmonized System code
  brand: String,
  model: String,
  manufacturer: String,
  
  // Units of Measure
  baseUOM: String (required, default: 'pcs'),
  alternativeUOMs: [{
    uom: String,
    conversionFactor: Number, // Factor to convert to base UOM
    isPurchasing: Boolean,
    isInventory: Boolean
  }],
  
  // Specifications
  specifications: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    volume: Number,
    color: String,
    material: String,
    finish: String,
    customFields: Map
  },
  
  // Purchasing
  preferredSuppliers: [{
    supplier: ObjectId (ref: 'Supplier'),
    supplierPN: String, // Supplier part number
    leadTime: Number, // in days
    moq: Number, // Minimum order quantity
    isPrimary: Boolean
  }],
  defaultLeadTime: Number,
  minimumOrderQty: Number,
  
  // Pricing
  standardCost: Number,
  currency: String (default: 'CNY'),
  lastPurchasePrice: Number,
  lastPurchaseDate: Date,
  
  // Inventory
  safetyStock: Number,
  reorderPoint: Number,
  maxStockLevel: Number,
  currentStock: Number (virtual field),
  
  // Attachments
  images: [ObjectId] (ref: 'Attachment'),
  documents: [ObjectId] (ref: 'Attachment'), // Specs, certificates, etc.
  
  // Metadata
  createdBy: ObjectId (ref: 'Admin'),
  createdAt: Date,
  updatedBy: ObjectId (ref: 'Admin'),
  updatedAt: Date,
  removed: Boolean (default: false),
  removedAt: Date,
  removedBy: ObjectId,
  
  // Additional
  notes: String,
  tags: [String],
  customFields: Map
}
```

### MaterialCategory Model
```javascript
{
  code: String (unique, required), // e.g., "RAW001"
  name: {
    zh: String (required),
    en: String
  },
  parent: ObjectId (ref: 'MaterialCategory'), // For hierarchy
  level: Number, // Depth in hierarchy (0 = root)
  path: String, // Full path like "/Electronics/Components/Resistors"
  description: String,
  displayOrder: Number,
  isActive: Boolean (default: true),
  
  // Metadata
  createdBy: ObjectId (ref: 'Admin'),
  createdAt: Date,
  updatedBy: ObjectId (ref: 'Admin'),
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Material Endpoints

#### Create Material
```
POST /api/materials
Headers: Authorization: Bearer <token>
Body: materialData
Response: { success, result: material, message }
```

#### List Materials
```
GET /api/materials
Headers: Authorization: Bearer <token>
Query Parameters:
  - page, items (pagination)
  - sortBy, sortOrder
  - search (text search)
  - category (filter)
  - type (filter)
  - status (filter)
  - supplier (filter)
Response: { success, result: [materials], pagination, message }
```

#### Get Material by ID
```
GET /api/materials/:id
Headers: Authorization: Bearer <token>
Response: { success, result: material, message }
```

#### Update Material
```
PATCH /api/materials/:id
Headers: Authorization: Bearer <token>
Body: updateData
Response: { success, result: material, message }
```

#### Delete Material (Soft)
```
DELETE /api/materials/:id
Headers: Authorization: Bearer <token>
Response: { success, message }
```

#### Restore Material
```
PATCH /api/materials/:id/restore
Headers: Authorization: Bearer <token>
Response: { success, result: material, message }
```

#### Activate/Deactivate Material
```
POST /api/materials/:id/activate
POST /api/materials/:id/deactivate
Headers: Authorization: Bearer <token>
Response: { success, result: material, message }
```

#### Get Material Statistics
```
GET /api/materials/stats
Headers: Authorization: Bearer <token>
Response: { success, result: stats, message }
```

#### Export Materials to Excel
```
GET /api/materials/export
Headers: Authorization: Bearer <token>
Query Parameters: (same as list filters)
Response: Excel file download
```

### Material Category Endpoints

#### Create Category
```
POST /api/material-categories
Headers: Authorization: Bearer <token>
Body: { code, name, parent, description }
Response: { success, result: category, message }
```

#### List Categories
```
GET /api/material-categories
Headers: Authorization: Bearer <token>
Query Parameters: hierarchical (Boolean)
Response: { success, result: [categories], message }
```

#### Get Category Tree
```
GET /api/material-categories/tree
Headers: Authorization: Bearer <token>
Response: { success, result: treeStructure, message }
```

#### Update Category
```
PATCH /api/material-categories/:id
Headers: Authorization: Bearer <token>
Body: updateData
Response: { success, result: category, message }
```

#### Delete Category
```
DELETE /api/material-categories/:id
Headers: Authorization: Bearer <token>
Response: { success, message }
```

---

## 🎨 Frontend Components

### 1. MaterialForm Component
**File:** `frontend/src/forms/MaterialForm.jsx`

**Features:**
- Tabbed interface (Basic Info, Specifications, Suppliers, Pricing, Inventory)
- Material number display (auto-generated, read-only)
- Bilingual name inputs (zh/en)
- Category dropdown (hierarchical)
- Type and status dropdowns
- Base UOM with alternative UOMs (dynamic add/remove)
- Specification fields with units
- Supplier association with lead time and MOQ
- Pricing fields with currency
- Inventory parameters
- File upload for images and documents
- Tags input
- Notes textarea

### 2. MaterialModule Component
**File:** `frontend/src/modules/MaterialModule/index.jsx`

**Features:**
- Data table with all materials
- Column configuration
- Inline actions (view, edit, delete, activate/deactivate)
- Pagination
- Sorting
- Filtering panel integration
- Search bar
- Export button
- Create new button

### 3. MaterialPage Component
**File:** `frontend/src/pages/Material/index.jsx`

**Features:**
- Page layout wrapper
- Module integration
- Breadcrumb navigation

### 4. MaterialFilter Component
**Integrated in MaterialModule**

**Features:**
- Category filter (tree select)
- Type filter (checkboxes)
- Status filter (checkboxes)
- Supplier filter (select)
- Search by material number or name
- Clear filters button

### 5. MaterialDetail Modal
**Integrated in MaterialModule**

**Features:**
- Comprehensive material information display
- Tabbed layout matching the form
- Supplier details
- Pricing history
- Stock information
- Attached files preview
- Edit and delete buttons

---

## 🧪 Testing Strategy

### Unit Tests
1. **Material Model Tests** (`backend/tests/models/Material.test.js`)
   - Schema validation
   - Material number generation
   - Instance methods
   - Static methods
   - Virtual fields

2. **MaterialCategory Model Tests** (`backend/tests/models/MaterialCategory.test.js`)
   - Schema validation
   - Hierarchy management
   - Path generation
   - Tree structure methods

3. **MaterialService Tests** (`backend/tests/services/MaterialService.test.js`)
   - CRUD operations
   - Search and filtering
   - UOM conversions
   - Supplier associations
   - Statistics

### Integration Tests
1. **Material API Tests** (`backend/tests/controllers/materialController.test.js`)
   - All CRUD endpoints
   - Authentication and authorization
   - Error handling
   - Data validation

---

## 📅 Task Breakdown (Detailed)

### Week 1: Backend Foundation (Days 1-5)

#### Day 1: Material & Category Models
- [ ] Create MaterialCategory model (2-3 hours)
- [ ] Create Material model (4-5 hours)
- [ ] Add model validations
- [ ] Add indexes
- [ ] Document models

#### Day 2: Model Methods & Tests
- [ ] Implement Material instance methods (3 hours)
- [ ] Implement Material static methods (2 hours)
- [ ] Write Material model tests (3 hours)

#### Day 3: Material Service
- [ ] Create MaterialService class (4 hours)
- [ ] Implement CRUD methods (4 hours)

#### Day 4: Material Service (continued)
- [ ] Implement search/filter methods (3 hours)
- [ ] Implement statistics methods (2 hours)
- [ ] Write MaterialService tests (3 hours)

#### Day 5: Material APIs
- [ ] Create materialController (3 hours)
- [ ] Create materialRoutes (2 hours)
- [ ] Integrate with app.js (1 hour)
- [ ] Test APIs manually (2 hours)

### Week 2: Category Management & UOM (Days 6-10)

#### Day 6: Category Backend
- [ ] MaterialCategoryService (3 hours)
- [ ] materialCategoryController (2 hours)
- [ ] Category routes (1 hour)
- [ ] Category tests (2 hours)

#### Day 7: UOM Management
- [ ] UOM conversion logic (3 hours)
- [ ] UOM validation (2 hours)
- [ ] UOM tests (3 hours)

#### Day 8: Excel Export
- [ ] Material Excel export service (4 hours)
- [ ] Material export tests (2 hours)
- [ ] Integration with controller (2 hours)

#### Day 9: Supplier Integration
- [ ] Link materials to suppliers (3 hours)
- [ ] Preferred supplier logic (2 hours)
- [ ] Lead time calculations (2 hours)

#### Day 10: Testing & Fixes
- [ ] Run all backend tests (2 hours)
- [ ] Fix any failing tests (4 hours)
- [ ] Code review and cleanup (2 hours)

### Week 3: Frontend Components (Days 11-15)

#### Day 11-12: MaterialForm
- [ ] Create MaterialForm component (8 hours)
- [ ] Basic info tab (3 hours)
- [ ] Specifications tab (2 hours)
- [ ] Suppliers tab (2 hours)
- [ ] Pricing tab (1 hour)

#### Day 13: MaterialModule (Part 1)
- [ ] Create MaterialModule (4 hours)
- [ ] Integrate DataTable (3 hours)
- [ ] Add search and filters (2 hours)

#### Day 14: MaterialModule (Part 2)
- [ ] Material detail modal (4 hours)
- [ ] Action handlers (CRUD) (3 hours)
- [ ] Export integration (1 hour)

#### Day 15: Material Page & Category UI
- [ ] MaterialPage component (2 hours)
- [ ] Category management UI (4 hours)
- [ ] Route integration (2 hours)

### Week 4: Integration & Polish (Days 16-20)

#### Day 16: Frontend Testing
- [ ] Manual testing of all features (4 hours)
- [ ] Bug fixes (4 hours)

#### Day 17: UI Polish
- [ ] Responsive design improvements (3 hours)
- [ ] Loading states (2 hours)
- [ ] Error handling (2 hours)
- [ ] Validation messages (1 hour)

#### Day 18: Documentation
- [ ] API documentation (2 hours)
- [ ] Component documentation (2 hours)
- [ ] User guide (2 hours)
- [ ] Developer guide (2 hours)

#### Day 19-20: Final Testing & Deployment
- [ ] End-to-end testing (4 hours)
- [ ] Performance testing (2 hours)
- [ ] Security review (2 hours)
- [ ] Deployment preparation (2 hours)
- [ ] Sprint retrospective (2 hours)

---

## 🎯 Definition of Done

### Backend
- ✅ All models created with proper validation
- ✅ All services implemented
- ✅ All API endpoints functional
- ✅ Unit tests pass (>80% coverage)
- ✅ Integration tests pass
- ✅ API documentation complete
- ✅ No critical linter errors

### Frontend
- ✅ All components created
- ✅ Forms fully functional with validation
- ✅ Data tables working with pagination
- ✅ Filters and search operational
- ✅ Responsive design implemented
- ✅ Loading and error states handled
- ✅ User-friendly error messages
- ✅ No console errors

### Integration
- ✅ Frontend communicates with backend
- ✅ Authentication working
- ✅ RBAC permissions enforced
- ✅ Excel export generates correct files
- ✅ File uploads working
- ✅ Manual testing complete

---

## 📊 Success Metrics

1. **Functionality**
   - 100% of user stories completed
   - All acceptance criteria met
   - Zero critical bugs

2. **Code Quality**
   - >80% test coverage
   - All tests passing
   - Code review completed
   - Documentation complete

3. **Performance**
   - Material list loads in <2 seconds
   - Search results in <1 second
   - Excel export completes in <5 seconds (1000 records)

4. **User Experience**
   - Intuitive UI
   - Clear error messages
   - Responsive design
   - No usability issues

---

## 🔧 Technical Dependencies

- Material model depends on: Supplier, Attachment, MaterialCategory
- MaterialService depends on: AuditLogService, AttachmentService
- MaterialForm depends on: FileUpload, ExportButton (from Sprint 2)
- Material APIs depend on: RBAC middleware (from Sprint 1)

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex UOM conversions | High | Medium | Start simple, add complexity gradually |
| Category hierarchy complexity | Medium | Medium | Use existing patterns, thorough testing |
| Large dataset performance | High | Low | Implement proper indexing, pagination |
| File upload issues | Medium | Low | Reuse Sprint 2 attachment system |

---

## 📝 Notes

- Material number format: MAT-YYYYMMDD-NNN (e.g., MAT-20260106-001)
- Default base UOM: "pcs" (pieces)
- Support for both metric and imperial units
- Category codes should be unique and meaningful
- All prices in CNY by default, support multi-currency

---

**Sprint Start:** January 6, 2026  
**Target Completion:** February 2, 2026  
**Status:** 🚀 Starting Now

