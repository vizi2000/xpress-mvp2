# Manual Testing Checklist - City Restrictions Feature

## Testing Environment

**Production URL:** https://sendxpress.borg.tools
**Local URL:** http://localhost:8080/index-modular.html

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Test Devices:**
- Desktop (Windows, macOS, Linux)
- Mobile (iOS 14+, Android 10+)

## Pre-Test Setup

- [ ] Clear browser cache and cookies
- [ ] Disable browser autofill (Settings > Autofill > Addresses OFF)
- [ ] Open browser console (F12) for diagnostic logging
- [ ] Test with real Polish addresses only
- [ ] Prepare test data (see Test Data section at end)

**Note:** All tests use REAL addresses in Poland. Do not use fictional addresses.

---

## Test Category 1: Trójmiasto Group (Gdańsk, Gdynia, Sopot)

### TC1.1 - Gdańsk → Gdynia (Valid Inter-City)
**Expected Result:** ✅ Success (cities in same group)

**Steps:**
1. [ ] Navigate to application URL
2. [ ] Click on **"Adres odbioru"** (pickup address) field
3. [ ] Type: `ul. Długa 1, Gdańsk`
4. [ ] Wait for autocomplete dropdown to appear
5. [ ] Verify blue badge **"🌊 Trójmiasto"** appears in suggestions
6. [ ] Select first suggestion or press Enter
7. [ ] Verify hint appears below: **"📍 Dostawa dostępna w: Gdańsk, Gdynia, Sopot"**
8. [ ] Click on **"Adres dostawy"** (delivery address) field
9. [ ] Type: `ul. 10 Lutego 1, Gdynia`
10. [ ] Wait for autocomplete dropdown
11. [ ] Verify dropdown ONLY shows Trójmiasto cities (Gdańsk, Gdynia, Sopot)
12. [ ] Verify NO other cities appear (e.g., Warszawa, Kraków filtered out)
13. [ ] Select first suggestion
14. [ ] Verify NO error message appears
15. [ ] Verify price calculation starts (loading spinner or result)
16. [ ] Verify map displays route between cities
17. [ ] Scroll down and verify order form is enabled

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC1.2 - Gdańsk → Sopot (Valid Inter-City)
**Expected Result:** ✅ Success (cities in same group)

**Steps:**
1. [ ] Refresh page (Ctrl+R / Cmd+R)
2. [ ] Pickup address: `ul. Grunwaldzka 1, Gdańsk`
3. [ ] Wait for autocomplete, select suggestion
4. [ ] Verify hint: **"📍 Dostawa dostępna w: Gdańsk, Gdynia, Sopot"**
5. [ ] Delivery address: `ul. Monte Cassino 1, Sopot`
6. [ ] Select suggestion
7. [ ] Verify NO error message
8. [ ] Verify price calculated successfully
9. [ ] Verify map shows Gdańsk → Sopot route

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC1.3 - Gdańsk → Kraków (Invalid Cross-Group)
**Expected Result:** ❌ Error (different groups)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup address: `ul. Długa 1, Gdańsk`
3. [ ] Select suggestion
4. [ ] Verify hint shows: **"📍 Dostawa dostępna w: Gdańsk, Gdynia, Sopot"**
5. [ ] Delivery address: `ul. Floriańska 1, Kraków`
6. [ ] **IMPORTANT:** Wait 1-2 seconds after typing (city detection debounce)
7. [ ] Verify red error message appears: **"❌ Dostawa z Gdańska możliwa tylko w obrębie Trójmiasta"**
8. [ ] Verify error has:
   - Red background
   - Red left border
   - Shake animation (optional)
9. [ ] Verify delivery input is **CLEARED** (empty)
10. [ ] Verify price calculation does NOT start
11. [ ] Verify order form remains disabled or shows validation error

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC1.4 - Sopot → Warszawa (Invalid - Unsupported City)
**Expected Result:** ❌ Error (Warszawa not supported)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup address: `ul. Monte Cassino 1, Sopot`
3. [ ] Select suggestion
4. [ ] Verify hint shows Trójmiasto cities
5. [ ] Delivery address: `ul. Marszałkowska 1, Warszawa`
6. [ ] Wait for city detection
7. [ ] Verify error message: **"Przepraszamy, nie obsługujemy jeszcze miasta: Warszawa"**
8. [ ] Verify error shows list of supported cities
9. [ ] Verify delivery input is NOT cleared (user can edit)

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 2: Single City Operations

