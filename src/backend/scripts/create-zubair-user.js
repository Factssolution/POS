const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createZubairUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'pos'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const email = 'zubair@pos.com';
    const password = 'zubair123';
    const name = 'Zubair';
    const role = 'Admin';

    console.log('Creating user:');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Role: ${role}\n`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Insert user
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, status) 
       VALUES ($1, $2, $3, $4, 'active') 
       ON CONFLICT (email) DO UPDATE 
       SET name = $1, password = $3, role = $4, status = 'active'
       RETURNING id, name, email, role, status`,
      [name, email, hashedPassword, role]
    );

    console.log('\n✅ User created/updated successfully:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Name: ${result.rows[0].name}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Role: ${result.rows[0].role}`);
    console.log(`Status: ${result.rows[0].status}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createZubairUser();
