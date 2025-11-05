/**
 * Chat Agent with State Machine
 * Manages conversation flow for Xpress.Delivery order creation
 */
import { OpenRouterClient } from './OpenRouterClient.js';
import { LanguageDetector } from './LanguageDetector.js';

// Conversation states
export const ChatState = {
    IDLE: 'IDLE',
    COLLECTING_PICKUP: 'COLLECTING_PICKUP',
    COLLECTING_DELIVERY: 'COLLECTING_DELIVERY',
    SELECTING_SIZE: 'SELECTING_SIZE',
    COLLECTING_CONTACT: 'COLLECTING_CONTACT',
    CONFIRMING: 'CONFIRMING',
    PAYMENT: 'PAYMENT',
    NEWSLETTER: 'NEWSLETTER',
    COMPLETED: 'COMPLETED'
};

// System prompts for different languages
const SYSTEM_PROMPT = {
    pl: `Jesteś asystentem Xpress.Delivery. Pomagasz klientom zamówić kuriera.

Zbierz informacje krok po kroku:
1. Adres odbioru (pełny adres z miastem, np. ul. Krakowska 123, Warszawa)
2. Adres dostawy (pełny adres z miastem)
3. Rozmiar paczki (mała/średnia/duża)
4. Dane kontaktowe (imię, email, telefon)

Zasady:
- Bądź przyjazny, zwięzły i pomocny
- Zadawaj jedno pytanie na raz
- Potwierdź zebrane dane przed przejściem dalej
- Używaj emotikonów dla lepszej atmosfery
- Jeśli klient poda niekompletny adres, dopytaj o szczegóły`,

    en: `You are Xpress.Delivery assistant. Help customers order courier service.

Collect information step by step:
1. Pickup address (full address with city, e.g. ul. Krakowska 123, Warsaw)
2. Delivery address (full address with city)
3. Package size (small/medium/large)
4. Contact details (name, email, phone)

Rules:
- Be friendly, concise and helpful
- Ask one question at a time
- Confirm collected data before proceeding
- Use emojis for better atmosphere
- If customer provides incomplete address, ask for details`
};

export class ChatAgent {
    constructor(apiKey) {
        this.client = new OpenRouterClient(apiKey);
        this.state = ChatState.IDLE;
        this.language = 'pl';
        this.conversationHistory = [];
        this.orderData = {
            pickupAddress: null,
            deliveryAddress: null,
            packageSize: null,
            contactName: null,
            contactEmail: null,
            contactPhone: null
        };

        this.loadHistory();
        console.log('✅ ChatAgent initialized in state:', this.state);
    }

    /**
     * Load conversation history from localStorage
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('xpress_chat_history');
            if (stored) {
                const data = JSON.parse(stored);
                const timestamp = data.timestamp ? new Date(data.timestamp) : null;
                const now = new Date();

                // If history is older than 24 hours, clear it and start fresh
                if (timestamp) {
                    const hoursSinceLastVisit = (now - timestamp) / (1000 * 60 * 60);
                    if (hoursSinceLastVisit > 24) {
                        console.log('🕒 Chat history older than 24h - clearing...');
                        this.clearHistory();
                        return;
                    }
                }

                this.conversationHistory = data.history || [];
                this.state = data.state || ChatState.IDLE;
                this.orderData = data.orderData || this.orderData;
                console.log('📂 Loaded chat history:', this.conversationHistory.length, 'messages');
            }
        } catch (error) {
            console.error('❌ Error loading chat history:', error);
        }
    }

    /**
     * Save conversation history to localStorage
     */
    saveHistory() {
        try {
            const data = {
                history: this.conversationHistory,
                state: this.state,
                orderData: this.orderData,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('xpress_chat_history', JSON.stringify(data));
            console.log('💾 Saved chat history');
        } catch (error) {
            console.error('❌ Error saving chat history:', error);
        }
    }

    /**
     * Clear conversation history and reset state
     */
    clearHistory() {
        this.conversationHistory = [];
        this.state = ChatState.IDLE;
        this.orderData = {
            pickupAddress: null,
            deliveryAddress: null,
            packageSize: null,
            contactName: null,
            contactEmail: null,
            contactPhone: null
        };
        localStorage.removeItem('xpress_chat_history');
        console.log('🗑️ Chat history cleared');
    }

    /**
     * Process user message and generate response
     * @param {string} userMessage - User's message
     * @returns {Promise<string>} AI response
     */
    async processMessage(userMessage) {
        try {
            // Detect language from first message
            if (this.conversationHistory.length === 0) {
                this.language = LanguageDetector.detect(userMessage);
            }

            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Extract entities from user message
            await this.extractEntities(userMessage);

            // Transition state based on collected data
            this.transitionState();

            // Build messages for API
            const messages = [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT[this.language]
                },
                ...this.conversationHistory
            ];

            // Get AI response
            const aiResponse = await this.client.chat(messages);

            // Add AI response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });

            // Save history
            this.saveHistory();

            const orderState = {
                pickup: this.orderData.pickupAddress,
                delivery: this.orderData.deliveryAddress,
                packageSize: this.orderData.packageSize,
                contactName: this.orderData.contactName,
                contactEmail: this.orderData.contactEmail,
                contactPhone: this.orderData.contactPhone
            };

            console.log('📤 CHAT AGENT RETURN:', {
                pickup: orderState.pickup,
                delivery: orderState.delivery,
                packageSize: orderState.packageSize,
                readyForPayment: this.isOrderComplete()
            });

            return {
                success: true,
                message: aiResponse,
                orderState: orderState,
                readyForPayment: this.isOrderComplete()
            };
        } catch (error) {
            console.error('❌ Error processing message:', error);
            return {
                success: false,
                message: this.getErrorMessage()
            };
        }
    }

