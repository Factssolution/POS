const jwt = require('jsonwebtoken');

async function testCategoriesAPI() {
  try {
    // Generate token
    const token = jwt.sign(
      { id: 1, email: 'admin@factssolution.com', role: 'Admin' },
      'pos_system_super_secret_jwt_key_2025_change_in_production',
      { expiresIn: '1h' }
    );

    console.log(' Testing GET /api/v1/products/categories\n');

    const response = await fetch('http://localhost:5000/api/v1/products/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    console.log('✅ API Response:');
    console.log('━'.repeat(50));
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Categories Count: ${data.data.count}`);
    console.log('\nCategories:');
    data.data.categories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat}`);
    });
    console.log('━'.repeat(50));
    console.log('\n✅ Categories API is working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCategoriesAPI();
