const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSuperAdmin() {
  console.log('\n=== SETTING UP SUPER ADMIN & MULTI-TENANT USER ===\n');
  
  const password = 'Black@786##';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 1. Update factssolution@gmail.com to Super Admin
  console.log('1️⃣  Updating factssolution@gmail.com to Super Admin...');
  const { data: updatedUser, error: updateErr } = await supabase
    .from('users')
    .update({ role: 'Super Admin' })
    .eq('email', 'factssolution@gmail.com')
    .select()
    .single();
  
  if (updateErr) {
    console.error('   ❌ Error:', updateErr.message);
  } else {
    console.log('   ✅ Updated successfully');
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
  }
  
  // 2. Check if admin@factssolution.com exists
  console.log('\n2️⃣  Checking admin@factssolution.com...');
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'admin@factssolution.com')
    .single();
  
  if (existingUser) {
    console.log('   ⚠️  User already exists, updating password and role...');
    const { error: updErr } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        role: 'Admin',
        status: 'active'
      })
      .eq('email', 'admin@factssolution.com');
    
    if (updErr) {
      console.error('   ❌ Error updating:', updErr.message);
    } else {
      console.log('   ✅ Updated successfully');
    }
  } else {
    console.log('   User not found, creating new...');
    const { data: newUser, error: createErr } = await supabase
      .from('users')
      .insert({
        name: 'Admin User',
        email: 'admin@factssolution.com',
        password: hashedPassword,
        role: 'Admin',
        status: 'active',
        tenant_id: 1,
        phone: '0310-2479203'
      })
      .select()
      .single();
    
    if (createErr) {
      console.error('   ❌ Error creating:', createErr.message);
    } else {
      console.log('   ✅ Created successfully');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
    }
  }
  
  // 3. Verify both users
  console.log('\n3️⃣  Verifying users...');
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .order('id');
  
  console.log('\n=== FINAL USER LIST ===\n');
  allUsers.forEach(u => {
    console.log(`ID: ${u.id} | ${u.name} | ${u.email}`);
    console.log(`   Role: ${u.role} | Status: ${u.status}`);
    console.log('');
  });
  
  console.log('\n✅ SETUP COMPLETE!\n');
  console.log('📋 Login Credentials:');
  console.log('   Super Admin: factssolution@gmail.com / Black@786##');
  console.log('   Admin: admin@factssolution.com / Black@786##');
  console.log('\n🎯 Super Admin can now:');
  console.log('   - Create licenses');
  console.log('   - Manage multi-tenant users');
  console.log('   - Access all system settings');
}

setupSuperAdmin();
