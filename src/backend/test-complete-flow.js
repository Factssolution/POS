// Test Complete Login & API Flow
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCompleteFlow() {
  try {
    console.log('\n🔐 STEP 1: Testing Backend Login...\n');
    
    // Login via backend API
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });
    
    console.log('✅ Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('\n📋 User Details:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 50) + '...\n');
    
    console.log('📊 STEP 2: Testing License Status API...\n');
    
    // Test license status with auth token
    const licenseStatus = await axios.get(`${BASE_URL}/settings/license/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ License Status:', JSON.stringify(licenseStatus.data, null, 2));
    
    console.log('\n📋 STEP 3: Testing All Licenses API...\n');
    
    // Test get all licenses
    const allLicenses = await axios.get(`${BASE_URL}/settings/license/all?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ All Licenses Count:', allLicenses.data.data.length);
    console.log('   Pagination:', JSON.stringify(allLicenses.data.pagination, null, 2));
    
    console.log('\n STEP 4: Testing Products API...\n');
    
    // Test products API
    const products = await axios.get(`${BASE_URL}/products?status=active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Products Count:', products.data.data?.length || 0);
    
    console.log('\n📁 STEP 5: Testing Categories API...\n');
    
    // Test categories API
    const categories = await axios.get(`${BASE_URL}/products/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Categories Count:', categories.data.data?.length || 0);
    
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 ALL API TESTS PASSED SUCCESSFULLY!');
    console.log('═'.repeat(80) + '\n');
    
    console.log('✅ Login: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ License APIs: Working');
    console.log('✅ Products API: Working');
    console.log('✅ Categories API: Working');
    console.log('\n Frontend should now work perfectly!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteFlow();
