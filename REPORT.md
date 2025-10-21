
    # xpress-mvp2

    **Ścieżka:** `/Users/wojciechwiesner/ai/xpress-mvp2`  
    **Języki:** (nie wykryto)  
    **Ostatni commit:** brak  
    **Commity/gałęzie:** 0/0  

    ## Etap i ocena
    - **Etap:** idea
    - **Value:** 3/10
    - **Risk:** 4/10
    - **Priority:** 0/20
    - **Fundamentalne błędy:** brak testów, brak LICENSE

    ## Fakty
    - README: TAK
    - LICENSE: NIE
    - Testy: NIE
    - CI: TAK
    - TODO/FIXME (próbka):
    (brak)

    ### Zależności (skrót)
    - Python: (brak)
    - Node: (brak)

    ## Umiejętności / tagi
    ci/cd

    ## AI Acceleration – najlepsze kroki
    - Użyj LLM do wygenerowania szkielety testów jednostkowych dla kluczowych modułów (max 5 plików).

    ## TODO – na dziś (45–90 min)
    - Dodaj minimalne testy jednostkowe (1-2 pliki) dla krytycznych funkcji.

    ## TODO – następne (1–2 dni)
    - Dodaj LICENSE (MIT/Apache-2.0).
- Zamknij pętlę E2E: działający przykład od wejścia do wyniku.

    **Uzasadnienie:** Zadania priorytetyzowane pod największą dźwignię w 90 minut, najpierw błędy fundamentalne.

    ---

    ## Opis projektu (LLM)
    MVP aplikacji kurierskiej Xpress.Delivery umożliwiającej zamawianie przesyłek bez rejestracji. Zawiera formularz jednostronicowy, automatyczną wycenę, integrację z Revolut (do implementacji) i responsywny design.

    ## Deklarowane funkcje vs. zastane w kodzie (LLM)
    {'declared': 'Produkcyjna aplikacja z API Xpress.Delivery, Google Maps i Revolut', 'actual': 'Podstawowy frontend bez działających integracji (tylko placeholdery w kodzie), brak backendu'}

    ## Struktura projektu (snapshot)
    Prosta struktura frontendowa: główne pliki HTML/CSS/JS + folder /src z pseudomodularnym podziałem (components, services). Brak widocznej logiki backendowej lub konfiguracji środowiskowej.

    ## Best practices – checklist
    - [x] good
- [x] missing

    ## "Vibe" kodowania – notatki
    Profesjonalny minimalistyczny vibe z naciskiem na szybkość działania. README z emoji i badge'ami sugeruje podejście 'developer-friendly'. Kolorowy design (#F4C810) wskazuje na branżę transportową.

    ---

    ## Problem jaki rozwiązuje projekt (LLM)
    Uproszczenie procesu zamawiania przesyłek kurierskich dla użytkowników jednorazowych (bez wymogu rejestracji) z natychmiastową wyceną.

    ## Potencjał monetyzacji (LLM)
    ['Prowizja od transakcji', 'Subskrypcja dla firm (B2B API)', 'Program partnerski dla kurierów', 'Premium features (śledzenie w czasie rzeczywistym)']

    ## Realna lista TODO do uruchomienia MVP (LLM)
    - Implementacja Google Maps API (obliczanie tras)
- Integracja z Revolut Payment
- Dodanie podstawowych testów E2E (Cypress)
- Utworzenie LICENSE (MIT/APACHE)
- Konfiguracja CI/CD (GitHub Actions)

    ## Frontend TODO list (LLM)
    - Walidacja formularza (adresy, wymiary paczki)
- Lazy loading dla map
- Optymalizacja CLS (Cumulative Layout Shift)
- Dodanie loading states dla API calls
- Implementacja Web Workers dla obliczeń wyceny

    ## Portfolio suitability (LLM)
    - **Nadaje się do portfolio:** TAK

    ## Portfolio description (świadectwo umiejętności) (LLM)
    MVP usługi kurierskiej z dynamiczną wyceną i integracją płatności. Demonstruje: responsywny design, pracę z zewnętrznymi API (Maps, Revolut) i architekturę frontendową.

    ---

    ## Podobne Projekty (LLM)
    (brak)
