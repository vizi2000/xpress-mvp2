# CityMatchingService - Example Usage

## Quick Start

```javascript
import { CityMatchingService } from './src/services/CityMatchingService.js';

const cityMatching = new CityMatchingService();
```

## Example 1: Basic City Suggestions

```javascript
// User selects "ul. Długa 1, Gdańsk" as pickup
const pickupCity = 'gdansk';
const allowedCities = cityMatching.suggestDeliveryCities(pickupCity);

console.log(allowedCities);
// Output: ['gdansk', 'gdynia', 'sopot']
```

## Example 2: Validate City Pair

```javascript
// Check if delivery from Gdańsk to Gdynia is allowed
const result = cityMatching.validateCityPair('gdansk', 'gdynia');

console.log(result);
// Output:
// {
//   valid: true,
//   message: '✅ Dostawa możliwa w obrębie Trójmiasta (Gdańsk, Gdynia, Sopot)',
//   pickupCity: { id: 'gdansk', name: 'Gdańsk', ... },
//   deliveryCity: { id: 'gdynia', name: 'Gdynia', ... },
//   compatibleCities: ['gdansk', 'gdynia', 'sopot']
// }
```

## Example 3: Invalid City Pair

```javascript
// Try to deliver from Kraków to Gdańsk (not allowed)
const result = cityMatching.validateCityPair('krakow', 'gdansk');

console.log(result);
// Output:
// {
//   valid: false,
//   message: '❌ Dostawa z Krakowa możliwa tylko w obrębie Krakowa',
//   pickupCity: { id: 'krakow', name: 'Kraków', ... },
//   deliveryCity: { id: 'gdansk', name: 'Gdańsk', ... },
//   compatibleCities: ['krakow']
// }
```

## Example 4: Event System

```javascript
// Listen for pickup city changes
cityMatching.addEventListener('pickupCityChanged', (data) => {
    console.log('Pickup city:', data.cityId);
    console.log('Allowed delivery cities:', data.allowedDeliveryCities);

    // Update UI - restrict delivery city autocomplete to allowed cities
    updateDeliveryAutocomplete(data.allowedDeliveryCities);
});

// Listen for delivery city changes
cityMatching.addEventListener('deliveryCityChanged', (data) => {
    console.log('Delivery city:', data.cityId);
    console.log('Validation:', data.validation);

    if (data.validation && !data.validation.valid) {
        // Show error to user
        showError(data.validation.message);
    }
});

// Listen for validation failures
cityMatching.addEventListener('validationFailed', (data) => {
    console.warn('Invalid city pair:', data.pickupCityId, '→', data.deliveryCityId);
    showError(data.validation.message);
});

// Set pickup city (triggers pickupCityChanged event)
cityMatching.setPickupCity('gdansk');
```

## Example 5: Integration with AddressForm

```javascript
// When user selects pickup address
function onPickupAddressSelected(address) {
    // Extract city from address
    const cityId = Validators.extractCityFromAddress(address);

    if (cityId) {
        // Set pickup city in service
        cityMatching.setPickupCity(cityId);

        // Get allowed delivery cities
        const allowedCities = cityMatching.suggestDeliveryCities(cityId);

        // Update delivery autocomplete to only show allowed cities
        restrictDeliveryAutocomplete(allowedCities);
    }
}

// When user selects delivery address
function onDeliveryAddressSelected(address) {
    // Extract city from address
    const cityId = Validators.extractCityFromAddress(address);

    if (cityId) {
        // Set delivery city in service
        cityMatching.setDeliveryCity(cityId);

        // Get current state
        const state = cityMatching.getCurrentState();

        if (state.isValid) {
            console.log('✅ Valid city pair!');
            enableOrderButton();
        } else {
            console.log('❌ Invalid city pair!');
            disableOrderButton();
            showError(state.validation.message);
        }
    }
}
```

## Example 6: Form Validation Before Submission

```javascript
function validateOrderForm() {
    const state = cityMatching.getCurrentState();

    if (!state.pickupCity) {
        showError('Proszę wybrać adres odbioru');
        return false;
    }

    if (!state.deliveryCity) {
        showError('Proszę wybrać adres dostawy');
        return false;
    }

    if (!state.isValid) {
        showError(state.validation.message);
        return false;
    }

    console.log('✅ Form validation passed!');
    return true;
}

// Before submitting order
if (validateOrderForm()) {
    submitOrder();
}
```

