// Main Xpress Delivery Application
import { GoogleMapsService } from '../services/GoogleMapsService.js';
import { PricingService } from '../services/PricingService.js';
import { OrderService } from '../services/OrderService.js';
import { XpressDeliveryService } from '../services/XpressDeliveryService.js';
import { AddressForm } from './AddressForm.js';
import { PriceCalculator } from './PriceCalculator.js';
import { OrderStatus } from './OrderStatus.js';
import { RouteMap } from './RouteMap.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import { Validators } from '../utils/Validators.js';
import { AppConfig } from '../config/app.config.js';
import { ArrowBackground } from './ArrowBackground.js';
import { OpenRouterClient } from '../ai/OpenRouterClient.js';
import { ChatAgent } from '../ai/ChatAgent.js';
import { ChatUI } from '../ai/ChatUI.js';

export class XpressApp {
    constructor() {
        // Store config reference for services
        this.config = AppConfig;
        
        // Initialize services
        this.googleMapsService = new GoogleMapsService();
        this.pricingService = new PricingService();
        this.orderService = new OrderService();
        this.xpressDeliveryService = new XpressDeliveryService();
        
        // Initialize components
        this.addressForm = null;
        this.priceCalculator = null;
        this.orderStatus = null;
        this.routeMap = null;
        this.arrowBackground = null;
        this.chatAgent = null;
        this.chatUI = null;
        
        // Application state
        this.orderData = {
            pickup: '',
            delivery: '',
            distance: 0,
            timeEstimate: '',
            selectedPackage: null,
            prices: {},
            contact: null,
            orderNumber: null,
            // Store coordinates for API
            pickupCoords: null,
            deliveryCoords: null
        };
        
        this.init();
    }

