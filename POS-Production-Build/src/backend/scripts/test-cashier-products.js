const axios = require('axios');

async function testCashierProductsVisibility() {
  console.log('\nTesting Cashier Product Visibility...\n');
  
  const baseUrl = 'http://localhost:5000/api/v1';
  
  try {
    // Login as cashier
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'skyzai2009@gmail.com',
      password: 'Black@786##'
    });
    
    const cashierToken = loginResponse.data.data.token;
    console.log('✅ Cashier logged in\n');
    
    // Get dashboard stats
    const statsResponse = await axios.get(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });
    
    const stats = statsResponse.data.data;
    console.log('Cashier Dashboard Stats:');
    console.log('   Total Products:', stats.total_products);
    console.log('   User Role:', loginResponse.data.data.user.role);
    
    if (stats.total_products === 0) {
      console.log('\n✅ PASS: Cashier cannot see products (shows 0)');
    } else {
      console.log('\n❌ FAIL: Cashier should not see products');
      console.log('   Expected: 0, Got:', stats.total_products);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCashierProductsVisibility();
