import { test, expect } from '@playwright/test';

test('autocomplete dropdown - check z-index and color contrast', async ({ page }) => {
  await page.goto('https://sendxpress.borg.tools/');
  await page.waitForLoadState('networkidle');

  const pickupInput = page.locator('#pickup-address');
  await pickupInput.fill('Warsz');
  await page.waitForTimeout(3000);

  const dropdown = page.locator('.locationiq-suggestions');
  await dropdown.waitFor({ state: 'visible', timeout: 5000 });

  // Get ALL computed styles including background
  const allStyles = await dropdown.evaluate(el => {
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      zIndex: computed.zIndex,
      position: computed.position,
      top: computed.top,
      left: computed.left,
      width: computed.width,
      height: computed.height,
      background: computed.background,
      backgroundColor: computed.backgroundColor,
      border: computed.border,
      borderColor: computed.borderColor,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    };
  });

  console.log('Complete dropdown styles:', JSON.stringify(allStyles, null, 2));

  // Check first suggestion item styles
  const firstItem = page.locator('.suggestion-item').first();
  const itemStyles = await firstItem.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      padding: computed.padding,
      fontSize: computed.fontSize
    };
  });

  console.log('First item styles:', JSON.stringify(itemStyles, null, 2));

  // Get text content
  const text = await firstItem.textContent();
  console.log('First item text:', text);

  // Take screenshot with dropdown highlighted
  await page.screenshot({
    path: '/tmp/autocomplete-final.png',
    fullPage: false
  });

  // Also take a screenshot with the dropdown element outlined
  await page.evaluate(() => {
    const dropdown = document.querySelector('.locationiq-suggestions');
    if (dropdown) {
      dropdown.style.outline = '5px solid red';
    }
  });

  await page.screenshot({
    path: '/tmp/autocomplete-outlined.png',
    fullPage: false
  });
});
