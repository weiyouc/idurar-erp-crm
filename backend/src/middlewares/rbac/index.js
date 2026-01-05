/**
 * RBAC Middleware
 * 
 * Role-Based Access Control middleware for protecting routes.
 * 
 * Usage:
 *   const { checkRole, checkPermission } = require('./middlewares/rbac');
 *   
 *   // Check role
 *   router.get('/admin', checkRole('system_administrator'), handler);
 *   
 *   // Check permission
 *   router.post('/suppliers', checkPermission('supplier', 'create'), handler);
 *   router.get('/suppliers', checkPermission('supplier', 'read', 'all'), handler);
 */

const checkRole = require('./checkRole');
const checkPermission = require('./checkPermission');

module.exports = {
  checkRole,
  checkPermission
};

