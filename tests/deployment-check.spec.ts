import { test, expect } from '@playwright/test';

test('Check Railway Backend Deployment', async ({ request }) => {
  // Replace with your actual Railway URL
  const railwayUrl = process.env.RAILWAY_URL || 'https://pos-backend.railway.app';
  
  console.log(`Testing Railway backend at: ${railwayUrl}`);
  
  // Test 1: Health endpoint
  const healthResponse = await request.get(`${railwayUrl}/health`);
  
  console.log(`Health endpoint status: ${healthResponse.status()}`);
  
  expect(healthResponse.ok()).toBeTruthy();
  
  const healthData = await healthResponse.json();
  console.log('Health response:', JSON.stringify(healthData, null, 2));
  
  expect(healthData.success).toBe(true);
  expect(healthData.message).toBe('POS Backend API is running');
  
  // Test 2: API Health endpoint
  const apiHealthResponse = await request.get(`${railwayUrl}/api/health`);
  expect(apiHealthResponse.ok()).toBeTruthy();
  
  console.log('✅ Railway backend is running successfully!');
});
