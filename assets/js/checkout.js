// NIZHNIST — Checkout (demo: nothing is sent anywhere)
import { totals, recommend, SHIPPING, PROMOS } from './totals.js?v=261026102506';

export function initCheckout(ctx) {
  const { $, $$, PRODUCTS, COLORS, money, getCart, setCart, addToCart, toast, store, swatchHTML, gsap, reduce } = ctx;
  const form = $('.co-form');
  if (!form) return;
  let method = 'standard';

  // ---------- summary ----------
  function renderSummary() {
    const t = totals(ctx, method);
    if (!t.cart.length && !$('.co').classList.contains('is-done')) $('.co').classList.add('is-empty');
    $('.cos__lines').innerHTML = t.cart.map(l => {
      const p = PRODUCTS[l.id];
      return `<div class="cos__line"><span class="cos__img"><img src="${p.img.front}" alt="" width="64" height="85"><i>${l.qty}</i></span><span class="cos__meta"><b>${p.name}</b><em>${swatchHTML(p.color)}${COLORS[p.color].name} · ${l.size}</em></span><span class="cos__p">${money(p.price * l.qty)}</span></div>`;
    }).join('');
    $('.cos__sub').textContent = money(t.sub);
    $('.cos__disc').hidden = !t.discount; $('.cos__disc b').textContent = `−${money(t.discount)}`; $('.cos__disc span').textContent = `Promo ${t.code}`;
    $('.cos__ship').textContent = t.ship ? money(t.ship) : 'Free';
    $('.cos__total').textContent = money(t.total);
    $$('.co-total-inline').forEach(e => (e.textContent = money(t.total)));
    $('.ship-standard').textContent = t.free ? 'Free' : money(SHIPPING.standard.price);
    // one-click add-on
    const add = recommend(ctx, 1)[0];
    $('.co-bump').hidden = !add;
    if (add) {
      const p = PRODUCTS[add]; const sz = ['S', 'M', 'XS', 'L'].find(s => p.sizes[s]);
      $('.co-bump').innerHTML = `<img src="${p.img.front}" alt="" width="64" height="85"><span><em>Complete the look</em><b>${p.name}</b><small>${money(p.price)} · size</small> <select class="co-bump__size" aria-label="Size">${['XS', 'S', 'M', 'L'].map(s => `<option ${s === sz ? 'selected' : ''} ${p.sizes[s] ? '' : 'disabled'}>${s}</option>`).join('')}</select></span><button type="button" class="co-bump__add" data-id="${add}">Add +</button>`;
    }
    $('.cos-promo__applied').textContent = t.code ? `✓ ${t.code} applied — ${t.promo.label}` : '';
  }
  $('.co-bump').addEventListener('click', e => {
    const b = e.target.closest('.co-bump__add'); if (!b) return;
    addToCart(b.dataset.id, $('.co-bump__size').value); toast(`${PRODUCTS[b.dataset.id].name} added to your order`);
  });
  $('.cos-promo').addEventListener('submit', e => {
    e.preventDefault(); const v = $('.cos-promo input').value.trim().toUpperCase();
    if (!PROMOS[v]) { $('.cos-promo__applied').textContent = v ? `“${v}” isn’t a valid code.` : ''; return; }
    store.set('promo', v); $('.cos-promo input').value = ''; renderSummary();
  });
  $('.cos__toggle').addEventListener('click', () => { const o = $('.cos').classList.toggle('is-open'); $('.cos__toggle').setAttribute('aria-expanded', o); });

  // ---------- shipping method ----------
  form.addEventListener('change', e => { if (e.target.name === 'ship') { method = e.target.value; renderSummary(); } });

  // ---------- input helpers ----------
  const fmt = {
    card: v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(),
    exp: v => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; },
    cvc: v => v.replace(/\D/g, '').slice(0, 4),
  };
  form.addEventListener('input', e => {
    const f = e.target.dataset.fmt; if (f) e.target.value = fmt[f](e.target.value);
    if (e.target.closest('.fld.is-error')) validate(e.target);
  });
  form.addEventListener('focusout', e => { if (e.target.matches('input[required], select[required]') && e.target.value) validate(e.target); });

  const rules = {
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email, e.g. name@example.com',
    card: v => v.replace(/\s/g, '').length >= 15 || 'Enter the full card number',
    exp: v => { const m = v.match(/^(\d{2}) \/ (\d{2})$/); if (!m) return 'Use MM / YY'; const mm = +m[1]; return (mm >= 1 && mm <= 12) || 'Check the month'; },
    cvc: v => v.length >= 3 || '3–4 digits on the back',
    postal: v => v.trim().length >= 3 || 'Enter your postal code',
  };
  function validate(el) {
    const box = el.closest('.fld'); if (!box) return true;
    const v = el.value.trim();
    let ok = el.required ? !!v || 'This field is required' : true;
    if (ok === true && v && rules[el.dataset.rule]) ok = rules[el.dataset.rule](v);
    box.classList.toggle('is-error', ok !== true);
    box.classList.toggle('is-ok', ok === true && !!v);
    $('.fld__err', box).textContent = ok === true ? '' : ok;
    return ok === true;
  }

  // ---------- payment method ----------
  form.addEventListener('change', e => { if (e.target.name === 'pay') $$('.pay-card').forEach(c => (c.hidden = e.target.value !== 'card')); });

  // ---------- steps (progress driven by completed fields) ----------
  const steps = $$('.co-step'), prog = $$('.co-prog li');
  const filled = el => {
    if (el.closest('[hidden]')) return null;
    const v = el.value.trim(); if (!v) return false;
    const r = rules[el.dataset.rule]; return r ? r(v) === true : true;
  };
  function updateProg() {
    let current = -1;
    steps.forEach((s, i) => {
      const req = $$('input[required], select[required]', s).map(filled).filter(x => x !== null);
      const pct = req.length ? req.filter(Boolean).length / req.length : 1;
      const li = prog[i];
      li.style.setProperty('--p', pct);
      li.classList.toggle('is-done', pct === 1);
      if (pct < 1 && current < 0) current = i;
    });
    prog.forEach((li, i) => li.classList.toggle('is-on', i === current));
    $('.co-place').classList.toggle('is-ready', current < 0);
  }
  form.addEventListener('input', updateProg);
  form.addEventListener('change', updateProg);
  prog.forEach((li, i) => li.addEventListener('click', () => { steps[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('input, select', steps[i])?.focus({ preventScroll: true }), 600); }));
  setTimeout(updateProg, 400); // after browser autofill

  // ---------- express pay (demo) ----------
  $$('.xpay').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.name} — demo only, use the form below`)));

  // ---------- place order ----------
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fields = $$('input[required], select[required]', form).filter(el => !el.closest('[hidden]'));
    const bad = fields.filter(el => !validate(el));
    if (bad.length) {
      $('.co-err').textContent = `Please check ${bad.length} field${bad.length > 1 ? 's' : ''} highlighted below.`;
      bad[0].focus({ preventScroll: true }); bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!getCart().length) { $('.co-err').textContent = 'Your bag is empty.'; return; }
    $('.co-err').textContent = '';
    const btn = $('.co-place'); btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      const t = totals(ctx, method);
      const no = 'NZ-' + String(Date.now()).slice(-6);
      $('.done__no').textContent = no;
      $('.done__email').textContent = $('#co-email').value;
      $('.done__total').textContent = money(t.total);
      $('.done__lines').innerHTML = $('.cos__lines').innerHTML;
      $('.co').classList.add('is-done');
      setCart([]); store.set('promo', '');
      window.scrollTo({ top: 0 });
      if (gsap && !reduce) gsap.from('.done > *', { y: 24, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out' });
    }, 1200);
  });

  document.addEventListener('nz:cart', renderSummary);
  renderSummary();
  return { intro(tl) { tl.from('.co-main > *, .cos', { y: 24, opacity: 0, duration: .9, stagger: .05, ease: 'expo.out' }, .5); } };
}
