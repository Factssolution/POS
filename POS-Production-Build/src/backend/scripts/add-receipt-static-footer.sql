-- Add receipt_static_footer setting if it doesn't exist
INSERT INTO settings (setting_key, setting_value, updated_at)
VALUES ('receipt_static_footer', 'Powered by Facts Solution', NOW())
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = 'Powered by Facts Solution',
    updated_at = NOW();

-- Verify the setting was added
SELECT setting_key, setting_value 
FROM settings 
WHERE setting_key IN ('company_name', 'company_address', 'company_phone', 'company_logo', 
                      'receipt_footer', 'receipt_static_footer', 'tax_rate')
ORDER BY setting_key;
