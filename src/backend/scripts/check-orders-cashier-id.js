const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    console.log('\n' + '═'.repeat(90));
    console.log('                    CHECKING ORDERS CASHIER_ID FIELD');
    console.log('═'.repeat(90) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check orders table structure
    const columns = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'orders' 
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );

    console.log('📋 Orders Table Columns:\n');
    columns.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} : ${col.data_type}`);
    });

    // Check sample orders
    console.log('\n\n📊 Sample Orders (Last 5):\n');
    console.log('─'.repeat(90));
    
    const orders = await sequelize.query(
      `SELECT id, token_number, cashier_id, total_amount, created_at 
       FROM orders 
       WHERE status = 'completed' 
       ORDER BY created_at DESC 
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    );

    orders.forEach((order, idx) => {
      console.log(`\n${idx + 1}. Order #${order.token_number}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Cashier ID: ${order.cashier_id || 'NULL'}`);
      console.log(`   Amount: Rs ${order.total_amount}`);
      console.log(`   Date: ${new Date(order.created_at).toLocaleString()}`);
    });

    // Count orders by cashier
    console.log('\n\n📊 Orders Count by Cashier:\n');
    console.log('─'.repeat(90));
    
    const cashierStats = await sequelize.query(
      `SELECT cashier_id, COUNT(*) as order_count, SUM(total_amount) as total_revenue
       FROM orders
       WHERE status = 'completed'
       GROUP BY cashier_id
       ORDER BY cashier_id`,
      { type: QueryTypes.SELECT }
    );

    cashierStats.forEach(stat => {
      console.log(`\n   Cashier ID: ${stat.cashier_id || 'NULL'}`);
      console.log(`   Orders: ${stat.order_count}`);
      console.log(`   Revenue: Rs ${stat.total_revenue}`);
    });

    console.log('\n' + '═'.repeat(90));
    console.log('✅ Check complete!');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
