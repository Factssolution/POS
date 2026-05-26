const { Client } = require('pg');

async function verifyCategories() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
    );

    console.log('\n✅ Categories in Database:');
    console.log('━'.repeat(40));
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.category}`);
    });
    console.log('━'.repeat(40));
    console.log(`\n📊 Total: ${result.rows.length} categories\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyCategories();