## Example 7: Get City Display Information

```javascript
// Get user-friendly info about Gdańsk
const info = cityMatching.getCityDisplayInfo('gdansk');

console.log(info);
// Output:
// {
//   id: 'gdansk',
//   name: 'Gdańsk',
//   group: 'trojmiasto',
//   groupDisplayName: 'Trójmiasto',
//   compatibleCities: ['gdansk', 'gdynia', 'sopot'],
//   compatibleCitiesNames: ['Gdańsk', 'Gdynia', 'Sopot']
// }

// Display to user
console.log(`${info.name} - możliwa dostawa do: ${info.compatibleCitiesNames.join(', ')}`);
// Output: "Gdańsk - możliwa dostawa do: Gdańsk, Gdynia, Sopot"
```

## Example 8: Reset Form

```javascript
// Listen for reset event
cityMatching.addEventListener('reset', () => {
    console.log('Form reset - clearing all restrictions');
    resetDeliveryAutocomplete();
    clearForm();
});

// Reset button click
function onResetButtonClick() {
    cityMatching.reset();
}
```

## Example 9: Katowice Metro Example

```javascript
// User selects pickup in Katowice
cityMatching.setPickupCity('katowice');

// Get allowed delivery cities
const cities = cityMatching.suggestDeliveryCities('katowice');
console.log(cities);
// Output: ['katowice', 'sosnowiec', 'bytom', 'chorzow', 'zabrze', 'gliwice', 'tychy']

// Validate delivery to Sosnowiec
const result = cityMatching.validateCityPair('katowice', 'sosnowiec');
console.log(result.message);
// Output: '✅ Dostawa możliwa w obrębie Aglomeracji Katowickiej'
```

## Example 10: Current State Monitoring

```javascript
// Get current state at any time
const state = cityMatching.getCurrentState();

console.log('Current State:', {
    pickup: state.pickupCity,
    delivery: state.deliveryCity,
    isValid: state.isValid,
    message: state.validation?.message
});

// Output when both cities selected:
// {
//   pickup: 'gdansk',
//   delivery: 'gdynia',
//   isValid: true,
//   message: '✅ Dostawa możliwa w obrębie Trójmiasta (Gdańsk, Gdynia, Sopot)'
// }
```

## All Supported Cities

```javascript
import { ALL_CITY_IDS } from './src/config/cities.config.js';

console.log(ALL_CITY_IDS);
// Output: [
//   'gdansk', 'gdynia', 'sopot',                                    // Trójmiasto
//   'katowice', 'sosnowiec', 'bytom', 'chorzow', 'zabrze',         // Katowice Metro
//   'gliwice', 'tychy',                                            // Katowice Metro (cont.)
//   'krakow', 'wroclaw', 'lodz', 'poznan', 'szczecin',            // Single cities
//   'rzeszow', 'radom'                                             // Single cities (cont.)
// ]
```

## Testing in Browser Console

Open `http://localhost:8082/test-city-matching.html` to run comprehensive test suite.

Or test manually in browser console:

```javascript
// Load service
import { CityMatchingService } from './src/services/CityMatchingService.js';
const service = new CityMatchingService();

// Test Trójmiasto
service.suggestDeliveryCities('gdansk');
// → ['gdansk', 'gdynia', 'sopot']

// Test validation
service.validateCityPair('gdansk', 'gdynia');
// → { valid: true, message: '✅ Dostawa możliwa...' }

// Test state
service.setPickupCity('gdansk');
service.setDeliveryCity('gdynia');
service.getCurrentState();
// → { pickupCity: 'gdansk', deliveryCity: 'gdynia', isValid: true, ... }
```

## Best Practices

1. **Always set pickup city first** - This triggers the restriction of delivery cities
2. **Listen to events** - Use event system to update UI dynamically
3. **Validate before submission** - Always check `getCurrentState().isValid` before creating order
4. **Handle edge cases** - Check for null cities, invalid IDs, etc.
5. **Use Polish messages** - All user-facing messages are in Polish
6. **Log for debugging** - Service logs all operations with `[CityMatching]` prefix
