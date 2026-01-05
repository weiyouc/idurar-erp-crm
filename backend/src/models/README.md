# Models Documentation

This directory contains all Mongoose models for the IDURAR ERP-CRM Silverplan project.

## Directory Structure

```
models/
├── coreModels/          # Core system models
│   ├── Admin.js         # User/Admin model (extended for RBAC)
│   ├── Role.js          # Role definition for RBAC
│   ├── Permission.js    # Permission definition for RBAC
│   ├── AuditLog.js      # Immutable audit trail
│   ├── Attachment.js    # File attachment management (Sprint 2)
│   └── Upload.js        # File upload management (existing)
│
└── appModels/           # Application-specific models
    ├── Workflow.js      # Workflow definition
    └── WorkflowInstance.js  # Workflow execution tracking
```

## Core Models

### Admin Model (`coreModels/Admin.js`)

**Purpose:** User and administrator management with RBAC support

**Key Features:**
- Multi-role support (roles array)
- Organizational hierarchy (department, reportsTo, managerOf)
- Approval authority with amount thresholds
- User preferences (language, notifications)
- Backward compatible with legacy 'role' field

**Key Fields:**
```javascript
{
  email: String,
  name: String,
  surname: String,
  roles: [ObjectId],                    // NEW: Multiple roles
  department: String,                   // NEW: Department
  reportsTo: ObjectId,                  // NEW: Manager reference
  managerOf: [ObjectId],                // NEW: Subordinates
  approvalAuthority: {                  // NEW: Approval limits
    maxAmount: Number,
    currency: String,
    documentTypes: [String]
  },
  preferences: {                        // NEW: User preferences
    language: String,
    notifications: Object
  }
}
```

**Instance Methods:**
- `hasRole(roleName)` - Check if user has specific role
- `canApprove(documentType, amount, currency)` - Check approval authority
- `getAllPermissions()` - Get all permissions from all roles
- `hasPermission(resource, action, scope)` - Check specific permission
- `getTeamMembers()` - Get subordinates

**Static Methods:**
- `findByRole(roleName)` - Find users with specific role
- `findByDepartment(department)` - Find users in department
- `findActive()` - Find all active users

---

### Role Model (`coreModels/Role.js`)

**Purpose:** Define roles for Role-Based Access Control (RBAC)

**Key Features:**
- Multilingual display names (zh, en)
- Permission assignment
- Role hierarchy (inheritsFrom)
- System role protection (cannot delete)

**Key Fields:**
```javascript
{
  name: String,                    // Unique identifier
  displayName: {                   // Multilingual
    zh: String,
    en: String
  },
  permissions: [ObjectId],         // Permission references
  inheritsFrom: [ObjectId],        // Parent roles
  isSystemRole: Boolean            // System protection flag
}
```

**Instance Methods:**
- `getAllPermissions()` - Get permissions including inherited

**Static Methods:**
- `findActive()` - Find all active roles
- `findSystemRoles()` - Find system-defined roles

**System Roles (12):**
1. System Administrator (系统管理员)
2. General Manager (总经理)
3. Procurement Manager (采购经理)
4. Cost Center (成本中心)
5. Finance Director (财务总监)
6. Finance Personnel (财务人员)
7. Purchaser (采购员)
8. Data Entry Personnel (数据录入人员)
9. MRP Planner (MRP计划员)
10. Warehouse Personnel (仓库人员)
11. Engineering (工程部)
12. Auditor (审计员)

---

### Permission Model (`coreModels/Permission.js`)

**Purpose:** Define granular permissions for resources and actions

**Permission Structure:**
```javascript
{
  resource: String,     // Entity (supplier, purchase_order, etc.)
  action: String,       // Operation (create, read, update, delete, approve)
  scope: String,        // Access scope (own, team, all)
  conditions: Mixed     // Additional constraints (optional)
}
```

**Supported Actions:**
- create, read, update, delete
- approve, reject, submit, recall
- export, import, close, cancel

**Supported Scopes:**
- `own` - Only user's own records
- `team` - User's and subordinates' records
- `all` - All records

**Conditional Permissions Example:**
```javascript
{
  resource: 'purchase_order',
  action: 'approve',
  scope: 'all',
  conditions: {
    maxAmount: 100000,
    currency: 'CNY'
  }
}
```

**Instance Methods:**
- `matchesConditions(context)` - Evaluate permission conditions

