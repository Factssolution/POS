// Test Supabase Authentication
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseAnonKey = 'sb_publishable_gzAeFoffKh4z1Lo3YJMi9Q_y41g5smI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication...\n');

  // Test 1: Try login
  console.log('Test 1: Login with factssolution@gmail.com');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'factssolution@gmail.com',
    password: 'Black@786##'
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
    
    // Test 2: Try signup
    console.log('\nTest 2: Attempt signup');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User:', signupData.user?.email);
      console.log('Session:', signupData.session ? 'Created' : 'Not created (email confirmation required)');
    }
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', loginData.user?.id);
    console.log('Email:', loginData.user?.email);
    console.log('Session expires:', loginData.session?.expires_at);
  }
}

testAuth();
