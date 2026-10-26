// NIZHNIST — Product detail page
import { INFO, SIZE_CHART } from './data.js?v=261026125231';

export function initProduct(ctx) {
  const { swatchHTML, $, $$, PRODUCTS, COLORS, SIZES, money, cardHTML, addToCart, renderCart, openUI, toast, toggleWish, isWished, gsap, reduce, store, productURL } = ctx;
  const root = $('.pdp');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('p');
  const p = PRODUCTS[id] || PRODUCTS.zoria;
  const info = INFO[p.id];
  const c = COLORS[p.color];
  let size = null;

  // remember for "recently viewed"
  store.set('recent', [p.id, ...store.get('recent', []).filter(x => x !== p.id)].slice(0, 6));

  // ---------- meta ----------
  document.title = `${p.name} — NIZHNIST`;
  $('meta[name="description"]')?.setAttribute('content', `${p.name} — ${info.desc}`);
  $('.crumb__cat').textContent = p.cat; $('.crumb__cat').href = `shop.html?cat=${p.cat}`;
  $('.crumb__name').textContent = p.name;

  // ---------- gallery ----------
  const views = [['front', 'Front'], ['alt', 'Movement'], ['back', 'Fit & silhouette'], ['macro', 'Linen detail']];
  $('.pdp__gallery').innerHTML = views.map(([k, l], i) => `
    <figure class="pg" data-i="${i}" ${i === 0 ? 'data-first' : ''}>
      <button class="pg__btn" aria-label="Open image ${i + 1} of 4: ${l}">
        <img src="${p.img[k]}" alt="${p.name} — ${l.toLowerCase()}" width="960" height="1280" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
      </button>
      <figcaption>0${i + 1} <span>/ ${l}</span></figcaption>
    </figure>`).join('');
  $('.pdp__dots').innerHTML = views.map((v, i) => `<button class="pdot" data-go="${i}" aria-label="Go to image ${i + 1}"><span>0${i + 1}</span></button>`).join('');

  // ---------- info ----------
  $('.pdp__cat').textContent = `${p.cat} · ${p.no} / 08`;
  $('.pdp__name').textContent = p.name;
  $('.pdp__price').textContent = money(p.price);
  $('.pdp__desc').textContent = info.desc;
  $('.pdp__pieces').innerHTML = info.pieces ? `<span>Includes</span>${info.pieces.map(x => `<b>${x}</b>`).join('<i>+</i>')}` : '';
  $('.pdp__pieces').hidden = !info.pieces;
  $('.pdp__color').innerHTML = `${swatchHTML(p.color)}Colour <b>${c.name}</b>`;
  $('.pdp__sizes').innerHTML = SIZES.map(s => `<button class="size" role="radio" aria-checked="false" data-size="${s}" ${p.sizes[s] ? '' : 'aria-disabled="true"'}>${s}${p.sizes[s] ? '' : '<small>Sold out</small>'}</button>`).join('');
  $('.pdp__fit').textContent = info.fit;
  $('.acc-desc').textContent = `${info.desc} ${info.pieces ? 'Sold as a set — both pieces in one size.' : ''}`;
  $('.acc-fit').textContent = `${info.fit} If you are between sizes, choose your usual size for an easy drape or size down for a closer fit.`;
  $('.sticky-buy__name').textContent = p.name;
  $('.sticky-buy__price').textContent = money(p.price);
  $('.add__p').textContent = money(p.price);

  const soldOut = SIZES.filter(s => !p.sizes[s]);
  $('.pdp__stock').innerHTML = soldOut.length ? `<i></i>In stock · ${soldOut.join(', ')} sold out — <button class="notify">notify me</button>` : '<i></i>In stock in all sizes';

  // ---------- size ----------
  const err = $('.pdp__err');
  function setSize(s) {
    size = s;
    $$('.pdp__sizes .size').forEach(b => b.setAttribute('aria-checked', b.dataset.size === s));
    $$('.sg-table tr[data-size]').forEach(r => r.classList.toggle('is-sel', r.dataset.size === s));
    err.textContent = '';
    $('.sticky-buy__size').textContent = s ? `Size ${s}` : 'Select size';
  }
  $('.pdp__sizes').addEventListener('click', e => {
    const b = e.target.closest('.size'); if (!b) return;
    if (b.getAttribute('aria-disabled') === 'true') { err.textContent = `Size ${b.dataset.size} is sold out — tap “notify me” and we'll email you.`; return; }
    setSize(b.dataset.size);
  });
  root.addEventListener('click', e => { if (e.target.closest('.notify')) toast('We’ll let you know when it’s back — demo'); });

  // ---------- add to bag ----------
  const addBtn = $('.pdp__add');
  function needSize() {
    err.textContent = 'Please select a size.';
    const box = $('.pdp__sizes');
    const y = box.getBoundingClientRect().top + window.scrollY - 160;
    if (box.getBoundingClientRect().top < 80 || box.getBoundingClientRect().bottom > innerHeight) window.scrollTo({ top: y, behavior: 'smooth' });
    box.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 320, delay: 150 });
  }
  function add(btn) {
    if (!size) return needSize();
    if (btn.disabled) return;
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      btn.classList.remove('is-loading'); btn.disabled = false;
      addToCart(p.id, size);
      toast(`${p.name} · ${size} added to bag`);
      renderCart(); openUI('cart');
    }, 650);
  }
  addBtn.addEventListener('click', () => add(addBtn));
  $('.sticky-buy__btn').addEventListener('click', e => add(e.currentTarget));

  // wishlist
  const wb = $('.pdp__wish');
  const syncWish = () => { const on = isWished(p.id); wb.setAttribute('aria-pressed', on); $('span', wb).textContent = on ? 'Saved' : 'Save'; };
  wb.addEventListener('click', () => { toggleWish(p.id); syncWish(); });
  syncWish();

  // ---------- size guide (keeps the selected size) ----------
  $('.sg-table tbody').innerHTML = SIZE_CHART.map(r => `<tr data-size="${r[0]}"><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  $('.sg-set').hidden = !info.pieces;
  $$('.open-sg').forEach(b => b.addEventListener('click', () => openUI('sizeguide')));
  $('.sg-table tbody').addEventListener('click', e => { const r = e.target.closest('tr[data-size]'); if (r && p.sizes[r.dataset.size]) setSize(r.dataset.size); });

  // ---------- lightbox ----------
  const lb = $('.lb'), lbImg = $('.lb__img'), lbN = $('.lb__n');
  let cur = 0;
  const srcs = views.map(([k]) => p.img[k]);
  function show(i, dir = 0) {
    cur = (i + srcs.length) % srcs.length;
    lbN.textContent = `0${cur + 1} / 04 — ${views[cur][1]}`;
    if (gsap && !reduce && dir) {
      gsap.to(lbImg, { opacity: 0, x: -30 * dir, duration: .2, ease: 'power2.in', onComplete: () => { lbImg.src = srcs[cur]; gsap.fromTo(lbImg, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: .45, ease: 'expo.out' }); } });
    } else lbImg.src = srcs[cur];
    lbImg.alt = `${p.name} — ${views[cur][1].toLowerCase()}`;
  }
  $('.pdp__gallery').addEventListener('click', e => { const f = e.target.closest('.pg'); if (!f) return; show(+f.dataset.i); openUI('lb'); });
  $('.lb__prev').addEventListener('click', () => show(cur - 1, -1));
  $('.lb__next').addEventListener('click', () => show(cur + 1, 1));
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') show(cur + 1, 1);
    if (e.key === 'ArrowLeft') show(cur - 1, -1);
  });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (tx == null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1), d < 0 ? 1 : -1); tx = null; });

  // ---------- gallery progress (desktop dots / mobile counter) ----------
  const figs = $$('.pg');
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { const i = +en.target.dataset.i; $$('.pdot').forEach((d, k) => d.classList.toggle('is-on', k === i)); $('.pdp__count').textContent = `0${i + 1} / 04`; }
  }), { threshold: .55, root: null });
  figs.forEach(f => io.observe(f));
  $('.pdp__dots').addEventListener('click', e => { const d = e.target.closest('[data-go]'); if (d) figs[+d.dataset.go].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); });

  // ---------- sticky buy bar (mobile) ----------
  const sb = $('.sticky-buy'), foot = $('.footer');
  let ticking = false;
  const checkBar = () => { ticking = false; const a = addBtn.getBoundingClientRect(), f = foot.getBoundingClientRect(); sb.classList.toggle('is-on', a.bottom < 0); sb.classList.toggle('is-hide', f.top < innerHeight); };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(checkBar); } }, { passive: true });

  // ---------- complete the look + linen story ----------
  const rel = info.related.filter(x => x !== p.id).slice(0, 3);
  $('.ctl__grid').innerHTML = rel.map((x, i) => cardHTML(PRODUCTS[x], i + 2)).join('');
  $('.pdp-linen__img img').src = p.img.macro;
  $('.pdp-linen__img img').alt = `${p.name} — linen texture close-up`;

  setSize(null);

  return {
    intro(tl) {
      tl.from('.pg', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, stagger: .12, ease: 'expo.inOut' }, .3)
        .from('.pg img', { scale: 1.14, duration: 1.8, stagger: .12, ease: 'expo.out', clearProps: 'scale' }, .3)
        .from('.pdp__info > *', { y: 20, opacity: 0, duration: .9, stagger: .04, ease: 'expo.out' }, .55);
    },
  };
}
