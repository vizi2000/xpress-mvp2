import { test, expect } from '@playwright/test';

test('autocomplete dropdown visual debug', async ({ page }) => {
  await page.goto('https://sendxpress.borg.tools/');
  await page.waitForLoadState('networkidle');

  const pickupInput = page.locator('#pickup-address');

  // Type address
  await pickupInput.fill('Warsz');

  // Wait longer for API response
  await page.waitForTimeout(3000);

  // Take screenshot BEFORE checking visibility
  await page.screenshot({
    path: '/tmp/autocomplete-before.png',
    fullPage: false
  });

  // Now wait for dropdown
  const dropdown = page.locator('.locationiq-suggestions');

  try {
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Dropdown is visible');
  } catch (e) {
    console.log('❌ Dropdown not visible:', e.message);
  }

  // Check computed styles
  const styles = await dropdown.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      zIndex: computed.zIndex,
      top: computed.top,
      left: computed.left,
      width: computed.width,
      height: computed.height
    };
  });

  console.log('Dropdown computed styles:', styles);

  // Check suggestions count
  const items = page.locator('.suggestion-item');
  const count = await items.count();
  console.log('Suggestions count:', count);

  // Take screenshot AFTER waiting
  await page.screenshot({
    path: '/tmp/autocomplete-after.png',
    fullPage: false
  });

  // If dropdown is visible, log first suggestion
  if (count > 0) {
    const firstText = await items.first().textContent();
    console.log('First suggestion:', firstText);
  }
});
