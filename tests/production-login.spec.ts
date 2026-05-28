import { test, expect } from '@playwright/test';

test('Production Login Test - Vercel Frontend + Railway Backend', async ({ page }) => {
  console.log('🚀 Starting production login test...');
  
  // Step 1: Navigate to Vercel frontend
  console.log(' Navigating to Vercel frontend...');
  await page.goto('https://pos-iota-sage.vercel.app');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Frontend loaded successfully');
  
  // Step 2: Verify login page is displayed
  console.log('🔍 Checking login page elements...');
  
  // Wait for email input to be visible
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  console.log('✅ Email input found');
  
  // Wait for password input to be visible
  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  console.log('✅ Password input found');
  
  // Step 3: Fill login credentials
  console.log(' Filling login credentials...');
  console.log('📧 Email: factssolution@gmail.com');
  console.log('🔑 Password: Black@786##');
  
  await emailInput.fill('factssolution@gmail.com');
  await passwordInput.fill('Black@786##');
  
  console.log('✅ Credentials filled');
  
  // Step 4: Submit login form
  console.log(' Submitting login form...');
  
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
  await loginButton.click();
  
  console.log('⏳ Waiting for login response...');
  
  // Step 5: Wait for navigation or response
  await page.waitForTimeout(3000);
  
  // Step 6: Check for success or failure
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);
  
  // Check if redirected to dashboard (success)
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/app')) {
    console.log('✅ LOGIN SUCCESSFUL - Redirected to dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: 'test-results/login-success-dashboard.png',
      fullPage: true 
    });
    console.log(' Dashboard screenshot saved');
    
  } else {
    // Check for error messages
    console.log('⚠️ Login may have failed, checking for errors...');
    
    const errorMessage = page.locator('text=Invalid email or password, text=Login failed, text=Error').first();
    const errorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorMessage.textContent();
      console.log('❌ Login failed with error:', errorText);
      
      // Take screenshot of error
      await page.screenshot({ 
        path: 'test-results/login-failed-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
      
      expect(errorVisible).toBeFalsy();
    } else {
      console.log('⚠️ No error message found, checking current state...');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/login-unknown-state.png',
        fullPage: true 
      });
      console.log('📸 Unknown state screenshot saved');
      
      console.log('📍 Still on login page or different state');
    }
  }
  
  // Step 7: Check console logs for API calls
  console.log('🔍 Checking for any console errors...');
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 Console Error:', msg.text());
    }
  });
  
  console.log('✅ Login test completed');
});
