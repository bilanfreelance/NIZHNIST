import { PRODUCTS, COLORS, LOOKS, FREE_SHIPPING, money } from './data.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const SIZES = ['XS', 'S', 'M', 'L'];

/* ---------------------------------------------------------
   Storage (wrapped — storage may be unavailable)
   --------------------------------------------------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('nz_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('nz_' + k, JSON.stringify(v)); } catch {} },
};
let cart = store.get('cart', []);
let wish = store.get('wish', []);

/* ---------------------------------------------------------
   Product cards
   --------------------------------------------------------- */
const icon = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

function cardHTML(p, i) {
  const c = COLORS[p.color];
  const lazy = i > 1 ? 'loading="lazy"' : '';
  const badge = p.badge ? `<span class="card__badge ${p.badge === 'Best seller' ? 'card__badge--olive' : ''}">${p.badge}</span>` : '';
  const sizes = SIZES.map(s => {
    const ok = p.sizes[s];
    return `<button class="size" data-size="${s}" ${ok ? '' : 'aria-disabled="true" title="Sold out"'} aria-label="${s}${ok ? '' : ' — sold out'}">${s}</button>`;
  }).join('');
  return `
  <article class="card" data-id="${p.id}">
    <span class="card__idx" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <div class="card__media" data-gl data-alt="${p.img.alt}" data-focus="0.5,0.4">
      <a href="#" class="card__link" aria-label="View ${p.name}">
        <img class="main" src="${p.img.front}" alt="${p.name} in ${c.name.toLowerCase()} linen — front view" width="960" height="1280" ${lazy}>
        <img class="alt" src="${p.img.alt}" alt="" width="960" height="1280" loading="lazy">
      </a>
      ${badge}
      <button class="wish-btn" aria-pressed="false" aria-label="Save ${p.name} to wishlist">${icon.heart}</button>
      <div class="quick">
        <button class="quick__btn" aria-expanded="false" aria-label="Quick add ${p.name}"><span>Quick add</span>${icon.plus}</button>
        <div class="quick__sizes" role="group" aria-label="Select size">${sizes}</div>
      </div>
    </div>
    <div class="card__info">
      <h3 class="card__name"><a href="#">${p.name}</a></h3>
      <span class="card__price">${money(p.price)}</span>
      <p class="card__sub">${p.sub}</p>
      <div class="card__colors"><span class="swatch is-active" style="--c:${c.hex}" aria-hidden="true"></span>${c.name}</div>
    </div>
  </article>`;
}

$$('[data-products]').forEach(box => {
  box.innerHTML = box.dataset.products.split(',').map((id, i) => cardHTML(PRODUCTS[id], i)).join('');
});

/* card link cover */
const style = document.createElement('style');
style.textContent = `.card__link{position:absolute;inset:0;display:block}html.gl-on .card__media{background:transparent}`;
document.head.appendChild(style);

/* ---------------------------------------------------------
   Toast
   --------------------------------------------------------- */
const toastEl = $('.toast');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
}

/* ---------------------------------------------------------
   Drawers & overlays
   --------------------------------------------------------- */
const scrim = $('.scrim');
let openPanel = null, lastFocus = null, lenis = null;

function openUI(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (openPanel && openPanel !== el) closeUI(true);
  lastFocus = document.activeElement;
  openPanel = el;
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('is-on'));
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  setTimeout(() => (el.querySelector('input, [data-close]') || el).focus(), 60);
}
function closeUI(swap) {
  if (!openPanel) return;
  openPanel.classList.remove('is-open');
  openPanel.setAttribute('aria-hidden', 'true');
  openPanel = null;
  if (swap) return;
  scrim.classList.remove('is-on');
  setTimeout(() => { if (!openPanel) scrim.hidden = true; }, 500);
  lenis?.start();
  lastFocus?.focus?.();
}
scrim.addEventListener('click', () => closeUI());
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.fcard[data-qv]')) { e.preventDefault(); openQV(e.target.dataset.qv); }
  if (e.key === 'Escape') { closeUI(); closeMenu(); }
  if (e.key === 'Tab' && openPanel) {
    const f = $$('a[href], button:not([disabled]), input', openPanel).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { e.preventDefault(); if (o.dataset.open === 'cart') renderCart(); if (o.dataset.open === 'wishlist') renderWish(); openUI(o.dataset.open); }
  if (e.target.closest('[data-close]')) closeUI();
  const qv = e.target.closest('[data-qv]');
  if (qv && !e.target.closest('.card')) { e.preventDefault(); openQV(qv.dataset.qv); return; }
  const os = e.target.closest('[data-open-search]');
  if (os) { e.preventDefault(); q.value = os.dataset.openSearch; renderSearch(); openUI('search'); return; }
  const l = e.target.closest('[data-look]');
  if (l) { e.preventDefault(); renderLook(l.dataset.look); openUI('look'); }
});

/* ---------------------------------------------------------
   Cart
   --------------------------------------------------------- */
