// Validation utilities
export class Validators {
    // Email validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation (Polish format)
    static isValidPhone(phone) {
        const phoneRegex = /^(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{2}\s?\d{2})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Required field validation
    static isRequired(value) {
        return value && value.toString().trim().length > 0;
    }

    // Minimum length validation
    static hasMinLength(value, minLength) {
        return value && value.toString().length >= minLength;
    }

    // Maximum length validation
    static hasMaxLength(value, maxLength) {
        return !value || value.toString().length <= maxLength;
    }

    // Address validation (basic)
    static isValidAddress(address) {
        return address && 
               address.trim().length >= 10 && 
               address.includes(',') || address.includes(' ');
    }

    // Distance validation
    static isValidDistance(distance, maxDistance = 20) {
        return distance > 0 && distance <= maxDistance;
    }

    // Package size validation
    static isValidPackageSize(size) {
        const validSizes = ['small', 'medium', 'large'];
        return validSizes.includes(size);
    }

    /**
     * Extract city name from Polish address string
     *
     * Handles various Polish address formats:
     * - "ul. Długa 123, 80-001 Gdańsk" → "gdansk"
     * - "Kraków, ul. Floriańska 1" → "krakow"
     * - "Marszałkowska 45, Warszawa" → "warszawa"
     * - "31-001 Kraków, Floriańska" → "krakow"
     * - "Długa 1, Gdańsk" → "gdansk"
     * - "Gdańsk, Długa" → "gdansk"
     *
     * @param {string} address - Full address string
     * @returns {string|null} Normalized city name or null if not found
     *
     * @example
     * extractCityFromAddress('ul. Długa 1, Gdańsk') // → 'gdansk'
     * extractCityFromAddress('Kraków, ul. Floriańska 1') // → 'krakow'
     * extractCityFromAddress('31-001 Kraków, Floriańska') // → 'krakow'
     * extractCityFromAddress('ul. Długa 1') // → null
     * extractCityFromAddress('') // → null
     */
    static extractCityFromAddress(address) {
        if (!address || typeof address !== 'string') {
            return null;
        }

        const trimmedAddress = address.trim();
        if (!trimmedAddress) {
            return null;
        }

        // Common Polish city names for validation (most frequent ones)
        const commonCities = [
            'warszawa', 'krakow', 'lodz', 'wroclaw', 'poznan', 'gdansk', 'szczecin',
            'bydgoszcz', 'lublin', 'katowice', 'bialystok', 'gdynia', 'czestochowa',
            'radom', 'sosnowiec', 'torun', 'kielce', 'gliwice', 'zabrze', 'bytom',
            'olsztyn', 'bielsko-biala', 'rzeszow', 'ruda', 'rybnik', 'tychy', 'opole',
            'gorzow', 'elblag', 'walbrzych', 'plock', 'tarnow', 'chorzow', 'koszalin',
            'kalisz', 'legnica', 'grudziadz', 'slupsk', 'jaworzno', 'sopot'
        ];

        // Polish voivodeships/provinces to filter out (not cities)
        const polishVoivodeships = [
            'pomorskie', 'mazowieckie', 'malopolskie', 'dolnoslaskie', 'wielkopolskie',
            'zachodniopomorskie', 'lubelskie', 'lodzkie', 'slaskie', 'podkarpackie',
            'kujawsko-pomorskie', 'warminsko-mazurskie', 'swietokrzyskie', 'podlaskie',
            'opolskie', 'lubuskie'
        ];

        // Patterns to match different Polish address formats
        // Order matters: more specific patterns first, fallback last
        const patterns = [
            { regex: /,\s*([^,]+?),\s*[^,]+?,\s*\d{2}-\d{3}/, type: 'specific' }, // "Street, City, Voivodeship, Postal, Country"
            { regex: /,\s*\d{2}-\d{3}\s+([^,]+)$/, type: 'specific' },           // ", 00-000 City" at end
            { regex: /^\d{2}-\d{3}\s+([^,]+?),/, type: 'specific' },             // "00-000 City," at start
            { regex: /^([^,]+?),\s*ul\./, type: 'specific' },                    // "City, ul." at start
            { regex: /^([^,]+?),\s*\d/, type: 'specific' },                      // "City, [number/street]" at start
            { regex: /\d{2}-\d{3}\s+([^,]+)/, type: 'specific' },                // "00-000 City" anywhere
            { regex: /^([^,]+),/, type: 'fallback' },                            // "City," at start (needs validation)
            { regex: /,\s*([^,\d]+)$/, type: 'specific' }                        // ", City" at end (no digits) - last resort
        ];

        for (const pattern of patterns) {
            const match = trimmedAddress.match(pattern.regex);
            if (match && match[1]) {
                let cityName = match[1].trim();

                // Remove any remaining postal codes
                cityName = cityName.replace(/\d{2}-\d{3}\s*/g, '');

                // Remove common street prefixes if they slipped through
                cityName = cityName.replace(/^(ul\.|ulica|al\.|aleja|plac|os\.|osiedle)\s+/i, '');

                // Clean up whitespace
                cityName = cityName.trim();

                // Normalize city name
                const normalized = this.normalizeCityName(cityName);

                // Filter out "Polska" (Poland), voivodeships, and powiat names - not cities
                if (normalized === 'polska' ||
                    normalized === 'poland' ||
                    polishVoivodeships.includes(normalized) ||
                    normalized.startsWith('powiat ')) {
                    continue; // Skip this match, try next pattern
                }

                // Validate that we have a meaningful city name (not just numbers or too short)
                if (cityName && cityName.length >= 3 && !/^\d+$/.test(cityName)) {
                    // For fallback patterns, validate it's a known city
                    // This prevents matching street names as cities
                    if (pattern.type === 'fallback') {
                        // Check if this looks like a known city
                        if (commonCities.includes(normalized)) {
                            return normalized;
                        }
                        // Continue to next pattern
                        continue;
                    }

                    return normalized;
                }
            }
        }

        return null;
    }

    /**
     * Normalize Polish city name to lowercase ID without diacritics
     *
     * Converts Polish characters to ASCII equivalents:
     * ą→a, ć→c, ę→e, ł→l, ń→n, ó→o, ś→s, ź→z, ż→z
     *
     * @param {string} cityName - City name to normalize
     * @returns {string} Normalized city name (lowercase, no diacritics)
     *
     * @example
     * normalizeCityName('Gdańsk') // → 'gdansk'
     * normalizeCityName('KRAKÓW') // → 'krakow'
     * normalizeCityName('Łódź') // → 'lodz'
     * normalizeCityName('  Wrocław  ') // → 'wroclaw'
     */
    static normalizeCityName(cityName) {
        if (!cityName || typeof cityName !== 'string') {
            return '';
        }

        const polishChars = {
            'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
            'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
            'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
            'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z'
        };

        let normalized = cityName.trim().toLowerCase();

        // Replace Polish characters
        for (const [polish, ascii] of Object.entries(polishChars)) {
            normalized = normalized.replace(new RegExp(polish, 'g'), ascii);
        }

        return normalized;
    }

    /**
     * Check if address contains a supported city
     *
     * @param {string} address - Full address to check
     * @param {string[]|null} supportedCityIds - Array of normalized city IDs (e.g., ['gdansk', 'krakow'])
     *                                           If null, must be provided by caller or imported from cities.config.js
     * @returns {boolean} True if city is supported, false otherwise
     *
     * @example
     * isSupportedCity('ul. Długa 1, Gdańsk', ['gdansk', 'warszawa']) // → true
     * isSupportedCity('ul. Floriańska 1, Kraków', ['gdansk', 'warszawa']) // → false
     * isSupportedCity('ul. Długa 1', ['gdansk']) // → false (no city found)
     */
    static isSupportedCity(address, supportedCityIds = null) {
        if (!supportedCityIds || !Array.isArray(supportedCityIds)) {
            // TODO: Once cities.config.js is created, import ALL_CITY_IDS here
            // For now, return false if no supported cities provided
            return false;
        }

        const extractedCity = this.extractCityFromAddress(address);

        if (!extractedCity) {
            return false;
        }

        // Check if extracted city is in the supported list
        return supportedCityIds.includes(extractedCity);
    }

    /**
     * Check if delivery is allowed between two cities
     *
     * Cities are compatible if:
     * 1. They are the same city, OR
     * 2. They belong to the same city group (e.g., both in Trójmiasto)
     *
     * @param {string} pickupCity - Normalized city ID (e.g., 'gdansk')
     * @param {string} deliveryCity - Normalized city ID (e.g., 'gdynia')
     * @param {Object|null} cityGroupsConfig - CITY_GROUPS configuration object from cities.config.js
     *                                         Structure: { groupName: ['city1', 'city2', ...], ... }
     * @returns {boolean} True if cities are compatible for delivery, false otherwise
     *
     * @example
     * areCitiesCompatible('gdansk', 'gdynia', { trojmiasto: ['gdansk', 'gdynia', 'sopot'] }) // → true
     * areCitiesCompatible('krakow', 'krakow', {}) // → true (same city)
     * areCitiesCompatible('krakow', 'gdansk', {}) // → false (different groups)
     * areCitiesCompatible('katowice', 'sosnowiec', { katowice_metro: ['katowice', 'sosnowiec'] }) // → true
     */
    static areCitiesCompatible(pickupCity, deliveryCity, cityGroupsConfig = null) {
        if (!pickupCity || !deliveryCity) {
            return false;
        }

        // Same city is always compatible
        if (pickupCity === deliveryCity) {
            return true;
        }

        // If no city groups config provided, different cities are not compatible
        if (!cityGroupsConfig || typeof cityGroupsConfig !== 'object') {
            // TODO: Once cities.config.js is created, import CITY_GROUPS here
            return false;
        }

        // Check if both cities are in the same group
        for (const groupCities of Object.values(cityGroupsConfig)) {
            if (Array.isArray(groupCities) &&
                groupCities.includes(pickupCity) &&
                groupCities.includes(deliveryCity)) {
                return true;
            }
        }

        return false;
    }

    // Legacy city validation (maintained for backward compatibility)
    // Use extractCityFromAddress() and normalizeCityName() for new code
    static isSupportedCityLegacy(address, supportedCities) {
        const addressLower = address.toLowerCase();
        return supportedCities.some(city =>
            addressLower.includes(city.toLowerCase())
        );
    }

    // Validate contact form data
    static validateContactForm(data) {
        const errors = [];

        // Sender validation
        if (!this.isRequired(data.senderName)) {
            errors.push('Imię nadawcy jest wymagane');
        }
        if (!this.isRequired(data.senderPhone)) {
            errors.push('Telefon nadawcy jest wymagany');
        } else if (!this.isValidPhone(data.senderPhone)) {
            errors.push('Nieprawidłowy format telefonu nadawcy');
        }
        if (!this.isRequired(data.senderEmail)) {
            errors.push('Email nadawcy jest wymagany');
        } else if (!this.isValidEmail(data.senderEmail)) {
            errors.push('Nieprawidłowy format email nadawcy');
        }

        // Recipient validation
        if (!this.isRequired(data.recipientName)) {
            errors.push('Imię odbiorcy jest wymagane');
        }
        if (!this.isRequired(data.recipientPhone)) {
            errors.push('Telefon odbiorcy jest wymagany');
        } else if (!this.isValidPhone(data.recipientPhone)) {
            errors.push('Nieprawidłowy format telefonu odbiorcy');
        }
        if (!this.isRequired(data.recipientEmail)) {
            errors.push('Email odbiorcy jest wymagany');
        } else if (!this.isValidEmail(data.recipientEmail)) {
            errors.push('Nieprawidłowy format email odbiorcy');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate address form
    static validateAddresses(pickupAddress, deliveryAddress) {
        const errors = [];

        if (!this.isRequired(pickupAddress)) {
            errors.push('Adres odbioru jest wymagany');
        } else if (!this.isValidAddress(pickupAddress)) {
            errors.push('Adres odbioru jest nieprawidłowy');
        }

        if (!this.isRequired(deliveryAddress)) {
            errors.push('Adres dostawy jest wymagany');
        } else if (!this.isValidAddress(deliveryAddress)) {
            errors.push('Adres dostawy jest nieprawidłowy');
        }

        if (pickupAddress === deliveryAddress) {
            errors.push('Adresy odbioru i dostawy muszą być różne');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format phone number
    static formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 9) {
            return `${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`;
        }
        return phone;
    }

    // Clean and format input
    static sanitizeInput(input) {
        return input.toString().trim().replace(/[<>]/g, '');
    }
}