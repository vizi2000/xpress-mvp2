// UI Helper functions
export class UIHelpers {
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

    // Show error message
    static showError(message) {
        alert(message); // In production, use a better modal/toast system
    }

    // Show success message
    static showSuccess(message) {
        alert(message); // In production, use a better modal/toast system
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
}