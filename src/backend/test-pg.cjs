const { Client } = require('pg');
async function test() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.hfusrtiqjyiotjewzzkt',
    password: 'Black@786##',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('✅ Connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}
test();
