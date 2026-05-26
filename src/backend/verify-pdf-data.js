const axios = require('axios');

(async () => {
  try {
    const login = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    
    const token = login.data.token || login.data.data.token;
    const report = await axios.get('http://localhost:5000/api/v1/reports/sales?startDate=2026-05-01&endDate=2026-05-24', {
      headers: { Authorization: 'Bearer ' + token }
    });
    
    console.log('=== PDF DATA VERIFICATION ===');
    console.log('Product Sales Count:', report.data.data.productSales.length);
    
    console.log('\nFirst 3 Products:');
    report.data.data.productSales.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i+1}. Name: "${p.product_name}" | Qty: ${p.quantity} | Revenue: Rs ${p.revenue}`);
    });
    
    console.log('\nFirst 3 Orders:');
    report.data.data.orders.slice(0, 3).forEach((order, i) => {
      console.log(`  ${i+1}. Token: #${order.token_number} | Cashier: ${order.cashier?.name || 'NULL'} | Customer: ${order.customer_name || 'Walk-in'}`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
