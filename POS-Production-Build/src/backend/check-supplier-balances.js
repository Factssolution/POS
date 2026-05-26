const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkSupplierBalances() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔍 Checking Supplier Balances...\n');

    // Get all suppliers with their transactions
    const result = await client.query(`
      SELECT 
        s.id,
        s.name,
        s.opening_balance,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debit,
        (s.opening_balance + 
         COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0)
        ) as calculated_balance
      FROM suppliers s
      LEFT JOIN transactions t ON s.id = t.supplier_id
      GROUP BY s.id, s.name, s.opening_balance
      ORDER BY s.id;
    `);

    console.log('Supplier Balance Calculation:\n');
    console.log('═'.repeat(80));
    
    result.rows.forEach(row => {
      console.log(`\n${row.name} (ID: ${row.id})`);
      console.log(`  Opening Balance: Rs ${parseFloat(row.opening_balance).toLocaleString()}`);
      console.log(`  + Credit:        Rs ${parseFloat(row.total_credit).toLocaleString()}`);
      console.log(`  - Debit:         Rs ${parseFloat(row.total_debit).toLocaleString()}`);
      console.log(`  ─────────────────────────────────────`);
      console.log(`  = Current:       Rs ${parseFloat(row.calculated_balance).toLocaleString()}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Balance check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSupplierBalances();
