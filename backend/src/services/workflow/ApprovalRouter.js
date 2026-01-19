/**
 * Approval Router Service
 * 
 * Determines the approval path for a workflow based on routing rules.
 * Evaluates conditional rules and returns the required approval levels.
 * 
 * Usage:
 *   const { ApprovalRouter } = require('./services/workflow');
 *   
 *   const levels = await ApprovalRouter.determineApprovalPath(workflow, {
 *     amount: 50000,
 *     currency: 'CNY',
 *     department: 'Procurement'
 *   });
 */

const Admin = require('../../models/coreModels/Admin');

class ApprovalRouter {
  
  /**
   * Determine the required approval levels for a workflow
   * 
   * @param {Workflow} workflow - Workflow document
   * @param {Object} context - Context data for rule evaluation (e.g., { amount, department })
   * @returns {Promise<Array>} Array of approval levels with approvers
   */
  static async determineApprovalPath(workflow, context = {}) {
    try {
      let approvalLevels = [];
      
      // Prefer workflow model helpers (supports documentType-specific rules)
      if (typeof workflow.getRequiredLevels === 'function' && workflow.levels) {
        const requiredLevelNumbers = workflow.getRequiredLevels(context);
        approvalLevels = requiredLevelNumbers;
      } else {
        // Legacy routing rules format support
        if (workflow.routingRules && workflow.routingRules.length > 0) {
          approvalLevels = await this.evaluateRoutingRules(workflow.routingRules, context);
        }
        
        // If no routing rules matched or no routing rules exist, use default levels
        if (approvalLevels.length === 0 && workflow.levels) {
          approvalLevels = workflow.levels.map(level => level.levelNumber).filter(Boolean);
        }
      }
      
      return approvalLevels;
    } catch (error) {
      console.error('Error determining approval path:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate routing rules against context
   * 
   * @param {Array} routingRules - Array of routing rules from workflow
   * @param {Object} context - Context data for evaluation
   * @returns {Promise<Array>} Matching approval levels
   */
  static async evaluateRoutingRules(routingRules, context) {
    try {
      // Find the first matching rule
      for (const rule of routingRules) {
        if (this.evaluateRule(rule.conditions, context)) {
          return rule.levels;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error evaluating routing rules:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate a single rule's conditions
   * 
   * @param {Object} conditions - Rule conditions
   * @param {Object} context - Context data
   * @returns {boolean} True if all conditions are met
   */
  static evaluateRule(conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = always match
    }
    
    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = context[key];
      
      // If context doesn't have this key, condition fails
      if (contextValue === undefined || contextValue === null) {
        return false;
      }
      
      // Handle comparison operators
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Check for operators like $gte, $lte, $gt, $lt, $eq, $ne
        if (!this.evaluateOperators(contextValue, value)) {
          return false;
        }
      } else {
        // Direct equality check
        if (contextValue !== value) {
          return false;
        }
      }
    }
    
    return true; // All conditions met
  }
  
  /**
   * Evaluate operators in conditions
   * 
   * @param {*} contextValue - Value from context
   * @param {Object} operators - Operator object (e.g., { $gte: 10000 })
   * @returns {boolean} True if all operators are satisfied
   */
  static evaluateOperators(contextValue, operators) {
    for (const [operator, value] of Object.entries(operators)) {
      switch (operator) {
        case '$gte':
          if (!(contextValue >= value)) return false;
          break;
        case '$lte':
          if (!(contextValue <= value)) return false;
          break;
        case '$gt':
          if (!(contextValue > value)) return false;
          break;
        case '$lt':
          if (!(contextValue < value)) return false;
          break;
        case '$eq':
          if (contextValue !== value) return false;
          break;
        case '$ne':
          if (contextValue === value) return false;
          break;
        case '$in':
          if (!Array.isArray(value) || !value.includes(contextValue)) return false;
          break;
        case '$nin':
          if (!Array.isArray(value) || value.includes(contextValue)) return false;
          break;
        default:
          // Unknown operator, treat as equality
          if (contextValue !== value) return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate that approvers exist and are active
   * 
   * @param {Array<ObjectId>} approverIds - Array of approver IDs
   * @returns {Promise<Array<ObjectId>>} Array of valid approver IDs
   */
  static async validateApprovers(approverIds) {
    try {
      if (!approverIds || approverIds.length === 0) {
        return [];
      }
      
      // Find active admins
      const validApprovers = await Admin.find({
        _id: { $in: approverIds },
        enabled: true,
        removed: false
      }).select('_id');
      
      return validApprovers.map(admin => admin._id);
    } catch (error) {
      console.error('Error validating approvers:', error);
      return [];
    }
  }
  
  /**
   * Get approvers by role
   * 
   * @param {string} roleName - Role name
   * @returns {Promise<Array<ObjectId>>} Array of admin IDs with that role
   */
  static async getApproversByRole(roleName) {
    try {
      const Role = require('../../models/coreModels/Role');
      
      const role = await Role.findOne({ name: roleName, removed: false });
      if (!role) {
        return [];
      }
      
      const admins = await Admin.find({
        roles: role._id,
        enabled: true,
        removed: false
      }).select('_id');
      
      return admins.map(admin => admin._id);
    } catch (error) {
      console.error('Error getting approvers by role:', error);
      return [];
    }
  }

  /**
   * Get approvers by role IDs
   * 
   * @param {Array<ObjectId>} roleIds - Role IDs
   * @returns {Promise<Array<ObjectId>>} Array of admin IDs with those roles
   */
  static async getApproversByRoleIds(roleIds) {
    try {
      if (!roleIds || roleIds.length === 0) {
        return [];
      }
      
      const admins = await Admin.find({
        roles: { $in: roleIds },
        enabled: true,
        removed: false
      }).select('_id');
      
      return admins.map(admin => admin._id);
    } catch (error) {
      console.error('Error getting approvers by role IDs:', error);
      return [];
    }
  }
  
  /**
   * Get approvers by department
   * 
   * @param {string} department - Department name
   * @returns {Promise<Array<ObjectId>>} Array of admin IDs in that department
   */
  static async getApproversByDepartment(department) {
    try {
      const admins = await Admin.find({
        department,
        enabled: true,
        removed: false
      }).select('_id');
      
      return admins.map(admin => admin._id);
    } catch (error) {
      console.error('Error getting approvers by department:', error);
      return [];
    }
  }
  
}

module.exports = ApprovalRouter;

