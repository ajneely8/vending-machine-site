// Treasure Drop — procedural 3D vending machines (Three.js).
// All machine specs live in MACHINES below. They are PRELIMINARY estimates:
// replace with the real hardware numbers and every page updates from here.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CATALOG, itemsOf } from './catalog.js';

export const IN = 0.0254; // inches -> meters

export const MACHINES = {
  compact: {
    id: 'compact', code: '01', name: 'Compact',
    line: 'Fits where a full-size machine won’t.',
    blurb: 'A small-footprint machine for locations where floor space is tight but foot traffic is steady.',
    w: 28, d: 30, h: 64, shelves: 4, controlW: 6, headerH: 9, baseH: 13, usableDepth: 20,
    scheme: 'spark',
    power: 'Standard 120V wall outlet',
    payments: 'Card, tap to pay, Apple Pay, Google Pay',
    products: ['Booster packs', 'Sleeved boosters', 'Tins', 'Booster bundles'],
    locations: ['Card shops', 'Barbershops', 'Small retailers', 'Local restaurants', 'Game stores', 'Waiting areas'],
    config: ['pack', 'sleeved', 'tin', 'bundle'],
  },
  standard: {
    id: 'standard', code: '02', name: 'Standard',
    line: 'The everyday Treasure Drop.',
    blurb: 'Our primary machine. More shelves, more selections, and room for boxed products alongside packs.',
    w: 39, d: 33, h: 72, shelves: 5, controlW: 7, headerH: 10, baseH: 12, usableDepth: 23,
    scheme: 'storm',
    power: 'Standard 120V wall outlet',
    payments: 'Card, tap to pay, Apple Pay, Google Pay',
    products: ['Booster packs', 'Sleeved boosters', 'Booster bundles', 'Tins', 'Elite Trainer Boxes'],
    locations: ['Retail stores', 'Game stores', 'Restaurants', 'Arcades', 'Sports facilities'],
    config: ['pack', 'pack', 'sleeved', 'tin', 'etb'],
  },
  xl: {
    id: 'xl', code: '03', name: 'XL / Premium',
    line: 'The flagship. Built to be seen from across the concourse.',
    blurb: 'Our largest machine, with a lit marquee and the widest product range. Made for high-traffic venues.',
    w: 51, d: 35, h: 80, shelves: 6, controlW: 7.5, headerH: 12, baseH: 12, usableDepth: 25,
    scheme: 'legend', marquee: true,
    power: 'Standard 120V wall outlet',
    payments: 'Card, tap to pay, Apple Pay, Google Pay',
    products: ['Booster packs', 'Sleeved boosters', 'Booster bundles', 'Tins', 'Elite Trainer Boxes', 'Collection boxes'],
    locations: ['Shopping malls', 'Movie theaters', 'Family entertainment centers', 'Large retailers', 'Sports facilities', 'Arcades', 'Entertainment venues'],
    config: ['pack', 'pack', 'sleeved', 'bundle', 'etb', 'collection'],
  },
};

// Product slot sizes in inches (approximate sealed-product dimensions).
// pitch = depth one unit takes up in a lane; maxLane = cap per lane; stack = units stacked per facing.
export const PRODUCTS = {
  pack:       { id: 'pack',       name: 'Booster packs',       short: 'Packs',      w: 2.6,  h: 4.8, t: 0.22, pitch: 0.75, maxLane: 15, show: 4, color: '#ffc51f' },
  sleeved:    { id: 'sleeved',    name: 'Sleeved boosters and blisters', short: 'Sleeved', w: 4.0, h: 7.4, t: 0.3, pitch: 0.95, maxLane: 12, show: 3, color: '#4f8dff' },
  bundle:     { id: 'bundle',     name: 'Booster bundles',     short: 'Bundles',    w: 4.4,  h: 5.9, t: 2.4,  pitch: 2.6,  maxLane: 8,  show: 2, color: '#35e0c2' },
  tin:        { id: 'tin',        name: 'Tins',                short: 'Tins',       w: 5.4,  h: 6.8, t: 2.6,  pitch: 2.8,  maxLane: 8,  show: 2, color: '#c9d3e6' },
  etb:        { id: 'etb',        name: 'Elite Trainer Boxes', short: 'ETBs',       w: 7.4,  h: 7.0, t: 3.5,  pitch: 3.7,  maxLane: 7,  show: 2, color: '#ff5b6e' },
  collection: { id: 'collection', name: 'Collection boxes',    short: 'Collection', w: 11.5, h: 8.3, t: 2.4,  pitch: 2.6,  maxLane: 8,  show: 2, color: '#b57bff' },
};

const FRAME = 1.5; // inches of door frame either side of the window
const GAP = 0.45;  // inches between facings

export function usableWidth(spec) { return spec.w - spec.controlW - FRAME * 2; }

export function computeCapacity(spec, config) {
  const uw = usableWidth(spec);
  const byType = {};
  let total = 0, selections = 0;
  const shelves = config.map((pid) => {
    const p = PRODUCTS[pid];
    const facings = Math.max(1, Math.floor((uw + GAP) / (p.w + GAP)));
    const lane = Math.min(p.maxLane, Math.floor(spec.usableDepth / p.pitch));
    const units = facings * lane * (p.stack || 1);
    byType[pid] = (byType[pid] || 0) + units;
    total += units; selections += facings;
    return { product: pid, facings, lane, units };
  });
  return { shelves, byType, total, selections };
}

