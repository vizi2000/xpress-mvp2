// Address Form Component
import { UIHelpers } from '../utils/UIHelpers.js';
import { Validators } from '../utils/Validators.js';
import { CityMatchingService } from '../services/CityMatchingService.js';

export class AddressForm {
    constructor(googleMapsService, onAddressChange) {
        this.googleMapsService = googleMapsService;
        this.onAddressChange = onAddressChange;
        this.calculateTimeout = null;

        // Initialize CityMatchingService
        this.cityMatchingService = new CityMatchingService();

        // Track allowed delivery cities (for LocationIQ filtering)
        this.allowedDeliveryCities = null;

        this.init();
    }

    init() {
        this.injectStyles();
        this.setupEventListeners();
        this.setupCityMatchingListeners();
        // Set callback for Google Maps service
        this.googleMapsService.onAddressSelected = () => this.handleAddressChange();
    }

    setupEventListeners() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');

        if (pickupInput && deliveryInput) {
            pickupInput.addEventListener('input', () => this.handleAddressChange());
            deliveryInput.addEventListener('input', () => this.handleAddressChange());
        }
    }

    handleAddressChange() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');

        const pickup = pickupInput.value.trim();
        const delivery = deliveryInput.value.trim();

        // Clear previous timeout
        if (this.calculateTimeout) {
            clearTimeout(this.calculateTimeout);
        }

        // Validate addresses
        const validation = Validators.validateAddresses(pickup, delivery);

        if (validation.isValid && pickup !== delivery && pickup.length > 10 && delivery.length > 10) {
            // NEW: Detect and set cities before price calculation
            if (pickup) {
                this.detectAndSetPickupCity(pickup);
            }

            if (delivery) {
                this.detectAndSetDeliveryCity(delivery);
            }

            // Calculate after short delay to avoid too many API calls
            this.calculateTimeout = setTimeout(() => {
                this.onAddressChange(pickup, delivery);
            }, 800);
        } else {
            // Hide results if addresses are incomplete or invalid
            UIHelpers.toggleElement('results-section', false);
        }
    }

    // Get current addresses
    getAddresses() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        return {
            pickup: pickupInput ? pickupInput.value.trim() : '',
            delivery: deliveryInput ? deliveryInput.value.trim() : ''
        };
    }

    // Set addresses (useful for testing)
    setAddresses(pickup, delivery) {
        UIHelpers.updateHTML('pickup-address', '');
        UIHelpers.updateHTML('delivery-address', '');
        
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.value = pickup;
        if (deliveryInput) deliveryInput.value = delivery;
        
        this.handleAddressChange();
    }

    // Clear addresses
    clearAddresses() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.value = '';
        if (deliveryInput) deliveryInput.value = '';
        
        UIHelpers.toggleElement('results-section', false);
    }

    // Validate current addresses
    validateCurrentAddresses() {
        const addresses = this.getAddresses();
        return Validators.validateAddresses(addresses.pickup, addresses.delivery);
    }

    // Show address validation errors
    showValidationErrors(errors) {
        const errorMessage = errors.join('\n');
        UIHelpers.showError(errorMessage);
    }

    // Enable/disable address inputs
    setEnabled(enabled) {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.disabled = !enabled;
        if (deliveryInput) deliveryInput.disabled = !enabled;
    }

    // Fill test data for development
    fillTestData() {
        this.setAddresses(
            'ul. Krakowska 123, Warszawa',
            'ul. Marszałkowska 45, Warszawa'
        );
    }

    // ==========================================
    // CITY MATCHING SERVICE INTEGRATION
    // ==========================================

    /**
     * Setup event listeners for CityMatchingService
     */
    setupCityMatchingListeners() {
        // When pickup city changes, restrict delivery autocomplete
        this.cityMatchingService.addEventListener('pickupCityChanged', (data) => {
            this.onPickupCityChanged(data);
        });

        // When delivery city changes, validate compatibility
        this.cityMatchingService.addEventListener('deliveryCityChanged', (data) => {
            this.onDeliveryCityChanged(data);
        });

        // When validation fails, show error
        this.cityMatchingService.addEventListener('validationFailed', (data) => {
            this.onCityValidationFailed(data);
        });

        console.log('[AddressForm] City matching listeners initialized');
    }

    /**
     * Extract city from pickup address and set in CityMatchingService
     * @param {string} address - Pickup address
     */
    detectAndSetPickupCity(address) {
        const cityId = Validators.extractCityFromAddress(address);

        if (!cityId) {
            console.warn('[AddressForm] Could not extract city from pickup:', address);
            // Reset to all cities by calling reset and clearing UI
            this.cityMatchingService.reset();
            this.clearCityHint();
            this.clearCityError();
            this.allowedDeliveryCities = null;
            return;
        }

        console.log('[AddressForm] Detected pickup city:', cityId);
        this.cityMatchingService.setPickupCity(cityId);
    }

    /**
     * Extract city from delivery address and validate
     * @param {string} address - Delivery address
     */
    detectAndSetDeliveryCity(address) {
        const cityId = Validators.extractCityFromAddress(address);

        if (!cityId) {
            console.warn('[AddressForm] Could not extract city from delivery:', address);
            return;
        }

        console.log('[AddressForm] Detected delivery city:', cityId);
        this.cityMatchingService.setDeliveryCity(cityId);
    }

    /**
     * Handle pickup city change event
     * Updates autocomplete bounds and shows city hint
     * @param {Object} data - Event data { cityId, allowedDeliveryCities }
     */
    onPickupCityChanged(data) {
        const { cityId, allowedDeliveryCities } = data;

        console.log('[AddressForm] Pickup city changed to:', cityId);
        console.log('[AddressForm] Allowed delivery cities:', allowedDeliveryCities);

        // Update Google Maps autocomplete bounds (if available)
        if (this.googleMapsService && this.googleMapsService.deliveryAutocomplete) {
            this.updateGoogleMapsAutocomplete(allowedDeliveryCities);
        }

        // Store allowed cities for LocationIQ autocomplete filtering
        this.allowedDeliveryCities = allowedDeliveryCities;

        // Update LocationIQ autocomplete (if available)
        if (this.googleMapsService && this.googleMapsService.locationIQ) {
            this.updateLocationIQAutocomplete(allowedDeliveryCities);
        }

        // Show hint to user
        this.showCityHint(allowedDeliveryCities);

        // Validate current delivery address (if any)
        const deliveryAddress = this.getDeliveryAddress();
        if (deliveryAddress) {
            this.detectAndSetDeliveryCity(deliveryAddress);
        }
    }

    /**
     * Handle delivery city change event
     * @param {Object} data - Event data { cityId, validation }
     */
    onDeliveryCityChanged(data) {
        const { cityId, validation } = data;

        console.log('[AddressForm] Delivery city changed to:', cityId);
        console.log('[AddressForm] Validation:', validation);

        if (validation && validation.valid) {
            this.clearCityError();
            console.log('[AddressForm] Cities compatible:', validation.message);
        }
    }

    /**
     * Handle city validation failure
     * Shows error and clears delivery input
     * @param {Object} data - Event data { validation }
     */
    onCityValidationFailed(data) {
        const { validation } = data;

        console.error('[AddressForm] City validation failed:', validation.message);
        this.showCityError(validation.message);

        // Clear delivery input
        const deliveryInput = document.getElementById('delivery-address');
        if (deliveryInput) {
            deliveryInput.value = '';
        }
    }

    /**
     * Update Google Maps autocomplete bounds
     * @param {string[]} allowedCityIds - Array of allowed city IDs
     */
    updateGoogleMapsAutocomplete(allowedCityIds) {
        // Note: Google Maps Autocomplete doesn't support dynamic city filtering
        // We rely on LocationIQ for this functionality
        // This method is here for future enhancement
        console.log('[AddressForm] Google Maps autocomplete update (not implemented)', allowedCityIds);
    }

    /**
     * Update LocationIQ autocomplete filtering
     * Re-creates the autocomplete with new city filter
     * @param {string[]} allowedCityIds - Array of allowed city IDs
     */
    updateLocationIQAutocomplete(allowedCityIds) {
        const deliveryInput = document.getElementById('delivery-address');
        if (!deliveryInput) return;

        console.log('[AddressForm] Updating LocationIQ autocomplete with cities:', allowedCityIds);

        // Remove old suggestions dropdown if it exists
        const oldSuggestions = deliveryInput.parentElement.querySelector('.locationiq-suggestions');
        if (oldSuggestions) {
            oldSuggestions.remove();
        }

        // Re-setup LocationIQ with new city filter
        if (this.googleMapsService.locationIQ) {
            this.setupLocationIQInputWithFilter(deliveryInput, allowedCityIds);
        }
    }

    /**
     * Setup LocationIQ input with city filter
     * Modified version of GoogleMapsService.setupLocationIQInput
     * @param {HTMLElement} input - Input element
     * @param {string[]} allowedCityIds - Array of allowed city IDs
     */
    setupLocationIQInputWithFilter(input, allowedCityIds) {
        let debounceTimer;
        let suggestionsList;

        // Create suggestions dropdown
        const createSuggestionsList = () => {
            if (suggestionsList) return suggestionsList;

            suggestionsList = document.createElement('div');
            suggestionsList.className = 'locationiq-suggestions';
            suggestionsList.style.cssText = `
                position: absolute !important;
                z-index: 999999 !important;
                background: #ffffff !important;
                border: 2px solid #F4C810 !important;
                border-radius: 12px !important;
                display: none !important;
                visibility: visible !important;
                max-height: 300px !important;
                overflow-y: auto !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
                top: calc(100% + 8px) !important;
                left: 0 !important;
                right: 0 !important;
                margin-top: 0 !important;
            `;

            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(suggestionsList);

            return suggestionsList;
        };

        // Handle input event
        input.addEventListener('input', async (e) => {
            const query = e.target.value.trim();

            if (query.length < 3) {
                createSuggestionsList().style.display = 'none';
                return;
            }

            // Debounce requests
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    // ENHANCEMENT: Enrich query with city name for better street results
                    let enrichedQuery = query;

                    // If user typed a short query (likely a street name) and we have allowed cities
                    // Add the first allowed city to improve LocationIQ results
                    if (allowedCityIds && allowedCityIds.length > 0) {
                        // Get first city name
                        const firstCityId = allowedCityIds[0];
                        const city = this.cityMatchingService.getCityDisplayInfo(firstCityId);

                        if (city && city.name) {
                            // Don't add city if user already typed it
                            const queryLower = query.toLowerCase();
                            const cityNameNormalized = city.name.toLowerCase()
                                .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
                                .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
                                .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z');

                            if (!queryLower.includes(cityNameNormalized)) {
                                enrichedQuery = `${query} ${city.name}`;
                                console.log(`🔍 Enriched query: "${query}" → "${enrichedQuery}"`);
                            }
                        }
                    }

                    console.log(`🔍 LocationIQ autocomplete with filter:`, enrichedQuery, 'Cities:', allowedCityIds);
                    // Pass allowed cities to autocomplete
                    const suggestions = await this.googleMapsService.locationIQ.autocomplete(enrichedQuery, allowedCityIds);

                    const list = createSuggestionsList();
                    list.innerHTML = '';

                    if (suggestions && suggestions.length > 0) {
                        suggestions.forEach(suggestion => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.style.cssText = `
                                padding: 12px 16px !important;
                                cursor: pointer !important;
                                border-bottom: 1px solid rgba(244, 200, 16, 0.2) !important;
                                color: #000 !important;
                                font-size: 0.95rem !important;
                                transition: all 0.2s ease !important;
                            `;
                            item.textContent = suggestion.description || suggestion.display_name || '';

                            item.addEventListener('mouseenter', () => {
                                item.style.backgroundColor = 'rgba(244, 200, 16, 0.1)';
                                item.style.paddingLeft = '20px';
                            });

                            item.addEventListener('mouseleave', () => {
                                item.style.backgroundColor = 'white';
                                item.style.paddingLeft = '16px';
                            });

                            item.addEventListener('click', () => {
                                input.value = suggestion.description || suggestion.display_name || '';
                                list.style.display = 'none';
                                this.handleAddressChange();
                            });

                            list.appendChild(item);
                        });

                        list.style.display = 'block';
                    } else {
                        list.style.display = 'none';
                    }
                } catch (error) {
                    console.error(`❌ LocationIQ autocomplete error:`, error);
                }
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (suggestionsList && e.target !== input && !suggestionsList.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });

        // Hide suggestions on blur
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (suggestionsList) {
                    suggestionsList.style.display = 'none';
                }
            }, 200);
        });
    }

    /**
     * Show city hint to user
     * @param {string[]} allowedCityIds - Array of allowed city IDs
     */
    showCityHint(allowedCityIds) {
        // Get city display names
        const cityNames = allowedCityIds.map(id => {
            const info = this.cityMatchingService.getCityDisplayInfo(id);
            return info ? info.name : id;
        });

        // Create hint element (if not exists)
        let hintElement = document.getElementById('city-hint');
        if (!hintElement) {
            hintElement = document.createElement('div');
            hintElement.id = 'city-hint';
            hintElement.className = 'city-hint';

            // Insert before delivery input
            const deliveryGroup = document.querySelector('.form-group:has(#delivery-address)');
            if (deliveryGroup) {
                deliveryGroup.insertBefore(hintElement, deliveryGroup.firstChild);
            }
        }

        // Set hint text
        if (cityNames.length === 1) {
            hintElement.textContent = `📍 Dostawa dostępna tylko w: ${cityNames[0]}`;
        } else {
            hintElement.textContent = `📍 Dostawa dostępna w: ${cityNames.join(', ')}`;
        }

        hintElement.style.display = 'block';

        console.log('[AddressForm] Showing city hint:', cityNames);
    }

    /**
     * Clear city hint
     */
    clearCityHint() {
        const hintElement = document.getElementById('city-hint');
        if (hintElement) {
            hintElement.style.display = 'none';
        }
    }

    /**
     * Show city error message
     * @param {string} message - Error message
     */
    showCityError(message) {
        let errorElement = document.getElementById('city-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'city-error';
            errorElement.className = 'city-error';

            const deliveryGroup = document.querySelector('.form-group:has(#delivery-address)');
            if (deliveryGroup) {
                deliveryGroup.appendChild(errorElement);
            }
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';

        console.error('[AddressForm] Showing city error:', message);
    }

    /**
     * Clear city error message
     */
    clearCityError() {
        const errorElement = document.getElementById('city-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Get current pickup address
     * @returns {string} Pickup address
     */
    getPickupAddress() {
        const pickupInput = document.getElementById('pickup-address');
        return pickupInput ? pickupInput.value.trim() : '';
    }

    /**
     * Get current delivery address
     * @returns {string} Delivery address
     */
    getDeliveryAddress() {
        const deliveryInput = document.getElementById('delivery-address');
        return deliveryInput ? deliveryInput.value.trim() : '';
    }

    /**
     * Inject CSS styles for city hints and errors
     */
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .city-hint {
                display: none;
                padding: 10px;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-left: 4px solid #5a67d8;
                border-radius: 4px;
                color: white;
                font-size: 14px;
                font-weight: 500;
            }

            .city-error {
                display: none;
                padding: 10px;
                margin-top: 5px;
                background: #fee;
                border-left: 4px solid #f44;
                border-radius: 4px;
                color: #c00;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
        console.log('[AddressForm] City hint/error styles injected');
    }

    /**
     * Reset city matching state
     */
    reset() {
        this.cityMatchingService.reset();
        this.clearCityHint();
        this.clearCityError();
        this.allowedDeliveryCities = null;

        console.log('[AddressForm] City matching state reset');
    }
}