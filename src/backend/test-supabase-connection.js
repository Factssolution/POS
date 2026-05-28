const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('🧪 Testing Supabase pooler connection with SNI...\n');

  // Test 1: Pooler with servername in dialectOptions
  console.log('Test 1: Pooler connection with servername');
  try {
    const sequelize1 = new Sequelize('postgres', 'postgres', '50Ny5lHTWCX98YiW', {
      host: 'aws-1-ap-south-1.pooler.supabase.com',
      port: 6543,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        servername: 'aws-1-ap-south-1.pooler.supabase.com'
      }
    });
    await sequelize1.authenticate();
    console.log('✅ Test 1 PASSED - Pooler with servername works!\n');
    process.exit(0);
  } catch (err) {
    console.log('❌ Test 1 FAILED:', err.message, '\n');
  }

  // Test 2: Try with pg library directly
  console.log('Test 2: Direct pg connection');
  try {
    const { Client } = require('pg');
    const client = new Client({
      host: 'aws-1-ap-south-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: '50Ny5lHTWCX98YiW',
      ssl: {
        rejectUnauthorized: false,
        servername: 'aws-1-ap-south-1.pooler.supabase.com'
      }
    });
    await client.connect();
    console.log('✅ Test 2 PASSED - Direct pg connection works!\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log('❌ Test 2 FAILED:', err.message, '\n');
  }

  // Test 3: Try DB_URL with connection parameters
  console.log('Test 3: DB_URL with sslmode');
  try {
    const sequelize3 = new Sequelize('postgresql://postgres:50Ny5lHTWCX98YiW@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require', {
      dialect: 'postgres',
      dialectOptions: {
        servername: 'aws-1-ap-south-1.pooler.supabase.com'
      }
    });
    await sequelize3.authenticate();
    console.log('✅ Test 3 PASSED - DB_URL works!\n');
    process.exit(0);
  } catch (err) {
    console.log('❌ Test 3 FAILED:', err.message, '\n');
  }

  console.log('❌ All tests failed');
  process.exit(1);
}

testConnection();
