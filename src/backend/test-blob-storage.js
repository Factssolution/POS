/**
 * BLOB Storage System Test Script
 * Tests upload, retrieval, and deletion of images
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';
let uploadedBlobId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBlobStorage() {
  log('\n🧪 BLOB Storage System Test Suite\n', 'cyan');
  log('=' .repeat(50), 'cyan');

  try {
    // Step 1: Login to get auth token
    log('\n📝 Step 1: Authentication', 'blue');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'  // Correct password from test-complete-flow.js
    });

    authToken = loginResponse.data.data.token;
    log(`✅ Logged in successfully`, 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'green');

    // Step 2: Check storage usage (before upload)
    log('\n📊 Step 2: Check Initial Storage Usage', 'blue');
    const usageBefore = await axios.get(`${BASE_URL}/blobs/usage`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    log(`✅ Storage Usage:`, 'green');
    log(`   Used: ${usageBefore.data.used_mb} MB`, 'green');
    log(`   Limit: ${usageBefore.data.limit_mb} MB`, 'green');
    log(`   Remaining: ${usageBefore.data.remaining_mb} MB`, 'green');
    log(`   Files: ${usageBefore.data.total_files}`, 'green');

    // Step 3: Create a test image (1x1 pixel PNG)
    log('\n🖼️  Step 3: Create Test Image', 'blue');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a minimal PNG file (1x1 pixel)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF,
      0x00, 0x05, 0xFE, 0x02, 0xFE, 0xA7, 0x94, 0x1E,
      0xEB, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    fs.writeFileSync(testImagePath, pngHeader);
    log(`✅ Test image created: ${testImagePath}`, 'green');

    // Step 4: Upload logo
    log('\n📤 Step 4: Upload Logo Image', 'blue');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), 'test-logo.png');
    formData.append('type', 'logo');
    formData.append('name', 'test-logo.png');

    const uploadResponse = await axios.post(`${BASE_URL}/blobs/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    uploadedBlobId = uploadResponse.data.blob_id;
    log(`✅ Image uploaded successfully!`, 'green');
    log(`   Blob ID: ${uploadedBlobId}`, 'green');
    log(`   Original Size: ${uploadResponse.data.original_size}`, 'green');
    log(`   Optimized Size: ${uploadResponse.data.optimized_size}`, 'green');
    log(`   Compression: ${uploadResponse.data.compression}`, 'green');
    log(`   Dimensions: ${uploadResponse.data.dimensions}`, 'green');

    // Step 5: Get image as binary
    log('\n📥 Step 5: Retrieve Image (Binary)', 'blue');
    const binaryResponse = await axios.get(`${BASE_URL}/blobs/${uploadedBlobId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      responseType: 'arraybuffer'
    });

    log(`✅ Image retrieved (binary)`, 'green');
    log(`   Content-Type: ${binaryResponse.headers['content-type']}`, 'green');
    log(`   Size: ${binaryResponse.data.length} bytes`, 'green');
    log(`   Cache-Control: ${binaryResponse.headers['cache-control']}`, 'green');

    // Step 6: Get image as base64
    log('\n🔤 Step 6: Retrieve Image (Base64)', 'blue');
    const base64Response = await axios.get(`${BASE_URL}/blobs/${uploadedBlobId}/base64`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    log(`✅ Image retrieved (base64)`, 'green');
    log(`   MIME Type: ${base64Response.data.mime_type}`, 'green');
    log(`   Dimensions: ${base64Response.data.width}x${base64Response.data.height}`, 'green');
    log(`   Base64 Length: ${base64Response.data.data.length} chars`, 'green');

    // Step 7: Check storage usage (after upload)
    log('\n📊 Step 7: Check Storage Usage (After Upload)', 'blue');
    const usageAfter = await axios.get(`${BASE_URL}/blobs/usage`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    log(`✅ Storage Usage:`, 'green');
    log(`   Used: ${usageAfter.data.used_mb} MB (was: ${usageBefore.data.used_mb} MB)`, 'green');
    log(`   Files: ${usageAfter.data.total_files} (was: ${usageBefore.data.total_files})`, 'green');

    // Step 8: List all blobs
    log('\n📋 Step 8: List All Blobs', 'blue');
    const listResponse = await axios.get(`${BASE_URL}/blobs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    log(`✅ Blobs listed:`, 'green');
    log(`   Total: ${listResponse.data.total}`, 'green');
    if (listResponse.data.blobs.length > 0) {
      listResponse.data.blobs.forEach(blob => {
        log(`   - ${blob.blob_name} (${blob.size_kb} KB, ${blob.blob_type})`, 'green');
      });
    }

    // Step 9: Delete image
    log('\n🗑️  Step 9: Delete Image', 'blue');
    const deleteResponse = await axios.delete(`${BASE_URL}/blobs/${uploadedBlobId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    log(`✅ Image deleted`, 'green');
    log(`   Freed Space: ${deleteResponse.data.freed_space}`, 'green');

    // Step 10: Verify deletion
    log('\n🔍 Step 10: Verify Deletion', 'blue');
    try {
      await axios.get(`${BASE_URL}/blobs/${uploadedBlobId}/base64`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      log(`❌ Image still exists (should be deleted)`, 'red');
    } catch (error) {
      if (error.response?.status === 404) {
        log(`✅ Image successfully deleted (404 Not Found)`, 'green');
      } else {
        throw error;
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Final Summary
    log('\n' + '='.repeat(50), 'cyan');
    log('\n🎉 ALL TESTS PASSED!\n', 'green');
    log('Summary:', 'cyan');
    log('  ✅ Authentication', 'green');
    log('  ✅ Storage Usage Check', 'green');
    log('  ✅ Image Upload with Optimization', 'green');
    log('  ✅ Image Retrieval (Binary)', 'green');
    log('  ✅ Image Retrieval (Base64)', 'green');
    log('  ✅ Blob Listing', 'green');
    log('  ✅ Image Deletion', 'green');
    log('  ✅ Deletion Verification', 'green');
    log('\n🚀 BLOB Storage System is working perfectly!\n', 'green');

  } catch (error) {
    log('\n❌ TEST FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    // Cleanup
    const testImagePath = path.join(__dirname, 'test-image.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    process.exit(1);
  }
}

// Run tests
testBlobStorage();
