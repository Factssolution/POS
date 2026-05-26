const http = require('http');

// Get auth token from command line or use test
const TOKEN = process.argv[2] || '';

console.log('\n🔍 SUPER ADMIN DASHBOARD DIAGNOSTIC\n');
console.log('═'.repeat(80));

if (!TOKEN) {
  console.log('⚠️  WARNING: No auth token provided!');
  console.log('Usage: node diagnose-super-admin.js YOUR_AUTH_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open browser console (F12)');
  console.log('2. Type: localStorage.getItem("pos_auth_token")');
  console.log('3. Copy the token and run: node diagnose-super-admin.js TOKEN_HERE\n');
}

// Test 1: License Status
console.log('\n📋 TEST 1: GET /api/v1/settings/license/status');
console.log('─'.repeat(80));

const options1 = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/settings/license/status',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
  }
};

const req1 = http.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Response Body:', data);
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.success) {
        console.log('\n✅ License Status Data:');
        console.log('  - is_trial:', parsed.data.is_trial);
        console.log('  - license_status:', parsed.data.license_status);
        console.log('  - license_key:', parsed.data.license_key);
        console.log('  - days_remaining:', parsed.data.days_remaining);
        console.log('  - is_expired:', parsed.data.is_expired);
      }
    } catch (e) {}
    
    // Test 2: Get All Licenses
    console.log('\n\n📋 TEST 2: GET /api/v1/settings/license/all?page=1&limit=20');
    console.log('─'.repeat(80));
    
    const options2 = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/settings/license/all?page=1&limit=20',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      }
    };
    
    const req2 = http.request(options2, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        console.log('Status Code:', res2.statusCode);
        console.log('Response Body:', data2.substring(0, 500));
        
        try {
          const parsed = JSON.parse(data2);
          if (parsed.success) {
            console.log('\n✅ Licenses Data:');
            console.log('  - Total licenses:', parsed.pagination?.totalItems || 0);
            console.log('  - Returned:', parsed.data?.length || 0);
            console.log('  - Pagination:', JSON.stringify(parsed.pagination, null, 2));
            
            if (parsed.data && parsed.data.length > 0) {
              console.log('\n📋 License Records:');
              parsed.data.forEach((lic, i) => {
                console.log(`\n  License #${i + 1}:`);
                console.log(`    Key: ${lic.license_key}`);
                console.log(`    Client: ${lic.client_email}`);
                console.log(`    Status: ${lic.status}`);
                console.log(`    Plan: ${lic.plan_type}`);
                console.log(`    Price: Rs ${lic.price}`);
                console.log(`    Expiry: ${lic.expiry_date}`);
              });
            } else {
              console.log('\n⚠️  WARNING: No licenses found in database!');
              console.log('   This is why Super Admin Dashboard shows "0 licenses"');
            }
          }
        } catch (e) {}
        
        console.log('\n' + '═'.repeat(80));
        console.log('✅ DIAGNOSTIC COMPLETE');
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
