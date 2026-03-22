const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function testLandingPage(browser, issues) {
  console.log('\n=== TESTING: Landing Page ===');
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to landing page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    
    await takeScreenshot(page, '01_landing_page');
    
    // Check for broken images
    const images = await page.locator('img').all();
    console.log(`Found ${images.length} images on landing page`);
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const isVisible = await img.isVisible().catch(() => false);
      const hasSrc = await img.getAttribute('src').catch(() => null);
      if (!isVisible || !hasSrc) {
        issues.push({
          severity: 'Minor',
          component: 'Landing Page',
          description: `Image ${i + 1} may be broken or missing src`,
          details: `Visible: ${isVisible}, Src: ${hasSrc}`
        });
      }
    }
    
    // Check CTAs
    const ctaButtons = await page.locator('button, a').filter({ hasText: /get started|sign up|login/i }).all();
    console.log(`Found ${ctaButtons.length} CTA buttons/links`);
    
    if (ctaButtons.length === 0) {
      issues.push({
        severity: 'Major',
        component: 'Landing Page',
        description: 'No clear Call-to-Action buttons found on landing page',
        recommendation: 'Add prominent Get Started / Login buttons'
      });
    }
    
    // Test responsive design - Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await delay(1000);
    await takeScreenshot(page, '02_landing_page_mobile');
    console.log('✓ Mobile viewport captured');
    
    // Check for horizontal scroll (bad mobile experience)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasHorizontalScroll) {
      issues.push({
        severity: 'Major',
        component: 'Landing Page - Mobile',
        description: 'Horizontal scroll detected on mobile viewport (375px)',
        recommendation: 'Check overflow-x and ensure content fits mobile screens'
      });
    }
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await delay(1000);
    await takeScreenshot(page, '03_landing_page_tablet');
    console.log('✓ Tablet viewport captured');
    
    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await delay(1000);
    await takeScreenshot(page, '04_landing_page_desktop');
    console.log('✓ Desktop viewport captured');
    
  } catch (error) {
    console.error('Error testing landing page:', error);
    issues.push({
      severity: 'Critical',
      component: 'Landing Page',
      description: `Landing page failed to load: ${error.message}`,
      details: error.stack
    });
  }
  
  await page.close();
}

async function testAuthFlows(browser, issues) {
  console.log('\n=== TESTING: Authentication Flows ===');
  const page = await browser.newPage();
  
  try {
    // Navigate to login
    console.log('Testing login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    
    await takeScreenshot(page, '05_login_page');
    
    // Check login form elements
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")').first();
    
    const hasEmail = await emailInput.isVisible().catch(() => false);
    const hasPassword = await passwordInput.isVisible().catch(() => false);
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    
    console.log(`Login form elements: Email(${hasEmail}), Password(${hasPassword}), Button(${hasLoginButton})`);
    
    if (!hasEmail || !hasPassword || !hasLoginButton) {
      issues.push({
        severity: 'Critical',
        component: 'Login Page',
        description: 'Missing login form elements',
        details: `Email: ${hasEmail}, Password: ${hasPassword}, Button: ${hasLoginButton}`,
        recommendation: 'Ensure all login form inputs and submit button are present'
      });
    }
    
    // Test with invalid credentials
    if (hasEmail && hasPassword && hasLoginButton) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('wrongpassword123');
      await takeScreenshot(page, '06_login_filled');
      
      await loginButton.click();
      await delay(3000);
      
      await takeScreenshot(page, '07_login_invalid_submitted');
      
      // Check for error message
      const errorMessage = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (!hasError) {
        issues.push({
          severity: 'Major',
          component: 'Login Page',
          description: 'No error message displayed after submitting invalid credentials',
          recommendation: 'Add clear error messages for failed authentication'
        });
      }
      console.log(`Error message displayed: ${hasError}`);
    }
    
    // Test empty form submission
    if (hasEmail) await emailInput.fill('');
    if (hasPassword) await passwordInput.fill('');
    if (hasLoginButton) {
      await loginButton.click();
      await delay(2000);
      await takeScreenshot(page, '08_login_empty_submitted');
      console.log('Empty form submission tested');
    }
    
    // Test signup link/page
    const signupLink = await page.locator('a[href*="signup"], a[href*="register"], a:has-text("sign up"), a:has-text("create account"), button:has-text("sign up")').first();
    const hasSignupLink = await signupLink.isVisible().catch(() => false);
    
    if (hasSignupLink) {
      console.log('Testing signup page...');
      await signupLink.click();
      await delay(3000);
      
      await takeScreenshot(page, '09_signup_page');
      
      // Check signup form
      const signupForm = await page.locator('form').first();
      const formExists = await signupForm.isVisible().catch(() => false);
      
      if (!formExists) {
        issues.push({
          severity: 'Major',
          component: 'Signup Page',
          description: 'Signup form not found after clicking signup link',
          recommendation: 'Ensure signup form is properly rendered'
        });
      } else {
        // Check for required fields
        const requiredInputs = await page.locator('input[required]').all();
        console.log(`Found ${requiredInputs.length} required inputs in signup form`);
        
        // Test password strength indicator if present
        const passwordFields = await page.locator('input[type="password"]').all();
        if (passwordFields.length > 0) {
          const weakPassword = '123';
          await passwordFields[0].fill(weakPassword);
          await delay(500);
          await takeScreenshot(page, '10_signup_weak_password');
          console.log('Weak password test completed');
        }
      }
    } else {
      issues.push({
        severity: 'Major',
        component: 'Login Page',
        description: 'No signup link found on login page',
        recommendation: 'Add a link to signup page for new users'
      });
    }
    
    // Check for OAuth buttons
    const oauthButtons = await page.locator('button:has-text("Google"), button:has-text("Facebook"), button:has-text("Apple"), button:has-text("Microsoft"), [class*="oauth"], [class*="social"]').all();
    console.log(`Found ${oauthButtons.length} OAuth/social login buttons`);
    
    // Test forgot password link
    const forgotPasswordLink = await page.locator('a[href*="forgot"], a[href*="reset"], a:has-text("forgot password"), a:has-text("reset password"), button:has-text("forgot"), :text("forgot password")').first();
    const hasForgotPassword = await forgotPasswordLink.isVisible().catch(() => false);
    
    if (hasForgotPassword) {
      console.log('Testing forgot password...');
      await forgotPasswordLink.click();
      await delay(2000);
      await takeScreenshot(page, '11_forgot_password_page');
      
      // Check if email input exists
      const resetEmail = await page.locator('input[type="email"]').first();
      if (!await resetEmail.isVisible().catch(() => false)) {
        issues.push({
          severity: 'Major',
          component: 'Forgot Password',
          description: 'Forgot password page missing email input',
          recommendation: 'Add email input field for password reset'
        });
      }
    }
    
  } catch (error) {
    console.error('Error testing auth flows:', error);
    issues.push({
      severity: 'Critical',
      component: 'Authentication',
      description: `Auth test failed: ${error.message}`,
      details: error.stack
    });
  }
  
  await page.close();
}

