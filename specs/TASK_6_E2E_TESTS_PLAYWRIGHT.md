# Task 6: E2E Tests with Playwright

## Problem Statement
The application has no automated end-to-end tests. We need comprehensive E2E tests to verify:
1. LocationIQ autocomplete functionality
2. Price calculation with coordinates
3. Order creation with valid API payload
4. Full user flow from address entry to order confirmation

## Objective
Create Playwright E2E test suite covering critical user journeys.

## Prerequisites
- Tasks 1-4 must be completed and deployed
- Playwright must be installed
- Test environment: https://sendxpress.borg.tools

## Files to Create

### 1. Playwright Configuration
**Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/playwright.config.js`

### 2. Test Suite
**Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/tests/e2e/order-flow.spec.js`

### 3. Package.json Scripts
**Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/package.json` (update)

## Implementation Details

### Step 1: Install Playwright

```bash
npm init -y  # If package.json doesn't exist
npm install -D @playwright/test
npx playwright install chromium
```

### Step 2: Create Playwright Config

**File**: `playwright.config.js`
```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E tests
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'https://sendxpress.borg.tools',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      }
    }
  ]
});
```

### Step 3: Create Test Suite

**File**: `tests/e2e/order-flow.spec.js`

```javascript
import { test, expect } from '@playwright/test';

// Test data
const TEST_ADDRESSES = {
  pickup: {
    search: 'kolumba wro',
    expected: 'Krzysztofa Kolumba',
    city: 'Wrocław'
  },
  delivery: {
    search: 'sucha wro',
    expected: 'Sucha',
    city: 'Wrocław'
  }
};

const TEST_CONTACT = {
  senderName: 'Jan Testowy',
  senderEmail: 'jan.testowy@example.com',
  senderPhone: '123456789',
  recipientName: 'Maria Testowa',
  recipientEmail: 'maria.testowa@example.com',
  recipientPhone: '987654321'
};

