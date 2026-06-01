const { Client } = require('pg');
require('dotenv').config();

// Supabase connection pooler
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hfusrtiqjyiotjewzzkt',
  password: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
});

async function fixRoleConstraint() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // 1. Drop old constraint
    console.log('1️⃣  Dropping old role constraint...');
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    console.log('   ✅ Done\n');
    
    // 2. Add new constraint with Super Admin
    console.log('2️⃣  Adding new role constraint with Super Admin...');
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Super Admin'));
    `);
    console.log('   ✅ Done\n');
    
    // 3. Update factssolution@gmail.com to Super Admin
    console.log('3️⃣  Updating factssolution@gmail.com to Super Admin...');
    const { rows } = await client.query(`
      UPDATE users 
      SET role = 'Super Admin' 
      WHERE email = 'factssolution@gmail.com'
      RETURNING id, name, email, role;
    `);
    
    if (rows.length > 0) {
      console.log('   ✅ Updated successfully');
      console.log(`   Name: ${rows[0].name}`);
      console.log(`   Email: ${rows[0].email}`);
      console.log(`   Role: ${rows[0].role}\n`);
    }
    
    // 4. Verify all users
    console.log('4️⃣  Final verification...');
    const { rows: allUsers } = await client.query(`
      SELECT id, name, email, role, status 
      FROM users 
      ORDER BY id;
    `);
    
    console.log('\n=== ALL USERS ===\n');
    allUsers.forEach(u => {
      console.log(`ID: ${u.id} | ${u.name} | ${u.email}`);
      console.log(`   Role: ${u.role} | Status: ${u.status}`);
      console.log('');
    });
    
    console.log('✅ SETUP COMPLETE!\n');
    console.log('📋 Login Credentials:');
    console.log('   Super Admin: factssolution@gmail.com / Black@786##');
    console.log('   Admin: admin@factssolution.com / Black@786##');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRoleConstraint();
