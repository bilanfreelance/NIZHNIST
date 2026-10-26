// NIZHNIST — content pages: contact & account forms, wishlist page
export function initContent(ctx) {
  const { $, $$, PRODUCTS, cardHTML, getWish, syncHearts } = ctx;
  $$('.help-nav a').forEach(a => { if (new URL(a.href).pathname === location.pathname) a.setAttribute('aria-current', 'page'); });
  const rules = {
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email, e.g. name@example.com',
    msg: v => v.length >= 10 || 'Tell us a little more (10+ characters)',
    pass: v => v.length >= 8 || 'At least 8 characters',
  };
  const check = el => {
    const box = el.closest('.fld'); if (!box || el.closest('[hidden]')) return true;
    const v = el.value.trim();
    let ok = el.required ? !!v || 'This field is required' : true;
    if (ok === true && v && rules[el.dataset.rule]) ok = rules[el.dataset.rule](v);
    box.classList.toggle('is-error', ok !== true); box.classList.toggle('is-ok', ok === true && !!v);
    $('.fld__err', box).textContent = ok === true ? '' : ok;
    return ok === true;
  };
  $$('form[data-form]').forEach(f => {
    f.addEventListener('input', e => { if (e.target.closest('.fld.is-error')) check(e.target); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const bad = $$('input, select, textarea', f).filter(el => !check(el));
      const ok = $('.cform__ok', f);
      if (bad.length) { bad[0].focus(); ok.textContent = ''; return; }
      const b = $('button[type="submit"]', f); b.classList.add('is-loading'); b.disabled = true;
      setTimeout(() => {
        b.classList.remove('is-loading'); b.disabled = false;
        ok.textContent = f.dataset.form === 'contact' ? 'Thank you — your message is with us. We’ll reply within one business day.' : 'Demo: accounts aren’t connected yet — your bag and wishlist stay saved in this browser.';
        if (f.dataset.form === 'contact') f.reset();
      }, 800);
    });
  });
  // account tabs
  $$('.acct__tabs [data-tab]').forEach(t => t.addEventListener('click', () => {
    const up = t.dataset.tab === 'up';
    $$('.acct__tabs [data-tab]').forEach(x => x.setAttribute('aria-selected', x === t));
    $$('.acct-up').forEach(x => (x.hidden = !up)); $('#a-name') && ($('#a-name').required = up);
    $('.acct__cta').textContent = up ? 'Create account' : 'Sign in';
  }));
  // wishlist page
  const wl = $('.wl__grid');
  if (wl) {
    const render = () => {
      const ids = getWish().filter(id => PRODUCTS[id]);
      wl.innerHTML = ids.length ? ids.map((id, i) => cardHTML(PRODUCTS[id], i)).join('') : `<div class="shop-empty"><p class="shop-empty__t">Nothing saved <em>yet.</em></p><p>Tap the heart on any piece to keep it here.</p><a href="shop.html" class="btn btn--dark"><span>Explore the collection</span></a></div>`;
      syncHearts();
    };
    document.addEventListener('nz:wish', render); render();
  }
}
