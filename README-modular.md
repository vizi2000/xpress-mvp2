# Xpress.Delivery MVP - Modular Architecture

Modularny system zamówień kurierskich z prawdziwą integracją Google Maps API.

## 🏗️ Architektura Modularną

### 📁 Struktura projektu:
```
xpress-mvp/
├── src/
│   ├── components/          # UI Components
│   │   ├── XpressApp.js        # Główna aplikacja
│   │   ├── AddressForm.js      # Komponent formularza adresów
│   │   └── PriceCalculator.js  # Komponent kalkulacji cen
│   ├── services/            # Business Logic Services
│   │   ├── GoogleMapsService.js # Google Maps API
│   │   ├── PricingService.js    # Logika cenowa
│   │   └── OrderService.js      # Zarządzanie zamówieniami
│   ├── config/              # Configuration
│   │   ├── app.config.js       # Konfiguracja aplikacji
│   │   └── api.config.js       # Konfiguracja API
│   ├── utils/               # Utility Functions
│   │   ├── UIHelpers.js        # Pomocnicze funkcje UI
│   │   └── Validators.js       # Walidacja danych
│   └── styles/              # Modular CSS
│       ├── base.css            # Podstawowe style
│       ├── components.css      # Style komponentów
│       └── responsive.css      # Responsywność
├── index-modular.html       # Modularny HTML
├── index.html              # Oryginalny HTML (legacy)
└── README-modular.md       # Ta dokumentacja
```

## 🔧 Komponenty

### 🎯 XpressApp (Główna aplikacja)
- **Plik:** `src/components/XpressApp.js`
- **Funkcja:** Orkiestruje całą aplikację, zarządza stanem
- **Zależności:** Wszystkie serwisy i komponenty

### 📍 AddressForm (Formularz adresów)
- **Plik:** `src/components/AddressForm.js`
- **Funkcja:** Obsługa adresów, Google Places Autocomplete
- **API:** Google Maps Places API

### 💰 PriceCalculator (Kalkulator cen)
- **Plik:** `src/components/PriceCalculator.js`
- **Funkcja:** Obliczanie cen na podstawie odległości
- **Logika:** Prawdziwe API + fallback mock

## 🛠️ Serwisy

### 🗺️ GoogleMapsService
- **Geocoding** - konwersja adresów na współrzędne
- **Distance Matrix** - obliczanie odległości i czasu
- **Places Autocomplete** - sugestie adresów
- **API Key:** Konfigurowalny w `api.config.js`

### 💵 PricingService
- **Walidacja miast** - sprawdza obsługiwane lokalizacje
- **Walidacja odległości** - limit 20km
- **Kalkulacja cen** - nowy cennik (25zł + 3,5zł/km)
- **Breakdowns** - szczegółowe wyliczenia

### 📦 OrderService
- **Walidacja formularzy** - kontakt, adresy
- **Tworzenie zamówień** - API Xpress.Delivery
- **Generowanie numerów** - unikalne ID zamówień
- **Mock payments** - symulacja płatności

## ⚙️ Konfiguracja

### 🔑 API Keys
```javascript
// src/config/api.config.js
export const ApiConfig = {
    googleMaps: {
        apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
    },
    xpress: {
        baseUrl: 'https://api.xpress.delivery',
        auth: { apiKey: 'YOUR_API_KEY' }
    }
};
```

### 🏙️ Obsługiwane miasta
```javascript
// src/config/app.config.js
supportedCities: [
    'warszawa', 'łódź', 'poznań', 'kraków', 
    'wrocław', 'szczecin', 'trójmiasto', 
    'katowice', 'bielsko-biała'
]
```

### 💰 Cennik
- **Mała/Średnia:** 25zł do 7km + 3,5zł za każdy dodatkowy km
- **Duża:** +50% ceny średniej paczki
- **Limit:** 20km (usługa miejska)

## 🚀 Uruchomienie

### Opcja 1: Bezpośrednio (ES6 Modules)
```bash
# Otwórz w przeglądarce z obsługą ES6 modules
open index-modular.html
```

