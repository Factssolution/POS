const axios = require('axios');

async function testCategoriesAPI() {
  try {
    // Login first
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('✅ Login successful\n');

    // Test categories endpoint
    const categoriesRes = await axios.get('http://localhost:5000/api/v1/products/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Categories API Response:');
    console.log(JSON.stringify(categoriesRes.data, null, 2));
    
    if (categoriesRes.data.data.categories && categoriesRes.data.data.categories.length > 0) {
      console.log(`\n✅ SUCCESS: Found ${categoriesRes.data.data.count} categories`);
      console.log('\nCategory List:');
      categoriesRes.data.data.categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
      });
    } else {
      console.log('\n⚠️  WARNING: No categories found in database');
      console.log('Please create categories in the Category Management page first');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCategoriesAPI();
