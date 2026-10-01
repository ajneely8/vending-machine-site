// Treasure Drop one-pager: a single fixed 3D stage, with each scroll chapter moving the camera.
import { MACHINES, PRODUCTS, Viewer, computeCapacity, productCanvas, itemCanvas, assetsReady, webglAvailable } from './machine.js';
import { itemsOf, profit, margin, money } from './catalog.js';
import { ROOMS, buildRoom, disposeRoom, loadPeople, placeImage } from './rooms.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ORDER = ['compact', 'standard', 'xl'];
const TYPES = Object.keys(PRODUCTS);
const TOUR = [
  { type: 'pack', line: 'The impulse buy. One pack, ten cards, and the reason most people walk up.' },
  { type: 'sleeved', line: 'Hang-card packs. The same booster in retail packaging, often with a promo card and coin.' },
  { type: 'bundle', line: 'Six packs in one box. The step up for buyers who want more than a single.' },
  { type: 'tin', line: 'Easy to spot and easy to gift. Booster packs plus a foil promo card in a collectible tin.' },
  { type: 'etb', line: 'The collector favorite. Nine packs plus sleeves, dice, and a promo card.' },
  { type: 'collection', line: 'The big-ticket shelf. Packs, promo cards, and display pieces in one box.' },
];
const TOUR_CFG = TOUR.map((t) => t.type);
const mobile = matchMedia('(max-width: 820px)');

// ---------------------------------------------------------------- generated chapters
const sqft = (m) => ((m.w * m.d) / 144).toFixed(1);
const maxPacks = (m) => computeCapacity(m, Array(m.shelves).fill('pack')).total;
const chapter = (ch, html, attrs = '') => `<section class="chapter" data-ch="${ch}" ${attrs}><div class="wrap"><div class="panel">${html}</div></div></section>`;

$('#machines').innerHTML = ORDER.map((id) => {
  const m = MACHINES[id], cap = computeCapacity(m, m.config);
  return chapter(id, `
    <p class="tag">Machine option ${m.code}</p>
    <h2>${m.name}</h2>
    <p class="lede">${m.blurb}</p>
    <div class="spec"><dl>
      <div><dt>Dimensions</dt><dd>${m.w}" W × ${m.d}" D × ${m.h}" H<small>About ${sqft(m)} sq ft of floor</small></dd></div>
      <div><dt>Capacity</dt><dd>About ${cap.total} products in a mixed layout<small>Up to about ${maxPacks(m)} with booster packs only</small></dd></div>
      <div><dt>Selections</dt><dd>${cap.selections} across ${m.shelves} shelves</dd></div>
      <div><dt>Products</dt><dd>${m.products.join(', ')}</dd></div>
      <div><dt>Payment</dt><dd>${m.payments}</dd></div>
      <div><dt>Power</dt><dd>${m.power}</dd></div>
      <div><dt>Ideal for</dt><dd>${m.locations.join(', ')}</dd></div>
    </dl>
    <span class="prelim">Preliminary specs · approximate</span>
    <button class="btn btn-gold" data-request="${m.name}">Request the ${m.name.split(' ')[0]}</button></div>`);
}).join('');

