# Task 1: Save Coordinates During Price Calculation

## Problem Statement
Currently, `PriceCalculator.calculatePrice()` calls `GoogleMapsService.calculateDistance()` which returns coordinates (`pickupCoords`, `deliveryCoords`), but these coordinates are not passed forward to the caller. This causes the order creation to fail because Xpress API requires lat/lng in the order payload.

## Current Behavior
```javascript
// In PriceCalculator.js - calculateRealPrice()
const routeData = await this.googleMapsService.calculateDistance(pickupAddress, deliveryAddress);
// routeData contains: { distance, duration, pickupCoords, deliveryCoords }

return {
    distance: routeData.distance.toFixed(1),
    timeEstimate: `${Math.floor(routeData.duration)}-${Math.floor(routeData.duration) + 10}`,
    prices: prices,
    breakdown: this.pricingService.getPricingBreakdown(routeData.distance)
    // ❌ Missing: pickupCoords, deliveryCoords
};
```

## Expected Behavior
Return coordinates along with price calculation results.

## File to Modify
- **Path**: `/Users/wojciechwiesner/ai/xpress-mvp2/src/components/PriceCalculator.js`
- **Methods**: `calculateRealPrice()`, `calculateEstimatedPrice()`, `getLastCalculation()`

## Implementation Details

### 1. Update `calculateRealPrice()` method (line 40-59)
**Before**:
```javascript
async calculateRealPrice(pickupAddress, deliveryAddress) {
    this.pricingService.validateCitySupport(pickupAddress, deliveryAddress);
    const routeData = await this.googleMapsService.calculateDistance(pickupAddress, deliveryAddress);
    this.pricingService.validateDistance(routeData.distance);
    const prices = this.pricingService.calculatePrices(routeData.distance);

    return {
        distance: routeData.distance.toFixed(1),
        timeEstimate: `${Math.floor(routeData.duration)}-${Math.floor(routeData.duration) + 10}`,
        prices: prices,
        breakdown: this.pricingService.getPricingBreakdown(routeData.distance)
    };
}
```

**After**:
```javascript
async calculateRealPrice(pickupAddress, deliveryAddress) {
    this.pricingService.validateCitySupport(pickupAddress, deliveryAddress);
    const routeData = await this.googleMapsService.calculateDistance(pickupAddress, deliveryAddress);
    this.pricingService.validateDistance(routeData.distance);
    const prices = this.pricingService.calculatePrices(routeData.distance);

    return {
        distance: routeData.distance.toFixed(1),
        timeEstimate: `${Math.floor(routeData.duration)}-${Math.floor(routeData.duration) + 10}`,
        prices: prices,
        breakdown: this.pricingService.getPricingBreakdown(routeData.distance),
        // ✅ NEW: Include coordinates
        pickupCoords: routeData.pickupCoords,
        deliveryCoords: routeData.deliveryCoords
    };
}
```

### 2. Update `calculateEstimatedPrice()` method (line 62-85)
For estimated prices, we don't have real coordinates. Return `null` to indicate this.

**Add to return object**:
```javascript
return {
    distance: estimatedDistance.toFixed(1),
    timeEstimate: `${Math.floor(estimatedDistance * 2.5)}-${Math.floor(estimatedDistance * 2.5) + 10}`,
    prices: prices,
    breakdown: this.pricingService.getPricingBreakdown(estimatedDistance),
    estimated: true,
    // ✅ NEW: Null for estimated (no real geocoding)
    pickupCoords: null,
    deliveryCoords: null
};
```

### 3. Verify `showResults()` method (line 97)
**Current code** (line 97-110):
```javascript
showResults(result) {
    const distanceText = result.estimated ? `~${result.distance} km (szacowane)` : `${result.distance} km`;
    UIHelpers.updateText('distance-display', distanceText);
    UIHelpers.updateText('time-estimate', `${result.timeEstimate} min`);

    // Update prices for each package type
    Object.keys(result.prices).forEach(packageType => {
        UIHelpers.updateText(`price-${packageType}`, `${result.prices[packageType]} zł`);
    });

    // Store last calculation for later use
    this.lastCalculation = result;
    // ... rest of method
}
```

**Action**: No changes needed, but verify that `this.lastCalculation = result;` now includes coordinates.

### 4. Update `getLastCalculation()` method (line ~140)
**Verify** it returns the full `lastCalculation` object with coordinates:
```javascript
getLastCalculation() {
    return this.lastCalculation; // Should now include pickupCoords/deliveryCoords
}
```

## Data Flow
```
GoogleMapsService.calculateDistance()
  ↓ returns { distance, duration, pickupCoords, deliveryCoords }
PriceCalculator.calculateRealPrice()
  ↓ returns { distance, timeEstimate, prices, breakdown, pickupCoords, deliveryCoords }
PriceCalculator.showResults(result)
  ↓ stores in this.lastCalculation
PriceCalculator.getLastCalculation()
  ↓ returns to XpressApp
XpressApp.handleAddressChange()
  ↓ saves to this.orderData.pickupCoords, this.orderData.deliveryCoords
```

## Testing Verification

### Manual Test:
1. Open browser console on https://sendxpress.borg.tools
2. Enter pickup address: "Marszałkowska 1, Warszawa"
3. Enter delivery address: "Krakowskie Przedmieście 1, Warszawa"
4. Check console for: `console.log(lastCalculation)` should show:
```javascript
{
  distance: "3.2",
  timeEstimate: "8-18",
  prices: { small: 25, medium: 32.5, large: 45 },
  pickupCoords: { lat: 52.2297, lng: 21.0122 }, // ✅ Should exist
  deliveryCoords: { lat: 52.2401, lng: 21.0175 } // ✅ Should exist
}
```

### Unit Test:
```javascript
const result = await priceCalculator.calculateRealPrice('Warszawa', 'Kraków');
expect(result.pickupCoords).toBeDefined();
expect(result.deliveryCoords).toBeDefined();
expect(result.pickupCoords.lat).toBeCloseTo(52.2, 1);
expect(result.pickupCoords.lng).toBeCloseTo(21.0, 1);
```

## Success Criteria
- ✅ `calculateRealPrice()` returns `pickupCoords` and `deliveryCoords`
- ✅ `calculateEstimatedPrice()` returns `null` for coords (with comment explaining why)
- ✅ `getLastCalculation()` includes coordinates in returned object
- ✅ No breaking changes to existing functionality
- ✅ Console shows coordinates when price is calculated

## Dependencies
- **Requires**: GoogleMapsService already returns coordinates (VERIFIED ✅)
- **Used by**: Task 2 (XpressApp needs these coords)

## Edge Cases
1. **Estimated price**: Return `null` for coords (no real geocoding done)
2. **API failure**: If GoogleMaps/LocationIQ fails, coords should be `null`
3. **Partial data**: If only one address geocoded, both should be `null` (all-or-nothing)

## Rollback Plan
If this breaks anything, revert by removing the two new fields from return objects.

---
**Status**: Ready for implementation
**Estimated time**: 5 minutes
**Risk level**: LOW (additive change, no removals)
