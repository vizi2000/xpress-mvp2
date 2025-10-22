// Local configuration with API keys
// IMPORTANT: Placeholders will be replaced at deployment time
window.CONFIG_LOCAL = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: '__GOOGLE_MAPS_API_KEY__',
    },

    // LocationIQ API configuration (FREE - 5k requests/day)
    locationiq: {
        apiKey: '__LOCATIONIQ_API_KEY__',
    },

    // Xpress.Delivery API configuration
    xpress: {
        auth: {
            username: '__XPRESS_API_USERNAME__',
            password: '__XPRESS_API_PASSWORD__'
        }
    },

    // Revolut Payment configuration
    revolut: {
        apiKey: '__REVOLUT_API_KEY__',
        webhookSecret: '__REVOLUT_WEBHOOK_SECRET__',
        widget: {
            publicKey: '__REVOLUT_PUBLIC_KEY__',
            environment: '__REVOLUT_ENVIRONMENT__'
        }
    },

    // OpenRouter API configuration (AI Chat)
    openrouter: {
        apiKey: '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'
    },

    // Development settings
    development: {
        useMockData: false,
        debugMode: true,
        showTestButton: true
    }
};
