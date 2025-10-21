// Google Maps API Service (with LocationIQ fallback)
import { ApiConfig } from '../config/api.config.js';
import { LocationIQService } from './LocationIQService.js';

export class GoogleMapsService {
    constructor() {
        this.config = ApiConfig.googleMaps;
        this.locationiqConfig = ApiConfig.locationiq;
        this.pickupAutocomplete = null;
        this.deliveryAutocomplete = null;

        // Initialize LocationIQ service if API key is available
        this.locationIQ = null;
        if (this.locationiqConfig?.apiKey && !this.locationiqConfig.apiKey.startsWith('__')) {
            console.log('🗺️ LocationIQ API key detected - using as primary maps provider');
            this.locationIQ = new LocationIQService(this.locationiqConfig.apiKey);
        } else {
            console.log('🗺️ No LocationIQ API key - using Google Maps as primary provider');
        }
    }

    // Initialize Autocomplete (LocationIQ primary, Google fallback)
    initializeAutocomplete() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');

        if (!pickupInput || !deliveryInput) {
            console.error('Address inputs not found');
            return;
        }

        // Use LocationIQ if available
        if (this.locationIQ) {
            console.log('🗺️ Initializing LocationIQ autocomplete...');
            this.initializeLocationIQAutocomplete(pickupInput, deliveryInput);
            this.enableRealAPIMode();
            return;
        }