**Static Methods:**
- `findByResourceAction(resource, action)` - Find permissions
- `checkPermission(resource, action, scope)` - Check if exists

---

### AuditLog Model (`coreModels/AuditLog.js`)

**Purpose:** Immutable audit trail for compliance and troubleshooting

**Key Features:**
- **Immutable** - Cannot be modified or deleted after creation
- Field-level change tracking (old → new value)
- Metadata capture (IP, user agent, request ID)
- Optimized indexes for querying

**Key Fields:**
```javascript
{
  user: ObjectId,              // Who performed action
  action: String,              // What action (create, update, approve, etc.)
  entityType: String,          // What entity (Supplier, PurchaseOrder, etc.)
  entityId: ObjectId,          // Entity ID
  entityName: String,          // Entity display name
  changes: [{                  // Field-level changes
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  metadata: {                  // Request metadata
    ip: String,
    userAgent: String,
    requestId: String
  },
  timestamp: Date              // When it happened
}
```

**Tracked Actions:**
- create, read, update, delete
- approve, reject, submit, recall
- export, import, login, logout
- password_change, permission_change, role_change

**Static Methods:**
- `log(data)` - Create audit log entry (fails gracefully)
- `findByUser(userId, options)` - Query by user
- `findByEntity(entityType, entityId, options)` - Query by entity
- `findByAction(action, options)` - Query by action
- `search(criteria)` - Advanced search

---

## Application Models

### Workflow Model (`appModels/Workflow.js`)

**Purpose:** Define multi-level approval workflows for document types

**Key Features:**
- Multiple approval levels (up to 10)
- Configurable approver roles per level
- Routing rules based on conditions
- Approval modes (any one or all approvers)

**Key Fields:**
```javascript
{
  workflowName: String,
  documentType: String,        // supplier, material_quotation, purchase_order, pre_payment
  levels: [{                   // Approval levels
    levelNumber: Number,
    levelName: String,
    approverRoles: [ObjectId],
    approvalMode: String,      // 'any' or 'all'
    isMandatory: Boolean
  }],
  routingRules: [{             // Conditional routing
    conditionType: String,     // amount, supplier_level, etc.
    operator: String,          // gt, gte, lt, lte, eq, in, etc.
    value: Mixed,
    targetLevels: [Number]
  }],
  isActive: Boolean,
  isDefault: Boolean
}
```

**Routing Rule Operators:**
- `gt`, `gte` - Greater than, greater than or equal
- `lt`, `lte` - Less than, less than or equal
- `eq`, `ne` - Equal, not equal
- `in`, `not_in` - In array, not in array

**Instance Methods:**
- `getMandatoryLevels()` - Get mandatory approval levels
- `evaluateRoutingRules(documentData)` - Evaluate routing conditions
- `getRequiredLevels(documentData)` - Get all required levels for document
- `getLevelConfig(levelNumber)` - Get level configuration

**Static Methods:**
- `findDefaultForDocumentType(documentType)` - Get default workflow
- `findByDocumentType(documentType)` - Get all workflows for type

**Example Routing Rule:**
```javascript
{
  conditionType: 'amount',
  operator: 'gte',
  value: 100000,
  targetLevels: [4, 5]  // Activate levels 4 and 5 if amount >= 100000
}
```

---

### WorkflowInstance Model (`appModels/WorkflowInstance.js`)

**Purpose:** Track workflow execution for individual documents

**Key Features:**
- Current approval level tracking
- Complete approval history
- Progress tracking
- Statistics (duration, approver count)

**Key Fields:**
```javascript
{
  workflow: ObjectId,            // Workflow definition
  documentType: String,
  documentId: ObjectId,          // Document being approved
  documentNumber: String,        // Display number
  currentLevel: Number,          // Current approval level
  status: String,                // pending, approved, rejected, cancelled
  approvalHistory: [{            // Chronological history
    level: Number,
    approver: ObjectId,
    action: String,              // approve, reject, recall
    comments: String,
    timestamp: Date
  }],
  requiredLevels: [Number],      // Which levels needed
  completedLevels: [Number],     // Which levels completed
  submittedBy: ObjectId,
  submittedAt: Date,
  completedAt: Date,
  stats: {                       // Workflow statistics
    totalLevels: Number,
    completedLevelsCount: Number,
    totalApprovers: Number,
    durationHours: Number
  }
}
```

