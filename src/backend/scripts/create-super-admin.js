const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createSuperAdmin() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔐 Creating Super Admin...\n');

    // 1. Check and update check constraint
    console.log('📝 Step 1: Updating users role check constraint...');
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Super Admin'));
    `);
    console.log('   ✅ Check constraint updated');

    // 2. Create Super Admin
    console.log('\n Step 2: Creating Super Admin user...');
    const hashedPassword = await bcrypt.hash('Black@786##', 10);
    
    const result = await client.query(`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES (
        'Super Admin',
        'factsolution@gmail.com',
        $1,
        'Super Admin',
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = 'Super Admin',
        password = $1,
        role = 'Super Admin',
        status = 'active',
        updated_at = NOW()
      RETURNING id, email, role, status;
    `, [hashedPassword]);

    console.log('   ✅ Super Admin created/updated');
    console.log(`   - ID: ${result.rows[0].id}`);
    console.log(`   - Email: ${result.rows[0].email}`);
    console.log(`   - Role: ${result.rows[0].role}`);
    console.log(`   - Status: ${result.rows[0].status}`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Super Admin Setup Complete!');
    console.log('═'.repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log('   Email: factsolution@gmail.com');
    console.log('   Password: Black@786##');
    console.log('   Role: Super Admin');
    console.log('\n⚠️  Please change password after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

createSuperAdmin();
