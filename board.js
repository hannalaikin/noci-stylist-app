/* ---------- the board: a pinterest style collage she can move around. no prices on it. ---------- */
const PAPERS = [['cream', '#faf9f6'], ['white', '#ffffff'], ['blush', '#f3dfe0'], ['sage', '#dfe4d6'], ['chocolate', '#3a2a22'], ['black', '#131110']];
function moodQueries(looks) {
  const fromBrain = Array.isArray(LOOKS.mood) ? LOOKS.mood.filter(x => typeof x === 'string' && x.trim()).slice(0, 5) : [];
  if (fromBrain.length >= 3) return fromBrain;
  const occ = (S.q.occasion || '').trim(); const words = (S.q.words || '').trim(); const when = (S.q.when || '').trim();
  const palName = (typeof PAL_NAME !== 'undefined' && PAL_NAME[S.q.palette]) || S.q.palette || '';
  const q = [];
  if (occ) q.push(`${occ} ${words}`.trim() + ' vogue editorial');
  if (palName) q.push(palName.split(',')[0] + ' silk satin fabric close up');
  if (looks[0] && looks[0].hair) q.push(looks[0].hair + ' beauty editorial');
  if (occ) q.push(`${occ} ${when} fashion campaign`.trim());
  return q.length ? q : ['fall wedding guest editorial', 'slick low bun editorial', 'wine and chocolate fabric texture'];
}
const MOOD_DOMAINS = ['vogue.com', 'harpersbazaar.com', 'elle.com', 'wmagazine.com', 'thecut.com', 'whowhatwear.com', 'net-a-porter.com', 'ssense.com', 'mytheresa.com', 'farfetch.com', 'matchesfashion.com', 'porter.com', 'cntraveler.com', 'architecturaldigest.com', 'theknot.com', 'vogue.co.uk', 'brides.com'];
const STOCK = /shutterstock|istock|dreamstime|alamy|gettyimages|123rf|depositphotos|stock\.adobe|freepik|pexels|unsplash|pixabay|vecteezy|etsy|aliexpress|amazon|ebay|temu|shein|walmart|target\.com|pinimg|fbcdn|instagram|lookaside|tiktok|youtube|wedsociety|theknot\.com\/marketplace|zola|weddingwire|squarespace-cdn.*logo|wp-content\/uploads\/.*(logo|icon)/i;
const EDITORIAL = /vogue|harpersbazaar|elle\.|wmagazine|thecut|whowhatwear|net-a-porter|ssense|mytheresa|farfetch|matchesfashion|porter\.com|cntraveler|architecturaldigest|brides\.com|graziamagazine|dazeddigital|i-d\.|nytimes|nymag|refinery29|byrdie|coveteur|marieclaire|instyle|glamour|townandcountry|veranda|marthastewart|cdn\.shopify|zara|aritzia|thereformation|mango|cos\.com|arket|toteme|khaite|therow|jacquemus|loewe|prada|gucci|dior|chanel|ysl|bottegaveneta|celine|valentino|ferragamo|maxmara|zimmermann|selfridges|harrods|bergdorf|neimanmarcus|saks|nordstrom|moda\s?operandi|modaoperandi|shopbop|revolve/i;
async function fetchMoodImages(queries) {
  if (!mcpNs) return [];
  liveStatus('pulling the mood…');
  const found = []; const seenPage = new Set(); const seenTitle = new Set(); const perHost = {};
  const keep = (x, qi) => { if (!x || !x.imageUrl || !/^https?:/.test(x.imageUrl) || STOCK.test(x.imageUrl + ' ' + (x.url || ''))) return; if ((x.imageWidth || 900) < 600) return; const host = x.imageUrl.split('/')[2]; const page = String(x.url || '').split('?')[0]; const title = String(x.title || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 40); if (seenPage.has(page) || (title && seenTitle.has(title))) return; if ((perHost[host] || 0) >= 2) return; seenPage.add(page); if (title) seenTitle.add(title); perHost[host] = (perHost[host] || 0) + 1; found.push({ q: qi, src: x.imageUrl, title: x.title || '', page }); };
  await Promise.all(queries.slice(0, 5).map(async (query, qi) => {
    try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: query + ' harpers bazaar vogue', sources: [{ type: 'images' }], limit: 10 }, { cache: false }); (((r.payload || {}).data || {}).images || []).forEach(x => keep(x, qi)); } catch (e) {}
    if (found.filter(f => f.q === qi).length < 2) { try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: query + ' vogue editorial', sources: [{ type: 'images' }], limit: 10 }, { cache: false }); (((r.payload || {}).data || {}).images || []).forEach(x => keep(x, qi)); } catch (e) {} }
  }));
  if (!found.length) { for (const query of queries.slice(0, 2)) { try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query, sources: [{ type: 'images' }], limit: 8 }, { cache: false }); (((r.payload || {}).data || {}).images || []).forEach(x => { if (x && x.imageUrl && /^https?:/.test(x.imageUrl) && !STOCK.test(x.imageUrl + ' ' + (x.url || ''))) found.push({ q: 0, src: x.imageUrl, title: x.title || '', page: x.url || '' }); }); } catch (e) {} if (found.length) break; } }
  const perQuery = {}; const pick = [];
  const ranked = found.map(f => ({ ...f, ed: EDITORIAL.test(f.src + ' ' + f.page) ? 1 : 0 })).sort((a, b) => a.q - b.q || b.ed - a.ed);
  for (const f of ranked) { perQuery[f.q] = (perQuery[f.q] || 0) + 1; if (perQuery[f.q] <= 2) pick.push(f); }
  const got = await fetchImages(pick.slice(0, 10).map(p => p.src));
  liveStatus('');
  return pick.map(p => ({ ...p, img: got[p.src] })).filter(p => p.img);
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
/* the board grid: 6 columns, 6 rows, even gutters; slots are [col, row, colspan, rowspan] */
const G = { cols: 6, rows: 6, gap: 1.6 };
function slotBox(c, r, cs, rs) { const cw = (100 - G.gap * (G.cols + 1)) / G.cols; const rh = (100 - G.gap * (G.rows + 1)) / G.rows; return [G.gap + (c - 1) * (cw + G.gap), G.gap + (r - 1) * (rh + G.gap), cs * cw + (cs - 1) * G.gap, rs * rh + (rs - 1) * G.gap]; }
const TEMPLATE = {
  hero: [1, 1, 2, 3], title: [3, 1, 2, 2],
  photos: [[5, 1, 2, 2], [1, 4, 2, 3], [3, 5, 2, 2], [5, 5, 2, 2]],
  cuts: [[3, 3, 1, 2], [4, 3, 1, 2], [5, 3, 1, 2], [6, 3, 1, 2]]
};
function pct(box) { return `left:${box[0]}%;top:${box[1]}%;width:${box[2]}%;height:${box[3]}%`; }
/* the collage: a square tile, the title inside at the top, product shots layered loosely on white, one editorial photo. slots [left, top, w, h] in % */
const CLUSTER_MANY = {
  garment: [[6, 15, 34, 60], [30, 19, 34, 54], [58, 48, 24, 34]],
  jewel: [[72, 15, 18, 12], [8, 80, 16, 12]],
  shoe: [[38, 74, 26, 20], [10, 76, 22, 18]],
  bag: [[56, 64, 24, 26], [78, 66, 18, 22]],
  extra: [[24, 78, 14, 16], [82, 44, 14, 16]],
  photo: [[62, 15, 32, 42]]
};
const CLUSTER_FEW = {
  garment: [[6, 15, 44, 72], [44, 18, 36, 56]],
  jewel: [[74, 16, 18, 13]],
  shoe: [[54, 70, 30, 22]],
  bag: [[62, 52, 26, 26]],
  extra: [[10, 82, 14, 12]],
  photo: [[58, 15, 36, 44]]
};
let CLUSTER = CLUSTER_MANY;
function kindOf(it) { const n = ((it.name || '') + ' ' + (it.id || '') + ' ' + (it.slot || '')).toLowerCase(); if (/shoe|sandal|heel|boot|mule|pump|loafer|sneaker|\bflats?\b|slingback|thong/.test(n)) return 'shoe'; if (/\bbag\b|clutch|tote|purse|pouch|handbag/.test(n)) return 'bag'; if (/earring|hoop|necklace|bracelet|\bring\b|belt|sunglass|hair clip|scarf|cuff|pendant/.test(n)) return 'jewel'; if (/perfume|fragrance|lipstick|lip|nail|candle|book/.test(n)) return 'extra'; return 'garment'; }
function collageHTML(look, mood, opts) {
  opts = opts || {};
  const items = (look.items || []).filter(i => i);
  CLUSTER = items.length <= 4 ? CLUSTER_FEW : CLUSTER_MANY;
  const taken = new Set(); const place = kind => { for (const c of CLUSTER[kind] || []) { const k = c.join(','); if (!taken.has(k)) { taken.add(k); return c; } } return null; };
  let html = `<div class="btitle line tile" style="position:absolute;left:0;right:0;max-width:none">${look.title || ''}</div>`;
  let zi = 2;
  items.forEach(it => {
    const kind = kindOf(it); const id = 'bt' + Math.random().toString(36).slice(2, 8); it.tileId = id;
    const c = place(kind) || place('extra'); if (!c) return;
    const style = `left:${c[0]}%;top:${c[1]}%;width:${c[2]}%;height:${c[3]}%;z-index:${kind === 'garment' ? zi++ : 6}`;
    if (it.flat) html += `<div class="photo tile prod flat ${kind}" id="${id}" data-url="${it.url || ''}" style="${style}"><img alt="" src="${it.flat}"></div>`;
    else if (it.img) html += `<div class="photo tile prod ${kind}" id="${id}" data-url="${it.url || ''}" style="${style}"><img alt="" src="${it.img}"></div>`;
    else html += `<div class="photo tile empty ${kind}" id="${id}" data-url="${it.url || ''}" style="${style}"><span>${(it.brand ? it.brand + ' ' : '') + (it.name || 'this piece')}<br><small>no clean picture. tap, then replace with a photo or swap with a link.</small></span></div>`;
  });
  if (mood) { const c = place('photo'); if (c) html += `<div class="photo tile mood" title="${(mood.title || '').replace(/"/g, '')}" style="left:${c[0]}%;top:${c[1]}%;width:${c[2]}%;height:${c[3]}%;z-index:1"><img alt="" src="${mood.img}"></div>`; }
  return html;
}
function pickMood(mood) {
  const occWords = ((S.q.occasion || '') + ' ' + (LOOKS.setting || '') + ' ' + (S.q.words || '')).toLowerCase().match(/[a-z]{5,}/g) || [];
  const fits = m => occWords.some(w => (m.title + ' ' + m.page).toLowerCase().includes(w));
  return mood.find(m => m.q === 0 && fits(m)) || mood.find(m => fits(m)) || mood.find(m => m.q === 0) || null;
}
async function buildBoard(looks) {
  const board = $('#board'); board.classList.add('square');
  board.innerHTML = '<p class="small" style="padding:16px">pulling the mood…</p>';
  const mood = await fetchMoodImages(moodQueries(looks));
  S.mood = mood; const m0 = pickMood(mood); const m1 = mood.find(m => m !== m0) || m0;
  board.innerHTML = collageHTML(looks[0], m0);
  wireBoard();
  boardTools();
  const b2 = document.getElementById('board-2'); if (b2 && looks[1]) { b2.classList.add('square'); b2.innerHTML = collageHTML(looks[1], m1); wireBoard(b2); }
}
function wireBoard(boardEl) {
  const board = boardEl || $('#board'); let drag = null;
  board.querySelectorAll('.tile').forEach(t => { t.style.cursor = 'grab'; t.style.touchAction = 'none'; if (!t.classList.contains('line')) t.style.userSelect = 'none'; t.querySelectorAll('img').forEach(i => i.draggable = false); });
  board.querySelectorAll('.line').forEach(l => { l.contentEditable = 'true'; l.spellcheck = false; l.style.cursor = 'text'; });
  const select = t => { board.querySelectorAll('.tile').forEach(x => { x.classList.remove('sel'); const h = x.querySelector('.hd'); if (h) h.remove(); }); if (!t) { S.selTile = null; return; } t.classList.add('sel'); S.selTile = t; const h = document.createElement('i'); h.className = 'hd'; t.appendChild(h); };
  board.onpointerdown = e => {
    const t = e.target.closest('.tile'); if (!t) { select(null); return; }
    const r = board.getBoundingClientRect(); const tr = t.getBoundingClientRect();
    board.querySelectorAll('.tile').forEach(x => x.style.zIndex = '1'); t.style.zIndex = '5'; select(t);
    if (e.target.classList.contains('hd')) { drag = { t, r, resize: true, x0: e.clientX, y0: e.clientY, w0: tr.width, h0: tr.height }; }
    else if (t.classList.contains('line') && e.detail > 0 && document.activeElement === t) { return; }
    else { drag = { t, dx: e.clientX - tr.left, dy: e.clientY - tr.top, r }; }
    t.setPointerCapture && t.setPointerCapture(e.pointerId); if (!t.classList.contains('line')) e.preventDefault();
  };
  board.onpointermove = e => {
    if (!drag) return;
    if (drag.resize) { const w = Math.max(6, ((drag.w0 + e.clientX - drag.x0) / drag.r.width) * 100); const h = Math.max(6, ((drag.h0 + e.clientY - drag.y0) / drag.r.height) * 100); drag.t.style.width = w + '%'; if (!drag.t.classList.contains('line') && !drag.t.classList.contains('dots')) drag.t.style.height = h + '%'; drag.t.style.maxWidth = 'none'; return; }
    const x = ((e.clientX - drag.dx - drag.r.left) / drag.r.width) * 100; const y = ((e.clientY - drag.dy - drag.r.top) / drag.r.height) * 100;
    drag.t.style.left = Math.max(-10, Math.min(95, x)) + '%'; drag.t.style.top = Math.max(-10, Math.min(95, y)) + '%'; drag.t.style.right = 'auto'; drag.t.style.bottom = 'auto';
  };
  board.onpointerup = board.onpointercancel = () => { drag = null; };
  board.ondblclick = e => { const t = e.target.closest('.tile'); if (t && !t.classList.contains('line')) t.remove(); };
  board.onkeydown = e => { if ((e.key === 'Backspace' || e.key === 'Delete') && S.selTile && !S.selTile.classList.contains('line')) { S.selTile.remove(); S.selTile = null; } };
  board.tabIndex = 0;
}
function scaleTile(f) {
  const t = S.selTile; if (!t) { const n = document.getElementById('bd-note'); if (n) n.textContent = 'tap a tile first.'; return; }
  const w = parseFloat(t.style.width) || 20; t.style.width = Math.max(6, w * f) + '%'; t.style.maxWidth = 'none';
  if (!t.classList.contains('line') && !t.classList.contains('dots')) { const h = parseFloat(t.style.height) || 20; t.style.height = Math.max(6, h * f) + '%'; }
  if (t.classList.contains('line')) { const fs = parseFloat(getComputedStyle(t).fontSize); t.style.fontSize = (fs * f) + 'px'; }
}
function boardTools() {
  let tools = document.getElementById('boardtools');
  if (!tools) { tools = document.createElement('div'); tools.id = 'boardtools'; tools.className = 'small'; tools.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:-4px 0 14px'; const grid = $('#board').closest('.lookgrid'); (grid || $('#board')).insertAdjacentElement('afterend', tools); }
  tools.innerHTML = '<span>both boards are editable: tap a tile, drag it, pull the red corner to resize, or use the buttons. tap the words to edit them. paper:</span>' + PAPERS.map(p => `<button type="button" class="paper" data-c="${p[1]}" title="${p[0]}" style="width:22px;height:22px;border-radius:50%;border:1px solid var(--hairline);background:${p[1]};padding:0"></button>`).join('') + '<button type="button" id="bd-shuffle" class="bt">shuffle</button><button type="button" id="bd-up" class="bt">bigger</button><button type="button" id="bd-down" class="bt">smaller</button><button type="button" id="bd-front" class="bt">to front</button><button type="button" id="bd-off" class="bt">take off</button><button type="button" id="bd-text" class="bt">add a line</button><button type="button" id="bd-photo" class="bt">add a photo</button><button type="button" id="bd-replace" class="bt">replace with a photo</button><button type="button" id="bd-swap" class="bt">swap with a link</button><input type="file" id="bd-file2" accept="image/*" hidden><button type="button" id="bd-find" class="bt">find a photo</button><input type="file" id="bd-file" accept="image/*" multiple hidden><button type="button" id="bd-bigger" class="bt">tall / square</button><span id="bd-note" style="flex-basis:100%"></span>';
  tools.querySelectorAll('.paper').forEach(bn => bn.onclick = () => { const c = bn.dataset.c; const b2 = document.getElementById('board-2'); if (b2) b2.style.background = c; $('#board').style.background = c; const dark = /^#(1|2|3)/.test(c); $('#board').style.color = dark ? '#faf9f6' : ''; S.paper = c; });
  document.getElementById('bd-shuffle').onclick = () => { $('#board').querySelectorAll('.tile').forEach(t => { if (t.classList.contains('caption')) return; const l = parseFloat(t.style.left) || 0, tp = parseFloat(t.style.top) || 0; t.style.left = Math.max(0, Math.min(90, l + (Math.random() * 8 - 4))) + '%'; t.style.top = Math.max(0, Math.min(90, tp + (Math.random() * 8 - 4))) + '%'; }); };
  document.getElementById('bd-up').onclick = () => scaleTile(1.2); document.getElementById('bd-down').onclick = () => scaleTile(1 / 1.2);
  document.getElementById('bd-front').onclick = () => { if (S.selTile) { $('#board').querySelectorAll('.tile').forEach(x => x.style.zIndex = '1'); S.selTile.style.zIndex = '6'; } };
  document.getElementById('bd-off').onclick = () => { if (S.selTile) { S.selTile.remove(); S.selTile = null; } };
  document.getElementById('bd-text').onclick = () => { const l = document.createElement('div'); l.className = 'line tile'; l.style.cssText = 'left:40%;top:40%;max-width:40%'; l.textContent = 'your line here'; $('#board').appendChild(l); wireBoard(); l.focus(); };
  document.getElementById('bd-photo').onclick = () => { const f = document.getElementById('bd-file'); f.value = ''; f.click(); };
  document.getElementById('bd-replace').onclick = () => { if (!S.selTile) { document.getElementById('bd-note').textContent = 'tap the tile first.'; return; } const f = document.getElementById('bd-file2'); f.value = ''; f.click(); };
  document.getElementById('bd-file2').onchange = async e => { const f = e.target.files[0]; if (!f || !S.selTile) return; try { const src = await shrinkFile(f); setTileImage(S.selTile, src, false); } catch (err) {} };
  document.getElementById('bd-swap').onclick = async () => { if (!S.selTile) { document.getElementById('bd-note').textContent = 'tap the tile first.'; return; } const url = await askInline('paste the product link', { placeholder: 'https://…' }); if (!url) return; const note = document.getElementById('bd-note'); note.textContent = 'reading the page…'; try { const info = await LIVE_TOOLS.find(x => x.name === 'read_page').execute({ url }); const it = { url, image: info && info.image, name: info && info.name }; const flat = await ghostShot(it); let src = flat; if (!src && it.image) { const g = await fetchImages([it.image]); src = g[it.image]; } if (!src) { note.textContent = 'no picture on that page.'; return; } setTileImage(S.selTile, src, !!flat); S.selTile.dataset.url = url; note.textContent = 'swapped: ' + (it.name || url); S.corrections = S.corrections || []; S.corrections.push({ type: 'swap', before: 'board tile', after: (it.name || '') + ' ' + url, reason: 'board', at: new Date().toISOString() }); } catch (err) { note.textContent = 'could not read that page.'; } };
  document.getElementById('bd-file').onchange = async e => { const files = [...e.target.files].slice(0, 6); for (const f of files) { try { const src = await shrinkFile(f); addPhotoTile(src); } catch (err) {} } };
  document.getElementById('bd-find').onclick = async () => {
    const q = await askInline('what should the photo show?', { placeholder: 'a phrase, or paste an image link' }); if (!q) return;
    const note = document.getElementById('bd-note'); note.textContent = 'finding it…';
    try {
      let urls = [];
      if (/^https?:\/\//.test(q.trim())) urls = [q.trim()];
      else { if (!mcpNs) { note.textContent = 'search needs the claude app; paste a link instead.'; return; } const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: q, sources: [{ type: 'images' }], limit: 6 }, { cache: false }); urls = (((r.payload || {}).data || {}).images || []).filter(x => x && x.imageUrl && /^https?:/.test(x.imageUrl) && !/pinimg|fbcdn|instagram/.test(x.imageUrl)).slice(0, 3).map(x => x.imageUrl); }
      const got = await fetchImages(urls); let n = 0; urls.forEach(u => { if (got[u]) { addPhotoTile(got[u], n++); } });
      note.textContent = n ? n + ' added. drag them where you want.' : 'nothing usable came back; try other words or a link.';
    } catch (err) { note.textContent = 'could not fetch that: ' + (err && err.message || err); }
  };
  let big = false; document.getElementById('bd-bigger').onclick = () => { big = !big; document.querySelectorAll('.board').forEach(x => x.style.aspectRatio = big ? '4/5' : '1/1'); };
}

/* picture this-or-that: the brain asks with images */
async function pictureChips(pics) {
  const wrap = document.getElementById('chips'); if (!wrap || !mcpNs) return;
  const row = document.createElement('div'); row.className = 'picrow'; row.innerHTML = pics.slice(0, 4).map((p, i) => `<button type="button" data-i="${i}"><div class="ph"></div><span>${p.label || ''}</span></button>`).join('');
  wrap.insertAdjacentElement('afterbegin', row);
  row.querySelectorAll('button').forEach(bn => bn.onclick = () => send(pics[+bn.dataset.i].label));
  const used = new Set(); const hosts = storesFor(S.q && S.q.age);
  await Promise.all(pics.slice(0, 4).map(async (p, i) => {
    const ph = row.querySelector(`button[data-i="${i}"] .ph`); if (!ph) return;
    let src = null;
    try {
      const items = (await storeSearch(String(p.search || p.label).replace(/\s+(outfit|editorial|look)\b/g, ''), hosts.slice(0, 6))).filter(x => x.image && !used.has(x.image.split('?')[0]));
      for (const it of items.slice(0, 3)) { const got = await fetchImages([it.image]); if (got[it.image]) { src = got[it.image]; used.add(it.image.split('?')[0]); remember([it]); break; } }
    } catch (e) {}
    if (!src) { try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: String(p.search || p.label) + ' dress editorial', sources: [{ type: 'images' }], limit: 6 }, { cache: false }); const cand = (((r.payload || {}).data || {}).images || []).filter(x => x && x.imageUrl && /^https?:/.test(x.imageUrl) && !/pinimg|fbcdn|instagram/.test(x.imageUrl) && !used.has(x.imageUrl)).slice(0, 3).map(x => x.imageUrl); const got = await fetchImages(cand); const u = cand.find(c => got[c]); if (u) { src = got[u]; used.add(u); } } catch (e) {} }
    if (src) ph.outerHTML = `<img alt="" src="${src}">`; else ph.textContent = p.label;
  }));
}
function runItButton() {
  if (LOOKS || turns.length < 2) return;
  let bn = document.getElementById('runit');
  if (!bn) { bn = document.createElement('button'); bn.type = 'button'; bn.id = 'runit'; bn.textContent = 'run with it'; bn.title = 'stop asking and build the looks with what we have'; document.getElementById('compose').appendChild(bn); }
  bn.onclick = () => send('run with it. build the two looks now with what you have and infer the rest.');
}

