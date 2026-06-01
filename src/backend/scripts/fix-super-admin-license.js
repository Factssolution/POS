/**
 * Fix Super Admin License Display
 * Sets proper trial settings so Super Admin dashboard shows correctly
 */

const sequelize = require('../config/database');

async function fixLicenseSettings() {
  console.log('🔧 Fixing Super Admin License Settings...\n');

  try {
    // Check current settings
    const [currentSettings] = await sequelize.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE setting_key IN ('is_trial', 'license_key', 'license_status', 'trial_start_date', 'trial_end_date', 'trial_period_days')
    `);

    console.log('📋 Current Settings:');
    currentSettings.forEach(s => {
      console.log(`   ${s.setting_key}: ${s.setting_value}`);
    });
    console.log('');

    // Fix is_trial setting
    console.log('✅ Setting is_trial = true...');
    await sequelize.query(`
      INSERT INTO settings (setting_key, setting_value, updated_at)
      VALUES ('is_trial', 'true', NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = 'true', updated_at = NOW()
    `);

    // Set license_status to trial
    console.log('✅ Setting license_status = trial...');
    await sequelize.query(`
      INSERT INTO settings (setting_key, setting_value, updated_at)
      VALUES ('license_status', 'trial', NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = 'trial', updated_at = NOW()
    `);

    // Calculate days remaining
    const trialEndDate = currentSettings.find(s => s.setting_key === 'trial_end_date')?.setting_value;
    if (trialEndDate) {
      const endDate = new Date(trialEndDate);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`\n📊 Trial Status:`);
      console.log(`   Start: ${currentSettings.find(s => s.setting_key === 'trial_start_date')?.setting_value}`);
      console.log(`   End: ${trialEndDate}`);
      console.log(`   Days Remaining: ${daysRemaining}`);
      console.log(`   Status: ${daysRemaining > 0 ? '✅ Active' : '❌ Expired'}`);
    }

    // Verify all settings
    const [updatedSettings] = await sequelize.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE setting_key IN ('is_trial', 'license_key', 'license_status', 'trial_start_date', 'trial_end_date', 'trial_period_days')
      ORDER BY setting_key
    `);

    console.log('\n✅ Updated Settings:');
    updatedSettings.forEach(s => {
      console.log(`   ${s.setting_key}: ${s.setting_value}`);
    });

    console.log('\n🎉 License settings fixed successfully!');
    console.log('\n📝 What Changed:');
    console.log('   ✓ is_trial set to true');
    console.log('   ✓ license_status set to trial');
    console.log('   ✓ Super Admin dashboard will now show trial period correctly');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixLicenseSettings();
