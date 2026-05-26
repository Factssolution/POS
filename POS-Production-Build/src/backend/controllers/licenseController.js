const { License, Settings, User } = require('../models');
const LicenseGenerator = require('../utils/licenseGenerator');
const { Op } = require('sequelize');

/**
 * License Controller
 * Handles license generation, validation, and management
 */

// Generate new license key
exports.generateLicense = async (req, res) => {
  try {
    console.log('🔑 Generate license request received');
    const {
      client_email,
      client_name,
      client_phone,
      client_company,
      plan_type = 'monthly',
      price,
      payment_method = 'cash',
      notes
    } = req.body;

    console.log('  Client:', client_email);
    console.log('  Plan:', plan_type);
    console.log('  Price:', price);

    // Validate required fields
    if (!client_email) {
      console.error('  ❌ Client email missing');
      return res.status(400).json({
        success: false,
        message: 'Client email is required'
      });
    }

    // Generate license key
    const licenseKey = LicenseGenerator.generateKey({
      planType: plan_type
    });

    // Calculate expiry date
    const issuedDate = new Date();
    const expiryDate = LicenseGenerator.calculateExpiryDate(plan_type, issuedDate);

    // Get price from settings if not provided
    let finalPrice = price;
    if (!finalPrice) {
      const setting = await Settings.findOne({
        where: { setting_key: `${plan_type}_price` }
      });
      finalPrice = setting ? parseFloat(setting.setting_value) : 5000;
    }

    // Calculate plan duration
    let planDuration = 30;
    if (plan_type === 'yearly') planDuration = 365;
    if (plan_type === 'lifetime') planDuration = 9999;

    console.log('  Creating license in database...');

    // Create license
    const license = await License.create({
      license_key: licenseKey,
      client_email,
      client_name: client_name || null,
      client_phone: client_phone || null,
      client_company: client_company || null,
      plan_type,
      plan_duration: planDuration,
      price: finalPrice,
      total_amount: finalPrice,
      paid_amount: 0,
      payment_method,
      payment_status: 'pending',
      status: 'active',
      issued_date: issuedDate,
      expiry_date: expiryDate,
      created_by: req.user.id,
      notes: notes || null
    });

    console.log(`  ✅ License created: ${licenseKey}`);
    console.log(`  ID: ${license.id}`);

    res.json({
      success: true,
      message: 'License generated successfully',
      data: {
        id: license.id,
        license_key: license.license_key,
        client_email: license.client_email,
        client_name: license.client_name,
        plan_type: license.plan_type,
        price: license.price,
        issued_date: license.issued_date,
        expiry_date: license.expiry_date,
        days_valid: planDuration,
        status: license.status
      }
    });
  } catch (error) {
    console.error('Generate license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate license',
      error: error.message
    });
  }
};

// Activate license on client system
exports.activateLicense = async (req, res) => {
  try {
    const { license_key, client_email } = req.body;

    if (!license_key) {
      return res.status(400).json({
        success: false,
        message: 'License key is required'
      });
    }

    // Validate format
    if (!LicenseGenerator.validateFormat(license_key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid license key format'
      });
    }

    // Find license
    const license = await License.findOne({
      where: { license_key }
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'License not found'
      });
    }

    // Check status
    if (license.status === 'revoked') {
      return res.status(403).json({
        success: false,
        message: 'This license has been revoked'
      });
    }

    // Check expiry
    if (LicenseGenerator.isExpired(license.expiry_date)) {
      return res.status(403).json({
        success: false,
        message: 'License has expired',
        data: {
          expired_on: license.expiry_date,
          days_expired: LicenseGenerator.getDaysRemaining(license.expiry_date)
        }
      });
    }

    // Update settings with license info
    const settingsUpdates = [
      { setting_key: 'license_key', setting_value: license_key },
      { setting_key: 'license_expiry', setting_value: license.expiry_date.toISOString() },
      { setting_key: 'license_status', setting_value: 'active' },
      { setting_key: 'is_trial', setting_value: 'false' }
    ];

    for (const update of settingsUpdates) {
      await Settings.upsert({
        setting_key: update.setting_key,
        setting_value: update.setting_value,
        updated_at: new Date()
      });
    }

    // Device tracking - Check and increment device count
    const currentDevices = parseInt(String(license.active_devices || 0));
    const maxDevices = parseInt(String(license.allowed_devices || 999)); // 999 = unlimited

    if (currentDevices >= maxDevices && maxDevices < 999) {
      return res.status(400).json({
        success: false,
        message: `Maximum devices reached (${maxDevices}). Please contact support to add more devices.`
      });
    }

    // Generate device fingerprint
    const crypto = require('crypto');
    const deviceFingerprint = crypto.createHash('sha256')
      .update(req.headers['user-agent'] + req.ip)
      .digest('hex')
      .substring(0, 16);

    // Increment device count
    license.active_devices = currentDevices + 1;
    await license.save();

    console.log(`📱 Device registered: ${deviceFingerprint} (${currentDevices + 1}/${maxDevices === 999 ? 'unlimited' : maxDevices})`);

    // CRITICAL: If client_email provided, activate/re-enable that user
    if (client_email) {
      const { User } = require('../models');
      const user = await User.findOne({ where: { email: client_email } });
      
      if (user) {
        // Activate user if inactive
        if (user.status === 'inactive') {
          user.status = 'active';
          await user.save();
          console.log(`✅ User ${client_email} reactivated via license`);
        }
      }
    }

    console.log(` License activated: ${license_key}`);

    res.json({
      success: true,
      message: 'License activated successfully',
      data: {
        license_key: license.license_key,
        client_name: license.client_name,
        plan_type: license.plan_type,
        expiry_date: license.expiry_date,
        days_remaining: LicenseGenerator.getDaysRemaining(license.expiry_date),
        devices: {
          active: license.active_devices,
          allowed: license.allowed_devices
        },
        user_activated: client_email ? true : false
      }
    });
  } catch (error) {
    console.error('Activate license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate license',
      error: error.message
    });
  }
};