/* the rack: the stylist picks before the reveal */
async function renderRack(rack) {
  show('s-rack');
  const items = rack.map((r, i) => ({ i, slot: r.slot || '', why: r.why || '', pick: r.pick !== false, it: normItem(r.item || r) })).filter(x => x.it);
  S.rackItems = items;
  const slots = [...new Set(items.map(x => x.slot))];
  const card = x => `<label class="rk ${x.pick ? 'on' : ''}" data-i="${x.i}"><input type="checkbox" ${x.pick ? 'checked' : ''}>${x.it.img ? `<img alt="" src="${x.it.img}">` : '<div class="ph">pulling…</div>'}<b>${x.it.brand ? x.it.brand + ' ' : ''}${x.it.name}</b><span>${x.it.price ? '$' + x.it.price + ' · ' : ''}${x.it.retailer || ''}</span><em>${x.why}</em><a href="${x.it.url || '#'}" target="_blank" rel="noopener">open</a></label>`;
  $('#rackgrid').innerHTML = slots.map(sl => `<p class="eyebrow" style="grid-column:1/-1;margin-top:8px">${sl || 'pieces'}</p>` + items.filter(x => x.slot === sl).map(card).join('')).join('');
  $('#rackgrid').querySelectorAll('.rk input').forEach(cb => cb.onchange = () => cb.closest('.rk').classList.toggle('on', cb.checked));
  $('#rack-note').textContent = `${items.length} pieces on the rack from ${[...new Set(items.map(x => x.it.retailer).filter(Boolean))].length} stores. untick what is not her; add a line if you want; then build. photos are loading.`;
  let k = 0; const need = items.filter(x => !x.it.img && x.it.image);
  const fill = async () => { while (k < need.length) { const x = need[k++]; let got = {}; try { got = await fetchImages([x.it.image]); } catch (e) {} x.it.img = got[x.it.image] || null; const el = $('#rackgrid').querySelector(`.rk[data-i="${x.i}"] .ph`); if (el) el.outerHTML = x.it.img ? `<img alt="" src="${x.it.img}">` : '<div class="ph">no photo, open the link</div>'; } };
  await Promise.all(Array.from({ length: 4 }, fill));
  $('#rack-note').textContent = $('#rack-note').textContent.replace(' photos are loading.', '');
}
function rackPicks() { return (S.rackItems || []).filter(x => $('#rackgrid').querySelector(`.rk[data-i="${x.i}"] input`).checked); }
$('#rack-build').onclick = () => {
  const picks = rackPicks(); if (!picks.length) { $('#rack-note').textContent = 'tick at least one piece.'; return; }
  const note = $('#rack-line').value.trim();
  S.rackPicked = true; show('s-call');
  send(`(the stylist picked from the rack: ${picks.map((x, n) => `${n + 1}) ${x.it.brand || ''} ${x.it.name} ${x.it.url || ''}`.trim()).join('; ')}.${note ? ' stylist note: ' + note + '.' : ''} build the final two looks and one held from these pieces only, fill any empty slot from the catalog or one more search, and reply with the looks JSON now, no options.)`);
};
$('#rack-auto').onclick = () => { const all = S.rackItems || []; S.rackPicked = true; show('s-call'); send(`(build the two looks and one held from the rack as you see it. the rack: ${all.map((x, n) => `${n + 1}) ${x.slot || ''} ${x.it.brand || ''} ${x.it.name} $${x.it.price || ''} ${x.it.url || ''}`.trim()).join('; ')}. every item a full live object copied from these with name, brand, url, price, image. no placeholders, no empty looks. reply with the looks JSON now, no options.)`); };
$('#rack-more').onclick = () => { show('s-call'); $('#msg').focus(); };

