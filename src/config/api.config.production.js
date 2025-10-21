// Production API configuration - NO SENSITIVE DATA
// This file is safe to commit to git
// All sensitive values are loaded from environment variables

import envConfig from './env.config.js';

// Load configuration from environment variables
const config = envConfig.get();

export const ApiConfig = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: config.googleMaps.apiKey, // Loaded from GOOGLE_MAPS_API_KEY env var
        // For production, restrict this key to your domain
        // Required APIs: Places API, Directions API, Geocoding API, Distance Matrix API
    },

    // Xpress.Delivery API configuration
    xpress: {
        // API base URL
        baseUrl: config.xpress.baseUrl, // Loaded from XPRESS_API_BASE_URL env var
        
        // Authentication credentials (loaded from environment variables)
        auth: {
            username: config.xpress.auth.username, // Loaded from XPRESS_API_USERNAME env var
            password: config.xpress.auth.password, // Loaded from XPRESS_API_PASSWORD env var
            // Alternative: API key if they use simple key auth
            apiKey: 'YOUR_API_KEY_HERE'
        },
        
        // API endpoints
        endpoints: {
            auth: '/auth/token',
            quote: '/quotes',
            orders: '/orders',
            tracking: '/orders/{id}/tracking'
        }
    },

    // Revolut Payment configuration
    revolut: {
        // Merchant API credentials (loaded from environment variables)
        apiKey: config.revolut.apiKey, // Loaded from REVOLUT_API_KEY env var
        webhookSecret: config.revolut.webhookSecret, // Loaded from REVOLUT_WEBHOOK_SECRET env var
        sandboxMode: config.revolut.sandboxMode, // Based on REVOLUT_ENVIRONMENT env var
        
        // Payment widget configuration
        widget: {
            publicKey: config.revolut.widget.publicKey, // Loaded from REVOLUT_PUBLIC_KEY env var
            environment: config.revolut.widget.environment // Loaded from REVOLUT_ENVIRONMENT env var
        }
    }
};

// Validate configuration on load
if (!envConfig.isValid()) {
    console.error('❌ Missing required environment variables!');
    console.log(`
📋 Required environment variables:
   - XPRESS_API_USERNAME
   - XPRESS_API_PASSWORD 
   - GOOGLE_MAPS_API_KEY

📋 Optional environment variables:
   - XPRESS_API_BASE_URL (default: https://api.xpress.delivery)
   - REVOLUT_API_KEY
   - REVOLUT_WEBHOOK_SECRET
   - REVOLUT_PUBLIC_KEY
   - REVOLUT_ENVIRONMENT (default: sandbox)
   - APP_DEBUG_MODE (default: true)
   - APP_SHOW_TEST_BUTTON (default: true)

🔧 Set these in your deployment environment or .env.local file for development.
    `);
}

// Export environment info for debugging
export const environment = {
    name: envConfig.getEnvironment(),
    isProduction: envConfig.getEnvironment() === 'production',
    isDevelopment: envConfig.getEnvironment() === 'development',
    configValid: envConfig.isValid()
};