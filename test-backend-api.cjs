/**
 * Test Backend License API
 * Diagnoses the 500 errors from pos-api-zayqa.vercel.app
 */

const axios = require('axios');

const BASE_URL = 'https://pos-api-zayqa.vercel.app/api/v1';

async function testLicenseAPI() {
  console.log('🔍 Testing License API Endpoints\n');
  console.log('='.repeat(60));
  
  // Step 1: Login
  console.log('\n📝 Step 1: Logging in as Super Admin...\n');
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'factsolution@gmail.com',
      password: 'Black@786##'
    });
    
    if (loginRes.data.success && loginRes.data.token) {
      token = loginRes.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${token.substring(0, 20)}...`);
    } else {
      console.log('❌ Login failed:', loginRes.data);
      return;
    }
  } catch (err) {
    console.log('❌ Login error:', err.response?.data || err.message);
    return;
  }

  // Step 2: Test license status
  console.log('\n📝 Step 2: Testing GET /settings/license/status...\n');
  try {
    const statusRes = await axios.get(`${BASE_URL}/settings/license/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Status:', statusRes.status);
    console.log('   Data:', JSON.stringify(statusRes.data, null, 2));
  } catch (err) {
    console.log('❌ Status error:', err.response?.status);
    console.log('   Message:', err.response?.data?.message || err.message);
    console.log('   Details:', JSON.stringify(err.response?.data, null, 2));
  }

  // Step 3: Test all licenses
  console.log('\n📝 Step 3: Testing GET /settings/license/all...\n');
  try {
    const allRes = await axios.get(`${BASE_URL}/settings/license/all?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ All licenses:', allRes.status);
    console.log('   Data:', JSON.stringify(allRes.data, null, 2));
  } catch (err) {
    console.log('❌ All licenses error:', err.response?.status);
    console.log('   Message:', err.response?.data?.message || err.message);
    console.log('   Details:', JSON.stringify(err.response?.data, null, 2));
  }

  // Step 4: Test other endpoints to see if database is connected
  console.log('\n📝 Step 4: Testing other endpoints (database connectivity)...\n');
  
  const endpoints = [
    { name: 'Products', url: '/products' },
    { name: 'Categories', url: '/categories' },
    { name: 'Suppliers', url: '/suppliers' },
    { name: 'Settings', url: '/settings' }
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${endpoint.url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ ${endpoint.name}: ${res.status} - ${JSON.stringify(res.data).substring(0, 100)}...`);
    } catch (err) {
      console.log(`❌ ${endpoint.name}: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   - If all endpoints fail with 500: Backend database connection issue');
  console.log('   - If only license endpoints fail: License controller/model issue');
  console.log('   - Check Vercel environment variables (DATABASE_URL)');
  console.log('   - Check Vercel logs: vercel logs pos-api-zayqa.vercel.app\n');
}

testLicenseAPI();
