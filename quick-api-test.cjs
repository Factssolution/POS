/**
 * Quick Backend API Test (No Auth Required)
 * Tests if the backend server is responding at all
 */

const https = require('https');

const tests = [
  { name: 'Auth endpoint', path: '/api/v1/auth/login', method: 'POST' },
  { name: 'License status (public)', path: '/api/v1/settings/license/status', method: 'GET' },
  { name: 'Products', path: '/api/v1/products', method: 'GET' }
];

console.log('🔍 Testing Backend API Connectivity\n');
console.log('='.repeat(60));

tests.forEach((test, index) => {
  console.log(`\n[${index + 1}/${tests.length}] Testing ${test.name}...`);
  console.log(`   ${test.method} https://pos-api-zayqa.vercel.app${test.path}`);
  
  const options = {
    hostname: 'pos-api-zayqa.vercel.app',
    port: 443,
    path: test.path,
    method: test.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
      
      if (res.statusCode === 500) {
        console.log('   ❌ Backend returning 500 - Database connection issue');
        console.log('   💡 Check Vercel environment variables:');
        console.log('      - DATABASE_URL');
        console.log('      - DB_HOST, DB_USER, DB_PASSWORD');
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('   ⚠️  Auth required - Backend is working');
      } else if (res.statusCode === 200) {
        console.log('   ✅ Backend responding correctly');
      }
    });
  });

  req.on('error', (err) => {
    console.log(`   ❌ Error: ${err.message}`);
  });

  if (test.method === 'POST') {
    req.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
  }
  
  req.end();
});

setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Next Steps:');
  console.log('   1. Check Vercel logs: vercel logs pos-api-zayqa.vercel.app');
  console.log('   2. Verify environment variables in Vercel Dashboard');
  console.log('   3. Redeploy backend: cd src/backend && vercel --prod');
  console.log();
}, 2000);
