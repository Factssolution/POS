const axios = require('axios');

async function testSupplierAPI() {
  try {
    // First login
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });

    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');

    // Get suppliers
    const suppliersRes = await axios.get('http://localhost:5000/api/v1/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Supplier API Response:');
    console.log(`Total Suppliers: ${suppliersRes.data.data.length}\n`);

    // Check first 3 suppliers
    suppliersRes.data.data.slice(0, 3).forEach((s, i) => {
      console.log(`Supplier ${i + 1}:`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Contact: ${s.contact}`);
      console.log(`  created_at: ${s.created_at}`);
      console.log(`  updated_at: ${s.updated_at}`);
      console.log(`  created_at type: ${typeof s.created_at}`);
      console.log(`  created_at exists: ${!!s.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSupplierAPI();