### TC2.1 - Kraków → Kraków (Valid Same City)
**Expected Result:** ✅ Success (same city allowed)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup address: `ul. Floriańska 1, Kraków`
3. [ ] Select suggestion
4. [ ] Verify hint: **"📍 Dostawa dostępna tylko w: Kraków"** (singular "tylko w")
5. [ ] Delivery address: `ul. Grodzka 1, Kraków`
6. [ ] Verify autocomplete ONLY shows Kraków addresses (no other cities)
7. [ ] Select suggestion
8. [ ] Verify NO error message
9. [ ] Verify price calculation starts
10. [ ] Verify map shows Kraków → Kraków route

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC2.2 - Kraków → Wrocław (Invalid Cross-City)
**Expected Result:** ❌ Error (single cities cannot deliver to each other)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup address: `ul. Floriańska 1, Kraków`
3. [ ] Verify hint shows: **"📍 Dostawa dostępna tylko w: Kraków"**
4. [ ] Delivery address: `pl. Solny 1, Wrocław`
5. [ ] Wait for city detection
6. [ ] Verify error: **"❌ Dostawa z Krakowa możliwa tylko w obrębie Krakowa"**
7. [ ] Verify delivery input cleared

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC2.3 - Wrocław → Wrocław (Valid Same City)
**Expected Result:** ✅ Success

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `pl. Solny 1, Wrocław`
3. [ ] Verify hint: **"📍 Dostawa dostępna tylko w: Wrocław"**
4. [ ] Delivery: `ul. Świdnicka 1, Wrocław`
5. [ ] Verify autocomplete filtered to Wrocław only
6. [ ] Verify NO error
7. [ ] Verify price calculated

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC2.4 - Łódź → Łódź (Valid Same City)
**Expected Result:** ✅ Success

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Piotrkowska 1, Łódź`
3. [ ] Verify hint shows only Łódź
4. [ ] Delivery: `ul. Narutowicza 1, Łódź`
5. [ ] Verify success

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC2.5 - Poznań → Poznań (Valid Same City)
**Expected Result:** ✅ Success

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `Stary Rynek 1, Poznań`
3. [ ] Delivery: `ul. Półwiejska 1, Poznań`
4. [ ] Verify success

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 3: Katowice Metro Group (7 Cities)

### TC3.1 - Katowice → Sosnowiec (Valid Inter-City)
**Expected Result:** ✅ Success (same metro group)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Mariacka 1, Katowice`
3. [ ] Verify hint shows all 7 metro cities: **"Katowice, Sosnowiec, Bytom, Chorzów, Zabrze, Gliwice, Tychy"**
4. [ ] Verify orange badge **"🏭 Aglomeracja"** in autocomplete
5. [ ] Delivery: `ul. 3 Maja 1, Sosnowiec`
6. [ ] Verify autocomplete ONLY shows Katowice metro cities
7. [ ] Verify NO error
8. [ ] Verify price calculation works

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC3.2 - Katowice → Gliwice (Valid Inter-City)
**Expected Result:** ✅ Success

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Mariacka 1, Katowice`
3. [ ] Delivery: `ul. Zwycięstwa 1, Gliwice`
4. [ ] Verify success

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC3.3 - Katowice → Gdańsk (Invalid Cross-Group)
**Expected Result:** ❌ Error (different groups)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Mariacka 1, Katowice`
3. [ ] Verify hint shows Katowice metro cities
4. [ ] Delivery: `ul. Długa 1, Gdańsk`
5. [ ] Wait for detection
6. [ ] Verify error: **"❌ Dostawa z Katowic możliwa tylko w obrębie Aglomeracji Katowickiej"**
7. [ ] Verify delivery cleared

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC3.4 - Sosnowiec → Bytom (Valid Inter-City)
**Expected Result:** ✅ Success

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. 3 Maja 1, Sosnowiec`
3. [ ] Delivery: `ul. Strzelców Bytomskich 1, Bytom`
4. [ ] Verify success

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 4: Unsupported Cities

### TC4.1 - Warszawa Pickup (City Not Supported)
**Expected Result:** ❌ Error (city not in supported list)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Marszałkowska 1, Warszawa`
3. [ ] Wait for city detection (800ms debounce)
4. [ ] Verify error message appears in pickup section:
   - **"Przepraszamy, nie obsługujemy jeszcze miasta: Warszawa"**
5. [ ] Verify error shows list of supported cities:
   - Trójmiasto: Gdańsk, Gdynia, Sopot
   - Katowice Metro: Katowice, Sosnowiec, Bytom, Chorzów, Zabrze, Gliwice, Tychy
   - Single Cities: Kraków, Wrocław, Łódź, Poznań, Szczecin, Rzeszów, Radom
