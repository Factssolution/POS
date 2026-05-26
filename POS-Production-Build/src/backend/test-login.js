const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testing Super Admin Login...\n');
    console.log('📧 Email: factsolution@gmail.com');
    console.log('🔑 Password: Black@786##\n');

    const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'factsolution@gmail.com',
      password: 'Black@786##'
    });

    console.log('✅ Login Successful!');
    console.log('═'.repeat(60));
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Login Failed!');
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
    console.error('Message:', error.response?.data?.message);
  }
}

testLogin();
