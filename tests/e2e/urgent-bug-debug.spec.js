import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('URGENT: Autocomplete and Chat Widget Debug', () => {

  test('Issue 1: Debug Autocomplete Visibility', async ({ page }) => {
    console.log('\n=== DEBUGGING AUTOCOMPLETE ISSUE ===\n');

    // Navigate to production site
    await page.goto('https://sendxpress.borg.tools');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/debug-01-initial-page.png',
      fullPage: true
    });

    // Find pickup address field
    const pickupField = page.locator('input#pickup-address, input[placeholder*="odbioru"], input[name="pickup"]').first();
    await pickupField.waitFor({ state: 'visible', timeout: 5000 });

    console.log('Found pickup field, clicking to focus...');
    await pickupField.click();
    await page.waitForTimeout(500);

    // Type address to trigger autocomplete
    console.log('Typing "Krakowska"...');
    await pickupField.fill('');
    await pickupField.type('Krakowska', { delay: 100 });

    // Wait for suggestions to be generated
    await page.waitForTimeout(2000);

    // Check if suggestions container exists
    const suggestionsContainer = page.locator('.locationiq-suggestions, .suggestions, [class*="suggestion"]').first();
    const containerExists = await suggestionsContainer.count() > 0;

    console.log(`\nSuggestions container exists: ${containerExists}`);

    if (containerExists) {
      // Get all details about the suggestions container
      const containerStyles = await suggestionsContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: computed.position,
          zIndex: computed.zIndex,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          height: computed.height,
          maxHeight: computed.maxHeight,
          overflow: computed.overflow,
          backgroundColor: computed.backgroundColor,
          border: computed.border,
          transform: computed.transform,
          className: el.className,
          innerHTML: el.innerHTML.substring(0, 500) // First 500 chars
        };
      });

      console.log('\n--- SUGGESTIONS CONTAINER STYLES ---');
      console.log(JSON.stringify(containerStyles, null, 2));

      // Check for suggestion items
      const suggestionItems = page.locator('.suggestion-item, .locationiq-suggestion, [class*="suggestion"]');
      const itemCount = await suggestionItems.count();
      console.log(`\nNumber of suggestion items found: ${itemCount}`);

      if (itemCount > 0) {
        const firstItemStyle = await suggestionItems.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            textContent: el.textContent,
            className: el.className
          };
        });
        console.log('\n--- FIRST SUGGESTION ITEM ---');
        console.log(JSON.stringify(firstItemStyle, null, 2));
      }
    } else {
      console.log('⚠️ No suggestions container found in DOM!');
    }

    // Take screenshot showing the issue
    await page.screenshot({
      path: 'test-results/debug-02-autocomplete-typed.png',
      fullPage: true
    });

    // Get console logs
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    // Check all elements with "suggestion" in class name
    const allSuggestionElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.className && el.className.toString().toLowerCase().includes('suggest')
      );
      return elements.map(el => ({
        tag: el.tagName,
        class: el.className,
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
        innerHTML: el.innerHTML.substring(0, 200)
      }));
    });

    console.log('\n--- ALL ELEMENTS WITH "SUGGEST" IN CLASS ---');
    console.log(JSON.stringify(allSuggestionElements, null, 2));
  });

  test('Issue 2: Debug Chat Widget Response', async ({ page }) => {
    console.log('\n=== DEBUGGING CHAT WIDGET ISSUE ===\n');

    await page.goto('https://sendxpress.borg.tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for chat widget button/icon
    const chatButton = page.locator('.chat-widget-button, .chat-button, .chat-toggle, [class*="chat"]').first();
    const chatExists = await chatButton.count() > 0;

    console.log(`Chat widget button exists: ${chatExists}`);

    if (chatExists) {
      // Open chat
      await chatButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of open chat
      await page.screenshot({
        path: 'test-results/debug-03-chat-opened.png',
        fullPage: true
      });

      // Find chat input
      const chatInput = page.locator('input[type="text"].chat-input, textarea.chat-input, .chat-input input, .chat-input textarea').first();
      const inputExists = await chatInput.count() > 0;

      console.log(`Chat input exists: ${inputExists}`);

      if (inputExists) {
        // Type message
        await chatInput.fill('Witaj');
        await page.waitForTimeout(500);

        // Find and click send button
        const sendButton = page.locator('button.send-button, .chat-send, [class*="send"]').first();
        await sendButton.click();

        // Wait for response
        await page.waitForTimeout(3000);

        // Take screenshot showing pink dot issue
        await page.screenshot({
          path: 'test-results/debug-04-chat-response.png',
          fullPage: true
        });

        // Check for message bubbles
        const messageBubbles = page.locator('.message-bubble, .chat-message, [class*="message"]');
        const messageCount = await messageBubbles.count();

        console.log(`\nNumber of message bubbles: ${messageCount}`);

        // Get details about assistant messages
        const assistantMessages = page.locator('.message-bubble.assistant, .chat-message.assistant, [class*="assistant"]');
        const assistantCount = await assistantMessages.count();

        console.log(`Number of assistant messages: ${assistantCount}`);

        if (assistantCount > 0) {
          const assistantStyles = await assistantMessages.first().evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
              width: computed.width,
              height: computed.height,
              padding: computed.padding,
              textContent: el.textContent,
              innerHTML: el.innerHTML.substring(0, 300),
              className: el.className
            };
          });

          console.log('\n--- ASSISTANT MESSAGE STYLES ---');
          console.log(JSON.stringify(assistantStyles, null, 2));

          // Check if text color matches background (invisible text issue)
          const isTextInvisible = assistantStyles.color === assistantStyles.backgroundColor;
          console.log(`\n⚠️ Text invisible (color matches background): ${isTextInvisible}`);
        }

        // Get all elements in chat area
        const chatElements = await page.evaluate(() => {
          const chatContainer = document.querySelector('.chat-container, .chat-widget, [class*="chat"]');
          if (!chatContainer) return [];

          const allElements = Array.from(chatContainer.querySelectorAll('*'));
          return allElements.slice(0, 20).map(el => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.substring(0, 100),
            color: window.getComputedStyle(el).color,
            bg: window.getComputedStyle(el).backgroundColor
          }));
        });

        console.log('\n--- CHAT ELEMENTS ---');
        console.log(JSON.stringify(chatElements, null, 2));
      }
    }
  });

  test('Issue 3: Find Google Maps References', async ({ page }) => {
    console.log('\n=== CHECKING GOOGLE MAPS LOADING ===\n');

    // Listen for all network requests
    const googleMapsRequests = [];
    page.on('request', request => {
      if (request.url().includes('googleapis.com') || request.url().includes('maps.google')) {
        googleMapsRequests.push(request.url());
      }
    });

    await page.goto('https://sendxpress.borg.tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n--- GOOGLE MAPS REQUESTS ---');
    console.log(`Found ${googleMapsRequests.length} requests to Google Maps:`);
    googleMapsRequests.forEach(url => console.log(`  - ${url}`));

    // Check for Google Maps script tags
    const scriptTags = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts
        .filter(s => s.src && (s.src.includes('googleapis.com') || s.src.includes('maps.google')))
        .map(s => ({
          src: s.src,
          async: s.async,
          defer: s.defer
        }));
    });

    console.log('\n--- GOOGLE MAPS SCRIPT TAGS ---');
    console.log(JSON.stringify(scriptTags, null, 2));

    // Get console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('google')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    console.log('\n--- GOOGLE-RELATED CONSOLE ERRORS ---');
    consoleErrors.forEach(err => console.log(`  ❌ ${err}`));
  });
});
