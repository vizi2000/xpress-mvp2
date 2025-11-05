// Price Calculator Component
import { UIHelpers } from '../utils/UIHelpers.js';
import { AppConfig } from '../config/app.config.js';

export class PriceCalculator {
    constructor(googleMapsService, pricingService, appConfig) {
        this.googleMapsService = googleMapsService;
        this.pricingService = pricingService;
        this.appConfig = appConfig;
        this.packageTypes = {
            small: { name: 'Mała paczka', multiplier: 1.0 },
            medium: { name: 'Średnia paczka', multiplier: 1.3 },
            large: { name: 'Duża paczka', multiplier: 1.8 }
        };
    }

    // Calculate prices for given addresses
    async calculatePrice(pickupAddress, deliveryAddress, cachedCoords = null, skipCityValidation = false) {
        console.log('💰 CALC PRICE:', { pickupAddress, deliveryAddress, cachedCoords, skipCityValidation });

        try {
            UIHelpers.showLoading('Obliczam cenę...');

            // Try real API first, fallback to estimated pricing if Google Maps fails
            try {
                console.log('💰 Attempting real price calculation...');
                const result = await this.calculateRealPrice(pickupAddress, deliveryAddress, skipCityValidation);
                console.log('💰 Real price calculation result:', result);
                this.showResults(result);
            } catch (apiError) {
                console.warn('⚠️ Real API failed, using estimated pricing:', apiError.message);
                const result = await this.calculateEstimatedPrice(pickupAddress, deliveryAddress, cachedCoords, skipCityValidation);
                console.log('💰 Estimated price calculation result:', result);
                this.showResults(result);
            }

        } catch (error) {
            console.error('❌ Price calculation error:', error);
            UIHelpers.hideLoading();
            this.handleCalculationError(error);
        }
    }

    // Calculate real price using Google Maps API
    async calculateRealPrice(pickupAddress, deliveryAddress, skipCityValidation = false) {
        // Validate cities first (unless skipped for partial addresses)
        this.pricingService.validateCitySupport(pickupAddress, deliveryAddress, skipCityValidation);

        // Get distance from Google Maps
        const routeData = await this.googleMapsService.calculateDistance(pickupAddress, deliveryAddress);

        // Validate distance limit
        this.pricingService.validateDistance(routeData.distance);

        // Calculate prices
        const prices = this.pricingService.calculatePrices(routeData.distance);

        return {
            distance: routeData.distance.toFixed(1),
            timeEstimate: `${Math.floor(routeData.duration)}-${Math.floor(routeData.duration) + 10}`,
            prices: prices,
            breakdown: this.pricingService.getPricingBreakdown(routeData.distance),
            // Include coordinates for order creation
            pickupCoords: routeData.pickupCoords,
            deliveryCoords: routeData.deliveryCoords
        };
    }

    // Calculate estimated price when Google Maps API is unavailable
    async calculateEstimatedPrice(pickupAddress, deliveryAddress, cachedCoords = null, skipCityValidation = false) {
        // Validate cities first (unless skipped for partial addresses)
        this.pricingService.validateCitySupport(pickupAddress, deliveryAddress, skipCityValidation);

        // Use estimated distance based on city centers (rough approximation)
        const estimatedDistance = this.estimateDistanceBetweenAddresses(pickupAddress, deliveryAddress);

        // Validate distance limit
        this.pricingService.validateDistance(estimatedDistance);

        // Calculate prices based on estimated distance
        const prices = this.pricingService.calculatePrices(estimatedDistance);

        // Add short delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use cached coordinates from autocomplete if available
        const pickupCoords = (cachedCoords && cachedCoords.pickup) ? cachedCoords.pickup : null;
        const deliveryCoords = (cachedCoords && cachedCoords.delivery) ? cachedCoords.delivery : null;

        if (pickupCoords && deliveryCoords) {
            console.log('✅ Using cached coords from autocomplete:', { pickupCoords, deliveryCoords });
        }

        return {
            distance: estimatedDistance.toFixed(1),
            timeEstimate: `${Math.floor(estimatedDistance * 2.5)}-${Math.floor(estimatedDistance * 2.5) + 10}`,
            prices: prices,
            breakdown: this.pricingService.getPricingBreakdown(estimatedDistance),
            estimated: true, // Flag to indicate this is estimated
            // Use cached coords if available, otherwise null
            pickupCoords: pickupCoords,
            deliveryCoords: deliveryCoords
        };
    }
    
    // Rough distance estimation between addresses (fallback when Google Maps fails)
    estimateDistanceBetweenAddresses(pickup, delivery) {
        // Very basic estimation - in real app this could use a simple distance calculation
        // For now, return a reasonable distance within city limits
        const baseDistance = 5; // Base 5km for same city
        const randomVariation = Math.random() * 8; // 0-8km variation
        return baseDistance + randomVariation; // 5-13km range
    }

    // Show calculation results
    showResults(result) {
        // Update route display
        const distanceText = result.estimated ? `~${result.distance} km (szacowane)` : `${result.distance} km`;
        UIHelpers.updateText('distance-display', distanceText);
        UIHelpers.updateText('time-display', `${result.timeEstimate} min`);
        
        // Update prices with animation
        UIHelpers.updateText('price-small', `${result.prices.small} zł`);
        UIHelpers.updateText('price-medium', `${result.prices.medium} zł`);
        UIHelpers.updateText('price-large', `${result.prices.large} zł`);
        
        // Show results section
        UIHelpers.toggleElement('results-section', true);
        UIHelpers.hideLoading();
        
        // Smooth scroll to results
        UIHelpers.scrollToElement('results-section');

        // Store results for later use
        this.lastCalculation = result;
        
        // Show estimation notice if applicable
        if (result.estimated) {
            console.log('💡 Prices based on estimated distance - Google Maps unavailable');
        }
    }

    // Handle calculation errors
    handleCalculationError(error) {
        // Show specific error messages
        if (error.message.includes('Usługa niedostępna') || 
            error.message.includes('usługa jest miejska') ||
            error.message.includes('Address not found')) {
            UIHelpers.showError(error.message);
        } else {
            UIHelpers.showError('Błąd podczas obliczania ceny. Spróbuj ponownie.');
        }
        
        // Hide results section on error
        UIHelpers.toggleElement('results-section', false);
    }

    // Get last calculation result
    getLastCalculation() {
        return this.lastCalculation || null;
    }

    // Show pricing breakdown
    showPricingBreakdown(breakdown) {
        if (!breakdown) return;

        const breakdownHtml = `
            <div class="pricing-breakdown">
                <h4>Kalkulacja ceny:</h4>
                <p>${breakdown.description}</p>
                ${breakdown.extraCost > 0 ? 
                    `<small>Dodatkowe ${breakdown.extraKm.toFixed(1)}km × ${AppConfig.pricing.additionalKmPrice}zł/km = ${breakdown.extraCost.toFixed(2)}zł</small>` 
                    : ''
                }
            </div>
        `;
        
        // You could add this to a dedicated breakdown element
        console.log('Pricing breakdown:', breakdown);
    }

    // Clear previous results
    clearResults() {
        UIHelpers.toggleElement('results-section', false);
        this.lastCalculation = null;
    }

    // Get package info
    getPackageInfo(packageSize) {
        return this.packageTypes[packageSize] || this.packageTypes.small;
    }
}