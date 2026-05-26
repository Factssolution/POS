const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkOrderDates() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔍 Checking Order Date Fields...\n');

    // Get column names
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);

    console.log('Order Table Columns:');
    console.log('═'.repeat(60));
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type}`);
    });

    // Get first 5 orders with all date fields
    const orders = await client.query(`
      SELECT id, token_number, created_at, updated_at, token_date
      FROM orders
      ORDER BY id DESC
      LIMIT 5;
    `);

    console.log('\n\nLast 5 Orders Date Fields:');
    console.log('═'.repeat(80));
    
    orders.rows.forEach(order => {
      console.log(`\nToken #${order.token_number} (ID: ${order.id})`);
      console.log(`  created_at:  ${order.created_at || 'NULL ❌'}`);
      console.log(`  updated_at:  ${order.updated_at || 'NULL ❌'}`);
      console.log(`  token_date:  ${order.token_date || 'NULL ❌'}`);
    });

    console.log('\n' + '═'.repeat(80));

    // Count NULL created_at
    const nullCount = await client.query(`
      SELECT COUNT(*) as null_count
      FROM orders
      WHERE created_at IS NULL;
    `);

    console.log(`\nOrders with NULL created_at: ${nullCount.rows[0].null_count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderDates();
