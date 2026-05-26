const { Client } = require('pg');

async function verifyUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, email, name, role, status FROM users WHERE email = $1',
      ['zubair@pos.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User found in database:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ User NOT found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyUser();
