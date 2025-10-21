# 🔧 Szczegółowe Specyfikacje Implementacji - Xpress.Delivery MVP

**Projekt**: Xpress.Delivery MVP Fix & Deployment
**Data**: 2025-10-20
**Wersja**: 1.0
**Cel**: Naprawić critical bugs, zaimplementować Revolut payment, deploy na sendxpress.borg.tools

---

## 📋 TASK 1: Fix Phone Validation

### Specification

**Plik**: `src/services/OrderService.js`
**Funkcja**: `validateContactData(contactData)`
**Linie**: 15-31

### Problem
Obecna implementacja sprawdza tylko czy pole telefonu nie jest puste, ale **NIE** waliduje formatu numeru telefonu. Istniejący validator `Validators.isValidPhone()` w `src/utils/Validators.js:10-13` nie jest używany.

### Wymagania
1. Dodać walidację formatu telefonu dla `senderPhone`
2. Dodać walidację formatu telefonu dla `recipientPhone`
3. Użyć istniejącego `Validators.isValidPhone()`
4. Rzucić czytelny błąd z informacją o wymaganym formacie
5. Zachować istniejącą walidację email

### Expected Format
Polski format telefonu: `+48 XXX XXX XXX` lub `XXX XXX XXX` (9 cyfr)
Regex w Validators.js: `/^(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{2}\s?\d{2})$/`

### Implementation Details

**Current Code** (`OrderService.js:15-31`):
```javascript
validateContactData(contactData) {
    const required = ['senderName', 'senderPhone', 'senderEmail', 'recipientName', 'recipientPhone', 'recipientEmail'];

    for (let field of required) {
        if (!contactData[field] || contactData[field].trim() === '') {
            throw new Error(`Proszę wypełnić: ${this.getFieldLabel(field)}`);
        }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.senderEmail) || !emailRegex.test(contactData.recipientEmail)) {
        throw new Error('Proszę podać prawidłowe adresy email');
    }

    return true;
}
```

**Required Changes**:
1. Import `Validators` na początku pliku (jeśli nie jest już zaimportowany)
2. Po walidacji email, przed `return true`, dodać:
   ```javascript
   // Phone validation for sender
   if (!Validators.isValidPhone(contactData.senderPhone)) {
       throw new Error('Nieprawidłowy format telefonu nadawcy. Wymagany format: +48 XXX XXX XXX lub XXX XXX XXX');
   }

   // Phone validation for recipient
   if (!Validators.isValidPhone(contactData.recipientPhone)) {
       throw new Error('Nieprawidłowy format telefonu odbiorcy. Wymagany format: +48 XXX XXX XXX lub XXX XXX XXX');
   }
   ```

### Acceptance Criteria
- ✅ Import `Validators` jest dodany
- ✅ Walidacja telefonu nadawcy działa
- ✅ Walidacja telefonu odbiorcy działa
- ✅ Błędy są czytelne i informują o wymaganym formacie
- ✅ Istniejąca walidacja email działa bez zmian
- ✅ Test: Poprawny telefon `+48 123 456 789` przechodzi walidację
- ✅ Test: Niepoprawny telefon `12345` rzuca błąd

### Files to Modify
- `src/services/OrderService.js` (linie 1-5: import, linie 15-31: validateContactData)

---

## 📋 TASK 2: Cache Product ID

### Specification

**Plik**: `src/services/XpressDeliveryService.js`
**Funkcja**: `getDefaultProductId()`
**Linie**: 308-330
**Problem**: Metoda wywołuje `listProducts()` API dla KAŻDEGO zamówienia, co jest inefficient

### Problem Analysis
1. Każde wywołanie `createOrder()` → `getDefaultProductId()` → `listProducts()` → API call
2. Lista produktów rzadko się zmienia (statyczna)
3. Dodatkowy network request (delay)
4. Unnecessary API quota usage
5. W przypadku błędu zwraca string `'default-product-id'` zamiast rzucić error