function saveCart() { store.set('cart', cart); updateCounts(); }
function addToCart(id, size, qty = 1) {
  const line = cart.find(l => l.id === id && l.size === size);
  if (line) line.qty += qty; else cart.push({ id, size, qty });
  saveCart();
  const b = $('.bag-count'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
}
function updateCounts() {
  const n = cart.reduce((s, l) => s + l.qty, 0);
  $$('[data-count="cart"]').forEach(e => (e.textContent = n));
  $$('[data-count="wish"]').forEach(e => { e.textContent = wish.length; e.classList.toggle('has', wish.length > 0); });
}
function renderCart() {
  const box = $('.cart__items');
  const total = cart.reduce((s, l) => s + PRODUCTS[l.id].price * l.qty, 0);
  const left = Math.max(0, FREE_SHIPPING - total);
  $('.ship__text').innerHTML = left > 0 ? `You're <b>${money(left)}</b> away from complimentary shipping.` : `<b>Complimentary shipping</b> unlocked.`;
  $('.ship__bar i').style.width = Math.min(100, total / FREE_SHIPPING * 100) + '%';
  $('.cart__subtotal').textContent = money(total);
  $('.cart__foot').style.display = cart.length ? '' : 'none';
  // Upsell: one complementary piece not already in the bag
  const PAIRS = { vira: 'polissia', zoria: 'vira', sonia: 'zoria', polissia: 'lada', lada: 'vira', lesya: 'kalyna', mavka: 'kalyna', kalyna: 'mavka' };
  const inBag = cart.map(l => l.id);
  const rec = cart.length ? [PAIRS[cart[cart.length - 1].id], ...Object.keys(PRODUCTS)].find(id => id && !inBag.includes(id)) : null;
  $('.upsell').innerHTML = rec ? `<p class="upsell__t">Complete the look</p><button class="upsell__item" data-qv="${rec}"><img src="${PRODUCTS[rec].img.front}" alt="" width="64" height="85"><span><b>${PRODUCTS[rec].name}</b><em>${money(PRODUCTS[rec].price)}</em></span><i>Quick view +</i></button>` : '';
  if (!cart.length) {
    box.innerHTML = `<div class="empty"><h3>Your bag is empty</h3><p>Linen pieces you add will appear here.</p><a href="#featured" class="btn btn--dark" data-close><span>Explore the collection</span></a></div>`;
    return;
  }
  box.innerHTML = cart.map((l, i) => {
    const p = PRODUCTS[l.id];
    return `<div class="item" data-i="${i}">
      <img src="${p.img.front}" alt="${p.name}" width="88" height="117">
      <div>
        <p class="item__name">${p.name}</p>
        <p class="item__meta">${COLORS[p.color].name} · Size ${l.size}</p>
        <div class="item__ctrl">
          <div class="qty"><button data-q="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">${l.qty}</span><button data-q="1" aria-label="Increase quantity">+</button></div>
          <button class="item__rm">Remove</button>
        </div>
      </div>
      <p class="item__price">${money(p.price * l.qty)}</p>
    </div>`;
  }).join('');
}
$('.cart__items').addEventListener('click', e => {
  const row = e.target.closest('.item'); if (!row) return;
  const i = +row.dataset.i;
  const q = e.target.closest('[data-q]');
  if (q) { cart[i].qty += +q.dataset.q; if (cart[i].qty < 1) cart.splice(i, 1); }
  if (e.target.closest('.item__rm')) cart.splice(i, 1);
  saveCart(); renderCart();
});

/* ---------------------------------------------------------
   Wishlist
   --------------------------------------------------------- */
function syncHearts() {
  $$('.card').forEach(c => $('.wish-btn', c).setAttribute('aria-pressed', wish.includes(c.dataset.id)));
}
function toggleWish(id, btn) {
  const on = !wish.includes(id);
  wish = on ? [...wish, id] : wish.filter(x => x !== id);
  store.set('wish', wish);
  updateCounts(); syncHearts();
  if (btn) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  toast(on ? `${PRODUCTS[id].name} saved to wishlist` : `Removed from wishlist`);
}
function renderWish() {
  const box = $('.wish__items');
  if (!wish.length) { box.innerHTML = `<div class="empty"><h3>Nothing saved yet</h3><p>Tap the heart on any piece to keep it here — no account needed.</p></div>`; return; }
  box.innerHTML = wish.map(id => {
    const p = PRODUCTS[id];
    return `<div class="item" data-id="${id}"><img src="${p.img.front}" alt="${p.name}" width="88" height="117"><div><p class="item__name">${p.name}</p><p class="item__meta">${COLORS[p.color].name} · ${p.cat}</p><div class="item__ctrl"><button class="item__rm">Remove</button></div></div><p class="item__price">${money(p.price)}</p></div>`;
  }).join('');
}
$('.wish__items').addEventListener('click', e => {
  const row = e.target.closest('.item');
  if (row && e.target.closest('.item__rm')) { toggleWish(row.dataset.id); renderWish(); }
});

/* ---------------------------------------------------------
   Card interactions: quick add / wishlist
   --------------------------------------------------------- */
document.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  const w = e.target.closest('.wish-btn');
  if (w) { e.preventDefault(); toggleWish(id, w); return; }
  const qb = e.target.closest('.quick__btn');
  if (qb) {
    e.preventDefault();
    const q = qb.parentElement; const open = !q.classList.contains('is-open');
    $$('.quick.is-open').forEach(x => { x.classList.remove('is-open'); $('.quick__btn', x).setAttribute('aria-expanded', 'false'); });
    q.classList.toggle('is-open', open); qb.setAttribute('aria-expanded', open);
    if (open) $('.size:not([aria-disabled])', q)?.focus({ preventScroll: true });
    return;
  }
  const s = e.target.closest('.size');
  if (s && s.closest('.quick')) {
    e.preventDefault();
    if (s.getAttribute('aria-disabled') === 'true') { toast(`Size ${s.dataset.size} is sold out`); return; }
    if (s.classList.contains('is-loading')) return;
    s.classList.add('is-loading');
    setTimeout(() => {
      s.classList.remove('is-loading');
      addToCart(id, s.dataset.size);
      s.closest('.quick').classList.remove('is-open');
      toast(`${PRODUCTS[id].name} · ${s.dataset.size} added to bag`);
      renderCart(); openUI('cart');
    }, 550);
  }
  if (e.target.closest('.card__link, .card__name a')) { e.preventDefault(); openQV(id); }
});