    /**
     * Extract entities from user message
     * @param {string} text - User message
     */
    async extractEntities(text) {
        // Extract address
        const address = this.extractAddress(text);
        if (address && !this.orderData.pickupAddress) {
            this.orderData.pickupAddress = address;
            console.log('📍 Extracted pickup address:', address);
        } else if (address && !this.orderData.deliveryAddress) {
            this.orderData.deliveryAddress = address;
            console.log('📍 Extracted delivery address:', address);
        }

        // Extract package size
        const packageSize = this.extractPackageSize(text);
        if (packageSize) {
            this.orderData.packageSize = packageSize;
            console.log('📦 Extracted package size:', packageSize);
        }

        // Extract email
        const email = this.extractEmail(text);
        if (email) {
            this.orderData.contactEmail = email;
            console.log('📧 Extracted email:', email);
        }

        // Extract phone
        const phone = this.extractPhone(text);
        if (phone) {
            this.orderData.contactPhone = phone;
            console.log('📱 Extracted phone:', phone);
        }

        // Extract name (simple heuristic - first capitalized word)
        if (!this.orderData.contactName && /\b[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\b/.test(text)) {
            const match = text.match(/\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\b/);
            if (match) {
                this.orderData.contactName = match[1];
                console.log('👤 Extracted name:', this.orderData.contactName);
            }
        }
    }

    /**
     * Extract Polish address from text
     * @param {string} text - Text to analyze
     * @returns {string|null} Extracted address
     */
    extractAddress(text) {
        console.log('🔍 EXTRACT: Trying to extract address from:', text);

        // Polish address patterns
        const patterns = [
            // With ul./ulica prefix: "ul. Marszałkowska 1, Warszawa"
            /(?:ul\.|ulica|aleja|al\.|plac|pl\.|os\.|osiedle)\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)*\s+\d+[a-z]?(?:\/\d+)?(?:,?\s+\d{2}-\d{3})?\s*(?:,?\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?/gi,
            // Without prefix, with comma before city: "Kolumba 7, Wrocław"
            /[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)*\s+\d+[a-z]?(?:\/\d+)?\s*,\s*(?:Warszawa|Kraków|Poznań|Wrocław|Gdańsk|Łódź|Katowice|Lublin|Bydgoszcz|Szczecin)/gi,
            // Without prefix, without comma: "Kolumba 7 Wrocław"
            /[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)*\s+\d+[a-z]?(?:\/\d+)?(?:\s+\d{2}-\d{3})?\s+(?:Warszawa|Kraków|Poznań|Wrocław|Gdańsk|Łódź|Katowice|Lublin|Bydgoszcz|Szczecin)/gi
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const result = match[0].trim();
                console.log('🔍 EXTRACT: Found address:', result);
                return result;
            }
        }

        console.log('🔍 EXTRACT: No address found');
        return null;
    }

    /**
     * Extract package size from text
     * @param {string} text - Text to analyze
     * @returns {string|null} Package size (small/medium/large)
     */
    extractPackageSize(text) {
        const lowerText = text.toLowerCase();

        if (/\b(mała|maly|mała|small|s)\b/.test(lowerText)) {
            return 'small';
        }
        if (/\b(średnia|srednia|średni|medium|m)\b/.test(lowerText)) {
            return 'medium';
        }
        if (/\b(duża|duzy|duża|large|l|big)\b/.test(lowerText)) {
            return 'large';
        }

        return null;
    }