### Wymagania
1. Cache'ować product ID w instancji klasy (`this.cachedProductId`)
2. Wywołać `listProducts()` tylko raz (przy pierwszym zamówieniu)
3. Używać cache dla kolejnych zamówień
4. Obsłużyć error bez fallback do string (throw error)
5. Logować informacje o cache hit/miss dla debugowania

### Implementation Details

**Current Code** (`XpressDeliveryService.js:308-330`):
```javascript
async getDefaultProductId() {
    try {
        const products = await this.listProducts();

        // Look for a generic package product
        const packageProduct = products.find(p =>
            p.type === 'pickup_delivery' ||
            p.name.toLowerCase().includes('paczka') ||
            p.code.toLowerCase().includes('package')
        );

        if (packageProduct) {
            return packageProduct.id;
        }

        // Return first product as fallback
        return products[0]?.id;
    } catch (error) {
        console.error('Failed to get default product ID:', error);
        // Return a fallback ID - this should be configured in production
        return 'default-product-id';  // ❌ BAD: Returns string instead of throwing
    }
}
```

**Required Changes**:

1. **Constructor** (`XpressDeliveryService.js:5-10`):
   ```javascript
   constructor() {
       this.config = ApiConfig.xpress;
       this.token = null;
       this.tokenExpiry = null;
       this.loginPromise = null;
       this.cachedProductId = null; // ADD THIS LINE
   }
   ```

2. **getDefaultProductId()** - Replace entire method:
   ```javascript
   async getDefaultProductId() {
       // Return cached value if available
       if (this.cachedProductId) {
           console.log('✅ Using cached product ID:', this.cachedProductId);
           return this.cachedProductId;
       }

       console.log('🔍 Fetching product ID from API (first time)...');

       try {
           const products = await this.listProducts();

           if (!products || products.length === 0) {
               throw new Error('No products available in Xpress API');
           }

           // Look for a generic package product
           const packageProduct = products.find(p =>
               p.type === 'pickup_delivery' ||
               p.name?.toLowerCase().includes('paczka') ||
               p.code?.toLowerCase().includes('package')
           );

           if (packageProduct?.id) {
               this.cachedProductId = packageProduct.id;
               console.log('✅ Cached product ID:', this.cachedProductId, `(${packageProduct.name})`);
               return this.cachedProductId;
           }

           // Use first product if no package-specific product found
           if (products[0]?.id) {
               this.cachedProductId = products[0].id;
               console.log('⚠️ Using first available product:', this.cachedProductId, `(${products[0].name})`);
               return this.cachedProductId;
           }

           throw new Error('No valid product ID found in API response');

       } catch (error) {
           console.error('❌ Failed to get product ID:', error);
           throw error; // Don't use string fallback!
       }
   }
   ```

### Cache Invalidation Strategy
- Cache lives for session duration (browser refresh clears it)
- For future: Add `clearProductCache()` method if needed
- For future: Add TTL (time-to-live) if products change frequently

### Acceptance Criteria
- ✅ `cachedProductId` property dodana do constructora
- ✅ Pierwszy call do `getDefaultProductId()` wywołuje `listProducts()`
- ✅ Drugi i kolejne calls zwracają cached value
- ✅ Console log pokazuje "cache hit" vs "API fetch"
- ✅ Error nie zwraca string, tylko throw
- ✅ Test: Utworzenie 3 zamówień → tylko 1 API call do listProducts()

### Files to Modify
- `src/services/XpressDeliveryService.js` (linie 5-10: constructor, linie 308-330: getDefaultProductId)

---

## 📋 TASK 3: HTML5 Input Validation

### Specification

**Plik**: `index-modular.html`
**Sekcja**: Contact form inputs
**Cel**: Dodać native HTML5 validation dla lepszego UX

### Problem
Inputs nie mają:
- Odpowiednich `type` attributes (wszystko jest `type="text"`)
- Pattern validation dla telefonów
- Native browser validation hints
- Lepszego UX (np. mobile keyboard dla email/tel)

### Wymagania
1. Znaleźć wszystkie input fields w contact form
2. Dodać odpowiednie `type` attributes:
   - `type="email"` dla email fields
   - `type="tel"` dla phone fields
   - `type="text"` dla name fields (już jest)