**Virtuals:**
- `isComplete` - Is workflow finished?
- `progressPercentage` - Completion percentage (0-100)
- `nextLevel` - Next approval level

**Instance Methods:**
- `recordApproval(level, approver, action, comments)` - Record approval action
- `isLevelCompleted(level)` - Check if level is done
- `areAllLevelsCompleted()` - Check if all done
- `getPendingApprovers()` - Get approvers for current level
- `getApprovalSummary()` - Get summary object

**Static Methods:**
- `findPendingApprovalsForUser(userId, options)` - Find user's pending approvals
- `findByDocument(documentType, documentId)` - Find workflow for document
- `findRecentCompletions(days, limit)` - Recent completed workflows
- `getStatistics(options)` - Aggregate statistics

---

### Attachment Model (`coreModels/Attachment.js`)

**Purpose:** Generic file attachment management for any entity type

**Key Features:**
- Supports multiple file types (documents, images)
- Flexible storage (local or S3)
- Entity association (can attach to any model)
- Soft delete with audit trail
- Auto-generate unique filenames
- File validation (size, type)

**Key Fields:**
```javascript
{
  // File Information
  originalName: String,          // User's filename
  storedName: String,            // Unique server filename
  mimeType: String,              // File type
  size: Number,                  // File size in bytes
  path: String,                  // Storage path
  url: String,                   // Access URL (for S3)
  
  // Association
  entityType: String,            // 'Supplier', 'Material', etc.
  entityId: ObjectId,            // ID of associated entity
  fieldName: String,             // Field name ('license', 'certificate')
  
  // Storage
  storageType: String,           // 'local' or 's3'
  s3Bucket: String,              // S3 bucket (if S3)
  s3Key: String,                 // S3 key (if S3)
  
  // Metadata
  uploadedBy: ObjectId,          // Admin who uploaded
  uploadedAt: Date,              // Upload timestamp
  description: String,           // File description
  tags: [String],                // Tags for categorization
  
  // Status
  isPublic: Boolean,             // Public access allowed?
  removed: Boolean,              // Soft deleted?
  removedAt: Date,               // Deletion timestamp
  removedBy: ObjectId            // Admin who deleted
}
```

**Supported File Types:**
- Documents: PDF, Word, Excel
- Images: JPEG, PNG, GIF, WebP
- Other: Text, ZIP

**Validation:**
- File size: Max 10MB (configurable)
- MIME type: Whitelist only
- Required: originalName, mimeType, size, entityType, entityId, uploadedBy

**Instance Methods:**
- `getPublicUrl()` - Get download URL
- `markAsDeleted(userId)` - Soft delete
- `format()` - Format for API response

**Static Methods:**
- `findByEntity(entityType, entityId)` - Get all attachments for entity
- `findByUser(userId, options)` - Get user's uploads
- `findOrphaned()` - Find attachments with missing entities

**Usage Example:**
```javascript
// Create attachment
const attachment = await Attachment.create({
  originalName: 'supplier-license.pdf',
  mimeType: 'application/pdf',
  size: 524288,
  path: './uploads/1234567890-abc.pdf',
  entityType: 'Supplier',
  entityId: supplierId,
  fieldName: 'businessLicense',
  storageType: 'local',
  uploadedBy: adminId
});

// Get all attachments for supplier
const attachments = await Attachment.findByEntity('Supplier', supplierId);

// Soft delete
await attachment.markAsDeleted(adminId);
```

---

## Model Relationships

```
Admin
  ├─> roles[] ──────> Role
  │                     └─> permissions[] ──> Permission
  ├─> reportsTo ────> Admin (manager)
  └─> managerOf[] ──> Admin (subordinates)

Workflow
  ├─> levels[].approverRoles[] ──> Role
  └─> createdBy ────────────────> Admin

WorkflowInstance
  ├─> workflow ──────────────────> Workflow
  ├─> submittedBy ───────────────> Admin
  └─> approvalHistory[].approver ─> Admin

AuditLog
  └─> user ──────────────────────> Admin
```

---

## Indexes

### Performance Indexes

**Admin:**
- `email` (unique)
- `roles`
- `department`
- `reportsTo`
- `removed + enabled`

**Role:**
- `name` (unique)
- `isSystemRole`
- `removed`

**Permission:**
- `resource + action + scope` (compound)
- `resource + action`
- `removed`

**AuditLog:**
- `user + timestamp`
- `entityType + entityId + timestamp`
- `action + timestamp`
- `timestamp`

