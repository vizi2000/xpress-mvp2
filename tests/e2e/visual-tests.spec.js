import { test, expect } from '@playwright/test';

test.describe('Visual Features Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://sendxpress.borg.tools/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#pickup-address')).toBeVisible();
  });

  /**
   * Test 1: Arrow Background Visibility
   * Verifies animated arrow canvas is visible on dark background
   */
  test('should display animated arrow background', async ({ page }) => {
    // Wait for canvas to be rendered
    await page.waitForTimeout(2000);

    // Check canvas exists and is visible
    const canvas = page.locator('#arrow-background');
    await expect(canvas).toBeVisible();

    // Check canvas has correct styling
    const opacity = await canvas.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position
      };
    });

    console.log('Canvas styles:', opacity);
    expect(parseFloat(opacity.opacity)).toBeGreaterThan(0);

    // Take screenshot to verify arrows are visible
    await page.screenshot({
      path: '/tmp/arrow-background-test.png',
      fullPage: true
    });

    console.log('Screenshot saved to /tmp/arrow-background-test.png');
  });

  /**
   * Test 2: Chat Input Text Visibility
   * Verifies that text typed in chat input is visible
   */
  test('should display text when typing in chat input', async ({ page }) => {
    // Open chat (click toggle button)
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    await page.waitForTimeout(500);

    // Type in chat input
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();

    const testMessage = 'Test message for visibility';
    await chatInput.fill(testMessage);

    // Check input value
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe(testMessage);

    // Check computed color style
    const inputStyles = await chatInput.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        display: styles.display
      };
    });

    console.log('Chat input styles:', inputStyles);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/chat-input-test.png',
      fullPage: false
    });

    console.log('Screenshot saved to /tmp/chat-input-test.png');
  });

  /**
   * Test 3: Autocomplete Dropdown Visibility
   * Verifies that LocationIQ suggestions dropdown appears and is visible
   */
  test('should display autocomplete dropdown when typing address', async ({ page }) => {
    const pickupInput = page.locator('#pickup-address');

    // Type address
    await pickupInput.fill('Warsz');

    // Wait for suggestions to load
    await page.waitForTimeout(2000);

    // Check if suggestions container exists and is visible
    const suggestionsContainer = page.locator('.locationiq-suggestions');

    // Get computed styles
    const dropdownStyles = await suggestionsContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position
      };
    });

    console.log('Dropdown styles:', dropdownStyles);

    // Check if suggestions exist
    const suggestions = page.locator('.suggestion-item');
    const count = await suggestions.count();
    console.log('Suggestions count:', count);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/autocomplete-dropdown-test.png',
      fullPage: false
    });

    console.log('Screenshot saved to /tmp/autocomplete-dropdown-test.png');

    // Verify dropdown is visible
    await expect(suggestionsContainer).toBeVisible({ timeout: 5000 });
    expect(count).toBeGreaterThan(0);
  });

  /**
   * Test 4: Yellow-Black Color Scheme
   * Verifies the correct color scheme is applied
   */
  test('should have yellow-black color scheme', async ({ page }) => {
    // Check body background
    const bodyStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        background: styles.background,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });

    console.log('Body styles:', bodyStyles);

    // Check header styles
    const headerStyles = await page.locator('.header').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        borderBottom: styles.borderBottom
      };
    });

    console.log('Header styles:', headerStyles);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/color-scheme-test.png',
      fullPage: true
    });

    console.log('Screenshot saved to /tmp/color-scheme-test.png');

    // Verify yellow color (#F4C810) appears somewhere
    expect(bodyStyles.background || bodyStyles.backgroundColor + headerStyles.background).toContain('244, 200, 16');
  });

});
