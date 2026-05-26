const { Client } = require('pg');

async function checkLicenseSettings() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pos',
    user: 'postgres',
    password: 'postgres123'
  });

  try {
    await client.connect();
    console.log('\n🔍 CHECKING LICENSE SETTINGS\n');
    console.log('═'.repeat(60));

    const result = await client.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE setting_key IN ('license_key', 'license_status', 'license_expiry', 'is_trial')
      ORDER BY setting_key
    `);

    console.log('\nCurrent License Settings:');
    console.log('─'.repeat(60));
    result.rows.forEach(row => {
      const icon = row.setting_key === 'is_trial' 
        ? (row.setting_value === 'false' ? '✅' : '⚠️')
        : row.setting_key === 'license_status'
        ? (row.setting_value === 'active' ? '✅' : '❌')
        : '✅';
      console.log(`${icon} ${row.setting_key}: ${row.setting_value}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ CHECK COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLicenseSettings();
