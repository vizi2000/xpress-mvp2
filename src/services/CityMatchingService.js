/**
 * City Matching Service
 *
 * CORE BUSINESS LOGIC SERVICE - The brain of the city restriction system.
 * Orchestrates smart city matching for the courier service app.
 *
 * Responsibilities:
 * - Determines which cities can deliver to each other
 * - Provides allowed delivery cities based on pickup city
 * - Manages state of currently selected pickup/delivery cities
 * - Emits events when city selections change
 * - Validates city pairs before allowing order creation
 *
 * @module CityMatchingService
 * @author The Collective Borg.tools
 */

import {
    SUPPORTED_CITIES,
    ALL_CITY_IDS,
    CITY_GROUPS,
    CITY_GROUP,
    getCityById,
    getCityGroup,
    getGroupCities,
    canDeliverBetween
} from '../config/cities.config.js';

import { Validators } from '../utils/Validators.js';

/**
 * Polish group display names for user-friendly messages
 * @constant
 * @private
 */
const GROUP_DISPLAY_NAMES = {
    trojmiasto: 'Trójmiasto',
    katowice_metro: 'Aglomeracja Katowicka',
    single: null  // Single cities don't have group name
};

/**
 * User-friendly Polish messages
 * @constant
 * @private
 */
const MESSAGES = {
    TROJMIASTO_VALID: '✅ Dostawa możliwa w obrębie Trójmiasta (Gdańsk, Gdynia, Sopot)',
    KATOWICE_VALID: '✅ Dostawa możliwa w obrębie Aglomeracji Katowickiej',
    SAME_CITY_VALID: '✅ Dostawa możliwa w obrębie miasta {cityName}',
    DIFFERENT_GROUPS: '❌ Dostawa z {pickupCity} możliwa tylko w obrębie {groupName}',
    INVALID_CITY: '❌ Nieprawidłowy identyfikator miasta',
    SUCCESS: '✅ Miasta są zgodne',
    PICKUP_NOT_SET: '⚠️ Najpierw wybierz miasto odbioru',
};

/**
 * CityMatchingService - Smart city matching and validation
 *
 * This is the BRAIN of the city restriction system. It manages which cities
 * can deliver to each other and provides real-time validation.
 *
 * @class
 *
 * @example
 * const service = new CityMatchingService();
 *
 * // Listen for changes
 * service.addEventListener('pickupCityChanged', (data) => {
 *     console.log('Allowed delivery cities:', data.allowedDeliveryCities);
 * });
 *
 * // Set pickup city
 * service.setPickupCity('gdansk');
 *
 * // Get allowed delivery cities
 * const cities = service.suggestDeliveryCities('gdansk');
 * // → ['gdansk', 'gdynia', 'sopot']
 *
 * // Validate city pair
 * const result = service.validateCityPair('gdansk', 'gdynia');
 * // → { valid: true, message: '✅ Dostawa możliwa...', ... }
 */
export class CityMatchingService {
    /**
     * Create a new CityMatchingService instance
     */
    constructor() {
        /**
         * Currently selected pickup city ID
         * @type {string|null}
         * @private
         */
        this.currentPickupCity = null;

        /**
         * Currently selected delivery city ID
         * @type {string|null}
         * @private
         */
        this.currentDeliveryCity = null;

        /**
         * Event listeners registry
         * @type {Array<{event: string, callback: Function}>}
         * @private
         */
        this.listeners = [];

        console.log('[CityMatching] Service initialized');
    }

