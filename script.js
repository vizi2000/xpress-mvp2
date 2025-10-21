// Global state
let orderData = {
    pickup: '',
    delivery: '',
    distance: 0,
    timeEstimate: '',
    selectedPackage: null,
    prices: {}
};

// Package pricing
const packageTypes = {
    small: { name: 'Mała paczka', multiplier: 1.0 },
    medium: { name: 'Średnia paczka', multiplier: 1.3 },
    large: { name: 'Duża paczka', multiplier: 1.8 }
};

let calculateTimeout = null;

// Google Maps global variables
let pickupAutocomplete;
let deliveryAutocomplete;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupAddressInputs();
    setupContactForm();
});

// Google Maps initialization callback
function initGoogleMaps() {
    console.log('Google Maps API loaded, initializing autocomplete...');
    setupGooglePlacesAutocomplete();
}

// Setup Google Places Autocomplete
function setupGooglePlacesAutocomplete() {
    const pickupInput = document.getElementById('pickup-address');
    const deliveryInput = document.getElementById('delivery-address');
    
    if (!pickupInput || !deliveryInput) {
        console.error('Address inputs not found');
        return;
    }
    
    // Configure autocomplete options for Poland/Warsaw
    const options = {
        componentRestrictions: { country: 'pl' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address']
    };
    
    // Initialize autocomplete for pickup address
    pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
    pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        if (place.formatted_address) {
            pickupInput.value = place.formatted_address;
            checkBothAddressesAndCalculate();
        }
    });
    
    // Initialize autocomplete for delivery address
    deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInput, options);
    deliveryAutocomplete.addListener('place_changed', () => {
        const place = deliveryAutocomplete.getPlace();
        if (place.formatted_address) {
            deliveryInput.value = place.formatted_address;
            checkBothAddressesAndCalculate();
        }
    });
    
    console.log('Google Places Autocomplete initialized');
}

// Check if both addresses are filled and calculate price
function checkBothAddressesAndCalculate() {
    const pickupInput = document.getElementById('pickup-address');
    const deliveryInput = document.getElementById('delivery-address');
    
    const pickup = pickupInput.value.trim();
    const delivery = deliveryInput.value.trim();
    
    if (pickup && delivery && pickup !== delivery && pickup.length > 10 && delivery.length > 10) {
        // Clear any existing timeout
        if (calculateTimeout) {
            clearTimeout(calculateTimeout);
        }
        
        // Calculate immediately when address is selected from autocomplete
        calculateTimeout = setTimeout(() => {
            calculateInstantPrice(pickup, delivery);
        }, 300);
    }
}

// Setup address inputs with instant calculation
function setupAddressInputs() {
    const pickupInput = document.getElementById('pickup-address');
    const deliveryInput = document.getElementById('delivery-address');

    // Calculate instantly when both addresses are filled
    function onAddressChange() {
        const pickup = pickupInput.value.trim();
        const delivery = deliveryInput.value.trim();
        
        // Clear previous timeout
        if (calculateTimeout) {
            clearTimeout(calculateTimeout);
        }
        
        // If both addresses filled and different, calculate after short delay
        if (pickup && delivery && pickup !== delivery && pickup.length > 10 && delivery.length > 10) {
            calculateTimeout = setTimeout(() => {
                calculateInstantPrice(pickup, delivery);
            }, 800); // 800ms delay to avoid too many calculations while typing
        } else {
            // Hide results if addresses are incomplete
            document.getElementById('results-section').style.display = 'none';
        }
    }

    pickupInput.addEventListener('input', onAddressChange);
    deliveryInput.addEventListener('input', onAddressChange);
}

