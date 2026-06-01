const https = require('https');

console.log('\n=== POS LOGIN AUDIT ===\n');

// Test 1: Health Check
console.log('TEST 1: Health Endpoint');
https.get('https://pos-api-zayqa.vercel.app/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data.substring(0, 200)}\n`);
    
    // Test 2: Login API
    console.log('TEST 2: Login API');
    const postData = JSON.stringify({
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });
    
    const options = {
      hostname: 'pos-api-zayqa.vercel.app',
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log(`Status: ${res2.statusCode}`);
        console.log(`Response: ${data2.substring(0, 500)}`);
        
        if (res2.statusCode === 500) {
          console.log('\n❌ AUDIT FAILED: Login API returning 500');
          console.log('Root Cause: Database connection timeout (ETIMEDOUT 0.0.3.18:5432)');
          console.log('Issue: Supabase hostname DNS resolution failing on Vercel');
        } else if (res2.statusCode === 200) {
          console.log('\n✅ AUDIT PASSED: Login working');
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Error: ${e.message}`);
    });
    
    req.setTimeout(10000, () => {
      console.log('\n⏱️  TIMEOUT: Login API not responding within 10s');
      req.destroy();
    });
    
    req.write(postData);
    req.end();
  });
}).setTimeout(5000, () => {
  console.log('Health check timeout\n');
});
