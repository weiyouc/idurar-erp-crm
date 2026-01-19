const Workflow = require('../models/appModels/Workflow');
const Role = require('../models/coreModels/Role');

async function ensureDefaultWorkflows() {
  try {
    const existingSupplierWorkflow = await Workflow.findOne({
      documentType: 'supplier',
      isActive: true,
      removed: false
    });

    if (existingSupplierWorkflow) {
      return;
    }

    const approverRole =
      (await Role.findOne({ name: 'procurement_manager' })) ||
      (await Role.findOne({ name: 'system_administrator' }));

    if (!approverRole) {
      console.warn(
        '[workflow] No approver role found to seed supplier workflow (expected procurement_manager or system_administrator)'
      );
      return;
    }

    await Workflow.create({
      workflowName: 'supplier_onboarding',
      displayName: {
        zh: '供应商审批流程',
        en: 'Supplier Approval Workflow'
      },
      documentType: 'supplier',
      levels: [
        {
          levelNumber: 1,
          levelName: approverRole.displayName?.en || 'Approver',
          approverRoles: [approverRole._id],
          approvalMode: 'any',
          isMandatory: true
        }
      ],
      routingRules: [],
      allowRecall: true,
      onRejection: 'return_to_submitter',
      isActive: true,
      isDefault: true
    });

    console.log('[workflow] Seeded default supplier workflow');
  } catch (error) {
    console.error('[workflow] Failed to ensure default workflows:', error.message);
  }
}

module.exports = { ensureDefaultWorkflows };
