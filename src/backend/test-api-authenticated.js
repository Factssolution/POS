const http = require('http');

const BASE_URL = 'http://localhost:5001';

// Test credentials (from database)
const testUser = {
  email: 'admin@pos.com',
  password: 'Admin@123'
};

console.log('🔍 AUTHENTICATED API END-TO-END AUDIT\n');

async function apiCall(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Login
  console.log('1️⃣  Testing Login...');
  const loginRes = await apiCall('POST', '/api/v1/auth/login', testUser);
  if (loginRes.status === 200 && loginRes.data.token) {
    console.log('   ✅ Login successful');
    const token = loginRes.data.token;
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // Test 2: Dashboard Stats
    console.log('2️⃣  Testing Dashboard Stats...');
    const dashboardRes = await apiCall('GET', '/api/v1/dashboard/stats', null, token);
    if (dashboardRes.status === 200) {
      console.log('   ✅ Dashboard stats loaded');
      console.log(`   Revenue: Rs ${dashboardRes.data?.todaySales?.total_revenue || 0}`);
      console.log(`   Orders: ${dashboardRes.data?.todaySales?.total_orders || 0}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${dashboardRes.status}`);
      failed++;
    }

    // Test 3: Settings
    console.log('3️⃣  Testing Settings...');
    const settingsRes = await apiCall('GET', '/api/v1/settings', null, token);
    if (settingsRes.status === 200 && settingsRes.data) {
      console.log('   ✅ Settings loaded');
      console.log(`   Settings count: ${Object.keys(settingsRes.data).length}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${settingsRes.status}`);
      failed++;
    }

    // Test 4: Shop Hours
    console.log('4️⃣  Testing Shop Hours...');
    const shopHoursRes = await apiCall('GET', '/api/v1/settings/shop-hours', null, token);
    if (shopHoursRes.status === 200 && shopHoursRes.data) {
      console.log('   ✅ Shop hours loaded');
      console.log(`   Monday: ${shopHoursRes.data.monday?.open || 'N/A'} - ${shopHoursRes.data.monday?.close || 'N/A'}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${shopHoursRes.status}`);
      failed++;
    }

    // Test 5: Suppliers
    console.log('5️⃣  Testing Suppliers...');
    const suppliersRes = await apiCall('GET', '/api/v1/suppliers', null, token);
    if (suppliersRes.status === 200 && suppliersRes.data) {
      console.log('   ✅ Suppliers loaded');
      console.log(`   Count: ${suppliersRes.data.length || 0}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${suppliersRes.status}`);
      failed++;
    }

    // Test 6: Products
    console.log('6️⃣  Testing Products...');
    const productsRes = await apiCall('GET', '/api/v1/products?status=active', null, token);
    if (productsRes.status === 200 && productsRes.data) {
      console.log('   ✅ Products loaded');
      console.log(`   Active products: ${productsRes.data.length || 0}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${productsRes.status}`);
      failed++;
    }

    // Test 7: Categories
    console.log('7️⃣  Testing Categories...');
    const categoriesRes = await apiCall('GET', '/api/v1/categories', null, token);
    if (categoriesRes.status === 200 && categoriesRes.data) {
      console.log('   ✅ Categories loaded');
      console.log(`   Count: ${categoriesRes.data.length || 0}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${categoriesRes.status}`);
      failed++;
    }

    // Test 8: Next Token
    console.log('8️⃣  Testing Next Token...');
    const tokenRes = await apiCall('GET', '/api/v1/orders/next-token', null, token);
    if (tokenRes.status === 200 && tokenRes.data) {
      console.log('   ✅ Next token generated');
      console.log(`   Token: ${tokenRes.data.formatted_token || 'N/A'}`);
      console.log(`   Business Day: ${tokenRes.data.business_day || 'N/A'}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${tokenRes.status}`);
      console.log(`   Error: ${JSON.stringify(tokenRes.data)}\n`);
      failed++;
    }

    // Test 9: Backup Config
    console.log('9️⃣  Testing Backup Config...');
    const backupConfigRes = await apiCall('GET', '/api/v1/settings/backups/config', null, token);
    if (backupConfigRes.status === 200) {
      console.log('   ✅ Backup config loaded\n');
      passed++;
    } else {
      console.log(`   ❌ Failed: ${backupConfigRes.status}`);
      failed++;
    }

    // Test 10: Backup List
    console.log('🔟  Testing Backup List...');
    const backupListRes = await apiCall('GET', '/api/v1/settings/backups', null, token);
    if (backupListRes.status === 200 && backupListRes.data) {
      console.log('   ✅ Backup list loaded');
      console.log(`   Backups: ${backupListRes.data.length || 0}\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed: ${backupListRes.status}`);
      failed++;
    }

    // Summary
    console.log('='.repeat(70));
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(70));
    
    if (failed === 0) {
      console.log('\n✅ ALL AUTHENTICATED ENDPOINTS WORKING PERFECTLY');
    } else {
      console.log(`\n⚠️  ${failed} endpoint(s) need attention`);
    }

  } else {
    console.log(`   ❌ Login failed: ${loginRes.status}`);
    console.log(`   Error: ${JSON.stringify(loginRes.data)}`);
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