async function testOnboarding(browser, issues) {
  console.log('\n=== TESTING: Onboarding Experience ===');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    // Try to access onboarding directly
    console.log('Testing onboarding flow...');
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    
    await takeScreenshot(page, '12_onboarding_page');
    
    // Check if onboarding exists or redirects
    const currentUrl = page.url();
    if (!currentUrl.includes('onboarding') && !currentUrl.includes('welcome')) {
      console.log('No onboarding page accessible directly');
      
      // Try creating an account to trigger onboarding
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(2000);
      
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible().catch(() => false) && await passwordInput.isVisible().catch(() => false)) {
        const testEmail = `testuser_${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        await emailInput.fill(testEmail);
        await passwordInput.fill(testPassword);
        
        // Additional fields if present
        const nameInput = await page.locator('input[name*="name"], input[placeholder*="name" i]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill('Test User');
        }
        
        const submitButton = await page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await delay(5000);
          
          await takeScreenshot(page, '13_after_signup');
          
          const currentUrl = page.url();
          console.log(`After signup, URL is: ${currentUrl}`);
          
          // Check if onboarding was triggered
          if (currentUrl.includes('onboarding') || currentUrl.includes('welcome') || currentUrl.includes('getting-started')) {
            await takeScreenshot(page, '14_onboarding_started');
            console.log('Onboarding flow triggered!');
          } else if (currentUrl.includes('dashboard')) {
            console.log('Went straight to dashboard after signup');
            issues.push({
              severity: 'Minor',
              component: 'Onboarding',
              description: 'No onboarding flow - user goes straight to dashboard after signup',
              recommendation: 'Consider adding a guided tour or welcome modal for new users'
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing onboarding:', error);
    issues.push({
      severity: 'Minor',
      component: 'Onboarding',
      description: `Onboarding test error: ${error.message}`,
      details: error.stack
    });
  }
  
  await page.close();
}

async function testResponsiveDesign(browser, issues) {
  console.log('\n=== TESTING: Responsive Design ===');
  const page = await browser.newPage();
  
  const viewports = [
    { name: 'Mobile S', width: 320, height: 568 },
    { name: 'Mobile M', width: 375, height: 667 },
    { name: 'Mobile L', width: 425, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];
  
  for (const vp of viewports) {
    try {
      console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await delay(1000);
      
      await takeScreenshot(page, `15_responsive_${vp.name.replace(/\s+/g, '_').toLowerCase()}`);
      
      // Check for touch targets on mobile
      if (vp.width <= 425) {
        const allButtons = await page.locator('button, a, [role="button"]').all();
        let smallTouchTargets = 0;
        
        for (const btn of allButtons) {
          const box = await btn.boundingBox().catch(() => null);
          if (box && (box.width < 44 || box.height < 44)) {
            smallTouchTargets++;
          }
        }
        
        if (smallTouchTargets > 0) {
          issues.push({
            severity: 'Minor',
            component: `Responsive - ${vp.name}`,
            description: `Found ${smallTouchTargets} touch targets smaller than 44x44px (WCAG recommendation)`,
            recommendation: 'Increase touch target size to at least 44x44px for mobile accessibility'
          });
        }
      }
      
    } catch (error) {
      console.error(`Error testing ${vp.name}:`, error);
    }
  }
  
  await page.close();
}

async function testLoadingStates(browser, issues) {
  console.log('\n=== TESTING: Loading States ===');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    // Test slow 3G simulation
    console.log('Testing loading with slow network...');
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      latency: 150
    });
    
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Page loaded in ${loadTime}ms (slow 3G)`);
    
    if (loadTime > 10000) {
      issues.push({
        severity: 'Major',
        component: 'Performance',
        description: `Page took ${loadTime}ms to load on slow 3G (>10s)`,
        recommendation: 'Optimize bundle size, implement code splitting, lazy load components'
      });
    }
    
    await takeScreenshot(page, '16_slow_network_load');
    
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    
  } catch (error) {
    console.error('Error testing loading states:', error);
  }
  
  await page.close();
}

