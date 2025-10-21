// Address Form Component
import { UIHelpers } from '../utils/UIHelpers.js';
import { Validators } from '../utils/Validators.js';

export class AddressForm {
    constructor(googleMapsService, onAddressChange) {
        this.googleMapsService = googleMapsService;
        this.onAddressChange = onAddressChange;
        this.calculateTimeout = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Set callback for Google Maps service
        this.googleMapsService.onAddressSelected = () => this.handleAddressChange();
    }

    setupEventListeners() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');

        if (pickupInput && deliveryInput) {
            pickupInput.addEventListener('input', () => this.handleAddressChange());
            deliveryInput.addEventListener('input', () => this.handleAddressChange());
        }
    }

    handleAddressChange() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        const pickup = pickupInput.value.trim();
        const delivery = deliveryInput.value.trim();
        
        // Clear previous timeout
        if (this.calculateTimeout) {
            clearTimeout(this.calculateTimeout);
        }
        
        // Validate addresses
        const validation = Validators.validateAddresses(pickup, delivery);
        
        if (validation.isValid && pickup !== delivery && pickup.length > 10 && delivery.length > 10) {
            // Calculate after short delay to avoid too many API calls
            this.calculateTimeout = setTimeout(() => {
                this.onAddressChange(pickup, delivery);
            }, 800);
        } else {
            // Hide results if addresses are incomplete or invalid
            UIHelpers.toggleElement('results-section', false);
        }
    }

    // Get current addresses
    getAddresses() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        return {
            pickup: pickupInput ? pickupInput.value.trim() : '',
            delivery: deliveryInput ? deliveryInput.value.trim() : ''
        };
    }

    // Set addresses (useful for testing)
    setAddresses(pickup, delivery) {
        UIHelpers.updateHTML('pickup-address', '');
        UIHelpers.updateHTML('delivery-address', '');
        
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.value = pickup;
        if (deliveryInput) deliveryInput.value = delivery;
        
        this.handleAddressChange();
    }

    // Clear addresses
    clearAddresses() {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.value = '';
        if (deliveryInput) deliveryInput.value = '';
        
        UIHelpers.toggleElement('results-section', false);
    }

    // Validate current addresses
    validateCurrentAddresses() {
        const addresses = this.getAddresses();
        return Validators.validateAddresses(addresses.pickup, addresses.delivery);
    }

    // Show address validation errors
    showValidationErrors(errors) {
        const errorMessage = errors.join('\n');
        UIHelpers.showError(errorMessage);
    }

    // Enable/disable address inputs
    setEnabled(enabled) {
        const pickupInput = document.getElementById('pickup-address');
        const deliveryInput = document.getElementById('delivery-address');
        
        if (pickupInput) pickupInput.disabled = !enabled;
        if (deliveryInput) deliveryInput.disabled = !enabled;
    }

    // Fill test data for development
    fillTestData() {
        this.setAddresses(
            'ul. Krakowska 123, Warszawa',
            'ul. Marszałkowska 45, Warszawa'
        );
    }
}