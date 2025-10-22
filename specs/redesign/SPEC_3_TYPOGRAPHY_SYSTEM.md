# SPEC-3: Modern Typography & Variable Fonts

## Metadata
- **Grupa**: A (Foundation)
- **Czas**: ~15 min
- **Modyfikuje**: `src/styles/base.css`, `index-modular.html`

## Changes

### 1. Update font link in index-modular.html (line 14)
Replace:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```
With:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
```

### 2. Update h1-h6 in base.css (replace block around line 25-28)
```css
h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

h1 { font-size: clamp(2rem, 5vw, 3rem); }
h2 { font-size: clamp(1.5rem, 4vw, 2.25rem); }
h3 { font-size: clamp(1.25rem, 3vw, 1.75rem); }
```

### 3. Update .highlight (line ~31-33)
```css
.highlight {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

## Success Criteria
- ✅ Variable font loaded (100-900 weights)
- ✅ Headings mają gradient text fill
- ✅ Highlight ma amber gradient
- ✅ Fluid typography responsywna
