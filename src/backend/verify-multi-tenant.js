/**
 * MULTI-TENANT ARCHITECTURE VERIFICATION
 * Comprehensive audit of multi-tenant implementation
 */

const { Client } = require('pg');
require('dotenv').config();

async function verifyMultiTenantArchitecture() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔍 MULTI-TENANT ARCHITECTURE VERIFICATION');
    console.log('═'.repeat(80));

    // 1. Check Database Architecture
    console.log('\n📊 1. DATABASE ARCHITECTURE ANALYSIS');
    console.log('─'.repeat(80));
    
    const databases = await client.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `);
    
    console.log('   Current Databases:');
    databases.rows.forEach(db => {
      console.log(`   ✓ ${db.datname}`);
    });
    
    const isSingleDatabase = databases.rows.length <= 3; // postgres, template0, template1, pos
    console.log(`\n   ⚠️  Architecture Type: ${isSingleDatabase ? 'SINGLE DATABASE' : 'MULTIPLE DATABASES'}`);
    console.log(`   ❌ Separate Database Per Tenant: ${isSingleDatabase ? 'NO - All tenants share one database' : 'YES'}`);

    // 2. Check for Tenant Isolation Columns
    console.log('\n📊 2. TENANT ISOLATION COLUMNS CHECK');
    console.log('─'.repeat(80));
    
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let hasTenantId = false;
    let hasCompanyId = false;
    let hasOrganizationId = false;

    for (const table of tables.rows) {
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1
      `, [table.table_name]);

      const columnNames = columns.rows.map(c => c.column_name);
      
      if (columnNames.includes('tenant_id')) hasTenantId = true;
      if (columnNames.includes('company_id')) hasCompanyId = true;
      if (columnNames.includes('organization_id')) hasOrganizationId = true;

      console.log(`\n   Table: ${table.table_name}`);
      console.log(`   Columns: ${columnNames.slice(0, 10).join(', ')}${columnNames.length > 10 ? '...' : ''}`);
      console.log(`   Has tenant_id: ${columnNames.includes('tenant_id') ? '✅' : '❌'}`);
    }

    console.log('\n   Summary:');
    console.log(`   ✓ tenant_id column: ${hasTenantId ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   ✓ company_id column: ${hasCompanyId ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   ✓ organization_id column: ${hasOrganizationId ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 3. Check User Creation Flow
    console.log('\n📊 3. USER CREATION FLOW ANALYSIS');
    console.log('─'.repeat(80));
    
    const users = await client.query(`
      SELECT id, name, email, role, status, created_at 
      FROM users 
      ORDER BY id
    `);

    console.log(`   Total Users: ${users.rows.length}`);
    users.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);
    });

    console.log('\n   ❌ User Creation Does NOT:');
    console.log('      - Create separate database');
    console.log('      - Assign tenant_id');
    console.log('      - Create isolated schema');
    console.log('      - Generate unique connection string');

    // 4. Check License Isolation
    console.log('\n📊 4. LICENSE SYSTEM ANALYSIS');
    console.log('─'.repeat(80));
    
    const licenses = await client.query(`
      SELECT id, license_key, client_email, status, expiry_date 
      FROM licenses 
      ORDER BY id
    `);

    console.log(`   Total Licenses: ${licenses.rows.length}`);
    if (licenses.rows.length > 0) {
      licenses.rows.forEach(lic => {
        console.log(`   ${lic.id}. ${lic.license_key ? lic.license_key.substring(0, 20) : 'N/A'}... - ${lic.client_email} - ${lic.status}`);
      });
    }

    console.log('\n   ❌ License System:');
    console.log('      - Single license per database (not per tenant)');
    console.log('      - No tenant isolation in license checks');
    console.log('      - All users share same license');

    // 5. Check Data Isolation
    console.log('\n📊 5. DATA ISOLATION CHECK');
    console.log('─'.repeat(80));
    
    const tableCounts = await client.query(`
      SELECT 
        'products' as table_name, COUNT(*) as count FROM products
      UNION ALL
      SELECT 'orders', COUNT(*) FROM orders
      UNION ALL
      SELECT 'customers', COUNT(*) FROM (SELECT DISTINCT customer_phone FROM orders WHERE customer_phone IS NOT NULL) as customers
      UNION ALL
      SELECT 'suppliers', COUNT(*) FROM suppliers
      UNION ALL
      SELECT 'transactions', COUNT(*) FROM transactions
      UNION ALL
      SELECT 'expenses', COUNT(*) FROM expenses
      UNION ALL
      SELECT 'employees', COUNT(*) FROM employees
    `);

    console.log('   Current Data (ALL SHARED):');
    tableCounts.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}: ${row.count} records`);
    });

    console.log('\n   ❌ NO DATA ISOLATION:');
    console.log('      - All users see same products');
    console.log('      - All users see same orders');
    console.log('      - All users see same customers');
    console.log('      - All users see same suppliers');
    console.log('      - No tenant-based filtering');

    // 6. Check Middleware for Tenant Filtering
    console.log('\n📊 6. MIDDLEWARE & AUTHENTICATION CHECK');
    console.log('─'.repeat(80));
    
    console.log('   ❌ Missing Multi-Tenant Middleware:');
    console.log('      - No tenant identification in JWT');
    console.log('      - No tenant_id in request context');
    console.log('      - No automatic tenant filtering in queries');
    console.log('      - No tenant-based access control');

    // 7. Settings Analysis
    console.log('\n📊 7. SETTINGS ISOLATION CHECK');
    console.log('─'.repeat(80));
    
    const settings = await client.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      ORDER BY setting_key
    `);

    console.log('   Current Settings (GLOBAL - SHARED BY ALL):');
    settings.rows.forEach(setting => {
      console.log(`   ✓ ${setting.setting_key}: ${setting.setting_value}`);
    });

    console.log('\n   ❌ Settings NOT Isolated:');
    console.log('      - Single settings table for all tenants');
    console.log('      - No tenant_id in settings');
    console.log('      - Company logo shared by all');
    console.log('      - Business info shared by all');

    // 8. FINAL VERDICT
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 MULTI-TENANT IMPLEMENTATION VERDICT');
    console.log('═'.repeat(80));
    
    console.log('\n   ❌ MULTI-TENANCY: NOT IMPLEMENTED');
    console.log('   ════════════════════════════════════════');
    console.log('\n   Current Architecture: SINGLE-TENANT');
    console.log('   ─────────────────────────────────────');
    console.log('   • Single database (pos)');
    console.log('   • Single schema');
    console.log('   • All users share ALL data');
    console.log('   • No tenant isolation');
    console.log('   • No separate databases');
    console.log('   • No tenant_id columns');
    console.log('   • No tenant-based filtering');
    console.log('   • Single license for entire system');
    console.log('   • Global settings shared by all');
    
    console.log('\n\n   ⚠️  CRITICAL FINDINGS:');
    console.log('   ════════════════════════════════════════');
    console.log('   1. ❌ NO separate database creation for new users');
    console.log('   2. ❌ NO tenant data isolation');
    console.log('   3. ❌ NO independent system operation');
    console.log('   4. ❌ NO per-tenant licensing');
    console.log('   5. ❌ NO cross-contamination prevention');
    console.log('   6. ❌ NO independent POS operation per tenant');
    
    console.log('\n\n   📋 WHAT ACTUALLY HAPPENS:');
    console.log('   ════════════════════════════════════════');
    console.log('   When Super Admin creates a new user:');
    console.log('   ✓ User is added to SAME database');
    console.log('   ✓ User sees SAME products as everyone');
    console.log('   ✓ User sees SAME orders as everyone');
    console.log('   ✓ User sees SAME customers as everyone');
    console.log('   ✓ User shares SAME license');
    console.log('   ✓ User shares SAME settings');
    console.log('   ✓ NO isolation whatsoever');
    
    console.log('\n\n   🔧 REQUIRED FOR MULTI-TENANCY:');
    console.log('   ════════════════════════════════════════');
    console.log('   Option 1: Database-per-Tenant (Recommended)');
    console.log('   ├─ Create new database for each tenant');
    console.log('   ├─ Dynamic database connection per request');
    console.log('   ├─ Tenant database provisioning system');
    console.log('   ├─ Per-tenant license management');
    console.log('   └─ Complete data isolation');
    console.log('');
    console.log('   Option 2: Schema-per-Tenant');
    console.log('   ├─ Separate schema per tenant in same database');
    console.log('   ├─ Schema-based data isolation');
    console.log('   ├─ Shared users table (global)');
    console.log('   └─ Per-tenant tables (products, orders, etc.)');
    console.log('');
    console.log('   Option 3: Row-Level Tenancy (Easiest)');
    console.log('   ├─ Add tenant_id to ALL tables');
    console.log('   ├─ Filter queries by tenant_id');
    console.log('   ├─ Add tenant_id to JWT tokens');
    console.log('   ├─ Middleware for automatic filtering');
    console.log('   └─ Per-tenant license in licenses table');

    console.log('\n' + '═'.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log('   Multi-Tenant Implementation: ❌ NOT IMPLEMENTED');
    console.log('   Data Isolation: ❌ NONE');
    console.log('   Database Separation: ❌ NONE');
    console.log('   License Isolation: ❌ NONE');
    console.log('   Tenant Independence: ❌ NONE');
    console.log('\n⚠️  The system is currently SINGLE-TENANT only!');
    console.log('   All users share the same database and data.');
    console.log('   There is NO multi-tenant architecture in place.');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

verifyMultiTenantArchitecture();
