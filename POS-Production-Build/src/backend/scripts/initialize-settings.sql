-- =====================================================
-- POS System Settings Database Initialization Script
-- =====================================================
-- Run this script to initialize all default settings
-- =====================================================

-- Company Settings
INSERT INTO settings (setting_key, setting_value, updated_at) VALUES
('company_name', 'Facts Solution Store', NOW()),
('company_address', '123 Business Street, City, State', NOW()),
('company_phone', '+91 9876543210', NOW()),
('company_email', 'contact@factssolution.com', NOW()),
('gst_number', '29ABCDE1234F1Z5', NOW()),
('company_logo', '', NOW())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- POS Settings
INSERT INTO settings (setting_key, setting_value, updated_at) VALUES
('tax_rate', '18', NOW()),
('currency', 'PKR', NOW()),
('receipt_footer', 'Thank you for your business!', NOW()),
('enable_barcode', 'true', NOW()),
('print_receipt', 'true', NOW()),
('sound_enabled', 'true', NOW())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- Notification Settings
INSERT INTO settings (setting_key, setting_value, updated_at) VALUES
('notification_low_stock', 'true', NOW()),
('notification_daily_report', 'true', NOW()),
('notification_employee_login', 'false', NOW()),
('notification_supplier_payments', 'true', NOW())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- Security Settings
INSERT INTO settings (setting_key, setting_value, updated_at) VALUES
('security_two_factor', 'false', NOW()),
('security_session_timeout', '30', NOW()),
('security_password_policy', 'true', NOW()),
('security_audit_log', 'true', NOW()),
('security_max_login_attempts', '5', NOW()),
('security_lockout_duration', '15', NOW())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- Backup Settings
INSERT INTO settings (setting_key, setting_value, updated_at) VALUES
('backup_path', '', NOW()),
('auto_backup', 'false', NOW()),
('backup_frequency', 'daily', NOW())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- Verify all settings
SELECT setting_key, setting_value FROM settings ORDER BY setting_key;
