const http = require('http');

console.log('🔍 Testing Supplier Balance API...\n');

// First login
const loginData = JSON.stringify({
  email: 'skyzai2009@gmail.com',
  password: 'admin123'
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
        
        console.log('Supplier Data from API:\n');
        console.log('═'.repeat(80));
        
        supResult.data.forEach(s => {
          console.log(`\n${s.name} (ID: ${s.id})`);
          console.log(`  Opening Balance: Rs ${s.opening_balance?.toLocaleString()}`);
          console.log(`  Total Credit:    Rs ${s.totalCredit?.toLocaleString() || '0'}`);
          console.log(`  Total Debit:     Rs ${s.totalDebit?.toLocaleString() || '0'}`);
          console.log(`  Current Balance: Rs ${s.currentBalance?.toLocaleString() || 'NOT CALCULATED'}`);
          
          // Verify calculation
          const expected = s.opening_balance + (s.totalCredit || 0) - (s.totalDebit || 0);
          const match = Math.abs(expected - (s.currentBalance || 0)) < 0.01;
          console.log(`  ✓ Match: ${match ? '✅ YES' : '❌ NO - Expected: Rs ' + expected}`);
        });
        
        console.log('\n' + '═'.repeat(80));
      });
    });

    supReq.on('error', e => console.error('❌ Error:', e.message));
    supReq.end();
  });
});

loginReq.on('error', e => console.error('❌ Login error:', e.message));
loginReq.write(loginData);
loginReq.end();
