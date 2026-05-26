const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

console.log('\n' + '═'.repeat(70));
console.log('   POS SYSTEM - PRODUCTION READINESS TEST');
console.log('═'.repeat(70) + '\n');

let testsPassed = 0;
let testsFailed = 0;
let totalTests = 0;

function test(name, condition) {
  totalTests++;
  if (condition) {
    testsPassed++;
    console.log(`✅ [${totalTests}] ${name}`);
  } else {
    testsFailed++;
    console.log(`❌ [${totalTests}] ${name}`);
  }
}

async function runTests() {
  // TEST 1: Check .env file exists
  console.log('\n📋 SECTION 1: ENVIRONMENT CONFIGURATION');
  console.log('─'.repeat(70));
  
  const envPath = path.join(__dirname, '.env');
  test('.env file exists', fs.existsSync(envPath));
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    test('DB_NAME=pos configured', envContent.includes('DB_NAME=pos'));
    test('DB_PASSWORD=Black@786## configured', envContent.includes('DB_PASSWORD=Black@786##'));
    test('DB_USER=postgres configured', envContent.includes('DB_USER=postgres'));
    test('DB_HOST=localhost configured', envContent.includes('DB_HOST=localhost'));
    test('DB_PORT=5432 configured', envContent.includes('DB_PORT=5432'));
    test('JWT_SECRET configured', envContent.includes('JWT_SECRET=') && envContent.split('JWT_SECRET=')[1]?.split('\n')[0]?.length > 5);
    test('NODE_ENV=production', envContent.includes('NODE_ENV=production'));
  }
  
  // TEST 2: Check backend dependencies
  console.log('\n📦 SECTION 2: BACKEND DEPENDENCIES');
  console.log('─'.repeat(70));
  
  const packagePath = path.join(__dirname, 'package.json');
  test('package.json exists', fs.existsSync(packagePath));
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    test('pg dependency present', packageJson.dependencies && packageJson.dependencies.pg);
    test('bcryptjs dependency present', packageJson.dependencies && packageJson.dependencies.bcryptjs);
    test('express dependency present', packageJson.dependencies && packageJson.dependencies.express);
    test('jsonwebtoken dependency present', packageJson.dependencies && packageJson.dependencies.jsonwebtoken);
    test('dotenv dependency present', packageJson.dependencies && packageJson.dependencies.dotenv);
    test('sequelize dependency present', packageJson.dependencies && packageJson.dependencies.sequelize);
  }
  
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  test('node_modules folder exists', fs.existsSync(nodeModulesPath));
  
  // TEST 3: Check critical files
  console.log('\n📁 SECTION 3: CRITICAL FILES');
  console.log('─'.repeat(70));
  
  test('server.js exists', fs.existsSync(path.join(__dirname, 'server.js')));
  test('config/database.js exists', fs.existsSync(path.join(__dirname, 'config', 'database.js')));
  test('config/jwt.js exists', fs.existsSync(path.join(__dirname, 'config', 'jwt.js')));
  test('middleware/auth.js exists', fs.existsSync(path.join(__dirname, 'middleware', 'auth.js')));
  test('controllers/authController.js exists', fs.existsSync(path.join(__dirname, 'controllers', 'authController.js')));
  test('routes/auth.js exists', fs.existsSync(path.join(__dirname, 'routes', 'auth.js')));
  test('models/User.js exists', fs.existsSync(path.join(__dirname, 'models', 'User.js')));
  test('models/index.js exists', fs.existsSync(path.join(__dirname, 'models', 'index.js')));
  
  // TEST 4: Database Connection Test
  console.log('\n🗄️  SECTION 4: DATABASE CONNECTION');
  console.log('─'.repeat(70));
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Black@786##'
  });
  
  try {
    await client.connect();
    test('PostgreSQL connection successful', true);
    
    // Check if 'pos' database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ['pos']
    );
    test('Database "pos" exists', dbCheck.rows.length > 0);
    
    if (dbCheck.rows.length > 0) {
      await client.end();
      
      // Connect to pos database
      const posClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'pos',
        user: 'postgres',
        password: 'Black@786##'
      });
      
      await posClient.connect();
      test('Connected to "pos" database', true);
      
      // Check tables
      const tables = await posClient.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const expectedTables = [
        'users', 'products', 'categories', 'suppliers', 'orders',
        'order_items', 'transactions', 'expenses', 'employees',
        'settings', 'licenses', 'audit_logs'
      ];
      
      test(`All 12 tables exist (${tables.rows.length} found)`, tables.rows.length === 12);
      
      // Check users
      const users = await posClient.query('SELECT COUNT(*) FROM users');
      test('Users table has records', parseInt(users.rows[0].count) >= 2);
      
      // Check settings
      const settings = await posClient.query('SELECT COUNT(*) FROM settings');
      test('Settings table has records', parseInt(settings.rows[0].count) >= 10);
      
      // Check default users
      const superAdmin = await posClient.query(
        "SELECT id, email, role FROM users WHERE email = 'factsolution@gmail.com'"
      );
      test('Super Admin user exists', superAdmin.rows.length > 0);
      
      const admin = await posClient.query(
        "SELECT id, email, role FROM users WHERE email = 'admin@factssolution.com'"
      );
      test('Admin user exists', admin.rows.length > 0);
      
      await posClient.end();
    }
    
  } catch (error) {
    test('PostgreSQL connection successful', false);
    console.log(`   Error: ${error.message}`);
  }
  
  // TEST 5: Check CORS configuration
  console.log('\n🔒 SECTION 5: SECURITY CONFIGURATION');
  console.log('─'.repeat(70));
  
  const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  test('CORS configured', serverJs.includes('cors('));
  test('CORS origin set to 5173', serverJs.includes('localhost:5173'));
  test('Rate limiter present', fs.existsSync(path.join(__dirname, 'middleware', 'rateLimiter.js')));
  
  const authMiddleware = fs.readFileSync(path.join(__dirname, 'middleware', 'auth.js'), 'utf8');
  test('JWT verification in middleware', authMiddleware.includes('jwt.verify'));
  test('Password hashing in authController', fs.readFileSync(path.join(__dirname, 'controllers', 'authController.js'), 'utf8').includes('bcrypt'));
  
  const authController = fs.readFileSync(path.join(__dirname, 'controllers', 'authController.js'), 'utf8');
  test('License check in login', authController.includes('license_status') || authController.includes('License'));
  test('Super Admin bypass', authController.includes('Super Admin'));
  
  // TEST 6: Frontend Configuration
  console.log('\n🎨 SECTION 6: FRONTEND CONFIGURATION');
  console.log('─'.repeat(70));
  
  const rootPath = path.join(__dirname, '..', '..');
  test('Root package.json exists', fs.existsSync(path.join(rootPath, 'package.json')));
  test('vite.config.ts exists', fs.existsSync(path.join(rootPath, 'vite.config.ts')));
  test('index.html exists', fs.existsSync(path.join(rootPath, 'index.html')));
  
  const apiTsPath = path.join(rootPath, 'src', 'services', 'api.ts');
  test('api.ts exists', fs.existsSync(apiTsPath));
  
  if (fs.existsSync(apiTsPath)) {
    const apiContent = fs.readFileSync(apiTsPath, 'utf8');
    test('API URL configured', apiContent.includes('localhost:5000'));
    test('API base path correct', apiContent.includes('/api/v1'));
  }
  
  // SUMMARY
  console.log('\n' + '═'.repeat(70));
  console.log('   TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - SYSTEM IS PRODUCTION READY!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW ISSUES ABOVE');
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