// Instant price calculation
async function calculateInstantPrice(pickup, delivery) {
    orderData.pickup = pickup;
    orderData.delivery = delivery;
    
    showLoading('Obliczam cenę...');
    
    try {
        // Use real API if configured, otherwise mock
        if (window.CONFIG && !window.CONFIG.development.useMockData) {
            const result = await calculateRealPrice(pickup, delivery);
            orderData.distance = result.distance;
            orderData.timeEstimate = result.timeEstimate;
            orderData.prices = result.prices;
        } else {
            // Mock calculation for development
            await new Promise(resolve => setTimeout(resolve, 600));
            const distance = Math.random() * 15 + 3; // 3-18 km
            const baseTime = Math.floor(distance * 2.5 + Math.random() * 10 + 10);
            
            orderData.distance = distance.toFixed(1);
            orderData.timeEstimate = `${baseTime}-${baseTime + 10}`;
            
            // Calculate prices using new pricing structure
            const config = window.CONFIG;
            if (config && config.app && config.app.pricing) {
                orderData.prices = calculatePricesFromDistance(distance, config.app.pricing);
            } else {
                // Fallback to old pricing if config not loaded
                const basePrice = distance * 1.8 + 15;
                orderData.prices = {
                    small: (basePrice * packageTypes.small.multiplier).toFixed(2),
                    medium: (basePrice * packageTypes.medium.multiplier).toFixed(2),
                    large: (basePrice * packageTypes.large.multiplier).toFixed(2)
                };
            }
        }
        
        hideLoading();
        showInstantResults();
    } catch (error) {
        console.error('Price calculation error:', error);
        hideLoading();
        
        // Show specific error messages
        if (error.message.includes('Usługa niedostępna') || 
            error.message.includes('usługa jest miejska') ||
            error.message.includes('Address not found')) {
            alert(error.message);
        } else {
            alert('Błąd podczas obliczania ceny. Spróbuj ponownie.');
        }
        
        // Hide results section on error
        document.getElementById('results-section').style.display = 'none';
    }
}

// Real API price calculation
async function calculateRealPrice(pickup, delivery) {
    const config = window.CONFIG;
    
    // First validate cities
    validateCitySupport(pickup, delivery);
    
    // Get coordinates using Google Maps Geocoding
    const pickupCoords = await geocodeAddress(pickup);
    const deliveryCoords = await geocodeAddress(delivery);
    
    // Calculate distance using Google Maps Distance Matrix
    const routeData = await calculateRoute(pickupCoords, deliveryCoords);
    const distanceKm = routeData.distance / 1000;
    
    // Validate distance limit
    if (distanceKm > config.app.maxDistance) {
        throw new Error(`Nasza usługa jest miejska do ${config.app.maxDistance}km. Odległość: ${distanceKm.toFixed(1)}km`);
    }
    
    // Calculate prices using new pricing structure
    const prices = calculatePricesFromDistance(distanceKm, config.app.pricing);
    
    return {
        distance: distanceKm.toFixed(1),
        timeEstimate: `${Math.floor(routeData.duration / 60)}-${Math.floor(routeData.duration / 60) + 10}`,
        prices: prices
    };
}

// Validate city support
function validateCitySupport(pickup, delivery) {
    const config = window.CONFIG;
    const supportedCities = config.app.supportedCities;
    
    const pickupSupported = supportedCities.some(city => 
        pickup.toLowerCase().includes(city.toLowerCase())
    );
    const deliverySupported = supportedCities.some(city => 
        delivery.toLowerCase().includes(city.toLowerCase())
    );
    
    if (!pickupSupported) {
        throw new Error(`Usługa niedostępna w mieście odbioru. Obsługujemy: Warszawa, Łódź, Poznań, Kraków, Wrocław, Szczecin, Trójmiasto, Katowice, Bielsko-Biała`);
    }
    if (!deliverySupported) {
        throw new Error(`Usługa niedostępna w mieście dostawy. Obsługujemy: Warszawa, Łódź, Poznań, Kraków, Wrocław, Szczecin, Trójmiasto, Katowice, Bielsko-Biała`);
    }
}