    // Initialize application
    init() {
        console.log('🚀 XpressApp initializing...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM Content Loaded');
            this.initializeComponents();
            this.setupEventListeners();
            this.setupDevelopmentHelpers();
            console.log('✅ XpressApp initialized');
        });
    }

    // Initialize components
    initializeComponents() {
        // Initialize arrow background animation
        this.arrowBackground = new ArrowBackground('arrow-background');

        // Initialize address form
        this.addressForm = new AddressForm(
            this.googleMapsService,
            (pickup, delivery) => this.handleAddressChange(pickup, delivery)
        );

        // Initialize price calculator
        this.priceCalculator = new PriceCalculator(
            this.googleMapsService,
            this.pricingService,
            this.config
        );

        // Initialize order status component
        this.orderStatus = new OrderStatus(this.xpressDeliveryService);

        // Initialize route map component
        this.routeMap = new RouteMap('route-map');
        this.routeMap.initialize();

        // Initialize AI Chat if API key is available
        const apiKey = window.CONFIG_LOCAL?.openrouter?.apiKey;
        if (apiKey && !apiKey.startsWith('__')) {
            try {
                this.chatAgent = new ChatAgent(apiKey);
                this.chatUI = new ChatUI(this.chatAgent);
                console.log('✅ AI Chat initialized');
            } catch (error) {
                console.warn('⚠️ AI Chat initialization failed:', error.message);
            }
        } else {
            console.log('ℹ️ AI Chat disabled - no API key configured');
        }

        // Initialize autocomplete (LocationIQ or Google Maps)
        // LocationIQ is ready immediately, no need to wait for script loading
        console.log('🗺️ Initializing autocomplete service...');
        this.googleMapsService.initializeAutocomplete();
    }

    // Check if Google Maps is ready and initialize if so (DEPRECATED - using LocationIQ)
    checkGoogleMapsReady() {
        if (window.googleMapsReady && window.google && window.google.maps) {
            console.log('✅ Google Maps already loaded - initializing autocomplete');
            this.googleMapsService.initializeAutocomplete();
        } else {
            console.log('⏳ Google Maps not needed - using LocationIQ');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handlePayment(e));
        }

        // Package selection buttons
        document.querySelectorAll('.package-option').forEach(option => {
            option.addEventListener('click', () => {
                const size = option.getAttribute('data-size');
                this.selectPackage(size);
            });
        });

        // New order button
        const newOrderBtn = document.querySelector('.btn-new-order');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => this.startNewOrder());
        }
    }

    // Handle address change
    async handleAddressChange(pickup, delivery, skipCityValidation = false) {
        console.log('🧮 HANDLE ADDRESS CHANGE:', { pickup, delivery, skipCityValidation });

        this.orderData.pickup = pickup;
        this.orderData.delivery = delivery;

        // Get cached coordinates from autocomplete (if available)
        const cachedCoords = this.addressForm.getCachedCoordinates();
        console.log('📍 Cached coordinates from autocomplete:', cachedCoords);

        await this.priceCalculator.calculatePrice(pickup, delivery, cachedCoords, skipCityValidation);

        // Update order data with calculation results
        const lastCalculation = this.priceCalculator.getLastCalculation();
        console.log('🧮 Last calculation result:', lastCalculation);

        if (lastCalculation) {
            this.orderData.distance = lastCalculation.distance;
            this.orderData.timeEstimate = lastCalculation.timeEstimate;
            this.orderData.prices = lastCalculation.prices;

            // Save coordinates for order creation
            this.orderData.pickupCoords = lastCalculation.pickupCoords;
            this.orderData.deliveryCoords = lastCalculation.deliveryCoords;

            console.log('🧮 Coordinates saved:', {
                pickup: this.orderData.pickupCoords,
                delivery: this.orderData.deliveryCoords
            });

            // Draw route on map if coordinates are available
            if (this.orderData.pickupCoords && this.orderData.deliveryCoords) {
                console.log('🧮 Drawing route on map...');
                await this.routeMap.drawRoute(
                    this.orderData.pickupCoords,
                    this.orderData.deliveryCoords
                );
                this.routeMap.show();
            } else {
                console.warn('⚠️ Cannot draw route - missing coordinates');
            }
        } else {
            console.warn('⚠️ No calculation result available');
        }
    }

    // Select package size
    selectPackage(size) {
        this.orderData.selectedPackage = size;
        
        // Update UI
        this.updatePackageSelection(size);
        this.updateOrderSummary();
        this.showOrderForm();
    }

    // Update package selection UI
    updatePackageSelection(selectedSize) {
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-size="${selectedSize}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    // Update order summary
    updateOrderSummary() {
        const { selectedPackage, pickup, delivery, prices } = this.orderData;
        
        if (!selectedPackage || !prices[selectedPackage]) return;
        
        const packageInfo = this.orderService.getPackageInfo(selectedPackage);
        const shortPickup = this.orderService.formatAddress(pickup);
        const shortDelivery = this.orderService.formatAddress(delivery);
        
        UIHelpers.updateText('summary-package', packageInfo.name);
        UIHelpers.updateText('summary-route', `${shortPickup} → ${shortDelivery}`);
        UIHelpers.updateText('summary-price', `${prices[selectedPackage]} zł`);
        UIHelpers.updateText('final-price', `${prices[selectedPackage]} zł`);
        UIHelpers.updateText('pay-price', `${prices[selectedPackage]} zł`);
    }

    // Show order form
    showOrderForm() {
        UIHelpers.toggleElement('order-form-section', true);
        UIHelpers.scrollToElement('order-form-section');
    }

    // Handle payment submission
    async handlePayment(e) {
        e.preventDefault();
        
        try {
            // Get contact data
            const contactData = UIHelpers.getFormData('contact-form');
            
            // Validate contact data
            const validation = this.orderService.validateContactData(contactData);
            if (!validation) return;
            
            // Store contact data
            this.orderData.contact = contactData;
            
            // Process payment
            UIHelpers.showLoading('Przetwarzam płatność...');
            
            // Always create real orders via API, but keep payment processing mocked
            await this.processOrderWithMockPayment();
            
        } catch (error) {
            console.error('Payment error:', error);
            UIHelpers.hideLoading();
            UIHelpers.showError('Błąd podczas przetwarzania płatności. Spróbuj ponownie.');
        }
    }

    // Process order with real API but mock payment
    async processOrderWithMockPayment() {
        try {
            // Create order with real Xpress.Delivery API
            const order = await this.xpressDeliveryService.createOrder(this.orderData);
            this.orderData.orderNumber = order.orderNumber;
            this.orderData.orderId = order.orderId;
            this.orderData.verificationCode = order.verificationCode;
            this.orderData.externalId = order.externalId;
            
            console.log('✅ Real Xpress.Delivery order created:', order);
            
            // Process payment (mocked for MVP)
            await new Promise(resolve => setTimeout(resolve, 2000));
            const payment = await this.orderService.processPayment(this.orderData);
            
            if (payment.success) {
                await this.processSuccessfulPayment();
            } else {
                throw new Error('Payment failed');
            }
        } catch (error) {
            console.warn('⚠️ Real API failed, falling back to mock order creation:', error.message);
            
            // Fallback to mock order creation if API fails
            const mockOrder = await this.orderService.createMockOrder(this.orderData);
            this.orderData.orderNumber = mockOrder.orderNumber;
            this.orderData.orderId = mockOrder.id;
            
            // Process payment (mocked)
            await new Promise(resolve => setTimeout(resolve, 2000));
            const payment = await this.orderService.processPayment(this.orderData);
            
            if (payment.success) {
                await this.processSuccessfulPayment();
            } else {
                throw new Error('Payment failed');
            }
        }
    }


    // Process successful payment
    async processSuccessfulPayment() {
        // Generate order number if not already set
        if (!this.orderData.orderNumber) {
            this.orderData.orderNumber = this.orderService.generateOrderNumber();
        }
        
        // Update thank you page
        this.updateThankYouPage();
        
        UIHelpers.hideLoading();
        this.showThankYouPage();
        
        // Mock confirmation
        setTimeout(() => {
            console.log('Wysłano potwierdzenie na:', this.orderData.contact.senderEmail);
            console.log('Wysłano SMS na:', this.orderData.contact.senderPhone);
        }, 1000);
    }

    // Update thank you page with order details
    updateThankYouPage() {
        const { orderNumber, pickup, delivery, selectedPackage, prices, timeEstimate } = this.orderData;
        const packageInfo = this.orderService.getPackageInfo(selectedPackage);
        
        UIHelpers.updateText('final-order-number', orderNumber);
        UIHelpers.updateText('final-route', `${this.orderService.formatAddress(pickup)} → ${this.orderService.formatAddress(delivery)}`);
        UIHelpers.updateText('final-package', packageInfo.name);
        UIHelpers.updateText('final-cost', `${prices[selectedPackage]} zł`);
        UIHelpers.updateText('final-time', `${timeEstimate} min`);
    }

    // Show thank you page
    showThankYouPage() {
        UIHelpers.toggleClass('main-page', 'active', false);
        UIHelpers.toggleClass('thank-you-page', 'active', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Start tracking order status
        this.orderStatus.initializeFromOrderData(this.orderData);
    }

    // Start new order
    startNewOrder() {
        // Stop tracking previous order
        this.orderStatus.stopTracking();

        // Reset order data
        this.orderData = {
            pickup: '',
            delivery: '',
            distance: 0,
            timeEstimate: '',
            selectedPackage: null,
            prices: {},
            contact: null,
            orderNumber: null,
            // Reset coordinates
            pickupCoords: null,
            deliveryCoords: null
        };

        // Reset UI
        this.addressForm.clearAddresses();
        UIHelpers.clearForm('contact-form');

        // Remove package selections
        document.querySelectorAll('.package-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Hide sections
        UIHelpers.toggleElement('results-section', false);
        UIHelpers.toggleElement('order-form-section', false);

        // Hide and clear route map
        if (this.routeMap) {
            this.routeMap.hide();
            this.routeMap.clearRoute();
        }

        // Reset chat history for new order
        if (this.chatAgent) {
            this.chatAgent.reset();
        }

        // Show main page
        UIHelpers.toggleClass('thank-you-page', 'active', false);
        UIHelpers.toggleClass('main-page', 'active', true);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Setup development helpers
    setupDevelopmentHelpers() {
        if (this.config.development.showTestButton && this.isDevelopment()) {
            this.createTestButton();
        }
    }

    // Check if running in development
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }

    // Create test button for development
    createTestButton() {
        const testBtn = UIHelpers.createElement('button', '', '🧪');
        testBtn.title = 'Wypełnij testowe dane';
        testBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1001;
            font-size: 1rem;
            width: 40px;
            height: 40px;
        `;
        testBtn.addEventListener('click', () => this.fillTestData());
        document.body.appendChild(testBtn);
    }

    // Fill test data
    fillTestData() {
        this.addressForm.fillTestData();
    }

    // Scroll to payment section (called from chat widget)
    scrollToPayment() {
        const paymentSection = document.getElementById('order-form-section');
        if (paymentSection) {
            UIHelpers.scrollToElement('order-form-section');
        }
    }

    // ============================================
    // PUBLIC API FOR CHAT INTEGRATION
    // ============================================

    /**
     * Fill address fields from chat and trigger calculation
     * @param {string} pickup - Pickup address
     * @param {string} delivery - Delivery address
     * @param {object} pickupCoords - Pickup coordinates {lat, lng}
     * @param {object} deliveryCoords - Delivery coordinates {lat, lng}
     */
    fillAddressesFromChat(pickup, delivery, pickupCoords = null, deliveryCoords = null) {
        console.log('🎯 FILL ADDRESSES CALLED:', { pickup, delivery });

        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');

        console.log('🎯 Pickup input exists?', !!pickupInput);
        console.log('🎯 Delivery input exists?', !!deliveryInput);

        if (pickupInput && pickup) {
            pickupInput.value = pickup;
            console.log('🎯 Pickup input value set to:', pickupInput.value);
            // Add visual feedback
            pickupInput.style.borderColor = '#10b981';
            pickupInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            setTimeout(() => {
                pickupInput.style.borderColor = '';
                pickupInput.style.boxShadow = '';
            }, 2000);
        }

        if (deliveryInput && delivery) {
            deliveryInput.value = delivery;
            console.log('🎯 Delivery input value set to:', deliveryInput.value);
            // Add visual feedback
            deliveryInput.style.borderColor = '#10b981';
            deliveryInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            setTimeout(() => {
                deliveryInput.style.borderColor = '';
                deliveryInput.style.boxShadow = '';
            }, 2000);
        }

        // Store coordinates in orderData if provided
        if (pickupCoords) {
            this.orderData.pickupCoords = pickupCoords;
            console.log('✅ Stored pickup coordinates:', pickupCoords);
        }
        if (deliveryCoords) {
            this.orderData.deliveryCoords = deliveryCoords;
            console.log('✅ Stored delivery coordinates:', deliveryCoords);
        }

        // Trigger address change to calculate route
        // Skip city validation since chat may provide partial addresses (without city name)
        if (pickup && delivery) {
            console.log('🎯 Triggering handleAddressChange...');
            this.handleAddressChange(pickup, delivery, true); // Skip city validation for chat addresses

            // If we have coordinates, draw the route immediately
            if (pickupCoords && deliveryCoords && this.routeMap) {
                console.log('🗺️ Drawing route with coordinates from chat...');
                this.routeMap.drawRoute(pickupCoords, deliveryCoords).then(() => {
                    this.routeMap.show();
                    console.log('✅ Map displayed with route');
                }).catch(err => {
                    console.error('❌ Failed to draw route:', err);
                });
            }

            // Scroll to results after a brief delay
            setTimeout(() => {
                this.scrollToResults();
            }, 500);
        } else {
            console.warn('⚠️ Cannot trigger handleAddressChange - missing pickup or delivery');
        }
    }

    /**
     * Select package size from chat
     * @param {string} size - Package size: 'small', 'medium', or 'large'
     */
    selectPackageFromChat(size) {
        console.log('📦 Chat selecting package:', size);

        const packageOption = document.querySelector(`[data-size="${size}"]`);
        if (!packageOption) {
            console.error('Package option not found:', size);
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.package-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Select this option
        packageOption.classList.add('selected');

        // Add visual feedback
        packageOption.style.transform = 'scale(1.05)';
        packageOption.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            packageOption.style.transform = '';
        }, 500);

        // Update order data
        this.orderData.selectedPackage = size;

        // Trigger order button click after a brief delay
        setTimeout(() => {
            const orderBtn = packageOption.querySelector('.order-btn');
            if (orderBtn) {
                orderBtn.click();

                // Scroll to order form
                setTimeout(() => {
                    this.scrollToOrderForm();
                }, 500);
            }
        }, 300);
    }

    /**
     * Scroll to results section (prices)
     */
    scrollToResults() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection && resultsSection.style.display !== 'none') {
            console.log('📜 Scrolling to results section');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Scroll to order form
     */
    scrollToOrderForm() {
        const orderFormSection = document.getElementById('order-form-section');
        if (orderFormSection && orderFormSection.style.display !== 'none') {
            console.log('📜 Scrolling to order form');
            orderFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Get current order state (for chat)
     * @returns {Object} Current order data
     */
    getOrderState() {
        return {
            pickup: this.orderData.pickup,
            delivery: this.orderData.delivery,
            distance: this.orderData.distance,
            selectedPackage: this.orderData.selectedPackage,
            prices: this.orderData.prices
        };
    }
}

// Initialize app when script loads
const app = new XpressApp();

// Make app globally available for chat integration and debugging
window.xpressApp = app;