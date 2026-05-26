const { Client } = require('pg');

async function listUsers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    const result = await client.query('SELECT id, name, email, role, status FROM users ORDER BY id');
    
    console.log('\n✅ All Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    result.rows.forEach(u => {
      console.log(`${u.id}. ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role} | Status: ${u.status}`);
      console.log('');
    });
    console.log(`Total: ${result.rows.length} users`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listUsers();
