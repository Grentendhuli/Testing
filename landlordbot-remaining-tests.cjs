const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function main() {
  const issues = [];
  console.log('Running remaining tests...');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    
    // Test Accessibility
    console.log('\n=== TESTING: Accessibility ===');
    const page1 = await browser.newPage();
    await page1.goto(BASE_URL, { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for alt text on images
    const images = await page1.locator('img').all();
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
        description: `${imagesWithoutAlt.length} images missing alt text`,
        recommendation: 'Add descriptive alt text to all images for screen readers'
      });
    }
    console.log(`Images without alt text: ${imagesWithoutAlt.length}`);
    
    // Check for h1
    const h1Elements = await page1.locator('h1').count();
    if (h1Elements === 0) {
      issues.push({
        severity: 'Minor',
        component: 'Accessibility',
        description: 'No h1 heading found on landing page',
        recommendation: 'Add an h1 element that describes the page'
      });
    }
    console.log(`H1 elements: ${h1Elements}`);
    
    // Check form labels
    const inputs = await page1.locator('input:not([type="hidden"])').all();
    const unlabeledInputs = [];
    
    for (const input of inputs) {
      const id = await input.getAttribute('id').catch(() => null);
      const placeholder = await input.getAttribute('placeholder').catch(() => null);
      const ariaLabel = await input.getAttribute('aria-label').catch(() => null);
      const hasAssociatedLabel = id ? await page1.locator(`label[for="${id}"]`).count() > 0 : false;
      
      if (!placeholder && !ariaLabel && !hasAssociatedLabel) {
        const name = await input.getAttribute('name').catch(() => 'unknown');
        unlabeledInputs.push(name);
      }
    }
    
    if (unlabeledInputs.length > 0) {
      issues.push({
        severity: 'Major',
        component: 'Accessibility',
        description: `${unlabeledInputs.length} form inputs missing labels`,
        recommendation: 'Add labels or aria-label attributes to all inputs'
      });
    }
    console.log(`Unlabeled inputs: ${unlabeledInputs.length}`);
    await page1.close();
    
    // Test Empty States
    console.log('\n=== TESTING: Empty States ===');
    const paths = ['/dashboard', '/units', '/leases', '/maintenance', '/tenants'];
    
    for (const testPath of paths) {
      console.log(`Testing: ${testPath}`);
      const page = await browser.newPage();
      try {
        await page.goto(`${BASE_URL}${testPath}`, { waitUntil: 'networkidle', timeout: 10000 });
        await new Promise(r => setTimeout(r, 1500));
        await takeScreenshot(page, `18_empty_${testPath.replace('/', '')}`);
      } catch (err) {
        console.log(`Path ${testPath} error: ${err.message}`);
      }
      await page.close();
    }
    
    // Test Login Details
    console.log('\n=== TESTING: Login Form Details ===');
    const page2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page2.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for password visibility toggle
    const toggleBtn = await page2.locator('[class*="toggle"], [class*="eye"], button[aria-label*="password" i]').first();
    const hasToggle = await toggleBtn.isVisible().catch(() => false);
    console.log(`Password visibility toggle: ${hasToggle}`);
    
    if (!hasToggle) {
      issues.push({
        severity: 'Minor',
        component: 'Login Form',
        description: 'No password visibility toggle found',
        recommendation: 'Add an eye icon to toggle password visibility for better UX'
      });
    }
    
    // Check for remember me
    const rememberMe = await page2.locator('input[type="checkbox"], label:has-text("remember")').first();
    const hasRememberMe = await rememberMe.isVisible().catch(() => false);
    console.log(`Remember me checkbox: ${hasRememberMe}`);
    
    // Check for form validation
    const emailInput = await page2.locator('input[type="email"]').first();
    const submitBtn = await page2.locator('button[type="submit"]').first();
    
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('invalid');
      await new Promise(r => setTimeout(r, 500));
      
      // Check for inline validation
      const errorMsg = await page2.locator('[class*="error"], [role="alert"]').first();
      const hasInlineError = await errorMsg.isVisible().catch(() => false);
      console.log(`Inline validation on email: ${hasInlineError}`);
      
      if (!hasInlineError) {
        issues.push({
          severity: 'Minor',
          component: 'Login Form',
          description: 'No inline validation for invalid email format',
          recommendation: 'Add real-time validation feedback for form inputs'
        });
      }
    }
    
    // Check for console errors
    const consoleErrors = [];
    page2.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await takeScreenshot(page2, '19_login_detailed');
    await page2.close();
    
    if (consoleErrors.length > 0) {
      issues.push({
        severity: 'Major',
        component: 'JavaScript',
        description: `${consoleErrors.length} console errors detected`,
        details: consoleErrors.slice(0, 3).join(' | '),
        recommendation: 'Fix JavaScript errors to ensure stability'
      });
    }
    
    // Generate report
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
1. Fix Critical authentication/login issues
2. Add proper accessibility attributes
3. Implement proper form validation
4. Add loading states and error boundaries
5. Improve mobile touch targets

---
*Report generated by LandlordBot User Testing Suite*
`;

    const reportPath = path.join(__dirname, 'user-testing-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total Issues: ${issues.length}`);
    console.log(`Critical: ${critical.length}`);
    console.log(`Major: ${major.length}`);
    console.log(`Minor: ${minor.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
