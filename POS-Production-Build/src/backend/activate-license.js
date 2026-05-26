const { Client } = require('pg');

async function activateLicense() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pos',
    user: 'postgres',
    password: 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔑 Activating license in settings...\n');

    // Update license settings
    await client.query(`
      UPDATE settings SET setting_value = 'FACTS-YLB2-RZXY-MCJR-YAL6', updated_at = NOW()
      WHERE setting_key = 'license_key'
    `);
    console.log('✅ License key set');

    await client.query(`
      UPDATE settings SET setting_value = '2026-06-25T00:00:00.000Z', updated_at = NOW()
      WHERE setting_key = 'license_expiry'
    `);
    console.log('✅ License expiry set');

    await client.query(`
      UPDATE settings SET setting_value = 'active', updated_at = NOW()
      WHERE setting_key = 'license_status'
    `);
    console.log('✅ License status: active');

    await client.query(`
      UPDATE settings SET setting_value = 'false', updated_at = NOW()
      WHERE setting_key = 'is_trial'
    `);
    console.log('✅ Trial mode: disabled');

    console.log('\n═'.repeat(60));
    console.log('✅ LICENSE ACTIVATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\nLicense Details:');
    console.log('   Key: FACTS-YLB2-RZXY-MCJR-YAL6');
    console.log('   Status: Active');
    console.log('   Expiry: June 25, 2026');
    console.log('   Trial: Disabled\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

activateLicense();
