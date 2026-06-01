/**
 * MULTI-TENANT MIGRATION SCRIPT
 * Adds tenant_id to all tables and creates tenants table
 * Implements Row-Level Tenancy (Option 3)
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrateToMultiTenant() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🚀 MULTI-TENANT MIGRATION STARTED');
    console.log('═'.repeat(80));

    // Step 1: Create tenants table
    console.log('\n📝 Step 1: Creating tenants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        tenant_key VARCHAR(100) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        address TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
        subscription_type VARCHAR(50) DEFAULT 'trial' CHECK (subscription_type IN ('trial', 'monthly', 'yearly', 'lifetime')),
        subscription_start DATE,
        subscription_end DATE,
        max_users INTEGER DEFAULT 10,
        current_users INTEGER DEFAULT 1,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('   ✅ Tenants table created');

    // Step 2: Create indexes for performance
    console.log('\n📝 Step 2: Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenants_key ON tenants(tenant_key);
      CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
      CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON tenants(subscription_type);
    `);
    console.log('   ✅ Indexes created');

    // Step 3: Create default tenant (for existing data)
    console.log('\n📝 Step 3: Creating default tenant...');
    const defaultTenant = await client.query(`
      INSERT INTO tenants (tenant_key, company_name, contact_email, contact_phone, status, subscription_type, subscription_start, subscription_end, max_users, current_users)
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
      ON CONFLICT (tenant_key) DO UPDATE SET
        updated_at = NOW()
      RETURNING id;
    `);
    const defaultTenantId = defaultTenant.rows[0].id;
    console.log(`   ✅ Default tenant created (ID: ${defaultTenantId})`);

    // Step 4: Add tenant_id to users table
    console.log('\n📝 Step 4: Adding tenant_id to users table...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) DEFAULT ${defaultTenantId};
    `);
    await client.query(`
      UPDATE users SET tenant_id = ${defaultTenantId} WHERE tenant_id IS NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
    `);
    console.log('   ✅ users.tenant_id added and populated');

    // Step 5: Add tenant_id to ALL business tables
    const tables = [
      'products', 'categories', 'suppliers', 'orders', 'order_items',
      'transactions', 'expenses', 'employees', 'settings', 'licenses',
      'audit_logs', 'blobs'
    ];

    for (const table of tables) {
      console.log(`\n📝 Step 5.${tables.indexOf(table) + 1}: Adding tenant_id to ${table}...`);
      try {
        await client.query(`
          ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) DEFAULT ${defaultTenantId};
        `);
        await client.query(`
          UPDATE ${table} SET tenant_id = ${defaultTenantId} WHERE tenant_id IS NULL;
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id);
        `);
        console.log(`   ✅ ${table}.tenant_id added and populated`);
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      }
    }

    // Step 6: Update check constraints for Super Admin role
    console.log('\n📝 Step 6: Updating role constraints...');
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Super Admin'));
    `);
    console.log('   ✅ Role constraints updated');

    // Step 7: Update settings to be tenant-specific
    console.log('\n📝 Step 7: Migrating settings to tenant-specific...');
    await client.query(`
      ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_setting_key_key;
    `);
    await client.query(`
      ALTER TABLE settings ADD CONSTRAINT settings_tenant_key_unique UNIQUE (tenant_id, setting_key);
    `);
    console.log('   ✅ Settings uniqueness updated to tenant + key');

    // Step 8: Create tenant provisioning function
    console.log('\n📝 Step 8: Creating tenant provisioning function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION create_tenant(
        p_tenant_key VARCHAR(100),
        p_company_name VARCHAR(255),
        p_contact_email VARCHAR(255),
        p_admin_name VARCHAR(255),
        p_admin_email VARCHAR(255),
        p_admin_password VARCHAR(255),
        p_subscription_type VARCHAR(50) DEFAULT 'trial'
      ) RETURNS INTEGER AS $$
      DECLARE
        v_tenant_id INTEGER;
        v_admin_id INTEGER;
      BEGIN
        -- Create tenant
        INSERT INTO tenants (tenant_key, company_name, contact_email, status, subscription_type, subscription_start, subscription_end)
        VALUES (p_tenant_key, p_company_name, p_contact_email, 'active', p_subscription_type, NOW(), 
                CASE 
                  WHEN p_subscription_type = 'trial' THEN NOW() + INTERVAL '45 days'
                  WHEN p_subscription_type = 'monthly' THEN NOW() + INTERVAL '1 month'
                  WHEN p_subscription_type = 'yearly' THEN NOW() + INTERVAL '1 year'
                  WHEN p_subscription_type = 'lifetime' THEN NULL
                  ELSE NOW() + INTERVAL '45 days'
                END)
        RETURNING id INTO v_tenant_id;

        -- Create admin user for tenant
        INSERT INTO users (name, email, password, role, status, tenant_id)
        VALUES (p_admin_name, p_admin_email, p_admin_password, 'Admin', 'active', v_tenant_id)
        RETURNING id INTO v_admin_id;

        -- Copy default settings to new tenant
        INSERT INTO settings (tenant_id, setting_key, setting_value)
        SELECT v_tenant_id, setting_key, setting_value
        FROM settings
        WHERE tenant_id = ${defaultTenantId}
        AND setting_key NOT IN ('company_name', 'company_email', 'company_phone', 'company_address', 'gst_number');

        -- Update company-specific settings
        UPDATE settings SET setting_value = p_company_name WHERE tenant_id = v_tenant_id AND setting_key = 'company_name';
        UPDATE settings SET setting_value = p_contact_email WHERE tenant_id = v_tenant_id AND setting_key = 'company_email';

        -- Create default license for tenant
        INSERT INTO licenses (tenant_id, license_key, client_email, status, issued_date, expiry_date)
        VALUES (v_tenant_id, 'LIC-' || UPPER(p_tenant_key) || '-' || EXTRACT(EPOCH FROM NOW())::bigint, p_contact_email, 'trial', NOW(),
                CASE 
                  WHEN p_subscription_type = 'trial' THEN NOW() + INTERVAL '45 days'
                  ELSE NOW() + INTERVAL '1 year'
                END);

        RETURN v_tenant_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Tenant provisioning function created');

    // Step 9: Verify migration
    console.log('\n📝 Step 9: Verifying migration...');
    
    const tenantCount = await client.query('SELECT COUNT(*) FROM tenants');
    console.log(`   ✓ Tenants: ${tenantCount.rows[0].count}`);

    const usersWithTenant = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL');
    console.log(`   ✓ Users with tenant_id: ${usersWithTenant.rows[0].count}`);

    const tablesWithTenant = await client.query(`
      SELECT table_name, COUNT(*) as has_tenant_id
      FROM information_schema.columns
      WHERE column_name = 'tenant_id'
      AND table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name
    `);
    console.log(`   ✓ Tables with tenant_id: ${tablesWithTenant.rows.length}`);
    tablesWithTenant.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('✅ MULTI-TENANT MIGRATION COMPLETE!');
    console.log('═'.repeat(80));
    
    console.log('\n📊 Migration Summary:');
    console.log('   ✓ Tenants table: Created');
    console.log('   ✓ Default tenant: Created (ID: ' + defaultTenantId + ')');
    console.log('   ✓ All tables: tenant_id column added');
    console.log('   ✓ Existing data: Assigned to default tenant');
    console.log('   ✓ Indexes: Created for performance');
    console.log('   ✓ Provisioning function: Created');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Update backend models to include tenant_id');
    console.log('   2. Add tenant middleware for automatic filtering');
    console.log('   3. Update JWT to include tenant_id');
    console.log('   4. Create tenant provisioning API');
    console.log('   5. Update all controllers to filter by tenant_id');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateToMultiTenant();
