// LocationIQ Service - Free alternative to Google Maps API
// Free tier: 5,000 requests/day (150,000/month)
// Docs: https://locationiq.com/docs

import {
    SUPPORTED_CITIES,
    ALL_CITY_IDS,
    getCityById,
    getCityGroup,
    findCityByCoordinates
} from '../config/cities.config.js';

import { Validators } from '../utils/Validators.js';

export class LocationIQService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.locationiq.com/v1';
        this.autocompleteCache = new Map();
        this.cachedViewbox = null; // Cache viewbox calculation
        this.currentDropdown = null; // Track current dropdown
        console.log('✅ LocationIQService initialized with API key:', apiKey ? `${apiKey.substr(0, 10)}...` : 'NONE');

        // Inject dropdown styles once
        this.injectDropdownStyles();
    }

    /**
     * Calculate combined viewbox for all supported cities
     * Returns bounding box string in format: "min_lon,min_lat,max_lon,max_lat"
     *
     * @returns {string} Viewbox parameter for LocationIQ API
     *
     * @example
     * getViewboxForAllCities() // → "14.40,49.89,22.15,54.67"
     */
    getViewboxForAllCities() {
        // Return cached value if available
        if (this.cachedViewbox) {
            return this.cachedViewbox;
        }

        let minLon = Infinity;
        let minLat = Infinity;
        let maxLon = -Infinity;
        let maxLat = -Infinity;

        Object.values(SUPPORTED_CITIES).forEach(city => {
            minLon = Math.min(minLon, city.bounds.west);
            minLat = Math.min(minLat, city.bounds.south);
            maxLon = Math.max(maxLon, city.bounds.east);
            maxLat = Math.max(maxLat, city.bounds.north);
        });

        // Format: "left,bottom,right,top" (longitude, latitude)
        this.cachedViewbox = `${minLon},${minLat},${maxLon},${maxLat}`;

        console.log('📍 Calculated viewbox for all supported cities:', this.cachedViewbox);

        return this.cachedViewbox;
    }

    /**
     * Filter LocationIQ results to only include addresses from supported cities
     *
     * @param {Array} results - Raw results from LocationIQ API
     * @param {string[]|null} allowedCityIds - Array of allowed city IDs (e.g., ['gdansk', 'gdynia'])
     *                                         If null, uses ALL_CITY_IDS
     * @returns {Array} Filtered results containing only supported cities
     *
     * @example
     * filterResultsByCity(results, ['gdansk', 'gdynia', 'sopot']) // Only Trójmiasto
     * filterResultsByCity(results, null) // All supported cities
     */
    filterResultsByCity(results, allowedCityIds = null) {
        if (!results || !Array.isArray(results)) {
            return [];
        }

        const cityFilter = allowedCityIds || ALL_CITY_IDS;

        console.log(`[LocationIQ] Filtering ${results.length} results. Allowed cities:`, cityFilter);

        const filtered = results.filter(result => {
            if (!result.display_name) {
                console.warn('[LocationIQ] Result missing display_name:', result);
                return false;
            }

            // Strategy 1: Extract city from address using Validators utility
            let city = Validators.extractCityFromAddress(result.display_name);

            // Strategy 2: If extraction failed, use coordinates as fallback
            if (!city && result.lat && result.lon) {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                const cityByCoords = findCityByCoordinates(lat, lon);
                if (cityByCoords) {
                    city = cityByCoords.id;
                    console.log(`[LocationIQ] 🎯 City detected by coordinates: "${result.display_name}" → ${city} (${lat}, ${lon})`);
                }
            }

            if (!city) {
                console.warn(`[LocationIQ] ❌ Could not determine city from: "${result.display_name}"`);
                return false;
            }

            const isAllowed = cityFilter.includes(city);

            if (!isAllowed) {
                console.log(`[LocationIQ] ❌ FILTERED OUT: "${result.display_name}" → city: "${city}" (not in allowed list)`);
            } else {
                console.log(`[LocationIQ] ✅ ALLOWED: "${result.display_name}" → city: "${city}"`);
            }

            return isAllowed;
        });

        console.log(`[LocationIQ] Filtering complete: ${results.length} → ${filtered.length} results`);

        return filtered;
    }

    /**
     * Autocomplete/Search - replacement for Google Places Autocomplete
     * Now with city filtering to restrict results to supported cities only
     *
     * @param {string} query - Search query
     * @param {string[]|null} allowedCityIds - Optional array of allowed city IDs
     *                                         If null, allows all supported cities
     * @returns {Promise<Array>} Array of filtered suggestions
     *
     * @example
     * autocomplete('Długa 1', null) // All supported cities
     * autocomplete('Długa 1', ['gdansk', 'gdynia', 'sopot']) // Only Trójmiasto
     */
    async autocomplete(query, allowedCityIds = null) {
        if (!query || query.length < 3) {
            return [];
        }

        // Create cache key that includes city filter
        const cityFilterKey = allowedCityIds ? allowedCityIds.sort().join('_') : 'all';
        const cacheKey = `autocomplete:${query.toLowerCase()}_${cityFilterKey}`;

        if (this.autocompleteCache.has(cacheKey)) {
            console.log('✅ LocationIQ autocomplete cache hit:', query);
            return this.autocompleteCache.get(cacheKey);
        }

        try {
            // Build URL params - we'll add city restriction separately
            const params = new URLSearchParams({
                key: this.apiKey,
                q: query,
                limit: 30,  // Increased to get more street results
                countrycodes: 'pl', // Poland only
                dedupe: 1,
                viewbox: this.getViewboxForAllCities(),  // Geographic hint (not strict)
                // NOTE: bounded=1 removed - it was too restrictive and filtered out streets
                // We rely on client-side coordinate filtering instead
            });

            // CRITICAL: We filter on the client side using two strategies:
            // 1. viewbox (geographic hint - not strict, to allow streets)
            // 2. Post-filtering by coordinates AND city name (filterResultsByCity)
            //
            // Strategy: Get MORE results from API (limit: 30), including streets,
            // then filter by checking if coordinates are within supported city bounds

            const url = `${this.baseUrl}/autocomplete?` + params.toString();

            console.log('[LocationIQ] Autocomplete request:', {
                query: query,
                cityFilter: allowedCityIds || 'ALL',
                viewbox: this.getViewboxForAllCities()
            });

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LocationIQ API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            console.log(`[LocationIQ] Results before filter: ${data.length}`);

            // Transform to format similar to Google Places
            const suggestions = data.map(item => ({
                description: item.display_name,
                display_name: item.display_name, // Add both for compatibility
                place_id: item.place_id,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                address: item.address
            }));

            // Filter by supported cities
            const filtered = this.filterResultsByCity(suggestions, allowedCityIds);

            console.log(`[LocationIQ] Results after filter: ${filtered.length}`);

            // Warn if all results were filtered out
            if (filtered.length === 0 && data.length > 0) {
                console.warn('[LocationIQ] All results filtered out - no supported cities found');
                console.warn('[LocationIQ] Allowed cities:', allowedCityIds || 'ALL');
            }

            // Cache filtered results
            this.autocompleteCache.set(cacheKey, filtered);
            console.log(`✅ LocationIQ autocomplete: ${filtered.length} results`);

            return filtered;

        } catch (error) {
            console.error('❌ LocationIQ autocomplete error:', error);
            throw error;
        }
    }

    /**
     * Geocode address to coordinates
     * @param {string} address - Address to geocode
     * @returns {Promise<{lat: number, lng: number}>} Coordinates
     */
    async geocodeAddress(address) {
        try {
            const url = `${this.baseUrl}/search?` + new URLSearchParams({
                key: this.apiKey,
                q: address,
                format: 'json',
                limit: 1,
                countrycodes: 'pl'
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Address not found');
            }

            const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };

            return coords;

        } catch (error) {
            console.error('❌ LocationIQ geocoding error:', error);
            throw error;
        }
    }

    /**
     * Calculate distance and route using OSRM (Open Source Routing Machine)
     * OSRM is 100% FREE with no API key required!
     * @param {string} pickupAddress - Pickup address
     * @param {string} deliveryAddress - Delivery address
     * @returns {Promise<{distance: number, duration: number, pickupCoords: object, deliveryCoords: object}>}
     */
    async calculateDistance(pickupAddress, deliveryAddress) {
        console.log('📍 LocationIQ calculateDistance called:', { pickupAddress, deliveryAddress });

        try {
            // First, geocode both addresses
            console.log('📍 Geocoding pickup address...');
            const pickupCoords = await this.geocodeAddress(pickupAddress);
            console.log('📍 Pickup coords:', pickupCoords);

            console.log('📍 Geocoding delivery address...');
            const deliveryCoords = await this.geocodeAddress(deliveryAddress);
            console.log('📍 Delivery coords:', deliveryCoords);

            // Use OSRM for route calculation (100% FREE, no key needed!)
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=false&steps=false`;

            console.log('🚗 Calculating route with OSRM...');
            console.log('🚗 OSRM URL:', osrmUrl);
            const response = await fetch(osrmUrl);

            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('🚗 OSRM response:', data);

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('Route calculation failed');
            }

            const route = data.routes[0];

            const result = {
                distance: route.distance / 1000, // meters → kilometers
                duration: route.duration / 60,   // seconds → minutes
                pickupCoords,
                deliveryCoords
            };

            console.log('✅ Route calculated:', {
                distance: `${result.distance.toFixed(2)} km`,
                duration: `${Math.round(result.duration)} min`,
                pickupCoords: result.pickupCoords,
                deliveryCoords: result.deliveryCoords
            });

            return result;

        } catch (error) {
            console.error('❌ LocationIQ distance calculation error:', error);
            throw error;
        }
    }

    /**
     * Alternative: Use LocationIQ's own routing (uses credits)
     * Only use if OSRM fails
     */
    async calculateDistanceLocationIQ(pickupCoords, deliveryCoords) {
        try {
            const url = `${this.baseUrl}/directions/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?` + new URLSearchParams({
                key: this.apiKey,
                overview: 'false',
                steps: false
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`LocationIQ routing failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                throw new Error('No route found');
            }

            return {
                distance: data.routes[0].distance / 1000,
                duration: data.routes[0].duration / 60
            };

        } catch (error) {
            console.error('❌ LocationIQ routing error:', error);
            throw error;
        }
    }

    /**
     * Check if API key is valid
     */
    async validateApiKey() {
        try {
            // Simple test request
            const response = await fetch(`${this.baseUrl}/search?key=${this.apiKey}&q=Warszawa&format=json&limit=1`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear autocomplete cache
     */
    clearCache() {
        this.autocompleteCache.clear();
        console.log('🗑️ LocationIQ cache cleared');
    }

    /**
     * Inject comprehensive CSS styles for dropdown
     * Called once in constructor
     */
    injectDropdownStyles() {
        // Check if already injected
        if (document.getElementById('locationiq-dropdown-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'locationiq-dropdown-styles';
        style.textContent = `
            /* LocationIQ Dropdown Container */
            .locationiq-dropdown {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                position: absolute;
                background: white;
                border: 2px solid #FFD700;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                max-height: 400px;
                overflow-y: auto;
                z-index: 10000;
                display: none;
                min-width: 300px;
            }

            /* Suggestion Item */
            .suggestion-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
                gap: 12px;
            }

            .suggestion-item:last-child {
                border-bottom: none;
            }

            .suggestion-item:hover {
                background: linear-gradient(135deg, #FFF9E6 0%, #FFE4B3 100%);
            }

            .suggestion-item.selected {
                background: linear-gradient(135deg, #FFE4B3 0%, #FFD700 100%);
            }

            /* City Badges */
            .city-badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .city-badge.trojmiasto {
                background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
            }

            .city-badge.katowice-metro {
                background: linear-gradient(135deg, #ff9900 0%, #cc7700 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(255, 153, 0, 0.3);
            }

            .city-badge.single {
                background: linear-gradient(135deg, #00aa00 0%, #008800 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(0, 170, 0, 0.3);
            }

            /* Suggestion Content */
            .suggestion-content {
                flex: 1;
                overflow: hidden;
            }

            .suggestion-street {
                font-size: 15px;
                font-weight: 500;
                color: #333;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .suggestion-city {
                font-size: 13px;
                color: #666;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Scrollbar styling */
            .locationiq-dropdown::-webkit-scrollbar {
                width: 8px;
            }

            .locationiq-dropdown::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }

            .locationiq-dropdown::-webkit-scrollbar-thumb {
                background: #FFD700;
                border-radius: 4px;
            }

            .locationiq-dropdown::-webkit-scrollbar-thumb:hover {
                background: #FFC700;
            }

            /* Loading state */
            .suggestion-item.loading {
                justify-content: center;
                color: #999;
                font-style: italic;
                cursor: default;
            }

            .suggestion-item.loading:hover {
                background: white;
            }

            /* No results state */
            .suggestion-item.no-results {
                justify-content: center;
                color: #999;
                cursor: default;
            }

            .suggestion-item.no-results:hover {
                background: white;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .locationiq-dropdown {
                    max-height: 300px;
                    min-width: 100%;
                    border-radius: 4px;
                }

                .suggestion-item {
                    padding: 10px 12px;
                }

                .city-badge {
                    font-size: 10px;
                    padding: 3px 8px;
                }

                .suggestion-street {
                    font-size: 14px;
                }

                .suggestion-city {
                    font-size: 12px;
                }
            }
        `;

        document.head.appendChild(style);
        console.log('[LocationIQ] Dropdown styles injected');
    }

    /**
     * Create dropdown element
     * @returns {HTMLElement} Dropdown container
     */
    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'locationiq-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', 'Sugestie adresów');
        return dropdown;
    }

    /**
     * Render a single suggestion with badge, street, and city
     * @param {Object} result - LocationIQ result object
     * @returns {string} HTML string for suggestion item
     */
    renderSuggestion(result) {
        const address = result.display_name;

        // Strategy 1: Extract city from address
        let cityId = Validators.extractCityFromAddress(address);

        // Strategy 2: If extraction failed, use coordinates as fallback
        if (!cityId && result.lat && result.lon) {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            const cityByCoords = findCityByCoordinates(lat, lon);
            if (cityByCoords) {
                cityId = cityByCoords.id;
            }
        }

        // Get city group information
        let groupBadge = '';
        if (cityId) {
            const city = getCityById(cityId);
            const group = city ? city.group : null;
            const cityName = city ? city.name : cityId;

            if (group === 'trojmiasto') {
                groupBadge = `<span class="city-badge trojmiasto" title="Trójmiasto: Gdańsk, Gdynia, Sopot">🌊 ${cityName}</span>`;
            } else if (group === 'katowice_metro') {
                groupBadge = `<span class="city-badge katowice-metro" title="Aglomeracja Katowicka">🏭 ${cityName}</span>`;
            } else if (group === 'single') {
                groupBadge = `<span class="city-badge single" title="Dostawa tylko w obrębie miasta">📍 ${cityName}</span>`;
            }
        }

        // Parse address components
        const parts = address.split(',').map(p => p.trim());
        const street = parts[0] || '';
        const city = parts[1] || '';
        const rest = parts.slice(2).join(', ');

        // Build HTML
        return `
            <div class="suggestion-item" role="option" aria-label="${street}, ${city}">
                ${groupBadge}
                <div class="suggestion-content">
                    <div class="suggestion-street">${street}</div>
                    <div class="suggestion-city">${city}${rest ? ', ' + rest : ''}</div>
                </div>
            </div>
        `;
    }

    /**
     * Show dropdown with results
     * @param {Array} results - Array of LocationIQ results
     * @param {HTMLElement} dropdown - Dropdown element
     */
    showDropdown(results, dropdown) {
        dropdown.innerHTML = '';

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="suggestion-item no-results">Brak wyników</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Render each suggestion
        results.forEach(result => {
            const itemHTML = this.renderSuggestion(result);
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = itemHTML.trim();
            const item = tempContainer.firstChild;

            // Add click handler
            item.addEventListener('click', () => this.selectSuggestion(result, dropdown));

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    /**
     * Hide dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     */
    hideDropdown(dropdown) {
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    /**
     * Show loading state in dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     */
    showLoading(dropdown) {
        dropdown.innerHTML = '<div class="suggestion-item loading">⏳ Szukam adresów...</div>';
        dropdown.style.display = 'block';
    }

    /**
     * Select a suggestion (to be overridden)
     * @param {Object} result - Selected result
     * @param {HTMLElement} dropdown - Dropdown element
     */
    selectSuggestion(result, dropdown) {
        console.log('[LocationIQ] Suggestion selected:', result);
        this.hideDropdown(dropdown);
    }

    /**
     * Group results by city group
     * @param {Array} results - Array of LocationIQ results
     * @returns {Object} Grouped results
     */
    groupResultsByCity(results) {
        const groups = {
            trojmiasto: [],
            katowice_metro: [],
            single: [],
            unknown: []
        };

        results.forEach(result => {
            const cityId = Validators.extractCityFromAddress(result.display_name);
            if (cityId) {
                const city = getCityById(cityId);
                const group = city ? city.group : 'unknown';
                groups[group].push(result);
            } else {
                groups.unknown.push(result);
            }
        });

        return groups;
    }
}
