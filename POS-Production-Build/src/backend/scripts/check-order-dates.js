const { sequelize } = require('../config/database');
const Order = require('../models/Order');

async function checkOrderDates() {
  console.log('\n Checking Order Dates in Database...\n');
  
  try {
    const orders = await Order.findAll({
      attributes: ['id', 'created_at', 'total_amount', 'status'],
      limit: 10
    });
    
    console.log(`Total Orders in Database: ${orders.length}\n`);
    
    if (orders.length > 0) {
      console.log('First 10 Orders:');
      console.log('─'.repeat(80));
      orders.forEach((order, index) => {
        const date = new Date(order.created_at);
        console.log(`${index + 1}. Order #${order.id}`);
        console.log(`   Date: ${order.created_at}`);
        console.log(`   Local: ${date.toLocaleString()}`);
        console.log(`   Amount: Rs ${order.total_amount}`);
        console.log(`   Status: ${order.status}\n`);
      });
      
      // Check if any orders are from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      console.log(`\nOrders from Today (${today.toISOString().split('T')[0]}): ${todayOrders.length}`);
      
      // Check date range of all orders
      const allOrders = await Order.findAll({
        attributes: ['created_at'],
        order: [['created_at', 'ASC']]
      });
      
      if (allOrders.length > 0) {
        const oldestDate = new Date(allOrders[0].created_at);
        const newestDate = new Date(allOrders[allOrders.length - 1].created_at);
        
        console.log(`\nDate Range of All Orders:`);
        console.log(`   Oldest: ${oldestDate.toISOString().split('T')[0]}`);
        console.log(`   Newest: ${newestDate.toISOString().split('T')[0]}`);
      }
    } else {
      console.log('No orders found in database');
    }
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkOrderDates();
