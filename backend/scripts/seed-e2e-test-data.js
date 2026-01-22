/**
 * E2E Test Data Seeding Script
 *
 * Creates comprehensive test data for end-to-end testing of happy path scenarios.
 * This script provides deterministic data for all procurement workflows.
 *
 * Usage:
 *   node scripts/seed-e2e-test-data.js
 *
 * Data Created:
 * - Test Users (with roles and permissions)
 * - Master Data (Suppliers, Materials, Categories)
 * - Workflows (pre-configured approval flows)
 * - Reference Documents (POs, Quotations in various states)
 * - Test Scenarios (complete workflow examples)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

// Import models
const Admin = require('../src/models/coreModels/Admin');
const AdminPassword = require('../src/models/coreModels/AdminPassword');
const Role = require('../src/models/coreModels/Role');
const Permission = require('../src/models/coreModels/Permission');

const Supplier = require('../src/models/appModels/Supplier');
const Material = require('../src/models/appModels/Material');
const MaterialCategory = require('../src/models/appModels/MaterialCategory');
const MaterialQuotation = require('../src/models/appModels/MaterialQuotation');
const PurchaseOrder = require('../src/models/appModels/PurchaseOrder');
const Workflow = require('../src/models/appModels/Workflow');
const WorkflowInstance = require('../src/models/appModels/WorkflowInstance');

// Test data constants
const DEFAULT_PASSWORD = 'test123456';
const TEST_PREFIX = 'E2E-TEST-';

// Test users configuration (matching existing script but ensuring E2E-specific)
const testUsers = [
  {
    email: 'e2e.admin@test.com',
    name: 'E2E',
    surname: 'Admin',
    department: 'Testing',
    roleNames: ['system_administrator'],
    approvalAuthority: {
      maxAmount: 10000000,
      currency: 'CNY',
      documentTypes: ['supplier', 'material_quotation', 'purchase_order', 'pre_payment']
    }
  },
  {
    email: 'e2e.procurement.manager@test.com',
    name: 'Procurement',
    surname: 'Manager',
    department: 'Procurement',
    roleNames: ['procurement_manager'],
    approvalAuthority: {
      maxAmount: 50000,
      currency: 'CNY',
      documentTypes: ['supplier', 'material_quotation', 'purchase_order']
    }
  },
  {
    email: 'e2e.cost.center@test.com',
    name: 'Cost',
    surname: 'Center',
    department: 'Finance',
    roleNames: ['cost_center'],
    approvalAuthority: {
      maxAmount: 100000,
      currency: 'CNY',
      documentTypes: ['supplier', 'purchase_order']
    }
  },
  {
    email: 'e2e.general.manager@test.com',
    name: 'General',
    surname: 'Manager',
    department: 'Executive',
    roleNames: ['general_manager'],
    approvalAuthority: {
      maxAmount: 500000,
      currency: 'CNY',
      documentTypes: ['supplier', 'purchase_order', 'pre_payment']
    }
  },
  {
    email: 'e2e.data.entry@test.com',
    name: 'Data',
    surname: 'Entry',
    department: 'Procurement',
    roleNames: ['data_entry_personnel']
  }
];

// Master data
const materialCategories = [
  {
    code: `${TEST_PREFIX}CAT-001`,
    name: { zh: '电子元件', en: 'Electronic Components' },
    description: 'Electronic components and parts',
    createdBy: null, // Will be set after users are created
    status: 'active'
  },
  {
    code: `${TEST_PREFIX}CAT-002`,
    name: { zh: '机械零件', en: 'Mechanical Parts' },
    description: 'Mechanical components and parts',
    createdBy: null, // Will be set after users are created
    status: 'active'
  },
  {
    code: `${TEST_PREFIX}CAT-003`,
    name: { zh: '办公用品', en: 'Office Supplies' },
    description: 'Office supplies and consumables',
    createdBy: null, // Will be set after users are created
    status: 'active'
  }
];

const suppliers = [
  {
    supplierNumber: `${TEST_PREFIX}SUP-001`,
    companyName: { zh: '测试供应商A', en: 'Test Supplier A' },
    abbreviation: 'SUP-A',
    type: 'manufacturer',
    category: ['Electronics'],
    status: 'active',
    contact: {
      primaryContact: '张经理',
      phone: '+86-123-4567-8901',
      mobile: '+86-138-0013-8001',
      email: 'contact@testsupplier-a.com'
    },
    address: {
      country: 'China',
      province: 'Guangdong',
      city: 'Shenzhen',
      street: '高新区科技园123号',
      postalCode: '518000'
    },
    businessInfo: {
      businessLicenseNumber: '911101057109000001',
      taxId: '123456789012345',
      registrationDate: new Date('2020-01-15'),
      currency: 'CNY'
    },
    bankingInfo: {
      bankName: '中国银行深圳分行',
      accountNumber: '1234567890123456',
      swiftCode: 'BKCHCNBJ',
      bankBranch: '科技园支行'
    },
    paymentTerms: 'Net 30',
    creditRating: 'A',
    leadTime: 7,
    notes: 'Primary electronics supplier for testing',
    createdBy: null // Will be set after users are created
  },
  {
    supplierNumber: `${TEST_PREFIX}SUP-002`,
    companyName: { zh: '测试供应商B', en: 'Test Supplier B' },
    abbreviation: 'SUP-B',
    type: 'distributor',
    category: ['Office Supplies'],
    status: 'active',
    contact: {
      primaryContact: '李经理',
      phone: '+86-123-4567-8902',
      mobile: '+86-138-0013-8002',
      email: 'contact@testsupplier-b.com'
    },
    address: {
      country: 'China',
      province: 'Beijing',
      city: 'Beijing',
      street: '朝阳区建国路88号',
      postalCode: '100022'
    },
    businessInfo: {
      businessLicenseNumber: '911101057109000002',
      taxId: '123456789012346',
      registrationDate: new Date('2021-03-20'),
      currency: 'CNY'
    },
    bankingInfo: {
      bankName: '中国工商银行北京分行',
      accountNumber: '1234567890123457',
      swiftCode: 'ICBKCNBJ',
      bankBranch: '朝阳支行'
    },
    paymentTerms: 'Net 15',
    creditRating: 'B',
    leadTime: 3,
    notes: 'Office supplies supplier for testing',
    createdBy: null // Will be set after users are created
  },
  {
    supplierNumber: `${TEST_PREFIX}SUP-003`,
    companyName: { zh: '测试供应商C', en: 'Test Supplier C' },
    abbreviation: 'SUP-C',
    type: 'manufacturer',
    category: ['Mechanical'],
    status: 'active',
    contact: {
      primaryContact: '王经理',
      phone: '+86-123-4567-8903',
      mobile: '+86-138-0013-8003',
      email: 'contact@testsupplier-c.com'
    },
    address: {
      country: 'China',
      province: 'Shanghai',
      city: 'Shanghai',
      street: '浦东新区陆家嘴金融贸易区1号',
      postalCode: '200120'
    },
    businessInfo: {
      businessLicenseNumber: '911101057109000003',
      taxId: '123456789012347',
      registrationDate: new Date('2019-11-10'),
      currency: 'CNY'
    },
    bankingInfo: {
      bankName: '中国建设银行上海分行',
      accountNumber: '1234567890123458',
      swiftCode: 'PCBCCNBJ',
      bankBranch: '浦东支行'
    },
    paymentTerms: 'Net 60',
    creditRating: 'B',
    leadTime: 14,
    notes: 'Mechanical parts supplier for testing',
    createdBy: null // Will be set after users are created
  }
];

const materials = [
  {
    materialNumber: `${TEST_PREFIX}MAT-001`,
    materialName: { zh: '电阻器 10KΩ 1%', en: 'Resistor 10KΩ 1%' },
    description: 'Carbon film resistor, 10K ohm, 1% tolerance, 1/4W',
    baseUOM: 'ea',
    category: null, // Will be set after categories are created
    type: 'raw',
    specifications: {
      resistance: '10KΩ',
      tolerance: '1%',
      powerRating: '1/4W',
      packageType: 'Through Hole'
    },
    procurementInfo: {
      leadTime: 7,
      moq: 100,
      lastCost: 0.05,
      currency: 'CNY'
    },
    status: 'active',
    createdBy: null // Will be set after users are created
  },
  {
    materialNumber: `${TEST_PREFIX}MAT-002`,
    materialName: { zh: '轴承 6203', en: 'Bearing 6203' },
    description: 'Deep groove ball bearing, 17x40x12mm',
    baseUOM: 'ea',
    category: null, // Will be set after categories are created
    type: 'raw',
    specifications: {
      innerDiameter: 17,
      outerDiameter: 40,
      width: 12,
      type: 'Deep Groove Ball Bearing'
    },
    procurementInfo: {
      leadTime: 14,
      moq: 50,
      lastCost: 15.00,
      currency: 'CNY'
    },
    status: 'active',
    createdBy: null // Will be set after users are created
  },
  {
    materialNumber: `${TEST_PREFIX}MAT-003`,
    materialName: { zh: 'A4打印纸', en: 'A4 Printing Paper' },
    description: '80gsm A4 printing paper, white, 500 sheets per pack',
    baseUOM: 'pack',
    category: null, // Will be set after categories are created
    type: 'consumable',
    specifications: {
      size: 'A4',
      weight: 80,
      color: 'White',
      sheetsPerPack: 500
    },
    procurementInfo: {
      leadTime: 3,
      moq: 10,
      lastCost: 25.00,
      currency: 'CNY'
    },
    status: 'active',
    createdBy: null // Will be set after users are created
  }
];

const materialQuotations = [
  {
    quotationNumber: `MQ-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    title: { zh: '电阻器报价', en: 'Resistor Quotation' },
    description: 'Bulk resistor quotation request',
    items: [
      {
        material: null, // Will be set after materials are created
        materialNumber: 'E2E-TEST-MAT-001',
        materialName: { zh: '电阻器 10KΩ 1%', en: 'Resistor 10KΩ 1%' },
        quantity: 1000,
        uom: 'ea',
        specifications: 'Carbon film, 1% tolerance',
        targetPrice: 0.05,
        quotes: [
          {
            supplier: null, // Will be set after suppliers are created
            supplierName: { zh: '测试供应商A', en: 'Test Supplier A' },
            unitPrice: 0.045,
            totalPrice: 45.00,
            leadTime: 7,
            moq: 100,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentTerms: 'Net 30',
            isSelected: true,
            rank: 1
          }
        ]
      }
    ],
    requestDate: new Date(),
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'draft',
    createdBy: null // Will be set after users are created
  }
];

// Workflows - simplified for testing
const workflows = [
  {
    workflowName: 'E2E Supplier Approval Workflow',
    displayName: { zh: '供应商审批流程', en: 'Supplier Approval Workflow' },
    documentType: 'supplier',
    description: 'Multi-level supplier approval workflow for testing',
    isActive: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Review',
        approverRoles: [], // Will be set after roles are found
        approvalMode: 'any',
        isMandatory: true
      },
      {
        levelNumber: 2,
        levelName: 'Cost Center Review',
        approverRoles: [], // Will be set after roles are found
        approvalMode: 'any',
        isMandatory: true
      }
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gte',
        value: 10000,
        targetLevels: [1, 2]
      },
      {
        conditionType: 'amount',
        operator: 'lt',
        value: 10000,
        targetLevels: [1]
      }
    ],
    createdBy: null // Will be set after users are created
  },
  {
    workflowName: 'E2E Material Quotation Approval Workflow',
    displayName: { zh: '物料报价审批流程', en: 'Material Quotation Approval Workflow' },
    documentType: 'material_quotation',
    description: 'Material quotation approval workflow for testing',
    isActive: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Review',
        approverRoles: [], // Will be set after roles are found
        approvalMode: 'any',
        isMandatory: true
      }
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gte',
        value: 1000,
        targetLevels: [1]
      }
    ],
    createdBy: null // Will be set after users are created
  },
  {
    workflowName: 'E2E Purchase Order Approval Workflow',
    displayName: { zh: '采购订单审批流程', en: 'Purchase Order Approval Workflow' },
    documentType: 'purchase_order',
    description: 'Purchase order approval workflow for testing',
    isActive: true,
    levels: [
      {
        levelNumber: 1,
        levelName: 'Procurement Manager Review',
        approverRoles: [], // Will be set after roles are found
        approvalMode: 'any',
        isMandatory: true
      },
      {
        levelNumber: 2,
        levelName: 'Cost Center Approval',
        approverRoles: [], // Will be set after roles are found
        approvalMode: 'any',
        isMandatory: false
      }
    ],
    routingRules: [
      {
        conditionType: 'amount',
        operator: 'gte',
        value: 10000,
        targetLevels: [1, 2]
      },
      {
        conditionType: 'amount',
        operator: 'lt',
        value: 10000,
        targetLevels: [1]
      }
    ],
    createdBy: null // Will be set after users are created
  }
];

// Purchase Orders in various states
const purchaseOrders = [
  {
    poNumber: `PO-${Date.now()}-001`,
    supplier: null, // Will be set after suppliers are created
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    items: [
      {
        material: null, // Will be set after materials are created
        description: 'Carbon film resistor, 10K ohm, 1% tolerance, 1/4W',
        quantity: 500,
        uom: 'ea',
        unitPrice: 0.045,
        totalPrice: 22.50,
        lineTotal: 22.50,
        expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        notes: 'As per quotation MQ-20250122-0001'
      }
    ],
    subtotal: 22.50,
    totalAmount: 22.50,
    currency: 'CNY',
    status: 'draft',
    notes: 'Draft PO for testing basic creation',
    createdBy: null // Will be set after users are created
  },
  {
    poNumber: `PO-${Date.now()}-002`,
    supplier: null, // Will be set after suppliers are created
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    items: [
      {
        material: null, // Will be set after materials are created
        description: 'Deep groove ball bearing, 17x40x12mm',
        quantity: 20,
        uom: 'ea',
        unitPrice: 12.50,
        totalPrice: 250.00,
        lineTotal: 250.00,
        expectedDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        notes: 'Standard mechanical specifications'
      }
    ],
    subtotal: 250.00,
    totalAmount: 250.00,
    currency: 'CNY',
    status: 'draft',
    notes: 'PO for approval testing',
    createdBy: null // Will be set after users are created
  }
];

async function seedE2eTestData() {
  try {
    // Connect to database
    const mongoUri = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurarapp';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}...`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Ensure roles and permissions exist
    console.log('📝 Step 1: Ensuring roles and permissions...');
    await ensureRolesAndPermissions();

    // Step 2: Create test users
    console.log('📝 Step 2: Creating test users...');
    const createdUsers = await createTestUsers();
    console.log(`  ✓ Created/updated ${Object.keys(createdUsers).length} test users\n`);

    // Step 3: Create material categories
    console.log('📝 Step 3: Creating material categories...');
    const createdCategories = await createMaterialCategories();
    console.log(`  ✓ Created ${createdCategories.length} material categories\n`);

    // Step 4: Create suppliers
    console.log('📝 Step 4: Creating suppliers...');
    const createdSuppliers = await createSuppliers();
    console.log(`  ✓ Created ${createdSuppliers.length} suppliers\n`);

    // Step 5: Create materials (with category and supplier references)
    console.log('📝 Step 5: Creating materials...');
    const createdMaterials = await createMaterials(createdCategories, createdSuppliers);
    console.log(`  ✓ Created ${createdMaterials.length} materials\n`);

    // Step 6: Create material quotations
    console.log('📝 Step 6: Creating material quotations...');
    const createdQuotations = await createMaterialQuotations(createdSuppliers, createdMaterials);
    console.log(`  ✓ Created ${createdQuotations.length} material quotations\n`);

    // Step 7: Create workflows
    console.log('📝 Step 7: Creating workflows...');
    const createdWorkflows = await createWorkflows();
    console.log(`  ✓ Created ${createdWorkflows.length} workflows\n`);

    // Step 8: Create purchase orders
    console.log('📝 Step 8: Creating purchase orders...');
    const createdPOs = await createPurchaseOrders(createdSuppliers, createdMaterials);
    console.log(`  ✓ Created ${createdPOs.length} purchase orders\n`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 E2E TEST DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  - Test Users: ${Object.keys(createdUsers).length}`);
    console.log(`  - Material Categories: ${createdCategories.length}`);
    console.log(`  - Suppliers: ${createdSuppliers.length}`);
    console.log(`  - Materials: ${createdMaterials.length}`);
    console.log(`  - Material Quotations: ${createdQuotations.length}`);
    console.log(`  - Workflows: ${createdWorkflows.length}`);
    console.log(`  - Purchase Orders: ${createdPOs.length}`);
    console.log('\n🔑 Test User Credentials:');
    console.log(`  - Username: Any test user email (e.g., e2e.admin@test.com)`);
    console.log(`  - Password: ${DEFAULT_PASSWORD}`);
    console.log('\n📋 Available Test Data:');
    console.log('  - Suppliers: E2E-TEST-SUP-001, E2E-TEST-SUP-002, E2E-TEST-SUP-003');
    console.log('  - Materials: E2E-TEST-MAT-001, E2E-TEST-MAT-002, E2E-TEST-MAT-003');
    console.log('  - POs: E2E-TEST-PO-001 (Draft), E2E-TEST-PO-002 (Pending), E2E-TEST-PO-003 (Approved)');
    console.log('\n🚀 Ready for E2E testing!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error seeding E2E test data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

async function ensureRolesAndPermissions() {
  // Run the existing setup scripts but handle their database connections
  const setupPermissions = require('./setupPermissions');
  const createTestUsers = require('./createTestUsers');

  // Get the mongo URI
  const mongoUri = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurarapp';

  // These scripts handle their own connections, so we need to reconnect after
  await setupPermissions();

  // Reconnect to database after setupPermissions disconnects
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await createTestUsers();

  // Reconnect again after createTestUsers disconnects
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

async function createTestUsers() {
  const createdUsers = {};
  const userEmailToId = {};

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      let user = await Admin.findOne({ email: userData.email, removed: false });

      if (user) {
        console.log(`  - User already exists: ${userData.email}`);
        // Update existing user
        user.name = userData.name;
        user.surname = userData.surname;
        user.department = userData.department;
        user.enabled = true;
        user.removed = false;

        // Assign roles
        const roles = await Role.find({ name: { $in: userData.roleNames } });
        user.roles = roles.map(r => r._id);

        // Set approval authority if provided
        if (userData.approvalAuthority) {
          user.approvalAuthority = userData.approvalAuthority;
        }

        await user.save();
        createdUsers[userData.email] = user;
        userEmailToId[userData.email] = user._id;
        continue;
      }

      // Create new user
      const roles = await Role.find({ name: { $in: userData.roleNames } });
      if (roles.length === 0) {
        console.log(`  ⚠ Warning: No roles found for ${userData.email}, skipping...`);
        continue;
      }

      user = await Admin.create({
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        department: userData.department,
        roles: roles.map(r => r._id),
        enabled: true,
        removed: false,
        approvalAuthority: userData.approvalAuthority || undefined
      });

      createdUsers[userData.email] = user;
      userEmailToId[userData.email] = user._id;
      console.log(`  ✓ Created user: ${userData.email} (${userData.roleNames.join(', ')})`);

      // Create password
      const salt = uniqueId();
      const passwordHash = bcrypt.hashSync(salt + DEFAULT_PASSWORD);

      let userPassword = await AdminPassword.findOne({ user: user._id });
      if (userPassword) {
        userPassword.password = passwordHash;
        userPassword.salt = salt;
        await userPassword.save();
      } else {
        await AdminPassword.create({
          user: user._id,
          password: passwordHash,
          salt: salt,
          emailVerified: true,
          removed: false
        });
      }

    } catch (error) {
      console.error(`  ✗ Error creating user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createMaterialCategories() {
  const createdCategories = [];
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!adminUser) {
    console.log('  ⚠ Warning: Admin user not found, skipping category creation');
    return createdCategories;
  }

  for (const categoryData of materialCategories) {
    try {
      // Clone the category data and set createdBy
      const categoryToCreate = { ...categoryData, createdBy: adminUser._id };

      let category = await MaterialCategory.findOne({
        code: categoryToCreate.code,
        removed: false
      });

      if (category) {
        console.log(`  - Category already exists: ${categoryToCreate.code}`);
        createdCategories.push(category);
        continue;
      }

      category = await MaterialCategory.create(categoryToCreate);
      createdCategories.push(category);
      console.log(`  ✓ Created category: ${categoryToCreate.code}`);

    } catch (error) {
      console.error(`  ✗ Error creating category ${categoryData.code}:`, error.message);
    }
  }

  return createdCategories;
}

async function createSuppliers() {
  const createdSuppliers = [];
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!adminUser) {
    console.log('  ⚠ Warning: Admin user not found, skipping supplier creation');
    return createdSuppliers;
  }

  for (const supplierData of suppliers) {
    try {
      // Clone the supplier data and set createdBy
      const supplierToCreate = { ...supplierData, createdBy: adminUser._id };

      let supplier = await Supplier.findOne({
        supplierNumber: supplierToCreate.supplierNumber,
        removed: false
      });

      if (supplier) {
        console.log(`  - Supplier already exists: ${supplierToCreate.supplierNumber}`);
        createdSuppliers.push(supplier);
        continue;
      }

      supplier = await Supplier.create(supplierToCreate);
      createdSuppliers.push(supplier);
      console.log(`  ✓ Created supplier: ${supplierToCreate.supplierNumber}`);

    } catch (error) {
      console.error(`  ✗ Error creating supplier ${supplierData.supplierNumber}:`, error.message);
    }
  }

  return createdSuppliers;
}

async function createMaterials(createdCategories, createdSuppliers) {
  const createdMaterials = [];
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!adminUser) {
    console.log('  ⚠ Warning: Admin user not found, skipping material creation');
    return createdMaterials;
  }

  for (let i = 0; i < materials.length; i++) {
    const materialData = { ...materials[i] };

    // Set createdBy
    materialData.createdBy = adminUser._id;

    // Set category reference
    if (createdCategories.length > 0) {
      materialData.category = createdCategories[i % createdCategories.length]._id;
    }

    try {
      let material = await Material.findOne({
        materialNumber: materialData.materialNumber,
        removed: false
      });

      if (material) {
        console.log(`  - Material already exists: ${materialData.materialNumber}`);
        createdMaterials.push(material);
        continue;
      }

      material = await Material.create(materialData);
      createdMaterials.push(material);
      console.log(`  ✓ Created material: ${materialData.materialNumber}`);

    } catch (error) {
      console.error(`  ✗ Error creating material ${materialData.materialNumber}:`, error.message);
    }
  }

  return createdMaterials;
}

async function createMaterialQuotations(createdSuppliers, createdMaterials) {
  const createdQuotations = [];
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!adminUser || createdSuppliers.length === 0 || createdMaterials.length === 0) {
    console.log('  ⚠ Warning: Required data not available, skipping quotation creation');
    return createdQuotations;
  }

  for (let i = 0; i < materialQuotations.length; i++) {
    const quotationData = { ...materialQuotations[i] };

    // Set createdBy
    quotationData.createdBy = adminUser._id;

    // Set supplier and material references
    quotationData.supplier = createdSuppliers[i % createdSuppliers.length]._id;
    quotationData.material = createdMaterials[i % createdMaterials.length]._id;

    try {
      let quotation = await MaterialQuotation.findOne({
        quotationNumber: quotationData.quotationNumber,
        removed: false
      });

      if (quotation) {
        console.log(`  - Quotation already exists: ${quotationData.quotationNumber}`);
        createdQuotations.push(quotation);
        continue;
      }

      quotation = await MaterialQuotation.create(quotationData);
      createdQuotations.push(quotation);
      console.log(`  ✓ Created quotation: ${quotationData.quotationNumber}`);

    } catch (error) {
      console.error(`  ✗ Error creating quotation ${quotationData.quotationNumber}:`, error.message);
    }
  }

  return createdQuotations;
}

async function createWorkflows() {
  const createdWorkflows = [];

  // Get role IDs for workflow approver roles
  const procurementManagerRole = await Role.findOne({ name: 'procurement_manager' });
  const costCenterRole = await Role.findOne({ name: 'cost_center' });
  const generalManagerRole = await Role.findOne({ name: 'general_manager' });
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!procurementManagerRole || !costCenterRole || !adminUser) {
    console.log('  ⚠ Warning: Required roles/users not found, skipping workflow creation');
    return createdWorkflows;
  }

  for (const workflowData of workflows) {
    try {
      // Clone the workflow data
      const workflowToCreate = { ...workflowData };

      // Set createdBy
      workflowToCreate.createdBy = adminUser._id;

      // Set approver roles for each level
      for (const level of workflowToCreate.levels) {
        if (level.levelName.includes('Procurement Manager')) {
          level.approverRoles = [procurementManagerRole._id];
        } else if (level.levelName.includes('Cost Center')) {
          level.approverRoles = [costCenterRole._id];
        } else if (level.levelName.includes('General Manager') && generalManagerRole) {
          level.approverRoles = [generalManagerRole._id];
        }
      }

      let workflow = await Workflow.findOne({
        workflowName: workflowToCreate.workflowName,
        removed: false
      });

      if (workflow) {
        console.log(`  - Workflow already exists: ${workflowToCreate.workflowName}`);
        createdWorkflows.push(workflow);
        continue;
      }

      workflow = await Workflow.create(workflowToCreate);
      createdWorkflows.push(workflow);
      console.log(`  ✓ Created workflow: ${workflowToCreate.workflowName}`);

    } catch (error) {
      console.error(`  ✗ Error creating workflow ${workflowData.workflowName}:`, error.message);
    }
  }

  return createdWorkflows;
}

async function createPurchaseOrders(createdSuppliers, createdMaterials) {
  const createdPOs = [];
  const adminUser = await Admin.findOne({ email: 'e2e.admin@test.com' });

  if (!adminUser || createdSuppliers.length === 0 || createdMaterials.length === 0) {
    console.log('  ⚠ Warning: Required data not available, skipping PO creation');
    return createdPOs;
  }

  for (let i = 0; i < purchaseOrders.length; i++) {
    const poData = { ...purchaseOrders[i] };

    // Set createdBy
    poData.createdBy = adminUser._id;

    // Set supplier reference
    poData.supplier = createdSuppliers[i % createdSuppliers.length]._id;

    // Set material references in items
    if (poData.items && poData.items.length > 0) {
      poData.items[0].material = createdMaterials[i % createdMaterials.length]._id;
    }

    try {
      let po = await PurchaseOrder.findOne({
        poNumber: poData.poNumber,
        removed: false
      });

      if (po) {
        console.log(`  - PO already exists: ${poData.poNumber}`);
        createdPOs.push(po);
        continue;
      }

      po = await PurchaseOrder.create(poData);
      createdPOs.push(po);
      console.log(`  ✓ Created PO: ${poData.poNumber} (${poData.status})`);

    } catch (error) {
      console.error(`  ✗ Error creating PO ${poData.poNumber}:`, error.message);
    }
  }

  return createdPOs;
}

// Run if executed directly
if (require.main === module) {
  seedE2eTestData();
}

module.exports = seedE2eTestData;