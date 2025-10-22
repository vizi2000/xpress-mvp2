# GRUPA C: ADVANCED (SPEC 8-10)

## SPEC-8: Glassmorphism Package Cards
**File**: `src/styles/components.css` (.package-option, .package-icon, .price)

```css
.package-option {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.package-option::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top left, rgba(99, 102, 241, 0.1), transparent 50%);
    opacity: 0;
    transition: opacity 0.4s;
}

.package-option:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.package-option:hover::before {
    opacity: 1;
}

.package-option.selected {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 
        0 0 0 3px rgba(99, 102, 241, 0.2),
        0 20px 40px rgba(99, 102, 241, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.package-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

.price {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

---

## SPEC-9: Animated Route Visualization
**File**: `src/styles/components.css` (.route-summary, .point, .route-line)

```css
.route-summary {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.route-visual {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.point {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.25rem;
    box-shadow: 
        0 8px 20px rgba(99, 102, 241, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.3),
        0 0 30px rgba(99, 102, 241, 0.3);
    animation: pointPulse 2s ease-in-out infinite;
}

@keyframes pointPulse {
    0%, 100% {
        box-shadow: 
            0 8px 20px rgba(99, 102, 241, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            0 0 30px rgba(99, 102, 241, 0.3);
    }
    50% {
        box-shadow: 
            0 8px 20px rgba(99, 102, 241, 0.6),
            inset 0 2px 4px rgba(255, 255, 255, 0.5),
            0 0 50px rgba(99, 102, 241, 0.6);
    }
}

.route-line {
    flex: 1;
    height: 4px;
    background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
    border-radius: 2px;
    position: relative;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.route-line::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 30%;
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    transform: translateY(-50%);
    filter: blur(4px);
    animation: routeFlow 2s linear infinite;
}

@keyframes routeFlow {
    0% { left: -30%; }
    100% { left: 130%; }
}

.route-details {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
}

.route-details strong {
    color: #ffffff;
    font-weight: 600;
}
```

---

## SPEC-10: Loading States & Skeleton
**File**: `src/styles/base.css` (.loading-overlay, .spinner) + add .skeleton

```css
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-overlay.active {
    display: flex;
}

.loading-content {
    text-align: center;
    color: white;
}

.spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(99, 102, 241, 0.2);
    border-top: 4px solid #6366F1;
    border-right: 4px solid #8B5CF6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Skeleton loader (add at end of base.css) */
.skeleton {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
    border-radius: 8px;
}

@keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```