3. Dodać `pattern` dla telefonów (zgodny z Validators.js regex)
4. Dodać `title` attributes z informacją o wymaganym formacie
5. Upewnić się że `required` attribute jest obecny
6. Dodać `autocomplete` attributes dla lepszego UX

### Implementation Details

**Expected Input Fields** (szukać po `name` attribute):
- `senderName` - imię nadawcy
- `senderPhone` - telefon nadawcy
- `senderEmail` - email nadawcy
- `recipientName` - imię odbiorcy
- `recipientPhone` - telefon odbiorcy
- `recipientEmail` - email odbiorcy

**Pattern for Phone**:
Based on `Validators.isValidPhone()` regex:
```
pattern="(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{2}\s?\d{2})"
```

**Example Transform**:

**Before**:
```html
<input type="text" name="senderEmail" id="sender-email" required>
```

**After**:
```html
<input
    type="email"
    name="senderEmail"
    id="sender-email"
    required
    autocomplete="email"
    placeholder="jan@example.com">
```

**Before**:
```html
<input type="text" name="senderPhone" id="sender-phone" required>
```

**After**:
```html
<input
    type="tel"
    name="senderPhone"
    id="sender-phone"
    required
    pattern="(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{2}\s?\d{2})"
    title="Format: +48 XXX XXX XXX lub XXX XXX XXX"
    autocomplete="tel"
    placeholder="+48 123 456 789">
```

### Autocomplete Values
- `senderName`: `autocomplete="name"`
- `senderEmail`: `autocomplete="email"`
- `senderPhone`: `autocomplete="tel"`
- `recipientName`: `autocomplete="shipping name"`
- `recipientEmail`: `autocomplete="shipping email"`
- `recipientPhone`: `autocomplete="shipping tel"`

### Acceptance Criteria
- ✅ Wszystkie 6 input fields zaktualizowane
- ✅ Email inputs mają `type="email"`
- ✅ Phone inputs mają `type="tel"` i `pattern`
- ✅ Name inputs mają `type="text"` (bez zmian)
- ✅ Wszystkie mają `required`
- ✅ Wszystkie mają odpowiednie `autocomplete`
- ✅ Phone inputs mają `title` z informacją o formacie
- ✅ Test: Mobile device pokazuje odpowiednią klawiaturę dla email/tel
- ✅ Test: Browser native validation działa przed submit

### Files to Modify
- `index-modular.html` (contact form section)

---

## 📋 TASK 4: Revolut Payment Integration

### Specification

**Nowy plik**: `src/services/RevolutPaymentService.js`
**Modyfikacja**: `src/services/OrderService.js` (processPayment method)
**Cel**: Zaimplementować prawdziwą płatność przez Revolut Merchant API

### Research Required
1. Revolut Merchant API documentation
2. Revolut Checkout widget vs API
3. Sandbox vs Production credentials
4. Payment flow: create → redirect → callback → verify

### Architecture Decision

**Option A: Revolut Checkout Widget** (RECOMMENDED for MVP)
- Hosted payment page
- Redirects user to Revolut
- Handles 3DS, card validation
- Webhook for confirmation
- Pros: Fastest implementation, PCI compliant
- Cons: User leaves site temporarily

**Option B: Revolut API Direct**
- API calls from backend
- More control
- Requires backend server
- Pros: Better UX, full control
- Cons: More complex, needs backend

**DECISION**: Use Option A (Checkout Widget) for MVP

### Implementation Plan

#### 1. Create RevolutPaymentService.js

**File**: `src/services/RevolutPaymentService.js` (NEW)

