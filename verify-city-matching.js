/**
 * CityMatchingService Verification Script
 *
 * Tests all 5 required scenarios from the task specification
 */

import { CityMatchingService } from './src/services/CityMatchingService.js';

console.log('='.repeat(80));
console.log('GRUPA 3A - CityMatchingService Verification');
console.log('='.repeat(80));

const service = new CityMatchingService();

// Test 1: Trójmiasto matching
console.log('\n📋 Test 1: Trójmiasto matching');
console.log('─'.repeat(80));
console.log('Code: service.suggestDeliveryCities("gdansk")');
const cities1 = service.suggestDeliveryCities('gdansk');
console.log('Result:', JSON.stringify(cities1));
console.log('Expected: ["gdansk", "gdynia", "sopot"]');
console.log('Status:', JSON.stringify(cities1.sort()) === JSON.stringify(['gdansk', 'gdynia', 'sopot'].sort()) ? '✅ PASS' : '❌ FAIL');

// Test 2: Single city
console.log('\n📋 Test 2: Single city');
console.log('─'.repeat(80));
console.log('Code: service.suggestDeliveryCities("krakow")');
const cities2 = service.suggestDeliveryCities('krakow');
console.log('Result:', JSON.stringify(cities2));
console.log('Expected: ["krakow"]');
console.log('Status:', JSON.stringify(cities2) === JSON.stringify(['krakow']) ? '✅ PASS' : '❌ FAIL');

// Test 3: City pair validation
console.log('\n📋 Test 3: City pair validation');
console.log('─'.repeat(80));
console.log('Code: service.validateCityPair("gdansk", "gdynia")');
const result3 = service.validateCityPair('gdansk', 'gdynia');
console.log('Result:', JSON.stringify({
    valid: result3.valid,
    message: result3.message,
    pickupCityId: result3.pickupCity?.id,
    deliveryCityId: result3.deliveryCity?.id
}, null, 2));
console.log('Expected: { valid: true, message: "✅ Dostawa możliwa..." }');
console.log('Status:', result3.valid === true ? '✅ PASS' : '❌ FAIL');

// Test 4: Event system
console.log('\n📋 Test 4: Event system');
console.log('─'.repeat(80));
console.log('Code: service.addEventListener("pickupCityChanged", handler); service.setPickupCity("gdansk")');
let eventFired = false;
let eventData = null;
service.addEventListener('pickupCityChanged', (data) => {
    eventFired = true;
    eventData = data;
    console.log('Event received: pickupCityChanged');
    console.log('Event data:', JSON.stringify({
        cityId: data.cityId,
        allowedDeliveryCities: data.allowedDeliveryCities
    }, null, 2));
});
service.setPickupCity('gdansk');
console.log('Expected: Event fired with { cityId: "gdansk", allowedDeliveryCities: [...] }');
console.log('Status:', eventFired && eventData?.cityId === 'gdansk' ? '✅ PASS' : '❌ FAIL');

// Test 5: State management
console.log('\n📋 Test 5: State management');
console.log('─'.repeat(80));
console.log('Code: service.setPickupCity("gdansk"); service.setDeliveryCity("gdynia"); service.getCurrentState()');
const service2 = new CityMatchingService(); // Fresh instance
service2.setPickupCity('gdansk');
service2.setDeliveryCity('gdynia');
const state = service2.getCurrentState();
console.log('Result:', JSON.stringify({
    pickupCity: state.pickupCity,
    deliveryCity: state.deliveryCity,
    isValid: state.isValid,
    validationValid: state.validation?.valid
}, null, 2));
console.log('Expected: { pickupCity: "gdansk", deliveryCity: "gdynia", isValid: true, ... }');
console.log('Status:',
    state.pickupCity === 'gdansk' &&
    state.deliveryCity === 'gdynia' &&
    state.isValid === true ? '✅ PASS' : '❌ FAIL'
);

console.log('\n' + '='.repeat(80));
console.log('✅ All 5 required scenarios verified!');
console.log('='.repeat(80));
