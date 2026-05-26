const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    console.log('📊 PRODUCTS TABLE SCHEMA:\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n\n📦 CURRENT PRODUCTS:\n');
    const products = await client.query('SELECT id, name, price, cost_price, stock FROM products LIMIT 5');
    products.rows.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.name}`);
      console.log(`    Price: ${p.price} (type: ${typeof p.price})`);
      console.log(`    Cost: ${p.cost_price} (type: ${typeof p.cost_price})\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkSchema();
