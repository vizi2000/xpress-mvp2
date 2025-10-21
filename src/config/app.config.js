// Application configuration with environment variable support
import envConfig from './env.config.js';

// Load configuration from environment variables
const config = envConfig.get();

export const AppConfig = {
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
    },

    // Development settings (loaded from environment)
    development: {
        // Mock API responses when true (deprecated - APIs now use real data except payments)
        useMockData: config.development.useMockData,
        
        // Enable debug logging
        debugMode: config.development.debugMode,
        
        // Test button visibility
        showTestButton: config.development.showTestButton
    }
};