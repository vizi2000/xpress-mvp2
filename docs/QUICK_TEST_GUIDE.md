# Quick Test Guide - Chat Flow Debugging

## 🎯 Quick Start

**URL:** https://sendxpress.borg.tools
**Test message:** `Zamówienie z Kolumba 7, Wrocław, na Suchą 14, Wrocław`

---

## ⚡ 3-Minute Test

1. **Open site + console** (F12)
2. **Clear console** (Cmd+K)
3. **Send test message in chat**
4. **Look for these emoji markers:**

```
🔍 EXTRACT     - Address extraction
📤 CHAT AGENT  - Data sent from agent
📥 CHAT UI     - Data received in UI
🎯 FILL        - Form filling
🧮 HANDLE      - Price calculation trigger
💰 CALC PRICE  - Price calculation
📍 CALC DIST   - Distance calculation
✅ Route       - Success!
```

---

## 🚨 Quick Diagnosis

### ✅ Working Flow:
```
🔍 → 📤 → 📥 → 🎯 → 🧮 → 💰 → 📍 → ✅
```

### ❌ If stops at 📤 (Chat Agent):
→ **Problem:** Address extraction pattern not matching
→ **Fix:** Update regex in `ChatAgent.js`

### ❌ If stops at 📥 (Chat UI):
→ **Problem:** `window.xpressApp` not available
→ **Fix:** Check initialization order

### ❌ If stops at 🎯 (Form filling):
→ **Problem:** Input elements not found
→ **Fix:** Check HTML element IDs

### ❌ If stops at 📍 (Distance calc):
→ **Problem:** LocationIQ API key or geocoding failed
→ **Fix:** Check `.env.local` for `LOCATIONIQ_API_KEY`

---

## 🔍 Common Log Patterns

### Pattern 1: Address not extracted
```
🔍 EXTRACT: Trying to extract address from: ...
🔍 EXTRACT: No address found  ← ❌ PROBLEM HERE
```
**Fix:** Regex doesn't match address format

### Pattern 2: orderState empty
```
📤 CHAT AGENT RETURN: {pickup: null, delivery: null}  ← ❌ PROBLEM
```
**Fix:** Address extraction failed (see Pattern 1)

### Pattern 3: window.xpressApp missing
```
📥 window.xpressApp exists? false  ← ❌ PROBLEM HERE
⚠️ XpressApp not available for chat integration
```
**Fix:** Timing issue - XpressApp loads after ChatUI

### Pattern 4: Input elements missing
```
🎯 Pickup input exists? false  ← ❌ PROBLEM HERE
🎯 Delivery input exists? false
```
**Fix:** Element ID mismatch - check HTML

### Pattern 5: Distance calculation fails
```
📍 LocationIQ calculateDistance called: {...}
❌ LocationIQ distance calculation error: ...  ← ❌ PROBLEM
```
**Fix:** API key invalid or address not found

---

## 📋 Checklist

- [ ] Console shows `🔍 EXTRACT: Found address` (x2)
- [ ] Console shows `📤 CHAT AGENT RETURN` with pickup AND delivery
- [ ] Console shows `📥 window.xpressApp exists? true`
- [ ] Console shows `🎯 Pickup input value set to: ...`
- [ ] Console shows `🧮 HANDLE ADDRESS CHANGE`
- [ ] Console shows `📍 Pickup coords: {lat: ..., lng: ...}`
- [ ] Console shows `✅ Route calculated`
- [ ] Form inputs have green border flash
- [ ] Price options appear
- [ ] Map shows route

---

## 🐛 Debug Commands

Run these in console for additional info:

```javascript
// Check if XpressApp is available
console.log('XpressApp:', window.xpressApp);

// Check current order data
console.log('Order data:', window.xpressApp?.orderData);

// Check input elements
console.log('Pickup input:', document.getElementById('pickup-address'));
console.log('Delivery input:', document.getElementById('delivery-address'));

// Check LocationIQ service
console.log('LocationIQ:', window.xpressApp?.googleMapsService?.locationIQ);

// Manually trigger form fill (for testing)
window.xpressApp.fillAddressesFromChat('Kolumba 7, Wrocław', 'Sucha 14, Wrocław');
```

---

## 🎬 Expected Behavior

When working correctly:
1. Type message in chat
2. Chat responds with confirmation
3. Form inputs flash green
4. Form inputs auto-filled with addresses
5. Loading spinner appears ("Obliczam cenę...")
6. Price options appear (small/medium/large)
7. Map shows route
8. User can select package and proceed

---

## 📊 What to Report

Screenshot or copy-paste:
1. **Full console log** (all emoji markers)
2. **Last log before it stops** (where flow breaks)
3. **Any red error messages**
4. **Form behavior** (inputs filled? prices shown? map visible?)

---

## 🔧 Environment Check

Ensure these are set in `.env.local`:

```bash
# Required for LocationIQ
LOCATIONIQ_API_KEY=pk.xxx...

# Required for OpenRouter (chat)
OPENROUTER_API_KEY=sk-xxx...

# Required for Xpress API
XPRESS_API_USERNAME=your@email.com
XPRESS_API_PASSWORD=yourpassword
```

---

## 📞 Next Steps

After testing, send to Claude:
1. Console screenshot
2. Which checklist items passed (✅) or failed (❌)
3. Where the emoji flow stopped

Example report:
```
✅ 🔍 EXTRACT - Found both addresses
✅ 📤 CHAT AGENT - Returned orderState correctly
❌ 📥 CHAT UI - window.xpressApp exists? false ← STOPS HERE

Issue: XpressApp not available when ChatUI tries to use it
```

---

**Created by The Collective Borg.tools**
