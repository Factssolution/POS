const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'Admin@123456';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n-- Run this SQL in Supabase:');
  console.log(`
INSERT INTO users (email, name, role, status, password_hash, created_at, updated_at)
VALUES (
  'admin@possystem.gt.tc',
  'System Admin',
  'admin',
  'active',
  '${hash}',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
  `);
}

generateHash();
