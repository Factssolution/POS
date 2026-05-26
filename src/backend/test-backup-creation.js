// Test backup creation via API
const http = require('http');

console.log('🔵 Testing backup creation...\n');

// First, login to get token
const loginData = JSON.stringify({
  email: 'skyzai2009@gmail.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Login Status: ${res.statusCode}`);
    
    try {
      const loginResult = JSON.parse(data);
      
      if (!loginResult.success) {
        console.log('❌ Login failed:', loginResult.message);
        return;
      }
      
      const token = loginResult.token;
      console.log('✅ Login successful! Token received.\n');
      
      // Now create backup
      console.log('🔵 Creating backup...\n');
      
      const backupData = JSON.stringify({
        backupPath: 'd:\\POS Business Dashboard ZAYQA\\src\\backups'
      });
      
      const backupOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/settings/backups/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(backupData)
        }
      };
      
      const backupReq = http.request(backupOptions, (res2) => {
        let backupResponse = '';
        
        res2.on('data', (chunk) => {
          backupResponse += chunk;
        });
        
        res2.on('end', () => {
          console.log(`📊 Backup Status: ${res2.statusCode}`);
          
          try {
            const backupResult = JSON.parse(backupResponse);
            console.log('📝 Response:', JSON.stringify(backupResult, null, 2));
            
            if (backupResult.success) {
              console.log('\n✅ BACKUP CREATED SUCCESSFULLY!');
              console.log(`📁 Filename: ${backupResult.filename}`);
              console.log(`📦 Size: ${backupResult.size ? (backupResult.size / 1024).toFixed(2) + ' KB' : 'Unknown'}`);
              console.log(`💾 Method: ${backupResult.method || 'Native PostgreSQL'}`);
            } else {
              console.log('\n❌ Backup failed:', backupResult.message);
            }
          } catch (e) {
            console.log('📝 Raw response:', backupResponse);
          }
        });
      });
      
      backupReq.on('error', (e) => {
        console.error(`\n❌ Backup request failed: ${e.message}`);
      });
      
      backupReq.end();
      
    } catch (e) {
      console.log('📝 Raw response:', data);
    }
  });
});

loginReq.on('error', (e) => {
  console.error(`\n❌ Login request failed: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();
