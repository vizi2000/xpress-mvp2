# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Xpress.Delivery MVP - A courier service application for ordering package deliveries in Warsaw without registration. Built with vanilla JavaScript using modular architecture, integrating with Xpress.Delivery API and Google Maps API.

**Primary Interface**: [index-modular.html](index-modular.html) (modular version with ES6 modules)
**Legacy Interface**: [index.html](index.html) (monolithic version)

## Development Commands

### Local Development
```bash
# Start local development server (Python 3)
python3 -m http.server 8080

# Alternative: Python 2
python -m SimpleHTTPServer 8080

# Alternative: Node.js live-server
npx live-server

# Alternative: PHP
php -S localhost:8000
```

Access at: `http://localhost:8080/index-modular.html`

### Environment Setup
```bash
# Copy environment template
cp .env.template .env.local

# Edit with your credentials (required for full functionality)
# - XPRESS_API_USERNAME
# - XPRESS_API_PASSWORD
# - GOOGLE_MAPS_API_KEY
```

## Architecture

### Modular Structure (src/)

The application follows a component-based architecture with ES6 modules:

**Services Layer** (`src/services/`)
- `XpressDeliveryService.js` - Xpress.Delivery API integration (authentication, order creation, tracking)
- `GoogleMapsService.js` - Google Maps API integration (autocomplete, route calculation)
- `PricingService.js` - Package pricing calculation based on distance
- `OrderService.js` - Order management, validation, and mock order creation

**Components Layer** (`src/components/`)
- `XpressApp.js` - Main application controller and state management
- `AddressForm.js` - Address input with Google Places autocomplete
- `PriceCalculator.js` - Price calculation and display with map
- `OrderStatus.js` - Real-time order tracking display

**Configuration Layer** (`src/config/`)
- `env.config.js` - Environment variable loader (reads from `.env.local` or falls back)
- `api.config.js` - API configuration (Google Maps, Xpress, Revolut)
- `api.config.production.js` - Production configuration without local credentials
- `app.config.js` - Application-level configuration (development settings)

**Utilities** (`src/utils/`)
- `Validators.js` - Form validation (email, phone, address)
- `UIHelpers.js` - DOM manipulation helpers

### Key Architectural Patterns

1. **Authentication Flow**: `XpressDeliveryService` handles automatic login using configured credentials, with token caching and refresh logic

2. **State Management**: `XpressApp` maintains order state and coordinates between components via callback pattern

3. **Environment Configuration**: Multi-layer fallback system:
   - Environment variables (production)
   - `.env.local` file (development)
   - Mock/fallback values (development only)

4. **API Integration Strategy**:
   - Primary: Real Xpress.Delivery API calls with automatic authentication
   - Fallback: Mock implementations if API unavailable (dev mode only)

## Security & Credentials

**CRITICAL**: No credentials should be committed to the repository.

- All sensitive data loaded via environment variables
- `.env.local` is gitignored (local development only)
- GitHub Actions validates environment variable presence
- Production credentials set in deployment platform (Vercel/Netlify)

**Required Environment Variables**:
- `XPRESS_API_USERNAME` - Xpress.Delivery account email
- `XPRESS_API_PASSWORD` - Xpress.Delivery account password
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed security guidelines.

## API Integration Details

### Xpress.Delivery API
- **Base URL**: `https://api.xpress.delivery`
- **Authentication**: JWT token-based (14-day expiry)
- **Key Endpoints**:
  - `POST /api/auth/login` - Authenticate and get token
  - `POST /api/order/create` - Create new delivery order
  - `GET /api/order/info?orderId={id}` - Get order status
  - `GET /api/product/list` - List available delivery products

### Google Maps API
**Required APIs** (must be enabled in Google Cloud Console):
- Places API (address autocomplete)
- Directions API (route calculation)
- Geocoding API (address validation)
- Distance Matrix API (distance calculation)

## Testing

