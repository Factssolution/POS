const { Settings } = require('../models');

async function cleanupFileURLs() {
  try {
    console.log('🔍 Scanning for file:// URLs in settings...\n');

    // Find all settings with file:// protocol
    const settings = await Settings.findAll();
    
    let cleaned = 0;
    
    for (const setting of settings) {
      if (setting.setting_value && setting.setting_value.startsWith('file://')) {
        console.log(`❌ Found file:// URL in "${setting.setting_key}": ${setting.setting_value}`);
        
        // Clear the invalid URL
        setting.setting_value = '';
        await setting.save();
        
        console.log(`✅ Cleared "${setting.setting_key}"\n`);
        cleaned++;
      }
    }

    if (cleaned === 0) {
      console.log('✅ No file:// URLs found in database');
    } else {
      console.log(`\n🎉 Cleaned ${cleaned} setting(s) with file:// URLs`);
      console.log('\n💡 Next steps:');
      console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('   2. Refresh the application');
      console.log('   3. Re-upload any logos/images using the Settings page');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupFileURLs();
