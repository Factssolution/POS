const http = require('http');

console.log('🔵 Testing PostgreSQL Native Backup\n');

// Login first
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

// Create backup
function createBackup(token) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/settings/backups/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    req.write(JSON.stringify({
      compress: true,
      encrypt: false,
      useNativeFormat: true
    }));
    req.end();
  });
}

async function test() {
  console.log('1️⃣  Logging in...');
  const token = await login();
  console.log('   ✅ Login successful\n');

  console.log('2️⃣  Creating PostgreSQL native backup...');
  const result = await createBackup(token);
  
  if (result.status === 200 && result.data.success) {
    console.log('   ✅ Backup created successfully!\n');
    console.log('📋 BACKUP DETAILS:');
    console.log(`   Filename: ${result.data.filename}`);
    console.log(`   Format: ${result.data.format}`);
    console.log(`   Size: ${result.data.size} bytes`);
    console.log(`   Original: ${result.data.originalSize} bytes`);
    console.log(`   Compression: ${result.data.compressionRatio}%`);
    console.log(`   Compressed: ${result.data.compressed}`);
    console.log(`   Encrypted: ${result.data.encrypted}`);
    console.log(`   Filepath: ${result.data.filepath}\n`);
    
    // Check file extension
    if (result.data.filename.includes('.backup')) {
      console.log('✅✅✅ POSTGRESQL NATIVE FORMAT (.backup) - PROFESSIONAL! ✅✅✅\n');
    } else if (result.data.filename.includes('.json')) {
      console.log('⚠️  Still using JSON format - check pg_dump availability\n');
    }
  } else {
    console.log('   ❌ Backup failed');
    console.log(`   Error: ${JSON.stringify(result.data)}\n`);
  }
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
