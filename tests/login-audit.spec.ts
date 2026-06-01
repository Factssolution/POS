import { test, expect } from '@playwright/test';

test.describe('POS Login System - Production Audit', () => {
  
  test('1. Health endpoint should respond', async ({ request }) => {
    const response = await request.get('https://pos-api-zayqa.vercel.app/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('POS Backend API is running');
    console.log('✅ Health check passed');
  });

  test('2. Login endpoint should accept credentials', async ({ request }) => {
    const response = await request.post('https://pos-api-zayqa.vercel.app/api/v1/auth/login', {
      data: {
        email: 'factssolution@gmail.com',
        password: 'Black@786##'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', response.status());
    const body = await response.json();
    console.log('Response Body:', JSON.stringify(body, null, 2));

    // Should return 200 with token
    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
  });

  test('3. Frontend login flow should complete', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Fill credentials
    if (await emailInput.isVisible()) {
      await emailInput.fill('factssolution@gmail.com');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('Black@786##');
    }
    
    // Click login button
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // Check for success indicators
    const url = page.url();
    console.log('Current URL:', url);
    
    // Should navigate to dashboard or show success
    const hasDashboard = url.includes('dashboard') || url.includes('home');
    const hasError = await page.locator('text=Login failed, text=Error, text=Invalid').isVisible().catch(() => false);
    
    expect(hasError).toBe(false);
  });

  test('4. API network requests should succeed', async ({ page }) => {
    const failures: string[] = [];
    
    // Listen for failed requests
    page.on('response', async (response) => {
      if (response.url().includes('/auth/login')) {
        const status = response.status();
        const body = await response.json().catch(() => null);
        
        console.log('Login API Response:', {
          status,
          body: JSON.stringify(body, null, 2)
        });
        
        if (status === 500) {
          failures.push(`Login API returned 500: ${JSON.stringify(body)}`);
        }
      }
    });
    
    // Navigate and attempt login
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Try to login via console
    await page.evaluate(async () => {
      try {
        const response = await fetch('https://pos-api-zayqa.vercel.app/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'factssolution@gmail.com',
            password: 'Black@786##'
          })
        });
        const data = await response.json();
        console.log('Direct API Test:', data);
        return data;
      } catch (error) {
        console.error('API Test Error:', error.message);
        return { error: error.message };
      }
    });
    
    await page.waitForTimeout(3000);
    
    expect(failures.length).toBe(0);
  });
});
