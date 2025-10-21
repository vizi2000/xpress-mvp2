// Order Status Component for Thank You Page
import { UIHelpers } from '../utils/UIHelpers.js';

export class OrderStatus {
    constructor(xpressDeliveryService) {
        this.xpressDeliveryService = xpressDeliveryService;
        this.pollInterval = null;
        this.currentOrderId = null;
    }

    // Start tracking order status
    async startTracking(orderId) {
        this.currentOrderId = orderId;
        
        // Initial status check
        await this.updateOrderStatus();
        
        // Poll for status updates every 30 seconds
        this.pollInterval = setInterval(async () => {
            await this.updateOrderStatus();
        }, 30000);
        
        console.log('🔄 Started order status tracking for:', orderId);
    }

    // Stop tracking
    stopTracking() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.currentOrderId = null;
        console.log('⏹️ Stopped order status tracking');
    }

    // Update order status from API
    async updateOrderStatus() {
        if (!this.currentOrderId) return;

        try {
            const orderInfo = await this.xpressDeliveryService.getOrderInfo(this.currentOrderId);
            const formattedOrder = this.xpressDeliveryService.formatOrderForDisplay(orderInfo);
            
            this.displayOrderStatus(formattedOrder);
            
            // Stop tracking if order is completed
            if (formattedOrder.statusRaw === 'delivered' || 
                formattedOrder.statusRaw === 'finished' || 
                formattedOrder.statusRaw === 'cancelled') {
                this.stopTracking();
            }
            
        } catch (error) {
            console.error('Failed to update order status:', error);
            
            // Show error message instead of mock status
            this.displayStatusError(error);
        }
    }

    // Display order status in the UI
    displayOrderStatus(order) {
        // Update main status
        const statusHtml = `
            <div class="order-status-card">
                <div class="status-header">
                    <span class="status-badge" style="background-color: ${order.statusColor}">
                        ${order.status}
                    </span>
                    <span class="status-time">${order.createdAt}</span>
                </div>
                
                ${this.generateStatusSteps(order)}
                
                ${order.driverName ? this.generateDriverInfo(order) : ''}
                
                ${order.estimatedDistance ? `
                    <div class="order-details-row">
                        <span class="label">Odległość:</span>
                        <span>${order.estimatedDistance}</span>
                    </div>
                ` : ''}
                
                ${order.estimatedDuration ? `
                    <div class="order-details-row">
                        <span class="label">Czas dostawy:</span>
                        <span>${order.estimatedDuration}</span>
                    </div>
                ` : ''}
            </div>
        `;

        // Find and update status container
        const statusContainer = document.getElementById('order-status-container');
        if (statusContainer) {
            statusContainer.innerHTML = statusHtml;
        } else {
            // Insert after order details if container doesn't exist
            this.insertStatusAfterDetails(statusHtml);
        }
    }

    // Generate status steps timeline
    generateStatusSteps(order) {
        const steps = [
            { key: 'new', label: 'Zamówienie złożone', time: order.createdAt },
            { key: 'accepted', label: 'Przypisane kurierowi', time: order.acceptedAt },
            { key: 'picked_up', label: 'Odebrane z punktu', time: order.pickedUpAt },
            { key: 'arrived', label: 'Kurier na miejscu', time: order.arrivedAt },
            { key: 'delivered', label: 'Dostarczone', time: order.deliveredAt }
        ];

        const currentStep = this.getStepIndex(order.statusRaw);
        
        let stepsHtml = '<div class="status-timeline">';
        
        steps.forEach((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            
            stepsHtml += `
                <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                    <div class="step-indicator">
                        ${isCompleted ? '✓' : (index + 1)}
                    </div>
                    <div class="step-content">
                        <div class="step-label">${step.label}</div>
                        ${step.time ? `<div class="step-time">${step.time}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        stepsHtml += '</div>';
        return stepsHtml;
    }

    // Generate driver information
    generateDriverInfo(order) {
        return `
            <div class="driver-info">
                <h4>👤 Twój kurier</h4>
                <div class="driver-details">
                    <div class="driver-row">
                        <span class="label">Imię:</span>
                        <span>${order.driverName}</span>
                    </div>
                    <div class="driver-row">
                        <span class="label">Telefon:</span>
                        <span><a href="tel:${order.driverPhone}">${order.driverPhone}</a></span>
                    </div>
                    ${order.driverCar ? `
                        <div class="driver-row">
                            <span class="label">Pojazd:</span>
                            <span>${order.driverCar} ${order.driverPlate || ''}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Get step index for status
    getStepIndex(status) {
        const statusMap = {
            'new': 0,
            'scheduled': 0,
            'accepted': 1,
            'picked_up': 2,
            'arrived': 3,
            'delivered': 4,
            'finished': 4,
            'cancelled': -1
        };
        return statusMap[status] ?? 0;
    }

    // Insert status container after order details
    insertStatusAfterDetails(statusHtml) {
        const orderDetails = document.querySelector('.order-details');
        if (orderDetails) {
            const statusContainer = document.createElement('div');
            statusContainer.id = 'order-status-container';
            statusContainer.innerHTML = statusHtml;
            
            orderDetails.insertAdjacentElement('afterend', statusContainer);
        }
    }

    // Display error when status tracking fails
    displayStatusError(error) {
        const errorHtml = `
            <div class="order-status-card">
                <div class="status-header">
                    <span class="status-badge" style="background-color: #e74c3c">
                        Błąd śledzenia
                    </span>
                </div>
                
                <div class="error-message">
                    <p>⚠️ Nie można pobrać aktualnego statusu zamówienia.</p>
                    <small>Spróbuj odświeżyć stronę lub skontaktuj się z obsługą klienta.</small>
                </div>
            </div>
        `;

        const statusContainer = document.getElementById('order-status-container');
        if (statusContainer) {
            statusContainer.innerHTML = errorHtml;
        } else {
            this.insertStatusAfterDetails(errorHtml);
        }
    }

    // Initialize with order ID if available
    initializeFromOrderData(orderData) {
        if (orderData.orderId) {
            this.startTracking(orderData.orderId);
        } else {
            // Show error if no order ID available
            this.displayStatusError(new Error('No order ID available for tracking'));
        }
    }
}