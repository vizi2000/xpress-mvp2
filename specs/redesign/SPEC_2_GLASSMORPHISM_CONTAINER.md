# SPEC-2: Glassmorphism Container

## Metadata
- **Grupa**: A (Foundation)
- **Priorytet**: HIGH
- **Czas**: ~20 min
- **Dependencies**: SPEC-1 (gradient background)
- **Modyfikuje**: `src/styles/base.css` (.container)

## Problem
Obecny container: białe pudełko (`background: #ffffff`)
- Nie pasuje do ciemnego tła
- Brak glassmorphism effect

## Solution
Frosted glass container z:
- `backdrop-filter: blur(40px)`
- Przezroczystość rgba
- Liquid glass reflection (::before pseudo)

## Implementation

### Zastąp blok .container w base.css:

```css
.container {
    max-width: 800px;
    margin: 0 auto;
    min-height: 100vh;

    /* Glassmorphism */
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);

    /* Borders & Shadows */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
        0 0 0 1px rgba(0, 0, 0, 0.1);

    /* Liquid glass reflection */
    position: relative;
    overflow: hidden;
}

.container::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.05) 50%,
        transparent 70%
    );
    animation: glassReflection 8s ease-in-out infinite;
    pointer-events: none;
}

@keyframes glassReflection {
    0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}
```

## Success Criteria
- ✅ Container przezroczysty z blur
- ✅ Widoczne tło gradient przez container
- ✅ Reflection animation płynna
- ✅ Border radius 24px

## Testing
- Sprawdź czy tło jest widoczne przez container
- Reflection musi się animować (8s cycle)
- Blur musi być silny (40px)

**Created by The Collective Borg.tools**
