/**
 * Check License Status
 * Verifies if license is active, expired, or suspended
 */

const sequelize = require('../config/database');

async function checkLicense() {
  console.log('🔍 Checking License Status...\n');

  try {
    // Check specific license
    const [licenses] = await sequelize.query(`
      SELECT 
        id,
        license_key,
        client_name,
        client_email,
        plan_type,
        price,
        status,
        issued_date,
        expiry_date,
        active_devices,
        allowed_devices,
        created_at
      FROM licenses 
      WHERE license_key = 'FACTS-39RN-QQXR-1O5L-L2YK'
    `);

    if (licenses.length === 0) {
      console.log('❌ License not found!');
      process.exit(1);
    }

    const lic = licenses[0];

    console.log('📋 License Details:');
    console.log('   ID:', lic.id);
    console.log('   Key:', lic.license_key);
    console.log('   Client:', lic.client_name);
    console.log('   Email:', lic.client_email);
    console.log('   Plan:', lic.plan_type);
    console.log('   Price: Rs', lic.price.toLocaleString());
    console.log('   DB Status:', lic.status);
    console.log('   Issued:', new Date(lic.issued_date).toLocaleDateString('en-PK'));
    console.log('   Expires:', new Date(lic.expiry_date).toLocaleDateString('en-PK'));
    console.log('   Devices:', `${lic.active_devices || 0}/${lic.allowed_devices || 'unlimited'}`);
    console.log('');

    // Calculate days remaining
    const now = new Date();
    const expiryDate = new Date(lic.expiry_date);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    console.log('⏰ Status Check:');
    console.log('   Current Date:', now.toLocaleDateString('en-PK'));
    console.log('   Expiry Date:', expiryDate.toLocaleDateString('en-PK'));
    console.log('   Days Remaining:', daysRemaining);
    console.log('   Is Expired:', daysRemaining <= 0);
    console.log('');

    // Check if status matches reality
    console.log('✅ Validation:');
    if (daysRemaining <= 0) {
      console.log('   ❌ License is EXPIRED');
      if (lic.status === 'active') {
        console.log('   ⚠️  WARNING: Database shows "active" but license is expired!');
        console.log('   🔧 Should update status to "expired"');
      } else if (lic.status === 'expired') {
        console.log('   ✅ Database status is correct (expired)');
      }
    } else {
      console.log('   ✅ License is ACTIVE');
      console.log(`   ✅ ${daysRemaining} days remaining`);
      if (lic.status === 'active') {
        console.log('   ✅ Database status is correct (active)');
      } else {
        console.log(`   ⚠️  WARNING: Database shows "${lic.status}" but license should be active!`);
      }
    }

    console.log('');

    // Check user status
    const [users] = await sequelize.query(`
      SELECT id, email, name, role, status
      FROM users
      WHERE email = '${lic.client_email}'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User Account Status:');
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Account Status:', user.status);
      
      if (daysRemaining <= 0 && user.status === 'active') {
        console.log('   ⚠️  WARNING: User is active but license expired!');
        console.log('   🔧 Should deactivate user account');
      } else if (daysRemaining > 0 && user.status === 'inactive') {
        console.log('   ⚠️  WARNING: User is inactive but license is active!');
        console.log('   🔧 Should activate user account');
      } else {
        console.log('   ✅ User status matches license status');
      }
    } else {
      console.log('⚠️  No user account found for this license');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 SUMMARY:');
    console.log('   License Key:', lic.license_key);
    console.log('   Days Remaining:', daysRemaining);
    console.log('   License Status:', daysRemaining > 0 ? '✅ ACTIVE' : '❌ EXPIRED');
    console.log('   DB Status:', lic.status);
    console.log('   Properly Managed:', (daysRemaining > 0 && lic.status === 'active') || (daysRemaining <= 0 && lic.status === 'expired') ? '✅ YES' : '❌ NO');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkLicense();
