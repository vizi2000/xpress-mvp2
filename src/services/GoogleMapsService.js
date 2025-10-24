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
        let dropdown = null;

        // Create dropdown using LocationIQService method
        const createDropdown = () => {
            if (dropdown) return dropdown;

            dropdown = this.locationIQ.createDropdown();

            // Make parent container position relative
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(dropdown);

            // Override selectSuggestion to handle selection
            this.locationIQ.selectSuggestion = (result, dropdownElement) => {
                input.value = result.description || result.display_name || '';
                this.locationIQ.hideDropdown(dropdownElement);
                this.onAddressSelected();
            };

            return dropdown;
        };

        // Handle input event
        input.addEventListener('input', async (e) => {
            const query = e.target.value.trim();

            if (query.length < 3) {
                const list = createDropdown();
                this.locationIQ.hideDropdown(list);
                return;
            }

            // Debounce requests
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    const list = createDropdown();

                    // Show loading state
                    this.locationIQ.showLoading(list);

                    // ENHANCEMENT: For very short queries that look like street names,
                    // try multiple cities to get better results
                    let enrichedQuery = query;

                    // Check if query is short and doesn't contain common city names
                    const queryLower = query.toLowerCase()
                        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
                        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
                        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z');

                    const commonCities = ['warszaw', 'krakow', 'lodz', 'wroclaw', 'poznan',
                                         'gdansk', 'szczecin', 'katowic', 'gdynia', 'sopot'];
                    const hasCityName = commonCities.some(city => queryLower.includes(city));

                    // If no city name detected, we'll rely on LocationIQ's own logic
                    // and our coordinate-based filtering (already implemented)

                    console.log(`🔍 LocationIQ autocomplete for ${type}:`, query);
                    const suggestions = await this.locationIQ.autocomplete(query);

                    // Show results with enhanced UI
                    this.locationIQ.showDropdown(suggestions, list);

                } catch (error) {
                    console.error(`❌ LocationIQ autocomplete error for ${type}:`, error);
                    const list = createDropdown();
                    this.locationIQ.hideDropdown(list);
                }
            }, 300); // 300ms debounce
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (dropdown && e.target !== input && !dropdown.contains(e.target)) {
                this.locationIQ.hideDropdown(dropdown);
            }
        });

        // Hide dropdown on blur (with delay to allow click)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (dropdown) {
                    this.locationIQ.hideDropdown(dropdown);
                }
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (!dropdown || dropdown.style.display === 'none') return;

            const items = dropdown.querySelectorAll('.suggestion-item:not(.no-results):not(.loading)');
            if (items.length === 0) return;

            let currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                // Remove previous selection
                if (currentIndex >= 0) {
                    items[currentIndex].classList.remove('selected');
                }
                // Select next item
                currentIndex = (currentIndex + 1) % items.length;
                items[currentIndex].classList.add('selected');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                // Remove previous selection
                if (currentIndex >= 0) {
                    items[currentIndex].classList.remove('selected');
                }
                // Select previous item
                currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                items[currentIndex].classList.add('selected');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Select highlighted item
                if (currentIndex >= 0) {
                    items[currentIndex].click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.locationIQ.hideDropdown(dropdown);
            }
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
        console.log('📍 CALC DISTANCE:', { pickupAddress, deliveryAddress });

        // Try LocationIQ first if available
        if (this.locationIQ) {
            try {
                console.log('🗺️ Using LocationIQ for distance calculation');
                const result = await this.locationIQ.calculateDistance(pickupAddress, deliveryAddress);
                console.log('📍 LocationIQ result:', result);
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
        console.log('📍 Geocoded coords:', { pickupCoords, deliveryCoords });

        const routeData = await this.calculateRoute(pickupCoords, deliveryCoords);
        console.log('📍 Route data:', routeData);

        return {
            distance: routeData.distance / 1000, // Convert to km
            duration: routeData.duration / 60,   // Convert to minutes
            pickupCoords,
            deliveryCoords
        };
    }
}