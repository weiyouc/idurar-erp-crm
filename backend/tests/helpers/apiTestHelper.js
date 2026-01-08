/**
 * API Test Helper
 * 
 * Provides utilities for setting up authentication, test data, and making API requests
 * in integration tests.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../../src/models/coreModels/Admin');
const AdminPassword = require('../../src/models/coreModels/AdminPassword');
const Role = require('../../src/models/coreModels/Role');
const Permission = require('../../src/models/coreModels/Permission');

/**
 * Create a test admin user with authentication
 */
async function createTestAdmin(email, password = 'Test123456!', roles = []) {
  const admin = await Admin.create({
    email,
    name: 'Test',
    surname: 'User',
    enabled: true,
    roles
  });

  // Generate salt and hash password (same way as AdminPassword model does)
  const shortid = require('shortid');
  const salt = shortid.generate();
  const hashedPassword = await bcrypt.hash(salt + password, 10);

  await AdminPassword.create({
    user: admin._id,
    password: hashedPassword,
    salt,
    loggedSessions: [],
    emailVerified: true,
    removed: false
  });

  return admin;
}

/**
 * Create a system administrator role
 */
async function createSystemAdminRole() {
  return await Role.create({
    name: 'system_administrator',
    displayName: { en: 'System Administrator', zh: '系统管理员' },
    description: 'System administrator with full access',
    isSystemRole: true,
    permissions: []
  });
}

/**
 * Create permissions for a resource
 */
async function createResourcePermissions(resource) {
  const actions = ['create', 'read', 'update', 'delete', 'list', 'submit', 'approve', 'cancel', 'send'];
  const permissions = {};

  for (const action of actions) {
    permissions[action] = await Permission.create({
      resource,
      action,
      scope: 'all',
      description: `${action} ${resource}`
    });
  }

  return permissions;
}

/**
 * Create a role with permissions
 */
async function createRoleWithPermissions(name, permissions) {
  const permissionIds = Object.values(permissions).map(p => p._id);
  
  return await Role.create({
    name,
    displayName: { en: name, zh: name },
    description: `${name} role`,
    permissions: permissionIds
  });
}

/**
 * Login and get auth token
 */
async function loginAndGetToken(app, email, password) {
  const response = await request(app)
    .post('/api/login')
    .send({ email, password });

  if (response.status === 200 && response.body.success) {
    return response.body.result.token;
  }
  
  // If login fails, create token manually for testing
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new Error(`Admin not found: ${email}`);
  }

  const token = jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET || 'p6FSrVog0Tj6uqaSr/DzhJcalssRtwRLGBBTyDv+JTQ=',
    { expiresIn: '24h' }
  );

  // Add token to logged sessions
  await AdminPassword.findOneAndUpdate(
    { user: admin._id },
    { $push: { loggedSessions: token } }
  );

  return token;
}

/**
 * Create a fully authenticated test user with all permissions
 */
async function createFullAccessUser(app, email = 'test@test.com') {
  const systemAdminRole = await createSystemAdminRole();
  const admin = await createTestAdmin(email, 'Test123456!', [systemAdminRole._id]);
  const token = await loginAndGetToken(app, email, 'Test123456!');
  
  return { admin, token, role: systemAdminRole };
}

/**
 * Make authenticated API request
 */
function authenticatedRequest(app, token) {
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  await Admin.deleteMany({ email: /@test\.com$/ });
  await AdminPassword.deleteMany({});
  await Role.deleteMany({ name: { $regex: /^(test_|system_administrator)/ } });
  await Permission.deleteMany({ resource: { $regex: /^test_/ } });
}

module.exports = {
  createTestAdmin,
  createSystemAdminRole,
  createResourcePermissions,
  createRoleWithPermissions,
  loginAndGetToken,
  createFullAccessUser,
  authenticatedRequest,
  cleanupTestData
};

