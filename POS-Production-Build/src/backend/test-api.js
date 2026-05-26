const http = require('http');

const BASE_URL = 'http://localhost:5001';

const endpoints = [
  '/api/v1/health',
  '/api/v1/dashboard/stats',
  '/api/v1/settings',
  '/api/v1/settings/shop-hours',
  '/api/v1/settings/backups/config',
  '/api/v1/settings/backups',
  '/api/v1/suppliers',
  '/api/v1/orders/next-token',
  '/api/v1/products?status=active',
  '/api/v1/categories'
];

console.log('🔍 END-TO-END API AUDIT\n');
console.log(`Base URL: ${BASE_URL}\n`);

let passed = 0;
let failed = 0;

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    http.get(BASE_URL + endpoint, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let status = '✅ PASS';
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          passed++;
        } else if (res.statusCode === 401) {
          status = '⚠️  AUTH';
          passed++; // Auth required is acceptable
        } else {
          status = '❌ FAIL';
          failed++;
        }
        
        console.log(`${status} ${res.statusCode} ${endpoint.padEnd(45)} ${duration}ms`);
        
        // Parse response for validation
        try {
          const json = JSON.parse(data);
          if (json.success === false && res.statusCode === 200) {
            console.log(`   ⚠️  Warning: success=false with 200 status`);
          }
        } catch (e) {
          // Not JSON, that's okay for some endpoints
        }
        
        resolve();
      });
    }).on('error', (e) => {
      const duration = Date.now() - startTime;
      console.log(`❌ FAIL ERROR ${endpoint.padEnd(45)} ${duration}ms`);
      console.log(`   ${e.message}`);
      failed++;
      resolve();
    });
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${endpoints.length} total`);
  console.log('='.repeat(70));
  
  if (failed === 0) {
    console.log('\n✅ ALL ENDPOINTS WORKING CORRECTLY');
  } else {
    console.log(`\n⚠️  ${failed} endpoint(s) need attention`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
