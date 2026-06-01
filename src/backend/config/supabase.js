const { createClient } = require('@supabase/supabase-js');

// Load environment variables
if (process.env.VERCEL !== '1') {
  require('dotenv').config();
}

// Initialize Supabase client (uses REST API, no DNS issues)
const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase keys! Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized (REST API mode)');
console.log('🔗 URL:', supabaseUrl);

module.exports = supabase;