// ---------------------------------------------------------------- assets

const SCHEMES = {
  storm:  { a: '#0a1a6b', b: '#1b4bd6', c: '#061043', shard: '#0d2a9c', swirl: '#7fb2ff', bolt: '#ffc51f', bolt2: '#8fe0ff', star: '#ffd75a', trim: '#ffc51f' },
  spark:  { a: '#ffd23a', b: '#ffb300', c: '#f07f00', shard: '#ffe682', swirl: '#ffffff', bolt: '#1b4bd6', bolt2: '#0a1a6b', star: '#ffffff', trim: '#1b4bd6' },
  legend: { a: '#3a0f86', b: '#1a2fc4', c: '#0a0730', shard: '#5a1fd0', swirl: '#c08bff', bolt: '#35e0ff', bolt2: '#ff6bd6', star: '#ffd75a', trim: '#35e0ff' },
};

const logoImg = new Image();

// Product photos arrive on a white background. Clear the white that touches the
// image edge, then crop to what is left, so each product sits cleanly on the shelf.
const itemArt = {};
export const itemCanvas = (id) => itemArt[id];
export function cutout(img, maxSize = 512) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = mkCanvas(W, H), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H), a = d.data;
  const white = (p) => a[p * 4] > 236 && a[p * 4 + 1] > 236 && a[p * 4 + 2] > 236;
  const seen = new Uint8Array(W * H), stack = [];
  const push = (p) => { if (!seen[p] && white(p)) { seen[p] = 1; stack.push(p); } };
  for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); }
  for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
  while (stack.length) {
    const p = stack.pop(), px = p % W;
    a[p * 4 + 3] = 0;
    if (px > 0) push(p - 1);
    if (px < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < W * (H - 1)) push(p + W);
  }
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let p = 0; p < W * H; p++) if (a[p * 4 + 3]) { const px = p % W, py = (p / W) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  x.putImageData(d, 0, 0);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.min(1, maxSize / Math.max(w, h));
  const out = mkCanvas(w * k, h * k);
  out.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, out.width, out.height);
  return out;
}
export const assetsReady = (async () => {
  const logo = new Promise((res) => { logoImg.onload = res; logoImg.onerror = res; });
  logoImg.src = 'assets/img/logo.webp';
  const fonts = document.fonts
    ? Promise.race([document.fonts.load('700 20px "Chakra Petch"'), new Promise((r) => setTimeout(r, 2000))]).catch(() => {})
    : Promise.resolve();
  const arts = CATALOG.map((item) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { try { itemArt[item.id] = cutout(im); } catch (e) { console.warn('product art', item.id, e); } res(); };
    im.onerror = res;
    im.src = 'assets/img/products/' + item.img;
  }));
  await Promise.all([logo, fonts, ...arts]);
})();

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w); c.height = Math.round(h);
  return c;
}

function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function star(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.28 : r;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function bolt(ctx, r, x0, y0, x1, y1, width, color) {
  const n = 9, pts = [[x0, y0]];
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) {
    const k = i / n, j = (r() - 0.5) * len * 0.16;
    pts.push([x0 + dx * k + nx * j, y0 + dy * k + ny * j]);
  }
  pts.push([x1, y1]);
  const stroke = (w, c, blur) => {
    ctx.save();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    ctx.lineWidth = w; ctx.strokeStyle = c;
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
  };
  stroke(width, color, width * 2.2);
  stroke(width * 0.3, 'rgba(255,255,255,.9)', 0);
}

function drawWrap(ctx, W, H, s, seed) {
  const r = rng(seed), u = Math.min(W, H) / 512;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, s.a); g.addColorStop(0.55, s.b); g.addColorStop(1, s.c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // angular shards
  for (let i = 0; i < 8; i++) {
    const x = r() * W, y = r() * H, sz = (120 + r() * 260) * u;
    ctx.globalAlpha = 0.25 + r() * 0.3;
    ctx.fillStyle = i % 3 ? s.shard : s.c;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sz, y - sz * (0.2 + r() * 0.5));
    ctx.lineTo(x + sz * (0.3 + r() * 0.5), y + sz * (0.5 + r() * 0.6));
    ctx.closePath(); ctx.fill();
  }
  // energy swirls
  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = 0.16 + r() * 0.2;
    ctx.strokeStyle = s.swirl;
    ctx.lineWidth = (10 + r() * 46) * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const a0 = r() * 6.28;
    ctx.arc(W * (0.2 + r() * 0.6), H * (0.2 + r() * 0.6), (120 + r() * 320) * u, a0, a0 + 0.8 + r() * 1.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // bolts
  for (let i = 0; i < 6; i++) {
    const side = r() > 0.5;
    const x0 = side ? r() * W : (r() > 0.5 ? 0 : W), y0 = side ? (r() > 0.5 ? 0 : H) : r() * H;
    const x1 = W * (0.15 + r() * 0.7), y1 = H * (0.15 + r() * 0.7);
    bolt(ctx, r, x0, y0, x1, y1, (9 + r() * 9) * u, i % 2 ? s.bolt2 : s.bolt);
  }
}