/* ---------------------------------------------------------
   Shop the look
   --------------------------------------------------------- */
let lookSel = {};
function renderLook(key) {
  const look = LOOKS[key];
  lookSel = {};
  $('#look h2').textContent = look.items.length > 1 ? 'Shop the look' : 'Shop this piece';
  $('.look__err').textContent = '';
  $('.look__all').style.display = look.items.length > 1 ? '' : 'none';
  $('.look__total').textContent = money(look.items.reduce((s, id) => s + PRODUCTS[id].price, 0));
  $('.look__panel').innerHTML = look.items.map(id => {
    const p = PRODUCTS[id];
    return `<div class="lp" data-id="${id}">
      <img src="${p.img.front}" alt="${p.name}" width="110" height="147">
      <div>
        <div class="lp__top"><p class="lp__name">${p.name}</p><span>${money(p.price)}</span></div>
        <p class="lp__meta">${COLORS[p.color].name} · ${p.sub}</p>
        <div class="lp__sizes" role="radiogroup" aria-label="Size for ${p.name}">${SIZES.map(s => `<button class="size" data-size="${s}" aria-pressed="false" ${p.sizes[s] ? '' : 'aria-disabled="true"'}>${s}</button>`).join('')}</div>
        <button class="lp__add">Add to bag</button>
      </div>
    </div>`;
  }).join('');
}
$('.look__panel').addEventListener('click', e => {
  const row = e.target.closest('.lp'); if (!row) return;
  const id = row.dataset.id;
  const s = e.target.closest('.size');
  if (s) {
    if (s.getAttribute('aria-disabled') === 'true') { $('.look__err').textContent = `Size ${s.dataset.size} is sold out for ${PRODUCTS[id].name}.`; return; }
    $$('.size', row).forEach(b => b.setAttribute('aria-pressed', b === s));
    lookSel[id] = s.dataset.size; $('.look__err').textContent = '';
  }
  const add = e.target.closest('.lp__add');
  if (add) {
    if (!lookSel[id]) { $('.look__err').textContent = `Please select a size for ${PRODUCTS[id].name}.`; return; }
    addToCart(id, lookSel[id]); add.textContent = 'Added ✓'; add.classList.add('done');
    toast(`${PRODUCTS[id].name} · ${lookSel[id]} added to bag`);
  }
});
$('.look__all').addEventListener('click', () => {
  const ids = $$('.lp', $('.look__panel')).map(r => r.dataset.id);
  const missing = ids.filter(id => !lookSel[id]);
  if (missing.length) { $('.look__err').textContent = `Select a size for: ${missing.map(id => PRODUCTS[id].name).join(', ')}.`; return; }
  const btn = $('.look__all'); btn.classList.add('is-loading'); btn.disabled = true;
  setTimeout(() => {
    ids.forEach(id => addToCart(id, lookSel[id]));
    btn.classList.remove('is-loading'); btn.disabled = false;
    toast('Complete look added to bag'); renderCart(); openUI('cart');
  }, 600);
});

/* ---------------------------------------------------------
   Quick view — the shortest path from any image to the bag
   --------------------------------------------------------- */
