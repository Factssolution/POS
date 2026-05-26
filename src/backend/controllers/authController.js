const { User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Generate token function
const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expire
  });
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // CRITICAL: Check license status (except for Super Admin)
    if (user.role !== 'Super Admin') {
      const { Settings } = require('../models');
      const { Op } = require('sequelize');
      
      const settings = await Settings.findAll({
        where: {
          setting_key: {
            [Op.in]: ['license_status', 'license_expiry', 'is_trial', 'trial_end_date']
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
        if (trialEndDate) {
          const daysRemaining = Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 0) {
            return res.status(403).json({
              success: false,
              message: 'Trial period has expired. Please activate your license to continue.',
              license_error: true
            });
          }
        }
      } 
      // Check license status
      else if (licenseStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'System license is not active. Please contact administrator.',
          license_error: true
        });
      }
      // Check license expiry
      else if (licenseStatus === 'active') {
        const licenseExpiry = settingsMap.license_expiry;
        if (licenseExpiry) {
          const daysRemaining = Math.ceil((new Date(licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 0) {
            return res.status(403).json({
              success: false,
              message: 'License has expired. Please contact administrator to renew.',
              license_error: true
            });
          }
        }
      }
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    console.log('✅ Login successful:', email, 'Token generated');

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Verify token
exports.verify = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};
