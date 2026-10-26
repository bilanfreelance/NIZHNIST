// Demo catalogue — names, prices and size availability are concept data.
const img = (n, k) => `assets/img/products/p${n}-${k}.webp`;
const set = n => ({ front: img(n, 'front'), alt: img(n, 'alt'), back: img(n, 'back'), macro: img(n, 'macro') });

export const COLORS = {
  ivory: { name: 'Ivory', hex: '#EAE2D2' },
  sand: { name: 'Sand', hex: '#D6C3A3' },
  olive: { name: 'Olive', hex: '#66704A' },
  cocoa: { name: 'Cocoa', hex: '#4A3226' },
};

export const PRODUCTS = {
  zoria:    { id: 'zoria',    name: 'Zoria Linen Set',        cat: 'Sets',     sub: 'Relaxed shirt + wide-leg trousers', price: 4850, color: 'ivory', badge: 'New',         sizes: { XS: 1, S: 1, M: 1, L: 0 }, img: set(1) },
  sonia:    { id: 'sonia',    name: 'Sonia Shirt & Shorts',   cat: 'Sets',     sub: 'Boxy shirt + tailored shorts',      price: 3900, color: 'sand',  sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(2) },
  polissia: { id: 'polissia', name: 'Polissia Vest Set',      cat: 'Sets',     sub: 'Waistcoat + wide-leg trousers',     price: 5200, color: 'cocoa', sizes: { XS: 0, S: 1, M: 1, L: 1 }, img: set(3) },
  lesya:    { id: 'lesya',    name: 'Lesya Linen Jumpsuit',   cat: 'Jumpsuits',sub: 'Square neck, gathered wide leg',    price: 4300, color: 'ivory', badge: 'New',         sizes: { XS: 1, S: 1, M: 0, L: 1 }, img: set(4) },
  mavka:    { id: 'mavka',    name: 'Mavka Maxi Dress',       cat: 'Dresses',  sub: 'Sleeveless, full gathered skirt',    price: 4600, color: 'olive', badge: 'Best seller', sizes: { XS: 0, S: 1, M: 1, L: 1 }, img: set(5) },
  vira:     { id: 'vira',     name: 'Vira Oversized Shirt',   cat: 'Shirts',   sub: 'Dropped shoulder, rolled sleeves',  price: 2700, color: 'ivory', sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(6) },
  kalyna:   { id: 'kalyna',   name: 'Kalyna Wrap Dress',      cat: 'Dresses',  sub: 'Tie waist, flowing maxi length',    price: 5400, color: 'sand',  badge: 'New',         sizes: { XS: 1, S: 1, M: 1, L: 0 }, img: set(7) },
  lada:     { id: 'lada',     name: 'Lada Puff-Sleeve Blouse',cat: 'Shirts',   sub: 'Gathered neckline, cuffed sleeve',  price: 2450, color: 'ivory', sizes: { XS: 1, S: 1, M: 1, L: 1 }, img: set(8) },
  kora:     { id: 'kora',     name: 'Kora Wide-Leg Trousers', cat: 'Trousers', sub: 'High rise, soft pleats',            price: 2900, color: 'cocoa', sizes: { XS: 1, S: 1, M: 1, L: 0 }, img: { front: img(8, 'back'), alt: img(6, 'back'), back: img(8, 'back'), macro: img(3, 'macro') } },
};

export const LOOKS = {
  hero:  { title: 'Zoria Linen Set', items: ['zoria'] },
  cocoa: { title: 'Ivory over cocoa', items: ['vira', 'kora'] },
};

export const FREE_SHIPPING = 5000; // demo threshold

export const money = n => '₴' + Math.round(n).toLocaleString('uk-UA').replace(/\s/g, ' ');
