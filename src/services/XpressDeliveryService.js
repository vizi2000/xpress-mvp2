// XpressDelivery API Service
import { ApiConfig } from '../config/api.config.js';

export class XpressDeliveryService {
    constructor() {
        this.config = ApiConfig.xpress;
        this.token = null;
        this.tokenExpiry = null;
        this.loginPromise = null;
        this.cachedProductId = null;
    }

    // Ensure user is logged in
    async ensureAuthenticated() {
        if (this.isTokenValid()) {
            return true;
        }

        // If login is already in progress, wait for it
        if (this.loginPromise) {
            return await this.loginPromise;
        }

        // Start login process
        this.loginPromise = this.performLogin();
        
        try {
            const result = await this.loginPromise;
            this.loginPromise = null;
            return result;
        } catch (error) {
            this.loginPromise = null;
            throw error;
        }
    }

    // Perform login with configured credentials
    async performLogin() {
        if (this.config.auth.username && this.config.auth.password) {
            console.log('🔐 Attempting automatic login to Xpress.Delivery...');
            await this.login(this.config.auth.username, this.config.auth.password);
            return true;
        } else {
            console.warn('⚠️ No Xpress.Delivery credentials configured');
            return false;
        }
    }

    // Authentication
    async login(username, password) {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            
            // Token expires in 14 days
            this.tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            
            console.log('✅ Xpress.Delivery login successful');
            return data;
        } catch (error) {
            console.error('❌ Xpress.Delivery login failed:', error);
            throw error;
        }
    }

    // Refresh token
    async refreshToken() {
        if (!this.token) {
            throw new Error('No token to refresh');
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/api/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            
            return data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.token = null;
            this.tokenExpiry = null;
            throw error;
        }
    }

    // Check if token is valid
    isTokenValid() {
        return this.token && this.tokenExpiry && new Date() < this.tokenExpiry;
    }

    // Get authenticated headers
    getAuthHeaders() {
        if (!this.isTokenValid()) {
            throw new Error('No valid token available');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // List available products
    async listProducts() {
        await this.ensureAuthenticated();
        
        try {
            const response = await fetch(`${this.config.baseUrl}/api/product/list`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Failed to list products:', error);
            throw error;
        }
    }

    // Check delivery availability
    async checkDeliveryAvailability(senderLocation, receiverLocation, packageSize = 'M') {
        await this.ensureAuthenticated();
        
        try {
            const response = await fetch(`${this.config.baseUrl}/api/order/check-delivery-availability`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    senderLocation,
                    receiverLocation,
                    packageSize
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Availability check failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Delivery availability check failed:', error);
            throw error;
        }
    }

    // Create new order
    async createOrder(orderData) {
        await this.ensureAuthenticated();
        
        try {
            // Validate coordinates are present
            if (!orderData.pickupCoords || !orderData.deliveryCoords) {
                throw new Error('Missing coordinates for addresses. Please recalculate price.');
            }

            if (!orderData.pickupCoords.lat || !orderData.pickupCoords.lng ||
                !orderData.deliveryCoords.lat || !orderData.deliveryCoords.lng) {
                throw new Error('Invalid coordinates format. Please recalculate price.');
            }

            console.log('📍 Order coordinates:', {
                pickup: orderData.pickupCoords,
                delivery: orderData.deliveryCoords
            });

            // Map our order data to Xpress API format
            const xpressOrder = {
                clientName: orderData.contact.recipientName,
                clientPhone: orderData.contact.recipientPhone,
                clientAddress: {
                    formatted: orderData.delivery,
                    lat: orderData.deliveryCoords.lat,
                    lng: orderData.deliveryCoords.lng
                },
                pickupPoint: {
                    name: orderData.contact.senderName,
                    phone: orderData.contact.senderPhone,
                    address: {
                        formatted: orderData.pickup,
                        lat: orderData.pickupCoords.lat,
                        lng: orderData.pickupCoords.lng
                    }
                },
                products: [
                    {
                        id: await this.getDefaultProductId() // Get default product ID
                    }
                ],
                packageSize: this.mapPackageSize(orderData.selectedPackage),
                notes: `Zamówienie z aplikacji MVP. Email nadawcy: ${orderData.contact.senderEmail}, Email odbiorcy: ${orderData.contact.recipientEmail}`,
                externalId: `MVP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            const response = await fetch(`${this.config.baseUrl}/api/order/create`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(xpressOrder)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Order creation failed');
            }

            const result = await response.json();
            console.log('✅ Xpress.Delivery order created:', result);
            
            return {
                orderId: result.newOrderId,
                orderNumber: result.newOrderNo,
                verificationCode: result.verificationCode,
                externalId: xpressOrder.externalId
            };
        } catch (error) {
            console.error('❌ Order creation failed:', error);
            throw error;
        }
    }

    // Get order info
    async getOrderInfo(orderId) {
        await this.ensureAuthenticated();
        
        try {
            const response = await fetch(`${this.config.baseUrl}/api/order/info?orderId=${orderId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to get order info');
            }

            const data = await response.json();
            return data.order || data;
        } catch (error) {
            console.error('Failed to get order info:', error);
            throw error;
        }
    }

    // List orders
    async listOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            // Add filters to params
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value);
                }
            });

            const response = await fetch(`${this.config.baseUrl}/api/order/list?${params}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to list orders');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to list orders:', error);
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(orderId, reason = 'CLIENTS_REQUEST', comment = '') {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/order/cancel`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    orderId,
                    reason,
                    comment
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Order cancellation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Order cancellation failed:', error);
            throw error;
        }
    }

    // Get default product ID (fallback for MVP)
    async getDefaultProductId() {
        // Return cached value if available
        if (this.cachedProductId) {
            console.log('✅ Using cached product ID:', this.cachedProductId);
            return this.cachedProductId;
        }

        console.log('🔍 Fetching product ID from API (first time)...');

        try {
            const products = await this.listProducts();

            if (!products || products.length === 0) {
                throw new Error('No products available in Xpress API');
            }

            // Look for a generic package product
            const packageProduct = products.find(p =>
                p.type === 'pickup_delivery' ||
                p.name?.toLowerCase().includes('paczka') ||
                p.code?.toLowerCase().includes('package')
            );

            if (packageProduct?.id) {
                this.cachedProductId = packageProduct.id;
                console.log('✅ Cached product ID:', this.cachedProductId, `(${packageProduct.name})`);
                return this.cachedProductId;
            }

            // Use first product if no package-specific product found
            if (products[0]?.id) {
                this.cachedProductId = products[0].id;
                console.log('⚠️ Using first available product:', this.cachedProductId, `(${products[0].name})`);
                return this.cachedProductId;
            }

            throw new Error('No valid product ID found in API response');

        } catch (error) {
            console.error('❌ Failed to get product ID:', error);
            throw error; // Don't use string fallback!
        }
    }

    // Map our package sizes to Xpress API sizes
    mapPackageSize(ourSize) {
        const sizeMap = {
            small: 'S',
            medium: 'M',
            large: 'L'
        };
        return sizeMap[ourSize] || 'M';
    }

    // Get delivery status in Polish
    getStatusInPolish(status) {
        const statusMap = {
            'new': 'Nowe',
            'scheduled': 'Zaplanowane',
            'accepted': 'Przypisane',
            'picked_up': 'Odebrane',
            'arrived': 'Kurier na miejscu',
            'delivered': 'Dostarczone',
            'finished': 'Zakończone',
            'cancelled': 'Anulowane'
        };
        return statusMap[status] || status;
    }

    // Get status color for UI
    getStatusColor(status) {
        const colorMap = {
            'new': '#f39c12',
            'scheduled': '#3498db',
            'accepted': '#9b59b6',
            'picked_up': '#e67e22',
            'arrived': '#2ecc71',
            'delivered': '#27ae60',
            'finished': '#95a5a6',
            'cancelled': '#e74c3c'
        };
        return colorMap[status] || '#95a5a6';
    }

    // Format order for display
    formatOrderForDisplay(order) {
        return {
            id: order.id,
            orderNumber: order.no,
            status: this.getStatusInPolish(order.status),
            statusRaw: order.status,
            statusColor: this.getStatusColor(order.status),
            clientName: order.clientName,
            clientPhone: order.clientPhone,
            clientAddress: order.clientAddress?.formatted || `${order.clientStreet}, ${order.clientCity}`,
            driverName: order.driverFirstName && order.driverLastName ? 
                `${order.driverFirstName} ${order.driverLastName}` : order.driverName,
            driverPhone: order.driverPhone,
            driverCar: order.driverCar,
            driverPlate: order.driverRegistrationPlate,
            createdAt: new Date(order.createdAt).toLocaleString('pl-PL'),
            acceptedAt: order.acceptedAt ? new Date(order.acceptedAt).toLocaleString('pl-PL') : null,
            pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt).toLocaleString('pl-PL') : null,
            arrivedAt: order.driverArrivedAt ? new Date(order.driverArrivedAt).toLocaleString('pl-PL') : null,
            deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('pl-PL') : null,
            estimatedDistance: order.estimatedDistance ? `${(order.estimatedDistance / 1000).toFixed(1)} km` : null,
            estimatedDuration: order.estimatedDuration ? `${Math.round(order.estimatedDuration / 60)} min` : null,
            verificationCode: order.verificationCode,
            notes: order.notes,
            externalId: order.externalId
        };
    }
}