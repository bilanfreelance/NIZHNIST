# NIZHNIST — e-commerce concept

Modern Ukrainian linen clothing · Premium minimalism · **Made to Feel Free.**

Homepage concept for a women's linen clothing store (design concept by Valentyn Bilan).

## Stack
- Plain HTML / CSS / ES modules — no build step
- Type: **Instrument Serif** (serif display headlines) + **Manrope** (UI)
- No WebGL layer: all image motion is compositor-only (clip-path + transform) for jitter-free scrolling
- **GSAP + ScrollTrigger** — intro, scroll reveals, pinned editorial & horizontal best sellers
- **Lenis** — smooth scrolling

## WebGL effects
- Hero: curtain reveal with a woven linen edge, slow "breeze" distortion, warm light that follows the cursor, fold-away on scroll
- Product cards: second angle unfolds from the cursor (noise dissolve) + subtle zoom; planes bend with scroll velocity
- Images: woven reveal on enter, shader parallax
- Linen story: interactive fabric simulation — move across it; swatches switch Ivory / Olive / Cocoa linen

## E-commerce features (working on the homepage)
Quick add with size selection · sold-out sizes · mini cart drawer (qty, remove, subtotal, shipping progress) · wishlist (localStorage) · Shop the Look panel (per-item sizes, add complete look) · search overlay with empty state · newsletter validation · closable announcement bar · mobile menu.

Accessibility: keyboard focus states, Escape/scrim close, focus trap in drawers, `prefers-reduced-motion` disables WebGL and smooth scroll (falls back to plain optimized images).

## Structure
```
index.html
assets/css/style.css     design tokens + layout
assets/js/data.js        demo catalogue (names, prices, sizes are concept data)
assets/js/gl.js          WebGL layer + shaders
assets/js/main.js        UI, cart, wishlist, motion
assets/img/              WebP images (products p1–p8 × front/alt/back/macro, decor)
```

Run locally: `python3 -m http.server` and open http://localhost:8000.

*Concept store — prices, sizes and shipping conditions are demonstrative.*