    /**
     * Suggest delivery cities based on pickup city
     *
     * Business Rules:
     * - If pickupCityId is in Trójmiasto → return ['gdansk', 'gdynia', 'sopot']
     * - If pickupCityId is in Katowice Metro → return all 7 Katowice metro cities
     * - If pickupCityId is single-city → return [pickupCityId] (same city only)
     * - If pickupCityId is null/invalid → return ALL_CITY_IDS (all supported cities)
     *
     * @param {string|null} pickupCityId - Pickup city ID (e.g., 'gdansk', 'krakow')
     * @returns {string[]} Array of city IDs that can receive deliveries
     *
     * @example
     * suggestDeliveryCities('gdansk')     // → ['gdansk', 'gdynia', 'sopot']
     * suggestDeliveryCities('krakow')     // → ['krakow']
     * suggestDeliveryCities('katowice')   // → ['katowice', 'sosnowiec', 'bytom', 'chorzow', 'zabrze', 'gliwice', 'tychy']
     * suggestDeliveryCities(null)         // → ALL_CITY_IDS (all 17 cities)
     */
    suggestDeliveryCities(pickupCityId) {
        // If no pickup city, allow all cities
        if (!pickupCityId) {
            console.log('[CityMatching] No pickup city - suggesting all cities:', ALL_CITY_IDS);
            return [...ALL_CITY_IDS];
        }

        // Validate pickup city exists
        const pickupCity = getCityById(pickupCityId);
        if (!pickupCity) {
            console.warn('[CityMatching] Invalid pickup city ID:', pickupCityId, '- suggesting all cities');
            return [...ALL_CITY_IDS];
        }

        // Get city group
        const group = getCityGroup(pickupCityId);
        console.log('[CityMatching] Pickup city:', pickupCityId, '- Group:', group);

        // Handle multi-city groups (Trójmiasto, Katowice Metro)
        if (group === CITY_GROUP.TROJMIASTO) {
            const cities = CITY_GROUPS[CITY_GROUP.TROJMIASTO];
            console.log('[CityMatching] Trójmiasto group - suggesting:', cities);
            return [...cities];
        }

        if (group === CITY_GROUP.KATOWICE_METRO) {
            const cities = CITY_GROUPS[CITY_GROUP.KATOWICE_METRO];
            console.log('[CityMatching] Katowice Metro group - suggesting:', cities);
            return [...cities];
        }

        // Single-city group - only same city allowed
        console.log('[CityMatching] Single-city operation - suggesting only:', [pickupCityId]);
        return [pickupCityId];
    }

    /**
     * Validate if delivery is allowed between two cities
     *
     * @param {string} pickupCityId - Pickup city ID
     * @param {string} deliveryCityId - Delivery city ID
     * @returns {{valid: boolean, message: string, pickupCity: Object|null, deliveryCity: Object|null, compatibleCities: string[]}} Validation result
     *
     * @example
     * validateCityPair('gdansk', 'gdynia')
     * // → { valid: true, message: '✅ Dostawa możliwa w obrębie Trójmiasta', ... }
     *
     * validateCityPair('krakow', 'gdansk')
     * // → { valid: false, message: '❌ Dostawa z Krakowa możliwa tylko w obrębie Krakowa', ... }
     *
     * validateCityPair('katowice', 'sosnowiec')
     * // → { valid: true, message: '✅ Dostawa możliwa w obrębie Aglomeracji Katowickiej', ... }
     */
    validateCityPair(pickupCityId, deliveryCityId) {
        console.log('[CityMatching] Validating city pair:', pickupCityId, '→', deliveryCityId);

        // Get city configurations
        const pickupCity = getCityById(pickupCityId);
        const deliveryCity = getCityById(deliveryCityId);

        // Validate both cities exist
        if (!pickupCity) {
            console.error('[CityMatching] Pickup city not found:', pickupCityId);
            return {
                valid: false,
                message: MESSAGES.INVALID_CITY,
                pickupCity: null,
                deliveryCity: deliveryCity,
                compatibleCities: []
            };
        }

        if (!deliveryCity) {
            console.error('[CityMatching] Delivery city not found:', deliveryCityId);
            return {
                valid: false,
                message: MESSAGES.INVALID_CITY,
                pickupCity: pickupCity,
                deliveryCity: null,
                compatibleCities: []
            };
        }

        // Get compatible cities for pickup
        const compatibleCities = this.suggestDeliveryCities(pickupCityId);

        // Check if delivery is allowed
        const isCompatible = canDeliverBetween(pickupCityId, deliveryCityId);

        // Generate appropriate message
        let message;
        if (isCompatible) {
            // Same city
            if (pickupCityId === deliveryCityId) {
                message = MESSAGES.SAME_CITY_VALID.replace('{cityName}', pickupCity.name);
            }
            // Trójmiasto
            else if (pickupCity.group === CITY_GROUP.TROJMIASTO) {
                message = MESSAGES.TROJMIASTO_VALID;
            }
            // Katowice Metro
            else if (pickupCity.group === CITY_GROUP.KATOWICE_METRO) {
                message = MESSAGES.KATOWICE_VALID;
            }
            // Fallback success
            else {
                message = MESSAGES.SUCCESS;
            }
        } else {
            // Different groups - show error
            if (pickupCity.group === CITY_GROUP.SINGLE) {
                message = MESSAGES.DIFFERENT_GROUPS
                    .replace('{pickupCity}', pickupCity.name)
                    .replace('{groupName}', pickupCity.name);
            } else {
                const groupName = GROUP_DISPLAY_NAMES[pickupCity.group] || pickupCity.group;
                message = MESSAGES.DIFFERENT_GROUPS
                    .replace('{pickupCity}', pickupCity.name)
                    .replace('{groupName}', groupName);
            }
        }

        const result = {
            valid: isCompatible,
            message: message,
            pickupCity: pickupCity,
            deliveryCity: deliveryCity,
            compatibleCities: compatibleCities
        };

        console.log('[CityMatching] Validation result:', result.valid ? '✅ VALID' : '❌ INVALID', '-', message);

        return result;
    }

