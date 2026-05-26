const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function checkProductSchema() {
  try {
    const results = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });
    
    console.log('Products table columns:');
    results.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Check actual data
    const sample = await sequelize.query(`
      SELECT id, name, stock, min_stock, quantity, reorder_level
      FROM products
      LIMIT 1
    `, { type: QueryTypes.SELECT });
    
    console.log('\nSample product data:');
    console.log(JSON.stringify(sample[0], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProductSchema();
