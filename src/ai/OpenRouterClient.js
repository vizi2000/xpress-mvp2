/**
 * OpenRouter API Client
 * Handles communication with OpenRouter AI API using Amazon Nova Lite model
 */
export class OpenRouterClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'amazon/nova-lite-v1';

        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        console.log('✅ OpenRouterClient initialized with model:', this.model);
    }

    /**
     * Send chat completion request to OpenRouter
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - Additional options for the API call
     * @returns {Promise<string>} AI response content
     */
    async chat(messages, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://sendxpress.borg.tools',
                    'X-Title': 'Xpress.Delivery AI Assistant'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 500,
                    ...options
                })
            });

            if (!response.ok) {
                const error = await response.json();
                const errorMessage = error.error?.message || 'Unknown error';
                console.error('❌ OpenRouter API error:', errorMessage);
                throw new Error(`OpenRouter API error: ${errorMessage}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            console.log('✅ OpenRouter response received:', content.substring(0, 100) + '...');

            return content;
        } catch (error) {
            console.error('❌ OpenRouter chat error:', error);
            throw error;
        }
    }

    /**
     * Get model information
     * @returns {Object} Model details
     */
    getModelInfo() {
        return {
            model: this.model,
            provider: 'Amazon',
            estimatedCost: '$0.06 per 1M tokens',
            capabilities: ['chat', 'conversation', 'entity-extraction']
        };
    }
}
