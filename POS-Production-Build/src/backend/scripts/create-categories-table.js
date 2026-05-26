const { Client } = require('pg');

async function createCategoriesTable() {
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

    console.log(' Creating categories table...\n');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'Package',
        status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Categories table created\n');

    // Seed default categories
    console.log('📝 Seeding default categories...\n');

    const defaultCategories = [
      { name: 'Food', description: 'Food items and groceries', color: '#ef4444', icon: 'Apple' },
      { name: 'Beverages', description: 'Drinks and beverages', color: '#3b82f6', icon: 'CupSoda' },
      { name: 'Snacks', description: 'Snacks and chips', color: '#f59e0b', icon: 'Cookie' },
      { name: 'Dairy', description: 'Dairy products', color: '#10b981', icon: 'Milk' },
      { name: 'Bakery', description: 'Bakery items', color: '#8b5cf6', icon: 'Cake' },
      { name: 'Desserts', description: 'Desserts and sweets', color: '#ec4899', icon: 'Candy' },
      { name: 'Electronics', description: 'Electronic items', color: '#6366f1', icon: 'Smartphone' },
      { name: 'Accessories', description: 'Accessories and add-ons', color: '#14b8a6', icon: 'Watch' },
      { name: 'Clothing', description: 'Clothing and apparel', color: '#f97316', icon: 'Shirt' },
      { name: 'Other', description: 'Other items', color: '#6b7280', icon: 'Package' }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const category of defaultCategories) {
      try {
        // Check if category exists
        const checkResult = await client.query(
          'SELECT id FROM categories WHERE name = $1',
          [category.name]
        );

        if (checkResult.rows.length > 0) {
          console.log(`  ⚠️  ${category.name} - Already exists, skipping`);
          skippedCount++;
          continue;
        }

        // Insert category
        await client.query(
          `INSERT INTO categories (name, description, color, icon, status, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [category.name, category.description, category.color, category.icon, 'active', addedCount]
        );

        console.log(`  ✅ ${category.name} - Added`);
        addedCount++;
      } catch (error) {
        console.error(`  ❌ Error adding ${category.name}:`, error.message);
      }
    }

    console.log('\n' + '━'.repeat(50));
    console.log(`\n✅ Seeding complete!`);
    console.log(`   Added: ${addedCount} categories`);
    console.log(`   Skipped: ${skippedCount} categories\n`);

    // Show all categories
    const result = await client.query('SELECT id, name, color, status FROM categories ORDER BY sort_order');
    
    console.log('📊 Current Categories:');
    console.log('─'.repeat(50));
    result.rows.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name} (${cat.color}) - ${cat.status}`);
    });

    console.log('\n' + '━'.repeat(50));
    console.log('\n💡 Next steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Go to Categories page in the app');
    console.log('   3. Add, edit, or manage categories\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createCategoriesTable();
