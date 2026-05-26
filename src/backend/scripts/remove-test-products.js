const { Client } = require('pg');

async function removeTestProducts() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Barcodes of the test products to remove
    const testBarcodes = [
      'ORDER1779479749177',
      'ORDER1779479585123',
      'ORDER1779479155973'
    ];

    console.log('🗑️  Removing test products...\n');
    console.log('━'.repeat(50));

    let deletedCount = 0;

    for (const barcode of testBarcodes) {
      // First check if product exists
      const checkResult = await client.query(
        'SELECT id, name, category, price, status FROM products WHERE barcode = $1',
        [barcode]
      );

      if (checkResult.rows.length === 0) {
        console.log(`⚠️  Product with barcode ${barcode} - Not found (already deleted?)`);
        continue;
      }

      const product = checkResult.rows[0];
      console.log(` Found: ${product.name} (ID: ${product.id})`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Price: Rs${product.price}`);
      console.log(`   Status: ${product.status}`);

      // Check if product has been used in orders
      const orderCheck = await client.query(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
        [product.id]
      );

      const orderCount = parseInt(orderCheck.rows[0].count);

      if (orderCount > 0) {
        console.log(`   ⚠️  Has ${orderCount} order(s) - Marking as inactive instead of deleting\n`);
        
        // Soft delete: Mark as inactive to preserve order history
        await client.query(
          'UPDATE products SET status = $1 WHERE id = $2',
          ['inactive', product.id]
        );
        
        console.log(`   ✅ Marked as inactive (preserves order history)\n`);
      } else {
        console.log(`   ✅ No orders - Safe to delete permanently\n`);
        
        // Hard delete: Remove from database
        await client.query(
          'DELETE FROM products WHERE id = $1',
          [product.id]
        );
        
        console.log(`   ✅ Deleted permanently\n`);
      }

      deletedCount++;
    }

    console.log('━'.repeat(50));
    console.log(`\n✅ Successfully processed ${deletedCount} test product(s)\n`);

    // Show remaining products count
    const remainingResult = await client.query(
      'SELECT COUNT(*) as count FROM products'
    );
    const remainingCount = parseInt(remainingResult.rows[0].count);

    console.log(`📊 Total products in database: ${remainingCount}\n`);

    console.log('💡 Next steps:');
    console.log('   1. Refresh the Products page');
    console.log('   2. Test products should no longer appear');
    console.log('   3. POS screen will be updated automatically\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

removeTestProducts();