let qvId = null, qvSize = null;
function openQV(id) {
  const p = PRODUCTS[id]; if (!p) return;
  qvId = id; qvSize = null;
  const c = COLORS[p.color];
  const views = [['front', 'Front'], ['alt', 'Alternate view'], ['back', 'Back'], ['macro', 'Texture detail']];
  $('.qv__gallery').innerHTML = views.map(([k, l], i) => `<figure><img src="${p.img[k]}" alt="${p.name} — ${l.toLowerCase()}" width="960" height="1280" ${i ? 'loading="lazy"' : ''}><figcaption>0${i + 1} / ${l}</figcaption></figure>`).join('');
  $('.qv__cat').textContent = `${p.cat} · ${p.no} / 08`;
  $('.qv__name').textContent = p.name;
  $('.qv__price').textContent = money(p.price);
  $('.qv__p').textContent = money(p.price);
  $('.qv__sub').textContent = p.sub;
  $('.qv__desc').textContent = `${p.sub}. Cut from natural linen with a relaxed, easy drape — designed to feel light on warm days and to soften with every wear.`;
  $('.qv__color').innerHTML = `<span class="swatch is-active" style="--c:${c.hex}"></span>Colour: <b>${c.name}</b>`;
  $('.qv__sizes').innerHTML = SIZES.map(s => `<button class="size" role="radio" aria-checked="false" data-size="${s}" ${p.sizes[s] ? '' : 'aria-disabled="true" title="Sold out"'}>${s}${p.sizes[s] ? '' : '<small>Sold out</small>'}</button>`).join('');
  $('.qv__err').textContent = '';
  const w = $('.qv__wish'); w.setAttribute('aria-pressed', wish.includes(id)); $('span', w).textContent = wish.includes(id) ? 'Saved to wishlist' : 'Save to wishlist';
  $('.qv').scrollTop = 0;
  openUI('qv');
  if (gsap && !reduce) gsap.fromTo('.qv__gallery figure, .qv__info > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .04, ease: 'expo.out', delay: .25 });
}
$('.qv__sizes').addEventListener('click', e => {
  const s = e.target.closest('.size'); if (!s) return;
  if (s.getAttribute('aria-disabled') === 'true') { $('.qv__err').textContent = `Size ${s.dataset.size} is sold out.`; return; }
  $$('.qv__sizes .size').forEach(b => b.setAttribute('aria-checked', b === s));
  qvSize = s.dataset.size; $('.qv__err').textContent = '';
});
$('.qv__add').addEventListener('click', () => {
  if (!qvSize) { $('.qv__err').textContent = 'Please select a size.'; $('.qv__sizes').animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 320 }); return; }
  const b = $('.qv__add'); if (b.disabled) return;
  b.classList.add('is-loading'); b.disabled = true;
  setTimeout(() => {
    b.classList.remove('is-loading'); b.disabled = false;
    addToCart(qvId, qvSize); toast(`${PRODUCTS[qvId].name} · ${qvSize} added to bag`);
    renderCart(); openUI('cart');
  }, 600);
});
$('.qv__wish').addEventListener('click', () => { toggleWish(qvId); const on = wish.includes(qvId); $('.qv__wish').setAttribute('aria-pressed', on); $('.qv__wish span').textContent = on ? 'Saved to wishlist' : 'Save to wishlist'; });
$('.qv__guide').addEventListener('click', () => { const d = $$('.qv__acc')[2]; d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); });

/* ---------------------------------------------------------
   Search
   --------------------------------------------------------- */
const q = $('#q');
function renderSearch() {
  const term = q.value.trim().toLowerCase();
  const list = Object.values(PRODUCTS).filter(p =>
    !term || [p.name, p.cat, p.sub, COLORS[p.color].name].join(' ').toLowerCase().includes(term));
  $('.search__results').innerHTML = list.length
    ? list.slice(0, 10).map(p => `<a href="#" class="sr-card" data-qv="${p.id}"><img src="${p.img.front}" alt="${p.name}" loading="lazy" width="960" height="1280"><p>${p.name}</p><span>${money(p.price)} · ${COLORS[p.color].name}</span></a>`).join('')
    : `<div class="empty"><h3>No results for “${q.value.replace(/</g, '&lt;')}”</h3><p>Try “dress”, “set” or a colour like “olive”.</p></div>`;
}
q.addEventListener('input', renderSearch);
$$('.search__suggest button').forEach(b => b.addEventListener('click', () => { q.value = b.textContent; renderSearch(); q.focus(); }));
renderSearch();

/* ---------------------------------------------------------
   Newsletter
   --------------------------------------------------------- */
$('.news__form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget, v = $('input', f).value.trim(), msg = $('.field__msg', f);
  f.classList.remove('is-error', 'is-ok');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { f.classList.add('is-error'); msg.textContent = 'Please enter a valid email address, e.g. name@example.com'; return; }
  const b = $('button', f); b.classList.add('is-loading'); b.disabled = true;
  setTimeout(() => { b.classList.remove('is-loading'); b.disabled = false; f.classList.add('is-ok'); msg.textContent = 'Thank you — your first letter is on its way.'; $('input', f).value = ''; }, 800);
});

