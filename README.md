# 🚚 Xpress.Delivery MVP

Secure, production-ready courier service application with real Xpress.Delivery API integration.

[![Security](https://img.shields.io/badge/Security-Environment%20Variables-green)](./DEPLOYMENT.md)
[![API](https://img.shields.io/badge/API-Xpress.Delivery-blue)](https://api.xpress.delivery)
[![Maps](https://img.shields.io/badge/Maps-Google%20Maps-red)](https://developers.google.com/maps)

Prosta wersja MVP aplikacji do zamawiania przesyłek kurierskich bez potrzeby rejestracji.

## 🚀 Funkcjonalność

### Główne cechy:
- **Brak rejestracji** - użytkownik od razu może zamówić przesyłkę
- **Formularz na jednej stronie** - wszystkie dane w jednym miejscu
- **Automatyczna wycena** - cena na podstawie trasy i wielkości paczki
- **Płatność Revolut** - integracja z bramką płatniczą
- **Responsywny design** - działa na telefonach i komputerach

### User Flow:
1. **Formularz zamówienia** - adresy, wielkość paczki, dane kontaktowe
2. **Wycena i trasa** - mapa z trasą i ceną przesyłki
3. **Płatność** - potwierdzenie danych i płatność przez Revolut
4. **Potwierdzenie** - numer zamówienia i informacje o kolejnych krokach

## 🎨 Design

- **Kolory marki**: Czarny (#000) + żółty akcent (#F4C810)
- **Czcionka**: Inter (nowoczesna, czytelna)
- **Style**: Clean, minimalistyczny, mobile-first

## 📁 Struktura plików

```
xpress-mvp/
├── index.html      # Główna strona z formularzem
├── styles.css      # Style CSS
├── script.js       # JavaScript (logika aplikacji)
└── README.md       # Dokumentacja
```

## 🔧 Uruchomienie

### Opcja 1: Bezpośrednio w przeglądarce
```bash
# Otwórz plik index.html w przeglądarce
open index.html
```

### Opcja 2: Lokalny serwer
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (jeśli masz live-server)
npx live-server

# PHP
php -S localhost:8000
```

Potem otwórz: http://localhost:8000

## 🧪 Testowanie

W trybie development (localhost) pojawia się przycisk "🧪 Wypełnij testowe dane" który automatycznie wypełnia formularz.

### Przykładowe dane testowe:
- **Nadawca**: ul. Krakowska 123, Warszawa
- **Odbiorca**: ul. Marszałkowska 45, Warszawa
- **Wielkość**: Mała paczka
- **Kontakt**: Testowe dane

## 🔌 Integracje do dodania

### 1. Google Maps API
```javascript
// W script.js - funkcja initializeMap()
// Dodać prawdziwe wywołanie Google Maps API
// Obliczanie trasy i dystansu
```

### 2. Revolut Payment
```javascript
// W script.js - funkcja initializeRevolutPayment()  
// Dodać Revolut widget lub przekierowanie
// Obsługa callback'ów płatności
```

### 3. Backend API
- Endpoint do zapisywania zamówień
- Endpoint do wysyłania emaili/SMS
- Integracja z systemem kurierów

## 📱 Responsive

Aplikacja jest w pełni responsywna:
- **Desktop**: Pełny layout z wszystkimi elementami
- **Tablet**: Dostosowany grid i odstępy  
- **Mobile**: Jednokolumnowy layout, większe przyciski

## ⚡ Wydajność

- **Minimalne zależności** - tylko czysty HTML/CSS/JS
- **Optymalizowane obrazy** - emoji zamiast ikon
- **Szybkie ładowanie** - brak zewnętrznych bibliotek
- **Progressive Enhancement** - działa bez JavaScript (formularze)

## 🎯 Przyszłe funkcje

Po przetestowaniu MVP można dodać:
- **Śledzenie przesyłek** - status w czasie rzeczywistym
- **Historia zamówień** - dla powracających klientów
- **Rabaty i promocje** - kody promocyjne
- **Większy obszar** - poza Warszawą
- **API dla biznesu** - integracje B2B

## 💡 Wskazówki

1. **Testuj na prawdziwych urządzeniach** - szczególnie na telefonach
2. **Sprawdź formularze** - walidacja i user experience
3. **Optymalizuj ładowanie** - szczególnie na wolnych łączach
4. **A/B testuj** - różne wersje przycisków i formularzy

## 🔐 Security & Environment Variables

This application uses environment variables for all sensitive data. **No credentials are stored in the code.**

### **Quick Setup:**
1. Copy `.env.template` to `.env.local`
2. Fill in your API credentials
3. Start development server

### **Required Environment Variables:**
```bash
XPRESS_API_USERNAME=your-email@xpress.delivery
XPRESS_API_PASSWORD=your-password
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### **Security Features:**
- ✅ Environment variable configuration
- ✅ `.env.local` gitignored 
- ✅ No hardcoded credentials
- ✅ Production-ready deployment
- ✅ GitHub Actions security scanning

📋 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

## 🚀 Deployment

### **Secure Deployment Options:**

#### **Vercel (Recommended)**
```bash
# 1. Connect GitHub repo to Vercel
# 2. Add environment variables in Vercel dashboard
# 3. Deploy automatically
```

#### **Netlify**
```bash
# 1. Connect repo to Netlify
# 2. Add environment variables in settings
# 3. Deploy
```

#### **Local Development**
```bash
cp .env.template .env.local
# Edit .env.local with your credentials
python3 -m http.server 8080
```

### **GitHub Secrets (for CI/CD):**
```bash
# Add these secrets in GitHub repository settings:
XPRESS_API_USERNAME
XPRESS_API_PASSWORD
GOOGLE_MAPS_API_KEY
REVOLUT_API_KEY (optional)
```

---

## 🚨 Important Security Notes

⚠️ **Never commit `.env.local` or any files containing credentials**
⚠️ **Always use environment variables in production** 
⚠️ **Restrict Google Maps API key to your domain**
⚠️ **Use different credentials for development/production**

---

**Status**: Production-ready with real API integrations and secure credential management.