function drawLogo(ctx, cx, cy, h) {
  const w = h * 1.5;
  ctx.save();
  // dark badge behind the logo so the supplied artwork sits on its own black field
  ctx.translate(cx, cy); ctx.scale(w / 2, h / 2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.08);
  g.addColorStop(0, 'rgba(2,4,14,.97)'); g.addColorStop(0.8, 'rgba(2,4,14,.92)'); g.addColorStop(1, 'rgba(2,4,14,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1.08, 0, 6.3); ctx.fill();
  ctx.restore();
  if (!logoImg.naturalWidth) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighten';
  ctx.drawImage(logoImg, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

// ---- product art (original placeholder designs, no licensed artwork)
const VARIANTS = [
  ['#1b4bd6', '#35e0ff', '#ffc51f'],
  ['#e5292f', '#ff9a3d', '#fff2b0'],
  ['#6a2bd6', '#ff6bd6', '#aef4ff'],
  ['#0d8f6e', '#b6f24a', '#ffffff'],
];
const PRODUCT_LABEL = { pack: 'BOOSTER', sleeved: 'SLEEVED BOOSTER', bundle: 'BOOSTER BUNDLE', tin: 'TIN', etb: 'ELITE TRAINER BOX', collection: 'COLLECTION BOX' };

function drawPackArt(ctx, x, y, w, h, v, r) {
  const [c1, c2, c3] = VARIANTS[v];
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) {
    const o = (i - 1) * w * 0.45 + r() * w * 0.2;
    ctx.beginPath(); ctx.moveTo(x + o, y + h); ctx.lineTo(x + o + w * 0.16, y + h); ctx.lineTo(x + o + w * 0.75, y); ctx.lineTo(x + o + w * 0.59, y); ctx.fill();
  }
  ctx.globalAlpha = 1;
  star(ctx, x + w / 2, y + h * 0.5, Math.min(w, h) * 0.3, c3);
  star(ctx, x + w * 0.5, y + h * 0.5, Math.min(w, h) * 0.13, c1);
  ctx.restore();
}

function drawProduct(type, v) {
  const p = PRODUCTS[type];
  const W = type === 'collection' ? 384 : 256, H = Math.round((W * p.h) / p.w);
  const c = mkCanvas(W, H), ctx = c.getContext('2d'), r = rng(v * 97 + type.length * 13);
  const [c1, c2, c3] = VARIANTS[v];
  const label = (txt, y, size, color = '#fff', weight = 700) => {
    ctx.font = `${weight} ${size}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(txt, W / 2, y, W * 0.9);
  };
  if (type === 'pack') {
    drawPackArt(ctx, 0, 0, W, H, v, r);
    ctx.fillStyle = '#cfd6e4';
    ctx.fillRect(0, 0, W, H * 0.06); ctx.fillRect(0, H * 0.94, W, H * 0.06);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let i = 0; i < W; i += 10) { ctx.fillRect(i, 0, 4, H * 0.06); ctx.fillRect(i, H * 0.94, 4, H * 0.06); }
    ctx.fillStyle = 'rgba(4,10,40,.8)'; ctx.fillRect(0, H * 0.1, W, H * 0.13);
    label('TCG BOOSTER', H * 0.165, W * 0.13);
    label('PACK ART PLACEHOLDER', H * 0.88, W * 0.07, '#fff', 600);
  } else if (type === 'sleeved') {
    ctx.fillStyle = '#f2f4f8'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H * 0.15);
    ctx.fillStyle = '#0a0f24'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.055, W * 0.1, H * 0.018, 0, 0, 6.3); ctx.fill();
    label('TCG', H * 0.115, W * 0.1);
    drawPackArt(ctx, W * 0.12, H * 0.2, W * 0.76, H * 0.62, v, r);
    label('SLEEVED BOOSTER', H * 0.88, W * 0.085, '#0a0f24');
    label('ART PLACEHOLDER', H * 0.94, W * 0.06, '#5a6480', 600);
  } else if (type === 'bundle') {
    ctx.fillStyle = '#0a0f24'; ctx.fillRect(0, 0, W, H);
    drawPackArt(ctx, 0, 0, W * 0.4, H, v, r);
    ctx.fillStyle = c3; ctx.fillRect(W * 0.4, 0, W * 0.02, H);
    ctx.font = `700 ${H * 0.2}px "Chakra Petch", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText('BOOSTER', W * 0.71, H * 0.32, W * 0.52);
    ctx.fillText('BUNDLE', W * 0.71, H * 0.56, W * 0.52);
    ctx.font = `600 ${H * 0.09}px "Chakra Petch", sans-serif`; ctx.fillStyle = c3;
    ctx.fillText('ART PLACEHOLDER', W * 0.71, H * 0.82, W * 0.52);
  } else if (type === 'tin') {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#8d97aa'); g.addColorStop(0.3, '#f4f7fb'); g.addColorStop(0.6, '#aab3c4'); g.addColorStop(1, '#e3e8f0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawPackArt(ctx, W * 0.1, H * 0.2, W * 0.8, H * 0.52, v, r);
    ctx.lineWidth = 6; ctx.strokeStyle = '#0a0f24'; ctx.strokeRect(W * 0.1, H * 0.2, W * 0.8, H * 0.52);
    label('COLLECTOR TIN', H * 0.11, W * 0.11, '#0a0f24');
    label('ART PLACEHOLDER', H * 0.84, W * 0.075, '#0a0f24', 600);
  } else if (type === 'etb') {
    drawPackArt(ctx, 0, 0, W, H, v, r);
    ctx.fillStyle = 'rgba(4,10,40,.86)'; ctx.fillRect(0, H * 0.66, W, H * 0.34);
    ctx.fillStyle = c3; ctx.fillRect(0, H * 0.66, W, H * 0.025);
    label('ELITE TRAINER BOX', H * 0.79, W * 0.095);
    label('BOX ART PLACEHOLDER', H * 0.9, W * 0.06, c3, 600);
  } else {
    ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) {
      const cw = W * 0.2, ch = cw * 1.4, cx = W * (0.09 + i * 0.235), cy = H * 0.3;
      ctx.fillStyle = '#f4f7fb'; ctx.fillRect(cx - 4, cy - 4, cw + 8, ch + 8);
      drawPackArt(ctx, cx, cy, cw, ch, (v + i) % VARIANTS.length, r);
    }
    star(ctx, W * 0.88, H * 0.5, W * 0.07, c3);
    ctx.fillStyle = 'rgba(4,10,40,.86)'; ctx.fillRect(0, 0, W, H * 0.2);
    label('COLLECTION BOX', H * 0.1, W * 0.075);
    label('BOX ART PLACEHOLDER', H * 0.9, W * 0.04, '#fff', 600);
  }
  return c;
}

const productCanvasCache = {};
export function productCanvas(type, v = 0) {
  const k = type + v;
  return productCanvasCache[k] || (productCanvasCache[k] = drawProduct(type, v));
}

// shared GPU resources
const shared = { geo: {}, mats: {}, misc: null };

const litMats = []; // product faces that glow under the shelf LEDs
// one catalog item -> a photo face plus a dark body that gives it depth on the shelf
function itemAssets(item) {
  if (!shared.mats[item.id]) {
    const p = PRODUCTS[item.type], art = itemArt[item.id] || productCanvas(item.type, 0);
    const asp = art.width / art.height;
    let w = p.w * IN, h = w / asp;
    if (h > p.h * IN) { h = p.h * IN; w = h * asp; }
    const map = tex(art);
    const face = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.38, metalness: 0.08, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.14 });
    const body = new THREE.MeshStandardMaterial({ color: 0x10131d, roughness: 0.6 });
    const faceGeo = new THREE.PlaneGeometry(w, h), bodyGeo = new THREE.BoxGeometry(w * 0.86, h * 0.9, p.t * IN);
    face.userData.shared = body.userData.shared = faceGeo.userData.shared = bodyGeo.userData.shared = true;
    litMats.push(face);
    shared.mats[item.id] = { face, body, faceGeo, bodyGeo, w, h };
  }
  return shared.mats[item.id];
}