/* ---------------------------------------------------------
   Announcement, header, mobile menu
   --------------------------------------------------------- */

const header = $('.header');
const burger = $('.burger'), mmenu = $('.mmenu');
function closeMenu() { burger.setAttribute('aria-expanded', 'false'); mmenu.classList.remove('is-open'); mmenu.setAttribute('aria-hidden', 'true'); lenis?.start(); }
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open); mmenu.classList.toggle('is-open', open); mmenu.setAttribute('aria-hidden', !open);
  open ? lenis?.stop() : lenis?.start();
  if (open && gsap && !reduce) gsap.fromTo('.mmenu nav a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, stagger: .06, ease: 'expo.out', delay: .25 });
});
$$('.mmenu a').forEach(a => a.addEventListener('click', closeMenu));

updateCounts(); syncHearts();

/* ---------------------------------------------------------
   Fit giant headlines to the full content width
   --------------------------------------------------------- */
function fitText() {
  $$('[data-fit]').forEach(el => {
    el.style.fontSize = '100px';
    const range = document.createRange(); range.selectNodeContents(el);
    const w = range.getBoundingClientRect().width;
    const target = el.clientWidth;
    if (w > 0 && target > 0) el.style.fontSize = (100 * target / w * .995).toFixed(2) + 'px';
  });
}
fitText();

let fitT, lastW = window.innerWidth; window.addEventListener('resize', () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(fitT); fitT = setTimeout(() => { fitText(); window.ScrollTrigger?.refresh(); }, 150); });

/* ---------------------------------------------------------
   Motion
   --------------------------------------------------------- */
const loaderEl = $('.loader');

function splitHeadings() {
  $$('[data-split]').forEach(h => {
    const sup = h.querySelector('sup'); const supHTML = sup ? sup.outerHTML : ''; sup?.remove();
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(' ').map(w => `<span class="split-line" aria-hidden="true"><span>${w}</span></span>`).join(' ') + supHTML;
  });
  $$('[data-words]').forEach(p => {
    // split text nodes into words, keep inline images / emphasis intact
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) frag.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s); } });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('inl')) walk(n);
    });
    walk(p);
    $$('.w', p).forEach(w => w.setAttribute('aria-hidden', 'true'));
  });
  $$('.hero__title .ln').forEach(l => { l.innerHTML = [...l.textContent].map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); });
}

if (reduce || !gsap) {
  loaderEl.remove();
  document.body.classList.remove('is-loading');
} else {
  boot();
}

async function boot() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.body.classList.add('is-loading');
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch {}
  splitHeadings(); fitText();

  // Smooth scroll
  lenis = new window.Lenis({ prevent: n => !!n.closest?.('.drawer, .search, .mmenu'), lerp: .085, smoothWheel: true, wheelMultiplier: .95, touchMultiplier: 1.4 });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);

  // Loader progress
  const count = $('.loader__count'), bar = $('.loader__bar i'), logo = $('.loader__logo');
  const prog = { v: 0 };
  let target = 0;
  const setP = p => { target = Math.max(target, p); };
  const progTween = gsap.ticker.add(() => {
    prog.v += (target - prog.v) * .08;
    count.textContent = Math.round(prog.v * 100);
    bar.style.transform = `scaleX(${prog.v})`;
    logo.style.clipPath = `inset(0 ${100 - prog.v * 100}% 0 0)`;
  });

  // Preload the first screen of imagery (drives the loader)
  const first = [$('.hero__media img'), ...$$('#featured .card__media .main').slice(0, 2)].filter(Boolean);
  let loaded = 0;
  await Promise.race([
    Promise.all(first.map(img => (img.complete ? Promise.resolve() : new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); })).then(() => setP(++loaded / first.length)))),
    new Promise(r => setTimeout(r, 6000)),
  ]);
  try { await Promise.all(first.map(i => i.decode?.().catch(() => {}))); } catch {}
  setP(1);
  ScrollTrigger.refresh();
  await new Promise(r => setTimeout(r, 650));
  gsap.ticker.remove(progTween);

  // Frame loop: Lenis → GL
  gsap.ticker.add(time => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  intro();
  scrollScenes();
  interactions();
}