async function testAccessibility(browser, issues) {
  console.log('\n=== TESTING: Accessibility ===');
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2000);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    const imagesWithoutAlt = [];
    
    for (const img of images) {
      const alt = await img.getAttribute('alt').catch(() => null);
      if (!alt || alt.trim() === '') {
        const src = await img.getAttribute('src').catch(() => 'unknown');
        imagesWithoutAlt.push(src);
      }
    }
    
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        severity: 'Major',
        component: 'Accessibility',
        description: `${imagesWithoutAlt.length} images missing alt text: ${imagesWithoutAlt.slice(0, 3).join(', ')}...`,
        recommendation: 'Add descriptive alt text to all images for screen readers'
      });
    }
    console.log(`Images without alt text: ${imagesWithoutAlt.length}`);
    
    // Check for form labels
    const inputs = await page.locator('input:not([type="hidden"])').all();
    const unlabeledInputs = [];
    
    for (const input of inputs) {
      const id = await input.getAttribute('id').catch(() => null);
      const ariaLabel = await input.getAttribute('aria-label').catch(() => null);
      const ariaLabelledBy = await input.getAttribute('aria-labelledby').catch(() => null);
      const hasLabel = await input.evaluate(el => {
        const labelFor = document.querySelector(`label[for="${el.id}"]`);
        const parentLabel = el.closest('label');
        const ariaLabel = el.getAttribute('aria-label');
        const placeholder = el.placeholder;
        return !!(labelFor || parentLabel || ariaLabel || placeholder);
      }).catch(() => false);
      
      if (!hasLabel) {
        const name = await input.getAttribute('name').catch(() => 'unknown');
        unlabeledInputs.push(name);
      }
    }
    
    if (unlabeledInputs.length > 0) {
      issues.push({
        severity: 'Major',
        component: 'Accessibility',
        description: `${unlabeledInputs.length} form inputs missing labels: ${unlabeledInputs.slice(0, 3).join(', ')}...`,
        recommendation: 'Add <label> elements for all form inputs'
      });
    }
    console.log(`Unlabeled inputs: ${unlabeledInputs.length}`);
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of headings) {
      const level = await heading.evaluate(el => parseInt(el.tagName[1]));
      headingLevels.push(level);
    }
    
    let hasH1 = headingLevels.includes(1);
    let skippedLevels = false;
    let prevLevel = 0;
    
    for (const level of headingLevels) {
      if (level > prevLevel + 1) {
        skippedLevels = true;
      }
      prevLevel = level;
    }
    
    if (!hasH1) {
      issues.push({
        severity: 'Minor',
        component: 'Accessibility',
        description: 'No h1 element found on page',
        recommendation: 'Add a single h1 element that describes the page content'
      });
    }
    
    if (skippedLevels) {
      issues.push({
        severity: 'Minor',
        component: 'Accessibility',
        description: 'Heading levels are skipped (e.g., h1 to h3 without h2)',
        recommendation: 'Maintain proper heading hierarchy (h1 > h2 > h3)'
      });
    }
    
    console.log(`Total headings: ${headings.length}, Has H1: ${hasH1}, Skipped levels: ${skippedLevels}`);
    
  } catch (error) {
    console.error('Error testing accessibility:', error);
  }
  
  await page.close();
}

