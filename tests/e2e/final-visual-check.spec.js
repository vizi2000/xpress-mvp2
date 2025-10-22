import { test, expect } from '@playwright/test';

test('Visual check: Chat response pink dot issue', async ({ page }) => {
  console.log('\n=== FINAL VISUAL CHECK: CHAT RESPONSE ===\n');

  await page.goto('https://sendxpress.borg.tools');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Open chat
  await page.click('#chat-toggle');
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'test-results/visual-01-chat-opened.png',
    fullPage: true
  });

  // Type message
  await page.fill('#chat-input', 'Witaj');
  await page.waitForTimeout(500);

  // Click send button
  await page.click('#chat-send');
  await page.waitForTimeout(3000);

  // Take screenshot showing response
  await page.screenshot({
    path: 'test-results/visual-02-after-send.png',
    fullPage: true
  });

  // Get all chat messages and their styles
  const chatMessages = await page.evaluate(() => {
    const messages = document.querySelectorAll('.chat-message');
    return Array.from(messages).map((msg, idx) => {
      const bubble = msg.querySelector('.message-bubble');
      const bubbleStyles = bubble ? window.getComputedStyle(bubble) : null;

      return {
        index: idx,
        className: msg.className,
        textContent: msg.textContent?.substring(0, 200),
        textLength: msg.textContent?.length,
        bubble: bubbleStyles ? {
          color: bubbleStyles.color,
          backgroundColor: bubbleStyles.backgroundColor,
          fontSize: bubbleStyles.fontSize,
          padding: bubbleStyles.padding,
          display: bubbleStyles.display,
          width: bubbleStyles.width,
          height: bubbleStyles.height
        } : null
      };
    });
  });

  console.log('\n--- ALL CHAT MESSAGES ---');
  console.log(JSON.stringify(chatMessages, null, 2));
});
