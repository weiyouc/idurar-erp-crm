require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const Workflow = require('../models/appModels/Workflow');
const Role = require('../models/coreModels/Role');

const DEFAULT_THRESHOLDS = {
  quotation: {
    low: 50000,
    high: 200000,
  },
  purchaseOrder: {
    high: 200000,
  },
  prePayment: {
    high: 200000,
  },
};

const workflowConfigs = [
  {
    workflowName: 'Silverplan Supplier Onboarding',
    displayName: { zh: '供应商准入审批流程', en: 'Supplier Onboarding Approval' },
    documentType: 'supplier',
    isDefault: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Data Entry Review',
        approverRoles: ['data_entry_personnel'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 2,
        levelName: 'Procurement Manager Approval',
        approverRoles: ['procurement_manager'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 3,
        levelName: 'Cost Center Review',
        approverRoles: ['cost_center'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 4,
        levelName: 'General Manager Approval',
        approverRoles: ['general_manager'],
        approvalMode: 'any',
        isMandatory: false,
      },
    ],
    routingRules: [
      {
        conditionType: 'supplier_level',
        operator: 'in',
        value: ['A', 'B'],
        targetLevels: [4],
      },
    ],
  },
  {
    workflowName: 'Silverplan Material Quotation Approval',
    displayName: { zh: '物料报价审批流程', en: 'Material Quotation Approval' },
    documentType: 'material_quotation',
    isDefault: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cost Center Review',
        approverRoles: ['cost_center'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 2,
        levelName: 'Procurement Manager Approval',
        approverRoles: ['procurement_manager'],
        approvalMode: 'any',
        isMandatory: false,
      },
      {
        levelNumber: 3,
        levelName: 'General Manager Approval',
        approverRoles: ['general_manager'],
        approvalMode: 'any',
        isMandatory: false,
      },
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'lte',
        value: DEFAULT_THRESHOLDS.quotation.low,
        targetLevels: [2],
      },
      {
        conditionType: 'amount',
        operator: 'gt',
        value: DEFAULT_THRESHOLDS.quotation.low,
        targetLevels: [2, 3],
      },
    ],
  },
  {
    workflowName: 'Silverplan Purchase Order Approval',
    displayName: { zh: '采购订单审批流程', en: 'Purchase Order Approval' },
    documentType: 'purchase_order',
    isDefault: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Approval',
        approverRoles: ['procurement_manager'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 2,
        levelName: 'General Manager Approval',
        approverRoles: ['general_manager'],
        approvalMode: 'any',
        isMandatory: false,
      },
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gt',
        value: DEFAULT_THRESHOLDS.purchaseOrder.high,
        targetLevels: [2],
      },
    ],
  },
  {
    workflowName: 'Silverplan Pre-Payment Approval',
    displayName: { zh: '预付款审批流程', en: 'Pre-Payment Approval' },
    documentType: 'pre_payment',
    isDefault: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Approval',
        approverRoles: ['procurement_manager'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 2,
        levelName: 'Finance Director Approval',
        approverRoles: ['finance_director'],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 3,
        levelName: 'General Manager Approval',
        approverRoles: ['general_manager'],
        approvalMode: 'any',
        isMandatory: false,
      },
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gt',
        value: DEFAULT_THRESHOLDS.prePayment.high,
        targetLevels: [3],
      },
    ],
  },
];

async function getRoleIds(roleNames) {
  const roles = await Role.find({ name: { $in: roleNames }, removed: false }).select('_id name');
  const roleMap = new Map(roles.map((role) => [role.name, role._id]));
  const missing = roleNames.filter((name) => !roleMap.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Missing roles: ${missing.join(
        ', '
      )}. Seed roles first with: node src/setup/seedRoles.js`
    );
  }

  return roleNames.map((name) => roleMap.get(name));
}

async function seedWorkflows() {
  try {
    await mongoose.connect(process.env.DATABASE);

    console.log('Seeding Silverplan workflows...');

    for (const config of workflowConfigs) {
      const existing = await Workflow.findOne({
        documentType: config.documentType,
        isDefault: true,
        removed: false,
      });

      if (existing) {
        console.log(
          `- Default workflow already exists for ${config.documentType}: ${existing.workflowName}`
        );
        continue;
      }

      const levels = [];
      for (const level of config.levels) {
        const approverRoleIds = await getRoleIds(level.approverRoles);
        levels.push({
          ...level,
          approverRoles: approverRoleIds,
        });
      }

      const workflow = await Workflow.create({
        workflowName: config.workflowName,
        displayName: config.displayName,
        documentType: config.documentType,
        levels,
        routingRules: config.routingRules,
        isDefault: config.isDefault,
        isActive: true,
      });

      console.log(
        `✓ Created workflow: ${workflow.workflowName} (${workflow.documentType})`
      );
    }

    console.log('Silverplan workflow seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Workflow seeding failed.');
    console.error(error.message);
    process.exit(1);
  }
}

seedWorkflows();
