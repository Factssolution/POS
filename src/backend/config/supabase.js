const { createClient } = require('@supabase/supabase-js');

// Load environment variables
if (process.env.VERCEL !== '1') {
  require('dotenv').config();
}

// Initialize Supabase client (uses REST API, no DNS issues)
const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';

// Use anon key as fallback if service_role not available
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM';

if (!supabaseKey) {
  console.error('❌ Missing Supabase keys! Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized (REST API mode)');
console.log('🔗 URL:', supabaseUrl);

module.exports = supabase;
