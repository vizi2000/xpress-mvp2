// Order management service
import { ApiConfig } from '../config/api.config.js';
import { Validators } from '../utils/Validators.js';
import { RevolutPaymentService } from './RevolutPaymentService.js';

export class OrderService {
    constructor() {
        this.config = ApiConfig.xpress;
        this.revolutService = new RevolutPaymentService();
        this.packageTypes = {
            small: { name: 'Mała paczka', multiplier: 1.0 },
            medium: { name: 'Średnia paczka', multiplier: 1.3 },
            large: { name: 'Duża paczka', multiplier: 1.8 }
        };
    }

    // Validate contact data
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

        // Phone validation for sender
        if (!Validators.isValidPhone(contactData.senderPhone)) {
            throw new Error('Nieprawidłowy format telefonu nadawcy. Wymagany format: +48 XXX XXX XXX lub XXX XXX XXX');
        }

        // Phone validation for recipient
        if (!Validators.isValidPhone(contactData.recipientPhone)) {
            throw new Error('Nieprawidłowy format telefonu odbiorcy. Wymagany format: +48 XXX XXX XXX lub XXX XXX XXX');
        }

        return true;
    }

    // Get field labels for validation messages
    getFieldLabel(field) {
        const labels = {
            senderName: 'Imię nadawcy',
            senderPhone: 'Telefon nadawcy',
            senderEmail: 'Email nadawcy',
            recipientName: 'Imię odbiorcy',
            recipientPhone: 'Telefon odbiorcy',
            recipientEmail: 'Email odbiorcy'
        };
        return labels[field] || field;
    }

    // Generate order number
    generateOrderNumber() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `XPR-${year}-${random}`;
    }

    // Create order in Xpress.Delivery system (API call) - DEPRECATED
    // This method is deprecated - use XpressDeliveryService.createOrder() instead
    async createXpressOrder(orderData) {
        console.warn('⚠️ OrderService.createXpressOrder() is deprecated - use XpressDeliveryService.createOrder()');
        
        const orderPayload = {
            pickup: {
                address: orderData.pickup,
                contact: {
                    name: orderData.contact.senderName,
                    phone: orderData.contact.senderPhone,
                    email: orderData.contact.senderEmail
                }
            },
            delivery: {
                address: orderData.delivery,
                contact: {
                    name: orderData.contact.recipientName,
                    phone: orderData.contact.recipientPhone,
                    email: orderData.contact.recipientEmail
                }
            },
            package: {
                size: orderData.selectedPackage,
                description: this.packageTypes[orderData.selectedPackage].name
            },
            pricing: {
                total: parseFloat(orderData.prices[orderData.selectedPackage]),
                currency: 'PLN'
            }
        };
        
        const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.orders}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.auth.apiKey}`
            },
            body: JSON.stringify(orderPayload)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create order in Xpress.Delivery system');
        }
        
        return await response.json();
    }

    // Generate MongoDB-compatible ObjectId for mock orders
    // Format: 24 hex characters (12 bytes)
    // Structure: timestamp(4) + machine(3) + pid(2) + counter(3)
    generateMockObjectId() {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const randomPart = Array.from({length: 16}, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');

        const objectId = timestamp + randomPart;

        console.log('🔧 Generated mock ObjectId:', objectId);
        return objectId;
    }

    // Mock order creation for development
    createMockOrder(orderData) {
        return {
            id: this.generateMockObjectId(),
            orderNumber: this.generateOrderNumber(),
            status: 'confirmed',
            estimatedDelivery: orderData.timeEstimate
        };
    }

    // Process payment (simplified)
    async processPayment(orderData) {
        try {
            // Check if Revolut is configured and not in mock mode
            const useMockPayment = !ApiConfig.revolut?.apiKey ||
                                   ApiConfig.revolut.apiKey === 'YOUR_REVOLUT_MERCHANT_API_KEY';

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

    // Get package type info
    getPackageInfo(packageSize) {
        return this.packageTypes[packageSize] || this.packageTypes.small;
    }

    // Format address for display
    formatAddress(address, maxLength = 25) {
        if (address.length > maxLength) {
            return address.substring(0, maxLength) + '...';
        }
        return address;
    }
}