**Workflow:**
- `documentType + isActive`
- `documentType + isDefault`
- `removed`

**WorkflowInstance:**
- `documentType + documentId` (unique)
- `status + currentLevel`
- `submittedBy + status`
- `status + submittedAt`

---

## Migration and Setup

### 1. Extend Admin Model

Run the migration to add new fields to existing Admin documents:

```bash
cd backend/src
node migrations/001_extend_admin_model.js
```

**Rollback (if needed):**
```bash
node migrations/001_extend_admin_model.js --rollback
```

### 2. Seed Roles and Permissions

Seed the 12 system roles with their permissions:

```bash
cd backend/src
node setup/seedRoles.js
```

This creates:
- ~45 system permissions
- 12 system roles with appropriate permissions

---

## Usage Examples

### Check User Permission

```javascript
const user = await Admin.findById(userId).populate('roles');
const hasPermission = await user.hasPermission('purchase_order', 'approve', 'all');

if (hasPermission) {
  // User can approve purchase orders
}
```

### Check Approval Authority

```javascript
const user = await Admin.findById(userId);
const canApprove = user.canApprove('purchase_order', 50000, 'CNY');

if (canApprove) {
  // User can approve POs up to 50,000 CNY
}
```

### Create Audit Log

```javascript
await AuditLog.log({
  user: req.admin._id,
  action: 'update',
  entityType: 'Supplier',
  entityId: supplier._id,
  entityName: supplier.name,
  changes: [
    { field: 'level', oldValue: 'B', newValue: 'A' }
  ],
  metadata: {
    ip: req.ip,
    userAgent: req.get('user-agent')
  }
});
```

### Initiate Workflow

```javascript
// Get default workflow for purchase orders
const workflow = await Workflow.findDefaultForDocumentType('purchase_order');

// Determine required levels based on PO data
const requiredLevels = workflow.getRequiredLevels({
  amount: purchaseOrder.totalAmount
});

// Create workflow instance
const instance = await WorkflowInstance.create({
  workflow: workflow._id,
  documentType: 'purchase_order',
  documentId: purchaseOrder._id,
  documentNumber: purchaseOrder.number,
  requiredLevels,
  currentLevel: requiredLevels[0],
  submittedBy: req.admin._id
});
```

### Find Pending Approvals

```javascript
const pendingApprovals = await WorkflowInstance.findPendingApprovalsForUser(
  req.admin._id,
  { documentType: 'purchase_order', limit: 20 }
);
```

---

## Best Practices

### 1. Always Use Audit Logging

Log all significant operations:
```javascript
// After creating/updating/deleting entity
await AuditLog.log({ user, action, entityType, entityId, changes });
```

### 2. Check Permissions Before Operations

```javascript
const hasPermission = await req.admin.hasPermission('supplier', 'create', 'all');
if (!hasPermission) {
  return res.status(403).json({ success: false, message: 'Forbidden' });
}
```

### 3. Validate Approval Authority

```javascript
if (!req.admin.canApprove('purchase_order', po.totalAmount, po.currency)) {
  return res.status(403).json({ 
    success: false, 
    message: 'Approval authority exceeded' 
  });
}
```

### 4. Use Transactions for Workflow Operations

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Update document status
  await PurchaseOrder.updateOne({ _id }, { status: 'approved' }, { session });
  
  // Record approval in workflow
  instance.recordApproval(level, approverId, 'approve', comments);
  await instance.save({ session });
  
  // Log action
  await AuditLog.log({ ... });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Testing

### Unit Tests

Each model should have unit tests covering:
- Schema validation
- Instance methods
- Static methods
- Virtuals
- Middleware (pre/post hooks)

### Integration Tests

Test model interactions:
- RBAC permission checking
- Workflow routing rules
- Audit log creation
- Role hierarchy

---

## Future Enhancements

1. **Role Templates** - Predefined role configurations
2. **Conditional Permissions** - More complex permission conditions
3. **Workflow Templates** - Reusable workflow patterns
4. **Audit Log Archiving** - Archive old logs to separate collection
5. **Permission Caching** - Cache user permissions for performance
6. **Workflow Analytics** - Detailed workflow performance metrics

---

## Support

For questions or issues with models, contact the development team or refer to:
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- Sprint 1 Backlog: `doc/sprint-1-backlog.md`
- Functional Requirements: `doc/customer-requirements/functional-requirements-plan.md`

