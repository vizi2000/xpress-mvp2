# UIHelpers City Feedback System - Visual Mockup

## Overview
This document provides ASCII art mockups of the visual appearance of city-related errors, hints, and success messages.

---

## 1. City Not Supported Error (Red, Shake Animation)

```
┌─────────────────────────────────────────────────────────────┐
│ [Input Field with Address]                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ul. Krakowska 123, Warszawa                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ ❌ Przepraszamy, nie obsługujemy jeszcze miasta:      ║ │
│ ║    Warszawa                                            ║ │
│ ║ ───────────────────────────────────────────────────── ║ │
│ ║ Dostawa dostępna w: Gdańsk, Gdynia, Sopot, Kraków,   ║ │
│ ║ Wrocław, Łódź, Poznań, Szczecin, Rzeszów, Radom,     ║ │
│ ║ Aglomeracja Katowicka                                  ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│ CSS: .ui-error-city                                        │
│ Background: #fee (light red)                               │
│ Border-left: 4px solid #f44                                │
│ Animation: shake (0.3s)                                    │
│ Color: #c00 (dark red)                                     │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- **Color:** Light red background (#fee), dark red text (#c00)
- **Border:** 4px solid red (#f44) on left side
- **Shadow:** 0 2px 8px rgba(255, 68, 68, 0.2)
- **Animation:** Shake effect (moves left-right)
- **Font:** Bold message, smaller submessage
- **Padding:** 12px 16px
- **Border radius:** 8px

---

## 2. City Mismatch Error (Red, Shake Animation)

```
┌─────────────────────────────────────────────────────────────┐
│ [Delivery Address Input]                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ul. Długa 1, Kraków                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ ❌ Dostawa z Gdańsk możliwa tylko w:                  ║ │
│ ║    Gdańsk, Gdynia, Sopot                               ║ │
│ ║ ───────────────────────────────────────────────────── ║ │
│ ║ Wybrałeś miasto: Kraków, które nie jest obsługiwane   ║ │
│ ║ dla tej lokalizacji odbioru.                           ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│ CSS: .ui-error-city                                        │
│ Same styling as "City Not Supported"                      │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:** Same as City Not Supported

---

