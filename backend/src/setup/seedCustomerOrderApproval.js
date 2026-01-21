require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const Admin = require('../models/coreModels/Admin');
const Role = require('../models/coreModels/Role');
const Workflow = require('../models/appModels/Workflow');
const Supplier = require('../models/appModels/Supplier');
const Material = require('../models/appModels/Material');
const PurchaseOrder = require('../models/appModels/PurchaseOrder');

const SEED_TAG = 'seed:customer-order-approval';
const SEED_SUPPLIER_PREFIX = 'SEED-COA-SUP-';
const SEED_MATERIAL_PREFIX = 'SEED-COA-MAT-';

const formatDateSuffix = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const logStep = (message) => {
  console.log(message);
};

const logKeyValue = (label, value) => {
  console.log(`- ${label}: ${value}`);
};

async function getAdminUser() {
  const admin = await Admin.findOne({ removed: false });
  if (!admin) {
    throw new Error('No admin user found. Create an admin user first.');
  }
  return admin;
}

async function getRoleIds(roleNames) {
  const roles = await Role.find({ name: { $in: roleNames }, removed: false }).select('_id name');
  const roleMap = new Map(roles.map((role) => [role.name, role._id]));
  const missing = roleNames.filter((name) => !roleMap.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Missing roles: ${missing.join(', ')}. Seed roles first with: node src/setup/seedRoles.js`
    );
  }
  return roleNames.map((name) => roleMap.get(name));
}

async function ensurePurchaseOrderWorkflow(procurementRoleId, gmRoleId) {
  const existing = await Workflow.findOne({
    documentType: 'purchase_order',
    removed: false,
  });

  if (existing) {
    return existing;
  }

  const workflow = await Workflow.create({
    workflowName: 'Seed Purchase Order Approval',
    displayName: { en: 'Seed Purchase Order Approval', zh: '采购订单审批(测试)' },
    documentType: 'purchase_order',
    isDefault: false,
    isActive: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Approval',
        approverRoles: [procurementRoleId],
        approvalMode: 'any',
        isMandatory: true,
      },
      {
        levelNumber: 2,
        levelName: 'General Manager Approval',
        approverRoles: [gmRoleId],
        approvalMode: 'any',
        isMandatory: false,
      },
    ],
    routingRules: [],
  });

  return workflow;
}

async function ensureSupplier(adminId) {
  const existing = await Supplier.findOne({
    supplierNumber: new RegExp(`^${SEED_SUPPLIER_PREFIX}`),
    removed: false,
  });

  if (existing) {
    return existing;
  }

  const supplierNumber = `${SEED_SUPPLIER_PREFIX}${formatDateSuffix()}`;
  const supplier = await Supplier.create({
    supplierNumber,
    companyName: { zh: '审批测试供应商', en: 'Approval Test Supplier' },
    abbreviation: 'AT-SUP',
    status: 'draft',
    contact: {
      primaryContact: 'Test Contact',
      email: `approval_test_${Date.now()}@example.com`,
    },
    address: {
      country: 'CN',
      city: 'Shenzhen',
      fullAddress: 'Test Address',
    },
    createdBy: adminId,
  });

  return supplier;
}

async function ensureMaterial(adminId, supplierId) {
  const existing = await Material.findOne({
    materialNumber: new RegExp(`^${SEED_MATERIAL_PREFIX}`),
    removed: false,
  });

  if (existing) {
    return existing;
  }

  const materialNumber = `${SEED_MATERIAL_PREFIX}${formatDateSuffix()}`;
  const material = await Material.create({
    materialNumber,
    materialName: { zh: '审批测试物料', en: 'Approval Test Material' },
    baseUOM: 'pcs',
    status: 'active',
    preferredSuppliers: [
      {
        supplier: supplierId,
        isPurchasing: true,
        isInventory: true,
      },
    ],
    createdBy: adminId,
  });

  return material;
}

async function ensurePurchaseOrder(adminId, supplierId, materialId) {
  const existing = await PurchaseOrder.findOne({
    internalNotes: SEED_TAG,
    removed: false,
  });

  if (existing) {
    return existing;
  }

  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
  const poNumber = await PurchaseOrder.generatePONumber();

  const purchaseOrder = await PurchaseOrder.create({
    poNumber,
    supplier: supplierId,
    orderDate: new Date(),
    expectedDeliveryDate,
    items: [
      {
        material: materialId,
        quantity: 10,
        unitPrice: 100,
        uom: 'pcs',
      },
    ],
    currency: 'CNY',
    status: 'draft',
    internalNotes: SEED_TAG,
    createdBy: adminId,
  });

  return purchaseOrder;
}

async function seedCustomerOrderApproval() {
  try {
    await mongoose.connect(process.env.DATABASE);

    logStep('Seeding test data for customer order approval scenario (purchase order workflow)...');

    const admin = await getAdminUser();
    const [procurementRoleId, gmRoleId] = await getRoleIds([
      'procurement_manager',
      'general_manager',
    ]);

    const workflow = await ensurePurchaseOrderWorkflow(procurementRoleId, gmRoleId);
    const supplier = await ensureSupplier(admin._id);
    const material = await ensureMaterial(admin._id, supplier._id);
    const purchaseOrder = await ensurePurchaseOrder(admin._id, supplier._id, material._id);

    logStep('Seed complete. IDs:');
    logKeyValue('Admin', admin._id);
    logKeyValue('Workflow (purchase_order)', workflow._id);
    logKeyValue('Supplier', supplier._id);
    logKeyValue('Material', material._id);
    logKeyValue('Purchase Order', purchaseOrder._id);
    logKeyValue('PO Number', purchaseOrder.poNumber);
    logKeyValue('Seed Tag', SEED_TAG);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedCustomerOrderApproval();
