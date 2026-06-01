/**
 * Supabase Database Structure Checker
 * Connects and shows complete database schema
 */

const { Client } = require('pg');

console.log('═══════════════════════════════════════════════════════');
console.log('  Supabase Database Structure Check');
console.log('═══════════════════════════════════════════════════════');
console.log('');

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

async function checkDatabase() {
  try {
    console.log('📡 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. List all tables
    console.log('═══════════════════════════════════════════════════════');
    console.log('  1. ALL TABLES IN DATABASE');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log(`Total Tables: ${tables.rows.length}\n`);
    tables.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.tablename}`);
    });
    console.log('');

    // 2. Check tenant_id columns in all tables
    console.log('═══════════════════════════════════════════════════════');
    console.log('  2. TABLES WITH tenant_id COLUMN');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tenantColumns = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE column_name = 'tenant_id'
      AND table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Tables with tenant_id: ${tenantColumns.rows.length}\n`);
    tenantColumns.rows.forEach((row, i) => {
      console.log(`  ✅ ${row.table_name}.${row.column_name} (${row.data_type})`);
    });
    console.log('');

    // 3. Tenants table data
    console.log('═══════════════════════════════════════════════════════');
    console.log('  3. TENANTS DATA');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tenants = await client.query('SELECT * FROM tenants ORDER BY id');
    console.log(`Total Tenants: ${tenants.rows.length}\n`);
    
    if (tenants.rows.length > 0) {
      tenants.rows.forEach((tenant, i) => {
        console.log(`  Tenant ${i + 1}:`);
        console.log(`    ID: ${tenant.id}`);
        console.log(`    Key: ${tenant.tenant_key}`);
        console.log(`    Company: ${tenant.company_name}`);
        console.log(`    Email: ${tenant.contact_email}`);
        console.log(`    Status: ${tenant.status}`);
        console.log(`    Subscription: ${tenant.subscription_type}`);
        console.log(`    Max Users: ${tenant.max_users}`);
        console.log('');
      });
    }

    // 4. Record counts per table
    console.log('═══════════════════════════════════════════════════════');
    console.log('  4. RECORD COUNTS PER TABLE');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tableNames = tables.rows.map(r => r.tablename);
    
    for (const table of tableNames) {
      try {
        const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const withTenant = await client.query(
          `SELECT COUNT(*) FROM ${table} WHERE tenant_id IS NOT NULL`
        ).catch(() => ({ rows: [{ count: 'N/A' }] }));
        
        console.log(`  ${table}:`);
        console.log(`    Total Records: ${count.rows[0].count}`);
        if (withTenant.rows[0].count !== 'N/A') {
          console.log(`    With tenant_id: ${withTenant.rows[0].count}`);
        }
        console.log('');
      } catch (error) {
        console.log(`  ${table}: Error - ${error.message}\n`);
      }
    }

    // 5. Indexes on tenant_id
    console.log('═══════════════════════════════════════════════════════');
    console.log('  5. INDEXES ON tenant_id');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const indexes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE indexname LIKE '%tenant%'
      AND schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`Total Indexes: ${indexes.rows.length}\n`);
    indexes.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.tablename} - ${row.indexname}`);
    });
    console.log('');

    // 6. Foreign keys
    console.log('═══════════════════════════════════════════════════════');
    console.log('  6. FOREIGN KEY CONSTRAINTS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'tenant_id'
      ORDER BY tc.table_name;
    `);
    
    console.log(`Foreign Keys on tenant_id: ${foreignKeys.rows.length}\n`);
    foreignKeys.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.table_name}.tenant_id → ${row.foreign_table_name}.id`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ DATABASE CHECK COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Check Failed!');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabase();