        // Fallback to Google Places
        console.log('🗺️ Initializing Google Places autocomplete...');
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error('Google Maps Places API not available');
            return;
        }

        try {
            const options = {
                componentRestrictions: { country: 'pl' },
                fields: ['formatted_address', 'geometry', 'name'],
                types: ['address']
            };

            this.pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
            this.pickupAutocomplete.addListener('place_changed', () => {
                const place = this.pickupAutocomplete.getPlace();
                if (place.formatted_address) {
                    pickupInput.value = place.formatted_address;
                    this.onAddressSelected();
                }
            });

            this.deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInput, options);
            this.deliveryAutocomplete.addListener('place_changed', () => {
                const place = this.deliveryAutocomplete.getPlace();
                if (place.formatted_address) {
                    deliveryInput.value = place.formatted_address;
                    this.onAddressSelected();
                }
            });

            console.log('Google Places Autocomplete initialized successfully');
        } catch (error) {
            console.error('Error initializing Google Places Autocomplete:', error);
        }

        this.enableRealAPIMode();
    }

    // Initialize LocationIQ autocomplete with custom dropdown
    initializeLocationIQAutocomplete(pickupInput, deliveryInput) {
        // Create autocomplete for pickup address
        this.setupLocationIQInput(pickupInput, 'pickup');

        // Create autocomplete for delivery address
        this.setupLocationIQInput(deliveryInput, 'delivery');

        console.log('✅ LocationIQ autocomplete initialized for both inputs');
    }

    // Setup LocationIQ autocomplete for a single input
    setupLocationIQInput(input, type) {
        let debounceTimer;
        let suggestionsList;

        // Create suggestions dropdown
        const createSuggestionsList = () => {
            if (suggestionsList) return suggestionsList;

            suggestionsList = document.createElement('div');
            suggestionsList.className = 'locationiq-suggestions';
            suggestionsList.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ccc;
                border-top: none;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;

            // Make parent container position relative
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
                    console.log(`🔍 LocationIQ autocomplete for ${type}:`, query);
                    const suggestions = await this.locationIQ.autocomplete(query);

                    const list = createSuggestionsList();
                    // Removed debug log - suggestions structure no longer logged in production
                    list.innerHTML = '';

                    if (suggestions && suggestions.length > 0) {
                        suggestions.forEach(suggestion => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.style.cssText = `
                                padding: 10px;
                                cursor: pointer;
                                border-bottom: 1px solid #eee;
                            `;
                            // Use 'description' field from LocationIQService
                            item.textContent = suggestion.description || suggestion.display_name || '';

                            item.addEventListener('mouseenter', () => {
                                item.style.backgroundColor = '#f0f0f0';
                            });

                            item.addEventListener('mouseleave', () => {
                                item.style.backgroundColor = 'white';
                            });

                            item.addEventListener('click', () => {
                                // Use 'description' field from LocationIQService
                                input.value = suggestion.description || suggestion.display_name || '';
                                list.style.display = 'none';
                                this.onAddressSelected();
                            });

                            list.appendChild(item);
                        });

                        list.style.display = 'block';
                    } else {
                        list.style.display = 'none';
                    }
                } catch (error) {
                    console.error(`❌ LocationIQ autocomplete error for ${type}:`, error);
                }
            }, 300); // 300ms debounce
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (suggestionsList && e.target !== input && !suggestionsList.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });

        // Hide suggestions on blur (with delay to allow click)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (suggestionsList) {
                    suggestionsList.style.display = 'none';
                }
            }, 200);
        });
    }
    
    // Enable real API mode
    enableRealAPIMode() {
        // Update app config to use real API
        if (window.xpressApp && window.xpressApp.config) {
            const wasUsingMock = window.xpressApp.config.development.useMockData;
            window.xpressApp.config.development.useMockData = false;
            console.log(`🔄 API mode: ${wasUsingMock ? 'Mock → Real' : 'Already Real'} Google Maps API`);
        } else {
            console.log('⚠️ Cannot switch API mode - app not available yet');
        }
    }

    // Callback when address is selected
    onAddressSelected() {
        // This will be overridden by the main app
        console.log('Address selected');
    }

    // Geocode address to coordinates using LocationIQ (primary) or Google Maps (fallback)
    async geocodeAddress(address) {
        // Try LocationIQ first if available
        if (this.locationIQ) {
            try {
                console.log('🗺️ Using LocationIQ for geocoding:', address);
                const coords = await this.locationIQ.geocodeAddress(address);
                return { lat: coords.lat, lng: coords.lng };
            } catch (error) {
                console.warn('⚠️ LocationIQ geocoding failed, falling back to Google Maps:', error.message);
            }
        }

        // Fallback to Google Maps
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded and LocationIQ unavailable');
        }

        console.log('🗺️ Using Google Maps for geocoding:', address);
        return new Promise((resolve, reject) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results.length > 0) {
                    resolve(results[0].geometry.location.toJSON());
                } else {
                    reject(new Error('Address not found: ' + status));
                }
            });
        });
    }

    // Calculate route between two coordinates using Google Maps JavaScript API
    async calculateRoute(origin, destination) {
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }
        
        return new Promise((resolve, reject) => {
            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, (response, status) => {
                if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                    const element = response.rows[0].elements[0];
                    resolve({
                        distance: element.distance.value, // meters
                        duration: element.duration.value  // seconds
                    });
                } else {
                    reject(new Error('Route calculation failed: ' + status));
                }
            });
        });
    }

    // Calculate distance between two addresses using LocationIQ (primary) or Google Maps (fallback)
    async calculateDistance(pickupAddress, deliveryAddress) {
        // Try LocationIQ first if available
        if (this.locationIQ) {
            try {
                console.log('🗺️ Using LocationIQ for distance calculation');
                const result = await this.locationIQ.calculateDistance(pickupAddress, deliveryAddress);
                return {
                    distance: result.distance, // km
                    duration: result.duration, // minutes
                    pickupCoords: result.pickupCoords,
                    deliveryCoords: result.deliveryCoords
                };
            } catch (error) {
                console.warn('⚠️ LocationIQ distance calculation failed, falling back to Google Maps:', error.message);
            }
        }

        // Fallback to Google Maps
        console.log('🗺️ Using Google Maps for distance calculation');
        const pickupCoords = await this.geocodeAddress(pickupAddress);
        const deliveryCoords = await this.geocodeAddress(deliveryAddress);
        const routeData = await this.calculateRoute(pickupCoords, deliveryCoords);

        return {
            distance: routeData.distance / 1000, // Convert to km
            duration: routeData.duration / 60,   // Convert to minutes
            pickupCoords,
            deliveryCoords
        };
    }
}