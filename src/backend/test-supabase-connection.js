/**
 * Supabase Database Connection Test
 * Tests connection to Supabase PostgreSQL with multi-tenant schema
 */

const { Client } = require('pg');

// Load environment variables from .env.production if not in production
if (!process.env.DB_HOST) {
  require('dotenv').config({ path: './.env.production' });
}

console.log('═══════════════════════════════════════════════════════');
console.log('  Supabase Database Connection Test');
console.log('═══════════════════════════════════════════════════════');
console.log('');

console.log('Database Configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`  Port: ${process.env.DB_PORT || 'NOT SET'}`);
console.log(`  Database: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`  User: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`  SSL: Enabled`);
console.log('');

// Validate required environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ ERROR: Missing required environment variables');
  console.error('   Please set: DB_HOST, DB_USER, DB_PASSWORD');
  console.error('   Or copy .env.production to .env and update values');
  process.exit(1);
}

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  query_timeout: 10000
});

async function testConnection() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to Supabase database!');
    console.log('');

    // Test 1: Database version
    console.log('Test 1: Getting database version...');
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ ${versionResult.rows[0].version.split(',')[0]}`);
    console.log('');

    // Test 2: Check multi-tenant tables
    console.log('Test 2: Checking multi-tenant schema...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const expectedTables = [
      'tenants', 'users', 'categories', 'suppliers', 'products',
      'orders', 'order_items', 'transactions', 'expenses', 'employees',
      'licenses', 'settings', 'audit_logs', 'blobs'
    ];

    const existingTables = tablesResult.rows.map(r => r.tablename);
    console.log(`   Found ${existingTables.length} tables:`);
    
    let allTablesPresent = true;
    for (const table of expectedTables) {
      const exists = existingTables.includes(table);
      const icon = exists ? '✅' : '❌';
      console.log(`   ${icon} ${table}`);
      if (!exists) allTablesPresent = false;
    }
    console.log('');

    // Test 3: Check default tenant
    console.log('Test 3: Checking default tenant...');
    const tenantResult = await client.query('SELECT * FROM tenants WHERE tenant_key = $1', ['default']);
    if (tenantResult.rows.length > 0) {
      const tenant = tenantResult.rows[0];
      console.log(`✅ Default tenant found:`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Company: ${tenant.company_name}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Subscription: ${tenant.subscription_type}`);
    } else {
      console.log('❌ Default tenant not found');
    }
    console.log('');

    // Test 4: Check users
    console.log('Test 4: Checking users...');
    const usersResult = await client.query('SELECT id, name, email, role, tenant_id FROM users ORDER BY id');
    console.log(`   Found ${usersResult.rows.length} users:`);
    for (const user of usersResult.rows) {
      console.log(`   ✅ ${user.name} (${user.email}) - ${user.role}`);
    }
    console.log('');

    // Test 5: Check tenant_id columns
    console.log('Test 5: Verifying tenant_id columns...');
    const tenantIdCheck = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name = 'tenant_id'
      AND table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`   Tables with tenant_id: ${tenantIdCheck.rows.length}`);
    for (const row of tenantIdCheck.rows) {
      console.log(`   ✅ ${row.table_name}.tenant_id`);
    }
    console.log('');

    // Test 6: Check settings
    console.log('Test 6: Checking default settings...');
    const settingsResult = await client.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE tenant_id = (SELECT id FROM tenants WHERE tenant_key = 'default')
      LIMIT 5
    `);
    console.log(`   Found ${settingsResult.rows.length} settings:`);
    for (const setting of settingsResult.rows) {
      console.log(`   ✅ ${setting.setting_key}: ${setting.setting_value}`);
    }
    console.log('');

    // Test 7: Check Row Level Security
    console.log('Test 7: Checking Row Level Security...');
    const rlsResult = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('tenants', 'users', 'orders', 'products')
      ORDER BY tablename
    `);
    
    for (const table of rlsResult.rows) {
      const status = table.rowsecurity ? '✅ Enabled' : '⚠️  Disabled';
      console.log(`   ${status} - ${table.tablename}`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Database Connection: Working');
    console.log(`✅ SSL Connection: Active`);
    console.log(`✅ Tables Present: ${existingTables.length}/${expectedTables.length}`);
    console.log(`✅ Tenants: ${tenantResult.rows.length > 0 ? 'Configured' : 'Missing'}`);
    console.log(`✅ Users: ${usersResult.rows.length}`);
    console.log(`✅ Tenant Isolation: ${tenantIdCheck.rows.length} tables with tenant_id`);
    console.log('');
    
    if (allTablesPresent && tenantResult.rows.length > 0) {
      console.log('🎉 DATABASE IS READY FOR DEPLOYMENT!');
    } else {
      console.log('⚠️  DATABASE NEEDS ATTENTION');
      console.log('   Please run: supabase-multi-tenant-schema.sql');
    }
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ CONNECTION FAILED');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common Issues:');
    console.error('  1. Incorrect database credentials');
    console.error('  2. Database not accessible from current IP');
    console.error('  3. SSL configuration issue');
    console.error('  4. Connection pool exhausted');
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Verify credentials in Supabase Dashboard');
    console.error('  - Check Connection Pooling settings');
    console.error('  - Ensure port 6543 is accessible');
    console.error('  - Try direct connection (port 5432)');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testConnection();