// The narrow hero window, measured from an invisible probe so CSS stays the source of truth
function heroInset(collapsed) {
  const r = $('.hero__probe').getBoundingClientRect(), W = document.documentElement.clientWidth, H = $('.hero__sticky').clientHeight;
  const t = r.top - $('.hero__sticky').getBoundingClientRect().top, b = H - t - r.height;
  const side = collapsed ? W / 2 : r.left;
  return `inset(${t}px ${side}px ${b}px ${collapsed ? W / 2 : W - r.right}px)`;
}

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader__inner', { y: -24, opacity: 0, duration: .6, ease: 'power2.in' })
    .to(loaderEl, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=.15')
    .add(() => { document.body.classList.remove('is-loading'); lenis.start(); });
  tl.fromTo('.hero__frame', { clipPath: () => heroInset(true) }, { clipPath: () => heroInset(), duration: 1.8, ease: 'expo.inOut' }, '-=.75')
    .fromTo('.hero__media img', { scale: 1.18 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, '<')
    .from('.hero__title .ch', { yPercent: 105, duration: 1.4, stagger: .03, ease: 'expo.out' }, '-=1.7')
    .from('.hero__corner, .hero__foot > *', { y: 16, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out' }, '-=1.1')
    .from('.header__inner > *', { y: -12, opacity: 0, duration: .7, stagger: .06, ease: 'power3.out' }, '<')
    .from('.hero__hotspot', { scale: 0, opacity: 0, duration: .6, ease: 'back.out(2)' }, '-=.3');
}

function scrollScenes() {
  // Header compact state
  ScrollTrigger.create({ start: 60, end: 'max', onToggle: s => header.classList.toggle('is-scrolled', s.isActive) });

  // Hero text drifts as the image folds away
  // Hero: the window opens to full bleed, then the next section slides over it
  const frame = $('.hero__frame'), himg = $('.hero__media img');
  gsap.set(himg, { xPercent: -10 }); // keeps the model centred inside the narrow window
  const htl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + window.innerHeight * .6, scrub: .8, invalidateOnRefresh: true } });
  htl.fromTo(frame, { clipPath: () => heroInset() }, { clipPath: 'inset(0px 0px 0px 0px)', ease: 'power2.inOut', duration: 1, immediateRender: false }, 0)
     .fromTo(himg, { xPercent: -10 }, { xPercent: 0, ease: 'power2.inOut', duration: 1, immediateRender: false }, 0)
     .to('.hero__title .line--a', { xPercent: -60, opacity: 0, ease: 'power2.in', duration: .7 }, 0)
     .to('.hero__title .line--b', { xPercent: 60, opacity: 0, ease: 'power2.in', duration: .7 }, 0)
     .fromTo('.hero__fade', { opacity: 1, y: 0 }, { opacity: 0, y: -10, ease: 'power1.out', duration: .3, immediateRender: false }, 0);
  gsap.to('.hero__media', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top bottom', end: 'top top', scrub: true } });

  // Dark statement opens like a panel
  gsap.fromTo('.statement', { clipPath: 'inset(8% 6% 0% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'top 25%', scrub: .6 } });

  // Image reveals: a clean curtain + settle (compositor-only: clip-path + transform)
  $$('[data-gl]:not([data-gl="editorial"])').forEach(el => {
    const img = $('img', el); if (!img) return;
    const card = el.closest('.card'), list = card?.parentElement;
    const delay = card ? ([...list.children].indexOf(card) % 4) * .08 : 0;
    gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => {
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay });
      gsap.fromTo($$('img', el), { scale: 1.16 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay, clearProps: 'scale' });
    } });
  });
  // gentle parallax for editorial frames (image moves inside its frame)
  $$('[data-par]').forEach(el => {
    const img = $('img', el); if (!img || el.closest('.card')) return;
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Headings / reveals
  $$('[data-split]').forEach(h => gsap.from($$('.split-line > span', h), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
  $$('[data-reveal]').forEach(el => gsap.from(el, { y: 18, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  $$('.card__info').forEach(el => gsap.from(el, { y: 14, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true } }));

  // Statement: words fill in as you read
  gsap.to('.statement__big .w', { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: '.statement__big', start: 'top 78%', end: 'bottom 45%', scrub: true } });
  // Details: scattered frames drift at different depths
  [['.details__item:nth-of-type(1)', -60], ['.details__item:nth-of-type(2)', 40], ['.details__item:nth-of-type(3)', -110], ['.details__item:nth-of-type(4)', 70], ['.details__title', -30]].forEach(([s, d]) => {
    const el = $('.details--scatter ' + s); if (!el) return;
    gsap.fromTo(el, { y: -d }, { y: d, ease: 'none', scrollTrigger: { trigger: '.details--scatter', start: 'top bottom', end: 'bottom top', scrub: .6 } });
  });
  // Inline images reveal inside the sentence (clip only — the text never reflows)
  $$('.statement__big .inl').forEach(el => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 55%', scrub: .8 } })
      .fromTo(el, { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', ease: 'power2.inOut' }, 0)
      .fromTo($('img', el), { scale: 1.3 }, { scale: 1, ease: 'power2.out' }, 0);
  });

  // Editorial: zoom through the letters of “Linen” into the image
  buildMask();
  const mz = { p: 0 };
  const etl = gsap.timeline({ scrollTrigger: { trigger: '.editorial', start: 'top top', end: 'bottom bottom', scrub: 1.4 } });
  etl.to(mz, { p: 1, ease: 'power1.in', duration: 1, onUpdate: () => setMask(mz.p) }, 0)
     .to('.editorial__hint', { opacity: 0, duration: .15 }, 0)
     .to('.editorial__text', { opacity: 1, duration: .25 }, .85)
     .fromTo('.editorial__title span', { yPercent: 50 }, { yPercent: 0, stagger: .06, duration: .3, ease: 'power3.out' }, .85)
     .add(flyIn($$('.editorial__shots .fcard'), true), .85)
     .add(drift($$('.editorial__shots .fcard'), 60, true), 1.55)
     .to({}, { duration: .3 });
  setMask(0);
  window.addEventListener('resize', () => { buildMask(); setMask(mz.p); });

  // Best sellers: horizontal travel on desktop
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.best__track');
    const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none', force3D: true,
      scrollTrigger: { trigger: '.best__pin', start: 'top top', end: () => '+=' + dist(), pin: true, pinSpacing: true, scrub: .6, invalidateOnRefresh: true, fastScrollEnd: false,
        onUpdate: s => ($('.best__progress i').style.transform = `scaleX(${s.progress})`) },
    });
  });

  // Footer wordmark
  gsap.from('.fshot, .fpanel', { y: 60, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 80%', once: true } });
  gsap.fromTo('.fshot__img img', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  // Anchor links via Lenis
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault(); closeUI(); closeMenu();
    lenis.scrollTo(t, { offset: id === '#top' ? 0 : -40, duration: 1.4 });
  }));
}

// Editorial text-mask: an ivory veil with the word “Linen” cut out of it, drawn on a 2D canvas
const mask = { c: null, ctx: null, W: 0, H: 0, fs: 0, base: 0, o: [0, 0], dpr: 1, p: -1 };
const MASK_FONT = '"Instrument Serif", Georgia, serif';
function buildMask() {
  const c = $('.editorial__mask'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = document.documentElement.clientWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = W * dpr; c.height = H * dpr;
  ctx.font = `100px ${MASK_FONT}`;
  const fs = 100 * W * .84 / ctx.measureText('Linen').width;
  const base = H / 2 + fs * .32;
  Object.assign(mask, { c, ctx, W, H, fs, base, dpr, p: -1 });
  // thickest point inside the glyphs (same renderer as the veil, so it is exact)
  const k = .5, w = Math.ceil(W * k), h = Math.ceil(H * k);
  const t = document.createElement('canvas'); t.width = w; t.height = h;
  const tc = t.getContext('2d');
  tc.font = `${fs * k}px ${MASK_FONT}`; tc.textAlign = 'center'; tc.textBaseline = 'alphabetic';
  tc.fillText('Linen', w / 2, base * k);
  const a = tc.getImageData(0, 0, w, h).data, ins = i => a[i * 4 + 3] > 200;
  const hr = new Uint16Array(w * h), vr = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) { let st = -1; for (let x = 0; x <= w; x++) { const i = y * w + x; if (x < w && ins(i)) { if (st < 0) st = x; } else if (st >= 0) { for (let q = st; q < x; q++) hr[y * w + q] = Math.min(q - st + 1, x - q); st = -1; } } }
  for (let x = 0; x < w; x++) { let st = -1; for (let y = 0; y <= h; y++) { const i = y * w + x; if (y < h && ins(i)) { if (st < 0) st = y; } else if (st >= 0) { for (let q = st; q < y; q++) vr[q * w + x] = Math.min(q - st + 1, y - q); st = -1; } } }
  let best = 0, bi = 0;
  for (let i = 0; i < w * h; i++) { const m = Math.min(hr[i], vr[i]); if (m > best) { best = m; bi = i; } }
  mask.o = [(bi % w + .5) / k, (Math.floor(bi / w) + .5) / k];
}
function setMask(p) {
  const { c, ctx, W, H, fs, base, dpr, o } = mask; if (!ctx) return;
  if (Math.abs(p - mask.p) < .0005) return; mask.p = p;
  c.style.opacity = p > .985 ? 0 : 1;
  if (p > .985) return;
  const s = Math.pow(140, p);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#F4F1E9'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.translate(o[0], o[1]); ctx.scale(s, s); ctx.translate(-o[0], -o[1]);
  ctx.font = `${fs}px ${MASK_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('Linen', W / 2, base);
}

/* Floating cards: fly in, drift by depth on scroll, lean toward the pointer */
function flyIn(cards, asTimeline) {
  const tl = gsap.timeline({ paused: !asTimeline });
  cards.forEach((c, i) => {
    const r = parseFloat(c.dataset.rot || 0), d = parseFloat(c.dataset.depth || 1);
    tl.fromTo(c, { yPercent: 70 + d * 30, rotation: r * 1.8, opacity: 0 }, { yPercent: 0, rotation: r, opacity: 1, duration: asTimeline ? .7 : 1.8, ease: asTimeline ? 'sine.out' : 'power3.out' }, i * (asTimeline ? .1 : .14));
  });
  return tl;
}
function drift(cards, dist, asTimeline) {
  const tl = gsap.timeline();
  cards.forEach(c => { const d = parseFloat(c.dataset.depth || 1); tl.to(c, { y: -dist * d, rotation: `+=${(parseFloat(c.dataset.rot || 0) > 0 ? 1 : -1) * 2 * d}`, ease: 'sine.inOut', duration: asTimeline ? 1 : 1 }, 0); });
  return tl;
}
function pointerLean(zone, cards) {
  if (!finePointer || !zone) return;
  const qs = cards.map(c => { const el = c.querySelector('.fcard__in'), d = parseFloat(c.dataset.depth || 1); return { d, x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }) }; });
  zone.addEventListener('pointermove', e => {
    const r = zone.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    qs.forEach(q => { q.x(nx * 28 * q.d); q.y(ny * 20 * q.d); });
  });
  zone.addEventListener('pointerleave', () => qs.forEach(q => { q.x(0); q.y(0); }));
}
function flyZone(zone, cards, start = 'top 70%') {
  if (!zone || !cards.length) return;
  const intro = flyIn(cards, false);
  ScrollTrigger.create({ trigger: zone, start, once: true, onEnter: () => intro.play() });
  gsap.timeline({ scrollTrigger: { trigger: zone, start: 'top bottom', end: 'bottom top', scrub: 1 } }).add(drift(cards, 90, false));
  pointerLean(zone, cards);
}

function rollText() {
  $$('.nav--left a, .btn > span, .link--arrow').forEach(el => {
    if (el.querySelector('.roll')) return;
    const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const t = node.textContent.trim();
    const r = document.createElement('span'); r.className = 'roll';
    r.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`;
    el.replaceChild(r, node);
  });
}

