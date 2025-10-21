# Task 4: Fix Mock OrderId Format

## Problem Statement
Mock order creation generates numeric orderId (e.g., `6645`) which fails Xpress API validation:
```
Error: invalid parameter(s): "orderId" with value "6645" fails to match the required pattern: /^[a-f0-9]{24}$/
```

Xpress API expects MongoDB ObjectId format: 24-character hexadecimal string (e.g., `507f1f77bcf86cd799439011`).

## Current Behavior
```javascript
// In OrderService.js - createMockOrder()
createMockOrder(orderData) {
    const orderId = Math.floor(Math.random() * 10000);  // ❌ Returns: 6645
    // ...
}
```

## Expected Behavior
Generate valid MongoDB ObjectId format for mock orders.

## File to Modify
- **Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/src/services/OrderService.js`
- **Method**: `createMockOrder()` (line ~114-145)

## Implementation Details

### 1. Add MongoDB ObjectId Generator Function

**Insert BEFORE** `createMockOrder()` method (around line 114):

```javascript
// Generate MongoDB-compatible ObjectId for mock orders
// Format: 24 hex characters (12 bytes)
// Structure: timestamp(4) + machine(3) + pid(2) + counter(3)
generateMockObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomPart = Array.from({length: 16}, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const objectId = timestamp + randomPart;

    console.log('🔧 Generated mock ObjectId:', objectId);
    return objectId;
}
```

### 2. Update `createMockOrder()` Method

**Find line ~115** (current implementation):
```javascript
createMockOrder(orderData) {
    const orderId = Math.floor(Math.random() * 10000);  // ❌ WRONG FORMAT
```

**Replace with**:
```javascript
createMockOrder(orderData) {
    const orderId = this.generateMockObjectId();  // ✅ CORRECT FORMAT
```

### 3. Verify Return Statement

**Current return** (line ~143):
```javascript
return {
    id: orderId,  // Now will be "507f1f77bcf86cd799439011" instead of "6645"
    orderNumber: `MO-${orderId}`,
    // ...
};
```

**No change needed** - just verify it uses the new `orderId`.

## MongoDB ObjectId Format Explanation

### Valid Format:
```
507f1f77bcf86cd799439011
└─┬─┘└────┬────┘└──┬──┘└─┬┘
  │       │        │     │
  │       │        │     └─ Counter (3 bytes = 6 hex chars)
  │       │        └─────── Process ID (2 bytes = 4 hex chars)
  │       └───────────────── Machine ID (3 bytes = 6 hex chars)
  └───────────────────────── Timestamp (4 bytes = 8 hex chars)
```

Total: 12 bytes = 24 hexadecimal characters

### Example Generator Logic:
```javascript
const timestamp = Math.floor(Date.now() / 1000).toString(16);
// Example: 1698765432 → "654f8f08" (8 chars)

const random16 = Array.from({length: 16}, () =>
    Math.floor(Math.random() * 16).toString(16)
).join('');
// Example: "bcf86cd799439011" (16 chars)

const objectId = timestamp.padStart(8, '0') + random16;
// Example: "654f8f08bcf86cd799439011" (24 chars total)
```

## Testing Verification

### Manual Test in Browser Console:
1. Open https://sendxpress.borg.tools
2. Fill form and submit order
3. If real API fails, mock order will be created
4. Check console for: `🔧 Generated mock ObjectId: 654f8f08bcf86cd799439011`
5. Verify orderId matches pattern: `/^[a-f0-9]{24}$/`

### Unit Test:
```javascript
const service = new OrderService();
const mockId = service.generateMockObjectId();

// Test format
expect(mockId).toMatch(/^[a-f0-9]{24}$/);
expect(mockId.length).toBe(24);

// Test uniqueness (should be different each time)
const mockId2 = service.generateMockObjectId();
expect(mockId).not.toBe(mockId2);

// Test timestamp portion (first 8 chars should be hex timestamp)
const timestampHex = mockId.substring(0, 8);
const timestamp = parseInt(timestampHex, 16);
const now = Math.floor(Date.now() / 1000);
expect(timestamp).toBeCloseTo(now, -2); // Within 100 seconds
```

### Regex Validation Test:
```javascript
const validPattern = /^[a-f0-9]{24}$/;

// Valid examples
expect('507f1f77bcf86cd799439011').toMatch(validPattern); // ✅
expect('654f8f08bcf86cd799439abc').toMatch(validPattern); // ✅

// Invalid examples
expect('6645').not.toMatch(validPattern);                 // ❌ Too short
expect('507f1f77bcf86cd79943901g').not.toMatch(validPattern); // ❌ Invalid char 'g'
expect('507F1F77BCF86CD799439011').not.toMatch(validPattern); // ❌ Uppercase
```

## Success Criteria
- ✅ Mock orderId has exactly 24 characters
- ✅ All characters are lowercase hexadecimal (0-9, a-f)
- ✅ Matches pattern: `/^[a-f0-9]{24}$/`
- ✅ Each generated ID is unique (timestamp + random)
- ✅ No more validation errors for mock orderIds
- ✅ Order tracking works with mock orderId

## Dependencies
- **Requires**: None (standalone fix)
- **Blocks**: Task 6 E2E tests (order tracking needs valid orderId)

## Edge Cases

### 1. Timestamp Padding
Ensure timestamp is always 8 characters:
```javascript
timestamp.toString(16).padStart(8, '0')
// "654f8f08" ✅ (8 chars)
// Not "654f8f" ❌ (6 chars - would fail)
```

### 2. Random Part Length
Ensure random part is exactly 16 characters:
```javascript
Array.from({length: 16}, () => ...).join('')
// "bcf86cd799439011" ✅ (16 chars)
```

### 3. Lowercase Only
MongoDB ObjectIds use lowercase hex:
```javascript
Math.floor(Math.random() * 16).toString(16)
// Returns: '0'-'9' or 'a'-'f' ✅
// Never: 'A'-'F' ❌
```

## Code Location Reference

**File**: `/Users/wojciechwiesner/ai/xpress-mvp2/src/services/OrderService.js`

**Insert new method BEFORE line 114**:
```javascript
// Line 113: }  // End of previous method

// ✅ INSERT NEW METHOD HERE:
generateMockObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomPart = Array.from({length: 16}, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return timestamp + randomPart;
}

// Line 114: createMockOrder(orderData) {
```

**Modify line 115**:
```javascript
// BEFORE:
const orderId = Math.floor(Math.random() * 10000);

// AFTER:
const orderId = this.generateMockObjectId();
```

## Rollback Plan
Revert to old implementation:
```javascript
const orderId = Math.floor(Math.random() * 10000);
```
Mock order tracking will fail, but order creation will still work.

---
**Status**: Ready for implementation
**Estimated time**: 5 minutes
**Risk level**: LOW (only affects mock orders)
**Priority**: MEDIUM (fixes tracking for fallback mode)
