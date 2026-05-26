const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function verifySuperAdmin() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔍 Verifying Super Admin...\n');

    // Get user
    const result = await client.query(`
      SELECT id, name, email, password, role, status 
      FROM users 
      WHERE email = 'factsolution@gmail.com'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Super Admin user NOT FOUND in database!');
      console.log('\nCreating Super Admin...');
      
      const hashedPassword = await bcrypt.hash('Black@786##', 10);
      await client.query(`
        INSERT INTO users (name, email, password, role, status, created_at, updated_at)
        VALUES ('Super Admin', 'factsolution@gmail.com', $1, 'Super Admin', 'active', NOW(), NOW())
      `, [hashedPassword]);
      
      console.log('✅ Super Admin created successfully!');
    } else {
      const user = result.rows[0];
      console.log('✅ Super Admin found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      
      // Verify password
      const passwordMatch = await bcrypt.compare('Black@786##', user.password);
      console.log(`\n Password Match: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!passwordMatch) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash('Black@786##', 10);
        await client.query(`
          UPDATE users SET password = $1 WHERE email = 'factsolution@gmail.com'
        `, [hashedPassword]);
        console.log('✅ Password updated!');
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Verification Complete!');
    console.log('═'.repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log('   Email: factsolution@gmail.com');
    console.log('   Password: Black@786##');
    console.log('   Role: Super Admin');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

verifySuperAdmin();
