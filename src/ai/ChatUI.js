/**
 * ChatUI - Floating chat widget component
 * Provides a bottom-right floating chatbot interface
 */
export class ChatUI {
    constructor(chatAgent) {
        this.agent = chatAgent;
        this.isOpen = false;
        this.userStartedInteraction = false;
        this.hintShown = false;

        this.initElements();
        this.bindEvents();
        this.showInitialHint();

        console.log('💬 ChatUI initialized');
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        this.widget = document.getElementById('chat-widget');
        this.toggleBtn = document.getElementById('chat-toggle');
        this.modal = document.getElementById('chat-modal');
        this.closeBtn = document.getElementById('chat-close');
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send');
        this.badge = this.createBadge();

        // Add greeting message
        this.addMessage(this.agent.getGreeting(), 'assistant');
    }

    /**
     * Create notification badge
     */
    createBadge() {
        const badge = document.createElement('span');
        badge.id = 'chat-badge';
        badge.className = 'chat-badge';
        badge.textContent = '!';
        badge.style.display = 'none';
        this.toggleBtn.appendChild(badge);
        return badge;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.closeChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Track user interaction with form
        document.addEventListener('input', (e) => {
            if (e.target.matches('#pickup-address, #delivery-address')) {
                window.userStartedForm = true;
                this.userStartedInteraction = true;
            }
        });
    }

    /**
     * Show initial hint after 5 seconds of inactivity
     */
    showInitialHint() {
        setTimeout(() => {
            if (!this.isOpen && !this.userStartedInteraction && !this.hintShown) {
                this.showBadge();
                this.pulseBadge();
                this.hintShown = true;
                console.log('💡 Showing chat hint badge');
            }
        }, 5000);
    }

    /**
     * Show notification badge
     */
    showBadge() {
        this.badge.style.display = 'flex';
    }

    /**
     * Hide notification badge
     */
    hideBadge() {
        this.badge.style.display = 'none';
    }

    /**
     * Pulse animation for badge
     */
    pulseBadge() {
        this.badge.classList.add('pulse');
    }

    /**
     * Toggle chat modal
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chat modal
     */
    openChat() {
        this.isOpen = true;
        this.modal.style.display = 'flex';
        this.modal.classList.add('chat-modal-open');
        this.toggleBtn.classList.add('active');
        this.hideBadge();
        this.input.focus();
        console.log('💬 Chat opened');
    }

    /**
     * Close chat modal
     */
    closeChat() {
        this.isOpen = false;
        this.modal.style.display = 'none';
        this.modal.classList.remove('chat-modal-open');
        this.toggleBtn.classList.remove('active');
    }

    /**
     * Send user message
     */
    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add user message to UI
        this.addMessage(text, 'user');
        this.input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            // Get AI response
            const response = await this.agent.processMessage(text);

            // Hide typing indicator
            this.hideTyping();

