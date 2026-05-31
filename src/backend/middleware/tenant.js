/**
 * TENANT ISOLATION MIDDLEWARE
 * Automatically filters all queries by tenant_id
 * Ensures complete data isolation between tenants
 */

const { Tenant, User } = require('../models');

/**
 * Extract tenant_id from authenticated user
 * Attach to request object for use in controllers
 */
const attachTenant = async (req, res, next) => {
  try {
    // Skip for authentication endpoints and health checks
    const skipPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register'];
    if (skipPaths.some(path => req.path.includes(path))) {
      return next();
    }

    // If user is authenticated, attach tenant_id
    if (req.user && req.user.id) {
      // Get user with tenant info
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'role', 'tenant_id'],
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'tenant_key', 'company_name', 'status', 'subscription_type', 'subscription_end']
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Attach tenant info to request
      req.tenantId = user.tenant_id;
      req.tenant = user.tenant;
      req.userRole = user.role;

      // Check if tenant is active
      if (user.tenant && user.tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Your account is ${user.tenant.status}. Please contact support.`,
          tenantStatus: user.tenant.status
        });
      }

      // Check if subscription is expired (skip for trial and lifetime)
      if (user.tenant && 
          user.tenant.subscription_type !== 'trial' && 
          user.tenant.subscription_type !== 'lifetime' &&
          user.tenant.subscription_end && 
          new Date(user.tenant.subscription_end) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please renew to continue.',
          subscriptionExpired: true,
          subscriptionEnd: user.tenant.subscription_end
        });
      }

      // Super Admin can access all tenants (but we still track which tenant they're acting on)
      if (req.userRole === 'Super Admin' && req.query.tenant_id) {
        req.tenantId = parseInt(req.query.tenant_id);
        const tenant = await Tenant.findByPk(req.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            message: 'Tenant not found'
          });
        }
        req.tenant = tenant;
      }
    }

    next();
  } catch (error) {
    console.error('Tenant attachment error:', error);
    next(); // Continue without tenant info (will be caught by auth middleware)
  }
};

/**
 * Enforce tenant isolation on queries
 * Use this as a helper in controllers
 */
const enforceTenantFilter = (model, whereClause = {}) => {
  return (req, res, next) => {
    // Skip for Super Admin
    if (req.userRole === 'Super Admin') {
      return next();
    }

    // Enforce tenant_id filter
    if (req.tenantId) {
      whereClause.tenant_id = req.tenantId;
      req.tenantFilter = whereClause;
    }

    next();
  };
};

/**
 * Check if user has access to specific tenant
 */
const checkTenantAccess = (requiredTenantId) => {
  return async (req, res, next) => {
    // Super Admin can access all tenants
    if (req.userRole === 'Super Admin') {
      return next();
    }

    // Regular users can only access their own tenant
    if (req.tenantId !== requiredTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have access to this tenant'
      });
    }

    next();
  };
};

/**
 * Validate tenant exists and is active
 */
const validateTenant = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const tenant = await Tenant.findByPk(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Tenant is ${tenant.status}`
      });
    }

    next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating tenant'
    });
  }
};

module.exports = {
  attachTenant,
  enforceTenantFilter,
  checkTenantAccess,
  validateTenant
};
