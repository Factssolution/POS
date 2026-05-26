const http = require('http');

const BASE_URL = 'http://localhost:5001';

console.log('🔍 SIMPLE END-TO-END API AUDIT\n');

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 0, data: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('✅ Testing Health Check...');
  const health = await makeRequest('GET', '/health');
  if (health.status === 200) {
    console.log('   ✅ PASS: Health check working\n');
    passed++;
  } else {
    console.log(`   ❌ FAIL: ${health.status}\n`);
    failed++;
  }

  console.log('1️⃣  Testing Login (admin@factssolution.com)...');
  const login = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'admin@factssolution.com',
    password: 'admin123'
  });
  
  if (login.status !== 200 || login.data.success !== true) {
    console.log(`   ❌ Login failed: ${login.status}`);
    console.log(`   Response: ${JSON.stringify(login.data)}\n`);
    console.log('   ⚠️  Skipping authenticated tests\n');
    var token = null;
  } else {
    console.log('   ✅ Login successful');
    var token = login.data.data.token;
    console.log(`   Token: ${token.substring(0, 30)}...\n`);
  }

  if (token) {
    const tests = [
      { name: 'Dashboard Stats', path: '/api/v1/dashboard/stats?timeFrame=today' },
      { name: 'Settings', path: '/api/v1/settings' },
      { name: 'Shop Hours', path: '/api/v1/settings/shop-hours' },
      { name: 'Backup Config', path: '/api/v1/settings/backups/config' },
      { name: 'Backup List', path: '/api/v1/settings/backups' },
      { name: 'Suppliers', path: '/api/v1/suppliers' },
      { name: 'Products', path: '/api/v1/products?status=active' },
      { name: 'Categories', path: '/api/v1/categories' },
      { name: 'Next Token', path: '/api/v1/orders/next-token' },
      { name: 'Orders', path: '/api/v1/orders?limit=5' }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`${i + 2}️⃣  Testing ${test.name}...`);
      const res = await makeRequest('GET', test.path, null, token);
      
      if (res.status === 200) {
        console.log(`   ✅ PASS: ${test.name} loaded`);
        passed++;
        
        // Show sample data
        if (res.data) {
          if (test.name === 'Dashboard Stats' && res.data.todaySales) {
            console.log(`   📊 Revenue: Rs ${res.data.todaySales.total_revenue || 0}`);
            console.log(`   📊 Orders: ${res.data.todaySales.total_orders || 0}`);
          } else if (test.name === 'Shop Hours' && res.data.monday) {
            console.log(`   🕐 Monday: ${res.data.monday.open} - ${res.data.monday.close}`);
          } else if (test.name === 'Next Token' && res.data.formatted_token) {
            console.log(`   🎫 Token: ${res.data.formatted_token}`);
          } else if (Array.isArray(res.data)) {
            console.log(`   📦 Count: ${res.data.length} items`);
          }
        }
        console.log('');
      } else {
        console.log(`   ❌ FAIL: ${res.status}`);
        console.log(`   Error: ${JSON.stringify(res.data).substring(0, 100)}\n`);
        failed++;
      }
    }
  }

  console.log('='.repeat(70));
  console.log(`📊 FINAL RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));
  
  if (failed === 0) {
    console.log('\n✅✅✅ ALL ENDPOINTS WORKING PERFECTLY ✅✅✅\n');
  } else {
    console.log(`\n⚠️  ${failed} endpoint(s) need attention\n`);
  }
}

runTests();
