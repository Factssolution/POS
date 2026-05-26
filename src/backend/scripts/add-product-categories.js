const { Client } = require('pg');

async function addCategories() {
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

    // Categories to add with sample products
    const categories = [
      {
        name: 'Beverages',
        products: [
          { name: 'Coca Cola 500ml', price: 60, stock: 100, barcode: 'BEV001' },
          { name: 'Pepsi 500ml', price: 60, stock: 100, barcode: 'BEV002' },
          { name: 'Mineral Water 1L', price: 20, stock: 200, barcode: 'BEV003' }
        ]
      },
      {
        name: 'Snacks',
        products: [
          { name: 'Lays Chips', price: 20, stock: 150, barcode: 'SNK001' },
          { name: 'Kurkure', price: 20, stock: 150, barcode: 'SNK002' },
          { name: 'Biscuit Pack', price: 30, stock: 100, barcode: 'SNK003' }
        ]
      },
      {
        name: 'Dairy',
        products: [
          { name: 'Milk 1L', price: 60, stock: 50, barcode: 'DRY001' },
          { name: 'Cheese Slice', price: 40, stock: 80, barcode: 'DRY002' },
          { name: 'Yogurt Cup', price: 25, stock: 60, barcode: 'DRY003' }
        ]
      },
      {
        name: 'Bakery',
        products: [
          { name: 'Bread Loaf', price: 40, stock: 30, barcode: 'BKR001' },
          { name: 'Cake Slice', price: 80, stock: 20, barcode: 'BKR002' },
          { name: 'Cookies Pack', price: 50, stock: 40, barcode: 'BKR003' }
        ]
      },
      {
        name: 'Desserts',
        products: [
          { name: 'Ice Cream Cup', price: 100, stock: 40, barcode: 'DSR001' },
          { name: 'Chocolate Bar', price: 60, stock: 80, barcode: 'DSR002' },
          { name: 'Candy Pack', price: 30, stock: 100, barcode: 'DSR003' }
        ]
      },
      {
        name: 'Electronics',
        products: [
          { name: 'USB Cable', price: 150, stock: 50, barcode: 'ELC001' },
          { name: 'Phone Charger', price: 300, stock: 30, barcode: 'ELC002' },
          { name: 'Earphones', price: 200, stock: 40, barcode: 'ELC003' }
        ]
      },
      {
        name: 'Accessories',
        products: [
          { name: 'Mobile Case', price: 250, stock: 60, barcode: 'ACC001' },
          { name: 'Screen Guard', price: 100, stock: 80, barcode: 'ACC002' },
          { name: 'Key Chain', price: 50, stock: 100, barcode: 'ACC003' }
        ]
      },
      {
        name: 'Clothing',
        products: [
          { name: 'T-Shirt', price: 500, stock: 40, barcode: 'CLT001' },
          { name: 'Cap', price: 200, stock: 60, barcode: 'CLT002' },
          { name: 'Socks Pair', price: 100, stock: 100, barcode: 'CLT003' }
        ]
      },
      {
        name: 'Other',
        products: [
          { name: 'Notebook', price: 40, stock: 100, barcode: 'OTH001' },
          { name: 'Pen Pack', price: 50, stock: 80, barcode: 'OTH002' },
          { name: 'Tissue Pack', price: 30, stock: 120, barcode: 'OTH003' }
        ]
      }
    ];

    let totalProductsAdded = 0;

    for (const category of categories) {
      console.log(`\n📦 Adding category: ${category.name}`);
      console.log('━'.repeat(50));

      for (const product of category.products) {
        const timestamp = Date.now();
        const uniqueBarcode = `${product.barcode}-${timestamp.toString().slice(-4)}`;

        const result = await client.query(
          `INSERT INTO products (name, description, category, price, cost_price, stock, min_stock, barcode, image_url, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (barcode) DO NOTHING
           RETURNING id, name, category`,
          [
            product.name,
            `Quality ${product.name}`,
            category.name,
            product.price,
            Math.round(product.price * 0.7), // Cost price is 70% of selling price
            product.stock,
            10, // min_stock
            uniqueBarcode,
            null, // image_url
            'active'
          ]
        );

        if (result.rows.length > 0) {
          console.log(`  ✅ ${product.name} (Rs ${product.price}, Stock: ${product.stock})`);
          totalProductsAdded++;
        } else {
          console.log(`  ⚠️  ${product.name} - Skipped (barcode exists)`);
        }
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`\n✅ Successfully added ${totalProductsAdded} products across ${categories.length} categories!\n`);
    
    console.log('📊 Categories now available:');
    console.log('━'.repeat(50));
    categories.forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (${cat.products.length} products)`);
    });
    console.log('━'.repeat(50));

    console.log('\n💡 Next steps:');
    console.log('   1. Refresh the Products page');
    console.log('   2. Check the Category filter - all categories should appear');
    console.log('   3. Refresh the POS screen - categories will be available there too');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

addCategories();