// Get all licenses (Super Admin only)
exports.getAllLicenses = async (req, res) => {
  try {
    console.log('📋 Getting all licenses...');
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('  Filters:', { page, limit, status, search });

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { client_email: { [Op.iLike]: `%${search}%` } },
        { client_name: { [Op.iLike]: `%${search}%` } },
        { license_key: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log('  Query where:', JSON.stringify(where));

    const { count, rows } = await License.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    console.log(`  Found ${count} licenses, returning ${rows.length} rows`);

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch licenses',
      error: error.message
    });
  }
};

// Get current system license status
exports.getLicenseStatus = async (req, res) => {
  try {
    console.log('\n📊 Getting license status...');
    console.log('  Request user:', req.user ? req.user.email : 'NONE');
    console.log('  Request role:', req.user ? req.user.role : 'NONE');

    const settings = await Settings.findAll({
      where: {
        setting_key: {
          [Op.in]: [
            'license_key',
            'license_expiry',
            'is_trial',
            'license_status',
            'trial_start_date',
            'trial_end_date',
            'trial_period_days'
          ]
        }
      }
    });

    console.log(`  Found ${settings.length} settings records`);

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    console.log('  Settings map:', settingsMap);

    const isTrial = settingsMap.is_trial === 'true';
    const licenseStatus = settingsMap.license_status || 'trial';
    const trialDays = parseInt(settingsMap.trial_period_days || '45');
    
    // Calculate trial dates if not set
    let trialStartDate = settingsMap.trial_start_date;
    let trialEndDate = settingsMap.trial_end_date;

    if (isTrial && !trialStartDate) {
      // First time - initialize trial
      trialStartDate = new Date().toISOString();
      trialEndDate = LicenseGenerator.calculateTrialEndDate(trialDays).toISOString();
      
      // Save to settings
      await Settings.upsert({ setting_key: 'trial_start_date', setting_value: trialStartDate });
      await Settings.upsert({ setting_key: 'trial_end_date', setting_value: trialEndDate });
    }

    const daysRemaining = isTrial 
      ? LicenseGenerator.getDaysRemaining(trialEndDate)
      : LicenseGenerator.getDaysRemaining(settingsMap.license_expiry);

    res.json({
      success: true,
      data: {
        is_trial: isTrial,
        license_status: licenseStatus,
        license_key: settingsMap.license_key || null,
        trial_start_date: trialStartDate,
        trial_end_date: trialEndDate,
        trial_days: trialDays,
        days_remaining: daysRemaining,
        expiry_date: isTrial ? trialEndDate : settingsMap.license_expiry,
        is_expired: daysRemaining <= 0
      }
    });
  } catch (error) {
    console.error('Get license status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get license status',
      error: error.message
    });
  }
};

// Revoke license
exports.revokeLicense = async (req, res) => {
  try {
    const { id } = req.params;

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'License not found'
      });
    }

    license.status = 'revoked';
    await license.save();

    console.log(` License revoked: ${license.license_key}`);

    res.json({
      success: true,
      message: 'License revoked successfully',
      data: {
        id: license.id,
        license_key: license.license_key,
        status: license.status
      }
    });
  } catch (error) {
    console.error('Revoke license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke license',
      error: error.message
    });
  }
};

// Update pricing
exports.updatePricing = async (req, res) => {
  try {
    const { monthly_price, yearly_price, lifetime_price } = req.body;

    console.log('💰 Updating license pricing...');

    const updates = [];
    if (monthly_price !== undefined) {
      updates.push({ setting_key: 'monthly_price', setting_value: String(monthly_price) });
    }
    if (yearly_price !== undefined) {
      updates.push({ setting_key: 'yearly_price', setting_value: String(yearly_price) });
    }
    if (lifetime_price !== undefined) {
      updates.push({ setting_key: 'lifetime_price', setting_value: String(lifetime_price) });
    }

    for (const update of updates) {
      await Settings.upsert({
        ...update,
        updated_at: new Date()
      });
    }

    console.log('✅ Pricing updated successfully');

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      data: {
        monthly_price: monthly_price || (await Settings.findOne({ where: { setting_key: 'monthly_price' } }))?.setting_value,
        yearly_price: yearly_price || (await Settings.findOne({ where: { setting_key: 'yearly_price' } }))?.setting_value,
        lifetime_price: lifetime_price || (await Settings.findOne({ where: { setting_key: 'lifetime_price' } }))?.setting_value
      }
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
      error: error.message
    });
  }
};