// Calculate prices from distance using new pricing structure
function calculatePricesFromDistance(distanceKm, pricingConfig) {
    const { baseDistance, basePrice, additionalKmPrice, largeMultiplier } = pricingConfig;
    
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

// Google Maps geocoding
async function geocodeAddress(address) {
    const config = window.CONFIG;
    if (!config.googleMaps.apiKey || config.googleMaps.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        throw new Error('Google Maps API key not configured');
    }
    
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleMaps.apiKey}`
    );
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
        throw new Error('Address not found');
    }
    
    return data.results[0].geometry.location;
}

// Google Maps route calculation
async function calculateRoute(origin, destination) {
    const config = window.CONFIG;
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${config.googleMaps.apiKey}`
    );
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.rows[0].elements[0].distance) {
        throw new Error('Route calculation failed');
    }
    
    return {
        distance: data.rows[0].elements[0].distance.value, // meters
        duration: data.rows[0].elements[0].duration.value  // seconds
    };
}

// Xpress.Delivery API quote
async function getXpressQuote(origin, destination, distance) {
    const config = window.CONFIG;
    if (!config.xpress.auth.apiKey || config.xpress.auth.apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Xpress.Delivery API key not configured');
    }
    
    const response = await fetch(`${config.xpress.baseUrl}${config.xpress.endpoints.quote}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.xpress.auth.apiKey}`
        },
        body: JSON.stringify({
            pickup: { lat: origin.lat, lng: origin.lng },
            delivery: { lat: destination.lat, lng: destination.lng },
            distance: distance,
            packages: ['small', 'medium', 'large']
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to get quote from Xpress.Delivery');
    }
    
    return await response.json();
}

// Show instant results
function showInstantResults() {
    // Update route display
    document.getElementById('distance-display').textContent = `${orderData.distance} km`;
    document.getElementById('time-display').textContent = `${orderData.timeEstimate} min`;
    
    // Update prices with smooth animation
    document.getElementById('price-small').textContent = `${orderData.prices.small} zł`;
    document.getElementById('price-medium').textContent = `${orderData.prices.medium} zł`;
    document.getElementById('price-large').textContent = `${orderData.prices.large} zł`;
    
    // Show results section with animation
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Select package and show order form
function selectPackage(size) {
    orderData.selectedPackage = size;
    
    // Highlight selected option
    document.querySelectorAll('.package-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-size="${size}"]`).classList.add('selected');
    
    // Update order summary
    const packageName = packageTypes[size].name;
    const shortPickup = shortenAddress(orderData.pickup);
    const shortDelivery = shortenAddress(orderData.delivery);
    
    document.getElementById('summary-package').textContent = packageName;
    document.getElementById('summary-route').textContent = `${shortPickup} → ${shortDelivery}`;
    document.getElementById('summary-price').textContent = `${orderData.prices[size]} zł`;
    document.getElementById('final-price').textContent = `${orderData.prices[size]} zł`;
    document.getElementById('pay-price').textContent = `${orderData.prices[size]} zł`;
    
    // Show order form section
    const orderSection = document.getElementById('order-form-section');
    orderSection.style.display = 'block';
    
    // Smooth scroll to form
    setTimeout(() => {
        orderSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Setup contact form
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', handlePayment);
    }
}

// Handle payment submission
async function handlePayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        senderName: formData.get('senderName'),
        senderPhone: formData.get('senderPhone'),
        senderEmail: formData.get('senderEmail'),
        recipientName: formData.get('recipientName'),
        recipientPhone: formData.get('recipientPhone'),
        recipientEmail: formData.get('recipientEmail')
    };
    
    // Quick validation
    if (!validateContactData(contactData)) {
        return;
    }
    
    // Store contact data
    orderData.contact = contactData;
    
    try {
        // Show loading for payment
        showLoading('Przetwarzam płatność...');
        
        // Use real payment if configured, otherwise mock
        if (window.CONFIG && !window.CONFIG.development.useMockData) {
            await processRealPayment();
        } else {
            // Mock payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            await processSuccessfulPayment();
        }
    } catch (error) {
        console.error('Payment error:', error);
        hideLoading();
        alert('Błąd podczas przetwarzania płatności. Spróbuj ponownie.');
    }
}

// Process real payment and create order
async function processRealPayment() {
    const config = window.CONFIG;
    
    // First create the order in Xpress.Delivery system
    const order = await createXpressOrder();
    orderData.orderNumber = order.orderNumber;
    orderData.orderId = order.id;
    
    // Then process payment (simplified - in real app this would be more complex)
    // For now we'll assume payment is successful
    await processSuccessfulPayment();
}

// Create order in Xpress.Delivery system
async function createXpressOrder() {
    const config = window.CONFIG;
    if (!config.xpress.auth.apiKey || config.xpress.auth.apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Xpress.Delivery API key not configured');
    }
    
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
            description: packageTypes[orderData.selectedPackage].name
        },
        pricing: {
            total: parseFloat(orderData.prices[orderData.selectedPackage]),
            currency: 'PLN'
        }
    };
    
    const response = await fetch(`${config.xpress.baseUrl}${config.xpress.endpoints.orders}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.xpress.auth.apiKey}`
        },
        body: JSON.stringify(orderPayload)
    });
    
    if (!response.ok) {
        throw new Error('Failed to create order in Xpress.Delivery system');
    }
    
    return await response.json();
}

