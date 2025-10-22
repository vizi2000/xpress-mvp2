import { test, expect } from '@playwright/test';

test.describe('Deep Debug - Autocomplete Position and Chat Response', () => {

  test('Autocomplete: Check parent element overflow/clipping', async ({ page }) => {
    console.log('\n=== DEEP DEBUG: AUTOCOMPLETE POSITIONING ===\n');

    await page.goto('https://sendxpress.borg.tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and type in pickup field
    const pickupField = page.locator('input#pickup-address, input[placeholder*="odbioru"], input[name="pickup"]').first();
    await pickupField.click();
    await pickupField.fill('Krakowska');
    await page.waitForTimeout(2000);

    // Get detailed positioning info
    const positionInfo = await page.evaluate(() => {
      const suggestions = document.querySelector('.locationiq-suggestions');
      if (!suggestions) return { error: 'No suggestions element found' };

      const rect = suggestions.getBoundingClientRect();
      const computed = window.getComputedStyle(suggestions);

      // Check all parent elements for overflow issues
      let parent = suggestions.parentElement;
      const parents = [];
      while (parent && parent !== document.body) {
        const parentComputed = window.getComputedStyle(parent);
        parents.push({
          tag: parent.tagName,
          class: parent.className,
          overflow: parentComputed.overflow,
          overflowX: parentComputed.overflowX,
          overflowY: parentComputed.overflowY,
          position: parentComputed.position,
          zIndex: parentComputed.zIndex,
          height: parentComputed.height,
          maxHeight: parentComputed.maxHeight
        });
        parent = parent.parentElement;
      }

      return {
        suggestions: {
          rect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            isVisible: rect.width > 0 && rect.height > 0,
            isInViewport: rect.top >= 0 && rect.left >= 0 &&
                         rect.bottom <= window.innerHeight &&
                         rect.right <= window.innerWidth
          },
          computed: {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            position: computed.position,
            top: computed.top,
            left: computed.left,
            zIndex: computed.zIndex,
            transform: computed.transform
          },
          viewport: {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
          }
        },
        parents
      };
    });

    console.log('\n--- SUGGESTIONS POSITIONING ANALYSIS ---');
    console.log(JSON.stringify(positionInfo, null, 2));

    // Take screenshot with element highlighted
    await page.evaluate(() => {
      const suggestions = document.querySelector('.locationiq-suggestions');
      if (suggestions) {
        suggestions.style.border = '5px solid red !important';
        suggestions.style.boxShadow = '0 0 20px 10px red !important';
      }
    });

    await page.screenshot({
      path: 'test-results/deep-debug-01-highlighted.png',
      fullPage: true
    });
  });

  test('Chat: Find chat input and send message', async ({ page }) => {
    console.log('\n=== DEEP DEBUG: CHAT WIDGET INPUT ===\n');

    await page.goto('https://sendxpress.borg.tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click chat button
    const chatButton = page.locator('.chat-widget-button, .chat-button, button[class*="chat"]').first();
    await chatButton.click();
    await page.waitForTimeout(1500);

    // Find ALL input elements in the page
    const allInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      return inputs.map((input, idx) => ({
        index: idx,
        tag: input.tagName,
        type: input.type,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id,
        name: input.name,
        isVisible: window.getComputedStyle(input).display !== 'none' &&
                   window.getComputedStyle(input).visibility !== 'hidden',
        parentClass: input.parentElement?.className,
        grandParentClass: input.parentElement?.parentElement?.className
      }));
    });

    console.log('\n--- ALL INPUT ELEMENTS ON PAGE ---');
    console.log(JSON.stringify(allInputs, null, 2));

    // Try to find chat input by looking in chat container
    const chatInput = await page.evaluate(() => {
      const chatContainer = document.querySelector('.chat-container, .chat-widget, [class*="chat"]');
      if (!chatContainer) return { error: 'No chat container found' };

      const inputs = chatContainer.querySelectorAll('input, textarea');
      return Array.from(inputs).map(input => ({
        tag: input.tagName,
        type: input.type,
        className: input.className,
        placeholder: input.placeholder,
        display: window.getComputedStyle(input).display,
        visibility: window.getComputedStyle(input).visibility
      }));
    });

    console.log('\n--- INPUTS IN CHAT CONTAINER ---');
    console.log(JSON.stringify(chatInput, null, 2));

    // Try different selectors for chat input
    const selectors = [
      'input.chat-input',
      'textarea.chat-input',
      '.chat-input input',
      '.chat-input textarea',
      '.chat-container input[type="text"]',
      '.chat-widget input[type="text"]',
      'input[placeholder*="wiadomość"]',
      'input[placeholder*="message"]'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`\n✓ Found ${count} element(s) with selector: ${selector}`);

        // Try to interact with it
        try {
          const input = page.locator(selector).first();
          await input.fill('Witaj');
          await page.waitForTimeout(500);

          // Look for send button
          const sendButton = page.locator('button.send-button, button[type="submit"], .chat-send-button').first();
          await sendButton.click();
          await page.waitForTimeout(3000);

          // Check for response
          const messages = await page.evaluate(() => {
            const chatContainer = document.querySelector('.chat-container, .chat-widget, [class*="chat"]');
            if (!chatContainer) return [];

            const messageDivs = chatContainer.querySelectorAll('div[class*="message"]');
            return Array.from(messageDivs).map(div => ({
              className: div.className,
              textContent: div.textContent?.substring(0, 100),
              color: window.getComputedStyle(div).color,
              backgroundColor: window.getComputedStyle(div).backgroundColor,
              fontSize: window.getComputedStyle(div).fontSize
            }));
          });

          console.log('\n--- CHAT MESSAGES AFTER SENDING ---');
          console.log(JSON.stringify(messages, null, 2));

          await page.screenshot({
            path: 'test-results/deep-debug-02-chat-response.png',
            fullPage: true
          });

          break;
        } catch (err) {
          console.log(`  ✗ Failed to interact with ${selector}: ${err.message}`);
        }
      }
    }
  });
});
