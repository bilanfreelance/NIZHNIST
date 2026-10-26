// Demo catalogue — names, prices and size availability are concept data.
const img = (n, k) => `assets/img/products/p${n}-${k}.webp`;
const set = n => ({ front: img(n, 'front'), alt: img(n, 'alt'), back: img(n, 'back'), macro: img(n, 'macro') });

export const COLORS = {
  ivory: { name: 'Ivory', hex: '#EAE2D2' },
  sand: { name: 'Sand', hex: '#D6C3A3' },
  olive: { name: 'Olive', hex: '#66704A' },
  chocolate: { name: 'Chocolate', hex: '#4A3226' },
  ivoryChocolate: { name: 'Ivory / Chocolate', hex: 'linear-gradient(90deg,#EAE2D2 50%,#4A3226 50%)' },
};

// A. Clothing sets
// B. Individual garments
export const PRODUCTS = {
  zoria:    { id: 'zoria',    no: '01', name: 'The Essential Set',             cat: 'Sets',      sub: 'Ivory linen shirt + matching wide-leg trousers',        price: 189, color: 'ivory',          badge: 'New',         sizes: { XS: 1, S: 1, M: 1, L: 0 }, img: set(1) },
  sonia:    { id: 'sonia',    no: '02', name: 'The Summer Set',                cat: 'Sets',      sub: 'Sand linen shirt + matching linen shorts',              price: 159, color: 'sand',           sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(2) },
  polissia: { id: 'polissia', no: '03', name: 'The Linen Vest',                cat: 'Sets',      sub: 'Sleeveless linen vest + coordinating trousers',         price: 179, color: 'chocolate',      sizes: { XS: 0, S: 1, M: 1, L: 1 }, img: set(3) },
  lada:     { id: 'lada',     no: '04', name: 'The Gathered Blouse + Trousers',cat: 'Sets',      sub: 'Gathered ivory blouse + chocolate linen trousers',      price: 175, color: 'ivoryChocolate', sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(8) },
  lesya:    { id: 'lesya',    no: '05', name: 'The Ivory Jumpsuit',            cat: 'Jumpsuits', sub: 'One-piece, minimalist and relaxed',                     price: 149, color: 'ivory',          badge: 'New',         sizes: { XS: 1, S: 1, M: 0, L: 1 }, img: set(4) },
  mavka:    { id: 'mavka',    no: '06', name: 'The Olive Dress',               cat: 'Dresses',   sub: 'An elegant, understated silhouette',                    price: 139, color: 'olive',          badge: 'Best seller', sizes: { XS: 0, S: 1, M: 1, L: 1 }, img: set(5) },
  vira:     { id: 'vira',     no: '07', name: 'The Linen Shirt',               cat: 'Shirts',    sub: 'Relaxed fit, timeless design',                          price: 89, color: 'ivory',          sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(6) },
  kalyna:   { id: 'kalyna',   no: '08', name: 'The Sand Wrap Dress',           cat: 'Dresses',   sub: 'Wrap-style shirt dress, natural and relaxed',           price: 155, color: 'sand',           badge: 'New',         sizes: { XS: 1, S: 1, M: 1, L: 0 }, img: set(7) },
};

export const LOOKS = {
  hero:  { title: 'The Essential Set', items: ['zoria'] },
  cocoa: { title: 'Ivory over chocolate', items: ['vira', 'polissia'] },
};

export const FREE_SHIPPING = 200; // demo threshold, USD

export const money = n => '$' + Math.round(n).toLocaleString('en-US');
