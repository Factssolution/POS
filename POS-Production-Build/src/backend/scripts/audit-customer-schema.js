const sequelize = require('../config/database');

(async () => {
  try {
    console.log('\n' + '═'.repeat(90));
    console.log('                    CUSTOMER REPORTS - SCHEMA AUDIT');
    console.log('═'.repeat(90) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check orders table schema
    console.log('📋 ORDERS TABLE SCHEMA:');
    console.log('─'.repeat(90));
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'orders' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.character_maximum_length ? 'max:' + col.character_maximum_length : 'N/A'.padEnd(5)} | ${col.is_nullable.padEnd(3)} | Default: ${col.column_default || 'none'}`);
    });

    // Check indexes
    console.log('\n\n📊 ORDERS TABLE INDEXES:');
    console.log('─'.repeat(90));
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'orders' AND schemaname = 'public'
      ORDER BY indexname
    `);
    
    indexes.forEach(idx => {
      console.log(`  ${idx.indexname.padEnd(35)}`);
      console.log(`    ${idx.indexdef}`);
      console.log();
    });

    // Check customer data statistics
    console.log('\n📈 CUSTOMER DATA STATISTICS:');
    console.log('─'.repeat(90));
    
    const [totalOrders] = await sequelize.query(`SELECT COUNT(*) as count FROM orders`);
    const [ordersWithCustomer] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE customer_name IS NOT NULL AND customer_phone IS NOT NULL
    `);
    const [uniqueCustomers] = await sequelize.query(`
      SELECT COUNT(DISTINCT customer_phone) as count
      FROM orders
      WHERE customer_phone IS NOT NULL
    `);
    
    console.log(`  Total Orders:              ${totalOrders[0].count}`);
    console.log(`  Orders with Customer Info: ${ordersWithCustomer[0].count}`);
    console.log(`  Unique Customers:          ${uniqueCustomers[0].count}`);

    // Sample customer data
    console.log('\n👥 SAMPLE CUSTOMER DATA:');
    console.log('─'.repeat(90));
    const [sampleCustomers] = await sequelize.query(`
      SELECT 
        customer_name,
        customer_phone,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        MIN(created_at) as first_visit,
        MAX(created_at) as last_visit
      FROM orders
      WHERE customer_name IS NOT NULL AND customer_phone IS NOT NULL
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC
      LIMIT 5
    `);
    
    sampleCustomers.forEach((cust, idx) => {
      console.log(`  ${idx + 1}. ${cust.customer_name}`);
      console.log(`     Phone: ${cust.customer_phone}`);
      console.log(`     Orders: ${cust.order_count} | Total Spent: Rs ${parseFloat(cust.total_spent).toFixed(2)}`);
      console.log(`     First Visit: ${new Date(cust.first_visit).toLocaleDateString()}`);
      console.log(`     Last Visit: ${new Date(cust.last_visit).toLocaleDateString()}`);
      console.log();
    });

    // Check associations
    console.log('\n🔗 ASSOCIATION VERIFICATION:');
    console.log('─'.repeat(90));
    
    const [orderItemsCheck] = await sequelize.query(`
      SELECT COUNT(*) as count FROM order_items
    `);
    console.log(`  Order Items: ${orderItemsCheck[0].count} records`);
    
    const [productsCheck] = await sequelize.query(`
      SELECT COUNT(*) as count FROM products
    `);
    console.log(`  Products: ${productsCheck[0].count} records`);
    
    const [usersCheck] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users
    `);
    console.log(`  Users (Cashiers): ${usersCheck[0].count} records`);

    console.log('\n' + '═'.repeat(90));
    console.log('✅ Schema audit complete!');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Audit Error:', error);
    process.exit(1);
  }
})();