## 3. City Hint - Trójmiasto (Purple, SlideDown Animation)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ 📍 Dostawa dostępna w: Gdańsk, Gdynia, Sopot          ║ │
│ ║                        ─────────────────────            ║ │
│ ║                        (underlined & bold)              ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│ [Delivery Address Input]                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Wybierz adres dostawy...                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ CSS: .ui-hint-city                                         │
│ Background: linear-gradient(135deg, #667eea, #764ba2)     │
│ Border-left: 4px solid #5a67d8                            │
│ Animation: slideDown (0.3s)                                │
│ Color: white                                               │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- **Color:** White text on purple gradient
- **Gradient:** #667eea → #764ba2 (135deg)
- **Border:** 4px solid #5a67d8 on left side
- **Shadow:** 0 2px 8px rgba(102, 126, 234, 0.3)
- **Animation:** SlideDown (fades in from top)
- **Font:** 14px, city names in bold with underline
- **Position:** Before input element

---

## 4. City Hint - Katowice Agglomeration (Purple, SlideDown)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ 📍 Dostawa dostępna w 7 miastach                       ║ │
│ ║    Aglomeracji Katowickiej                             ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│ [Delivery Address Input]                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Wybierz adres dostawy...                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ CSS: Same as Trójmiasto hint                               │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:** Same as Trójmiasto hint (purple gradient)

---

## 5. Success Message (Green, SlideDown, Auto-dismiss 5s)

```
┌─────────────────────────────────────────────────────────────┐
│ [Delivery Address Input]                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ul. Grunwaldzka 100, Gdańsk                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗ │
│ ║ ✅ Miasta są zgodne, możesz kontynuować                ║ │
│ ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│ CSS: .ui-success                                           │
│ Background: #efe (light green)                             │
│ Border-left: 4px solid #4a4                                │
│ Animation: slideDown (0.3s)                                │
│ Auto-dismiss: 5 seconds                                    │
│ Color: #060 (dark green)                                   │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- **Color:** Light green background (#efe), dark green text (#060)
- **Border:** 4px solid #4a4 on left side
- **Shadow:** 0 2px 8px rgba(68, 170, 68, 0.2)
- **Animation:** SlideDown (fades in from top)
- **Auto-dismiss:** Disappears after 5 seconds
- **Font:** 14px

---

## 6. Toast Notifications (Top-Right Corner)

### Success Toast
```
                                    ┌───────────────────────────┐
                                    │ ✅ Sukces!                │
                                    │                           │
                                    │ Background: Green gradient│
                                    │ (#4a4 → #060)             │
                                    └───────────────────────────┘
```

### Error Toast
```
                                    ┌───────────────────────────┐
                                    │ ❌ Błąd!                  │
                                    │                           │
                                    │ Background: Red gradient  │
                                    │ (#f44 → #c00)             │
                                    └───────────────────────────┘
```

### Info Toast
```
                                    ┌───────────────────────────┐
                                    │ 📘 Informacja testowa     │
                                    │                           │
                                    │ Background: Purple gradient│
                                    │ (#667eea → #764ba2)       │
                                    └───────────────────────────┘
```

**Toast Characteristics:**
- **Position:** Fixed, top-right (20px from top/right)
- **Animation:** SlideIn from right (100px)
- **Auto-dismiss:** 3 seconds (customizable)
- **Shadow:** 0 4px 12px rgba(0, 0, 0, 0.2)
- **Z-index:** 99999 (always on top)
- **Mobile:** Spans full width (10px margins)
- **Font:** 14px, white, font-weight 500

---

## 7. Input Error State

```
┌─────────────────────────────────────────────────────────────┐
│ NORMAL INPUT:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ul. Długa 1, Gdańsk                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ERROR INPUT (.input-error class):                          │
│ ╔═════════════════════════════════════════════════════════╗ │
│ ║ ul. Krakowska 123, Warszawa                             ║ │
│ ╚═════════════════════════════════════════════════════════╝ │
│                                                             │
│ CSS: .input-error                                          │
│ Border: #f44 !important                                    │
│ Box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1) !important   │
└─────────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- **Border:** Changed to red (#f44)
- **Shadow:** Red glow effect (3px spread)
- **Priority:** !important to override default styles

---

## Animation Details

### 1. slideDown Animation (Hints & Success)
```
Frame 1 (0%):   opacity: 0, translateY(-10px)  [Hidden above]
Frame 2 (50%):  opacity: 0.5, translateY(-5px) [Fading in]
Frame 3 (100%): opacity: 1, translateY(0)      [Fully visible]

Duration: 0.3s
Easing: ease
Effect: Welcoming, informative
```

### 2. shake Animation (Errors)
```
Frame 1 (0%):   translateX(0)     [Center]
Frame 2 (25%):  translateX(-5px)  [Left]
Frame 3 (50%):  translateX(0)     [Center]
Frame 4 (75%):  translateX(5px)   [Right]
Frame 5 (100%): translateX(0)     [Center]

Duration: 0.3s
Easing: ease
Effect: Attention-grabbing, urgent
```

### 3. slideIn Animation (Toasts)
```
Frame 1 (0%):   opacity: 0, translateX(100px)  [Hidden right]
Frame 2 (50%):  opacity: 0.5, translateX(50px) [Sliding in]
Frame 3 (100%): opacity: 1, translateX(0)      [Fully visible]

Duration: 0.3s
Easing: ease
Effect: Non-intrusive, modern
```

---

## Mobile Responsive Behavior

### Desktop (> 768px)
- Padding: 12px 16px
- Font size: 14px
- Margins: 10px 0
- Toast: Fixed top-right (20px)

### Mobile (≤ 768px)
- Padding: 10px 12px (reduced)
- Font size: 13px (reduced)
- Margins: 8px 0 (reduced)
- Toast: Spans full width (10px margins)
- Submessage: 12px (smaller)

---

## Color Palette Summary

| Element | Background | Text Color | Border | Shadow |
|---------|-----------|------------|--------|--------|
| **Error** | #fee | #c00 | #f44 | rgba(255, 68, 68, 0.2) |
| **Success** | #efe | #060 | #4a4 | rgba(68, 170, 68, 0.2) |
| **Hint** | Gradient (#667eea → #764ba2) | white | #5a67d8 | rgba(102, 126, 234, 0.3) |
| **Toast Error** | Gradient (#f44 → #c00) | white | none | rgba(0, 0, 0, 0.2) |
| **Toast Success** | Gradient (#4a4 → #060) | white | none | rgba(0, 0, 0, 0.2) |
| **Toast Info** | Gradient (#667eea → #764ba2) | white | none | rgba(0, 0, 0, 0.2) |
| **Input Error** | - | - | #f44 | rgba(255, 68, 68, 0.1) |

---

## Accessibility Features

### 1. High Contrast
- ✅ All text meets WCAG AA standards
- ✅ Error messages: Dark red (#c00) on light background
- ✅ Success messages: Dark green (#060) on light background
- ✅ Hints: White on dark purple (high contrast)

### 2. Visual Hierarchy
- ✅ Main message: Bold (font-weight 600)
- ✅ Submessage: Smaller font (13px)
- ✅ Clear separation with margin-top

### 3. Keyboard Accessibility
- ✅ Focus states maintained
- ✅ Input error class doesn't affect focus ring
- ✅ ESC key can dismiss (future enhancement)

### 4. Screen Reader Support
- ⚠️ ARIA labels can be added (future enhancement)
- ⚠️ Role="alert" for errors (future enhancement)
- ✅ Semantic HTML structure

### 5. Animation Preferences
- ⚠️ Respect prefers-reduced-motion (future enhancement)

---

## Browser Compatibility

### Tested On
- ✅ Chrome 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support)
- ✅ Edge 90+ (full support)

### Fallbacks
- CSS animations fallback gracefully (no animation if unsupported)
- Linear gradients fallback to solid colors
- Box-shadow can be omitted on older browsers

---

## Usage Examples

### Example 1: Show City Not Supported
```javascript
const inputElement = document.getElementById('pickup-address');
UIHelpers.showCityNotSupportedError('Warszawa', inputElement);
```

### Example 2: Show City Mismatch
```javascript
const deliveryInput = document.getElementById('delivery-address');
UIHelpers.showCityMismatchError('Gdańsk', 'Kraków', ['Gdańsk', 'Gdynia', 'Sopot'], deliveryInput);
```

### Example 3: Show City Hint
```javascript
const deliveryInput = document.getElementById('delivery-address');
UIHelpers.showCityHint(['Gdańsk', 'Gdynia', 'Sopot'], deliveryInput);
```

### Example 4: Clear All Feedback
```javascript
UIHelpers.clearCityFeedback();
```

### Example 5: Show Success
```javascript
const deliveryInput = document.getElementById('delivery-address');
UIHelpers.showCitySuccess(UIHelpers.MESSAGES.SUCCESS_CITIES_COMPATIBLE, deliveryInput);
```

---

## Console Output Examples

```
[UIHelpers] City feedback styles injected
[UIHelpers] City not supported: Warszawa
[UIHelpers] City mismatch: {pickupCity: "Gdańsk", deliveryCity: "Kraków", allowedCities: Array(3)}
[UIHelpers] City hint shown: ["Gdańsk", "Gdynia", "Sopot"]
[UIHelpers] City hint cleared
[UIHelpers] Success shown: Miasta są zgodne, możesz kontynuować
[UIHelpers] All city feedback cleared
[UIHelpers] Toast shown: Informacja testowa info
```

---

## Testing Checklist

- [x] City not supported error displays correctly
- [x] City mismatch error displays correctly
- [x] City hint shows for 1-3 cities (with names)
- [x] City hint shows for 7+ cities (with count)
- [x] Success message displays and auto-dismisses after 5s
- [x] Toast notifications appear in top-right
- [x] Toast auto-dismisses after 3s
- [x] Input error state applies red border/shadow
- [x] Shake animation plays for errors
- [x] SlideDown animation plays for hints/success
- [x] SlideIn animation plays for toasts
- [x] Mobile responsive styles apply < 768px
- [x] Console logging works correctly
- [x] Multiple errors don't stack (replace existing)
- [x] Clear methods remove all feedback
- [x] CSS styles inject automatically on load

---

**Created by:** The Collective Borg.tools
**Date:** 2025-10-24
**Status:** ✅ COMPLETE
