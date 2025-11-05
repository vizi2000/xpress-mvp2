// UI Helper functions
export class UIHelpers {
    /**
     * Message templates for city-related feedback
     */
    static MESSAGES = {
        CITY_NOT_SUPPORTED: (city) => `❌ Przepraszamy, nie obsługujemy jeszcze miasta: ${city}`,
        CITY_MISMATCH: (pickup, allowed) => `❌ Dostawa z ${pickup} możliwa tylko w: ${allowed}`,
        TROJMIASTO_HINT: '📍 Dostawa dostępna w: Gdańsk, Gdynia, Sopot',
        KATOWICE_HINT: '📍 Dostawa dostępna w Aglomeracji Katowickiej (7 miast)',
        SINGLE_CITY_HINT: (city) => `📍 Dostawa dostępna tylko w: ${city}`,
        SUCCESS_CITIES_COMPATIBLE: '✅ Miasta są zgodne, możesz kontynuować',
        SUPPORTED_CITIES_LIST: 'Gdańsk, Gdynia, Sopot, Kraków, Wrocław, Łódź, Poznań, Szczecin, Rzeszów, Radom, Aglomeracja Katowicka'
    };

    // Show loading overlay
    static showLoading(text = 'Loading...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    // Hide loading overlay
    static hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Show error message with optional submessage
     * @param {HTMLElement|string} inputElementOrMessage - Input element or error message
     * @param {string} message - Main error message (if first param is element)
     * @param {string} submessage - Optional submessage
     */
    static showError(inputElementOrMessage, message = null, submessage = null) {
        // Legacy support: if only string provided, show as toast
        if (typeof inputElementOrMessage === 'string' && !message) {
            UIHelpers.showToast(inputElementOrMessage, 'error', 4000);
            return;
        }

        const inputElement = inputElementOrMessage;

        // Remove existing error for this input
        if (inputElement && inputElement.parentNode) {
            const existingError = inputElement.parentNode.querySelector('.ui-error');
            if (existingError) {
                existingError.remove();
            }
        }

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'ui-error ui-error-city';

        let html = `<div class="ui-error-message">${message}</div>`;
        if (submessage) {
            html += `<div class="ui-error-submessage">${submessage}</div>`;
        }
        errorElement.innerHTML = html;

        // Insert after input
        if (inputElement && inputElement.parentNode) {
            inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        }

        // Add error class to input
        if (inputElement) {
            inputElement.classList.add('input-error');
        }

        console.error('[UIHelpers] Error shown:', message);
    }

    /**
     * Show success message (legacy support maintained)
     * @param {string} message - Success message
     */
    static showSuccess(message) {
        UIHelpers.showToast(message, 'success', 3000);
    }

    // Smooth scroll to element
    static scrollToElement(elementId, behavior = 'smooth') {
        const element = document.getElementById(elementId);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior, block: 'nearest' });
            }, 100);
        }
    }

    // Update element text content safely
    static updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    // Update element HTML content safely
    static updateHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    // Show/hide element
    static toggleElement(elementId, show = true) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    // Add/remove CSS class
    static toggleClass(elementId, className, add = true) {
        const element = document.getElementById(elementId);
        if (element) {
            if (add) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    }

    // Clear form inputs
    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    // Get form data as object
    static getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // Format currency
    static formatPrice(price) {
        return `${parseFloat(price).toFixed(2)} zł`;
    }

    // Format distance
    static formatDistance(distance) {
        return `${parseFloat(distance).toFixed(1)} km`;
    }

    // Format time estimate
    static formatTime(timeEstimate) {
        return `${timeEstimate} min`;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Check if element exists
    static elementExists(elementId) {
        return document.getElementById(elementId) !== null;
    }

    // Add event listener safely
    static addEventListener(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, callback);
        }
    }

    // Remove all children from element
    static clearElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    }

    // Create and append element
    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // ====================================
    // CITY ERROR & FEEDBACK METHODS
    // ====================================

    /**
     * Show error when user selects unsupported city
     * @param {string} cityName - The unsupported city name
     * @param {HTMLElement} inputElement - The input that triggered the error
     */
    static showCityNotSupportedError(cityName, inputElement) {
        const message = UIHelpers.MESSAGES.CITY_NOT_SUPPORTED(cityName);
        const submessage = `Dostawa dostępna w: ${UIHelpers.MESSAGES.SUPPORTED_CITIES_LIST}`;

        UIHelpers.showError(inputElement, message, submessage);

        console.error('[UIHelpers] City not supported:', cityName);
    }

    /**
     * Show error when delivery city is incompatible with pickup city
     * @param {string} pickupCity - Pickup city display name
     * @param {string} deliveryCity - Delivery city display name
     * @param {string[]} allowedCities - List of allowed city names
     * @param {HTMLElement} inputElement - The delivery input
     */
    static showCityMismatchError(pickupCity, deliveryCity, allowedCities, inputElement) {
        const allowedList = allowedCities.join(', ');
        const message = UIHelpers.MESSAGES.CITY_MISMATCH(pickupCity, allowedList);
        const submessage = `Wybrałeś miasto: ${deliveryCity}, które nie jest obsługiwane dla tej lokalizacji odbioru.`;

        UIHelpers.showError(inputElement, message, submessage);

        console.error('[UIHelpers] City mismatch:', { pickupCity, deliveryCity, allowedCities });
    }

    /**
     * Show informational hint about allowed delivery cities
     * @param {string[]} allowedCities - List of allowed city display names
     * @param {HTMLElement} targetElement - Element to insert hint before
     */
    static showCityHint(allowedCities, targetElement) {
        // Remove existing hint
        UIHelpers.clearCityHint();

        const cityList = allowedCities.join(', ');

        let hintMessage;
        if (allowedCities.length === 1) {
            hintMessage = UIHelpers.MESSAGES.SINGLE_CITY_HINT(cityList);
        } else if (allowedCities.length <= 3) {
            hintMessage = `📍 Dostawa dostępna w: <strong>${cityList}</strong>`;
        } else {
            hintMessage = `📍 Dostawa dostępna w ${allowedCities.length} miastach Aglomeracji Katowickiej`;
        }

        const hintElement = document.createElement('div');
        hintElement.id = 'city-hint';
        hintElement.className = 'ui-hint ui-hint-city';
        hintElement.innerHTML = hintMessage;

        // Insert before target element
        if (targetElement && targetElement.parentNode) {
            targetElement.parentNode.insertBefore(hintElement, targetElement);
        }

        console.log('[UIHelpers] City hint shown:', allowedCities);
    }

    /**
     * Remove city hint from DOM
     */
    static clearCityHint() {
        const hintElement = document.getElementById('city-hint');
        if (hintElement) {
            hintElement.remove();
            console.log('[UIHelpers] City hint cleared');
        }
    }

    /**
     * Remove all city-related errors and hints
     */
    static clearCityFeedback() {
        UIHelpers.clearCityHint();

        // Clear city-specific errors
        const errorElements = document.querySelectorAll('.ui-error-city, #city-error');
        errorElements.forEach(el => el.remove());

        // Remove input-error class from all inputs
        const errorInputs = document.querySelectorAll('.input-error');
        errorInputs.forEach(input => input.classList.remove('input-error'));

        console.log('[UIHelpers] All city feedback cleared');
    }

    /**
     * Show city-related success message
     * @param {string} message - Success message
     * @param {HTMLElement} targetElement - Element to insert success message after
     */
    static showCitySuccess(message, targetElement) {
        // Remove existing success message
        const existingSuccess = document.getElementById('city-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        const successElement = document.createElement('div');
        successElement.id = 'city-success';
        successElement.className = 'ui-success';
        successElement.innerHTML = `✅ ${message}`;

        if (targetElement && targetElement.parentNode) {
            targetElement.parentNode.insertBefore(successElement, targetElement.nextSibling);
        }

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.remove();
            }
        }, 5000);

        console.log('[UIHelpers] Success shown:', message);
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'info', 'error', 'success'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    static showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast
        const existingToast = document.getElementById('ui-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'ui-toast';
        toast.className = `ui-toast ui-toast-${type}`;
        toast.textContent = message;

        // Inject toast styles if not already present
        if (!document.getElementById('ui-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-toast-styles';
            style.textContent = `
                .ui-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 99999;
                    animation: slideIn 0.3s ease;
                }

                .ui-toast-error {
                    background: linear-gradient(135deg, #f44 0%, #c00 100%);
                }

                .ui-toast-success {
                    background: linear-gradient(135deg, #4a4 0%, #060 100%);
                }

                .ui-toast-info {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @media (max-width: 768px) {
                    .ui-toast {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        font-size: 13px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-dismiss
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);

        console.log('[UIHelpers] Toast shown:', message, type);
    }

    /**
     * Inject CSS styles for city feedback UI
     */
    static injectCityFeedbackStyles() {
        // Check if already injected
        if (document.getElementById('ui-city-feedback-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'ui-city-feedback-styles';
        style.textContent = `
            /* City Hint Styles */
            .ui-hint {
                padding: 12px 16px;
                margin: 10px 0;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.5;
                animation: slideDown 0.3s ease;
            }

            .ui-hint-city {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-left: 4px solid #5a67d8;
                color: white;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .ui-hint strong {
                font-weight: 600;
                text-decoration: underline;
            }

            /* Error Styles */
            .ui-error {
                padding: 12px 16px;
                margin: 10px 0;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.5;
                animation: shake 0.3s ease;
            }

            .ui-error-city {
                background: #fee;
                border-left: 4px solid #f44;
                color: #c00;
                box-shadow: 0 2px 8px rgba(255, 68, 68, 0.2);
            }

            .ui-error-message {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .ui-error-submessage {
                font-size: 13px;
                color: #a00;
                margin-top: 4px;
            }

            /* Success Styles */
            .ui-success {
                padding: 12px 16px;
                margin: 10px 0;
                border-radius: 8px;
                background: #efe;
                border-left: 4px solid #4a4;
                color: #060;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(68, 170, 68, 0.2);
                animation: slideDown 0.3s ease;
            }

            /* Input Error State */
            .input-error {
                border-color: #f44 !important;
                box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1) !important;
            }

            /* Animations */
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .ui-hint, .ui-error, .ui-success {
                    padding: 10px 12px;
                    font-size: 13px;
                    margin: 8px 0;
                }

                .ui-error-submessage {
                    font-size: 12px;
                }
            }
        `;

        document.head.appendChild(style);
        console.log('[UIHelpers] City feedback styles injected');
    }
}

// Initialize styles when module is loaded (browser environment)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UIHelpers.injectCityFeedbackStyles();
        });
    } else {
        UIHelpers.injectCityFeedbackStyles();
    }
}