// Configuration file for Xpress.Delivery MVP
// Copy this file to config.local.js and fill in your API keys

const config = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
        // For production, restrict this key to your domain
        // Also enable: Places API, Directions API, Geocoding API
    },

    // Xpress.Delivery API configuration
    xpress: {
        // API base URL
        baseUrl: 'https://api.xpress.delivery',
        
        // Authentication credentials
        // These should be obtained from Xpress.Delivery dashboard
        auth: {
            clientId: 'YOUR_CLIENT_ID_HERE',
            clientSecret: 'YOUR_CLIENT_SECRET_HERE',
            // Alternative: API key if they use simple key auth
            apiKey: 'YOUR_API_KEY_HERE'
        },
        
        // API endpoints (based on typical courier API structure)
        endpoints: {
            auth: '/auth/token',
            quote: '/quotes',
            orders: '/orders',
            tracking: '/orders/{id}/tracking'
        }
    },

    // Revolut Payment configuration
    revolut: {
        // Merchant API credentials
        apiKey: 'YOUR_REVOLUT_MERCHANT_API_KEY',
        webhookSecret: 'YOUR_WEBHOOK_SECRET',
        sandboxMode: true, // Set to false for production
        
        // Payment widget configuration
        widget: {
            publicKey: 'YOUR_REVOLUT_PUBLIC_KEY',
            environment: 'sandbox' // 'sandbox' or 'prod'
        }
    },

    // Application settings
    app: {
        // Environment
        environment: 'development', // 'development', 'staging', 'production'
        
        // Supported cities
        supportedCities: [
            'warszawa', 'warsaw',
            'łódź', 'lodz',
            'poznań', 'poznan',
            'kraków', 'krakow', 'cracow',
            'wrocław', 'wroclaw',
            'szczecin',
            'gdańsk', 'gdynia', 'sopot', 'trójmiasto', 'trojmiasto', // Trójmiasto
            'katowice',
            'bielsko-biała', 'bielsko biała', 'bielsko'
        ],
        
        // Distance limits
        maxDistance: 20, // Maximum distance in km
        
        // New pricing configuration
        pricing: {
            // Base price for first 7km
            baseDistance: 7, // km
            basePrice: {
                small: 25,   // 25 PLN for small packages up to 7km
                medium: 25   // 25 PLN for medium packages up to 7km
            },
            // Price per additional km beyond 7km
            additionalKmPrice: 3.5,
            // Large package multiplier (+50%)
            largeMultiplier: 1.5
        },

        // Contact information
        support: {
            phone: '+48 800 123 456',
            email: 'pomoc@xpress.delivery'
        }
    },

    // Development settings
    development: {
        // Mock API responses when true (deprecated - APIs now use real data except payments)
        useMockData: false,
        
        // Enable debug logging
        debugMode: true,
        
        // Test button visibility
        showTestButton: true
    }
};

// Try to load local configuration
try {
    if (typeof window !== 'undefined' && window.CONFIG_LOCAL) {
        // Merge local config with default config
        Object.assign(config, window.CONFIG_LOCAL);
    }
} catch (e) {
    console.warn('Local config not found, using default configuration');
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else if (typeof window !== 'undefined') {
    window.CONFIG = config;
}