function miscShared() {
  if (shared.misc) return shared.misc;
  const s = (m) => { m.userData.shared = true; return m; };
  // touchscreen
  let c = mkCanvas(256, 448), x = c.getContext('2d');
  let g = x.createLinearGradient(0, 0, 0, 448);
  g.addColorStop(0, '#0a1a6b'); g.addColorStop(1, '#1b4bd6');
  x.fillStyle = g; x.fillRect(0, 0, 256, 448);
  drawLogo(x, 128, 105, 150);
  x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = '700 26px "Chakra Petch", sans-serif';
  x.fillText('SELECT A', 128, 250); x.fillText('PRODUCT', 128, 282);
  x.strokeStyle = '#ffc51f'; x.lineWidth = 5;
  x.beginPath(); x.arc(128, 360, 30, 0, 6.3); x.stroke();
  x.fillStyle = '#ffc51f'; x.beginPath(); x.arc(128, 360, 13, 0, 6.3); x.fill();
  const screenMap = tex(c);
  // card reader
  c = mkCanvas(160, 200); x = c.getContext('2d');
  x.fillStyle = '#12151f'; x.fillRect(0, 0, 160, 200);
  x.fillStyle = '#7fd4ff'; x.fillRect(22, 16, 116, 50);
  x.fillStyle = '#39415a';
  for (let i = 0; i < 12; i++) x.fillRect(26 + (i % 3) * 38, 82 + Math.floor(i / 3) * 28, 30, 20);
  const readerMap = tex(c);
  // tap pad
  c = mkCanvas(160, 160); x = c.getContext('2d');
  x.fillStyle = '#12151f'; x.fillRect(0, 0, 160, 160);
  x.strokeStyle = '#fff'; x.lineWidth = 7; x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(48, 80, 14 + i * 16, -0.75, 0.75); x.stroke(); }
  const tapMap = tex(c);

  shared.misc = {
    body: s(new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.42, metalness: 0.55 })),
    gloss: s(new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.16, metalness: 0.6 })),
    interior: s(new THREE.MeshStandardMaterial({ color: 0x141c38, roughness: 0.8, emissive: 0x1a2a66, emissiveIntensity: 0.5 })),
    shelf: s(new THREE.MeshStandardMaterial({ color: 0x232a3d, roughness: 0.45, metalness: 0.7 })),
    glass: s(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 1, transparent: true, opacity: 0.05, depthWrite: false })),
    led: s(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfe2ff, emissiveIntensity: 2.2 })),
    foot: s(new THREE.MeshStandardMaterial({ color: 0x222632, roughness: 0.5, metalness: 0.8 })),
    binInner: s(new THREE.MeshStandardMaterial({ color: 0x020306, roughness: 0.9 })),
    flap: s(new THREE.MeshStandardMaterial({ color: 0x1a1e2c, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.75 })),
    screen: s(new THREE.MeshStandardMaterial({ map: screenMap, emissive: 0xffffff, emissiveMap: screenMap, emissiveIntensity: 0.9, roughness: 0.2 })),
    reader: s(new THREE.MeshStandardMaterial({ map: readerMap, emissive: 0xffffff, emissiveMap: readerMap, emissiveIntensity: 0.35, roughness: 0.4 })),
    tap: s(new THREE.MeshStandardMaterial({ map: tapMap, emissive: 0xffffff, emissiveMap: tapMap, emissiveIntensity: 0.5, roughness: 0.4 })),
  };
  return shared.misc;
}

