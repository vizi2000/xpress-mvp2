# GRUPA B: COMPONENTS (SPEC 4-7)

## SPEC-4: Liquid Glass Header
**File**: `src/styles/components.css` (.header)
**Lines**: ~4-21

```css
.header {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2.5rem 1.5rem;
    position: relative;
    overflow: hidden;
    text-align: center;
}

.header::before {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
    animation: liquidBlob1 10s ease-in-out infinite;
    top: -150px;
    left: -100px;
}

.header::after {
    content: '';
    position: absolute;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
    animation: liquidBlob2 12s ease-in-out infinite;
    bottom: -125px;
    right: -100px;
}

@keyframes liquidBlob1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(100px, 50px) scale(1.2); }
    66% { transform: translate(-50px, 100px) scale(0.9); }
}

@keyframes liquidBlob2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-80px, -60px) scale(1.1); }
    66% { transform: translate(60px, -40px) scale(0.95); }
}

.header h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    margin-bottom: 0.25rem;
    position: relative;
    z-index: 1;
    /* Gradient from base.css applies here */
}

.header p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 1;
}
```

---

## SPEC-5: Glass Address Cards
**File**: `src/styles/components.css` (.address-group)
**Lines**: ~39-44

```css
.address-group {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.address-group::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366F1, #8B5CF6, #F59E0B);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.address-group:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-4px);
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.address-group:hover::before {
    transform: scaleX(1);
}

.address-group:focus-within {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 
        0 0 0 4px rgba(99, 102, 241, 0.1),
        0 20px 40px rgba(0, 0, 0, 0.3);
}

.address-group label {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    font-size: 0.95rem;
    letter-spacing: 0.025em;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
```

---

## SPEC-6: Modern Input Fields
**File**: `src/styles/base.css` (input, textarea, select)
**Lines**: ~84-105

```css
input, textarea, select {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

input::placeholder,
textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
}

input:hover, textarea:hover, select:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
}

input:focus, textarea:focus, select:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 
        0 0 0 4px rgba(99, 102, 241, 0.15),
        0 8px 20px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    outline: none;
}

label {
    display: block;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    font-size: 0.95rem;
    letter-spacing: 0.025em;
    margin-bottom: 0.75rem;
}
```

---

## SPEC-7: Premium 3D Buttons
**File**: `src/styles/base.css` (.btn, .btn-primary, .btn-secondary) + `src/styles/components.css` (.order-btn)

### base.css (~49-81):
```css
.btn {
    display: inline-block;
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    overflow: hidden;
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
}

.btn-primary {
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    color: white;
    box-shadow: 
        0 10px 30px rgba(99, 102, 241, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 1px 0 rgba(0, 0, 0, 0.1);
}

.btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s;
}

.btn-primary:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
        0 20px 40px rgba(99, 102, 241, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        0 1px 0 rgba(0, 0, 0, 0.1);
}

.btn-primary:hover::before {
    left: 100%;
}

.btn-primary:active {
    transform: translateY(0) scale(0.98);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #F59E0B;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
```

### components.css (add after package-option):
```css
.order-btn {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    color: #000;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
        0 4px 15px rgba(245, 158, 11, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.order-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
        0 8px 25px rgba(245, 158, 11, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```
