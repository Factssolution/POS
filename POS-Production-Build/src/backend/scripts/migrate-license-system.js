/**
 * License System Migration
 * Creates licenses table and adds license fields to settings
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log(' Starting License System Migration...\n');

    // 1. Add Super Admin role to enum (if not exists)
    console.log('📝 Step 1: Adding Super Admin role...');
    try {
      await client.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Super Admin';
      `);
      console.log('   ✅ Super Admin role added');
    } catch (e) {
      console.log('   ⚠️  Role might already exist:', e.message);
    }

    // 2. Create licenses table
    console.log('\n📝 Step 2: Creating licenses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        client_name VARCHAR(255),
        client_phone VARCHAR(50),
        client_company VARCHAR(255),
        plan_type VARCHAR(50) DEFAULT 'monthly',
        plan_duration INTEGER DEFAULT 30,
        price DECIMAL(10,2) DEFAULT 5000.00,
        status VARCHAR(50) DEFAULT 'active',
        allowed_devices INTEGER DEFAULT 999,
        issued_date TIMESTAMP DEFAULT NOW(),
        expiry_date TIMESTAMP,
        total_amount DECIMAL(10,2),
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('   ✅ Licenses table created');

    // 3. Add license fields to settings table
    console.log('\n📝 Step 3: Adding license fields to settings...');
    const licenseFields = [
      { name: 'license_key', type: 'VARCHAR(255)' },
      { name: 'license_expiry', type: 'TIMESTAMP' },
      { name: 'trial_start_date', type: 'TIMESTAMP' },
      { name: 'trial_end_date', type: 'TIMESTAMP' },
      { name: 'is_trial', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'license_status', type: 'VARCHAR(50) DEFAULT \'trial\'' },
      { name: 'monthly_price', type: 'DECIMAL(10,2) DEFAULT 5000.00' },
      { name: 'yearly_price', type: 'DECIMAL(10,2) DEFAULT 50000.00' },
      { name: 'lifetime_price', type: 'DECIMAL(10,2) DEFAULT 150000.00' },
      { name: 'trial_period_days', type: 'INTEGER DEFAULT 45' }
    ];

    for (const field of licenseFields) {
      try {
        await client.query(`
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS ${field.name} ${field.type};
        `);
        console.log(`   ✅ Added ${field.name}`);
      } catch (e) {
        console.log(`   ⚠️  ${field.name} might already exist`);
      }
    }

    // 4. Create indexes for performance
    console.log('\n📝 Step 4: Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
      CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
      CREATE INDEX IF NOT EXISTS idx_licenses_expiry ON licenses(expiry_date);
      CREATE INDEX IF NOT EXISTS idx_licenses_client_email ON licenses(client_email);
    `);
    console.log('   ✅ Indexes created');

    // 5. Create Super Admin user
    console.log('\n📝 Step 5: Creating Super Admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Black@786##', 10);
    
    try {
      await client.query(`
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
          role = 'Super Admin',
          status = 'active',
          updated_at = NOW();
      `, [hashedPassword]);
      console.log('   ✅ Super Admin user created/updated');
    } catch (e) {
      console.log('   ⚠️  Super Admin might already exist:', e.message);
    }

    // 6. Initialize default settings if not exists
    console.log('\n📝 Step 6: Initializing license settings...');
    await client.query(`
      INSERT INTO settings (setting_key, setting_value, updated_at)
      VALUES 
        ('trial_period_days', '45', NOW()),
        ('monthly_price', '5000.00', NOW()),
        ('yearly_price', '50000.00', NOW()),
        ('lifetime_price', '150000.00', NOW()),
        ('license_status', 'trial', NOW()),
        ('is_trial', 'true', NOW())
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW();
    `);
    console.log('   ✅ License settings initialized');

    console.log('\n' + '═'.repeat(60));
    console.log('✅ License System Migration Complete!');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   - Licenses table: Created');
    console.log('   - Settings fields: Added (10 fields)');
    console.log('   - Super Admin: factsolution@gmail.com');
    console.log('   - Trial Period: 45 days');
    console.log('   - Monthly Price: Rs 5,000');
    console.log('   - Yearly Price: Rs 50,000');
    console.log('   - Lifetime Price: Rs 150,000');
    console.log('\n Next Step: Run backend server');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
