const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('\n=== CURRENT USERS IN DATABASE ===\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, tenant_id')
    .order('id');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Total Users: ${users.length}\n`);
  
  users.forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`  Name: ${u.name}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  Tenant ID: ${u.tenant_id || 'NULL'}`);
    console.log('');
  });
  
  // Check for specific users
  console.log('\n=== CHECKING SPECIFIC USERS ===\n');
  
  const testUsers = [
    'factssolution@gmail.com',
    'admin@factssolution.com'
  ];
  
  for (const email of testUsers) {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userErr || !user) {
      console.log(`❌ ${email} - NOT FOUND`);
    } else {
      console.log(`✅ ${email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Hash: ${user.password ? 'EXISTS' : 'MISSING'}`);
    }
    console.log('');
  }
}

checkUsers();
