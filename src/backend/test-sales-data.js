const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Product = require('./models/Product');
const { Op } = require('sequelize');

(async () => {
  try {
    console.log('=== TESTING SALES REPORT DATA ===\n');
    
    const startDate = '2026-05-01';
    const endDate = '2026-05-24';
    
    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category', 'cost_price']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('Total completed orders:', orders.length);
    
    // Calculate daily sales breakdown
    const dailySalesMap = {};
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.created_at);
      if (isNaN(orderDate.getTime())) {
        console.warn('Invalid date for order:', order.id);
        return;
      }
      const date = orderDate.toISOString().split('T')[0];
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = {
          date: date,
          orders: 0,
          revenue: 0
        };
      }
      dailySalesMap[date].orders += 1;
      dailySalesMap[date].revenue += parseFloat(order.total_amount);
    });
    
    const dailySales = Object.values(dailySalesMap)
      .map(day => ({
        ...day,
        revenue: parseFloat(day.revenue.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('\nDaily Sales Breakdown:');
    dailySales.forEach(day => {
      console.log(`  ${day.date}: ${day.orders} orders, Rs ${day.revenue}`);
    });
    
    console.log('\nTotal Revenue:', dailySales.reduce((sum, d) => sum + d.revenue, 0));
    console.log('Total Orders:', dailySales.reduce((sum, d) => sum + d.orders, 0));
    console.log('Active Days:', dailySales.length);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
