// Temporary script to test rate limiter reset
const http = require('http');

console.log('🔵 Testing backup list endpoint...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/settings/backups',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    console.log(`📝 Response: ${data}`);
    
    if (res.statusCode === 429) {
      console.log('\n❌ Rate limit is still active!');
      console.log('⏳ You need to wait for the rate limit window to expire (15 minutes from first request)');
      console.log('\n💡 SOLUTION: Run this command as Administrator to restart backend:');
      console.log('   1. Right-click PowerShell → Run as Administrator');
      console.log('   2. Run: taskkill /F /IM node.exe');
      console.log('   3. Run: cd "d:\\POS Business Dashboard ZAYQA\\src\\backend"');
      console.log('   4. Run: node server.js');
    } else if (res.statusCode === 401) {
      console.log('\n✅ Rate limiter is working! (401 = auth required, not rate limited)');
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Request failed: ${e.message}`);
});

req.end();
