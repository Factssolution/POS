const http = require('http');

console.log('\n🔍 TESTING LICENSE API ENDPOINTS\n');
console.log('═'.repeat(80));

// Test 1: License Status
console.log('\n📋 TEST 1: GET /api/v1/settings/license/status');
console.log('─'.repeat(80));

const options1 = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/settings/license/status',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req1 = http.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data.substring(0, 200));
    
    // Test 2: Get All Licenses
    console.log('\n\n📋 TEST 2: GET /api/v1/settings/license/all');
    console.log('─'.repeat(80));
    
    const options2 = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/settings/license/all?page=1&limit=20',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req2 = http.request(options2, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        console.log('Status Code:', res2.statusCode);
        console.log('Response:', data2.substring(0, 300));
        console.log('\n' + '═'.repeat(80));
        console.log('✅ API TESTS COMPLETE');
        console.log('═'.repeat(80) + '\n');
      });
    });
    
    req2.on('error', (e) => {
      console.error('❌ Request 2 Error:', e.message);
    });
    
    req2.end();
  });
});

req1.on('error', (e) => {
  console.error('❌ Request 1 Error:', e.message);
});

req1.end();
