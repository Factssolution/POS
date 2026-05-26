const http = require('http');

console.log('📋 Testing Backup List API\n');

function login() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.data.token);
      });
    });
    req.write(JSON.stringify({ email: 'admin@factssolution.com', password: 'admin123' }));
    req.end();
  });
}

function getBackupList(token) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/settings/backups',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    req.end();
  });
}

async function test() {
  console.log('1️⃣  Logging in...');
  const token = await login();
  console.log('   ✅ Login successful\n');

  console.log('2️⃣  Fetching backup list...');
  const result = await getBackupList(token);
  
  if (result.status === 200 && result.data.success) {
    console.log('   ✅ Backup list retrieved!\n');
    console.log('📋 BACKUP FILES:');
    console.log(`   Total: ${result.data.totalBackups} backup(s)\n`);
    
    if (result.data.backups.length === 0) {
      console.log('   ❌ NO BACKUPS FOUND - This is a BUG!\n');
    } else {
      result.data.backups.forEach((backup, i) => {
        const sizeKB = Math.round(backup.size / 1024 * 100) / 100;
        console.log(`   ${i + 1}. ${backup.filename}`);
        console.log(`      Size: ${sizeKB} KB (${backup.size} bytes)`);
        console.log(`      Created: ${new Date(backup.createdAt).toLocaleString()}\n`);
      });
      
      console.log('✅✅✅ BACKUP LIST WORKING CORRECTLY ✅✅✅\n');
    }
  } else {
    console.log('   ❌ Failed to get backup list');
    console.log(`   Error: ${JSON.stringify(result.data)}\n`);
  }
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
