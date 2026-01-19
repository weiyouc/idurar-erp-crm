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

const mongoose = require('mongoose');
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
      if (!userRoles || userRoles.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No roles assigned'
        });
      }
      
      // Always populate roles to ensure we have full role objects
      const Admin = require('../../models/coreModels/Admin');
      const populatedAdmin = await Admin.findById(req.admin._id).populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });
      if (!populatedAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const rawRoles = populatedAdmin.roles;
      userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];

      // Resolve legacy role strings or unpopulated role IDs
      const resolvedRoles = [];
      const roleNameCandidates = [];
      const roleIds = [];

      for (const role of userRoles) {
        if (!role) continue;
        if (typeof role === 'string') {
          if (mongoose.Types.ObjectId.isValid(role)) {
            roleIds.push(role);
          } else {
            roleNameCandidates.push(role);
          }
          continue;
        }
        if (role._id && role.permissions !== undefined) {
          resolvedRoles.push(role);
        } else if (role._id) {
          roleIds.push(role._id.toString());
        }
      }

      if (roleIds.length > 0 || roleNameCandidates.length > 0) {
        const fetchedRoles = await Role.find({
          $or: [
            ...(roleIds.length ? [{ _id: { $in: roleIds } }] : []),
            ...(roleNameCandidates.length ? [{ name: { $in: roleNameCandidates } }] : [])
          ]
        }).populate('permissions');
        resolvedRoles.push(...fetchedRoles);
      }

      userRoles = resolvedRoles;
      
      if (userRoles.length === 0) {
        console.error(`[checkPermission] User ${req.admin._id} (${req.admin.email}) has no roles assigned`);
        return res.status(403).json({
          success: false,
          message: 'Access denied: No roles assigned'
        });
      }
      
      // Check if user has system_administrator role - grant all permissions
      const roleNames = userRoles.map(r => {
        if (typeof r === 'string') return r;
        if (r && r.name) return r.name;
        return null;
      }).filter(Boolean);
      
      console.log(`[checkPermission] User ${req.admin._id} (${req.admin.email}) has roles:`, roleNames);
      
      if (roleNames.includes('system_administrator')) {
        // System administrator has all permissions, skip permission check
        console.log(`[checkPermission] System administrator detected, granting access to ${resource}:${action}`);
        req.permission = {
          resource,
          action,
          scope: 'all',
          conditions: null
        };
        return next();
      }
      
      // Collect all permissions from all roles (including inherited)
      const allPermissionIds = new Set();
      for (const role of userRoles) {
        try {
          // Ensure role has permissions populated
          if (!role.permissions || role.permissions.length === 0) {
            continue; // Skip roles without permissions
          }
          
          const rolePermissions = await role.getAllPermissions();
          if (rolePermissions && Array.isArray(rolePermissions)) {
            rolePermissions.forEach(permId => {
              if (permId) {
                allPermissionIds.add(permId.toString());
              }
            });
          }
        } catch (roleError) {
          console.warn(`Error getting permissions for role ${role.name || role._id}:`, roleError.message);
          continue; // Skip this role if there's an error
        }
      }
      
      // If no permissions found, deny access
      if (allPermissionIds.size === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No permissions assigned to your roles',
          required: { resource, action, scope }
        });
      }
      
      // Find permissions that match the resource and action
      let matchingPermissions = [];
      try {
        matchingPermissions = await Permission.find({
          _id: { $in: Array.from(allPermissionIds) },
          resource: resource.toLowerCase(),
          action: action.toLowerCase(),
          removed: false
        });
      } catch (permissionError) {
        console.error('Error querying permissions:', permissionError);
        // If Permission model query fails, deny access
        return res.status(403).json({
          success: false,
          message: 'Access denied: Error checking permissions',
          required: { resource, action, scope }
        });
      }
      
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
      if (matchedPermission.conditions && typeof matchedPermission.matchesConditions === 'function') {
        try {
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
        } catch (conditionError) {
          console.warn('Error checking permission conditions:', conditionError.message);
          // If condition check fails, allow access (fail open for now)
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

