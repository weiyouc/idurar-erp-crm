/**
 * RBAC Middleware: Check Permission
 * 
 * Verifies that the authenticated user has the required permission
 * (resource + action + scope).
 * 
 * Usage:
 *   router.post('/suppliers', checkPermission('supplier', 'create'), handler);
 *   router.get('/suppliers', checkPermission('supplier', 'read', 'all'), handler);
 *   router.delete('/suppliers/:id', checkPermission('supplier', 'delete'), handler);
 * 
 * Scope Options:
 *   - 'own': User can only access their own records
 *   - 'team': User can access own and subordinates' records
 *   - 'all': User can access all records
 * 
 * Returns 403 Forbidden if user doesn't have required permission.
 */

const Permission = require('../../models/coreModels/Permission');
const Role = require('../../models/coreModels/Role');

/**
 * Check if user has required permission
 * 
 * @param {string} resource - Resource name (e.g., 'supplier', 'purchase_order')
 * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete', 'approve')
 * @param {string} [scope='own'] - Required scope ('own', 'team', 'all')
 * @param {Object} [context={}] - Additional context for conditional permissions
 * @returns {Function} Express middleware function
 */
const checkPermission = (resource, action, scope = 'own', context = {}) => {
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
        const Admin = require('../../models/coreModels/Admin');
        const populatedAdmin = await Admin.findById(req.admin._id).populate({
          path: 'roles',
          populate: { path: 'permissions' }
        });
        userRoles = populatedAdmin.roles;
      }
      
      // Collect all permissions from all roles (including inherited)
      const allPermissionIds = new Set();
      for (const role of userRoles) {
        const rolePermissions = await role.getAllPermissions();
        rolePermissions.forEach(permId => allPermissionIds.add(permId.toString()));
      }
      
      // Find permissions that match the resource and action
      const matchingPermissions = await Permission.find({
        _id: { $in: Array.from(allPermissionIds) },
        resource: resource.toLowerCase(),
        action: action.toLowerCase(),
        removed: false
      });
      
      if (matchingPermissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Permission not found',
          required: { resource, action, scope }
        });
      }
      
      // Check if any permission matches the required scope
      // Scope hierarchy: 'all' > 'team' > 'own'
      let hasPermission = false;
      let matchedPermission = null;
      
      for (const permission of matchingPermissions) {
        // Check scope
        if (permission.scope === 'all') {
          // 'all' scope satisfies any requirement
          hasPermission = true;
          matchedPermission = permission;
          break;
        } else if (permission.scope === 'team' && (scope === 'team' || scope === 'own')) {
          // 'team' scope satisfies 'team' and 'own' requirements
          hasPermission = true;
          matchedPermission = permission;
          break;
        } else if (permission.scope === 'own' && scope === 'own') {
          // 'own' scope only satisfies 'own' requirement
          hasPermission = true;
          matchedPermission = permission;
          break;
        }
      }
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Insufficient permission scope',
          required: { resource, action, scope }
        });
      }
      
      // Check conditional permissions if any
      if (matchedPermission.conditions) {
        const mergedContext = { ...context, ...req.body, ...req.query };
        const conditionsMet = matchedPermission.matchesConditions(mergedContext);
        
        if (!conditionsMet) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Permission conditions not met',
            required: { resource, action, scope },
            conditions: matchedPermission.conditions
          });
        }
      }
      
      // Attach permission info to request for potential use in handlers
      req.permission = {
        resource,
        action,
        scope: matchedPermission.scope,
        conditions: matchedPermission.conditions
      };
      
      // User has required permission, proceed
      next();
    } catch (error) {
      console.error('Error in checkPermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

module.exports = checkPermission;

