// Pricing calculation service
import { AppConfig } from '../config/app.config.js';

export class PricingService {
    constructor() {
        this.config = AppConfig.pricing;
        this.supportedCities = AppConfig.supportedCities;
        this.maxDistance = AppConfig.maxDistance;
    }

    // Validate if cities are supported
    validateCitySupport(pickupAddress, deliveryAddress) {
        const pickupSupported = this.supportedCities.some(city => 
            pickupAddress.toLowerCase().includes(city.toLowerCase())
        );
        const deliverySupported = this.supportedCities.some(city => 
            deliveryAddress.toLowerCase().includes(city.toLowerCase())
        );
        
        if (!pickupSupported) {
            throw new Error(`Usługa niedostępna w mieście odbioru. Obsługujemy: Warszawa, Łódź, Poznań, Kraków, Wrocław, Szczecin, Trójmiasto, Katowice, Bielsko-Biała`);
        }
        if (!deliverySupported) {
            throw new Error(`Usługa niedostępna w mieście dostawy. Obsługujemy: Warszawa, Łódź, Poznań, Kraków, Wrocław, Szczecin, Trójmiasto, Katowice, Bielsko-Biała`);
        }
    }

    // Validate distance limit
    validateDistance(distanceKm) {
        if (distanceKm > this.maxDistance) {
            throw new Error(`Nasza usługa jest miejska do ${this.maxDistance}km. Odległość: ${distanceKm.toFixed(1)}km`);
        }
    }

    // Calculate prices based on distance
    calculatePrices(distanceKm) {
        const { baseDistance, basePrice, additionalKmPrice, largeMultiplier } = this.config;
        
        let smallPrice, mediumPrice, largePrice;
        
        if (distanceKm <= baseDistance) {
            // Within base distance - use base price
            smallPrice = basePrice.small;
            mediumPrice = basePrice.medium;
        } else {
            // Beyond base distance - add cost for additional km
            const extraKm = distanceKm - baseDistance;
            const extraCost = extraKm * additionalKmPrice;
            
            smallPrice = basePrice.small + extraCost;
            mediumPrice = basePrice.medium + extraCost;
        }
        
        // Large package is +50% of medium
        largePrice = mediumPrice * largeMultiplier;
        
        return {
            small: smallPrice.toFixed(2),
            medium: mediumPrice.toFixed(2),
            large: largePrice.toFixed(2)
        };
    }

    // Get pricing breakdown for display
    getPricingBreakdown(distanceKm) {
        const { baseDistance, basePrice, additionalKmPrice } = this.config;
        
        if (distanceKm <= baseDistance) {
            return {
                basePrice: basePrice.small,
                extraKm: 0,
                extraCost: 0,
                description: `Cena bazowa do ${baseDistance}km`
            };
        } else {
            const extraKm = distanceKm - baseDistance;
            const extraCost = extraKm * additionalKmPrice;
            
            return {
                basePrice: basePrice.small,
                extraKm: extraKm,
                extraCost: extraCost,
                description: `${basePrice.small}zł (do ${baseDistance}km) + ${extraCost.toFixed(2)}zł (${extraKm.toFixed(1)}km × ${additionalKmPrice}zł)`
            };
        }
    }

}