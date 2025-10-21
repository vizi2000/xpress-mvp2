// Main Xpress Delivery Application
import { GoogleMapsService } from '../services/GoogleMapsService.js';
import { PricingService } from '../services/PricingService.js';
import { OrderService } from '../services/OrderService.js';
import { XpressDeliveryService } from '../services/XpressDeliveryService.js';
import { AddressForm } from './AddressForm.js';
import { PriceCalculator } from './PriceCalculator.js';
import { OrderStatus } from './OrderStatus.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import { Validators } from '../utils/Validators.js';
import { AppConfig } from '../config/app.config.js';

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
        
        // Check if Google Maps is already loaded
        this.checkGoogleMapsReady();
    }
    
    // Check if Google Maps is ready and initialize if so
    checkGoogleMapsReady() {
        if (window.googleMapsReady && window.google && window.google.maps) {
            console.log('✅ Google Maps already loaded - initializing autocomplete');
            this.googleMapsService.initializeAutocomplete();
        } else {
            console.log('⏳ Waiting for Google Maps to load...');
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
    async handleAddressChange(pickup, delivery) {
        this.orderData.pickup = pickup;
        this.orderData.delivery = delivery;

        await this.priceCalculator.calculatePrice(pickup, delivery);

        // Update order data with calculation results
        const lastCalculation = this.priceCalculator.getLastCalculation();
        if (lastCalculation) {
            this.orderData.distance = lastCalculation.distance;
            this.orderData.timeEstimate = lastCalculation.timeEstimate;
            this.orderData.prices = lastCalculation.prices;

            // Save coordinates for order creation
            this.orderData.pickupCoords = lastCalculation.pickupCoords;
            this.orderData.deliveryCoords = lastCalculation.deliveryCoords;
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
}

// Initialize app when script loads
const app = new XpressApp();

// Store app reference for debugging and Google Maps callback
window.xpressApp = app;