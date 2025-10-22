import { test } from '@playwright/test';

test('autocomplete dropdown - scroll to view', async ({ page }) => {
  await page.goto('https://sendxpress.borg.tools/');
  await page.waitForLoadState('networkidle');

  const pickupInput = page.locator('#pickup-address');

  // Scroll input into view
  await pickupInput.scrollIntoViewIfNeeded();

  await pickupInput.fill('Warsz');
  await page.waitForTimeout(3000);

  const dropdown = page.locator('.locationiq-suggestions');
  await dropdown.waitFor({ state: 'visible', timeout: 5000 });

  // Scroll dropdown into view
  await dropdown.scrollIntoViewIfNeeded();

  // Wait a bit for scroll to complete
  await page.waitForTimeout(500);

  // Highlight dropdown
  await page.evaluate(() => {
    const dropdown = document.querySelector('.locationiq-suggestions');
    if (dropdown) {
      dropdown.style.outline = '10px solid red';
      dropdown.style.outlineOffset = '-5px';
    }
  });

  // Take screenshot
  await page.screenshot({
    path: '/tmp/autocomplete-scrolled.png',
    fullPage: true  // Full page to see everything
  });

  console.log('✅ Screenshot saved with dropdown scrolled into view');
});
