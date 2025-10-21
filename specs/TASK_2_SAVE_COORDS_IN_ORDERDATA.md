# Task 2: Save Coordinates in orderData

## Problem Statement
When price calculation completes, XpressApp receives the result with coordinates but doesn't save them to `this.orderData`. This causes order creation to fail because coordinates are not available when building the API request.

## Current Behavior
```javascript
// In XpressApp.js - handleAddressChange()
async handleAddressChange(pickup, delivery) {
    this.orderData.pickup = pickup;
    this.orderData.delivery = delivery;

    await this.priceCalculator.calculatePrice(pickup, delivery);

    const lastCalculation = this.priceCalculator.getLastCalculation();
    if (lastCalculation) {
        this.orderData.distance = lastCalculation.distance;
        this.orderData.timeEstimate = lastCalculation.timeEstimate;
        this.orderData.prices = lastCalculation.prices;
        // ❌ Missing: pickupCoords, deliveryCoords
    }
}
```

## Expected Behavior
Save coordinates from price calculation to `orderData` for later use in order creation.

## Files to Modify
1. **Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/src/components/XpressApp.js`
   - **Method**: `handleAddressChange()` (line ~112)
   - **Property**: `this.orderData` initialization (line ~30)

## Implementation Details

### 1. Update `orderData` initialization (line 30-40)
**Before**:
```javascript
this.orderData = {
    pickup: '',
    delivery: '',
    distance: 0,
    timeEstimate: '',
    selectedPackage: null,
    prices: {},
    contact: {}
};
```

**After**:
```javascript
this.orderData = {
    pickup: '',
    delivery: '',
    distance: 0,
    timeEstimate: '',
    selectedPackage: null,
    prices: {},
    contact: {},
    // ✅ NEW: Store coordinates for API
    pickupCoords: null,
    deliveryCoords: null
};
```

### 2. Update `handleAddressChange()` method (line 112-125)
**Before**:
```javascript
async handleAddressChange(pickup, delivery) {
    this.orderData.pickup = pickup;
    this.orderData.delivery = delivery;

    await this.priceCalculator.calculatePrice(pickup, delivery);

    // Update order data with calculation results
    const lastCalculation = this.priceCalculator.getLastCalculation();
    if (lastCalculation) {
        this.orderData.distance = lastCalculation.distance;
        this.orderData.timeEstimate = lastCalculation.timeEstimate;
        this.orderData.prices = lastCalculation.prices;
    }
}
```

**After**:
```javascript
async handleAddressChange(pickup, delivery) {
    this.orderData.pickup = pickup;
    this.orderData.delivery = delivery;

    await this.priceCalculator.calculatePrice(pickup, delivery);

    // Update order data with calculation results
    const lastCalculation = this.priceCalculator.getLastCalculation();
    if (lastCalculation) {
        this.orderData.distance = lastCalculation.distance;
        this.orderData.timeEstimate = lastCalculation.timeEstimate;
        this.orderData.prices = lastCalculation.prices;

        // ✅ NEW: Save coordinates for order creation
        this.orderData.pickupCoords = lastCalculation.pickupCoords;
        this.orderData.deliveryCoords = lastCalculation.deliveryCoords;
    }
}
```

### 3. Update `startNewOrder()` method (line 285-295)
Reset coords when starting new order.

**Before**:
```javascript
this.orderData = {
    pickup: '',
    delivery: '',
    distance: 0,
    timeEstimate: '',
    selectedPackage: null,
    prices: {},
    contact: {}
};
```

**After**:
```javascript
this.orderData = {
    pickup: '',
    delivery: '',
    distance: 0,
    timeEstimate: '',
    selectedPackage: null,
    prices: {},
    contact: {},
    // ✅ Reset coordinates
    pickupCoords: null,
    deliveryCoords: null
};
```

## Data Structure
After this change, `orderData` will have this structure:
```javascript
{
    pickup: "Marszałkowska 1, Warszawa",
    delivery: "Krakowskie Przedmieście 1, Warszawa",
    distance: 3.2,
    timeEstimate: "8-18",
    selectedPackage: "small",
    prices: { small: 25, medium: 32.5, large: 45 },
    contact: { ... },
    // ✅ NEW FIELDS
    pickupCoords: { lat: 52.2297, lng: 21.0122 },
    deliveryCoords: { lat: 52.2401, lng: 21.0175 }
}
```

## Testing Verification

### Manual Test in Browser Console:
1. Open https://sendxpress.borg.tools
2. In console: `window.xpressApp.orderData`
3. Enter addresses and calculate price
4. In console: `window.xpressApp.orderData` should show:
```javascript
{
  pickup: "Marszałkowska 1, Warszawa",
  delivery: "Krakowskie Przedmieście 1, Warszawa",
  pickupCoords: { lat: 52.2297, lng: 21.0122 }, // ✅
  deliveryCoords: { lat: 52.2401, lng: 21.0175 } // ✅
  // ... other fields
}
```

### Unit Test:
```javascript
const app = new XpressApp();
await app.handleAddressChange('Warszawa, Marszałkowska 1', 'Kraków, Rynek 1');

expect(app.orderData.pickupCoords).not.toBeNull();
expect(app.orderData.deliveryCoords).not.toBeNull();
expect(app.orderData.pickupCoords.lat).toBeCloseTo(52.2, 1);
expect(app.orderData.pickupCoords.lng).toBeCloseTo(21.0, 1);
```

## Success Criteria
- ✅ `orderData` has `pickupCoords` and `deliveryCoords` properties
- ✅ Coordinates are saved when price calculation succeeds
- ✅ Coordinates are `null` when initialized or reset
- ✅ Both coordinates saved together (all-or-nothing)
- ✅ No breaking changes to existing flow

## Dependencies
- **Requires**: Task 1 completed (PriceCalculator returns coords)
- **Used by**: Task 3 (XpressDeliveryService needs these coords)

## Edge Cases
1. **Estimated price with null coords**: Should save `null` to orderData
2. **Price calculation fails**: Coords should remain previous value or `null`
3. **New order**: Reset coords to `null`

## Data Flow After This Change
```
User enters addresses
  ↓
XpressApp.handleAddressChange(pickup, delivery)
  ↓
PriceCalculator.calculatePrice()
  ↓ (returns with pickupCoords, deliveryCoords)
XpressApp saves to orderData.pickupCoords, orderData.deliveryCoords
  ↓ (later...)
XpressApp.processOrderWithMockPayment()
  ↓
XpressDeliveryService.createOrder(orderData)
  ↓ (uses orderData.pickupCoords and deliveryCoords)
```

## Rollback Plan
Remove the two new properties from `orderData` initialization and `handleAddressChange()`.

---
**Status**: Ready for implementation (AFTER Task 1)
**Estimated time**: 3 minutes
**Risk level**: LOW (simple property assignment)