### Opcja 2: HTTP Server
```bash
# Python
python3 -m http.server 8002

# Node.js
npx serve . -p 8002

# PHP
php -S localhost:8002
```

### Opcja 3: Live Server (VS Code)
```bash
# Rozszerzenie Live Server w VS Code
# Kliknij prawym na index-modular.html → Open with Live Server
```

## 🧪 Testowanie

### Dane testowe
Aplikacja automatycznie dodaje przycisk testowy w trybie development:
```javascript
// Automatyczne wypełnienie
Odbiór: "ul. Krakowska 123, Warszawa"
Dostawa: "ul. Marszałkowska 45, Warszawa"
```

### Mock vs Real API
```javascript
// src/config/app.config.js
development: {
    useMockData: false,  // true = mock, false = prawdziwe API
    debugMode: true,
    showTestButton: true
}
```

## 📱 Responsywność

### Breakpoints
- **Mobile:** `<480px` - jednokolumnowy layout
- **Tablet:** `<768px` - dostosowany grid
- **Desktop:** `>1200px` - pełny layout z siatką

### Funkcje dostępności
- **High contrast mode** - wsparcie dla kontrastu
- **Reduced motion** - ograniczone animacje
- **Print styles** - optymalizacja do druku

## 🔧 Development

### Dodawanie nowych komponentów
```javascript
// 1. Stwórz komponent w src/components/
export class NewComponent {
    constructor() {
        this.init();
    }
    
    init() {
        // Logika inicjalizacji
    }
}

// 2. Zaimportuj w XpressApp.js
import { NewComponent } from './NewComponent.js';

// 3. Dodaj do HTML i CSS
```

### Dodawanie nowych serwisów
```javascript
// 1. Stwórz serwis w src/services/
export class NewService {
    async performAction() {
        // Logika biznesowa
    }
}

// 2. Zaimportuj i użyj w komponentach
```

### Dodawanie nowych stylów
```css
/* src/styles/components.css */
.new-component {
    /* Style komponentu */
}

/* src/styles/responsive.css */
@media (max-width: 768px) {
    .new-component {
        /* Mobile styles */
    }
}
```

## 🌐 Deployment

### Static hosting
```bash
# Netlify
npm run build  # jeśli masz build process
netlify deploy --prod --dir .

# Vercel
vercel --prod

# GitHub Pages
# Wrzuć pliki do repo i włącz Pages
```

### Environment Variables
```javascript
// Dla produkcji ustaw:
const isProduction = window.location.hostname !== 'localhost';
ApiConfig.googleMaps.apiKey = isProduction ? 
    'PROD_API_KEY' : 'DEV_API_KEY';
```

## 🚀 Przyszłe rozwinięcia

### Build system
- **Webpack/Vite** - bundling i optymalizacja
- **TypeScript** - typy i lepsze DX
- **Testing** - Jest/Vitest + Testing Library
- **Linting** - ESLint + Prettier

### Funkcje biznesowe
- **Real-time tracking** - WebSocket tracking
- **Payment integration** - Stripe/PayU
- **User accounts** - rejestracja i historia
- **Admin panel** - zarządzanie zamówieniami

### Performance
- **Code splitting** - lazy loading komponentów
- **Service Worker** - cache i offline mode
- **Image optimization** - WebP, lazy loading
- **Bundle analysis** - optymalizacja rozmiaru

## 📊 Porównanie z wersją monolityczną

| Aspekt | Monolityczna | Modularną |
|--------|-------------|-----------|
| **Pliki** | 3 główne | 15+ modułów |
| **Maintainability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Reusability** | ⭐ | ⭐⭐⭐⭐⭐ |
| **Bundle Size** | Mały | Średni |
| **Learning Curve** | Łatwa | Średnia |
| **Scalability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

**Uwaga:** Modularną wersja wymaga nowoczesnej przeglądarki z obsługą ES6 modules. Dla starszych przeglądarek użyj wersji monolitycznej lub dodaj transpilację (Babel).