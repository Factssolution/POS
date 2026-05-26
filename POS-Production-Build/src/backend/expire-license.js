const { Client } = require('pg');

async function expireLicense() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pos',
    user: 'postgres',
    password: 'postgres123'
  });

  try {
    await client.connect();
    console.log('\n⚠️  EXPIRING LICENSE FOR TESTING\n');
    console.log('═'.repeat(60));

    // Update license status to expired
    await client.query(`
      UPDATE settings 
      SET setting_value = 'expired', updated_at = NOW()
      WHERE setting_key = 'license_status'
    `);
    console.log('✅ license_status: expired');

    // Set expiry date to past
    await client.query(`
      UPDATE settings 
      SET setting_value = '2020-01-01T00:00:00.000Z', updated_at = NOW()
      WHERE setting_key = 'license_expiry'
    `);
    console.log('✅ license_expiry: 2020-01-01 (PAST)');

    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  LICENSE EXPIRED!');
    console.log('═'.repeat(60));
    console.log('\n📋 Expected Behavior:');
    console.log('   ✅ Super Admin (factssolution@gmail.com) → CAN login');
    console.log('   ❌ Admin (admin@factssolution.com) → CANNOT login');
    console.log('   ❌ Manager → CANNOT login');
    console.log('   ❌ Cashier → CANNOT login');
    console.log('\n🔄 To restore license, run: node activate-license.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

expireLicense();