### Development Mode Features
- Test button (🧪) appears on localhost/127.0.0.1
- Auto-fills form with test data for quick testing
- Mock API fallback if real APIs unavailable
- Console logging for debugging

### Test Data
The application provides test data via `AddressForm.fillTestData()`:
- Pickup: ul. Krakowska 123, Warszawa
- Delivery: ul. Marszałkowska 45, Warszawa
- Package size: Small
- Contact info: Test data

## Deployment

### Production Server
- **Server**: `vizi@borg.tools` (passwordless SSH configured)
- **Domain**: https://sendxpress.borg.tools
- **Port**: 8081 (internal), 80/443 (external via nginx-proxy)
- **Container**: `sendxpress-container`
- **Method**: Docker + Universal deploy script

### Quick Deploy (from local machine)
```bash
# Deploy main branch to production
ssh vizi@borg.tools './deploy.sh sendxpress'

# Deploy specific branch
ssh vizi@borg.tools './deploy.sh sendxpress feature/new-feature'
```

### Deploy Script Features
The universal `~/deploy.sh` script on server automatically:
1. Pulls latest code from GitHub (specified branch)
2. Builds Docker image (`sendxpress-app`)
3. Stops old container (`sendxpress-container`)
4. Starts new container on port 8081
5. Reloads nginx-proxy for SSL/domain routing
6. Tests deployment and shows status

### Manual Deployment (if script fails)
```bash
ssh vizi@borg.tools
cd ~/apps/sendxpress
git pull origin main
docker build -t sendxpress-app .
docker stop sendxpress-container && docker rm sendxpress-container
docker run -d --name sendxpress-container --env-file .env.local -p 8081:80 sendxpress-app
docker exec nginx-proxy nginx -s reload
```

### Deployment Status & Logs
```bash
# Check if container is running
ssh vizi@borg.tools 'docker ps | grep sendxpress'

# View live logs
ssh vizi@borg.tools 'docker logs -f sendxpress-container'

# Test production URL
curl -I https://sendxpress.borg.tools

# Restart container (if needed)
ssh vizi@borg.tools 'docker restart sendxpress-container'
```

### Rollback (if deployment fails)
```bash
ssh vizi@borg.tools 'cd ~/apps/sendxpress && git reset --hard HEAD~1 && ~/deploy.sh sendxpress'
```

### CI/CD Pipeline
GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):
- **Auto-deploy on push to `main` branch** → Production (sendxpress.borg.tools)
- Push to other branches → Manual deploy with branch name
- Validates environment variables
- Security scanning for hardcoded secrets
- Creates production environment configuration

### Deployment Configuration
Each project has a `deploy-config.txt` file (on server):
```
PORT=8081
DOMAIN=sendxpress.borg.tools
CONTAINER_NAME=sendxpress-container
IMAGE_NAME=sendxpress-app
```

This ensures no port conflicts between multiple projects on the same server.

## Common Development Patterns

### Adding a New Service Method
```javascript
// In appropriate service file (e.g., XpressDeliveryService.js)
async methodName() {
    await this.ensureAuthenticated(); // For Xpress API calls

    const response = await fetch(`${this.config.baseUrl}/api/endpoint`, {
        headers: this.getAuthHeaders()
    });

    if (!response.ok) throw new Error('...');
    return await response.json();
}
```

### Adding a New Component
1. Create file in `src/components/`
2. Import required services in constructor
3. Export as ES6 class
4. Initialize in `XpressApp.initializeComponents()`

### Updating Configuration
- Development: Edit `.env.local`
- Production: Update environment variables in deployment platform
- Never commit credentials to `config.local.js` or similar files

## Browser Console Messages

The application logs useful debugging information:
- ✅ Success messages (green)
- ⚠️ Warnings (yellow)
- ❌ Errors (red)
- 🔐 Authentication events
- 📋 Configuration validation

## Language & Localization

- UI Language: Polish (pl)
- Comments: English
- User-facing messages: Polish
- Console logs: English with emoji indicators

Created by The Collective Borg.tools
