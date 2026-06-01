/**
 * ADD MISSING COLUMNS TO SUPABASE
 * Fixes: products.status, categories.sort_order
 * Uses Supabase connection pooling or direct connection
 */

const { Client } = require('pg');
require('dotenv').config();

// Try connection pooling first (works on Vercel)
const dbConfig = {
  host: process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: process.env.DB_PORT || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.hfusrtiqjyiotjewzzkt',
  password: process.env.DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
};

async function addMissingColumns() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');
    console.log('🔧 Adding missing columns...\n');

    // 1. Add products.status
    console.log('1️⃣  products.status...');
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);
    console.log('   ✅ Done\n');

    // 2. Add categories.sort_order
    console.log('2️⃣  categories.sort_order...');
    await client.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    `);
    console.log('   ✅ Done\n');

    // 3. Add categories.status
    console.log('3️⃣  categories.status...');
    await client.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);
    console.log('   ✅ Done\n');

    // 4. Ensure timestamps exist
    console.log('4️⃣  Timestamps check...');
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('   ✅ Done\n');

    console.log('✅ All columns added successfully!');
    
    // Verify
    console.log('\n📊 Verification:');
    const products = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name IN ('status', 'created_at', 'updated_at')
      ORDER BY column_name;
    `);
    console.log('   Products columns:');
    products.rows.forEach(row => {
      console.log(`     - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });

    const categories = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name IN ('status', 'sort_order', 'created_at', 'updated_at')
      ORDER BY column_name;
    `);
    console.log('\n   Categories columns:');
    categories.rows.forEach(row => {
      console.log(`     - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });

  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('\n💡 Try connecting with Supabase SQL Editor and run:');
    console.log(`
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
  } finally {
    await client.end();
  }
}

addMissingColumns();
