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

    // City validation
    static isSupportedCity(address, supportedCities) {
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