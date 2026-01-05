/**
 * Test Data Fixtures
 * 
 * Reusable test data for model tests.
 */

const mongoose = require('mongoose');

/**
 * Generate a valid ObjectId
 */
const generateObjectId = () => new mongoose.Types.ObjectId();

/**
 * Role test data
 */
const roleData = {
  valid: {
    name: 'test_role',
    displayName: {
      zh: '测试角色',
      en: 'Test Role'
    },
    description: 'A test role for unit testing',
    isSystemRole: false
  },
  systemRole: {
    name: 'system_admin',
    displayName: {
      zh: '系统管理员',
      en: 'System Administrator'
    },
    isSystemRole: true
  },
  invalidName: {
    name: 'Invalid-Role!',  // Invalid characters
    displayName: {
      zh: '无效角色',
      en: 'Invalid Role'
    }
  }
};

/**
 * Permission test data
 */
const permissionData = {
  valid: {
    resource: 'supplier',
    action: 'create',
    scope: 'own',
    description: 'Create suppliers'
  },
  withConditions: {
    resource: 'purchase_order',
    action: 'approve',
    scope: 'all',
    conditions: {
      maxAmount: 100000,
      currency: 'CNY'
    }
  },
  systemPermission: {
    resource: 'admin',
    action: 'delete',
    scope: 'all',
    isSystemPermission: true
  }
};

/**
 * Admin test data
 */
const adminData = {
  valid: {
    email: 'test@example.com',
    name: 'Test',
    surname: 'User',
    enabled: true,
    role: 'owner'
  },
  withRoles: {
    email: 'testuser@example.com',
    name: 'Test',
    surname: 'User',
    enabled: true,
    role: 'owner',
    department: 'Procurement',
    approvalAuthority: {
      maxAmount: 50000,
      currency: 'CNY',
      documentTypes: ['purchase_order']
    },
    preferences: {
      language: 'zh-CN',
      notifications: {
        email: true,
        inApp: true
      }
    }
  }
};

/**
 * Workflow test data
 */
const workflowData = {
  valid: {
    workflowName: 'test_workflow',
    displayName: {
      zh: '测试工作流',
      en: 'Test Workflow'
    },
    documentType: 'purchase_order',
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager',
        approverRoles: [],  // Will be populated in tests
        approvalMode: 'any',
        isMandatory: true
      },
      {
        levelNumber: 2,
        levelName: 'General Manager',
        approverRoles: [],
        approvalMode: 'any',
        isMandatory: false
      }
    ],
    routingRules: [],
    isActive: true,
    isDefault: true
  },
  withRoutingRules: {
    workflowName: 'po_workflow_complex',
    displayName: {
      zh: '采购订单工作流',
      en: 'Purchase Order Workflow'
    },
    documentType: 'purchase_order',
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager',
        approverRoles: [],
        approvalMode: 'any',
        isMandatory: true
      },
      {
        levelNumber: 2,
        levelName: 'Cost Center',
        approverRoles: [],
        approvalMode: 'any',
        isMandatory: false
      },
      {
        levelNumber: 3,
        levelName: 'General Manager',
        approverRoles: [],
        approvalMode: 'any',
        isMandatory: false
      }
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gte',
        value: 50000,
        targetLevels: [2, 3]
      }
    ],
    isActive: true,
    isDefault: false
  }
};

/**
 * WorkflowInstance test data
 */
const workflowInstanceData = {
  valid: {
    documentType: 'purchase_order',
    documentNumber: 'PO-2025-001',
    currentLevel: 1,
    status: 'pending',
    requiredLevels: [1, 2],
    completedLevels: [],
    approvalHistory: []
  }
};

/**
 * AuditLog test data
 */
const auditLogData = {
  create: {
    action: 'create',
    entityType: 'Supplier',
    entityName: 'Test Supplier',
    changes: [],
    metadata: {
      ip: '127.0.0.1',
      userAgent: 'Jest Test',
      requestId: 'test-123'
    }
  },
  update: {
    action: 'update',
    entityType: 'Supplier',
    entityName: 'Test Supplier',
    changes: [
      {
        field: 'level',
        oldValue: 'B',
        newValue: 'A'
      },
      {
        field: 'status',
        oldValue: 'pending',
        newValue: 'active'
      }
    ],
    metadata: {
      ip: '127.0.0.1',
      userAgent: 'Jest Test'
    }
  },
  approve: {
    action: 'approve',
    entityType: 'PurchaseOrder',
    entityName: 'PO-2025-001',
    changes: [],
    metadata: {
      ip: '127.0.0.1'
    }
  }
};

module.exports = {
  generateObjectId,
  roleData,
  permissionData,
  adminData,
  workflowData,
  workflowInstanceData,
  auditLogData
};

