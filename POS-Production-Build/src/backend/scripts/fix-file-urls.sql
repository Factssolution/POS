-- Fix Local File URLs in Settings Database
-- Run this in PostgreSQL to remove file:// URLs

-- Update any settings with file:// protocol to empty string
UPDATE settings 
SET setting_value = '', 
    updated_at = CURRENT_TIMESTAMP
WHERE setting_value LIKE 'file://%';

-- Verify the fix
SELECT setting_key, setting_value 
FROM settings 
WHERE setting_key LIKE '%logo%' 
   OR setting_key LIKE '%image%';

-- Show all settings for review
SELECT setting_key, 
       CASE 
           WHEN LENGTH(setting_value) > 50 THEN LEFT(setting_value, 50) || '...'
           ELSE setting_value
       END as value_preview
FROM settings
ORDER BY setting_key;