// ---------------------------------------------------------------- machine

export function buildMachine(spec, config) {
  const M = miscShared(), scheme = SCHEMES[spec.scheme];
  const group = new THREE.Group();
  const W = spec.w * IN, H = spec.h * IN, D = spec.d * IN;
  const foot = 2 * IN, t = 0.02, Hb = H - foot;
  const cw = spec.controlW * IN, hh = spec.headerH * IN, bh = spec.baseH * IN, fr = FRAME * IN;
  const xL = -W / 2 + fr, winW = usableWidth(spec) * IN, wx = xL + winW / 2;
  const yB = foot + bh, yT = H - hh, winH = yT - yB, pitch = winH / spec.shelves;
  const zF = D / 2, shelfD = spec.usableDepth * IN;
  const textures = [];
  const own = (canvas) => { const tx = tex(canvas); textures.push(tx); return tx; };
  const add = (geo, mat, x, y, z, parent = group) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // shell
  add(box(W, Hb, t), M.body, 0, foot + Hb / 2, -D / 2 + t / 2);
  add(box(t, Hb, D), M.body, -W / 2 + t / 2, foot + Hb / 2, 0);
  add(box(t, Hb, D), M.body, W / 2 - t / 2, foot + Hb / 2, 0);
  add(box(W, t, D), M.body, 0, H - t / 2, 0);
  add(box(W, t, D), M.body, 0, foot + t / 2, 0);
  const footG = new THREE.CylinderGeometry(0.028, 0.034, foot, 16);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(footG, M.foot, sx * (W / 2 - 0.06), foot / 2, sz * (D / 2 - 0.06)));

  // vinyl wraps (sides + back)
  const wrapMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.3, metalness: 0.15 });
  const seed = spec.w * 31 + spec.h;
  const sideCanvas = (sd) => {
    const c = mkCanvas(512, (512 * Hb) / D), x = c.getContext('2d'), cw_ = c.width, ch = c.height;
    drawWrap(x, cw_, ch, scheme, sd);
    drawLogo(x, cw_ / 2, ch * 0.42, cw_ * 0.64);
    return c;
  };
  const left = add(new THREE.PlaneGeometry(D, Hb), wrapMat(own(sideCanvas(seed + 1))), -W / 2 - 0.003, foot + Hb / 2, 0);
  left.rotation.y = -Math.PI / 2;
  const right = add(new THREE.PlaneGeometry(D, Hb), wrapMat(own(sideCanvas(seed + 2))), W / 2 + 0.003, foot + Hb / 2, 0);
  right.rotation.y = Math.PI / 2;
  {
    const c = mkCanvas(640, (640 * Hb) / W), x = c.getContext('2d'), cW = c.width, cH = c.height;
    drawWrap(x, cW, cH, scheme, seed + 3);
    drawLogo(x, cW / 2, cH * 0.42, Math.min(cW * 0.6, cH * 0.34));
    x.fillStyle = '#05060a'; x.fillRect(cW * 0.1, cH * 0.84, cW * 0.36, cH * 0.1);
    x.fillStyle = '#2a3042';
    for (let i = 0; i < 9; i++) x.fillRect(cW * 0.11, cH * (0.848 + i * 0.0105), cW * 0.34, cH * 0.004);
    const back = add(new THREE.PlaneGeometry(W, Hb), wrapMat(own(c)), 0, foot + Hb / 2, -D / 2 - 0.003);
    back.rotation.y = Math.PI;
  }

  // header / marquee
  {
    const c = mkCanvas(1024, (1024 * hh) / W), x = c.getContext('2d');
    drawWrap(x, c.width, c.height, scheme, seed + 4);
    drawLogo(x, c.width / 2, c.height / 2, c.height * 0.98);
    const map = own(c), depth = spec.marquee ? 0.09 : 0.05;
    const front = new THREE.MeshStandardMaterial({ map, roughness: 0.25, metalness: 0.1, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: spec.marquee ? 0.75 : 0.4 });
    add(box(W, hh, depth), [M.body, M.body, M.body, M.body, front, M.body], 0, H - hh / 2, zF - 0.025 + depth / 2);
    litMats.push(front);
    front.userData.baseEmissive = front.emissiveIntensity;
  }
  // base panel
  {
    const c = mkCanvas(1024, (1024 * bh) / W), x = c.getContext('2d');
    drawWrap(x, c.width, c.height, scheme, seed + 5);
    const lh = Math.min(c.height * 0.94, (c.width * 0.54) / 1.5);
    drawLogo(x, c.width * 0.3, c.height / 2, lh);
    const map = own(c);
    add(box(W, bh, 0.03), [M.body, M.body, M.body, M.body, wrapMat(map), M.body], 0, foot + bh / 2, zF - 0.015);
    const binW = W * 0.36, binH = bh * 0.42, bx = W / 2 - 0.035 - binW / 2, by = foot + bh * 0.48;
    add(box(binW + 0.025, binH + 0.025, 0.012), M.foot, bx, by, zF + 0.004);
    add(new THREE.PlaneGeometry(binW, binH), M.binInner, bx, by, zF + 0.0105);
    const flap = add(box(binW, binH * 0.92, 0.005), M.flap, bx, by + binH * 0.03, zF + 0.014);
    flap.rotation.x = 0.12;
  }

  // door: frame strips + control column
  add(box(fr, winH, 0.03), M.gloss, -W / 2 + fr / 2, yB + winH / 2, zF - 0.015);
  const colW = cw + fr, colX = W / 2 - colW / 2;
  add(box(colW, winH, 0.03), M.gloss, colX, yB + winH / 2, zF - 0.015);
  const ccx = W / 2 - cw / 2 - fr * 0.2;
  const sw = cw * 0.72, sh = Math.min(sw * 1.75, winH * 0.34);
  add(box(sw + 0.012, sh + 0.012, 0.012), M.body, ccx, yB + winH * 0.7, zF + 0.004);
  add(new THREE.PlaneGeometry(sw, sh), M.screen, ccx, yB + winH * 0.7, zF + 0.0105);
  const rw = cw * 0.52;
  add(box(rw, rw * 1.25, 0.03), [M.body, M.body, M.body, M.body, M.reader, M.body], ccx, yB + winH * 0.4, zF + 0.012);
  add(box(rw, rw, 0.02), [M.body, M.body, M.body, M.body, M.tap, M.body], ccx, yB + winH * 0.24, zF + 0.008);

  // window: glass, LEDs, interior
  add(new THREE.PlaneGeometry(winW, winH), M.glass, wx, yB + winH / 2, zF - 0.004);
  const zIn = zF - 0.04;
  add(box(0.01, winH, 0.012), M.led, xL + 0.008, yB + winH / 2, zIn);
  add(box(0.01, winH, 0.012), M.led, xL + winW - 0.008, yB + winH / 2, zIn);
  add(new THREE.PlaneGeometry(winW, winH), M.interior, wx, yB + winH / 2, zF - 0.06 - shelfD - 0.01);
  if (spec.marquee) {
    const edge = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(scheme.trim), emissiveIntensity: 2.4 });
    add(box(0.012, Hb - hh, 0.012), edge, -W / 2 + 0.004, foot + (Hb - hh) / 2, zF + 0.002);
    add(box(0.012, Hb - hh, 0.012), edge, W / 2 - 0.004, foot + (Hb - hh) / 2, zF + 0.002);
  }
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(scheme.trim), roughness: 0.3, metalness: 0.7, emissive: new THREE.Color(scheme.trim), emissiveIntensity: 0.35 });
  add(box(W, 0.012, 0.012), trim, 0, yT, zF + 0.004);
  add(box(W, 0.012, 0.012), trim, 0, yB, zF + 0.004);

  // shelves
  const shelfG = box(winW, 0.012, shelfD), ledG = box(winW - 0.03, 0.006, 0.012), railG = box(winW, 0.03, 0.004);
  const shelfY = [];
  for (let i = 0; i < spec.shelves; i++) {
    const y = yT - (i + 1) * pitch; // top surface of shelf i (0 = top shelf)
    shelfY.push(y);
    add(shelfG, M.shelf, wx, y - 0.006, zF - 0.06 - shelfD / 2);
    add(ledG, M.led, wx, y + pitch - 0.02, zIn);
  }

  const productGroup = new THREE.Group();
  group.add(productGroup);
  const api = {
    group, spec, products: [], shelfStops: [], anim: null, config: null,
    dims: { W, H, D, wx, wy: yB + winH / 2, winW, winH, cw, bh, ctrl: { x: ccx, y: yB + winH * 0.47 }, bin: { x: W / 2 - 0.035 - W * 0.18, y: foot + bh * 0.48 } },
    setConfig(cfg, animate) {
      api.config = cfg.slice();
      productGroup.traverse((o) => { if (o.userData.rail) { o.material.map.dispose(); o.material.dispose(); } });
      productGroup.clear();
      api.products = [];
      api.shelfStops = [];
      const cap = computeCapacity(spec, cfg);
      cap.shelves.forEach((sh, i) => {
        const p = PRODUCTS[sh.product], slot = winW / sh.facings, y = shelfY[i];
        // price rail with selection codes
        const rc = mkCanvas(1024, Math.round((1024 * 0.03) / winW)), rx = rc.getContext('2d');
        rx.fillStyle = '#eef1f7'; rx.fillRect(0, 0, rc.width, rc.height);
        rx.font = `700 ${rc.height * 0.62}px "Chakra Petch", sans-serif`; rx.textAlign = 'center'; rx.textBaseline = 'middle';
        for (let f = 0; f < sh.facings; f++) {
          const cx = (rc.width / sh.facings) * (f + 0.5);
          rx.fillStyle = '#0a1a6b'; rx.fillRect(cx - rc.height * 0.9, rc.height * 0.12, rc.height * 1.8, rc.height * 0.76);
          rx.fillStyle = '#ffc51f'; rx.fillText(String.fromCharCode(65 + i) + (f + 1), cx, rc.height * 0.54);
        }
        const railMap = tex(rc);
        const rail = add(railG, new THREE.MeshStandardMaterial({ map: railMap, emissive: 0xffffff, emissiveMap: railMap, emissiveIntensity: 0.35, roughness: 0.5 }), wx, y - 0.012, zF - 0.058, productGroup);
        rail.userData.rail = true;
        const rows = Math.min(p.show, sh.lane), flat = p.t < 1, items = itemsOf(p.id);
        for (let f = 0; f < sh.facings; f++) {
          const a = itemAssets(items[(f + i) % items.length]);
          for (let r = 0; r < rows; r++) {
            const unit = new THREE.Group(), py = y + a.h / 2 + 0.001;
            unit.add(new THREE.Mesh(a.bodyGeo, a.body));
            const face = new THREE.Mesh(a.faceGeo, a.face);
            face.position.z = (p.t * IN) / 2 + 0.002;
            unit.add(face);
            unit.position.set(xL + slot * (f + 0.5), py, zF - 0.075 - (p.t * IN) / 2 - r * p.pitch * IN);
            if (flat) unit.rotation.x = -0.07;
            unit.userData.ty = py;
            productGroup.add(unit);
            api.products.push(unit);
          }
        }
        api.shelfStops[i] = { type: p.id, y: y + (p.h * IN) / 2, pitch };
      });
      const n = api.products.length;
      api.products.forEach((m, k) => { m.userData.delay = (k / n) * 1.3; });
      if (animate) {
        api.products.forEach((m) => { m.visible = false; });
        api.anim = { start: performance.now() / 1000 };
      }
      return cap;
    },
    dispose() {
      textures.forEach((tx) => tx.dispose());
      for (let i = litMats.length - 1; i >= 0; i--) if (!litMats[i].userData.shared) litMats.splice(i, 1);
      group.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.geometry.userData.shared) o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!m.userData.shared) { if (o.userData.rail && m.map) m.map.dispose(); m.dispose(); } });
      });
    },
  };
  api.setConfig(config || spec.config, false);
  return api;
}

