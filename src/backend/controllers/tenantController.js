/**
 * TENANT CONTROLLER
 * Handles tenant provisioning, management, and monitoring
 * Used by Super Admin to create and manage tenants
 */

const { Tenant, User, License, Settings } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * GET /api/v1/tenants - List all tenants (Super Admin only)
 */
exports.getAllTenants = async (req, res) => {
  try {
    if (req.userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin only'
      });
    }

    const { status, subscription_type, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (subscription_type) where.subscription_type = subscription_type;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'status']
        },
        {
          model: License,
          as: 'licenses',
          attributes: ['id', 'license_key', 'status', 'expiry_date']
        }
      ]
    });

    res.json({
      success: true,
      tenants,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenants',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/tenants - Create new tenant (Super Admin only)
 */
exports.createTenant = async (req, res) => {
  try {
    if (req.userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin only'
      });
    }

    const {
      tenant_key,
      company_name,
      contact_email,
      contact_phone,
      address,
      admin_name,
      admin_email,
      admin_password,
      subscription_type = 'trial',
      max_users = 10
    } = req.body;

    // Validate required fields
    if (!tenant_key || !company_name || !admin_name || !admin_email || !admin_password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tenant_key, company_name, admin_name, admin_email, admin_password'
      });
    }

    // Validate tenant_key format
    if (!/^[a-z0-9_-]+$/.test(tenant_key)) {
      return res.status(400).json({
        success: false,
        message: 'tenant_key must be lowercase letters, numbers, hyphens, or underscores only'
      });
    }

    // Check if tenant_key already exists
    const existingTenant = await Tenant.findOne({ where: { tenant_key } });
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'tenant_key already exists'
      });
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ where: { email: admin_email } });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin email already exists'
      });
    }

    // Calculate subscription dates
    const subscriptionStart = new Date();
    let subscriptionEnd;
    switch (subscription_type) {
      case 'trial':
        subscriptionEnd = new Date(subscriptionStart.getTime() + (45 * 24 * 60 * 60 * 1000)); // 45 days
        break;
      case 'monthly':
        subscriptionEnd = new Date(subscriptionStart.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        break;
      case 'yearly':
        subscriptionEnd = new Date(subscriptionStart.getTime() + (365 * 24 * 60 * 60 * 1000)); // 365 days
        break;
      case 'lifetime':
        subscriptionEnd = null;
        break;
      default:
        subscriptionEnd = new Date(subscriptionStart.getTime() + (45 * 24 * 60 * 60 * 1000));
    }

    // Create tenant
    const tenant = await Tenant.create({
      tenant_key,
      company_name,
      contact_email,
      contact_phone,
      address,
      status: 'active',
      subscription_type,
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      max_users,
      current_users: 1,
      settings: {}
    });

    // Create admin user for tenant
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const adminUser = await User.create({
      name: admin_name,
      email: admin_email,
      password: hashedPassword,
      phone: contact_phone,
      role: 'Admin',
      status: 'active',
      tenant_id: tenant.id
    });

    // Create license for tenant
    const licenseKey = `LIC-${tenant_key.toUpperCase()}-${Date.now()}`;
    const license = await License.create({
      tenant_id: tenant.id,
      license_key: licenseKey,
      client_email: contact_email || admin_email,
      status: subscription_type === 'trial' ? 'trial' : 'active',
      type: subscription_type,
      issued_date: subscriptionStart,
      expiry_date: subscriptionEnd,
      allowed_devices: 1,
      active_devices: 0
    });

    // Copy default settings to new tenant
    const defaultSettings = await Settings.findAll({
      where: { tenant_id: 1 } // Get from default tenant
    });

    const tenantSettings = defaultSettings.map(setting => ({
      tenant_id: tenant.id,
      setting_key: setting.setting_key,
      setting_value: setting.setting_key.startsWith('company_') ? '' : setting.setting_value
    }));

    // Update company-specific settings
    const companySettings = tenantSettings.find(s => s.setting_key === 'company_name');
    if (companySettings) companySettings.setting_value = company_name;
    
    const emailSettings = tenantSettings.find(s => s.setting_key === 'company_email');
    if (emailSettings) emailSettings.setting_value = contact_email || '';
    
    const phoneSettings = tenantSettings.find(s => s.setting_key === 'company_phone');
    if (phoneSettings) phoneSettings.setting_value = contact_phone || '';

    if (address) {
      const addressSettings = tenantSettings.find(s => s.setting_key === 'company_address');
      if (addressSettings) addressSettings.setting_value = address;
    }

    await Settings.bulkCreate(tenantSettings);

    // Log audit
    console.log(`✅ Tenant created: ${tenant_key} (${company_name}) by Super Admin`);

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        tenant_key: tenant.tenant_key,
        company_name: tenant.company_name,
        status: tenant.status,
        subscription_type: tenant.subscription_type,
        subscription_end: tenant.subscription_end
      },
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      license: {
        license_key: license.license_key,
        status: license.status,
        expiry_date: license.expiry_date
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tenant',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/tenants/:id - Get tenant details
 */
exports.getTenantById = async (req, res) => {
  try {
    if (req.userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin only'
      });
    }

    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'status', 'created_at']
        },
        {
          model: License,
          as: 'licenses',
          attributes: ['id', 'license_key', 'status', 'type', 'issued_date', 'expiry_date']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      tenant
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant',
      error: error.message
    });
  }
};

/**
 * PUT /api/v1/tenants/:id - Update tenant
 */
exports.updateTenant = async (req, res) => {
  try {
    if (req.userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin only'
      });
    }

    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const {
      company_name,
      contact_email,
      contact_phone,
      address,
      status,
      subscription_type,
      max_users
    } = req.body;

    // Update tenant
    await tenant.update({
      ...(company_name && { company_name }),
      ...(contact_email && { contact_email }),
      ...(contact_phone && { contact_phone }),
      ...(address && { address }),
      ...(status && { status }),
      ...(subscription_type && { subscription_type }),
      ...(max_users && { max_users })
    });

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tenant',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/tenants/stats - Get tenant statistics
 */
exports.getTenantStats = async (req, res) => {
  try {
    if (req.userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin only'
      });
    }

    const totalTenants = await Tenant.count();
    const activeTenants = await Tenant.count({ where: { status: 'active' } });
    const suspendedTenants = await Tenant.count({ where: { status: 'suspended' } });
    
    const trialTenants = await Tenant.count({ where: { subscription_type: 'trial' } });
    const monthlyTenants = await Tenant.count({ where: { subscription_type: 'monthly' } });
    const yearlyTenants = await Tenant.count({ where: { subscription_type: 'yearly' } });
    const lifetimeTenants = await Tenant.count({ where: { subscription_type: 'lifetime' } });

    const expiringSoon = await Tenant.count({
      where: {
        subscription_type: { [Op.notIn]: ['trial', 'lifetime'] },
        subscription_end: {
          [Op.between]: [new Date(), new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))] // Next 7 days
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalTenants,
        active: activeTenants,
        suspended: suspendedTenants,
        bySubscription: {
          trial: trialTenants,
          monthly: monthlyTenants,
          yearly: yearlyTenants,
          lifetime: lifetimeTenants
        },
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant statistics',
      error: error.message
    });
  }
};

module.exports = exports;
