# Task 3: Pass Coordinates to Xpress API

## Problem Statement
XpressDeliveryService.createOrder() builds the order payload with only `formatted` addresses, missing required `lat` and `lng` fields. This causes 400 Bad Request errors from Xpress API:
```
Error: invalid parameter(s): "clientAddress.lat" is required, "clientAddress.lng" is required,
"pickupPoint.address.lat" is required, "pickupPoint.address.lng" is required
```

## Current Behavior
```javascript
// In XpressDeliveryService.js - createOrder()
const xpressOrder = {
    clientAddress: {
        formatted: orderData.delivery  // ❌ Missing lat, lng
    },
    pickupPoint: {
        address: {
            formatted: orderData.pickup  // ❌ Missing lat, lng
        }
    }
};
```

## Expected Behavior
Include `lat` and `lng` fields from `orderData.pickupCoords` and `orderData.deliveryCoords`.

## File to Modify
- **Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/src/services/XpressDeliveryService.js`
- **Method**: `createOrder()` (line 175-229)

## Implementation Details

### Update `createOrder()` method (line 182-203)

**Before**:
```javascript
const xpressOrder = {
    clientName: orderData.contact.recipientName,
    clientPhone: orderData.contact.recipientPhone,
    clientAddress: {
        formatted: orderData.delivery
    },
    pickupPoint: {
        name: orderData.contact.senderName,
        phone: orderData.contact.senderPhone,
        address: {
            formatted: orderData.pickup
        }
    },
    products: [
        {
            id: await this.getDefaultProductId()
        }
    ],
    packageSize: this.mapPackageSize(orderData.selectedPackage),
    notes: `Zamówienie z aplikacji MVP. Email nadawcy: ${orderData.contact.senderEmail}, Email odbiorcy: ${orderData.contact.recipientEmail}`,
    externalId: `MVP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};
```

**After**:
```javascript
const xpressOrder = {
    clientName: orderData.contact.recipientName,
    clientPhone: orderData.contact.recipientPhone,
    clientAddress: {
        formatted: orderData.delivery,
        // ✅ NEW: Add coordinates
        lat: orderData.deliveryCoords?.lat,
        lng: orderData.deliveryCoords?.lng
    },
    pickupPoint: {
        name: orderData.contact.senderName,
        phone: orderData.contact.senderPhone,
        address: {
            formatted: orderData.pickup,
            // ✅ NEW: Add coordinates
            lat: orderData.pickupCoords?.lat,
            lng: orderData.pickupCoords?.lng
        }
    },
    products: [
        {
            id: await this.getDefaultProductId()
        }
    ],
    packageSize: this.mapPackageSize(orderData.selectedPackage),
    notes: `Zamówienie z aplikacji MVP. Email nadawcy: ${orderData.contact.senderEmail}, Email odbiorcy: ${orderData.contact.recipientEmail}`,
    externalId: `MVP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};
```

### Add validation before API call

**Insert BEFORE line 205** (`const response = await fetch(...)`):
```javascript
// ✅ NEW: Validate coordinates are present
if (!orderData.pickupCoords || !orderData.deliveryCoords) {
    throw new Error('Missing coordinates for addresses. Please recalculate price.');
}

if (!orderData.pickupCoords.lat || !orderData.pickupCoords.lng ||
    !orderData.deliveryCoords.lat || !orderData.deliveryCoords.lng) {
    throw new Error('Invalid coordinates format. Please recalculate price.');
}

