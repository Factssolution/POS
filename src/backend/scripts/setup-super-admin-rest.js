const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSuperAdminViaREST() {
  console.log('\n=== SETTING UP SUPER ADMIN VIA REST API ===\n');
  
  // Since we can't run ALTER TABLE via REST API, we'll update the user directly
  // The constraint check was the issue - let's verify what roles exist
  
  console.log('1️  Checking current constraint...');
  try {
    // Try to update to Super Admin
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'Super Admin' })
      .eq('email', 'factssolution@gmail.com')
      .select();
    
    if (error) {
      console.log('   ❌ Constraint violation:', error.message);
      console.log('\n💡 SOLUTION: Run this SQL in Supabase SQL Editor:\n');
      console.log('─'.repeat(80));
      console.log(`
-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with Super Admin
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Super Admin'));

-- Update user to Super Admin
UPDATE users SET role = 'Super Admin' WHERE email = 'factssolution@gmail.com';
      `);
      console.log('─'.repeat(80));
    } else {
      console.log('   ✅ Updated successfully');
      console.log(`   Role: ${data[0].role}\n`);
    }
  } catch (err) {
    console.error('   Error:', err.message);
  }
  
  // Verify admin@factssolution.com exists
  console.log('\n2️⃣  Verifying admin@factssolution.com...');
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('email', 'admin@factssolution.com')
    .single();
  
  if (adminUser) {
    console.log('   ✅ User exists');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
  } else {
    console.log('   ❌ User not found - needs to be created');
  }
  
  // Show all users
  console.log('\n3️⃣  Current users...');
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .order('id');
  
  console.log('\n=== ALL USERS ===\n');
  allUsers.forEach(u => {
    console.log(`ID: ${u.id} | ${u.name} | ${u.email}`);
    console.log(`   Role: ${u.role} | Status: ${u.status}`);
    console.log('');
  });
  
  console.log('\n📋 Login Credentials:');
  console.log('   Primary: factssolution@gmail.com / Black@786##');
  console.log('   Admin: admin@factssolution.com / Black@786##');
}

setupSuperAdminViaREST();
