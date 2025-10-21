// Local configuration template
// Copy this file to config.local.js and fill in your API keys

window.CONFIG_LOCAL = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    },

    // Xpress.Delivery API configuration
    xpress: {
        auth: {
            apiKey: 'YOUR_XPRESS_API_KEY_HERE'
        }
    },

    // Revolut Payment configuration
    revolut: {
        apiKey: 'YOUR_REVOLUT_API_KEY_HERE',
        widget: {
            publicKey: 'YOUR_REVOLUT_PUBLIC_KEY_HERE',
        }
    },

    // Development settings
    development: {
        // Set to false to use real APIs (APIs now use real data except payments)
        useMockData: false,
        debugMode: true
    }
};