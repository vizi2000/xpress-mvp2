// Environment Configuration Loader
// This file loads configuration from environment variables or falls back to defaults

class EnvConfig {
    constructor() {
        this.config = this.loadConfig();
    }

    // Load configuration from various sources
    loadConfig() {
        // Try to load from environment variables first
        const envConfig = this.loadFromEnv();
        if (envConfig) {
            console.log('🔐 Loaded configuration from environment variables');
            return envConfig;
        }

        // Fallback to local config file (development only)
        const localConfig = this.loadFromLocalFile();
        if (localConfig) {
            console.log('⚠️ Using local config file - not recommended for production');
            return localConfig;
        }

        // Final fallback to default values (minimal functionality)
        console.warn('❌ No configuration found - using defaults with limited functionality');
        return this.getDefaultConfig();
    }

    // Load from environment variables (preferred method)
    loadFromEnv() {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // In browser, check for injected environment variables
            if (window.ENV_CONFIG) {
                return window.ENV_CONFIG;
            }
            return null;
        }

        // In Node.js environment
        if (typeof process !== 'undefined' && process.env) {
            return {
                xpress: {
                    baseUrl: process.env.XPRESS_API_BASE_URL || 'https://api.xpress.delivery',
                    auth: {
                        username: process.env.XPRESS_API_USERNAME,
                        password: process.env.XPRESS_API_PASSWORD,
                    }
                },
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
                locationiq: {
                    apiKey: process.env.LOCATIONIQ_API_KEY,
                },
                revolut: {
                    apiKey: process.env.REVOLUT_API_KEY || 'YOUR_REVOLUT_MERCHANT_API_KEY',
                    webhookSecret: process.env.REVOLUT_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET',
                    sandboxMode: process.env.REVOLUT_ENVIRONMENT !== 'prod',
                    widget: {
                        publicKey: process.env.REVOLUT_PUBLIC_KEY || 'YOUR_REVOLUT_PUBLIC_KEY',
                        environment: process.env.REVOLUT_ENVIRONMENT || 'sandbox'
                    }
                },
                development: {
                    useMockData: false,
                    debugMode: process.env.APP_DEBUG_MODE === 'true',
                    showTestButton: process.env.APP_SHOW_TEST_BUTTON === 'true'
                }
            };
        }

        return null;
    }

    // Load from local config file (development fallback)
    loadFromLocalFile() {
        try {
            // Try to load config.local.js if it exists
            if (typeof window !== 'undefined' && window.CONFIG_LOCAL) {
                // Check if placeholders are still present (not replaced)
                const hasPlaceholders = Object.values(window.CONFIG_LOCAL).some(section => {
                    if (typeof section === 'object') {
                        return Object.values(section).some(val =>
                            typeof val === 'string' && val.startsWith('__')
                        );
                    }
                    return false;
                });

                if (hasPlaceholders) {
                    console.warn('⚠️ CONFIG_LOCAL contains placeholders - env vars not injected yet');
                    console.warn('💡 For local dev, load .env.local values manually or use inject-env.sh');
                }

                return {
                    xpress: {
                        baseUrl: 'https://api.xpress.delivery',
                        auth: {
                            username: window.CONFIG_LOCAL.xpress?.auth?.username,
                            password: window.CONFIG_LOCAL.xpress?.auth?.password,
                        }
                    },
                    googleMaps: {
                        apiKey: window.CONFIG_LOCAL.googleMaps?.apiKey,
                    },
                    locationiq: {
                        apiKey: window.CONFIG_LOCAL.locationiq?.apiKey,
                    },
                    revolut: {
                        apiKey: window.CONFIG_LOCAL.revolut?.apiKey || 'YOUR_REVOLUT_MERCHANT_API_KEY',
                        webhookSecret: window.CONFIG_LOCAL.revolut?.webhookSecret || 'YOUR_WEBHOOK_SECRET',
                        sandboxMode: window.CONFIG_LOCAL.revolut?.widget?.environment !== 'prod',
                        widget: {
                            publicKey: window.CONFIG_LOCAL.revolut?.widget?.publicKey || 'YOUR_REVOLUT_PUBLIC_KEY',
                            environment: window.CONFIG_LOCAL.revolut?.widget?.environment || 'sandbox'
                        }
                    },
                    development: window.CONFIG_LOCAL.development || {
                        useMockData: false,
                        debugMode: true,
                        showTestButton: true
                    }
                };
            }
        } catch (error) {
            console.warn('Could not load local config:', error.message);
        }
        return null;
    }

    // Default configuration (minimal functionality)
    getDefaultConfig() {
        return {
            xpress: {
                baseUrl: 'https://api.xpress.delivery',
                auth: {
                    username: null,
                    password: null,
                }
            },
            googleMaps: {
                apiKey: null,
            },
            locationiq: {
                apiKey: null,
            },
            revolut: {
                apiKey: 'YOUR_REVOLUT_MERCHANT_API_KEY',
                webhookSecret: 'YOUR_WEBHOOK_SECRET',
                sandboxMode: true,
                widget: {
                    publicKey: 'YOUR_REVOLUT_PUBLIC_KEY',
                    environment: 'sandbox'
                }
            },
            development: {
                useMockData: true, // Use mocks if no real credentials
                debugMode: true,
                showTestButton: true
            }
        };
    }

    // Get configuration
    get() {
        return this.config;
    }

    // Validate configuration
    isValid() {
        const config = this.config;
        
        // Check required fields
        const hasXpressAuth = config.xpress?.auth?.username && config.xpress?.auth?.password;
        const hasGoogleMaps = config.googleMaps?.apiKey;
        
        if (!hasXpressAuth) {
            console.warn('⚠️ Xpress.Delivery credentials not configured');
        }
        
        if (!hasGoogleMaps) {
            console.warn('⚠️ Google Maps API key not configured');
        }
        
        return hasXpressAuth && hasGoogleMaps;
    }

    // Get environment info
    getEnvironment() {
        if (typeof process !== 'undefined' && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }
        if (typeof window !== 'undefined') {
            return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'development' 
                : 'production';
        }
        return 'unknown';
    }
}

// Create and export singleton instance
export const envConfig = new EnvConfig();
export default envConfig;