console.log('📍 Order coordinates:', {
    pickup: orderData.pickupCoords,
    delivery: orderData.deliveryCoords
});
```

## API Request Format
After this change, the request to Xpress API will look like:
```json
{
  "clientName": "Jan Kowalski",
  "clientPhone": "+48123456789",
  "clientAddress": {
    "formatted": "Marszałkowska 1, Warszawa",
    "lat": 52.2297,
    "lng": 21.0122
  },
  "pickupPoint": {
    "name": "Maria Nowak",
    "phone": "+48987654321",
    "address": {
      "formatted": "Krakowskie Przedmieście 1, Warszawa",
      "lat": 52.2401,
      "lng": 21.0175
    }
  },
  "products": [{ "id": "619f2c6fbeed92c2a8ffa76b" }],
  "packageSize": "small",
  "notes": "Zamówienie z aplikacji MVP...",
  "externalId": "MVP-1234567890-abc123def"
}
```

## Testing Verification

### Manual Test with Network Tab:
1. Open https://sendxpress.borg.tools
2. Open DevTools → Network tab
3. Fill in addresses: "Warszawa, Marszałkowska 1" → "Kraków, Rynek 1"
4. Calculate price
5. Fill contact info
6. Click "Zamów kuriera"
7. Check Network tab for POST to `/api/order/create`
8. Inspect Request Payload - should contain:
```json
{
  "clientAddress": {
    "formatted": "...",
    "lat": 52.xxx,  // ✅ Should be present
    "lng": 21.xxx   // ✅ Should be present
  },
  "pickupPoint": {
    "address": {
      "formatted": "...",
      "lat": 50.xxx,  // ✅ Should be present
      "lng": 19.xxx   // ✅ Should be present
    }
  }
}
```

### Unit Test:
```javascript
const orderData = {
    pickup: 'Warszawa, Marszałkowska 1',
    delivery: 'Kraków, Rynek 1',
    pickupCoords: { lat: 52.2297, lng: 21.0122 },
    deliveryCoords: { lat: 50.0614, lng: 19.9372 },
    contact: { ... },
    selectedPackage: 'small'
};

const service = new XpressDeliveryService();
await service.createOrder(orderData);

// Should NOT throw "lat is required" error
// Should return orderId
```

### Expected Console Output:
```
📍 Order coordinates: {
  pickup: { lat: 52.2297, lng: 21.0122 },
  delivery: { lat: 50.0614, lng: 19.9372 }
}
✅ Xpress.Delivery order created: { newOrderId: '...', newOrderNo: '...', ... }
```

## Success Criteria
- ✅ Request payload includes `lat` and `lng` for both addresses
- ✅ No more "lat is required" errors from API
- ✅ Validation throws error if coordinates missing
- ✅ Console logs coordinates before API call (for debugging)
- ✅ Order creation succeeds with 200 OK response

## Dependencies
- **Requires**: Task 2 completed (orderData has pickupCoords, deliveryCoords)
- **Blocks**: Task 6 (E2E tests need working order creation)

## Edge Cases

### 1. Null coordinates (from estimated price)
```javascript
if (!orderData.deliveryCoords?.lat) {
    throw new Error('Missing coordinates. Please recalculate price.');
}
```

### 2. NaN or invalid coordinates
```javascript
if (isNaN(orderData.deliveryCoords.lat) || isNaN(orderData.deliveryCoords.lng)) {
    throw new Error('Invalid coordinates. Please recalculate price.');
}
```

### 3. Coordinates out of Poland range
Optional validation (nice-to-have):
```javascript
// Poland bounding box: lat 49-55, lng 14-24
if (orderData.deliveryCoords.lat < 49 || orderData.deliveryCoords.lat > 55) {
    console.warn('⚠️ Delivery coordinates outside Poland');
}
```

## Error Handling

### Before API call:
```javascript
try {
    // Validate coordinates
    if (!orderData.pickupCoords || !orderData.deliveryCoords) {
        throw new Error('Missing coordinates for addresses. Please recalculate price.');
    }

    const xpressOrder = { ... };
    const response = await fetch(...);

} catch (error) {
    console.error('❌ Order creation failed:', error);
    throw error; // Re-throw for XpressApp to handle
}
```

## Rollback Plan
Remove the `lat` and `lng` fields from `clientAddress` and `pickupPoint.address`. API will return 400 error again, but app won't break.

---
**Status**: Ready for implementation (AFTER Task 2)
**Estimated time**: 7 minutes
**Risk level**: MEDIUM (changes API request format)
**Priority**: HIGH (blocks order creation)
