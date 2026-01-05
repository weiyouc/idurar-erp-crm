/**
 * Role Management Controller
 * 
 * RESTful API endpoints for role management (CRUD operations).
 * 
 * Routes:
 *   GET    /api/roles              - List all roles
 *   GET    /api/roles/:id          - Get role by ID
 *   POST   /api/roles              - Create new role
 *   PUT    /api/roles/:id          - Update role
 *   DELETE /api/roles/:id          - Delete role
 *   POST   /api/roles/:id/permissions - Add permissions to role
 *   DELETE /api/roles/:id/permissions - Remove permissions from role
 */

const Role = require('../models/coreModels/Role');
const Permission = require('../models/coreModels/Permission');
const AuditLogService = require('../services/AuditLogService');

/**
 * List all roles
 * GET /api/roles
 * 
 * Query params:
 *   - includeSystem: boolean - Include system roles (default: true)
 *   - activeOnly: boolean - Only active roles (default: false)
 *   - populate: string - Comma-separated fields to populate
 */
exports.list = async (req, res) => {
  try {
    const { includeSystem = 'true', activeOnly = 'false', populate } = req.query;
    
    let query = {};
    
    if (includeSystem === 'false') {
      query.isSystemRole = false;
    }
    
    if (activeOnly === 'true') {
      query.removed = false;
    }
    
    let roleQuery = Role.find(query).sort({ name: 1 });
    
    if (populate) {
      const fields = populate.split(',');
      fields.forEach(field => {
        roleQuery = roleQuery.populate(field.trim());
      });
    }
    
    const roles = await roleQuery;
    
    res.json({
      success: true,
      data: roles,
      count: roles.length
    });
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving roles',
      error: error.message
    });
  }
};

/**
 * Get role by ID
 * GET /api/roles/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id)
      .populate('permissions')
      .populate('inheritsFrom');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving role',
      error: error.message
    });
  }
};

/**
 * Create new role
 * POST /api/roles
 * 
 * Body:
 *   - name: string (required)
 *   - displayName: object { zh, en } (required)
 *   - description: string
 *   - permissions: array of permission IDs
 *   - inheritsFrom: array of role IDs
 */
exports.create = async (req, res) => {
  try {
    const { name, displayName, description, permissions, inheritsFrom } = req.body;
    
    // Validation
    if (!name || !displayName || !displayName.zh || !displayName.en) {
      return res.status(400).json({
        success: false,
        message: 'Name and displayName (zh, en) are required'
      });
    }
    
    // Check if role name already exists
    const existingRole = await Role.findOne({ name, removed: false });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }
    
    // Create role
    const role = await Role.create({
      name,
      displayName,
      description,
      permissions: permissions || [],
      inheritsFrom: inheritsFrom || [],
      isSystemRole: false
    });
    
    // Log creation
    await AuditLogService.logCreate({
      user: req.admin._id,
      entityType: 'Role',
      entityId: role._id,
      newData: { name, displayName, description }
    });
    
    // Populate and return
    const populatedRole = await Role.findById(role._id)
      .populate('permissions')
      .populate('inheritsFrom');
    
    res.status(201).json({
      success: true,
      data: populatedRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message
    });
  }
};

/**
 * Update role
 * PUT /api/roles/:id
 * 
 * Body: Any role fields to update
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Prevent updating system roles
    if (role.isSystemRole && !req.body.allowSystemUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update system role'
      });
    }
    
    // Track changes for audit log
    const changes = [];
    const oldData = role.toObject();
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== 'allowSystemUpdate' && role[key] !== undefined) {
        if (JSON.stringify(role[key]) !== JSON.stringify(updates[key])) {
          changes.push({
            field: key,
            oldValue: role[key],
            newValue: updates[key]
          });
          role[key] = updates[key];
        }
      }
    });
    
    await role.save();
    
    // Log update
    if (changes.length > 0) {
      await AuditLogService.logUpdate({
        user: req.admin._id,
        entityType: 'Role',
        entityId: role._id,
        changes,
        oldData,
        newData: role.toObject()
      });
    }
    
    // Populate and return
    const populatedRole = await Role.findById(role._id)
      .populate('permissions')
      .populate('inheritsFrom');
    
    res.json({
      success: true,
      data: populatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
};

/**
 * Delete role (soft delete)
 * DELETE /api/roles/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Prevent deleting system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system role'
      });
    }
    
    // Soft delete
    role.removed = true;
    await role.save();
    
    // Log deletion
    await AuditLogService.logDelete({
      user: req.admin._id,
      entityType: 'Role',
      entityId: role._id,
      oldData: role.toObject()
    });
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
};

/**
 * Add permissions to role
 * POST /api/roles/:id/permissions
 * 
 * Body:
 *   - permissionIds: array of permission IDs
 */
exports.addPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds array is required'
      });
    }
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Verify permissions exist
    const permissions = await Permission.find({
      _id: { $in: permissionIds },
      removed: false
    });
    
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some permissions not found or inactive'
      });
    }
    
    // Add permissions (avoid duplicates)
    const existingIds = role.permissions.map(p => p.toString());
    const newIds = permissionIds.filter(id => !existingIds.includes(id.toString()));
    
    role.permissions.push(...newIds);
    await role.save();
    
    // Log update
    await AuditLogService.logUpdate({
      user: req.admin._id,
      entityType: 'Role',
      entityId: role._id,
      changes: [{
        field: 'permissions',
        oldValue: existingIds,
        newValue: role.permissions
      }]
    });
    
    // Populate and return
    const populatedRole = await Role.findById(role._id).populate('permissions');
    
    res.json({
      success: true,
      data: populatedRole,
      message: `Added ${newIds.length} permission(s) to role`
    });
  } catch (error) {
    console.error('Error adding permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding permissions',
      error: error.message
    });
  }
};

/**
 * Remove permissions from role
 * DELETE /api/roles/:id/permissions
 * 
 * Body:
 *   - permissionIds: array of permission IDs
 */
exports.removePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds array is required'
      });
    }
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const oldPermissions = [...role.permissions];
    
    // Remove permissions (convert IDs to strings for comparison)
    const idsToRemove = permissionIds.map(id => id.toString());
    role.permissions = role.permissions.filter(
      p => !idsToRemove.includes(p.toString())
    );
    
    await role.save();
    
    // Log update
    await AuditLogService.logUpdate({
      user: req.admin._id,
      entityType: 'Role',
      entityId: role._id,
      changes: [{
        field: 'permissions',
        oldValue: oldPermissions,
        newValue: role.permissions
      }]
    });
    
    // Populate and return
    const populatedRole = await Role.findById(role._id).populate('permissions');
    
    res.json({
      success: true,
      data: populatedRole,
      message: 'Permissions removed from role'
    });
  } catch (error) {
    console.error('Error removing permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing permissions',
      error: error.message
    });
  }
};

