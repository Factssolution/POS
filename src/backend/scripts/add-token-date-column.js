const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_NAME = process.env.DB_NAME || 'pos';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

async function migrate() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('🔄 Connected to database');
    
    console.log('🔄 Adding token_date column to orders table...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS token_date DATE NOT NULL DEFAULT CURRENT_DATE
    `);
    
    console.log('✅ token_date column added');
    
    console.log('🔄 Creating index on token_date...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_token_date ON orders(token_date)
    `);
    
    console.log('✅ Index created on token_date');
    
    console.log('🔄 Backfilling token_date from created_at...');
    
    await client.query(`
      UPDATE orders 
      SET token_date = DATE(created_at)
      WHERE token_date IS NULL OR token_date = CURRENT_DATE
    `);
    
    console.log('✅ Existing orders backfilled with token_date');
    
    console.log('🎉 Migration completed successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

migrate();
