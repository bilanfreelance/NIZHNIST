// Shared order maths for the bag and checkout (demo rules)
export const PROMOS = { LINEN10: { label: '10% off', rate: .10 }, WELCOME15: { label: '15% off your first order', rate: .15 } };
export const SHIPPING = {
  standard: { label: 'Standard', eta: '3–5 business days', price: 9 },
  express: { label: 'Express', eta: '1–2 business days', price: 19 },
};

export function totals(ctx, method = 'standard') {
  const { getCart, PRODUCTS, FREE_SHIPPING, store } = ctx;
  const cart = getCart();
  const sub = cart.reduce((s, l) => s + PRODUCTS[l.id].price * l.qty, 0);
  const code = store.get('promo', '');
  const promo = PROMOS[code];
  const discount = promo ? Math.round(sub * promo.rate) : 0;
  const free = sub - discount >= FREE_SHIPPING;
  const ship = !cart.length ? 0 : method === 'express' ? SHIPPING.express.price : free ? 0 : SHIPPING.standard.price;
  return { cart, sub, code: promo ? code : '', promo, discount, free, ship, total: sub - discount + ship, count: cart.reduce((s, l) => s + l.qty, 0), left: Math.max(0, FREE_SHIPPING - (sub - discount)) };
}

// complementary pieces not already in the bag
const PAIRS = { vira: ['polissia', 'zoria'], zoria: ['vira', 'lada'], sonia: ['zoria', 'kalyna'], polissia: ['vira', 'lada'], lada: ['vira', 'polissia'], lesya: ['kalyna', 'mavka'], mavka: ['kalyna', 'lesya'], kalyna: ['mavka', 'sonia'] };
export function recommend(ctx, n = 4) {
  const { getCart, PRODUCTS } = ctx;
  const inBag = new Set(getCart().map(l => l.id));
  const seed = getCart().flatMap(l => PAIRS[l.id] || []);
  return [...new Set([...seed, 'mavka', 'zoria', 'vira', 'kalyna', 'lesya', 'sonia', 'lada', 'polissia'])].filter(id => PRODUCTS[id] && !inBag.has(id)).slice(0, n);
}
