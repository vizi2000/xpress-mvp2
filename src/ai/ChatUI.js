/**
 * ChatUI - Inline AI-First Chat Interface
 * Embedded directly on the page (not a popup)
 */
export class ChatUI {
    constructor(chatAgent) {
        this.agent = chatAgent;
        this.userStartedInteraction = false;
        this.quickPromptsVisible = true;

        this.initElements();
        this.bindEvents();
        this.showGreeting();

        console.log('ChatUI initialized (inline mode)');
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send');
        this.quickPromptsContainer = document.getElementById('quick-prompts');
        this.quickPromptBtns = document.querySelectorAll('.quick-prompt-btn');
        this.formToggle = document.getElementById('form-toggle');
        this.formAccordionContent = document.getElementById('form-accordion-content');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Send message on button click or Enter key
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick prompt buttons
        this.quickPromptBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.closest('.quick-prompt-btn').dataset.prompt;
                this.input.value = prompt;
                this.input.focus();
                this.sendMessage();
            });
        });

        // Form accordion toggle
        if (this.formToggle) {
            this.formToggle.addEventListener('click', () => this.toggleFormAccordion());
        }

        // Track user interaction with form
        document.addEventListener('input', (e) => {
            if (e.target.matches('#pickup-address, #delivery-address')) {
                window.userStartedForm = true;
                this.userStartedInteraction = true;
            }
        });

        // Hide quick prompts on first user interaction
        this.input.addEventListener('focus', () => {
            if (this.quickPromptsVisible) {
                this.hideQuickPrompts();
            }
        }, { once: true });
    }

    /**
     * Show AI greeting message
     */
    showGreeting() {
        this.addMessage(this.agent.getGreeting(), 'assistant');
        this.scrollToBottom();
    }

    /**
     * Hide quick prompts after first interaction
     */
    hideQuickPrompts() {
        this.quickPromptsContainer.classList.add('hidden');
        this.quickPromptsVisible = false;
        console.log('Quick prompts hidden');
    }

    /**
     * Toggle form accordion
     */
    toggleFormAccordion() {
        const isOpen = this.formAccordionContent.classList.contains('open');

        if (isOpen) {
            this.formAccordionContent.classList.remove('open');
            this.formToggle.classList.remove('active');
        } else {
            this.formAccordionContent.classList.add('open');
            this.formToggle.classList.add('active');
            // Scroll to form smoothly
            setTimeout(() => {
                this.formToggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }

    /**
     * Send user message
     */
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Hide quick prompts on first message
        if (this.quickPromptsVisible) {
            this.hideQuickPrompts();
        }

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';
        this.input.focus();
        this.scrollToBottom();

        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();

        try {
            // Process message with AI agent
            const response = await this.agent.processMessage(message);

            // Remove typing indicator
            typingIndicator.remove();

            // Add AI response (response.message contains the text)
            this.addMessage(response.message || response, 'assistant');
            this.scrollToBottom();

            // Check if order is ready for form filling (response.orderState contains the data)
            if (response.orderState) {
                const orderState = response.orderState;
                console.log('CHAT UI RECEIVED orderState:', orderState);
                console.log('Has pickup?', !!orderState.pickup);
                console.log('Has delivery?', !!orderState.delivery);
                console.log('window.xpressApp exists?', !!window.xpressApp);

                if (orderState.pickup && orderState.delivery && window.xpressApp) {
                    this.fillFormFromOrderState(orderState);
                }
            }

            // Check if order is complete and ready for payment
            if (response.readyForPayment) {
                console.log('Order complete - showing payment button');
                this.showPaymentButton(response.orderState);
            }

        } catch (error) {
            console.error('❌ Chat error:', error);
            typingIndicator.remove();
            this.addMessage('Przepraszam, wystąpił błąd. Spróbuj ponownie.', 'assistant');
            this.scrollToBottom();
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant typing-indicator';
        indicator.innerHTML = `
            <div class="message-bubble">
                <div class="typing-dots">
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
        return indicator;
    }

    /**
     * Add message to chat
     */
    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        this.messagesContainer.appendChild(messageDiv);
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * Fill form from chat order state
     */
    async fillFormFromOrderState(orderState) {
        console.log('Chat → Form: Filling addresses with animation');
        console.log('Pickup address:', orderState.pickup);
        console.log('Delivery address:', orderState.delivery);

        // Geocode addresses to get coordinates for map display
        let pickupCoords = null;
        let deliveryCoords = null;

        if (orderState.pickup && orderState.delivery && window.xpressApp && window.xpressApp.googleMapsService) {
            try {
                console.log('🗺️ Geocoding addresses for map...');

                // Geocode pickup address
                pickupCoords = await window.xpressApp.googleMapsService.geocodeAddress(orderState.pickup);
                console.log('✅ Pickup coords:', pickupCoords);

                // Geocode delivery address
                deliveryCoords = await window.xpressApp.googleMapsService.geocodeAddress(orderState.delivery);
                console.log('✅ Delivery coords:', deliveryCoords);

            } catch (error) {
                console.error('❌ Geocoding failed:', error);
                // Continue without coordinates - form will still work, just no map
            }
        }

        if (window.xpressApp && window.xpressApp.fillAddressesFromChat) {
            window.xpressApp.fillAddressesFromChat(
                orderState.pickup,
                orderState.delivery,
                pickupCoords,
                deliveryCoords
            );
        }

        // Select package size
        if (orderState.packageSize) {
            console.log('Chat → Form: Selecting package', orderState.packageSize);
            if (window.xpressApp && window.xpressApp.selectPackageFromChat) {
                window.xpressApp.selectPackageFromChat(orderState.packageSize);
            }
        }

        // Fill contact form fields
        console.log('Chat → Form: Filling contact information');

        // Sender information
        if (orderState.senderName) {
            const senderNameField = document.getElementById('senderName');
            if (senderNameField) {
                senderNameField.value = orderState.senderName;
                console.log('Filled sender name:', orderState.senderName);
            }
        }
        if (orderState.senderEmail) {
            const senderEmailField = document.getElementById('senderEmail');
            if (senderEmailField) {
                senderEmailField.value = orderState.senderEmail;
                console.log('Filled sender email:', orderState.senderEmail);
            }
        }
        if (orderState.senderPhone) {
            const senderPhoneField = document.getElementById('senderPhone');
            if (senderPhoneField) {
                senderPhoneField.value = orderState.senderPhone;
                console.log('Filled sender phone:', orderState.senderPhone);
            }
        }

        // Recipient information
        if (orderState.recipientName) {
            const recipientNameField = document.getElementById('recipientName');
            if (recipientNameField) {
                recipientNameField.value = orderState.recipientName;
                console.log('Filled recipient name:', orderState.recipientName);
            }
        }
        if (orderState.recipientEmail) {
            const recipientEmailField = document.getElementById('recipientEmail');
            if (recipientEmailField) {
                recipientEmailField.value = orderState.recipientEmail;
                console.log('Filled recipient email:', orderState.recipientEmail);
            }
        }
        if (orderState.recipientPhone) {
            const recipientPhoneField = document.getElementById('recipientPhone');
            if (recipientPhoneField) {
                recipientPhoneField.value = orderState.recipientPhone;
                console.log('Filled recipient phone:', orderState.recipientPhone);
            }
        }

        // Expand form accordion to show filled data
        if (!this.formAccordionContent.classList.contains('open')) {
            setTimeout(() => {
                this.toggleFormAccordion();
            }, 500);
        }
    }

    /**
     * Show payment button when order is complete
     */
    showPaymentButton(orderState) {
        // Create special payment message
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'message assistant payment-message';

        // Calculate price (simplified - should get from PriceCalculator)
        const basePrice = 25; // Default base price

        paymentDiv.innerHTML = `
            <div class="message-bubble payment-bubble">
                <div class="payment-summary">
                    <h3>Podsumowanie zamówienia</h3>
                    <div class="payment-details">
                        <div class="detail-row">
                            <span>Odbiór:</span>
                            <strong>${orderState.pickup || 'Nie podano'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Dostawa:</span>
                            <strong>${orderState.delivery || 'Nie podano'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Rozmiar:</span>
                            <strong>${this.getPackageSizeLabel(orderState.packageSize)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Nadawca:</span>
                            <strong>${orderState.senderName || orderState.senderEmail || 'Nie podano'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Odbiorca:</span>
                            <strong>${orderState.recipientName || orderState.recipientEmail || 'Nie podano'}</strong>
                        </div>
                    </div>
                    <div class="payment-actions">
                        <button class="chat-payment-btn" id="chat-payment-btn">
                            Przejdź do płatności
                        </button>
                        <button class="chat-new-order-btn" id="chat-new-order-btn">
                            Nowe zamówienie
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(paymentDiv);
        this.scrollToBottom();

        // Bind payment button
        const paymentBtn = document.getElementById('chat-payment-btn');
        if (paymentBtn) {
            paymentBtn.addEventListener('click', () => {
                this.handlePaymentClick(orderState);
            });
        }

        // Bind new order button
        const newOrderBtn = document.getElementById('chat-new-order-btn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.handleNewOrderClick();
            });
        }
    }

    /**
     * Handle payment button click
     */
    handlePaymentClick(orderState) {
        console.log('Payment button clicked - scrolling to form');

        // Expand form accordion if not already open
        if (!this.formAccordionContent.classList.contains('open')) {
            this.toggleFormAccordion();
        }

        // Wait for accordion animation
        setTimeout(() => {
            // Scroll to order form section
            const orderFormSection = document.getElementById('order-form-section');
            if (orderFormSection) {
                orderFormSection.style.display = 'block';
                orderFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    /**
     * Handle new order button click
     */
    handleNewOrderClick() {
        console.log('New order button clicked - starting new order');

        // Call startNewOrder on XpressApp if available
        if (window.xpressApp && window.xpressApp.startNewOrder) {
            window.xpressApp.startNewOrder();
        }

        // Clear chat messages
        this.messagesContainer.innerHTML = '';

        // Show greeting again
        this.showGreeting();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Get package size label
     */
    getPackageSizeLabel(size) {
        const labels = {
            'small': 'Mała paczka',
            'medium': 'Średnia paczka',
            'large': 'Duża paczka'
        };
        return labels[size] || size || 'Nie wybrano';
    }

    /**
     * Get chat agent (for external access)
     */
    getAgent() {
        return this.agent;
    }
}
