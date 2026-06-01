const { Settings } = require('../models');
const auditController = require('./auditController');
const { checkShopStatus, getDefaultShopHours } = require('../utils/tokenHelper');
const supabase = require('../config/supabase');

exports.getAllSettings = async (req, res) => {
  try {
    // Use Supabase for Vercel deployment
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('setting_key', { ascending: true });
    
    if (error) {
      console.error('Supabase settings query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message
      });
    }

    // Convert to key-value object
    const settingsObject = {};
    (settings || []).forEach(setting => {
      settingsObject[setting.setting_key] = setting.setting_value;
    });

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded'
      });
    }

    const logoUrl = `http://localhost:${process.env.PORT || 5000}/uploads/logos/${req.file.filename}`;
    
    // Save logo URL to settings
    await Settings.upsert({
      setting_key: 'company_logo',
      setting_value: logoUrl,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo_url: logoUrl
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Use Supabase for Vercel deployment
    // Update each setting and log changes
    for (const [key, value] of Object.entries(settings)) {
      // Validate and sanitize URL fields
      if (key.includes('logo') || key.includes('image') || key.includes('url')) {
        // Block file:// protocol URLs (security risk)
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('file:///'))) {
          console.warn(`Blocked insecure local file URL for setting: ${key}`);
          continue; // Skip this setting
        }
      }

      // Get old value before update
      const { data: existingSettings, error: checkError } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', key)
        .limit(1);
      
      const oldValue = existingSettings && existingSettings.length > 0 ? existingSettings[0].setting_value : null;

      // Upsert the setting
      const { error: upsertError } = await supabase
        .from('settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });
      
      if (upsertError) {
        console.error(`Error updating setting ${key}:`, upsertError);
        continue;
      }

      // Log the setting change
      if (userId) {
        await auditController.logSettingsChange(
          userId,
          userEmail,
          key,
          oldValue,
          value,
          req
        );
      }
    }

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    // Block reserved route names that could conflict with other routes
    const reservedKeys = ['backups', 'logo', 'create', 'restore', 'config'];
    if (reservedKeys.includes(key)) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    const setting = await Settings.findOne({
      where: { setting_key: key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: {
        key: setting.setting_key,
        value: setting.setting_value
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
};

exports.getShopHours = async (req, res) => {
  try {
    const shopHoursSetting = await Settings.findOne({
      where: { setting_key: 'shop_hours' }
    });
    
    const shopHours = shopHoursSetting 
      ? JSON.parse(shopHoursSetting.setting_value)
      : getDefaultShopHours();
    
    const currentStatus = await checkShopStatus(new Date());
    
    res.json({
      success: true,
      data: {
        shop_hours: shopHours,
        current_status: currentStatus
      }
    });
  } catch (error) {
    console.error('Get shop hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop hours',
      error: error.message
    });
  }
};

exports.updateShopHours = async (req, res) => {
  try {
    const { shop_hours } = req.body;
    
    if (!shop_hours) {
      return res.status(400).json({
        success: false,
        message: 'Shop hours data is required'
      });
    }
    
    await Settings.upsert({
      setting_key: 'shop_hours',
      setting_value: typeof shop_hours === 'string' ? shop_hours : JSON.stringify(shop_hours),
      updated_at: new Date()
    });
    
    // Log audit trail
    await auditController.logAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE_SHOP_HOURS',
      entityType: 'Settings',
      settingKey: 'shop_hours',
      oldValue: null,
      newValue: typeof shop_hours === 'string' ? shop_hours : JSON.stringify(shop_hours),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Shop hours updated successfully'
    });
  } catch (error) {
    console.error('Update shop hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop hours',
      error: error.message
    });
  }
};
