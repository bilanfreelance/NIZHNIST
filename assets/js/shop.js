// NIZHNIST — Shop / catalogue page
import { CATEGORIES } from './data.js?v=261026144635';

const COLOR_KEYS = c => (c === 'ivoryChocolate' ? ['ivory', 'chocolate'] : [c]);
const ORDER = ['zoria', 'mavka', 'kalyna', 'lesya', 'sonia', 'polissia', 'lada', 'vira']; // "Featured"

export function initShop(ctx) {
  const { $, $$, PRODUCTS, COLORS, SIZES, cardHTML, gsap, reduce, store } = ctx;
  const grid = $('.shop-grid');
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const state = {
    cat: CATEGORIES.includes(params.get('cat')) ? params.get('cat') : 'All',
    colors: new Set((params.get('color') || '').split(',').filter(Boolean)),
    sizes: new Set((params.get('size') || '').split(',').filter(Boolean)),
    sort: params.get('sort') || 'featured',
    cols: (() => { try { return localStorage.getItem('nz_cols') || '4'; } catch { return '4'; } })(),
  };

  // ---------- counts in tabs ----------
  const all = ORDER.map(id => PRODUCTS[id]);
  $$('.cat-tab').forEach(t => {
    const c = t.dataset.cat;
    $('.cat-tab__n', t).textContent = c === 'All' ? all.length : all.filter(p => p.cat === c).length;
  });

  // ---------- filter options (only real data) ----------
  const usedColors = [...new Set(all.flatMap(p => COLOR_KEYS(p.color)))];
  const usedSizes = SIZES.filter(s => all.some(p => p.sizes[s]));
  const swatch = k => `<button class="fopt fopt--color" data-color="${k}" aria-pressed="false"><i style="--c:${COLORS[k].hex}"></i>${COLORS[k].name}</button>`;
  $$('[data-fgroup="color"]').forEach(g => (g.innerHTML = usedColors.map(swatch).join('')));
  $$('[data-fgroup="size"]').forEach(g => (g.innerHTML = usedSizes.map(s => `<button class="fopt fopt--size" data-size="${s}" aria-pressed="false">${s}</button>`).join('')));

  // ---------- query ----------
  function results() {
    let list = all.filter(p =>
      (state.cat === 'All' || p.cat === state.cat) &&
      (!state.colors.size || COLOR_KEYS(p.color).some(c => state.colors.has(c))) &&
      (!state.sizes.size || [...state.sizes].some(s => p.sizes[s])));
    if (state.sort === 'new') list = [...list].sort((a, b) => (b.badge === 'New') - (a.badge === 'New'));
    if (state.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }
  const filtersActive = () => state.colors.size || state.sizes.size;

  function syncURL() {
    const q = new URLSearchParams();
    if (state.cat !== 'All') q.set('cat', state.cat);
    if (state.colors.size) q.set('color', [...state.colors].join(','));
    if (state.sizes.size) q.set('size', [...state.sizes].join(','));
    if (state.sort !== 'featured') q.set('sort', state.sort);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  function syncControls() {
    $$('.cat-tab').forEach(t => t.setAttribute('aria-selected', t.dataset.cat === state.cat));
    $$('[data-color]').forEach(b => b.setAttribute('aria-pressed', state.colors.has(b.dataset.color)));
    $$('[data-size].fopt').forEach(b => b.setAttribute('aria-pressed', state.sizes.has(b.dataset.size)));
    $$('.sort-opt').forEach(o => o.setAttribute('aria-checked', o.dataset.sort === state.sort));
    $('.sort-btn__v').textContent = $(`.sort-opt[data-sort="${state.sort}"]`).textContent;
    $$('.cols-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.cols === state.cols));
    grid.dataset.cols = state.cols;
    const n = state.colors.size + state.sizes.size;
    $('.filter-btn__n').textContent = n ? `(${n})` : '';
    // active chips
    const chips = [...[...state.colors].map(c => ({ k: 'color', v: c, l: COLORS[c].name })), ...[...state.sizes].map(s => ({ k: 'size', v: s, l: `Size ${s}` }))];
    $('.active-filters').innerHTML = chips.length
      ? chips.map(c => `<button class="achip" data-rm="${c.k}:${c.v}">${c.l}<i aria-hidden="true">×</i><span class="sr">Remove</span></button>`).join('') + `<button class="achip achip--clear" data-clear>Clear all</button>`
      : '';
  }

  const editorial = () => `
    <aside class="shop-edit" aria-label="Made to Feel Free">
      <div class="shop-edit__img"><img src="assets/img/decor/courtyard.webp" alt="Stone courtyard with olive branches and draped ivory linen" width="960" height="1280" loading="lazy"></div>
      <div class="shop-edit__txt">
        <p class="eyebrow">NIZHNIST</p>
        <p class="shop-edit__t">Made to <em>Feel Free.</em></p>
        <p class="shop-edit__p">Natural fabrics. Considered silhouettes. A little more room to breathe.</p>
      </div>
    </aside>`;

  let first = true;
  function render() {
    const list = results();
    $('.shop-count').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
    if (!list.length) {
      grid.innerHTML = `<div class="shop-empty"><p class="shop-empty__t">Nothing matches <em>just yet.</em></p><p>Try removing a filter — or explore the full collection.</p><button class="btn btn--dark" data-clear><span>Reset filters</span></button></div>`;
    } else {
      const cards = list.map((p, i) => cardHTML(p, i));
      // one editorial pause after the first row, only on the unfiltered "All" view
      if (state.cat === 'All' && !filtersActive() && list.length > 4) cards.splice(state.cols === '2' ? 2 : 4, 0, editorial());
      grid.innerHTML = cards.join('');
    }
    ctx.syncHearts();
    if (!reduce && gsap && !first) gsap.from(grid.children, { y: 26, opacity: 0, duration: .8, stagger: .05, ease: 'expo.out' });
    first = false;
    syncURL(); syncControls();
  }

  // ---------- events ----------
  $$('.cat-tab').forEach(t => t.addEventListener('click', () => { state.cat = t.dataset.cat; render(); }));
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-color]'); if (c && c.classList.contains('fopt')) { const k = c.dataset.color; state.colors.has(k) ? state.colors.delete(k) : state.colors.add(k); render(); return; }
    const s = e.target.closest('.fopt--size'); if (s) { const k = s.dataset.size; state.sizes.has(k) ? state.sizes.delete(k) : state.sizes.add(k); render(); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) { const [k, v] = rm.dataset.rm.split(':'); (k === 'color' ? state.colors : state.sizes).delete(v); render(); return; }
    if (e.target.closest('[data-clear]')) { state.colors.clear(); state.sizes.clear(); state.cat = 'All'; render(); return; }
    const so = e.target.closest('.sort-opt'); if (so) { state.sort = so.dataset.sort; closeSort(); render(); return; }
    const cb = e.target.closest('.cols-btn'); if (cb) { state.cols = cb.dataset.cols; try { localStorage.setItem('nz_cols', state.cols); } catch {} render(); return; }
    if (!e.target.closest('.sort')) closeSort();
  });
  const sortBtn = $('.sort-btn'), sortList = $('.sort-list');
  function closeSort() { sortList.classList.remove('is-open'); sortBtn.setAttribute('aria-expanded', 'false'); }
  sortBtn.addEventListener('click', e => { e.stopPropagation(); const o = !sortList.classList.contains('is-open'); sortList.classList.toggle('is-open', o); sortBtn.setAttribute('aria-expanded', o); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSort(); });
  $('.filter-btn').addEventListener('click', () => ctx.openUI('filters'));
  $('.filters__apply').addEventListener('click', () => ctx.closeUI());

  // toolbar shadow once it sticks
  const bar = $('.shop-bar');
  new IntersectionObserver(([en]) => bar.classList.toggle('is-stuck', en.intersectionRatio < 1), { threshold: [1], rootMargin: '-77px 0px 0px 0px' }).observe(bar);

  // recently viewed
  const recent = store.get('recent', []).filter(id => PRODUCTS[id]).slice(0, 4);
  if (recent.length) {
    $('.recent').hidden = false;
    $('.recent__grid').innerHTML = recent.map((id, i) => cardHTML(PRODUCTS[id], i + 4)).join('');
  }

  render();

  return {
    intro(tl) {
      tl.from('.shop-bar, .shop-grid > *', { y: 30, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out' }, .6);
    },
  };
}
