// Test License API Endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testLicenseAPI() {
  try {
    console.log('\n🔐 Step 1: Logging in as Super Admin...\n');
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });
    
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    
    if (!token) {
      throw new Error('No token found in login response');
    }
    
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 50) + '...');
    
    // Test getLicenseStatus
    console.log('\n📊 Step 2: Testing GET /settings/license/status...\n');
    const statusResponse = await axios.get(`${BASE_URL}/settings/license/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ License Status:', JSON.stringify(statusResponse.data, null, 2));
    
    // Test getAllLicenses
    console.log('\n📋 Step 3: Testing GET /settings/license/all...\n');
    const allLicensesResponse = await axios.get(`${BASE_URL}/settings/license/all?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ All Licenses:', JSON.stringify(allLicensesResponse.data, null, 2));
    
    console.log('\n✅ ALL LICENSE APIs WORKING PERFECTLY!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   Stack:', error.response.data.error);
    }
  }
}

testLicenseAPI();