const row = (label, fn) => `<tr><th scope="row">${label}</th>${ORDER.map((id) => `<td>${fn(MACHINES[id])}</td>`).join('')}</tr>`;
$('#compare').innerHTML = `<table>
  <caption class="sr">Machine comparison</caption>
  <thead><tr><th></th>${ORDER.map((id) => `<th scope="col">${MACHINES[id].name.split(' ')[0]}</th>`).join('')}</tr></thead>
  <tbody>
    ${row('Size', (m) => `${m.w}" × ${m.d}" × ${m.h}"`)}
    ${row('Floor', (m) => `~${sqft(m)} sq ft`)}
    ${row('Shelves', (m) => m.shelves)}
    ${row('Selections', (m) => `~${computeCapacity(m, m.config).selections}`)}
    ${row('Mixed', (m) => `~${computeCapacity(m, m.config).total}`)}
    ${row('Packs only', (m) => `~${maxPacks(m)}`)}
  </tbody></table>`;

// product chapters need the product photos, so they are filled once assets load
const artCache = {};
const art = (item) => artCache[item.id] || (artCache[item.id] = (itemCanvas(item.id) || productCanvas(item.type, 0)).toDataURL());
const priceRow = (i) => `
  <span class="pm"><small>${i.msrp ? 'Price (MSRP)' : 'Price'}</small>${money(i.price)}</span>
  <span class="pm"><small>Unit cost</small>${money(i.cost)}</span>
  <span class="pm"><small>Profit</small>${money(profit(i))}</span>
  <span class="pm pm-gold"><small>Margin</small>${margin(i)}%</span>`;
$('#products').innerHTML = TOUR.map((t, i) => chapter('shelf', `
  <p class="tag">Shelf ${i + 1} of ${TOUR.length}</p>
  <h2>${PRODUCTS[t.type].name}</h2>
  <p class="lede">${t.line}</p>
  <ul class="tour-items" data-type="${t.type}"></ul>
  <p class="tour-note">Example pricing. See the note at the bottom of the page.</p>`, `data-i="${i}"`)).join('');
assetsReady.then(() => {
  $$('.tour-items').forEach((ul) => {
    ul.innerHTML = itemsOf(ul.dataset.type).map((it) => `
      <li><img src="${art(it)}" alt="">
        <div><b>${it.name}</b><small>${it.contents}</small><div class="pms">${priceRow(it)}</div></div></li>`).join('');
  });
  onScroll();
});

// ---------------------------------------------------------------- stage
const stage = $('#stage'), backdrop = $('#backdrop');
let viewer = null;
if (!webglAvailable()) {
  $('.stage-load', stage).textContent = '3D preview needs WebGL, which this browser has turned off.';
} else {
  try { viewer = new Viewer($('canvas', stage), { machine: 'xl', config: TOUR_CFG }); }
  catch (e) { console.error(e); $('.stage-load', stage).textContent = 'The 3D preview could not start on this device.'; }
}

// where the scene is framed inside the full-window canvas: right side on desktop, whole stage on phones
const regionFor = (full) => (mobile.matches || full ? { x: 0, y: 0, w: 1, h: 1 } : { x: 0.42, y: 0, w: 0.58, h: 1 });

// ---------------------------------------------------------------- capacity state
const capState = { machine: 'standard', config: MACHINES.standard.config.slice() };
const PRESETS = [
  { name: 'Pack wall', seq: ['pack', 'pack', 'pack', 'sleeved', 'sleeved', 'pack'] },
  { name: 'Balanced mix', seq: ['pack', 'pack', 'sleeved', 'tin', 'bundle', 'etb'] },
  { name: 'Release week', seq: ['etb', 'bundle', 'pack', 'pack', 'sleeved', 'pack'] },
  { name: 'Gift season', seq: ['collection', 'etb', 'tin', 'tin', 'bundle', 'pack'] },
];

// ---------------------------------------------------------------- places state
let room = ROOMS[0], roomGroup = null, userLight = 'showroom';
$('#place-list').innerHTML = ROOMS.map((r, i) => `<button data-i="${i}" aria-pressed="${i === 0}">${r.name}</button>`).join('');
function labelRoom() {
  $('#place-note').textContent = room.note;
  $('#place-machine').textContent = MACHINES[room.machine].name;
}
labelRoom();

// ---------------------------------------------------------------- chapters -> camera
// each entry: which machine is on stage and where the camera sits
// t runs 0 -> 1 as the visitor scrolls through a chapter, so every scene keeps pushing in
const push = (p, from, to, t) => ({ ...p, d: p.d * (from + (to - from) * t) });
const SCENES = {
  hero: { machine: ['xl', TOUR_CFG], pose: (v, i, t) => push(v.fullPose(-0.5), 1.2, 0.9, t) },
  shelf: { machine: ['xl', TOUR_CFG], pose: (v, i, t) => {
    const p = push(v.shelfPose(i, (i % 2 ? 0.22 : -0.22) * (1 - t * 0.6)), 1.25, 0.62, t);
    p.x += v.machine.dims.winW * 0.16 * (t - 0.5) * (i % 2 ? -1 : 1); // drift along the shelf while closing in
    return p;
  } },
  compact: { machine: ['compact'], pose: (v, i, t) => push(v.fullPose(-0.85 + 0.3 * t), 1.15, 0.9, t) },
  standard: { machine: ['standard'], pose: (v, i, t) => push(v.fullPose(0.7 - 0.3 * t), 1.15, 0.9, t) },
  xl: { machine: ['xl'], pose: (v, i, t) => push(v.fullPose(-0.6 + 0.25 * t), 1.15, 0.9, t) },
  compare: { machine: ['xl'], pose: (v, i, t) => push(v.fullPose(-2.7 + 0.5 * t), 1.1, 0.95, t) },
  capacity: { fast: true, machine: () => [capState.machine, capState.config], pose: (v, i, t) => push(v.fullPose(-0.26, 0.06), 1.1, 0.96, t) },
  why1: { machine: ['standard'], pose: (v, i, t) => push(v.fullPose(0.65 - 0.3 * t), 1.12, 0.86, t) },
  why2: { machine: ['standard'], pose: (v, i, t) => push(v.partPose('ctrl', 0.32), 1.5, 0.8, t) },
  process: { machine: ['standard'], pose: (v, i, t) => push(v.partPose('bin', -0.3), 1.5, 0.85, t) },
  places: { fast: true, room: true, machine: () => [room.machine], pose: (v) => v.roomPose(mobile.matches ? 0 : 0.2) },
  request: { fast: true, machine: ['xl', TOUR_CFG], pose: (v, i, t) => push(v.fullPose(-0.5 + 0.2 * t), 1.1, 0.95, t) },
};

const chapters = $$('.chapter');
const panels = chapters.map((c) => $('.panel', c));
let active = null, swapTimer;
const key = (id, cfg) => id + '|' + (cfg || MACHINES[id].config).join(',');

function applyScene(el) {
  if (!viewer || !viewer.machine) return;
  const sc = SCENES[el.dataset.ch], [id, cfg] = typeof sc.machine === 'function' ? sc.machine() : sc.machine;
  const cur = viewer.machine;
  // every machine that comes on stage gets stocked in front of the visitor
  if (key(cur.spec.id, cur.config) !== key(id, cfg)) viewer.setMachine(id, cfg, true);
  if (sc.room) {
    loadPeople().then(() => {
      if (active !== el) return;
      if (roomGroup) disposeRoom(roomGroup);
      roomGroup = buildRoom(room, viewer.machine.dims);
      viewer.setRoom(roomGroup);
      viewer.setLighting(room.light);
    });
  } else if (viewer.room) {
    viewer.setRoom(null);
    viewer.setLighting(userLight);
  }
}

function activate(el, instant) {
  if (el === active) return;
  active = el;
  const sc = SCENES[el.dataset.ch];
  stage.classList.toggle('in-room', !!sc.room);
  backdrop.classList.toggle('on', !!sc.room);
  if (!viewer) return;
  viewer.setRegion(regionFor(sc.room), instant);
  viewer.userGoal = 0;
  // swapping machines is the expensive part, so wait until scrolling settles on a chapter
  clearTimeout(swapTimer);
  if (instant) applyScene(el); else swapTimer = setTimeout(() => applyScene(el), 160);
}

// Scrolling does not move the page. It moves the camera forward, and each chapter's
// text arrives from a distance, fills in piece by piece, then flies past.
const HOLD = 0.8;            // share of a chapter spent in front of its text
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const smooth = (n) => n * n * (3 - 2 * n);

// the pieces of a panel that reveal one at a time
function units(panel) {
  const out = [];
  for (const el of panel.children) {
    if (el.matches('.tour-items, .blist, .vsteps')) out.push(...el.children);
    else if (el.matches('.spec')) { out.push(...el.querySelectorAll('dl > div')); out.push(...[...el.children].filter((c) => c.tagName !== 'DL')); }
    else out.push(el);
  }
  return out;
}

const bar = $('#progress');
let scene = { a: 0, t: 0, s: 0 }; // chapter index, progress through it, blend toward the next one
function onScroll() {
  const mid = innerHeight * 0.5, last = chapters.length - 1;
  let cur = 0;
  chapters.forEach((c, i) => {
    const r = c.getBoundingClientRect(), u = (mid - r.top) / r.height, p = panels[i];
    if (u >= 0 && (u < 1 || i === last)) cur = i;
    // approach (far, small) -> hold -> fly past (near, large)
    let o, s;
    // the outgoing text is gone before the incoming text is readable, so the two never clash
    if (u < 0) { const a = clamp01(1 + u / 0.12); o = a; s = 0.5 + 0.5 * smooth(a); }
    else if (u <= HOLD || i === last) { o = 1; s = 1; }
    else { const b = clamp01((u - HOLD) / (1 - HOLD)); o = clamp01(1 - b * 1.9); s = 1 + smooth(b) * (mobile.matches ? 0.35 : 1.1); }
    if (i === 0 && u < 0) { o = 1; s = 1; }
    p.style.setProperty('--o', o.toFixed(3));
    p.style.setProperty('--s', s.toFixed(3));
    p.classList.toggle('live', o > 0.6 && u >= -0.05);
    p.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    if (o > 0.01) {
      const list = units(p), fast = SCENES[c.dataset.ch].fast || i === 0;
      const shownCount = fast ? list.length : Math.max(2, Math.ceil(clamp01(u / (HOLD * 0.72)) * list.length));
      list.forEach((el, k) => el.classList.toggle('far', k >= shownCount));
    }
    if (i === cur) scene = { a: i, t: clamp01(u / HOLD), s: i === last ? 0 : smooth(clamp01((u - HOLD) / (1 - HOLD))) };
  });
  activate(chapters[scene.s > 0.5 ? Math.min(last, cur + 1) : cur]);
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}

// the camera follows the scroll continuously: within a chapter it pushes in, and near the
// end of a chapter it blends into the next chapter's opening shot
const poseOf = (v, idx, t) => { const c = chapters[idx]; return SCENES[c.dataset.ch].pose(v, +c.dataset.i || 0, t); };
if (viewer) viewer.setPose((v) => {
  const a = poseOf(v, scene.a, scene.t);
  if (scene.s <= 0 || scene.a >= chapters.length - 1) return a;
  const b = poseOf(v, scene.a + 1, 0), out = {};
  for (const key in a) out[key] = a[key] + (b[key] - a[key]) * scene.s;
  return out;
}, true);

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
mobile.addEventListener('change', () => { const a = active; active = null; if (a) activate(a, true); });
if (viewer) viewer.ready.then(() => { const a = active || chapters[0]; active = null; activate(a, true); onScroll(); viewer.setConfig(viewer.machine.config, true); });
onScroll();

// ---------------------------------------------------------------- lighting
$$('[data-light]').forEach((b) => b.addEventListener('click', () => {
  userLight = b.dataset.light;
  $$('[data-light]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  if (viewer && !viewer.room) viewer.setLighting(userLight);
}));

// ---------------------------------------------------------------- places
$('#place-list').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#place-list button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  room = ROOMS[+b.dataset.i];
  labelRoom();
  showBackdrop();
  if (active && active.dataset.ch === 'places') applyScene(active);
});
function showBackdrop() {
  const r = room, photo = new Image();
  photo.onload = () => { if (room === r) backdrop.style.backgroundImage = `url(${photo.src})`; };
  photo.src = placeImage(r);
}
showBackdrop();

// ---------------------------------------------------------------- capacity visualizer
const totalEl = $('#cap-total');
let shown = 0, countRaf;
function countTo(n) {
  cancelAnimationFrame(countRaf);
  const from = shown, t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
    shown = Math.round(from + (n - from) * e);
    totalEl.textContent = shown;
    if (k < 1) countRaf = requestAnimationFrame(step);
  };
  countRaf = requestAnimationFrame(step);
}

function renderCap() {
  const m = MACHINES[capState.machine], cap = computeCapacity(m, capState.config);
  $('#cap-shelves').innerHTML = cap.shelves.map((s, i) => `
    <div class="shelf-row">
      <span class="code" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
      <select data-shelf="${i}" aria-label="Shelf ${String.fromCharCode(65 + i)} product">
        ${TYPES.map((t) => `<option value="${t}" ${t === s.product ? 'selected' : ''}>${PRODUCTS[t].name}</option>`).join('')}
      </select>
      <span class="u">${s.units}</span>
    </div>`).join('');
  $('#cap-sel').textContent = cap.selections;
  $('#cap-rows').textContent = m.shelves;
  countTo(cap.total);
  $$('#cap-machines button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === capState.machine));
  if (active && active.dataset.ch === 'capacity') applyScene(active);
}

$('#cap-machines').innerHTML = ORDER.map((id) => `<button data-id="${id}">${MACHINES[id].name.split(' ')[0]}</button>`).join('');
$('#cap-presets').innerHTML = PRESETS.map((p, i) => `<button data-preset="${i}">${p.name}</button>`).join('');
$('#cap-machines').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  capState.machine = b.dataset.id; capState.config = MACHINES[b.dataset.id].config.slice();
  renderCap();
});
$('#cap-presets').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  capState.config = PRESETS[+b.dataset.preset].seq.slice(0, MACHINES[capState.machine].shelves);
  shown = 0; renderCap();
});
$('#cap-shelves').addEventListener('change', (e) => {
  const i = e.target.dataset.shelf;
  capState.config[+i] = e.target.value;
  renderCap();
  $(`#cap-shelves [data-shelf="${i}"]`)?.focus();
});
$('#cap-refill').addEventListener('click', () => {
  shown = 0; renderCap();
  if (viewer && active && active.dataset.ch === 'capacity') viewer.setConfig(capState.config, true);
});
renderCap();

// ---------------------------------------------------------------- "Request the Compact" buttons
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-request]'); if (!b) return;
  const radio = $(`#inquiry input[name="machine"][value="${b.dataset.request}"]`);
  if (radio) radio.checked = true;
  $('#request').scrollIntoView({ behavior: 'smooth' });
});

// close the mobile menu after picking a section
$$('#nav-links a').forEach((a) => a.addEventListener('click', () => $('#nav-links').classList.remove('open')));