            if (response.success) {
                // Add AI message to UI
                this.addMessage(response.message, 'assistant');

                // Check if ready for payment
                if (response.readyForPayment) {
                    this.showPaymentButtons();
                }

                // Auto-fill form if we have addresses
                if (response.orderState.pickup || response.orderState.delivery) {
                    this.fillFormFromOrderState(response.orderState);
                }
            } else {
                this.addMessage(response.message, 'error');
            }
        } catch (error) {
            console.error('❌ Send message error:', error);
            this.hideTyping();
            const errorMsg = this.agent.language === 'pl'
                ? 'Przepraszam, wystąpił błąd. Spróbuj ponownie.'
                : 'Sorry, an error occurred. Please try again.';
            this.addMessage(errorMsg, 'error');
        }
    }

    /**
     * Add message to chat
     */
    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message assistant typing-indicator';
        typingDiv.id = 'typing-indicator';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = '<span></span><span></span><span></span>';

        typingDiv.appendChild(bubble);
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    /**
     * Show payment buttons when ready
     */
    showPaymentButtons() {
        const orderData = this.agent.getOrderData();
        const amount = this.calculateAmount();

        // Show confirmation summary first
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'chat-order-summary';
        summaryDiv.innerHTML = `
            <div class="summary-header">${this.agent.language === 'pl' ? '📋 Podsumowanie zamówienia' : '📋 Order Summary'}</div>
            <div class="summary-content">
                <div class="summary-row">
                    <span class="summary-label">${this.agent.language === 'pl' ? 'Odbiór:' : 'Pickup:'}</span>
                    <span class="summary-value">${orderData.pickupAddress || orderData.pickup || '—'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">${this.agent.language === 'pl' ? 'Dostawa:' : 'Delivery:'}</span>
                    <span class="summary-value">${orderData.deliveryAddress || orderData.delivery || '—'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">${this.agent.language === 'pl' ? 'Wielkość:' : 'Size:'}</span>
                    <span class="summary-value">${orderData.packageSize || '—'}</span>
                </div>
                <div class="summary-row summary-total">
                    <span class="summary-label">${this.agent.language === 'pl' ? 'Do zapłaty:' : 'Total:'}</span>
                    <span class="summary-value"><strong>${amount.toFixed(2)} PLN</strong></span>
                </div>
            </div>
            <div class="summary-confirm">
                <p>${this.agent.language === 'pl' ? 'Czy dane są poprawne?' : 'Are the details correct?'}</p>
                <button class="confirm-btn yes-btn">${this.agent.language === 'pl' ? '✓ Tak, kontynuuj' : '✓ Yes, continue'}</button>
                <button class="confirm-btn no-btn">${this.agent.language === 'pl' ? '✗ Nie, popraw' : '✗ No, correct'}</button>
            </div>
        `;

        this.messagesContainer.appendChild(summaryDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Bind confirmation events
        setTimeout(() => {
            summaryDiv.querySelector('.yes-btn').addEventListener('click', () => {
                summaryDiv.remove();
                this.showActualPaymentButtons();
            });

            summaryDiv.querySelector('.no-btn').addEventListener('click', () => {
                summaryDiv.remove();
                this.addMessage(
                    this.agent.language === 'pl'
                        ? 'W porządku, powiedz mi co trzeba poprawić.'
                        : 'Okay, tell me what needs to be corrected.',
                    'assistant'
                );
            });
        }, 100);
    }

    /**
     * Show actual payment buttons after confirmation
     */
    showActualPaymentButtons() {
        const amount = this.calculateAmount();
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'chat-payment-buttons';
        buttonsDiv.innerHTML = `
            <p class="payment-prompt">${this.agent.language === 'pl' ? 'Wybierz metodę płatności:' : 'Choose payment method:'}</p>
            <button class="payment-btn revolut-btn" data-method="revolut">
                Revolut
                <span class="payment-amount">${amount.toFixed(2)} PLN</span>
            </button>
            <button class="payment-btn payu-btn" data-method="payu">
                PayU
                <span class="payment-amount">${amount.toFixed(2)} PLN</span>
            </button>
        `;

        this.messagesContainer.appendChild(buttonsDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Bind payment button events
        setTimeout(() => {
            document.querySelectorAll('.payment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const method = e.currentTarget.dataset.method;
                    this.processPayment(method);
                });
            });
        }, 100);
    }

    /**
     * Calculate payment amount based on package size
     * @returns {number} Amount in PLN
     */
    calculateAmount() {
        const orderData = this.agent.getOrderData();
        const packageSize = orderData.packageSize;

        // Default pricing based on package size
        const pricing = {
            small: 25,
            medium: 35,
            large: 45
        };

        return pricing[packageSize] || 35; // Default to medium if not specified
    }

    /**
     * Process payment with selected method
     * @param {string} method - Payment method (revolut or payu)
     */
    async processPayment(method) {
        const orderData = this.agent.getOrderData();
        const amount = this.calculateAmount();

        console.log('💳 Processing payment:', { method, amount, orderData });

        try {
            if (method === 'revolut') {
                const { RevolutPayment } = await import('../payment/RevolutPayment.js');
                const revolut = new RevolutPayment();
                const result = await revolut.createPayment(orderData, amount);

                if (result.success) {
                    this.addMessage(
                        this.agent.language === 'pl'
                            ? 'Przekierowano do płatności Revolut. Sprawdź nowe okno.'
                            : 'Redirected to Revolut payment. Check the new window.',
                        'assistant'
                    );
                } else {
                    this.addMessage(
                        this.agent.language === 'pl'
                            ? 'Nie udało się otworzyć okna płatności. Sprawdź ustawienia przeglądarki.'
                            : 'Failed to open payment window. Check your browser settings.',
                        'error'
                    );
                }
            } else if (method === 'payu') {
                const { PayUPayment } = await import('../payment/PayUPayment.js');
                const payu = new PayUPayment();
                const result = await payu.createPayment(orderData, amount);

                if (result.success) {
                    this.addMessage(
                        this.agent.language === 'pl'
                            ? 'Przekierowano do płatności PayU. Sprawdź nowe okno.'
                            : 'Redirected to PayU payment. Check the new window.',
                        'assistant'
                    );
                } else {
                    this.addMessage(
                        this.agent.language === 'pl'
                            ? 'Nie udało się otworzyć okna płatności. Sprawdź ustawienia przeglądarki.'
                            : 'Failed to open payment window. Check your browser settings.',
                        'error'
                    );
                }
            }
        } catch (error) {
            console.error('❌ Payment processing error:', error);
            this.addMessage(
                this.agent.language === 'pl'
                    ? 'Wystąpił błąd podczas przetwarzania płatności. Spróbuj ponownie.'
                    : 'An error occurred while processing payment. Please try again.',
                'error'
            );
        }
    }

    /**
     * Fill form from order state and trigger actions
     */
    fillFormFromOrderState(orderState) {
        if (!window.xpressApp) {
            console.warn('⚠️ XpressApp not available for chat integration');
            return;
        }

        // Fill addresses and trigger calculation with visual feedback
        if (orderState.pickup && orderState.delivery) {
            console.log('📋 Chat → Form: Filling addresses with animation');
            window.xpressApp.fillAddressesFromChat(orderState.pickup, orderState.delivery);
        } else if (orderState.pickup) {
            // Only pickup filled
            const pickupInput = document.getElementById('pickup-address');
            if (pickupInput && !pickupInput.value) {
                pickupInput.value = orderState.pickup;
                console.log('📋 Chat → Form: Pickup address filled');
            }
        } else if (orderState.delivery) {
            // Only delivery filled
            const deliveryInput = document.getElementById('delivery-address');
            if (deliveryInput && !deliveryInput.value) {
                deliveryInput.value = orderState.delivery;
                console.log('📋 Chat → Form: Delivery address filled');
            }
        }

        // Trigger package selection if specified
        if (orderState.packageSize) {
            console.log('📋 Chat → Form: Selecting package', orderState.packageSize);
            setTimeout(() => {
                window.xpressApp.selectPackageFromChat(orderState.packageSize);
            }, 1000); // Wait for addresses to be processed
        }
    }

    /**
     * Update order state from form (external call)
     */
    updateOrderStateFromForm(pickup, delivery, packageSize) {
        this.agent.setOrderState({
            pickup: pickup || null,
            delivery: delivery || null,
            packageSize: packageSize || null
        });
    }

    /**
     * Reset chat
     */
    reset() {
        this.messagesContainer.innerHTML = '';
        this.agent.reset();
        this.addMessage(this.agent.getGreeting(), 'assistant');
        console.log('🔄 Chat UI reset');
    }
}
