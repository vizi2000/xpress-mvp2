import { test } from '@playwright/test';

test('chat response test - send message and check response', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Browser ${type}]`, text);
  });

  await page.goto('https://sendxpress.borg.tools/');
  await page.waitForLoadState('networkidle');

  // Open chat
  const chatToggle = page.locator('#chat-toggle');
  await chatToggle.click();
  await page.waitForTimeout(1000);

  // Type message
  const chatInput = page.locator('#chat-input');
  await chatInput.fill('halo');

  // Screenshot before sending
  await page.screenshot({
    path: '/tmp/chat-before-send.png',
  });

  // Click send button
  const sendButton = page.locator('button[type="submit"]').last();
  await sendButton.click();

  // Wait for response
  await page.waitForTimeout(5000);

  // Screenshot after sending
  await page.screenshot({
    path: '/tmp/chat-after-send.png',
  });

  // Check if response appeared
  const messages = page.locator('.message');
  const count = await messages.count();
  console.log('Total messages:', count);

  // Get last message
  if (count > 0) {
    const lastMessage = messages.last();
    const text = await lastMessage.textContent();
    console.log('Last message:', text);
  }
});
