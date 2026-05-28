const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
// You need service_role key from Supabase Dashboard → Settings → API
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUsersTable() {
  console.log('🔧 Creating users table...\n');

  // Create users table via SQL
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'cashier',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Insert admin user
      INSERT INTO users (email, name, role, status, password_hash)
      VALUES (
        'admin@possystem.gt.tc',
        'System Admin',
        'admin',
        'active',
        '$2b$10$7IH9cut4P7oAmWcEkFIxeeFIaJ.KAjKFJEbzQq4K8QpotLAGiKl12'
      )
      ON CONFLICT (email) DO NOTHING;
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please use Supabase Dashboard instead:');
    console.log('1. Go to Table Editor');
    console.log('2. Click "New Table"');
    console.log('3. Create "users" table manually');
    return;
  }

  console.log('✅ Users table created successfully!');
  console.log('✅ Admin user inserted!\n');

  // Verify
  const { data, error: selectError } = await supabase
    .from('users')
    .select('id, email, name, role, status')
    .eq('email', 'admin@possystem.gt.tc');

  if (selectError) {
    console.error('❌ Verification failed:', selectError.message);
  } else {
    console.log('✅ Verification:');
    console.log(JSON.stringify(data, null, 2));
  }
}

createUsersTable();