    /**
     * Extract email from text
     * @param {string} text - Text to analyze
     * @returns {string|null} Email address
     */
    extractEmail(text) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const match = text.match(emailPattern);
        return match ? match[0] : null;
    }

    /**
     * Extract Polish phone number from text
     * @param {string} text - Text to analyze
     * @returns {string|null} Phone number
     */
    extractPhone(text) {
        // Polish phone patterns: +48 123456789, 48123456789, 123456789, 123-456-789, etc.
        const patterns = [
            /\+48\s*\d{9}/,
            /48\s*\d{9}/,
            /\d{3}[-\s]?\d{3}[-\s]?\d{3}/,
            /\d{9}/
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                // Normalize phone number
                return match[0].replace(/[-\s]/g, '').replace(/^\+?48/, '+48');
            }
        }

        return null;
    }

    /**
     * Transition state based on collected data
     */
    transitionState() {
        const oldState = this.state;

        switch (this.state) {
            case ChatState.IDLE:
                this.state = ChatState.COLLECTING_PICKUP;
                break;

            case ChatState.COLLECTING_PICKUP:
                if (this.orderData.pickupAddress) {
                    this.state = ChatState.COLLECTING_DELIVERY;
                }
                break;

            case ChatState.COLLECTING_DELIVERY:
                if (this.orderData.deliveryAddress) {
                    this.state = ChatState.SELECTING_SIZE;
                }
                break;

            case ChatState.SELECTING_SIZE:
                if (this.orderData.packageSize) {
                    this.state = ChatState.COLLECTING_CONTACT;
                }
                break;

            case ChatState.COLLECTING_CONTACT:
                if (this.orderData.contactEmail && this.orderData.contactPhone) {
                    this.state = ChatState.CONFIRMING;
                }
                break;

            case ChatState.CONFIRMING:
                this.state = ChatState.PAYMENT;
                break;

            case ChatState.PAYMENT:
                this.state = ChatState.NEWSLETTER;
                break;

            case ChatState.NEWSLETTER:
                this.state = ChatState.COMPLETED;
                break;

            case ChatState.COMPLETED:
                // Stay in completed state
                break;
        }

        if (oldState !== this.state) {
            console.log(`🔄 State transition: ${oldState} → ${this.state}`);
        }
    }

    /**
     * Get current state
     * @returns {string} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get collected order data
     * @returns {Object} Order data
     */
    getOrderData() {
        return { ...this.orderData };
    }

    /**
     * Check if order data is complete
     * @returns {boolean} True if all required data is collected
     */
    isOrderComplete() {
        return !!(
            this.orderData.pickupAddress &&
            this.orderData.deliveryAddress &&
            this.orderData.packageSize &&
            this.orderData.contactEmail &&
            this.orderData.contactPhone
        );
    }

    /**
     * Get error message based on language
     * @returns {string} Error message
     */
    getErrorMessage() {
        const messages = {
            pl: 'Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie lub skontaktuj się z nami bezpośrednio.',
            en: 'Sorry, there was a connection problem. Please try again or contact us directly.'
        };
        return messages[this.language];
    }

    /**
     * Get conversation history
     * @returns {Array} Conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Get current language
     * @returns {string} Language code
     */
    getLanguage() {
        return this.language;
    }

    /**
     * Get greeting message based on language
     * @returns {string} Greeting message
     */
    getGreeting() {
        const greetings = {
            pl: 'Cześć! 👋 Jestem asystentem Xpress.Delivery. Pomogę Ci zamówić kuriera. Podaj adres odbioru paczki.',
            en: 'Hello! 👋 I\'m Xpress.Delivery assistant. I\'ll help you order a courier. Please provide the pickup address.'
        };
        return greetings[this.language];
    }

    /**
     * Reset agent state
     */
    reset() {
        this.clearHistory();
        console.log('🔄 ChatAgent reset');
    }

    /**
     * Set order state (external update)
     * @param {Object} state - Order state to set
     */
    setOrderState(state) {
        if (state.pickup !== undefined) {
            this.orderData.pickupAddress = state.pickup;
        }
        if (state.delivery !== undefined) {
            this.orderData.deliveryAddress = state.delivery;
        }
        if (state.packageSize !== undefined) {
            this.orderData.packageSize = state.packageSize;
        }
        this.saveHistory();
        console.log('📝 Order state updated:', this.orderData);
    }
}
