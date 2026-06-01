/**
 * Supabase Multi-Tenant Migration Script
 * Uses direct connection to ALTER existing tables
 */

const { Client } = require('pg');

console.log('═══════════════════════════════════════════════════════');
console.log('  Supabase Multi-Tenant Migration');
console.log('═══════════════════════════════════════════════════════');
console.log('');

// Supabase Connection - Direct Connection
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hfusrtiqjyiotjewzzkt',
  password: 'Black@786##',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('📡 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!');
    console.log('');

    // Step 1: Create tenants table
    console.log('Step 1: Creating tenants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        tenant_key VARCHAR(100) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        address TEXT,
        status VARCHAR(20) DEFAULT 'active',
        subscription_type VARCHAR(50) DEFAULT 'trial',
        subscription_start DATE,
        subscription_end DATE,
        max_users INTEGER DEFAULT 10,
        current_users INTEGER DEFAULT 1,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tenants table created');
    console.log('');

    // Step 2: Add tenant_id to all existing tables
    console.log('Step 2: Adding tenant_id columns...');
    const tables = [
      'users', 'products', 'categories', 'suppliers', 'orders', 
      'order_items', 'transactions', 'expenses', 'employees', 
      'settings', 'licenses', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        await client.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
        `);
        console.log(`   ✅ ${table}.tenant_id added`);
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      }
    }
    console.log('');

    // Step 3: Add foreign key constraint
    console.log('Step 3: Adding foreign key constraints...');
    for (const table of tables) {
      try {
        await client.query(`
          ALTER TABLE ${table} 
          ADD CONSTRAINT fk_${table}_tenant 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id);
        `);
      } catch (error) {
        // Foreign key might already exist
      }
    }
    console.log('✅ Foreign keys added');
    console.log('');

    // Step 4: Create blobs table
    console.log('Step 4: Creating blobs table...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS blobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        blob_type VARCHAR(50) NOT NULL,
        blob_name VARCHAR(255) NOT NULL,
        blob_data BYTEA NOT NULL,
        blob_size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        width INTEGER,
        height INTEGER,
        uploaded_by INTEGER,
        tenant_id INTEGER REFERENCES tenants(id),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Blobs table created');
    console.log('');

    // Step 5: Create indexes
    console.log('Step 5: Creating indexes...');
    for (const table of tables) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id);
        `);
      } catch (error) {
        // Index might already exist
      }
    }
    console.log('✅ Indexes created');
    console.log('');

    // Step 6: Insert default tenant
    console.log('Step 6: Inserting default tenant...');
    await client.query(`
      INSERT INTO tenants (
        tenant_key, company_name, contact_email, contact_phone, 
        status, subscription_type, subscription_start, subscription_end, 
        max_users, current_users
      )
      VALUES (
        'default',
        'Zayqa Namkeen',
        'contact@factssolution.com',
        '+91 9876543210',
        'active',
        'trial',
        NOW(),
        NOW() + INTERVAL '45 days',
        10,
        2
      )
      ON CONFLICT (tenant_key) DO NOTHING;
    `);
    console.log('✅ Default tenant inserted');
    console.log('');

    // Step 7: Update all existing records
    console.log('Step 7: Updating existing records...');
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE tenant_key = $1',
      ['default']
    );

    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;
      console.log(`   Tenant ID: ${tenantId}`);
      console.log('');

      for (const table of tables) {
        try {
          const result = await client.query(
            `UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL`,
            [tenantId]
          );
          console.log(`   ✅ ${table}: ${result.rowCount} records updated`);
        } catch (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      }
    }
    console.log('');

    // Step 8: Default settings
    console.log('Step 8: Creating default settings...');
    const settingsData = [
      ['company_name', 'Zayqa Namkeen'],
      ['company_email', 'contact@factssolution.com'],
      ['company_phone', '+91 9876543210'],
      ['currency', 'PKR'],
      ['currency_symbol', 'Rs'],
      ['tax_rate', '0'],
      ['trial_period_days', '45'],
      ['license_status', 'trial'],
      ['is_trial', 'true']
    ];

    const tenantId = tenantResult.rows[0].id;
    for (const [key, value] of settingsData) {
      try {
        await client.query(`
          INSERT INTO settings (tenant_id, setting_key, setting_value)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, setting_key) DO NOTHING;
        `, [tenantId, key, value]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    console.log('✅ Default settings created');
    console.log('');

    // Verification
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    const tenants = await client.query('SELECT COUNT(*) FROM tenants');
    console.log(`✅ Tenants: ${tenants.rows[0].count}`);

    const users = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL');
    console.log(`✅ Users with tenant_id: ${users.rows[0].count}`);

    const products = await client.query('SELECT COUNT(*) FROM products WHERE tenant_id IS NOT NULL');
    console.log(`✅ Products with tenant_id: ${products.rows[0].count}`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎉 Database is ready for multi-tenant!');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ Migration Failed!');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