6. [ ] Verify input is NOT cleared (user can edit address)
7. [ ] Verify delivery input remains empty and disabled

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC4.2 - Bydgoszcz Delivery (City Not Supported)
**Expected Result:** ❌ Error

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Floriańska 1, Kraków` (valid)
3. [ ] Delivery: `ul. Gdańska 1, Bydgoszcz` (unsupported)
4. [ ] Verify error for unsupported city
5. [ ] Verify delivery input cleared

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 5: Edge Cases

### TC5.1 - Rapid Typing (Debounce Test)
**Expected Result:** ⏱️ No lag, detection after 800ms pause

**Steps:**
1. [ ] Refresh page
2. [ ] Rapidly type in pickup field: `Gdańsk` (character by character, no pause)
3. [ ] Verify system does NOT trigger city detection during typing
4. [ ] Pause for 1 second
5. [ ] Verify city detection happens AFTER 800ms pause
6. [ ] Verify NO duplicate API calls (check Console > Network tab)
7. [ ] Verify autocomplete appears after pause, not during typing

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC5.2 - Incomplete Address (No City)
**Expected Result:** ℹ️ No error, no hint, autocomplete shows all cities

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Długa 1` (no city name)
3. [ ] Wait 1 second
4. [ ] Verify NO error shown
5. [ ] Verify NO hint shown
6. [ ] Verify autocomplete dropdown shows addresses from ALL supported cities
7. [ ] Type delivery: `ul. Marszałkowska 1` (no city)
8. [ ] Verify same behavior (no restrictions)

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC5.3 - Special Polish Characters
**Expected Result:** ✅ Polish characters handled correctly

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Łąkowa 1, Łódź` (Polish Ł, ą)
3. [ ] Verify city detected as "lodz" (normalized)
4. [ ] Verify hint appears correctly
5. [ ] Delivery: `ul. Piotrkowska 1, Łódź`
6. [ ] Verify success
7. [ ] Test other Polish chars: Ś, Ź, Ż, Ć, Ń, Ó, Ę
8. [ ] Pickup: `ul. Śląska 1, Kraków`
9. [ ] Verify detection works

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC5.4 - Address Format Variations
**Expected Result:** ✅ All formats detected correctly

**Test different address formats:**

**Format 1: Street, City**
1. [ ] `ul. Długa 1, Gdańsk` → Should detect Gdańsk

**Format 2: City, Street**
2. [ ] `Kraków, ul. Floriańska 1` → Should detect Kraków

**Format 3: Postal Code + City**
3. [ ] `30-001 Kraków, Floriańska 1` → Should detect Kraków

**Format 4: Full address**
4. [ ] `ul. Długa 1, 80-001 Gdańsk, Polska` → Should detect Gdańsk

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC5.5 - Same Address for Pickup and Delivery
**Expected Result:** ⚠️ General validation error (not city-specific)

**Steps:**
1. [ ] Refresh page
2. [ ] Pickup: `ul. Floriańska 1, Kraków`
3. [ ] Delivery: `ul. Floriańska 1, Kraków` (exactly same)
4. [ ] Verify general validation error: **"Adresy odbioru i dostawy muszą być różne"**
5. [ ] Verify this is NOT a city restriction error

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 6: LocationIQ Dropdown UX

### TC6.1 - Badge Display and Colors
**Expected Result:** 🎨 Badges visible with correct colors and icons

**Steps:**
1. [ ] Refresh page
2. [ ] Type in pickup: `Długa`
3. [ ] Wait for autocomplete dropdown
4. [ ] Verify Gdańsk results show **blue badge "🌊 Trójmiasto"**
5. [ ] Verify badge has:
   - Blue gradient background
   - White text
   - Ocean emoji (🌊)
6. [ ] Type: `Mariacka`
7. [ ] Verify Katowice results show **orange badge "🏭 Aglomeracja"**
8. [ ] Verify badge has:
   - Orange gradient background
   - Factory emoji (🏭)
9. [ ] Type: `Floriańska`
10. [ ] Verify Kraków results show **green badge "📍 Miasto"**
11. [ ] Verify badge has:
   - Green gradient background
   - Location pin emoji (📍)

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC6.2 - Dropdown Hover Effects
**Expected Result:** 🖱️ Smooth hover transitions

**Steps:**
1. [ ] Type address to show dropdown
2. [ ] Hover mouse over first suggestion
3. [ ] Verify yellow gradient background appears on hover
4. [ ] Verify transition is smooth (0.2s)
5. [ ] Move mouse to next suggestion
6. [ ] Verify previous item returns to white background
7. [ ] Verify new item gets yellow highlight
8. [ ] Verify no visual glitches or flickering

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC6.3 - Keyboard Navigation
**Expected Result:** ⌨️ Arrow keys and Enter work

**Steps:**
1. [ ] Type address to show dropdown (at least 3 suggestions)
2. [ ] Press ↓ (Down arrow)
3. [ ] Verify first item highlighted (yellow background)
4. [ ] Press ↓ again
5. [ ] Verify second item highlighted, first unhighlighted
6. [ ] Press ↑ (Up arrow)
7. [ ] Verify first item highlighted again
8. [ ] Press Enter
9. [ ] Verify selected address filled into input
10. [ ] Verify dropdown closes

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC6.4 - Scrollbar Styling
**Expected Result:** 🎨 Custom scrollbar with yellow thumb

**Steps:**
1. [ ] Type generic address to get 10+ results
2. [ ] Verify dropdown shows scrollbar (if needed)
3. [ ] Verify scrollbar has:
   - Yellow/gold thumb (#FFD700)
   - Light gray track (#f1f1f1)
   - Rounded corners
4. [ ] Hover over scrollbar thumb
5. [ ] Verify color darkens on hover

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 7: Error Messages Quality

### TC7.1 - Error Message Content (Polish)
**Expected Result:** 📝 Clear, actionable Polish messages

**Test each error type:**

**Error 1: Cross-group delivery**
1. [ ] Pickup: Gdańsk, Delivery: Kraków
2. [ ] Verify message: **"❌ Dostawa z Gdańska możliwa tylko w obrębie Trójmiasta"**
3. [ ] Verify mentions specific city names
4. [ ] Verify uses emoji (❌)

**Error 2: Unsupported city**
5. [ ] Pickup: Warszawa
6. [ ] Verify message: **"Przepraszamy, nie obsługujemy jeszcze miasta: Warszawa"**
7. [ ] Verify shows list of supported cities

**Error 3: Single city cross-delivery**
8. [ ] Pickup: Kraków, Delivery: Wrocław
9. [ ] Verify message: **"❌ Dostawa z Krakowa możliwa tylko w obrębie Krakowa"**

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC7.2 - Error Visual Design
**Expected Result:** 🎨 Consistent error styling

**Steps:**
1. [ ] Trigger any city error (e.g., Gdańsk → Kraków)
2. [ ] Verify error has:
   - [ ] Red background (#fee or similar)
   - [ ] Red left border (4px, #f44)
   - [ ] Red text color (#c00)
   - [ ] Padding (10px minimum)
   - [ ] Rounded corners (4px)
3. [ ] Verify error is clearly visible and readable
4. [ ] Verify error appears in correct position (below delivery input)

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Test Category 8: Mobile Testing

### TC8.1 - Mobile Touch Interactions (iOS)
**Expected Result:** 📱 Touch works smoothly

**Device:** iPhone (Safari)

**Steps:**
1. [ ] Open app on iPhone Safari
2. [ ] Tap pickup address field
3. [ ] Verify keyboard appears
4. [ ] Type: `Długa 1, Gdańsk`
5. [ ] Verify autocomplete dropdown appears
6. [ ] Verify dropdown is:
   - Full width on mobile
   - Properly positioned below input
   - Not cut off by screen edges
7. [ ] Tap a suggestion
8. [ ] Verify suggestion selected correctly
9. [ ] Verify dropdown closes
10. [ ] Verify hint appears and is readable

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC8.2 - Mobile Touch Interactions (Android)
**Expected Result:** 📱 Touch works smoothly

**Device:** Android phone (Chrome)

**Steps:**
1. [ ] Open app on Android Chrome
2. [ ] Tap pickup field
3. [ ] Type address
4. [ ] Verify autocomplete appears correctly
5. [ ] Verify badges are visible and readable
6. [ ] Tap suggestion
7. [ ] Verify selection works
8. [ ] Test delivery field similarly

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

### TC8.3 - Mobile Viewport and Responsiveness
**Expected Result:** 📱 Layout adapts to small screens

**Steps:**
1. [ ] Open on mobile device
2. [ ] Verify badges are smaller on mobile (check CSS @media query)
3. [ ] Verify suggestion text is readable (not too small)
4. [ ] Verify dropdown doesn't overflow screen
5. [ ] Verify error messages wrap properly
6. [ ] Verify hint text is readable on small screen

**Pass/Fail:** ____
**Notes:** _______________________________________________

---

## Browser Compatibility Matrix

Test critical paths in ALL browsers:

| Test Case | Chrome | Firefox | Safari | Edge | Mobile Safari | Mobile Chrome |
|-----------|--------|---------|--------|------|---------------|---------------|
| TC1.1 - Trójmiasto valid | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC1.3 - Cross-group error | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC2.1 - Same city valid | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC2.2 - Cross-city error | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC3.1 - Metro valid | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC4.1 - Unsupported city | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC6.1 - Badge display | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TC6.2 - Hover effects | ☐ | ☐ | ☐ | N/A | N/A | N/A |
| TC6.3 - Keyboard nav | ☐ | ☐ | ☐ | ☐ | N/A | N/A |

**Legend:**
- ✅ Pass
- ❌ Fail
- ⚠️ Warning (works but with issues)
- ⏭️ Skipped
- N/A Not Applicable

---

## Regression Testing Checklist

Run these tests after ANY code changes:

### Critical Path Tests (MUST PASS)
- [ ] **TC1.1** - Trójmiasto: Gdańsk → Gdynia (valid)
- [ ] **TC1.3** - Cross-group: Gdańsk → Kraków (error)
- [ ] **TC2.1** - Same city: Kraków → Kraków (valid)
- [ ] **TC2.2** - Cross-city: Kraków → Wrocław (error)
- [ ] **TC3.1** - Katowice Metro: Katowice → Sosnowiec (valid)
- [ ] **TC4.1** - Unsupported: Warszawa pickup (error)
- [ ] **TC5.3** - Polish characters: Łódź detection
- [ ] **TC6.1** - Badge display in dropdown
- [ ] **TC8.1** - Mobile touch (iOS)

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Autocomplete responds in < 500ms
- [ ] City detection happens after 800ms (not sooner)
- [ ] No console errors in browser DevTools

---

## Test Data Reference

### Valid Test Addresses

**Trójmiasto:**
- Gdańsk: `ul. Długa 1, Gdańsk` / `ul. Grunwaldzka 1, Gdańsk`
- Gdynia: `ul. 10 Lutego 1, Gdynia` / `ul. Świętojańska 1, Gdynia`
- Sopot: `ul. Monte Cassino 1, Sopot` / `ul. Bohaterów Monte Cassino 1, Sopot`

**Katowice Metro:**
- Katowice: `ul. Mariacka 1, Katowice` / `ul. 3 Maja 1, Katowice`
- Sosnowiec: `ul. 3 Maja 1, Sosnowiec` / `ul. Modrzejowska 1, Sosnowiec`
- Gliwice: `ul. Zwycięstwa 1, Gliwice`
- Bytom: `ul. Strzelców Bytomskich 1, Bytom`

**Single Cities:**
- Kraków: `ul. Floriańska 1, Kraków` / `ul. Grodzka 1, Kraków`
- Wrocław: `pl. Solny 1, Wrocław` / `ul. Świdnicka 1, Wrocław`
- Łódź: `ul. Piotrkowska 1, Łódź` / `ul. Narutowicza 1, Łódź`
- Poznań: `Stary Rynek 1, Poznań` / `ul. Półwiejska 1, Poznań`

**Unsupported Cities (for error testing):**
- Warszawa: `ul. Marszałkowska 1, Warszawa`
- Bydgoszcz: `ul. Gdańska 1, Bydgoszcz`

---

## Troubleshooting Common Issues

### Issue: Autocomplete doesn't appear
**Solution:**
- Wait 3+ characters before expecting results
- Check browser console for LocationIQ API errors
- Verify internet connection
- Clear browser cache

### Issue: City detection doesn't work
**Solution:**
- Wait 800ms after typing (debounce delay)
- Ensure address includes city name
- Check browser console for JavaScript errors
- Verify address format is correct

### Issue: Badges don't show in dropdown
**Solution:**
- Check if CSS loaded (inspect element)
- Verify LocationIQ service initialized
- Check console for errors

### Issue: Mobile dropdown cut off
**Solution:**
- Verify viewport meta tag in HTML
- Check CSS media queries loaded
- Test in different mobile browsers

---

## Test Sign-Off

**Tester Name:** _______________________________________________

**Test Date:** _______________________________________________

**Environment:** ☐ Production  ☐ Staging  ☐ Local

**Overall Result:** ☐ PASS  ☐ FAIL  ☐ CONDITIONAL PASS

**Total Tests Run:** ______ / ______

**Tests Passed:** ______

**Tests Failed:** ______

**Critical Bugs Found:** ______

**Notes/Comments:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Created by The Collective Borg.tools**
**Version:** 1.0.0
**Last Updated:** 2025-10-24