function interactions() {
  rollText();
  pointerLean($('.editorial__pin'), $$('.editorial__shots .fcard'));
  flyZone($('.linen__fabric'), $$('.linen__fly .fcard'), 'top 75%');
  $$('[data-fabric-card]').forEach(b => b.addEventListener('click', () => $(`[data-fabric="${b.dataset.fabricCard}"]`)?.click()));
  // Marquee moves only with the scroll (direction + speed follow the reader)
  const mq = $('.marquee__track');
  if (mq) {
    let x = 0, skew = 0;
    gsap.ticker.add(() => {
      const v = lenis.velocity || 0;
      const half = mq.scrollWidth / 2;
      x -= v * .9;
      if (x <= -half) x += half; if (x > 0) x -= half;
      skew += (Math.max(-8, Math.min(8, v * .25)) - skew) * .1;
      mq.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
    });
  }

  // Card hover: close the quick-add tray when leaving
  $$('.card').forEach(card => card.addEventListener('mouseleave', () => $('.quick', card).classList.remove('is-open')));

  // Linen fabric swatches
  const fabric = $('.linen__canvas');
  $$('[data-fabric]').forEach(b => b.addEventListener('click', () => {
    $$('[data-fabric]').forEach(x => x.setAttribute('aria-checked', x === b));
    fabric.dataset.active = b.dataset.fabric;
  }));

  // Category hover image
  const fl = $('.cats__float'), flImg = $('img', fl);
  if (finePointer) {
    const xTo = gsap.quickTo(fl, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(fl, 'y', { duration: .6, ease: 'power3' });
    const list = $('.cats__list');
    list.addEventListener('mousemove', e => { xTo(e.clientX + 140); yTo(e.clientY); });
    $$('.cats__list a').forEach(a => a.addEventListener('mouseenter', () => { flImg.src = a.dataset.img; }));
    list.addEventListener('mouseenter', () => gsap.to(fl, { opacity: 1, scale: 1, duration: .5, ease: 'power3.out' }));
    list.addEventListener('mouseleave', () => gsap.to(fl, { opacity: 0, scale: .8, duration: .4 }));
  }

  // Cursor label over product images
  if (finePointer) {
    const cur = $('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', e => { cx(e.clientX + 16); cy(e.clientY + 16); }, { passive: true });
    // Show the label only while the pointer is really over a product image (also re-checked on scroll)
    let px = -1, py = -1, shown = false;
    const check = () => {
      if (px < 0) return;
      const el = document.elementFromPoint(px, py);
      const on = !!el?.closest('.card__link') && !openPanel;
      if (on !== shown) { shown = on; gsap.to(cur, on ? { scale: 1, opacity: 1, duration: .4, ease: 'power3.out' } : { scale: 0, opacity: 0, duration: .3 }); }
    };
    window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; check(); }, { passive: true });
    lenis.on('scroll', check);
    document.addEventListener('pointerleave', () => { px = -1; if (shown) { shown = false; gsap.to(cur, { scale: 0, opacity: 0, duration: .3 }); } });
  }

  // Magnetic primary CTA
  $$('.hero__cta').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .15, y: (e.clientY - r.top - r.height / 2) * .25, duration: .4 }); });
    b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.5)' }));
  });
}
