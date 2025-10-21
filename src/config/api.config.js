// API configuration with environment variable support
import envConfig from './env.config.js';

// Load configuration from environment variables
const config = envConfig.get();

export const ApiConfig = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: config.googleMaps.apiKey,
        // For production, restrict this key to your domain
        // Also enable: Places API, Directions API, Geocoding API
    },

    // LocationIQ API configuration (FREE alternative - 5k requests/day)
    locationiq: {
        apiKey: config.locationiq.apiKey,
        // Free tier: 5,000 requests/day (150,000/month)
        // Docs: https://locationiq.com/docs
    },

    // Xpress.Delivery API configuration
    xpress: {
        // API base URL
        baseUrl: config.xpress.baseUrl,
        
        // Authentication credentials (loaded from environment)
        auth: {
            username: config.xpress.auth.username,
            password: config.xpress.auth.password,
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
        apiKey: config.revolut.apiKey,
        webhookSecret: config.revolut.webhookSecret,
        sandboxMode: config.revolut.sandboxMode,
        
        // Payment widget configuration
        widget: {
            publicKey: config.revolut.widget.publicKey,
            environment: config.revolut.widget.environment
        }
    }
};

// Validate configuration on load
if (!envConfig.isValid()) {
    console.warn('⚠️ API Configuration incomplete - some features may not work properly');
    console.log('📋 Please check your environment variables or .env.local file');
}