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

            // Add AI response
            this.addMessage(response, 'assistant');
            this.scrollToBottom();

            // Check if order is ready for form filling
            const orderState = this.agent.getOrderState();
            console.log('CHAT UI RECEIVED orderState:', orderState);
            console.log('Has pickup?', !!orderState.pickup);
            console.log('Has delivery?', !!orderState.delivery);
            console.log('window.xpressApp exists?', !!window.xpressApp);

            if (orderState.pickup && orderState.delivery && window.xpressApp) {
                this.fillFormFromOrderState(orderState);
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
    fillFormFromOrderState(orderState) {
        console.log('Chat → Form: Filling addresses with animation');
        console.log('Pickup address:', orderState.pickup);
        console.log('Delivery address:', orderState.delivery);

        if (window.xpressApp && window.xpressApp.fillAddressesFromChat) {
            window.xpressApp.fillAddressesFromChat(
                orderState.pickup,
                orderState.delivery
            );
        }

        // Select package size
        if (orderState.packageSize) {
            console.log('Chat → Form: Selecting package', orderState.packageSize);
            if (window.xpressApp && window.xpressApp.selectPackageFromChat) {
                window.xpressApp.selectPackageFromChat(orderState.packageSize);
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
     * Get chat agent (for external access)
     */
    getAgent() {
        return this.agent;
    }
}