```javascript
// Revolut Payment Service
import { ApiConfig } from '../config/api.config.js';

export class RevolutPaymentService {
    constructor() {
        this.config = ApiConfig.revolut;
        this.isInitialized = false;
        this.RevolutCheckout = null;
    }

    /**
     * Load Revolut Checkout SDK
     */
    async loadRevolutSDK() {
        if (this.RevolutCheckout) {
            return this.RevolutCheckout;
        }

        return new Promise((resolve, reject) => {
            // Load Revolut SDK script
            const script = document.createElement('script');
            script.src = this.config.widget.environment === 'prod'
                ? 'https://merchant.revolut.com/embed.js'
                : 'https://sandbox-merchant.revolut.com/embed.js';

            script.onload = () => {
                this.RevolutCheckout = window.RevolutCheckout;
                this.isInitialized = true;
                console.log('✅ Revolut SDK loaded');
                resolve(this.RevolutCheckout);
            };

            script.onerror = () => {
                console.error('❌ Failed to load Revolut SDK');
                reject(new Error('Failed to load Revolut SDK'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Create payment order
     * Returns: { publicId, status }
     */
    async createPaymentOrder(orderData) {
        try {
            const amount = parseFloat(orderData.prices[orderData.selectedPackage]);

            // Create order via Revolut API
            const response = await fetch(`${this.getApiUrl()}/api/1.0/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'PLN',
                    description: `Xpress Delivery - ${orderData.selectedPackage} package`,
                    customer_email: orderData.contact.senderEmail,
                    metadata: {
                        orderNumber: orderData.orderNumber,
                        externalId: orderData.externalId
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Revolut API error: ${error.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Revolut order created:', data.public_id);

            return {
                publicId: data.public_id,
                status: data.state
            };

        } catch (error) {
            console.error('❌ Revolut order creation failed:', error);
            throw error;
        }
    }

    /**
     * Initialize payment widget and process payment
     */
    async processPayment(orderData) {
        try {
            // Load SDK if not loaded
            if (!this.RevolutCheckout) {
                await this.loadRevolutSDK();
            }

            // Create payment order
            const order = await this.createPaymentOrder(orderData);

            // Initialize Revolut Checkout
            const instance = await this.RevolutCheckout(order.publicId, this.config.widget.environment);

            // Open payment modal
            const paymentResult = await instance.payWithPopup({
                email: orderData.contact.senderEmail,
                name: orderData.contact.senderName,
                phone: orderData.contact.senderPhone,
                locale: 'pl',
                savePaymentMethodFor: 'merchant'
            });

            console.log('✅ Payment result:', paymentResult);

            // Verify payment status
            if (paymentResult.status === 'completed') {
                return {
                    success: true,
                    transactionId: order.publicId,
                    amount: parseFloat(orderData.prices[orderData.selectedPackage]),
                    status: 'completed'
                };
            } else {
                throw new Error(`Payment ${paymentResult.status}`);
            }

        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            throw error;
        }
    }

    /**
     * Get Revolut API URL based on environment
     */
    getApiUrl() {
        return this.config.widget.environment === 'prod'
            ? 'https://merchant.revolut.com'
            : 'https://sandbox-merchant.revolut.com';
    }

    /**
     * Verify payment status (for webhook callback)
     */
    async verifyPayment(publicId) {
        try {
            const response = await fetch(`${this.getApiUrl()}/api/1.0/orders/${publicId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }

            const data = await response.json();
            return {
                status: data.state,
                amount: data.amount / 100,
                currency: data.currency
            };

        } catch (error) {
            console.error('❌ Payment verification failed:', error);
            throw error;
        }
    }
}
```

#### 2. Update OrderService.js

**File**: `src/services/OrderService.js`

**Changes**:

1. Import RevolutPaymentService:
```javascript
import { RevolutPaymentService } from './RevolutPaymentService.js';
```

2. Update constructor:
```javascript
constructor() {
    this.config = ApiConfig.xpress;
    this.revolutService = new RevolutPaymentService();
    this.packageTypes = { ... };
}
```

3. Replace processPayment method (lines 112-122):
```javascript
async processPayment(orderData) {
    try {
        // Check if Revolut is configured and not in mock mode
        const useMockPayment = !this.config.revolut?.apiKey ||
                               this.config.revolut.apiKey === 'YOUR_REVOLUT_MERCHANT_API_KEY';

        if (useMockPayment) {
            console.warn('⚠️ Using mock payment - Revolut not configured');
            console.log('💡 To use real payments, configure REVOLUT_API_KEY in .env.local');

            // Mock payment for development
            await new Promise(resolve => setTimeout(resolve, 2000));
            return {
                success: true,
                transactionId: `MOCK-${Date.now()}`,
                amount: parseFloat(orderData.prices[orderData.selectedPackage]),
                status: 'mock'
            };
        }

        // Real Revolut payment
        console.log('💳 Processing real Revolut payment...');
        return await this.revolutService.processPayment(orderData);

    } catch (error) {
        console.error('❌ Payment error:', error);
        throw new Error(`Płatność nie powiodła się: ${error.message}`);
    }
}
```

#### 3. Update ApiConfig

**File**: `src/config/api.config.js`

Ensure Revolut config is properly loaded:
```javascript
revolut: {
    apiKey: config.revolut.apiKey,
    webhookSecret: config.revolut.webhookSecret,
    sandboxMode: config.revolut.sandboxMode,
    widget: {
        publicKey: config.revolut.widget.publicKey,
        environment: config.revolut.widget.environment
    }
}
```

### Revolut Credentials Setup

**Sandbox Credentials** (for testing):
1. Sign up at https://sandbox-business.revolut.com
2. Get API key from Merchant API section
3. Add to `.env.local`:
```
REVOLUT_API_KEY=your-sandbox-api-key
REVOLUT_PUBLIC_KEY=your-public-key (if needed)
REVOLUT_ENVIRONMENT=sandbox
```

**Production Credentials** (for live):
1. Business account verification required
2. Get production API key
3. Update `.env.local` with `REVOLUT_ENVIRONMENT=prod`

### Testing Strategy

**Manual Testing**:
1. Use Revolut test cards in sandbox:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`
2. Test full flow with small amount (1 PLN)
3. Verify order created in Xpress before payment
4. Verify payment confirmation after Revolut

**Fallback Behavior**:
- If Revolut API key not configured → mock payment
- If Revolut SDK fails to load → error with clear message
- If payment cancelled by user → handle gracefully

### Acceptance Criteria
- ✅ `RevolutPaymentService.js` created
- ✅ SDK loader implementowany
- ✅ `createPaymentOrder()` działa
- ✅ `processPayment()` otwiera Revolut modal
- ✅ Mock fallback działa gdy credentials nie skonfigurowane
- ✅ Error handling dla wszystkich failure scenarios
- ✅ Test: Mock payment działa bez credentials
- ✅ Test: Real payment działa z sandbox credentials
- ✅ Console logi jasno pokazują mock vs real payment

### Files to Create/Modify
- `src/services/RevolutPaymentService.js` (NEW)
- `src/services/OrderService.js` (import + constructor + processPayment)
- `src/config/api.config.js` (verify revolut config)

---

## 📋 TASK 5: Environment Variables Loader

### Specification

**Cel**: Utworzyć system ładowania environment variables z `.env.local` do aplikacji frontend
**Problem**: Obecnie API keys są hardcoded w `config.local.js` i `index-modular.html`

### Architecture Decision

**Browser-based application** → Cannot directly read `.env.local` file (server-side only)

**Options**:
1. **PHP Backend** - Load .env and inject into JS
2. **Node Backend** - Express server to serve config
3. **Build-time Injection** - Replace placeholders during build
4. **Docker Runtime Injection** - Replace in container startup

**DECISION**: Use Docker Runtime Injection (Option 4)
- Works with deploy_app.py
- No build process needed
- Secrets not in git
- Simple for deployment

### Implementation Plan

#### 1. Update config.local.js with Placeholders

**File**: `config.local.js`

**Replace entire content**:
```javascript
// Local configuration with API keys
// IMPORTANT: Placeholders will be replaced at deployment time
window.CONFIG_LOCAL = {
    // Google Maps API configuration
    googleMaps: {
        apiKey: '__GOOGLE_MAPS_API_KEY__',
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

    // Development settings
    development: {
        useMockData: false,
        debugMode: true,
        showTestButton: true
    }
};
```

#### 2. Update index-modular.html

**File**: `index-modular.html`

**Current line 239**:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAAF9Vp_cRnYnXYlDS1tJk5fmtTM8VSpFE&libraries=places&callback=initGoogleMaps&loading=async"></script>
```

**Replace with**:
```html
<!-- Load config first (with placeholders) -->
<script src="config.local.js"></script>

<!-- Dynamically inject Google Maps with API key from config -->
<script>
    (function() {
        const apiKey = window.CONFIG_LOCAL?.googleMaps?.apiKey || '';
        if (!apiKey || apiKey.startsWith('__')) {
            console.error('❌ Google Maps API key not configured!');
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    })();
</script>
```

#### 3. Create inject-env.sh Script

**File**: `inject-env.sh` (NEW - in project root)

```bash
#!/bin/bash
# Environment Variable Injection Script
# This script replaces placeholders in config.local.js with actual env vars

set -e

echo "🔧 Injecting environment variables into config.local.js..."

CONFIG_FILE="${CONFIG_FILE:-/usr/share/nginx/html/config.local.js}"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

# Function to safely replace placeholder
replace_placeholder() {
    local placeholder=$1
    local value=$2

    if [ -z "$value" ]; then
        echo "⚠️  Warning: $placeholder is empty"
        return
    fi

    # Escape special characters for sed
    value_escaped=$(printf '%s\n' "$value" | sed 's/[&/\]/\\&/g')

    # Replace placeholder
    sed -i "s|${placeholder}|${value_escaped}|g" "$CONFIG_FILE"
    echo "✅ Replaced $placeholder"
}

# Replace all placeholders
replace_placeholder "__GOOGLE_MAPS_API_KEY__" "${GOOGLE_MAPS_API_KEY}"
replace_placeholder "__XPRESS_API_USERNAME__" "${XPRESS_API_USERNAME}"
replace_placeholder "__XPRESS_API_PASSWORD__" "${XPRESS_API_PASSWORD}"
replace_placeholder "__REVOLUT_API_KEY__" "${REVOLUT_API_KEY:-YOUR_REVOLUT_MERCHANT_API_KEY}"
replace_placeholder "__REVOLUT_WEBHOOK_SECRET__" "${REVOLUT_WEBHOOK_SECRET:-YOUR_WEBHOOK_SECRET}"
replace_placeholder "__REVOLUT_PUBLIC_KEY__" "${REVOLUT_PUBLIC_KEY:-YOUR_REVOLUT_PUBLIC_KEY}"
replace_placeholder "__REVOLUT_ENVIRONMENT__" "${REVOLUT_ENVIRONMENT:-sandbox}"

echo "✅ Environment variables injected successfully"

# Show config (with masked secrets for debugging)
echo "📋 Config preview (secrets masked):"
grep -v "password\|apiKey\|secret" "$CONFIG_FILE" || true

echo "🚀 Ready to start application"
```

**Make executable**:
```bash
chmod +x inject-env.sh
```

#### 4. Update env.config.js

**File**: `src/config/env.config.js`

**Update `loadFromLocalFile()` method** (lines 74-110):

```javascript
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
```

#### 5. Local Development Script

**File**: `load-local-env.sh` (NEW - for local development)

```bash
#!/bin/bash
# Local Development Environment Loader
# Loads .env.local and creates config.local.js for browser

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found!"
    echo "💡 Copy .env.template to .env.local and fill in your credentials"
    exit 1
fi

echo "🔧 Loading environment from $ENV_FILE..."

# Source the env file
export $(grep -v '^#' $ENV_FILE | xargs)

# Run inject script
CONFIG_FILE="config.local.js" ./inject-env.sh

echo "✅ Local environment configured"
echo "🚀 Start development server: python3 -m http.server 8080"
```

**Make executable**:
```bash
chmod +x load-local-env.sh
```

### Usage

**Local Development**:
```bash
# 1. One-time setup
cp .env.template .env.local
# Edit .env.local with your credentials

# 2. Load env vars into config.local.js
./load-local-env.sh

# 3. Start dev server
python3 -m http.server 8080
```

**Production Deployment** (handled by Dockerfile):
```bash
# Environment vars injected automatically by inject-env.sh in container startup
```

### Security Notes

1. **config.local.js** should be in `.gitignore` AFTER injection
2. **inject-env.sh** only runs at deployment/startup
3. **Placeholders** visible in git (not secrets)
4. **Real values** only in `.env.local` (gitignored) and deployment env vars

### Acceptance Criteria
- ✅ `config.local.js` has placeholders instead of hardcoded keys
- ✅ `inject-env.sh` script created and executable
- ✅ `load-local-env.sh` script for local dev
- ✅ `index-modular.html` loads Google Maps dynamically
- ✅ `env.config.js` detects placeholders and warns
- ✅ Test: Local dev with `./load-local-env.sh` works
- ✅ Test: No hardcoded secrets in git
- ✅ Test: Placeholders get replaced correctly

### Files to Create/Modify
- `config.local.js` (replace hardcoded with placeholders)
- `index-modular.html` (dynamic Google Maps loading)
- `inject-env.sh` (NEW)
- `load-local-env.sh` (NEW)
- `src/config/env.config.js` (update loadFromLocalFile)
- `.gitignore` (ensure config.local.js is NOT ignored, but .env.local IS)

---

## 📋 TASK 6: Docker Deployment Configuration

### Specification

**Cel**: Przygotować konfigurację Docker dla deployment na borg.tools
**Method**: Docker + Nginx + deploy_app.py script

### Files to Create

#### 1. Dockerfile

**File**: `Dockerfile` (NEW)

```dockerfile
FROM nginx:alpine

# Install bash for injection script
RUN apk add --no-cache bash

# Copy application files
COPY index-modular.html /usr/share/nginx/html/index.html
COPY index.html /usr/share/nginx/html/index-legacy.html
COPY src/ /usr/share/nginx/html/src/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/
COPY config.local.js /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy environment injection script
COPY inject-env.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Expose port
EXPOSE 80

# nginx:alpine automatically runs scripts in /docker-entrypoint.d/
# Our inject-env.sh will run before nginx starts
```

#### 2. nginx.conf

**File**: `nginx.conf` (NEW)

```nginx
server {
    listen 80;
    server_name sendxpress.borg.tools;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Main application (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Legacy version
    location /legacy {
        try_files /index-legacy.html =404;
    }

    # Static assets - long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API proxy (if needed in future)
    # location /api/ {
    #     proxy_pass https://api.xpress.delivery/;
    #     proxy_set_header Host api.xpress.delivery;
    # }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### 3. .dockerignore

**File**: `.dockerignore` (NEW)

```
# Environment files (secrets)
.env.local
.env

# Development files
node_modules/
.git/
.github/
.vscode/
.idea/

# Documentation
README.md
README-modular.md
DEPLOYMENT.md
REPORT.md
FLOW_ANALYSIS_REPORT.md
CLAUDE.md
specs/

# Build artifacts
dist/
build/
*.log

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp
```

#### 4. docker-compose.yml (for local testing)

**File**: `docker-compose.yml` (NEW)

```yaml
version: '3.8'

services:
  sendxpress:
    build: .
    container_name: sendxpress-local
    ports:
      - "8080:80"
    environment:
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - XPRESS_API_USERNAME=${XPRESS_API_USERNAME}
      - XPRESS_API_PASSWORD=${XPRESS_API_PASSWORD}
      - REVOLUT_API_KEY=${REVOLUT_API_KEY:-YOUR_REVOLUT_MERCHANT_API_KEY}
      - REVOLUT_WEBHOOK_SECRET=${REVOLUT_WEBHOOK_SECRET:-YOUR_WEBHOOK_SECRET}
      - REVOLUT_PUBLIC_KEY=${REVOLUT_PUBLIC_KEY:-YOUR_REVOLUT_PUBLIC_KEY}
      - REVOLUT_ENVIRONMENT=${REVOLUT_ENVIRONMENT:-sandbox}
    env_file:
      - .env.local
    volumes:
      # Mount for development (hot reload)
      - ./src:/usr/share/nginx/html/src:ro
      - ./index-modular.html:/usr/share/nginx/html/index.html:ro
    networks:
      - sendxpress-network

networks:
  sendxpress-network:
    driver: bridge
```

### Deployment Process

#### Local Testing

```bash
# 1. Build image
docker build -t sendxpress:latest .

# 2. Test with docker-compose
docker-compose up

# 3. Open browser
open http://localhost:8080
```

#### Deploy to borg.tools

```bash
# 1. SSH to server
ssh vizi@borg.tools

# 2. Create deployment directory
mkdir -p /home/vizi/apps/sendxpress
cd /home/vizi/apps/sendxpress

# 3. Upload files (from local machine)
# Use scp or rsync
rsync -avz --exclude '.git' \
      --exclude 'node_modules' \
      --exclude '.env.local' \
      /Users/wojciechwiesner/ai/xpress-mvp2/ \
      vizi@borg.tools:/home/vizi/apps/sendxpress/

# 4. Run deploy script
python3 /home/vizi/deploy_app.py \
  --source /home/vizi/apps/sendxpress \
  --app-name sendxpress \
  --subdomain sendxpress.borg.tools \
  --container-port 80 \
  --env-var "GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}" \
  --env-var "XPRESS_API_USERNAME=${XPRESS_API_USERNAME}" \
  --env-var "XPRESS_API_PASSWORD=${XPRESS_API_PASSWORD}" \
  --env-var "REVOLUT_API_KEY=${REVOLUT_API_KEY}" \
  --env-var "REVOLUT_PUBLIC_KEY=${REVOLUT_PUBLIC_KEY}" \
  --env-var "REVOLUT_ENVIRONMENT=sandbox" \
  --dockerfile-path ./Dockerfile
```

### Verification Steps

```bash
# 1. Check container is running
docker ps | grep sendxpress

# 2. Check logs
docker logs sendxpress-container

# 3. Test health endpoint
curl http://sendxpress.borg.tools/health

# 4. Check nginx config was generated
cat /home/vizi/nginx/conf.d/sendxpress.borg.tools.conf

# 5. Test in browser
open https://sendxpress.borg.tools
```

### Rollback Plan

```bash
# If deployment fails:
docker stop sendxpress-container
docker rm sendxpress-container

# Remove nginx config
rm /home/vizi/nginx/conf.d/sendxpress.borg.tools.conf

# Reload nginx
docker exec nginx-reverse-proxy-container nginx -s reload
```

### Acceptance Criteria
- ✅ `Dockerfile` created with multi-stage if needed
- ✅ `nginx.conf` optimized for SPA
- ✅ `.dockerignore` excludes sensitive files
- ✅ `docker-compose.yml` for local testing
- ✅ Environment injection script runs in container
- ✅ Test: Local docker build succeeds
- ✅ Test: Local docker-compose works
- ✅ Test: Health endpoint returns 200
- ✅ Deploy script ready for borg.tools

### Files to Create
- `Dockerfile` (NEW)
- `nginx.conf` (NEW)
- `.dockerignore` (NEW)
- `docker-compose.yml` (NEW)

---

## 📋 Summary: Implementation Order

1. **TASK 1**: Fix Phone Validation (15 min)
2. **TASK 2**: Cache Product ID (15 min)
3. **TASK 3**: HTML5 Input Validation (15 min)
4. **TASK 5**: Environment Variables Loader (30 min) - BEFORE TASK 4
5. **TASK 4**: Revolut Payment Integration (60-90 min)
6. **TASK 6**: Docker Deployment Configuration (30 min)
7. **DEPLOYMENT**: Upload to borg.tools and deploy (30 min)
8. **TESTING**: End-to-end verification (30 min)

**Total Estimated Time**: 3.5-4 hours

---

Created by The Collective Borg.tools
Specification Version: 1.0
Date: 2025-10-20
