const http = require('http');

console.log('🔍 Testing Supplier API Date Serialization...\n');

// Login first
const loginData = JSON.stringify({
  email: 'factssolution@gmail.com',
  password: 'Black@786##'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const loginResult = JSON.parse(data);
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }

    const token = loginResult.token;
    console.log('✅ Login successful\n');

    // Get suppliers
    const supReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/suppliers',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let supData = '';
      res2.on('data', chunk => supData += chunk);
      res2.on('end', () => {
        const supResult = JSON.parse(supData);
        
        console.log('📊 Raw API Response:');
        console.log(JSON.stringify(supResult, null, 2));
        console.log('');
        
        if (!supResult.success) {
          console.log('❌ API Error:', supResult.message);
          return;
        }
        
        console.log('📊 API Response Analysis:');
        console.log('═'.repeat(100));
        console.log(`Success: ${supResult.success}`);
        console.log(`Total Suppliers: ${supResult.data.length}\n`);
        
        supResult.data.forEach((s, i) => {
          console.log(`Supplier ${i + 1} (ID: ${s.id}): ${s.name}`);
          console.log(`  created_at: ${s.created_at}`);
          console.log(`  created_at (type): ${typeof s.created_at}`);
          console.log(`  created_at (is ISO string): ${typeof s.created_at === 'string' && s.created_at.includes('T')}`);
          console.log(`  updated_at: ${s.updated_at}`);
          
          if (s.created_at) {
            const date = new Date(s.created_at);
            console.log(`  JS Date valid: ${!isNaN(date.getTime())}`);
            console.log(`  Formatted: ${date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}`);
          }
          console.log('');
        });
        
        console.log('═'.repeat(100));
        console.log('\n✅ Test complete!\n');
      });
    });

    supReq.on('error', e => console.error('❌ Error:', e.message));
    supReq.end();
  });
});

loginReq.on('error', e => console.error('❌ Login error:', e.message));
loginReq.write(loginData);
loginReq.end();
