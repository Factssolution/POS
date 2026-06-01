/**
 * Fix Supabase Permissions for Licenses and Settings Tables
 * Run this script to grant proper permissions to anon and authenticated roles
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function fixPermissions() {
  // Use Supabase connection string from environment
  const connectionString = process.env.SUPABASE_DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pos'}`;

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔧 Fixing Supabase Table Permissions...\n');

    // 1. Grant permissions on licenses table
    console.log('📝 Step 1: Granting permissions on licenses table...');
    await client.query(`
      -- Grant SELECT to anon and authenticated roles
      GRANT SELECT ON public.licenses TO anon;
      GRANT SELECT ON public.licenses TO authenticated;
      
      -- Grant INSERT, UPDATE to authenticated (for creating/updating licenses)
      GRANT INSERT, UPDATE ON public.licenses TO authenticated;
      
      -- Grant USAGE on sequence for INSERT operations
      GRANT USAGE, SELECT ON SEQUENCE licenses_id_seq TO authenticated;
    `);
    console.log('   ✅ Licenses table permissions granted\n');

    // 2. Grant permissions on settings table
    console.log('📝 Step 2: Granting permissions on settings table...');
    await client.query(`
      -- Grant SELECT to anon and authenticated roles
      GRANT SELECT ON public.settings TO anon;
      GRANT SELECT ON public.settings TO authenticated;
      
      -- Grant INSERT, UPDATE to authenticated
      GRANT INSERT, UPDATE ON public.settings TO authenticated;
      
      -- Grant USAGE on sequence
      GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO authenticated;
    `);
    console.log('   ✅ Settings table permissions granted\n');

    // 3. Verify permissions
    console.log('📝 Step 3: Verifying permissions...');
    const licensePerms = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'licenses' 
      AND grantee IN ('anon', 'authenticated')
      ORDER BY grantee, privilege_type;
    `);

    const settingsPerms = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'settings' 
      AND grantee IN ('anon', 'authenticated')
      ORDER BY grantee, privilege_type;
    `);

    console.log('   Licenses table permissions:');
    licensePerms.rows.forEach(row => {
      console.log(`     - ${row.grantee}: ${row.privilege_type}`);
    });

    console.log('\n   Settings table permissions:');
    settingsPerms.rows.forEach(row => {
      console.log(`     - ${row.grantee}: ${row.privilege_type}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Supabase Permissions Fixed Successfully!');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   - licenses table: SELECT granted to anon, authenticated');
    console.log('   - licenses table: INSERT, UPDATE granted to authenticated');
    console.log('   - settings table: SELECT granted to anon, authenticated');
    console.log('   - settings table: INSERT, UPDATE granted to authenticated');
    console.log('\n⚠️  If you are using Supabase hosted database:');
    console.log('   Run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('   ─────────────────────────────────────────────');
    console.log('   GRANT SELECT ON public.licenses TO anon, authenticated;');
    console.log('   GRANT SELECT ON public.settings TO anon, authenticated;');
    console.log('   ─────────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Failed to fix permissions:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPermissions();