    /**
     * Set current pickup city and trigger event
     *
     * @param {string} cityId - City ID to set as pickup
     * @fires pickupCityChanged
     *
     * @example
     * service.setPickupCity('gdansk');
     * // Triggers event with { cityId: 'gdansk', allowedDeliveryCities: [...] }
     */
    setPickupCity(cityId) {
        console.log('[CityMatching] Setting pickup city:', cityId);

        // Validate city ID
        const city = getCityById(cityId);
        if (!city) {
            console.error('[CityMatching] Invalid city ID:', cityId);
            return;
        }

        // Set pickup city
        this.currentPickupCity = cityId;

        // Clear delivery city (force user to reselect)
        this.currentDeliveryCity = null;
        console.log('[CityMatching] Cleared delivery city (must reselect)');

        // Get allowed delivery cities
        const allowedDeliveryCities = this.suggestDeliveryCities(cityId);

        // Trigger event
        this.triggerEvent('pickupCityChanged', {
            cityId: cityId,
            city: city,
            allowedDeliveryCities: allowedDeliveryCities
        });

        console.log('[CityMatching] Pickup city set:', cityId, '- Allowed delivery cities:', allowedDeliveryCities);
    }

    /**
     * Set current delivery city and trigger event
     *
     * @param {string} cityId - City ID to set as delivery
     * @fires deliveryCityChanged
     * @fires validationFailed (if incompatible with pickup)
     *
     * @example
     * service.setDeliveryCity('gdynia');
     * // Triggers event with { cityId: 'gdynia', validation: {...} }
     */
    setDeliveryCity(cityId) {
        console.log('[CityMatching] Setting delivery city:', cityId);

        // Validate city ID
        const city = getCityById(cityId);
        if (!city) {
            console.error('[CityMatching] Invalid city ID:', cityId);
            return;
        }

        // Check compatibility with pickup (if set)
        let validation = null;
        if (this.currentPickupCity) {
            validation = this.validateCityPair(this.currentPickupCity, cityId);

            if (!validation.valid) {
                console.warn('[CityMatching] Incompatible city pair:', this.currentPickupCity, '→', cityId);
                this.triggerEvent('validationFailed', {
                    pickupCityId: this.currentPickupCity,
                    deliveryCityId: cityId,
                    validation: validation
                });
            }
        }

        // Set delivery city
        this.currentDeliveryCity = cityId;

        // Trigger event
        this.triggerEvent('deliveryCityChanged', {
            cityId: cityId,
            city: city,
            validation: validation
        });

        console.log('[CityMatching] Delivery city set:', cityId, validation ? `- Valid: ${validation.valid}` : '');
    }