// Quick validation
function validateContactData(data) {
    const required = ['senderName', 'senderPhone', 'senderEmail', 'recipientName', 'recipientPhone', 'recipientEmail'];
    
    for (let field of required) {
        if (!data[field] || data[field].trim() === '') {
            alert(`Proszę wypełnić: ${getFieldLabel(field)}`);
            return false;
        }
    }
    
    // Basic email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.senderEmail) || !emailRegex.test(data.recipientEmail)) {
        alert('Proszę podać prawidłowe adresy email');
        return false;
    }
    
    return true;
}

// Get field labels
function getFieldLabel(field) {
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

// Process successful payment
function processSuccessfulPayment() {
    // Generate order number
    const orderNumber = generateOrderNumber();
    orderData.orderNumber = orderNumber;
    
    // Update thank you page
    document.getElementById('final-order-number').textContent = orderNumber;
    document.getElementById('final-route').textContent = `${shortenAddress(orderData.pickup)} → ${shortenAddress(orderData.delivery)}`;
    document.getElementById('final-package').textContent = packageTypes[orderData.selectedPackage].name;
    document.getElementById('final-cost').textContent = `${orderData.prices[orderData.selectedPackage]} zł`;
    document.getElementById('final-time').textContent = `${orderData.timeEstimate} min`;
    
    hideLoading();
    showThankYouPage();
    
    // Mock confirmation
    setTimeout(() => {
        console.log('Wysłano potwierdzenie na:', orderData.contact.senderEmail);
        console.log('Wysłano SMS na:', orderData.contact.senderPhone);
    }, 1000);
}

// Show thank you page
function showThankYouPage() {
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('thank-you-page').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Generate order number
function generateOrderNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `XPR-${year}-${random}`;
}

// Start new order
function newOrder() {
    // Reset everything
    orderData = { pickup: '', delivery: '', distance: 0, timeEstimate: '', selectedPackage: null, prices: {} };
    
    // Reset form
    document.getElementById('pickup-address').value = '';
    document.getElementById('delivery-address').value = '';
    document.getElementById('contact-form').reset();
    
    // Remove selections
    document.querySelectorAll('.package-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Hide sections
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('order-form-section').style.display = 'none';
    
    // Show main page
    document.getElementById('thank-you-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility functions
function shortenAddress(address) {
    if (address.length > 20) {
        return address.substring(0, 20) + '...';
    }
    return address;
}

function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// Development helper - auto-fill for testing
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        // Add test button
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '🧪';
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
        testBtn.onclick = fillTestData;
        document.body.appendChild(testBtn);
    });
}

function fillTestData() {
    document.getElementById('pickup-address').value = 'ul. Krakowska 123, Warszawa';
    document.getElementById('delivery-address').value = 'ul. Marszałkowska 45, Warszawa';
    
    // Trigger calculation
    setTimeout(() => {
        calculateInstantPrice('ul. Krakowska 123, Warszawa', 'ul. Marszałkowska 45, Warszawa');
    }, 100);
}