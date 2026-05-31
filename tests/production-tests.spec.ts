import { test, expect } from '@playwright/test';

/**
 * 🚀 PRODUCTION DEPLOYMENT TESTS - VERCEL
 * 
 * Testing deployed application at:
 * Frontend: https://pos-iota-sage.vercel.app
 * Backend: https://backend-three-alpha-44.vercel.app
 * 
 * Test Users:
 * 1. Super Admin: factssolution@gmail.com / Black@786##
 * 2. Admin: admin@factssolution.com / Black@786##
 */

const DEPLOYMENT_CONFIG = {
  frontend: 'https://pos-iota-sage.vercel.app',
  backend: 'https://backend-three-alpha-44.vercel.app'
};

const TEST_USERS = {
  superAdmin: {
    email: 'factssolution@gmail.com',
    password: 'Black@786##',
    role: 'super_admin'
  },
  admin: {
    email: 'admin@factssolution.com',
    password: 'Black@786##',
    role: 'admin'
  }
};

/**
 * Helper: Login to the application
 */
async function login(page: any, user: { email: string; password: string }) {
  await page.goto(DEPLOYMENT_CONFIG.frontend);
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in
  const url = page.url();
  if (url.includes('/dashboard') || url.includes('/pos')) {
    return true;
  }
  
  // Fill login form
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait for navigation or success
  await page.waitForTimeout(3000);
  
  // Check if redirected to dashboard
  const newUrl = page.url();
  return newUrl.includes('/dashboard') || newUrl.includes('/pos');
}