    /**
     * Get user-friendly display information about a city
     *
     * @param {string} cityId - City ID
     * @returns {{id: string, name: string, group: string, groupDisplayName: string|null, compatibleCities: string[], compatibleCitiesNames: string[]}|null} City display info
     *
     * @example
     * getCityDisplayInfo('gdansk')
     * // → {
     * //   id: 'gdansk',
     * //   name: 'Gdańsk',
     * //   group: 'trojmiasto',
     * //   groupDisplayName: 'Trójmiasto',
     * //   compatibleCities: ['gdansk', 'gdynia', 'sopot'],
     * //   compatibleCitiesNames: ['Gdańsk', 'Gdynia', 'Sopot']
     * // }
     */
    getCityDisplayInfo(cityId) {
        const city = getCityById(cityId);
        if (!city) {
            console.error('[CityMatching] City not found:', cityId);
            return null;
        }

        const compatibleCities = this.suggestDeliveryCities(cityId);
        const compatibleCitiesNames = compatibleCities
            .map(id => getCityById(id))
            .filter(Boolean)
            .map(c => c.name);

        return {
            id: city.id,
            name: city.name,
            group: city.group,
            groupDisplayName: GROUP_DISPLAY_NAMES[city.group] || null,
            compatibleCities: compatibleCities,
            compatibleCitiesNames: compatibleCitiesNames
        };
    }

    /**
     * Register event listener
     *
     * Supported events:
     * - 'pickupCityChanged' - Fired when pickup city changes
     * - 'deliveryCityChanged' - Fired when delivery city changes
     * - 'validationFailed' - Fired when city pair validation fails
     * - 'reset' - Fired when state is reset
     *
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     *
     * @example
     * service.addEventListener('pickupCityChanged', (data) => {
     *     console.log('Pickup changed to:', data.cityId);
     *     console.log('Allowed delivery cities:', data.allowedDeliveryCities);
     * });
     */
    addEventListener(event, callback) {
        if (typeof callback !== 'function') {
            console.error('[CityMatching] Invalid callback for event:', event);
            return;
        }

        this.listeners.push({ event, callback });
        console.log('[CityMatching] Event listener added:', event, '- Total listeners:', this.listeners.length);
    }

    /**
     * Unregister event listener
     *
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     *
     * @example
     * service.removeEventListener('pickupCityChanged', handler);
     */
    removeEventListener(event, callback) {
        const beforeCount = this.listeners.length;
        this.listeners = this.listeners.filter(
            l => !(l.event === event && l.callback === callback)
        );
        const afterCount = this.listeners.length;

        if (beforeCount !== afterCount) {
            console.log('[CityMatching] Event listener removed:', event, '- Remaining:', afterCount);
        }
    }

    /**
     * Trigger event and notify all listeners
     *
     * @private
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    triggerEvent(eventName, data) {
        const listeners = this.listeners.filter(l => l.event === eventName);

        if (listeners.length === 0) {
            console.log('[CityMatching] No listeners for event:', eventName);
            return;
        }

        console.log('[CityMatching] Triggering event:', eventName, '- Listeners:', listeners.length);

        listeners.forEach(listener => {
            try {
                listener.callback(data);
            } catch (error) {
                console.error('[CityMatching] Event handler error:', error);
            }
        });
    }

    /**
     * Reset all state (for form reset)
     *
     * @fires reset
     *
     * @example
     * service.reset();
     * // Clears pickup and delivery cities, triggers 'reset' event
     */
    reset() {
        console.log('[CityMatching] Resetting state');

        this.currentPickupCity = null;
        this.currentDeliveryCity = null;

        this.triggerEvent('reset', {
            timestamp: new Date().toISOString()
        });

        console.log('[CityMatching] State reset complete');
    }

    /**
     * Get current state for debugging
     *
     * @returns {{pickupCity: string|null, deliveryCity: string|null, isValid: boolean, validation: Object|null}} Current state
     *
     * @example
     * const state = service.getCurrentState();
     * // → {
     * //   pickupCity: 'gdansk',
     * //   deliveryCity: 'gdynia',
     * //   isValid: true,
     * //   validation: { valid: true, message: '✅ Dostawa możliwa...', ... }
     * // }
     */
    getCurrentState() {
        let validation = null;
        let isValid = false;

        if (this.currentPickupCity && this.currentDeliveryCity) {
            validation = this.validateCityPair(this.currentPickupCity, this.currentDeliveryCity);
            isValid = validation.valid;
        } else if (this.currentPickupCity) {
            // Pickup set but no delivery - not complete but not invalid
            isValid = false;
        }

        return {
            pickupCity: this.currentPickupCity,
            deliveryCity: this.currentDeliveryCity,
            isValid: isValid,
            validation: validation
        };
    }
}

// Module initialization log
console.log('✅ CityMatchingService loaded - Smart city matching service ready');
