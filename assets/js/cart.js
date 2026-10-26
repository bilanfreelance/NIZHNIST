// NIZHNIST — Bag page
import { totals, recommend, PROMOS } from './totals.js?v=261026101920';

export function initCart(ctx) {
  const { $, $$, PRODUCTS, COLORS, SIZES, money, cardHTML, toast, getCart, setCart, getWish, toggleWish, swatchHTML, productURL, store, gsap, reduce, FREE_SHIPPING } = ctx;
  const root = $('.bag');
  if (!root) return;
  let lastRemoved = null;

  function line(l, i) {
    const p = PRODUCTS[l.id], c = COLORS[p.color];
    const opts = SIZES.map(s => `<option value="${s}" ${s === l.size ? 'selected' : ''} ${p.sizes[s] ? '' : 'disabled'}>${s}${p.sizes[s] ? '' : ' — sold out'}</option>`).join('');
    return `<article class="bline" data-i="${i}">
      <a href="${productURL(p.id)}" class="bline__img"><img src="${p.img.front}" alt="${p.name}" width="960" height="1280"></a>
      <div class="bline__body">
        <div class="bline__top"><div><p class="eyebrow">${p.cat}</p><h2 class="bline__name"><a href="${productURL(p.id)}">${p.name}</a></h2><p class="bline__sub">${p.sub}</p></div><p class="bline__price">${money(p.price * l.qty)}${l.qty > 1 ? `<small>${money(p.price)} each</small>` : ''}</p></div>
        <div class="bline__opts">
          <span class="bline__color">${swatchHTML(p.color)}${c.name}</span>
          <label class="bline__size">Size <select data-size aria-label="Size">${opts}</select></label>
          <div class="qty"><button data-q="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">${l.qty}</span><button data-q="1" aria-label="Increase quantity">+</button></div>
        </div>
        <div class="bline__acts"><button data-later>Save for later</button><button data-rm>Remove</button><span class="bline__ok">✓ In stock · ships in 1–2 days</span></div>
      </div>
    </article>`;
  }

  function render() {
    const t = totals(ctx);
    $('.bag-title__n').textContent = t.count ? `(${t.count})` : '';
    root.classList.toggle('is-empty', !t.cart.length);
    // free shipping meter
    const pct = Math.min(100, ((t.sub - t.discount) / FREE_SHIPPING) * 100);
    $('.meter__t').innerHTML = !t.cart.length ? 'Free shipping on orders over ' + money(FREE_SHIPPING) : t.free ? '<b>You’ve unlocked free shipping.</b> Nice choice.' : `Add <b>${money(t.left)}</b> more for <b>free shipping</b>`;
    $('.meter__bar i').style.width = (t.cart.length ? pct : 0) + '%';
    // lines
    $('.bag__lines').innerHTML = t.cart.length ? t.cart.map(line).join('') : `
      <div class="bag-empty"><p class="bag-empty__t">Your bag is <em>empty.</em></p><p>Linen pieces you add will appear here — your saved items are below.</p><a href="shop.html" class="btn btn--dark"><span>Explore the collection</span><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>`;
    // summary
    $('.sum__sub').textContent = money(t.sub);
    $('.sum__disc').hidden = !t.discount;
    $('.sum__disc b').textContent = `−${money(t.discount)}`;
    $('.sum__disc span').textContent = `Promo ${t.code}`;
    $('.sum__ship').textContent = !t.cart.length ? '—' : t.free ? 'Free' : `${money(t.ship)} · free over ${money(FREE_SHIPPING)}`;
    $('.sum__total').textContent = money(t.total);
    $('.sum__checkout').classList.toggle('is-disabled', !t.cart.length);
    $('.promo__applied').innerHTML = t.code ? `<span>✓ ${t.code} — ${t.promo.label}</span><button data-unpromo>Remove</button>` : '';
    $('.promo').classList.toggle('has-code', !!t.code);
    // recommendations
    const rec = recommend(ctx, 4);
    $('.bag-rec__grid').innerHTML = rec.map((id, i) => cardHTML(PRODUCTS[id], i + 2)).join('');
    // saved for later = wishlist
    const saved = getWish().filter(id => PRODUCTS[id]);
    $('.bag-saved').hidden = !saved.length;
    $('.bag-saved__grid').innerHTML = saved.map((id, i) => cardHTML(PRODUCTS[id], i + 2)).join('');
    ctx.syncHearts();
  }

  root.addEventListener('click', e => {
    const row = e.target.closest('.bline'); const cart = getCart();
    if (row) {
      const i = +row.dataset.i;
      const q = e.target.closest('[data-q]');
      if (q) { cart[i].qty = Math.max(1, Math.min(9, cart[i].qty + +q.dataset.q)); setCart(cart); return; }
      if (e.target.closest('[data-rm]') || e.target.closest('[data-later]')) {
        const later = !!e.target.closest('[data-later]');
        const it = cart[i];
        const kill = () => { lastRemoved = { it, i }; cart.splice(i, 1); setCart(cart); if (later && !getWish().includes(it.id)) toggleWish(it.id); undoToast(later ? 'Saved for later' : `${PRODUCTS[it.id].name} removed`); };
        if (gsap && !reduce) gsap.to(row, { opacity: 0, x: 30, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, duration: .45, ease: 'power3.inOut', onComplete: kill }); else kill();
        return;
      }
    }
    if (e.target.closest('[data-unpromo]')) { store.set('promo', ''); render(); }
    if (e.target.closest('.sum__checkout.is-disabled')) e.preventDefault();
  });
  root.addEventListener('change', e => {
    const s = e.target.closest('[data-size]'); if (!s) return;
    const cart = getCart(); const i = +s.closest('.bline').dataset.i;
    const dup = cart.findIndex((l, k) => k !== i && l.id === cart[i].id && l.size === s.value);
    if (dup > -1) { cart[dup].qty += cart[i].qty; cart.splice(i, 1); } else cart[i].size = s.value;
    setCart(cart); toast(`Size updated to ${s.value}`);
  });

  // undo toast
  const ut = $('.undo');
  let utT;
  function undoToast(msg) {
    $('.undo__t').textContent = msg; ut.classList.add('is-on');
    clearTimeout(utT); utT = setTimeout(() => ut.classList.remove('is-on'), 5000);
  }
  $('.undo__btn').addEventListener('click', () => {
    if (!lastRemoved) return; const cart = getCart(); cart.splice(lastRemoved.i, 0, lastRemoved.it); lastRemoved = null; setCart(cart); ut.classList.remove('is-on');
  });

  // promo
  $('.promo').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('.promo input').value.trim().toUpperCase(), msg = $('.promo__msg');
    if (!v) { msg.textContent = 'Enter a code.'; return; }
    if (!PROMOS[v]) { msg.textContent = `“${v}” isn’t a valid code. Try LINEN10.`; $('.promo').classList.add('is-error'); return; }
    store.set('promo', v); msg.textContent = ''; $('.promo').classList.remove('is-error'); $('.promo input').value = ''; render(); toast(`${v} applied — ${PROMOS[v].label}`);
  });

  document.addEventListener('nz:cart', render);
  render();

  return { intro(tl) { tl.from('.bline, .sum', { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out' }, .5); } };
}
