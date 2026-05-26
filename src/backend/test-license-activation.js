const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testLicenseUserActivation() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('═'.repeat(70));
    console.log('🧪 LICENSE USER ACTIVATION TEST');
    console.log('═'.repeat(70));
    console.log();

    // Step 1: Create test user
    console.log('📌 STEP 1: Creating test user...');
    const testEmail = 'admin@factssolution.com';
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    await client.query(`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES ('Test Admin', $1, $2, 'Admin', 'active', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET status = 'active', updated_at = NOW()
    `, [testEmail, hashedPassword]);
    
    console.log(`✅ Test user created: ${testEmail}`);
    console.log(`   Password: Test@123`);
    console.log();

    // Step 2: Disable the user
    console.log('📌 STEP 2: Disabling user (simulating account suspension)...');
    await client.query(`
      UPDATE users SET status = 'inactive' WHERE email = $1
    `, [testEmail]);
    
    const disabledUser = await client.query('SELECT status FROM users WHERE email = $1', [testEmail]);
    console.log(`✅ User disabled. Status: ${disabledUser.rows[0].status}`);
    console.log();
    console.log('⚠️  TEST: Try logging in with this user - it should FAIL!');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: Test@123`);
    console.log();

    // Step 3: Generate license for this user
    console.log('📌 STEP 3: Generating license for this user...');
    
    const licenseKey = `FACTS-${generateSegment()}-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setDate(expiryDate.getDate() + 30);

    await client.query(`
      INSERT INTO licenses (
        license_key, client_email, client_name, plan_type, plan_duration, 
        price, status, issued_date, expiry_date, created_at, updated_at
      ) VALUES ($1, $2, 'Test Admin', 'monthly', 30, 5000, 'active', $3, $4, NOW(), NOW())
    `, [licenseKey, testEmail, issuedDate, expiryDate]);

    console.log(`✅ License generated:`);
    console.log(`   Key: ${licenseKey}`);
    console.log(`   Client: ${testEmail}`);
    console.log(`   Plan: Monthly (30 days)`);
    console.log(`   Price: Rs 5,000`);
    console.log(`   Expiry: ${expiryDate.toLocaleDateString('en-GB')}`);
    console.log();

    // Step 4: Instructions
    console.log('═'.repeat(70));
    console.log('📋 TESTING INSTRUCTIONS:');
    console.log('═'.repeat(70));
    console.log();
    console.log('1️⃣  TEST DISABLED USER (Should FAIL):');
    console.log(`   - Try login: ${testEmail}`);
    console.log(`   - Password: Test@123`);
    console.log(`   - Expected: ❌ Login should fail (account inactive)`);
    console.log();
    console.log('2️⃣  ACTIVATE LICENSE (via UI):');
    console.log(`   - Go to Settings → License tab`);
    console.log(`   - Enter license key: ${licenseKey}`);
    console.log(`   - Click "Activate License"`);
    console.log(`   - Expected: ✅ Success toast + "Your account has been activated!"`);
    console.log();
    console.log('3️⃣  TEST REACTIVATED USER (Should SUCCESS):');
    console.log(`   - Try login: ${testEmail}`);
    console.log(`   - Password: Test@123`);
    console.log(`   - Expected: ✅ Login successful!`);
    console.log();
    console.log('═'.repeat(70));
    console.log('🎯 VERIFICATION:');
    console.log('═'.repeat(70));
    console.log();
    console.log('After activating license, check database:');
    console.log(`   SELECT status FROM users WHERE email = '${testEmail}';`);
    console.log('   Expected: status = active');
    console.log();
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

function generateSegment() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let segment = '';
  for (let i = 0; i < 4; i++) {
    segment += chars[Math.floor(Math.random() * chars.length)];
  }
  return segment;
}

testLicenseUserActivation();