test.describe('Order Flow E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Xpress.Delivery');
  });

  /**
   * Test 1: LocationIQ Autocomplete Functionality
   * Verifies that autocomplete dropdown appears and displays suggestions
   */
  test('should display LocationIQ autocomplete suggestions', async ({ page }) => {
    const pickupInput = page.locator('#pickup-address');

    // Type pickup address
    await pickupInput.fill(TEST_ADDRESSES.pickup.search);

    // Wait for autocomplete dropdown to appear
    await page.waitForSelector('.locationiq-suggestions', { timeout: 5000 });

    // Check that suggestions are visible
    const suggestions = page.locator('.suggestion-item');
    const count = await suggestions.count();

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5); // LocationIQ returns max 5

    // Verify suggestion contains expected text
    const firstSuggestion = suggestions.first();
    const text = await firstSuggestion.textContent();

    expect(text).toContain(TEST_ADDRESSES.pickup.expected);
    expect(text).toContain(TEST_ADDRESSES.pickup.city);
  });

  /**
   * Test 2: Autocomplete Selection
   * Verifies that clicking a suggestion fills the input field
   */
  test('should fill input when autocomplete suggestion is clicked', async ({ page }) => {
    const pickupInput = page.locator('#pickup-address');

    await pickupInput.fill(TEST_ADDRESSES.pickup.search);
    await page.waitForSelector('.locationiq-suggestions');

    // Click first suggestion
    const firstSuggestion = page.locator('.suggestion-item').first();
    const suggestionText = await firstSuggestion.textContent();
    await firstSuggestion.click();

    // Verify input is filled
    const inputValue = await pickupInput.inputValue();
    expect(inputValue).toBe(suggestionText);

    // Verify dropdown is hidden
    const dropdown = page.locator('.locationiq-suggestions');
    await expect(dropdown).toBeHidden();
  });

  /**
   * Test 3: Price Calculation with Coordinates
   * Verifies that price calculation works and saves coordinates
   */
  test('should calculate price and save coordinates', async ({ page }) => {
    // Fill pickup address
    const pickupInput = page.locator('#pickup-address');
    await pickupInput.fill(TEST_ADDRESSES.pickup.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    // Fill delivery address
    const deliveryInput = page.locator('#delivery-address');
    await deliveryInput.fill(TEST_ADDRESSES.delivery.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    // Wait for price calculation
    await page.waitForSelector('#distance-display:not(:empty)', { timeout: 10000 });

    // Verify distance is displayed
    const distance = await page.locator('#distance-display').textContent();
    expect(distance).toMatch(/\d+\.\d+\s*km/);

    // Verify prices are displayed
    const priceSmall = await page.locator('#price-small').textContent();
    expect(priceSmall).toMatch(/\d+\s*zł/);

    // Verify coordinates are saved in orderData (via console)
    const orderData = await page.evaluate(() => window.xpressApp?.orderData);

    expect(orderData).toBeDefined();
    expect(orderData.pickupCoords).toBeDefined();
    expect(orderData.deliveryCoords).toBeDefined();
    expect(orderData.pickupCoords.lat).toBeCloseTo(51.1, 0); // Wrocław area
    expect(orderData.pickupCoords.lng).toBeCloseTo(17.0, 0);
  });

  /**
   * Test 4: Order Creation API Request Format
   * Verifies that order creation sends correct payload with lat/lng
   */
  test('should send order with coordinates to API', async ({ page }) => {
    // Intercept API request
    let orderPayload = null;

    page.on('request', request => {
      if (request.url().includes('/api/order/create')) {
        orderPayload = request.postDataJSON();
      }
    });

    // Fill addresses
    await page.locator('#pickup-address').fill(TEST_ADDRESSES.pickup.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    await page.locator('#delivery-address').fill(TEST_ADDRESSES.delivery.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    // Wait for price calculation
    await page.waitForSelector('#distance-display:not(:empty)');

    // Select package
    await page.locator('input[name="package"][value="small"]').click();

    // Fill contact form
    await page.locator('#sender-name').fill(TEST_CONTACT.senderName);
    await page.locator('#sender-email').fill(TEST_CONTACT.senderEmail);
    await page.locator('#sender-phone').fill(TEST_CONTACT.senderPhone);
    await page.locator('#recipient-name').fill(TEST_CONTACT.recipientName);
    await page.locator('#recipient-email').fill(TEST_CONTACT.recipientEmail);
    await page.locator('#recipient-phone').fill(TEST_CONTACT.recipientPhone);

    // Submit order
    await page.locator('.btn-order').click();

    // Wait for API request
    await page.waitForTimeout(3000);

    // Verify payload structure
    if (orderPayload) {
      expect(orderPayload.clientAddress).toBeDefined();
      expect(orderPayload.clientAddress.lat).toBeDefined();
      expect(orderPayload.clientAddress.lng).toBeDefined();
      expect(orderPayload.clientAddress.formatted).toContain(TEST_ADDRESSES.delivery.city);

      expect(orderPayload.pickupPoint).toBeDefined();
      expect(orderPayload.pickupPoint.address).toBeDefined();
      expect(orderPayload.pickupPoint.address.lat).toBeDefined();
      expect(orderPayload.pickupPoint.address.lng).toBeDefined();
      expect(orderPayload.pickupPoint.address.formatted).toContain(TEST_ADDRESSES.pickup.city);

      // Verify coordinates are numbers
      expect(typeof orderPayload.clientAddress.lat).toBe('number');
      expect(typeof orderPayload.clientAddress.lng).toBe('number');
      expect(typeof orderPayload.pickupPoint.address.lat).toBe('number');
      expect(typeof orderPayload.pickupPoint.address.lng).toBe('number');
    }
  });

  /**
   * Test 5: Mock Order ObjectId Format
   * Verifies that fallback mock order uses correct ObjectId format
   */
  test('should generate valid MongoDB ObjectId for mock orders', async ({ page }) => {
    // Block real API to force mock order
    await page.route('**/api/order/create', route =>
      route.abort('failed')
    );

    // Fill form (same as test 4)
    await page.locator('#pickup-address').fill(TEST_ADDRESSES.pickup.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    await page.locator('#delivery-address').fill(TEST_ADDRESSES.delivery.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    await page.waitForSelector('#distance-display:not(:empty)');
    await page.locator('input[name="package"][value="small"]').click();

    await page.locator('#sender-name').fill(TEST_CONTACT.senderName);
    await page.locator('#sender-email').fill(TEST_CONTACT.senderEmail);
    await page.locator('#sender-phone').fill(TEST_CONTACT.senderPhone);
    await page.locator('#recipient-name').fill(TEST_CONTACT.recipientName);
    await page.locator('#recipient-email').fill(TEST_CONTACT.recipientEmail);
    await page.locator('#recipient-phone').fill(TEST_CONTACT.recipientPhone);

    await page.locator('.btn-order').click();

    // Wait for thank you page
    await page.waitForSelector('.page-thank-you', { timeout: 15000 });

    // Get order ID from page or orderData
    const orderData = await page.evaluate(() => window.xpressApp?.orderData);
    const orderId = orderData.orderId;

    // Verify ObjectId format: 24 hex characters
    expect(orderId).toMatch(/^[a-f0-9]{24}$/);
    expect(orderId.length).toBe(24);
  });

  /**
   * Test 6: Full Happy Path E2E
   * Complete user journey from start to finish
   */
  test('should complete full order flow successfully', async ({ page }) => {
    // Step 1: Enter pickup address
    await page.locator('#pickup-address').fill(TEST_ADDRESSES.pickup.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    // Step 2: Enter delivery address
    await page.locator('#delivery-address').fill(TEST_ADDRESSES.delivery.search);
    await page.waitForSelector('.locationiq-suggestions');
    await page.locator('.suggestion-item').first().click();

    // Step 3: Wait for price calculation
    await page.waitForSelector('#distance-display:not(:empty)');
    const distance = await page.locator('#distance-display').textContent();
    expect(distance).toBeTruthy();

    // Step 4: Select package
    await page.locator('input[name="package"][value="medium"]').click();
    const priceDisplay = await page.locator('#price-medium').textContent();
    expect(priceDisplay).toMatch(/\d+/);

    // Step 5: Fill contact information
    await page.locator('#sender-name').fill(TEST_CONTACT.senderName);
    await page.locator('#sender-email').fill(TEST_CONTACT.senderEmail);
    await page.locator('#sender-phone').fill(TEST_CONTACT.senderPhone);
    await page.locator('#recipient-name').fill(TEST_CONTACT.recipientName);
    await page.locator('#recipient-email').fill(TEST_CONTACT.recipientEmail);
    await page.locator('#recipient-phone').fill(TEST_CONTACT.recipientPhone);

    // Step 6: Submit order
    await page.locator('.btn-order').click();

    // Step 7: Verify thank you page
    await page.waitForSelector('.page-thank-you', { visible: true, timeout: 15000 });

    const thankYouTitle = await page.locator('.page-thank-you h2').textContent();
    expect(thankYouTitle).toContain('Dziękujemy');

    // Step 8: Verify order details are displayed
    const orderNumber = await page.locator('.order-number').textContent();
    expect(orderNumber).toMatch(/MO-|XD-/); // Mock or real order prefix

    // Step 9: Verify confirmation emails mentioned
    const emailText = await page.locator('.page-thank-you').textContent();
    expect(emailText).toContain(TEST_CONTACT.senderEmail);
    expect(emailText).toContain(TEST_CONTACT.recipientEmail);
  });

});
```

### Step 4: Update package.json

Add test scripts:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

## Running Tests

### Local Development:
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### CI/CD:
```bash
# In GitHub Actions or similar
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
```

## Expected Test Results

### All Tests Should Pass:
```
✓ should display LocationIQ autocomplete suggestions (3s)
✓ should fill input when autocomplete suggestion is clicked (2s)
✓ should calculate price and save coordinates (5s)
✓ should send order with coordinates to API (8s)
✓ should generate valid MongoDB ObjectId for mock orders (10s)
✓ should complete full order flow successfully (12s)

6 passed (40s)
```

## Success Criteria
- ✅ All 6 E2E tests pass consistently
- ✅ Tests cover critical user paths
- ✅ Tests verify coordinates are saved and sent to API
- ✅ Tests verify mock ObjectId format
- ✅ Tests run in under 60 seconds total
- ✅ Tests can run in CI/CD pipeline

## Dependencies
- **Requires**: Tasks 1-4 completed and deployed
- **Blocks**: None (this is final verification)

## Troubleshooting

### Test Failures:

1. **Timeout waiting for suggestions**:
   - Increase timeout: `{ timeout: 10000 }`
   - Check LocationIQ API key is valid
   - Verify network is working

2. **Coordinates not found**:
   - Verify Tasks 1-2 are deployed
   - Check `window.xpressApp.orderData` in console

3. **API request not intercepted**:
   - Check URL pattern in `page.on('request')`
   - Verify request is actually made

4. **ObjectId format failure**:
   - Verify Task 4 is deployed
   - Check mock order generator code

## Maintenance
- Update test data if cities change
- Adjust selectors if HTML changes
- Review test coverage quarterly

---
**Status**: Ready for implementation (AFTER Tasks 1-5)
**Estimated time**: 30 minutes (setup + write tests)
**Risk level**: LOW (tests don't affect production)
**Priority**: HIGH (validates all fixes work together)
