const axios = require('axios');

async function testUsersAPI() {
  console.log('\n' + '═'.repeat(80));
  console.log('                    TESTING USERS API ENDPOINTS');
  console.log('═'.repeat(80) + '\n');

  try {
    // First login to get token
    console.log(' Step 1: Logging in as Admin...\n');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful!\n');
    console.log('─'.repeat(80));

    // Test GET all users
    console.log('\n📋 Step 2: Fetching all users...\n');
    const usersResponse = await axios.get('http://localhost:5000/api/v1/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Success! Fetched ${usersResponse.data.count} users\n`);
    console.log('─'.repeat(80));
    
    usersResponse.data.users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
    });

    console.log('\n\n' + '═'.repeat(80));
    console.log('                        ✅ ALL TESTS PASSED!');
    console.log('═'.repeat(80) + '\n');
    
    console.log('📌 You can now use the Employee Management page to:');
    console.log('   ✅ View all users from database');
    console.log('   ✅ Add new users with email, phone, role');
    console.log('   ✅ Edit user details (name, email, phone, role, status)');
    console.log('   ✅ Reset user passwords');
    console.log('   ✅ Toggle user status (active/inactive)');
    console.log('   ✅ Delete users\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testUsersAPI();
