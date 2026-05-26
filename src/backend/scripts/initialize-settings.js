const { sequelize } = require('../config/database');
const { Settings } = require('../models');

const defaultSettings = [
  // Company Settings
  { setting_key: 'company_name', setting_value: 'Facts Solution Store' },
  { setting_key: 'company_address', setting_value: '123 Business Street, City, State' },
  { setting_key: 'company_phone', setting_value: '+91 9876543210' },
  { setting_key: 'company_email', setting_value: 'contact@factssolution.com' },
  { setting_key: 'gst_number', setting_value: '29ABCDE1234F1Z5' },
  { setting_key: 'company_logo', setting_value: '' },
  
  // POS Settings
  { setting_key: 'tax_rate', setting_value: '18' },
  { setting_key: 'currency', setting_value: 'PKR' },
  { setting_key: 'receipt_footer', setting_value: 'Thank you for your business!' },
  { setting_key: 'receipt_static_footer', setting_value: 'Powered by Facts Solution' },
  { setting_key: 'enable_barcode', setting_value: 'true' },
  { setting_key: 'print_receipt', setting_value: 'true' },
  { setting_key: 'sound_enabled', setting_value: 'true' },
  
  // Notification Settings
  { setting_key: 'notification_low_stock', setting_value: 'true' },
  { setting_key: 'notification_daily_report', setting_value: 'true' },
  { setting_key: 'notification_employee_login', setting_value: 'false' },
  { setting_key: 'notification_supplier_payments', setting_value: 'true' },
  
  // Security Settings
  { setting_key: 'security_two_factor', setting_value: 'false' },
  { setting_key: 'security_session_timeout', setting_value: '30' },
  { setting_key: 'security_password_policy', setting_value: 'true' },
  { setting_key: 'security_audit_log', setting_value: 'true' },
  { setting_key: 'security_max_login_attempts', setting_value: '5' },
  { setting_key: 'security_lockout_duration', setting_value: '15' },
  
  // Backup Settings
  { setting_key: 'backup_path', setting_value: '' },
  { setting_key: 'auto_backup', setting_value: 'false' },
  { setting_key: 'backup_frequency', setting_value: 'daily' },
  
  // Shop Hours & Token Settings
  { 
    setting_key: 'shop_hours', 
    setting_value: JSON.stringify({
      monday:    { open: "10:00", close: "22:00", enabled: true },
      tuesday:   { open: "10:00", close: "22:00", enabled: true },
      wednesday: { open: "10:00", close: "22:00", enabled: true },
      thursday:  { open: "10:00", close: "22:00", enabled: true },
      friday:    { open: "14:00", close: "23:00", enabled: true },
      saturday:  { open: "10:00", close: "23:00", enabled: true },
      sunday:    { open: "12:00", close: "20:00", enabled: true }
    })
  }
];

async function initializeSettings() {
  try {
    console.log('🔄 Initializing default settings...\n');
    
    for (const setting of defaultSettings) {
      const [created, updated] = await Settings.upsert(setting);
      const action = updated ? 'Updated' : 'Created';
      console.log(`✅ ${action}: ${setting.setting_key} = ${setting.setting_value}`);
    }
    
    console.log('\n✨ All default settings initialized successfully!');
    console.log('\n📊 Current settings:');
    
    const allSettings = await Settings.findAll({
      order: [['setting_key', 'ASC']]
    });
    
    allSettings.forEach(s => {
      console.log(`  - ${s.setting_key}: ${s.setting_value}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize settings:', error);
    process.exit(1);
  }
}

initializeSettings();