// ---------------------------------------------------------------- viewer

const LIGHTING = {
  showroom: { env: 0.9, key: 2.4, keyColor: 0xffffff, rim: 2.0, rimColor: 0x4f8dff, led: 2.2, glow: 1, exposure: 1.05 },
  arcade:   { env: 0.16, key: 0.35, keyColor: 0x9fb4ff, rim: 3.2, rimColor: 0xb14dff, led: 3.4, glow: 1.9, exposure: 1.0 },
  daylight: { env: 1.5, key: 3.0, keyColor: 0xfff1d6, rim: 0.6, rimColor: 0xffffff, led: 1.2, glow: 0.6, exposure: 1.0 },
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// One canvas for the whole page. The page hands it a pose function per chapter
// (setPose) and the camera glides there; the visitor can drag to turn the machine.
export class Viewer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = { machine: 'standard', lighting: 'showroom', ...opts };
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.3, 40);
    this.key = new THREE.DirectionalLight(0xffffff, 2.4); this.key.position.set(2.5, 4, 4);
    this.rim = new THREE.DirectionalLight(0x4f8dff, 2); this.rim.position.set(-3, 2.5, -3);
    this.scene.add(this.key, this.rim, new THREE.HemisphereLight(0xdfe8ff, 0x0a0f24, 0.5));

    const top = new THREE.MeshStandardMaterial({ color: 0x080b16, roughness: 0.12, metalness: 0.85 });
    this.plinth = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.04, 0.07, 72), top);
    this.plinth.position.y = -0.036;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 8, 96), new THREE.MeshStandardMaterial({ color: 0xffc51f, emissive: 0xffc51f, emissiveIntensity: 1.6 }));
    this.ring.rotation.x = Math.PI / 2;
    this.scene.add(this.plinth, this.ring);

    this.poseFn = null; this.pose = null;      // scripted camera target + eased current pose
    this.user = 0; this.userGoal = 0;          // extra yaw from dragging
    this.yawLimit = null; this.room = null;
    this.region = { x: 0, y: 0, w: 1, h: 1 };  // part of the canvas the scene is framed in (fractions)
    this.regionGoal = { ...this.region };
    this.w = 1; this.h = 1; this.time = 0;

    this._bind();
    this.ready = assetsReady.then(() => {
      this._resize();
      this.setMachine(this.opts.machine, this.opts.config, false);
      this.setLighting(this.opts.lighting);
      canvas.closest('.stage')?.classList.add('is-ready');
    });
  }

  _bind() {
    const c = this.canvas;
    let drag = null;
    const turn = (d) => {
      this.userGoal += d;
      const lim = this.yawLimit;
      if (lim != null) this.userGoal = THREE.MathUtils.clamp(this.userGoal, -lim, lim);
    };
    c.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX };
      if (e.pointerType === 'mouse') c.setPointerCapture(e.pointerId);
      c.classList.add('is-dragging');
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      turn(-(e.clientX - drag.x) * 0.008);
      drag.x = e.clientX;
    });
    const end = () => { drag = null; c.classList.remove('is-dragging'); };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') end(); });
    c.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') turn(0.25); else if (e.key === 'ArrowRight') turn(-0.25); else return;
      e.preventDefault();
    });
    new ResizeObserver(() => this._resize()).observe(c);
    document.addEventListener('visibilitychange', () => this._run());
    this._run();
  }

  _run() {
    const should = !document.hidden;
    if (should && !this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this._tick); }
    if (!should && this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
  }

  _resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
  }

  get tan() { return Math.tan((this.camera.fov * Math.PI) / 360); }
  get aspect() { const r = this.regionGoal; return (r.w * this.w) / (r.h * this.h); }

  setRegion(r, instant) {
    this.regionGoal = { ...r };
    if (instant) this.region = { ...r };
  }

  setMachine(id, config, animate = true) {
    const spec = MACHINES[id];
    if (this.machine) { this.scene.remove(this.machine.group); this.machine.dispose(); }
    this.machine = buildMachine(spec, config || spec.config);
    this.scene.add(this.machine.group);
    const r = Math.hypot(this.machine.dims.W, this.machine.dims.D) * 0.62;
    this.plinth.scale.set(r, 1, r); this.ring.scale.set(r, r, 1);
    if (animate && !reduceMotion) this.machine.setConfig(this.machine.config, true);
    return computeCapacity(spec, this.machine.config);
  }

  setConfig(config, animate = true) {
    return this.machine.setConfig(config, animate && !reduceMotion);
  }

  setLighting(name) {
    const L = LIGHTING[name]; if (!L) return;
    this.lighting = name;
    this.scene.environmentIntensity = L.env;
    this.key.intensity = L.key; this.key.color.set(L.keyColor);
    this.rim.intensity = L.rim; this.rim.color.set(L.rimColor);
    this.renderer.toneMappingExposure = L.exposure;
    miscShared().led.emissiveIntensity = L.led;
    litMats.forEach((m) => { m.emissiveIntensity = (m.userData.baseEmissive || 0.14) * L.glow; });
    const stage = this.canvas.closest('.stage');
    if (stage) stage.dataset.light = name;
  }

  // placement mockups: swap the showroom plinth for a group of people + floor shadows
  setRoom(group) {
    if (this.room) this.scene.remove(this.room);
    this.room = group || null;
    if (group) this.scene.add(group);
    this.plinth.visible = this.ring.visible = !group;
    this.yawLimit = group ? 0.18 : null;
  }

  setPose(fn, instant) {
    this.poseFn = fn;
    this.userGoal = 0;
    if (instant) { this.pose = null; this.user = 0; }
  }

  // ---- pose builders (all relative to the current machine and framing region)
  fullPose(yaw = -0.5, pitch = 0.1) {
    const { W, H, D } = this.machine.dims;
    const d = Math.max((H * 1.26) / 2 / this.tan, (Math.hypot(W, D) * 1.16) / 2 / (this.tan * this.aspect));
    return { x: 0, y: H * 0.43, z: 0, d, yaw, pitch };
  }

  shelfPose(i, yaw = 0) {
    const m = this.machine, s = m.shelfStops[Math.min(i, m.shelfStops.length - 1)];
    const d = Math.max((s.pitch * 1.9) / 2 / this.tan, (m.dims.winW * 0.92) / 2 / (this.tan * this.aspect));
    return { x: m.dims.wx, y: s.y, z: m.dims.D / 2, d, yaw, pitch: 0.05 };
  }

  partPose(part, yaw = 0.3) {
    const q = this.machine.dims;
    if (part === 'bin') {
      const d = Math.max((q.bh * 2.4) / 2 / this.tan, (q.W * 0.8) / 2 / (this.tan * this.aspect));
      return { x: q.bin.x - q.W * 0.12, y: q.bin.y, z: q.D / 2, d, yaw, pitch: 0.14 };
    }
    const d = Math.max((q.winH * 0.8) / 2 / this.tan, (q.cw * 3.2) / 2 / (this.tan * this.aspect));
    return { x: q.ctrl.x, y: q.ctrl.y, z: q.D / 2, d, yaw, pitch: 0.04 };
  }

  // framing matched to the backdrop photos (floor line about three-quarters down the frame);
  // shift moves the machine sideways by that fraction of the frame width
  roomPose(shift = 0) {
    const d = Math.max(7.5, 1.9 / (this.tan * this.aspect));
    return { x: 0.4 - shift * 2 * d * this.tan * this.aspect, y: 0.96, z: 0, d, yaw: -0.12, pitch: 0.03 };
  }

  _tick = (now) => {
    this.raf = requestAnimationFrame(this._tick);
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.time += dt;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
    const m = this.machine;
    if (m && this.poseFn) {
      if (m.anim) {
        const el = now / 1000 - m.anim.start; let done = true;
        for (const p of m.products) {
          const q = Math.min(1, Math.max(0, (el - p.userData.delay) / 0.38));
          if (q < 1) done = false;
          p.visible = q > 0;
          p.position.y = p.userData.ty + Math.pow(1 - q, 3) * 0.09;
        }
        if (done) m.anim = null;
      }
      const goal = this.poseFn(this);
      if (!this.pose) this.pose = { ...goal }; else for (const key in goal) this.pose[key] += (goal[key] - this.pose[key]) * k;
      this.user += (this.userGoal - this.user) * (1 - Math.exp(-dt * 7));
      const R = this.region, G = this.regionGoal;
      for (const key in R) R[key] += (G[key] - R[key]) * k;
      const fw = R.w * this.w, fh = R.h * this.h;
      this.camera.aspect = fw / fh;
      this.camera.setViewOffset(fw, fh, -R.x * this.w, -R.y * this.h, this.w, this.h);
      const P = this.pose, sway = reduceMotion ? 0 : Math.sin(this.time * 0.45) * (this.room ? 0.012 : 0.035);
      const yaw = P.yaw + this.user + sway;
      this.camera.position.set(P.x + P.d * Math.sin(yaw) * Math.cos(P.pitch), P.y + P.d * Math.sin(P.pitch), P.z + P.d * Math.cos(yaw) * Math.cos(P.pitch));
      this.camera.lookAt(P.x, P.y, P.z);
      this.renderer.render(this.scene, this.camera);
    }
  };
}

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
