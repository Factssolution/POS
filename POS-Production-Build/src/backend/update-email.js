const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function updateEmail() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔄 Updating Super Admin email...\n');

    await client.query(`
      UPDATE users 
      SET email = 'factssolution@gmail.com' 
      WHERE email = 'factsolution@gmail.com'
    `);

    console.log('✅ Email updated successfully!');
    console.log('\nNew credentials:');
    console.log('   Email: factssolution@gmail.com');
    console.log('   Password: Black@786##');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateEmail();
