#!/usr/bin/env python3
"""Builds shop.html and product.html from index.html's shared chrome
(head, header, drawers, footer, scripts) + page templates in tools/.
Run from the repo root:  python3 tools/build_pages.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text()
head, rest = src.split('<main id="main">', 1)
_, tail = rest.split('</main>', 1)
head = re.sub(r'<div class="loader" aria-hidden="true">.*?\n</div>\n', '', head, flags=re.S)

def page(name, slug, title, desc, body, extra_overlays=''):
    h = head.replace('<body data-page="home">', f'<body data-page="{slug}">')
    h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', h)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', h)
    h = h.replace('<link rel="preload" as="image" href="assets/img/decor/hero.webp">\n', '')
    t = tail.replace('<div class="toast"', extra_overlays + '<div class="toast"', 1)
    (root / name).write_text(h + '<main id="main">\n' + body + '\n</main>' + t)

tpl = root / 'tools'
page('shop.html', 'shop', 'Shop the Linen Edit — NIZHNIST',
     'Shop modern Ukrainian linen: sets, dresses, shirts and jumpsuits. Natural fabrics, considered silhouettes.',
     (tpl / 'shop.body.html').read_text(), (tpl / 'shop.overlays.html').read_text())
page('product.html', 'product', 'NIZHNIST — Linen piece',
     'Modern Ukrainian linen clothing — natural fabrics, considered silhouettes.',
     (tpl / 'product.body.html').read_text(), (tpl / 'product.overlays.html').read_text())
print('built shop.html, product.html')
