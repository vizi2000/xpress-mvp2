/**
 * Language Detection Utility
 * Simple keyword-based detection for Polish and English
 */
export class LanguageDetector {
    /**
     * Detect language based on keyword frequency
     * @param {string} text - Text to analyze
     * @returns {string} Language code ('pl' or 'en')
     */
    static detect(text) {
        const plWords = [
            'chcę', 'wysłać', 'paczkę', 'dokąd', 'skąd', 'gdzie', 'jak', 'czy',
            'dzień', 'dobry', 'proszę', 'dziękuję', 'kuriera', 'zamówić',
            'przesyłka', 'odbiór', 'dostawa', 'adres', 'telefon', 'email',
            'mała', 'średnia', 'duża', 'koszt', 'cena', 'kiedy', 'pomocy'
        ];

        const enWords = [
            'want', 'send', 'package', 'where', 'from', 'how', 'can', 'please',
            'hello', 'thank', 'courier', 'order', 'delivery', 'pickup',
            'address', 'phone', 'email', 'small', 'medium', 'large',
            'cost', 'price', 'when', 'help'
        ];

        const lowerText = text.toLowerCase();
        let plCount = 0;
        let enCount = 0;

        // Count Polish keywords
        plWords.forEach(word => {
            if (lowerText.includes(word)) {
                plCount++;
            }
        });

        // Count English keywords
        enWords.forEach(word => {
            if (lowerText.includes(word)) {
                enCount++;
            }
        });

        // Detect based on character patterns (Polish diacritics)
        const polishChars = /[ąćęłńóśźż]/i;
        if (polishChars.test(text)) {
            plCount += 2; // Weight Polish characters more heavily
        }

        const detectedLang = enCount > plCount ? 'en' : 'pl';

        console.log(`🌐 Language detected: ${detectedLang} (PL: ${plCount}, EN: ${enCount})`);

        return detectedLang;
    }

    /**
     * Get language name
     * @param {string} code - Language code ('pl' or 'en')
     * @returns {string} Language name
     */
    static getLanguageName(code) {
        const languages = {
            'pl': 'Polski',
            'en': 'English'
        };
        return languages[code] || 'Unknown';
    }

    /**
     * Validate language code
     * @param {string} code - Language code to validate
     * @returns {boolean} True if valid
     */
    static isValidLanguage(code) {
        return ['pl', 'en'].includes(code);
    }
}
