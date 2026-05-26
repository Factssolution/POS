const { Settings } = require('../models');

async function fixLocalFileUrls() {
  try {
    console.log('🔍 Scanning settings for local file URLs...\n');
    
    const settings = await Settings.findAll({
      where: {
        setting_value: {
          [require('sequelize').Op.like]: 'file://%'
        }
      }
    });
    
    if (settings.length === 0) {
      console.log('✅ No local file URLs found in settings database.');
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${settings.length} setting(s) with local file URLs:\n`);
    
    for (const setting of settings) {
      console.log(`📝 ${setting.setting_key}:`);
      console.log(`   Current: ${setting.setting_value}`);
      
      // Clear the local file URL
      await setting.update({
        setting_value: '',
        updated_at: new Date()
      });
      
      console.log(`   ✅ Cleared (set to empty string)\n`);
    }
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ All local file URLs have been removed!');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('1. Restart your backend server');
    console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('3. Refresh the application');
    console.log('4. Upload logo using proper file upload (not file:// path)');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixLocalFileUrls();