async function testEmptyStates(browser, issues) {
  console.log('\n=== TESTING: Empty States ===');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    // Try to access dashboard without data
    const dashboardPaths = ['/dashboard', '/units', '/leases', '/maintenance', '/payments', '/tenants'];
    
    for (const path of dashboardPaths) {
      try {
        console.log(`Testing empty state for: ${path}`);
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await delay(2000);
        
        await takeScreenshot(page, `17_empty_state_${path.replace('/', '')}`);
        
        // Check if it shows an empty state message
        const content = await page.content();
        const hasEmptyState = /no (units|leases|tenants|maintenance|payments|data)|empty|get started|add your first/i.test(content);
        
        if (!hasEmptyState && content.length < 1000) {
          issues.push({
            severity: 'Minor',
            component: `Empty State - ${path}`,
            description: `Page ${path} may not have a proper empty state design`,
            recommendation: 'Add helpful empty state messages with clear CTAs for new users'
          });
        }
        
      } catch (error) {
        console.log(`Path ${path} not accessible: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing empty states:', error);
  }
  
  await page.close();
}

async function generateReport(issues) {
  console.log('\n=== GENERATING REPORT ===');
  
  const timestamp = new Date().toISOString();
  const critical = issues.filter(i => i.severity === 'Critical');
  const major = issues.filter(i => i.severity === 'Major');
  const minor = issues.filter(i => i.severity === 'Minor');
  
  const report = `# LandlordBot User Testing Report
Generated: ${timestamp}

## Summary
- **Critical Issues:** ${critical.length}
- **Major Issues:** ${major.length}
- **Minor Issues:** ${minor.length}
- **Total Issues Found:** ${issues.length}

---

## Critical Issues (${critical.length})
${critical.map((issue, i) => `
### ${i + 1}. ${issue.component}
**Description:** ${issue.description}
${issue.details ? `**Details:** ${issue.details}` : ''}
${issue.recommendation ? `**Recommendation:** ${issue.recommendation}` : ''}
`).join('\n') || '*No critical issues found*'}

## Major Issues (${major.length})
${major.map((issue, i) => `
### ${i + 1}. ${issue.component}
**Description:** ${issue.description}
${issue.details ? `**Details:** ${issue.details}` : ''}
${issue.recommendation ? `**Recommendation:** ${issue.recommendation}` : ''}
`).join('\n') || '*No major issues found*'}

## Minor Issues (${minor.length})
${minor.map((issue, i) => `
### ${i + 1}. ${issue.component}
**Description:** ${issue.description}
${issue.details ? `**Details:** ${issue.details}` : ''}
${issue.recommendation ? `**Recommendation:** ${issue.recommendation}` : ''}
`).join('\n') || '*No minor issues found*'}

---

## Testing Details
- **Base URL:** ${BASE_URL}
- **Browser:** Chromium (Playwright)
- **Viewports Tested:** Mobile (320px-425px), Tablet (768px), Desktop (1024px-1920px)
- **Screenshots:** Saved to ${SCREENSHOTS_DIR}

## Recommendations Summary
1. Prioritize fixing Critical issues before launch
2. Address Major issues within the next sprint
3. Minor issues can be addressed incrementally
4. Consider implementing automated accessibility testing
5. Add more comprehensive error handling

---
*Report generated by LandlordBot User Testing Suite*
`;

  const reportPath = path.join(__dirname, 'user-testing-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to: ${reportPath}`);
  
  return report;
}

async function main() {
  console.log('=====================================');
  console.log('LANDLORDBOT USER TESTING SUITE');
  console.log('=====================================');
  console.log(`Testing URL: ${BASE_URL}`);
  console.log('Screenshots will be saved to:', SCREENSHOTS_DIR);
  console.log('Starting tests...\n');
  
  const issues = [];
  
  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Run all tests
    await testLandingPage(browser, issues);
    await testAuthFlows(browser, issues);
    await testOnboarding(browser, issues);
    await testResponsiveDesign(browser, issues);
    await testLoadingStates(browser, issues);
    await testAccessibility(browser, issues);
    await testEmptyStates(browser, issues);
    
    // Generate report
    const report = await generateReport(issues);
    
    console.log('\n=====================================');
    console.log('TESTING COMPLETED');
    console.log('=====================================');
    console.log(`\nTotal Issues Found: ${issues.length}`);
    console.log(`Critical: ${issues.filter(i => i.severity === 'Critical').length}`);
    console.log(`Major: ${issues.filter(i => i.severity === 'Major').length}`);
    console.log(`Minor: ${issues.filter(i => i.severity === 'Minor').length}`);
    console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}`);
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
main().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
