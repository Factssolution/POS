const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('🔍 Checking admin user in Supabase...\n');

  // Check if user exists in auth.users
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Auth Error:', authError.message);
    console.log('\n⚠️  Need service_role key to access admin API');
    return;
  }

  const adminUser = users.users.find(u => u.email === 'admin@possystem.gt.tc');
  
  if (adminUser) {
    console.log('✅ Admin user found in Auth!');
    console.log('   Email:', adminUser.email);
    console.log('   ID:', adminUser.id);
    console.log('   Email Confirmed:', adminUser.email_confirmed_at);
    console.log('   Created:', adminUser.created_at);
  } else {
    console.log('❌ Admin user NOT found in Auth!');
    console.log('\n📝 Total users:', users.users.length);
    users.users.forEach((u, i) => {
      console.log(`   ${i+1}. ${u.email} (ID: ${u.id})`);
    });
  }

  // Check profiles table
  console.log('\n📋 Checking profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'admin@possystem.gt.tc');

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
  } else if (profiles && profiles.length > 0) {
    console.log('✅ Admin profile found!');
    console.log('   Profile:', JSON.stringify(profiles[0], null, 2));
  } else {
    console.log('❌ Admin profile NOT found!');
  }
}

checkAdminUser().catch(console.error);
