/**
 * RBAC Middleware: Check Role
 * 
 * Verifies that the authenticated user has one of the required roles.
 * 
 * Usage:
 *   router.get('/admin-only', checkRole(['system_administrator']), handler);
 *   router.post('/procurement', checkRole(['procurement_manager', 'purchaser']), handler);
 * 
 * Returns 403 Forbidden if user doesn't have required role.
 */

const Role = require('../../models/coreModels/Role');

/**
 * Check if user has one of the required roles
 * 
 * @param {string|string[]} requiredRoles - Single role name or array of role names
 * @returns {Function} Express middleware function
 */
const checkRole = (requiredRoles) => {
  // Normalize to array
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Check if user has roles
      if (!req.admin.roles || req.admin.roles.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No roles assigned'
        });
      }
      
      // Populate roles if needed
      let userRoles = req.admin.roles;
      if (userRoles[0] && typeof userRoles[0] !== 'object') {
        // Roles are just IDs, need to populate
        const Admin = require('../../models/coreModels/Admin');
        const populatedAdmin = await Admin.findById(req.admin._id).populate('roles');
        userRoles = populatedAdmin.roles;
      }
      
      // Check if user has any of the required roles
      const userRoleNames = userRoles.map(role => role.name);
      const hasRole = rolesArray.some(requiredRole => userRoleNames.includes(requiredRole));
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Insufficient permissions',
          requiredRoles: rolesArray,
          userRoles: userRoleNames
        });
      }
      
      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Error in checkRole middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking role permissions',
        error: error.message
      });
    }
  };
};

module.exports = checkRole;

