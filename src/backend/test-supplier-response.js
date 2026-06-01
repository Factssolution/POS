const axios = require('axios');

async function testSupplierAPI() {
  try {
    console.log('🔍 Testing Supplier API Response...\n');
    
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });

    const token = loginRes.data.token;
    console.log('✅ Logged in\n');

    // Get suppliers
    const suppliersRes = await axios.get('http://localhost:5000/api/v1/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 API Response Structure:');
    console.log(`Success: ${suppliersRes.data.success}`);
    console.log(`Total Suppliers: ${suppliersRes.data.data.length}\n`);

    // Check first supplier in detail
    const first = suppliersRes.data.data[0];
    console.log('First Supplier Data:');
    console.log('═'.repeat(80));
    console.log(`ID: ${first.id}`);
    console.log(`Name: ${first.name}`);
    console.log(`Contact: ${first.contact}`);
    console.log(`opening_balance: ${first.opening_balance}`);
    console.log(`currentBalance: ${first.currentBalance}`);
    console.log(`status: ${first.status}`);
    console.log(`created_at: ${first.created_at}`);
    console.log(`updated_at: ${first.updated_at}`);
    console.log(`created_at type: ${typeof first.created_at}`);
    console.log(`created_at exists: ${first.created_at !== undefined && first.created_at !== null}`);
    console.log(`All keys: ${Object.keys(first).join(', ')}`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Test complete!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testSupplierAPI();
