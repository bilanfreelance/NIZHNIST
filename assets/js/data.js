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

// Product copy, set contents and merchandising relations (concept content)
export const INFO = {
  zoria:    { desc: 'A relaxed linen set designed for everyday comfort — an easy shirt with rolled sleeves over high-rise wide-leg trousers.', pieces: ['Relaxed linen shirt', 'Wide-leg linen trousers'], fit: 'Relaxed fit. The trousers sit high on the waist with an elasticated back.', related: ['vira', 'sonia', 'lada'] },
  sonia:    { desc: 'Our lightest look for hot days: a boxy sand shirt worn open over matching linen shorts.', pieces: ['Boxy linen shirt', 'Linen shorts'], fit: 'Boxy, slightly cropped shirt. Shorts with a soft elasticated waist.', related: ['zoria', 'kalyna', 'vira'] },
  polissia: { desc: 'A refined, minimalist outfit — a sleeveless chocolate vest buttoned over coordinating wide-leg trousers.', pieces: ['Sleeveless linen vest', 'Coordinating linen trousers'], fit: 'Tailored vest with a straight hem. Trousers are high-rise and full-length.', related: ['vira', 'lada', 'zoria'] },
  lada:     { desc: 'Soft volume meets structured tailoring: a gathered ivory blouse with puff sleeves and chocolate linen trousers.', pieces: ['Gathered linen blouse', 'Chocolate linen trousers'], fit: 'Blouse is voluminous with cuffed sleeves. Trousers are high-rise and wide.', related: ['polissia', 'vira', 'lesya'] },
  lesya:    { desc: 'A light ivory one-piece with a square neckline and a gathered wide leg — one decision, the whole day sorted.', pieces: null, fit: 'Fitted bodice, relaxed wide leg. Choose your usual size.', related: ['kalyna', 'mavka', 'zoria'] },
  mavka:    { desc: 'An olive maxi dress with a fitted sleeveless bodice and a full, gathered skirt that moves as you walk.', pieces: null, fit: 'Fitted through the bodice, full from the waist. Midi-to-maxi length.', related: ['kalyna', 'lesya', 'vira'] },
  vira:     { desc: 'The everyday linen shirt: dropped shoulders, a relaxed body and sleeves made to be rolled.', pieces: null, fit: 'Oversized fit. Size down for a closer silhouette.', related: ['zoria', 'polissia', 'lada'] },
  kalyna:   { desc: 'A sand wrap shirt dress with a tie waist and a flowing skirt — easy to dress up or down.', pieces: null, fit: 'Adjustable wrap with a tie waist. Relaxed through the skirt.', related: ['mavka', 'lesya', 'sonia'] },
};

export const CATEGORIES = ['Sets', 'Dresses', 'Shirts', 'Jumpsuits'];

// Demo size chart (body measurements, cm) — replace with the brand's real measurements
export const SIZE_CHART = [
  ['XS', '80–83', '62–65', '87–90'],
  ['S', '84–87', '66–69', '91–94'],
  ['M', '88–92', '70–74', '95–99'],
  ['L', '93–97', '75–79', '100–104'],
];

export const LOOKS = {
  hero:  { title: 'The Essential Set', items: ['zoria'] },
  cocoa: { title: 'Ivory over chocolate', items: ['vira', 'polissia'] },
};

export const FREE_SHIPPING = 200; // demo threshold, USD

export const money = n => '$' + Math.round(n).toLocaleString('en-US');
