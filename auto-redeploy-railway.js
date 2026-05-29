const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Auto-deploying Railway backend...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to Railway service page
    console.log('📍 Navigating to Railway dashboard...');
    await page.goto('https://railway.com/project/precious-benevolence/pos-backend', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for page to load
    await page.waitForTimeout(3000);
    
    // Look for redeploy button
    console.log('🔍 Looking for redeploy button...');
    
    // Try different selectors for redeploy
    const redeploySelectors = [
      'button:has-text("Redeploy")',
      'button:has-text("Deploy")',
      '[data-testid="redeploy-button"]',
      'text=Redeploy'
    ];
    
    let redeployed = false;
    for (const selector of redeploySelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          console.log('✅ Found redeploy button, clicking...');
          await btn.click();
          redeployed = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (redeployed) {
      console.log('✅ Redeploy triggered!');
      console.log('⏳ Waiting for deployment to complete...');
      await page.waitForTimeout(5000);
      console.log('🎉 Deployment in progress. Check Railway dashboard for status.');
    } else {
      console.log('⚠️  Could not find redeploy button automatically.');
      console.log('📋 Please manually click "Redeploy" on the Railway dashboard.');
    }
    
    // Keep browser open for 10 seconds
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
