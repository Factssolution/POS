const { Settings, License } = require('../models');
const LicenseGenerator = require('../utils/licenseGenerator');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * License Validation Middleware
 * Checks license status on every request
 * Allows Super Admin to bypass license checks
 */

const licenseValidator = async (req, res, next) => {
  try {
    // Skip license check for these routes
    const publicRoutes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/settings/license/status',
      '/api/v1/settings/license/activate'
    ];

    const isPublicRoute = publicRoutes.some(route => req.path === route || req.path.startsWith(route + '/'));
    if (isPublicRoute) {
      console.log(`  ⏭️  Skipping license check for: ${req.path}`);
      return next();
    }

    // If no user (not authenticated yet), skip license check
    // Auth middleware will handle authentication
    if (!req.user) {
      console.log(`  ⏭️  No user in request, skipping license check: ${req.path}`);
      return next();
    }

    // Super Admin bypass
    if (req.user.role === 'Super Admin') {
      console.log(`  ️  Super Admin bypass: ${req.user.email}`);
      return next();
    }

    console.log(`  🔒 Checking license for: ${req.user.email} (${req.user.role})`);

    // Get license settings
    const settings = await Settings.findAll({
      where: {
        setting_key: {
          [Op.in]: ['is_trial', 'license_status', 'license_expiry', 'trial_end_date']
        }
      }
    });

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const isTrial = settingsMap.is_trial === 'true';
    const licenseStatus = settingsMap.license_status || 'trial';

    // Check trial period
    if (isTrial) {
      const trialEndDate = settingsMap.trial_end_date;
      if (!trialEndDate) {
        // No trial end date set - initialize trial
        return initializeTrial(req, res, next);
      }

      const daysRemaining = LicenseGenerator.getDaysRemaining(trialEndDate);

      if (daysRemaining <= 0) {
        // Trial expired
        return res.status(403).json({
          success: false,
          message: 'Trial period has expired. Please activate a license to continue.',
          data: {
            is_trial: true,
            trial_expired: true,
            trial_end_date: trialEndDate,
            requires_license: true
          }
        });
      }

      // Add warning headers for trial
      if (daysRemaining <= 7) {
        res.set('X-License-Warning', `Trial expires in ${daysRemaining} days`);
      }

      return next();
    }

    // Check license status
    if (licenseStatus === 'active') {
      const expiryDate = settingsMap.license_expiry;
      
      if (!expiryDate) {
        return res.status(500).json({
          success: false,
          message: 'License configuration error. Please contact support.'
        });
      }

      const daysRemaining = LicenseGenerator.getDaysRemaining(expiryDate);

      if (daysRemaining <= 0) {
        // License expired
        return res.status(403).json({
          success: false,
          message: 'Your license has expired. Please renew your license to continue.',
          data: {
            is_trial: false,
            license_expired: true,
            licence_expiry: expiryDate,
            requires_renewal: true
          }
        });
      }

      // Add warning headers for expiry
      if (daysRemaining <= 5) {
        res.set('X-License-Warning', `License expires in ${daysRemaining} days`);
      }

      return next();
    }

    // No license and not in trial
    return res.status(403).json({
      success: false,
      message: 'No active license found. Please activate a license to use this system.',
      data: {
        requires_license: true
      }
    });

  } catch (error) {
    console.error('License validation error:', error);
    // FAIL SECURE: Block access on validation error
    console.error('❌ License validation failed - blocking access');
    return res.status(503).json({
      success: false,
      message: 'License validation service unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Initialize trial period on first use
 */
async function initializeTrial(req, res, next) {
  try {
    const trialPeriodSetting = await Settings.findOne({
      where: { setting_key: 'trial_period_days' }
    });

    const trialDays = trialPeriodSetting ? parseInt(trialPeriodSetting.setting_value) : 45;
    const startDate = new Date();
    const endDate = LicenseGenerator.calculateTrialEndDate(trialDays, startDate);

    // Update settings
    await Settings.bulkCreate([
      { setting_key: 'is_trial', setting_value: 'true', updated_at: new Date() },
      { setting_key: 'license_status', setting_value: 'trial', updated_at: new Date() },
      { setting_key: 'trial_start_date', setting_value: startDate.toISOString(), updated_at: new Date() },
      { setting_key: 'trial_end_date', setting_value: endDate.toISOString(), updated_at: new Date() }
    ], {
      updateOnDuplicate: ['setting_value', 'updated_at']
    });

    console.log(` Trial period initialized: ${trialDays} days`);

    // Continue with request
    next();
  } catch (error) {
    console.error('Initialize trial error:', error);
    next();
  }
}

module.exports = licenseValidator;
