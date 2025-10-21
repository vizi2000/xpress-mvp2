// LocationIQ Service - Free alternative to Google Maps API
// Free tier: 5,000 requests/day (150,000/month)
// Docs: https://locationiq.com/docs

export class LocationIQService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.locationiq.com/v1';
        this.autocompleteCache = new Map();
    }

    /**
     * Autocomplete/Search - replacement for Google Places Autocomplete
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of suggestions
     */
    async autocomplete(query) {
        if (!query || query.length < 3) {
            return [];
        }

        // Check cache
        const cacheKey = `autocomplete:${query.toLowerCase()}`;
        if (this.autocompleteCache.has(cacheKey)) {
            console.log('✅ LocationIQ autocomplete cache hit:', query);
            return this.autocompleteCache.get(cacheKey);
        }

        try {
            const url = `${this.baseUrl}/autocomplete?` + new URLSearchParams({
                key: this.apiKey,
                q: query,
                limit: 5,
                countrycodes: 'pl', // Poland only
                dedupe: 1,
                tag: 'place:city,place:town,place:village,place:suburb,highway:*,building:*'
            });

            console.log('🔍 LocationIQ autocomplete request:', query);
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LocationIQ API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Transform to format similar to Google Places
            // Removed debug log - raw API response no longer logged in production
            const suggestions = data.map(item => ({
                description: item.display_name,
                display_name: item.display_name, // Add both for compatibility
                place_id: item.place_id,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                address: item.address
            }));

            // Cache results
            // Removed detailed logging for production - summary log below
            this.autocompleteCache.set(cacheKey, suggestions);
            console.log(`✅ LocationIQ autocomplete: ${suggestions.length} results`);

            return suggestions;

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
        try {
            // First, geocode both addresses
            console.log('📍 Geocoding pickup address...');
            const pickupCoords = await this.geocodeAddress(pickupAddress);

            console.log('📍 Geocoding delivery address...');
            const deliveryCoords = await this.geocodeAddress(deliveryAddress);

            // Use OSRM for route calculation (100% FREE, no key needed!)
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=false&steps=false`;

            console.log('🚗 Calculating route with OSRM...');
            const response = await fetch(osrmUrl);

            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.status}`);
            }

            const data = await response.json();

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
                duration: `${Math.round(result.duration)} min`
            });

            return result;

        } catch (error) {
            console.error('❌ Distance calculation error:', error);
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
}