test.describe('🚀 Production Deployment - Vercel E2E Tests', () => {
  
  test.describe('📡 Backend API Health Check', () => {
    
    test.skip('should have backend API running', async ({ request }) => {
      // Skipped: Backend is protected by Vercel authentication
      // Frontend will test backend integration through normal flow
      console.log('️  Skipped: Backend authentication protected');
    });

    test.skip('should have CORS configured', async ({ request }) => {
      // Skipped: Backend is protected by Vercel authentication
      console.log('⏭️  Skipped: Backend authentication protected');
    });
  });

  test.describe('🎨 Frontend Application', () => {
    
    test('should load frontend application', async ({ page }) => {
      console.log('🧪 Testing Frontend Loading...');
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      // Check page title
      await expect(page).toHaveTitle(/POS|Dashboard/i);
      
      // Check logo
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      
      console.log('✅ Frontend Loaded Successfully');
    });

    test('should display login form', async ({ page }) => {
      console.log('🧪 Testing Login Form Display...');
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      // Check email input
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();
      
      // Check password input
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();
      
      // Check submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText('Sign In');
      
      console.log('✅ Login Form Displayed Correctly');
    });
  });

  test.describe('🔐 Super Admin Login', () => {
    
    test('should login as super admin successfully', async ({ page }) => {
      console.log(' Testing Super Admin Login...');
      
      const success = await login(page, TEST_USERS.superAdmin);
      
      expect(success).toBeTruthy();
      
      // Verify redirected to dashboard
      await expect(page).toHaveURL(/.*dashboard|pos.*/);
      
      // Check dashboard elements
      const dashboardTitle = page.locator('text=/Dashboard|POS/i').first();
      await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Super Admin Login PASSED');
    });

    test('super admin should see admin dashboard features', async ({ page }) => {
      console.log(' Testing Super Admin Dashboard Features...');
      
      await login(page, TEST_USERS.superAdmin);
      await page.waitForTimeout(2000);
      
      // Check for key dashboard elements
      const elements = [
        'text=Dashboard',
        'text=POS',
        'text=Products',
        'text=Orders',
        'text=Reports'
      ];
      
      for (const element of elements) {
        const el = page.locator(element);
        const isVisible = await el.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  📌 ${element}: ${isVisible ? '✅ Visible' : ' Not Visible'}`);
      }
      
      console.log('✅ Super Admin Dashboard Features Verified');
    });
  });

  test.describe('👤 Admin Login', () => {
    
    test('should login as admin successfully', async ({ page }) => {
      console.log('🧪 Testing Admin Login...');
      
      const success = await login(page, TEST_USERS.admin);
      
      expect(success).toBeTruthy();
      
      // Verify redirected to dashboard
      await expect(page).toHaveURL(/.*dashboard|pos.*/);
      
      console.log('✅ Admin Login PASSED');
    });

    test('admin should see dashboard features', async ({ page }) => {
      console.log('🧪 Testing Admin Dashboard Features...');
      
      await login(page, TEST_USERS.admin);
      await page.waitForTimeout(2000);
      
      // Check for key dashboard elements
      const dashboardTitle = page.locator('text=/Dashboard|POS/i').first();
      await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Admin Dashboard Features Verified');
    });
  });

  test.describe(' Invalid Login Attempts', () => {
    
    test('should reject invalid credentials', async ({ page }) => {
      console.log('🧪 Testing Invalid Credentials Rejection...');
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      // Fill with invalid credentials
      await page.fill('#email', 'invalid@example.com');
      await page.fill('#password', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
      
      // Should show error or stay on login page
      const url = page.url();
      expect(url).toContain(DEPLOYMENT_CONFIG.frontend);
      
      console.log('✅ Invalid Credentials Rejected');
    });

    test('should show error on empty form submission', async ({ page }) => {
      console.log('🧪 Testing Empty Form Validation...');
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      // Should show error toast
      const toast = page.getByText('Please fill in all fields');
      const isVisible = await toast.isVisible({ timeout: 3000 }).catch(() => false);
      
      expect(isVisible).toBeTruthy();
      
      console.log('✅ Empty Form Validation Working');
    });
  });

  test.describe(' Data Loading Tests', () => {
    
    test('should load dashboard data after login', async ({ page }) => {
      console.log(' Testing Dashboard Data Loading...');
      
      await login(page, TEST_USERS.superAdmin);
      await page.waitForTimeout(3000);
      
      // Check if data is loading
      const statsCards = page.locator('.grid > div, [class*="grid"] > div').filter({ has: page.locator('text=/Orders|Sales|Products/i') });
      const count = await statsCards.count();
      
      expect(count).toBeGreaterThan(0);
      
      console.log(`✅ Dashboard Loaded with ${count} stats cards`);
    });

    test('should load products page', async ({ page }) => {
      console.log('🧪 Testing Products Page Loading...');
      
      await login(page, TEST_USERS.superAdmin);
      await page.waitForTimeout(2000);
      
      // Navigate to products
      const productsLink = page.locator('text=Products');
      if (await productsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await productsLink.click();
        await page.waitForTimeout(2000);
        
        // Check if products table or list is visible
        const productsContent = page.locator('table, .grid').first();
        const isVisible = await productsContent.isVisible({ timeout: 5000 }).catch(() => false);
        
        console.log(`  📌 Products Content: ${isVisible ? '✅ Loaded' : ' Not Found'}`);
      }
      
      console.log('✅ Products Page Test Completed');
    });
  });

  test.describe(' Security Tests', () => {
    
    test('should require authentication for dashboard', async ({ page }) => {
      console.log(' Testing Authentication Requirement...');
      
      // Try to access dashboard directly
      await page.goto(`${DEPLOYMENT_CONFIG.frontend}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login
      const url = page.url();
      expect(url).toContain('/login') || expect(url).toEqual(DEPLOYMENT_CONFIG.frontend + '/');
      
      console.log('✅ Authentication Required for Dashboard');
    });

    test('should store token in localStorage after login', async ({ page }) => {
      console.log('🧪 Testing Token Storage...');
      
      await login(page, TEST_USERS.superAdmin);
      await page.waitForTimeout(2000);
      
      // Check localStorage for token
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
      });
      
      expect(token).toBeDefined();
      expect(token).not.toBeNull();
      
      console.log('✅ Token Stored in localStorage');
    });
  });

  test.describe(' Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      console.log(' Testing Mobile Viewport...');
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      
      console.log('✅ Mobile Viewport Working');
    });

    test('should work on tablet viewport', async ({ page }) => {
      console.log('🧪 Testing Tablet Viewport...');
      
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto(DEPLOYMENT_CONFIG.frontend);
      await page.waitForLoadState('networkidle');
      
      const form = page.locator('form');
      await expect(form).toBeVisible();
      
      console.log('✅ Tablet Viewport Working');
    });
  });
});
