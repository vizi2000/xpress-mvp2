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
