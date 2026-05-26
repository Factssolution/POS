const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  try {
    console.log('=== Testing Product Image Upload ===\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Create a test image file
    console.log('2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-product-image.png');
    
    // Create a simple 1x1 PNG image (minimal valid PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✅ Test image created\n');

    // Step 3: Upload product with image
    console.log('3. Uploading product with image...');
    const formData = new FormData();
    formData.append('name', 'Test Product with Image');
    formData.append('description', 'This is a test product');
    formData.append('category', 'Food');
    formData.append('price', '100');
    formData.append('cost_price', '80');
    formData.append('stock', '50');
    formData.append('min_stock', '10');
    formData.append('barcode', 'TEST' + Date.now());
    formData.append('status', 'active');
    formData.append('image', fs.createReadStream(testImagePath));

    const createRes = await axios.post(
      'http://localhost:5000/api/v1/products',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Product created successfully!\n');
    console.log('Product Details:');
    console.log('  Name:', createRes.data.data.name);
    console.log('  ID:', createRes.data.data.id);
    console.log('  Image URL:', createRes.data.data.image_url);
    console.log('  Image URL starts with http:', createRes.data.data.image_url.startsWith('http'));

    // Step 4: Verify image file exists
    if (createRes.data.data.image_url) {
      const imagePath = createRes.data.data.image_url.replace('http://localhost:5000', '.');
      const fullPath = path.join(__dirname, '..', imagePath);
      
      if (fs.existsSync(fullPath)) {
        console.log('\n✅ Image file saved successfully at:', fullPath);
        console.log('   File size:', fs.statSync(fullPath).size, 'bytes');
      } else {
        console.log('\n❌ Image file not found at:', fullPath);
      }
    }

    // Step 5: Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Status:', error.response.status);
    }
  }
}

testImageUpload();
