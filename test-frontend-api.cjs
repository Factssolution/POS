const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('API') || msg.text().includes('Login')) {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  console.log('Navigating to Vercel frontend...');
  await page.goto('https://pos-iota-sage.vercel.app', { waitUntil: 'networkidle' });
  
  // Check if login page loaded
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  if (emailInput) {
    console.log('✅ Login page loaded');
    
    // Fill credentials
    await emailInput.fill('factssolution@gmail.com');
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.fill('Black@786##');
    
    // Click login button
    const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    if (loginButton) {
      console.log('Clicking login button...');
      await loginButton.click();
      
      // Wait 3 seconds
      await page.waitForTimeout(3000);
      
      // Check URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Take screenshot
      await page.screenshot({ path: 'login-test-result.png' });
      console.log('Screenshot saved: login-test-result.png');
    }
  }
  
  await browser.close();
})();
