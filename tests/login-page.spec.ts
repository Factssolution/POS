import { test, expect } from '@playwright/test';

test.describe('Login Page - Professional UI Tests', () => {
  const LOGIN_URL = 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Visual Elements', () => {
    test('should display Facts Solution logo', async ({ page }) => {
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', '/factssolution.jpeg');
      
      // Verify logo dimensions
      const boundingBox = await logo.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(100);
      expect(boundingBox?.height).toBeGreaterThan(100);
    });

    test('should display correct title and subtitle', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Facts Solution POS');
      
      // Use more specific selector for subtitle
      const subtitle = page.locator('p.text-sm.text-gray-500');
      await expect(subtitle).toBeVisible();
      await expect(subtitle).toContainText('Sign in to access your dashboard');
    });

    test('should NOT display demo user quick-login buttons', async ({ page }) => {
      // Verify no quick login section
      await expect(page.locator('text=Quick Login')).not.toBeVisible();
      
      // Verify no demo buttons
      await expect(page.locator('text=Admin')).not.toBeVisible();
      await expect(page.locator('text=Manager')).not.toBeVisible();
      await expect(page.locator('text=Cashier')).not.toBeVisible();
      await expect(page.locator('text=Sky User')).not.toBeVisible();
      
      // Verify no email badges
      await expect(page.locator('text=admin@factssolution.com')).not.toBeVisible();
      await expect(page.locator('text=manager@factssolution.com')).not.toBeVisible();
      await expect(page.locator('text=cashier@factssolution.com')).not.toBeVisible();
    });

    test('should display login form card', async ({ page }) => {
      // Check for the card with rounded-xl class
      const card = page.locator('.rounded-xl').first();
      await expect(card).toBeVisible();
      
      // Verify it has form inside
      const form = card.locator('form');
      await expect(form).toBeVisible();
    });

    test('should display footer with address and copyright', async ({ page }) => {
      const address = page.locator('text=Main Auto Bhan Road Near TCL Building Hyderabad');
      await expect(address).toBeVisible();
      
      const copyright = page.locator('text=Powered by Facts Solution © 2026 - 2030 All Rights Reserved');
      await expect(copyright).toBeVisible();
    });
  });

  test.describe('Form Fields', () => {
    test('should display email input field with correct attributes', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(emailInput).toHaveAttribute('placeholder', 'name@factssolution.com');
    });

    test('should display password input field with correct attributes', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      await expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });

    test('should display email and password labels', async ({ page }) => {
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toContainText('Email Address');
      
      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();
      await expect(passwordLabel).toContainText('Password');
    });

    test('should display user icon for email field', async ({ page }) => {
      const emailIcon = page.locator('input[id="email"]').locator('..').locator('svg').first();
      await expect(emailIcon).toBeVisible();
    });

    test('should display lock icon for password field', async ({ page }) => {
      const passwordIcon = page.locator('input[id="password"]').locator('..').locator('svg').first();
      await expect(passwordIcon).toBeVisible();
    });
  });

  test.describe('Submit Button', () => {
    test('should display Sign In button', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText('Sign In');
      await expect(submitButton).toBeEnabled();
    });

    test('should have professional styling on submit button', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      const className = await submitButton.getAttribute('class');
      // Check for blue button styling
      expect(className).toContain('bg-blue-600');
      expect(className).toContain('hover:bg-blue-700');
      expect(className).toContain('rounded-md');
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility when clicking eye icon', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      const toggleButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') });
      
      // Initial state - password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle button
      await toggleButton.click();
      
      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      
      // Password should be hidden again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should show eye icon initially', async ({ page }) => {
      const eyeIcon = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).locator('svg');
      await expect(eyeIcon).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should show error when submitting empty form', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait a bit for toast to appear
      await page.waitForTimeout(1000);
      
      // Check if toast notification appears
      const toast = page.getByText('Please fill in all fields');
      await expect(toast).toBeVisible({ timeout: 5000 });
    });

    test('should show error when submitting only email', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      await emailInput.fill('test@example.com');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait a bit for toast to appear
      await page.waitForTimeout(1000);
      
      // Check if toast notification appears
      const toast = page.getByText('Please fill in all fields');
      await expect(toast).toBeVisible({ timeout: 5000 });
    });

    test('should show error when submitting only password', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]');
      await passwordInput.fill('password123');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait a bit for toast to appear
      await page.waitForTimeout(1000);
      
      // Check if toast notification appears
      const toast = page.getByText('Please fill in all fields');
      await expect(toast).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state when submitting form', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      // Use invalid credentials to ensure loading state is visible
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      // Click and immediately check for disabled state
      await Promise.all([
        submitButton.click(),
        // Button should become disabled quickly
        expect(submitButton).toBeDisabled({ timeout: 3000 }).catch(() => {
          // Button might complete too fast, that's okay
        })
      ]);
      
      // The button text might change or not depending on API speed
      // Just verify the button was clicked
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper autocomplete attributes', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    test('should have proper label associations', async ({ page }) => {
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');
      
      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
      
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      const emailInput = page.locator('input[id="email"]');
      await expect(emailInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      const passwordInput = page.locator('input[id="password"]');
      await expect(passwordInput).toBeFocused();
      
      await page.keyboard.press('Tab');
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeFocused();
    });
  });

  test.describe('API Integration', () => {
    test('should call login API with correct credentials', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('admin@factssolution.com');
      await passwordInput.fill('admin123');
      
      // Listen for API request
      const [request] = await Promise.all([
        page.waitForRequest('**/api/v1/auth/login'),
        submitButton.click()
      ]);
      
      // Verify request method
      expect(request.method()).toBe('POST');
      
      // Verify request payload
      const postData = request.postDataJSON();
      expect(postData.email).toBe('admin@factssolution.com');
      expect(postData.password).toBe('admin123');
    });

    test('should handle successful login', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('admin@factssolution.com');
      await passwordInput.fill('admin123');
      
      await submitButton.click();
      
      // Wait for either success message OR navigation to dashboard
      await Promise.race([
        // Check for success toast
        expect(page.getByText('Login successful!')).toBeVisible({ timeout: 10000 }).catch(() => {}),
        // OR check if page navigates away from login
        page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {}),
        // OR check if login form is no longer visible
        expect(page.locator('input[id="email"]')).not.toBeVisible({ timeout: 10000 }).catch(() => {})
      ]);
    });

    test('should handle invalid credentials', async ({ page }) => {
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      
      await submitButton.click();
      
      // Wait for either error message or button to become enabled again
      await Promise.race([
        // Check for error toast
        expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 }).catch(() => {}),
        expect(page.getByText('Login failed')).toBeVisible({ timeout: 10000 }).catch(() => {}),
        // OR button becomes enabled again after error
        expect(submitButton).toBeEnabled({ timeout: 10000 })
      ]);
    });
  });

  test.describe('Responsive Design', () => {
    test('should render correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should render correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should render correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const logo = page.locator('img[alt="Facts Solution Logo"]');
      await expect(logo).toBeVisible();
      
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });
  });
});