function shrinkFile(file) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const img = new Image(); img.onload = () => { const m = 700 / Math.max(img.width, img.height, 700); const c = document.createElement('canvas'); c.width = Math.round(img.width * m); c.height = Math.round(img.height * m); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; img.onerror = rej; img.src = fr.result; }; fr.readAsDataURL(file); });
}
function addPhotoTile(src, n) {
  n = n || 0; const board = (S.selTile && S.selTile.closest('.board')) || $('#board'); const d = document.createElement('div'); d.className = 'photo tile mood'; d.style.cssText = `left:${34 + n * 6}%;top:${30 + n * 5}%;width:28%;height:32%;z-index:6`; d.innerHTML = `<img alt="" src="${src}">`; board.appendChild(d); wireBoard();
  board.querySelectorAll('.tile').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); S.selTile = d; const h = document.createElement('i'); h.className = 'hd'; d.appendChild(h);
}

/* narrow it, live: brands first, then real pieces from those brands for her occasion */
const OCC_WORDS = { 'a bachelorette': 'bachelorette', 'a wedding': 'wedding guest', 'a night out': 'going out', 'a work thing': 'workwear', 'a trip': 'vacation', 'a date': 'date night', 'a birthday': 'birthday' };
const BRAND_NAMES = { 'us.princesspolly.com': 'princess polly', 'meshki.us': 'meshki', 'whitefoxboutique.com': 'white fox', 'www.edikted.com': 'edikted', 'www.beginningboutique.com': 'beginning boutique', 'www.dissh.com': 'dissh', 'withjean.com': 'with jean', 'www.becandbridge.com': 'bec and bridge', 'www.ohpolly.com': 'oh polly', 'www.frankiesbikinis.com': 'frankies', 'www.tonybianco.com': 'tony bianco', 'www.stevemadden.com': 'steve madden', 'us.sirthelabel.com': 'sir', 'www.posse.com': 'posse', 'damsonmadder.com': 'damson madder', 'kitristudio.com': 'kitri', 'www.faithfullthebrand.com': 'faithfull', 'www.aya-muse.com': 'aya muse', 'silklaundry.com': 'silk laundry', 'www.cultgaia.com': 'cult gaia', 'staud.clothing': 'staud', 'www.hemantandnandita.com': 'hemant and nandita', 'us.missoma.com': 'missoma', 'www.alohas.io': 'alohas', 'www.byfar.com': 'by far', 'www.gorjana.com': 'gorjana', 'www.bychari.com': 'by chari', 'www.aninebing.com': 'anine bing', 'www.everlane.com': 'everlane', 'shopdoen.com': 'doen', 'www.christydawn.com': 'christy dawn', 'www.hillhousehome.com': 'hill house', 'www.aloyoga.com': 'alo' };
async function narrowLive() {
  const q = S.q; const row = $('#brand-row'); const note = $('#pick-note');
  if (!mcpNs) { $('#brand-h').textContent = 'live brands need the claude app; these are the built in pieces.'; row.innerHTML = ''; $('#brand-go').hidden = true; return; }
  $('#brand-go').hidden = false;
  const hosts = storesFor(q.age).filter(h => !/tonybianco|stevemadden|missoma|alohas|byfar|gorjana|bychari|aloyoga|frankies/.test(h));
  const typed = (q.brands || '').split(/[,;/]| and /).map(x => x.trim().toLowerCase()).filter(Boolean);
  S.brandPick = new Set(hosts.filter(h => typed.some(t => t && BRAND_NAMES[h].includes(t))));
  row.innerHTML = hosts.map(h => `<button type="button" data-h="${h}" class="${S.brandPick.has(h) ? 'on' : ''}">${BRAND_NAMES[h] || h}</button>`).join('');
  row.querySelectorAll('button').forEach(bn => bn.onclick = () => { const h = bn.dataset.h; if (S.brandPick.has(h)) { S.brandPick.delete(h); bn.classList.remove('on'); } else { if (S.brandPick.size >= 4) return; S.brandPick.add(h); bn.classList.add('on'); } });
  note.textContent = typed.length ? `she shops ${typed.join(', ')}; the ones we can search are ticked. add up to four.` : 'the pieces below are built in until you pick her brands.';
  $('#brand-go').onclick = () => narrowSearch([...S.brandPick]);
}
async function narrowSearch(hosts) {
  const q = S.q; const note = $('#pick-note'); const grid = $('#pick-grid');
  if (!hosts.length) { note.textContent = 'tap at least one brand first.'; return; }
  const colour = ((typeof PAL_NAME !== 'undefined' && PAL_NAME[q.palette]) || '').split(',')[0].trim() || '';
  const sil = { fitted: 'fitted', relaxed: 'relaxed', structured: 'tailored', flowy: 'flowy' }[q.silhouette] || '';
  const occ = OCC_WORDS[q.occasion] || (q.occasion || '');
  const wantsDress = /wedding|bachelorette|night|date|birthday/.test(q.occasion || '');
  const bride = /bachelorette/.test(q.occasion || '') && /bride|my bachelorette|mine/i.test(q.words || '');
  const queries = bride ? ['white dress', 'white satin dress', 'ivory dress', 'white set'] : wantsDress ? [`${colour} dress`, 'midi dress', 'maxi dress', 'satin dress'] : [`${colour} top`, 'blazer', 'trouser', 'knit'];
  note.textContent = `looking at ${hosts.map(h => BRAND_NAMES[h] || h).join(', ')} for ${occ} in ${colour || 'her colours'}…`;
  const found = []; const seen = new Set();
  await Promise.all(queries.map(async query => { try { (await storeSearch(query.replace(/\s+/g, ' ').trim(), hosts)).forEach(i => { if (i && i.url && i.image && !seen.has(i.url)) { seen.add(i.url); found.push(i); } }); } catch (e) {} }));
  if (!found.length) { note.textContent = 'those brands had nothing live for that; try another brand or the built in pieces below.'; return; }
  const pal = (typeof PAL !== 'undefined' && PAL[q.palette]) || /./;
  const occRe = { 'a wedding': /wedding|formal|event|occasion/i, 'a night out': /night|party|going/i, 'a date': /date|night/i, 'a birthday': /party|night|birthday/i, 'a work thing': /work|office/i, 'a trip': /vacation|resort|holiday/i }[q.occasion] || /./; const sc = i => (pal.test(i.title || '') ? 2 : 0) + (occRe.test((i.tags || []).join(' ') + ' ' + (i.title || '')) ? 1 : 0); const perStore = {}; const ranked = found.sort((a, b) => sc(b) - sc(a)).filter(i => { perStore[i.store] = (perStore[i.store] || 0) + 1; return perStore[i.store] <= 4; }).slice(0, 12);
  const got = await fetchImages(ranked.map(i => i.image));
  const live = ranked.filter(i => got[i.image]).slice(0, 12).map(i => ({ name: i.title, brand: prettyStore(i.store), retailer: i.store, url: i.url, price: Number(i.price) || 0, image: i.image, img: got[i.image] }));
  if (!live.length) { note.textContent = 'found pieces but no photos came through; try another brand.'; return; }
  S.liveNarrow = live; S.likesLive = []; S.likes = [];
  grid.innerHTML = live.map((it, i) => `<button type="button" data-live="${i}"><img alt="" src="${it.img}"><span>${it.brand} ${it.name}<br>${it.price ? '$' + it.price : ''}</span></button>`).join('');
  grid.querySelectorAll('button').forEach(bn => bn.onclick = () => { bn.classList.toggle('on'); S.likesLive = [...grid.querySelectorAll('button.on[data-live]')].map(x => live[+x.dataset.live]); $('#taste-err').textContent = ''; });
  note.textContent = `${live.length} real pieces for ${occ} from ${[...new Set(live.map(i => i.brand))].join(', ')}. tap every one that is her.`;
}

