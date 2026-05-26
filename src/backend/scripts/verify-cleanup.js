const { Client } = require('pg');

async function verifyCleanup() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    console.log('\n✅ Database Verification Report\n');
    console.log('═'.repeat(60));

    // Check test products status
    const testProducts = await client.query(
      `SELECT id, name, barcode, category, price, status 
       FROM products 
       WHERE name LIKE '%Order Test%' OR barcode LIKE 'ORDER%'
       ORDER BY created_at DESC`
    );

    console.log('\n📋 Test Products Status:');
    console.log('─'.repeat(60));
    if (testProducts.rows.length === 0) {
      console.log('✅ No test products found - All cleaned up!');
    } else {
      testProducts.rows.forEach(p => {
        console.log(`  • ${p.name} (${p.barcode})`);
        console.log(`    Status: ${p.status} | Category: ${p.category} | Price: Rs${p.price}`);
      });
    }

    // Check active products
    const activeProducts = await client.query(
      `SELECT COUNT(*) as count FROM products WHERE status = 'active'`
    );

    // Check inactive products
    const inactiveProducts = await client.query(
      `SELECT COUNT(*) as count FROM products WHERE status = 'inactive'`
    );

    // Total products
    const totalProducts = await client.query(
      `SELECT COUNT(*) as count FROM products`
    );

    console.log('\n📊 Product Statistics:');
    console.log('─'.repeat(60));
    console.log(`  Total Products: ${parseInt(totalProducts.rows[0].count)}`);
    console.log(`  Active: ${parseInt(activeProducts.rows[0].count)}`);
    console.log(`  Inactive: ${parseInt(inactiveProducts.rows[0].count)}`);

    // Check categories
    const categories = await client.query(
      `SELECT DISTINCT category, COUNT(*) as product_count 
       FROM products 
       WHERE category IS NOT NULL 
       GROUP BY category 
       ORDER BY category`
    );

    console.log('\n📂 Categories with Products:');
    console.log('─'.repeat(60));
    categories.rows.forEach(cat => {
      console.log(`  • ${cat.category}: ${cat.product_count} products`);
    });

    console.log('\n═'.repeat(60));
    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyCleanup();