function prettyStore(store) { const s = String(store || ''); const k = Object.keys(BRAND_NAMES).find(h => h.replace(/^www\.|^us\./, '') === s || h === s); return k ? BRAND_NAMES[k] : s.replace(/\.(com|us|clothing|io)$/, ''); }

function setTileImage(tile, src, isFlat) { tile.classList.remove('empty', 'cut'); tile.classList.add('photo', 'prod'); tile.classList.toggle('flat', !!isFlat); tile.innerHTML = `<img alt="" src="${src}">`; const h = document.createElement('i'); h.className = 'hd'; tile.appendChild(h); tile.querySelectorAll('img').forEach(i => i.draggable = false); }

/* a mood board for someone, started from the trend page: no looks yet, just a board with a title she can fill */
async function startMoodBoard() {
  const name = await askInline('who is the board for? her first name', {}); if (name === null) return;
  const title = await askInline('what is it about? this becomes the title on the board', { placeholder: 'e.g. fall in wine, the honeymoon edit' }); if (title === null) return;
  S.q = Object.assign(S.q || {}, { fname: name.trim() || 'her', occasion: S.q && S.q.occasion || '' }); S.skip = true;
  LOOKS = { looks: [{ title: title.trim() || 'a board to start from', items: [], why: '' }], held: null, headline: `${name.trim() || 'her'}, a board to start from: ${title.trim()}`, mood: [] };
  show('s-looks');
  const lf = document.getElementById('lookfor'); if (lf) lf.textContent = `for ${S.q.fname} · a mood board · what you will send her`;
  $('#lookhead').textContent = LOOKS.headline; $('#lookhead').contentEditable = 'true'; $('#looknote').textContent = 'add pictures from the trend page with on her board, or add a photo. then save it or send it.';
  const board = $('#board'); board.classList.add('square'); board.innerHTML = `<div class="btitle line tile" style="position:absolute;left:0;right:0;max-width:none">${title.trim()}</div>`;
  $('#pcards-1').innerHTML = ''; $('#lookcards').innerHTML = ''; const lg = $('#board').closest('.lookgrid'); if (lg) lg.classList.add('solo'); const b2 = document.getElementById('board-2'); if (b2) b2.remove();
  wireBoard(); boardTools();
  try { if (typeof sendPanel === 'function') sendPanel(); } catch (e) {}
  try { if (typeof saveClient === 'function') saveClient({ boards: [{ title: title.trim(), at: new Date().toISOString() }] }); } catch (e) {}
  const note = document.getElementById('bd-note'); if (note) note.textContent = 'the board is open. go to this week\'s looks and tap on her board on anything you want on it.';
}
document.querySelectorAll('.start-board').forEach(bn => bn.onclick = () => startMoodBoard());
