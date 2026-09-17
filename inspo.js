/* ---------- this week's looks: inspo for the stylist, fed by the trend layer ---------- */
const TRENDS = [
  { name: 'the maxi skirt', line: 'full skirt, fitted top. plaid maxi with a relaxed button down and a suede boot reads heritage; satin slip with a chunky knit and a flat boot reads softer.', q: 'satin maxi skirt chunky knit outfit fall 2026 editorial', pal: ['warm', 'earth', 'denim'], occ: ['a work thing', 'a date', 'a trip'] },
  { name: 'the xl belt', line: 'an extra wide belt at the natural waist on a maxi dress or a long coat, in a shade that coordinates. the cheapest way to make what she owns look styled.', q: 'wide leather belt over maxi dress street style fall', pal: ['warm', 'earth', 'black'], occ: ['a work thing', 'a night out'] },
  { name: 'one suede piece', line: 'one suede piece, everything else fluid. a suede shirt jacket over satin trousers in a close shade, tonal not matchy.', q: 'suede shirt jacket satin trousers tonal outfit editorial', pal: ['warm', 'earth'], occ: ['a date', 'a trip', 'a work thing'] },
  { name: 'animal print as a neutral', line: 'leopard or zebra treated as a neutral with one real colour against it, red, chocolate or black. the second piece stays quiet.', q: 'leopard print skirt red top outfit street style', pal: ['warm', 'bright', 'black'], occ: ['a night out', 'a birthday', 'a date'] },
  { name: 'casual tailoring', line: 'a tweed set or a soft blazer broken with a fitted tee or a thin knit and a pointed pump. one tweed blazer over jeans does most of the work.', q: 'tweed blazer jeans pointed pump outfit editorial', pal: ['cool', 'warm', 'denim'], occ: ['a work thing', 'a date'] },
  { name: 'high low', line: 'one polished anchor, a trench, a structured bag or a heel, against one casual thing, a tee, shorts or a sneaker. the money goes into the trench and the bag.', q: 'trench coat tee sneakers structured bag outfit street style', pal: ['cool', 'warm', 'denim'], occ: ['a trip', 'a work thing'] },
  { name: 'statement fringe', line: 'one fringe piece is the whole outfit. no other texture, no print.', q: 'fringe dress evening outfit editorial 2026', pal: ['black', 'jewel', 'bright'], occ: ['a night out', 'a birthday', 'a wedding'] },
  { name: '70s boho, grounded', line: 'two boho signals at most, a ruffle blouse, a floaty midi, a slouchy boot, big sunglasses, then ground it with something plain.', q: 'boho floaty midi dress slouchy boots outfit editorial', pal: ['soft', 'earth', 'warm'], occ: ['a trip', 'a date', 'a wedding'] },
  { name: 'daytime sequins', line: 'a sequin skirt with a cozy knit in the same colour family, a flat boot or a loafer. the shine reads relaxed because the knit is.', q: 'sequin skirt with knit sweater daytime outfit', pal: ['jewel', 'cool', 'black'], occ: ['a birthday', 'a night out', 'a work thing'] },
  { name: 'moss, not chartreuse', line: 'the green that is actually in stores is moss. put the pop in an accessory, a bag or a shoe, against cream or chocolate.', q: 'moss green bag cream outfit fall editorial', pal: ['earth', 'warm', 'soft'], occ: ['a work thing', 'a date', 'a trip'] },
  { name: 'the black column, broken', line: 'head to toe black in two textures, broken at the neckline with skin, a white tee or one metal piece. one matte against one shine.', q: 'all black outfit matte and satin textures editorial', pal: ['black', 'cool'], occ: ['a night out', 'a date', 'a wedding'] },
  { name: 'the slip, dressed down', line: 'a satin slip midi with a flat boot and a soft knit over the shoulders. sexy through carriage, not skin.', q: 'satin slip dress flat boots knit cardigan outfit street style', pal: ['soft', 'jewel', 'warm'], occ: ['a date', 'a birthday', 'a wedding'] }
];
function weekKey() { const d = new Date(); const onejan = new Date(d.getFullYear(), 0, 1); const wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7); return d.getFullYear() + '-w' + wk; }
let INSPO = null;
async function openInspo() {
  show('s-inspo');
  const grid = $('#inspogrid');
  const filt = S.q && S.q.palette ? S.q.palette : '';
  const occ = S.q && S.q.occasion ? S.q.occasion : '';
  $('#inspo-note').textContent = (filt || occ) ? `sorted for her: ${[filt, occ].filter(Boolean).join(', ')}. ` : '';
  const order = TRENDS.slice().sort((a, b) => score(b) - score(a));
  function score(t) { return (filt && t.pal.includes(filt) ? 2 : 0) + (occ && t.occ.includes(occ) ? 1 : 0); }
  grid.innerHTML = order.map((t, i) => `<div class="insp" data-t="${TRENDS.indexOf(t)}"><div class="pics"><div class="ph"></div><div class="ph"></div></div><b>${t.name}</b><p>${t.line}</p><div class="chips"><button type="button" class="ib-board">on her board</button><button type="button" class="ib-ask">ask her</button></div></div>`).join('');
  grid.querySelectorAll('.insp').forEach(card => {
    const t = TRENDS[+card.dataset.t];
    card.querySelector('.ib-ask').onclick = () => { const line = `(the stylist wants to offer an idea: ${t.name}. ${t.line} ask her in one line whether that is her, as a this or that with pictures, and keep going from her answer.)`; if (turns.length) { show('s-call'); send(line); } else { $('#go-skip').click(); $('#msg').value = line; $('#call-err').textContent = 'say who it is for, then send. the idea is in the box.'; } };
    card.querySelector('.ib-board').onclick = () => { const imgs = [...card.querySelectorAll('.pics img')].map(i => i.src); if (!imgs.length) { $('#inspo-note').textContent = 'the pictures are still loading.'; return; } if (!LOOKS) { $('#inspo-note').textContent = 'there is no board yet; build her looks first. the idea is noted for the call.'; S.inspoPicked = (S.inspoPicked || []).concat(t.name); return; } imgs.slice(0, 2).forEach((src, n) => addPhotoTile(src, n)); show('s-looks'); };
  });
  await loadWeekEditorial(order, grid);
}
async function loadInspoImages(order, grid) {
  const note = $('#inspo-note');
  if (!mcpNs) { note.textContent += ' pictures need the claude app with the connectors allowed (reload and tap continue on the dialog).'; return; }
  const key = weekKey(); let urls = {};
  try { if (dbNs) { const d = await dbNs.doc('inspo/' + key).get(); if (d.exists) urls = d.data().urls || {}; } } catch (e) {}
  const missing = order.filter(t => !(urls[t.name] && urls[t.name].length));
  if (missing.length) {
    note.textContent += ' finding this week\'s pictures…';
    let i = 0, err = ''; const worker = async () => { while (i < missing.length) { const t = missing[i++]; try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: t.q, sources: [{ type: 'images' }], limit: 8 }, { cache: false }); urls[t.name] = (((r.payload || {}).data || {}).images || []).filter(x => x && x.imageUrl && /^https?:/.test(x.imageUrl) && !/pinimg|fbcdn|instagram/.test(x.imageUrl)).slice(0, 4).map(x => x.imageUrl); } catch (e) { err = e.code || e.message || 'search failed'; urls[t.name] = urls[t.name] || []; } } };
    await Promise.all(Array.from({ length: 4 }, worker));
    if (err) note.textContent += ' (search: ' + err + ')';
    try { if (dbNs) await dbNs.doc('inspo/' + key).set({ urls, at: new Date().toISOString() }); } catch (e) {}
  }
  note.textContent = note.textContent.replace(' finding this week\'s pictures…', '') + ` ${key}, refreshed weekly.`;
  let k = 0; const fill = async () => { while (k < order.length) { const t = order[k++]; const card = grid.querySelector(`.insp[data-t="${TRENDS.indexOf(t)}"]`); if (!card) continue; const pics = card.querySelector('.pics'); const list = (urls[t.name] || []).slice(0, 4); if (!list.length) { pics.innerHTML = '<div class="ph">no picture this week</div>'; continue; } pics.querySelectorAll('.ph').forEach(p => p.textContent = 'pulling…'); let got = {}; try { got = await fetchImages(list); } catch (e) {} const srcs = list.map(u => got[u]).filter(Boolean).slice(0, 2); pics.innerHTML = srcs.length ? srcs.map(s => `<img alt="" src="${s}">`).join('') : '<div class="ph">picture blocked; tap ask her anyway</div>'; } };
  await Promise.all(Array.from({ length: 3 }, fill));
}
/* what's trending: social themes, trending looks, trending people, built weekly by the brain from live search */
const SOCIAL_PRESS = ['vogue.com', 'harpersbazaar.com', 'elle.com', 'whowhatwear.com', 'thecut.com', 'refinery29.com', 'nylon.com', 'dazeddigital.com', 'wmagazine.com', 'graziamagazine.com', 'glamour.com', 'instyle.com', 'vogue.co.uk', 'wwd.com'];
async function loadSocial() {
  const grid = $('#socialgrid'); const note = $('#social-note');
  if (!mcpNs || !sampleFn) { note.textContent = 'this needs the claude app.'; return; }
  const key = weekKey() + '-social2'; let cards = null;
  try { if (dbNs) { const d = await dbNs.doc('inspo/' + key).get(); if (d.exists) cards = d.data().cards; } } catch (e) {}
  if (!cards) {
    note.textContent = 'reading this week\'s fashion press…';
    const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const qs = [`tiktok fashion aesthetic trend ${month}`, `celebrity style this week best dressed ${month}`, `street style what everyone is wearing right now ${month}`, `viral fashion moment ${month}`];
    const sources = await fetchPress(qs, SOCIAL_PRESS);
    if (!sources.length) { note.textContent = 'the press search came back empty; try again in a minute.'; return; }
    note.textContent = 'the brain is reading ' + sources.length + ' articles…';
    try {
      const r = await sampleFn.json(`You are the trend editor for a personal styling house. Today is ${new Date().toDateString()}. Below are this week's articles from the fashion press, each with its images. Write 8 cards a phone stylist can use to open a conversation: 3 social themes (the aesthetics people are naming right now, only ones the articles actually name), 3 trending looks (a specific outfit formula from the articles), 2 trending people (whose style the articles say is being copied; use the person's name, describe the clothes, never the body). Every card cites its source and takes its image from that same source's image list (copy the url exactly; pick the one that shows the clothes best). Reply with ONLY JSON, no fences, under 3200 characters: {"cards":[{"kind":"theme"|"look"|"person","title": short lowercase, "what": one sentence, "why": one sentence why a woman aged 22 to 40 cares, "line": one lowercase sentence the stylist can say on a call, "source": publication name, "url": article url, "image": image url from that source, "pal": one of warm, cool, jewel, soft, earth, bright, black, denim}]}. No dashes, no emoji, no placeholders: if you cannot fill a card from the articles, leave it out.\n\n${sources.map((s, i) => `SOURCE ${i + 1} (${s.source}) ${s.title}\nurl: ${s.url}\nimages: ${s.images.join(' | ')}\ntext: ${s.text}`).join('\n\n')}`.slice(0, 60000), { modelTier: 'default' });
      cards = Array.isArray(r.cards) ? r.cards.filter(validCard).slice(0, 8) : null;
    } catch (e) { note.textContent = 'the brain could not sort it: ' + (e.message || e.code || ''); return; }
    if (!cards || !cards.length) { note.textContent = 'no cards came back.'; return; }
    try { if (dbNs) await dbNs.doc('inspo/' + key).set({ cards, at: new Date().toISOString(), sources: sources.map(s => s.url) }); } catch (e) {}
  }
  renderSocial(cards, grid);
  note.textContent = `${weekKey()}, from ${[...new Set(cards.map(c => c.source).filter(Boolean))].join(', ')}. person cards are for the call only, never her board.`;
  wireTipButtons(grid, cards, 'i');
  let k = 0; const fill = async () => { while (k < cards.length) { const i = k++; const c = cards[i]; const card = grid.querySelector(`.insp[data-i="${i}"]`); if (!card) continue; let got = {}; try { got = await fetchImages([c.image].filter(Boolean)); } catch (e) {} const src = c.image && got[c.image]; card.querySelector('.pics').innerHTML = src ? `<img alt="" src="${src}">` : '<div class="ph">picture blocked</div>'; } };
  await Promise.all(Array.from({ length: 3 }, fill));
}
function renderSocial(cards, grid) {
  grid.innerHTML = cards.map((c, i) => `<div class="insp" data-i="${i}"><div class="pics one"><div class="ph">pulling…</div></div><span class="eyebrow">${c.kind || ''}${c.source ? ' · ' + c.source : ''}${c.pal ? ' · ' + c.pal : ''}</span><b>${c.title || ''}</b><p>${c.what || ''}</p><p class="small"><i>why she cares:</i> ${c.why || ''}</p><p class="small"><i>say:</i> ${c.line || ''}</p><div class="chips">${c.kind === 'person' ? '' : '<button type="button" class="ib-board">on her board</button>'}<button type="button" class="ib-ask">ask her</button>${c.url ? `<a href="${c.url}" target="_blank" rel="noopener" style="font-size:.78rem;align-self:center;color:#111">read it</a>` : ''}</div></div>`).join('');
  grid.querySelectorAll('.insp').forEach(card => {
    const c = cards[+card.dataset.i];
    card.querySelector('.ib-ask').onclick = () => { const line = `(the stylist wants to offer an idea from this week: ${c.title}. ${c.what} ${c.line} ask her in one line whether that is her, as a this or that with pictures where it helps, and keep going from her answer.)`; if (turns.length) { show('s-call'); send(line); } else { $('#go-skip').click(); $('#msg').value = line; $('#call-err').textContent = 'say who it is for, then send. the idea is in the box.'; } };
    const bb = card.querySelector('.ib-board'); if (bb) bb.onclick = () => { const imgs = [...card.querySelectorAll('.pics img')].map(i => i.src); if (!imgs.length) { $('#social-note').textContent = 'the pictures are still loading.'; return; } if (!LOOKS) { $('#social-note').textContent = 'there is no board yet; build her looks first.'; return; } imgs.slice(0, 2).forEach((src, n) => addPhotoTile(src, n)); show('s-looks'); };
  });
}
$('#inspo-tab-week').onclick = () => { $('#inspo-tab-week').classList.add('on'); $('#inspo-tab-social').classList.remove('on'); $('#inspo-week').hidden = false; $('#inspo-social').hidden = true; };
$('#inspo-tab-social').onclick = () => { $('#inspo-tab-social').classList.add('on'); $('#inspo-tab-week').classList.remove('on'); $('#inspo-week').hidden = true; $('#inspo-social').hidden = false; if (!$('#socialgrid').children.length) loadSocial(); };
$('#go-inspo').onclick = () => openInspo();
$('#inspo-back').onclick = () => show(turns.length ? 's-call' : 's-door');
document.querySelectorAll('.to-inspo').forEach(b => b.onclick = () => openInspo());
/* this week's looks, from the fashion press: vogue, wwd, bazaar, elle, who what wear, the cut, porter. built weekly, cached */
const PRESS = ['vogue.com', 'wwd.com', 'harpersbazaar.com', 'elle.com', 'whowhatwear.com', 'thecut.com', 'net-a-porter.com', 'vogue.co.uk', 'graziamagazine.com', 'wmagazine.com'];
function pressName(u) { const h = String(u || '').split('/')[2] || ''; return ({ 'www.vogue.com': 'vogue', 'wwd.com': 'wwd', 'www.wwd.com': 'wwd', 'www.harpersbazaar.com': "harper's bazaar", 'www.elle.com': 'elle', 'www.whowhatwear.com': 'who what wear', 'www.thecut.com': 'the cut', 'www.net-a-porter.com': 'porter', 'www.vogue.co.uk': 'british vogue', 'graziamagazine.com': 'grazia', 'www.wmagazine.com': 'w' })[h] || h.replace(/^www\./, ''); }
function mdImages(md) { const out = []; const seen = new Set(); (String(md || '').match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g) || []).forEach(m => { const u = m.replace(/^!\[[^\]]*\]\(/, ''); if (/\.svg|logo|flag|avatar|icon|w230|w100|_q\d\/|sprite|badge|pixel/i.test(u)) return; const k = u.split('?')[0]; if (seen.has(k)) return; seen.add(k); out.push(u); }); return out.slice(0, 8); }
function inPress(u, domains) { const h = String(u || '').split('/')[2] || ''; return (domains || PRESS).some(d => h === d || h.endsWith('.' + d)); }
async function fetchPress(qs, domains) {
  const sources = []; const seenUrl = new Set();
  await Promise.all(qs.map(async q => { try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: q, limit: 4, includeDomains: domains, scrapeOptions: { formats: ['markdown'], onlyMainContent: true } }, { cache: false }); (((r.payload || {}).data || {}).web || []).forEach(w => { if (!w || !w.url || seenUrl.has(w.url) || !inPress(w.url, domains)) return; seenUrl.add(w.url); const m = w.metadata || {}; const imgs = mdImages(w.markdown); const og = m.ogImage || m['og:image']; if (og && !imgs.includes(og)) imgs.unshift(og); sources.push({ url: w.url, source: pressName(w.url), title: w.title || m.title || '', text: String(w.markdown || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').slice(0, 2600), images: imgs.slice(0, 6) }); }); } catch (e) {} }));
  return sources;
}
function validCard(c) { const bad = /placeholder|lorem|tbd|n\/a/i; return c && c.title && c.line && !bad.test(c.title + ' ' + (c.what || c.look || '') + ' ' + c.line + ' ' + (c.kind || '')); }
async function loadWeekEditorial(order, grid) {
  const note = $('#inspo-note');
  if (!mcpNs || !sampleFn) { note.textContent = 'the press feed needs the claude app; showing the playbook looks.'; return loadInspoImages(order, grid); }
  const key = weekKey() + '-press2'; let cards = null;
  try { if (dbNs) { const d = await dbNs.doc('inspo/' + key).get(); if (d.exists) cards = d.data().cards; } } catch (e) {}
  if (!cards) {
    note.textContent = 'reading this week\'s fashion press…';
    const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const qs = [`fashion trends fashion week report ${month}`, `street style trends what everyone is wearing ${month}`, `how to wear the trends now party dressing ${month}`];
    const sources = await fetchPress(qs, PRESS);
    if (!sources.length) { note.textContent = 'the press search came back empty; showing the playbook looks.'; return loadInspoImages(order, grid); }
    note.textContent = 'the brain is reading ' + sources.length + ' articles…';
    try {
      const r = await sampleFn.json(`You are the trend editor for a personal styling house. Today is ${new Date().toDateString()}. Below are this week's articles from the fashion press, each with its images. Write 8 cards a phone stylist can use to offer an idea or open a conversation. Each card is ONE wearable look or trend named in the articles (a real one, from the text, never invented), with the exact source. If two or more sources name the same trend, set trending true. Pick the image from that same source's image list that best shows the look (copy the url exactly); if none fits, use the first. Reply with ONLY JSON, no fences, under 3200 characters: {"cards":[{"title": short lowercase name of the look, "look": one sentence, the formula, what goes with what, "why": one sentence why now, in the source's spirit, "line": one lowercase sentence the stylist can say on a call, "source": the publication name, "url": the article url, "image": an image url from that source, "trending": boolean, "pal": one of warm, cool, jewel, soft, earth, bright, black, denim}]}. No dashes in the text, no emoji, never a person's name.\n\n${sources.map((s, i) => `SOURCE ${i + 1} (${s.source}) ${s.title}\nurl: ${s.url}\nimages: ${s.images.join(' | ')}\ntext: ${s.text}`).join('\n\n')}`.slice(0, 60000), { modelTier: 'default' });
      cards = Array.isArray(r.cards) ? r.cards.filter(validCard).slice(0, 8) : null;
    } catch (e) { note.textContent = 'the brain could not read the press: ' + (e.message || e.code || '') + '. showing the playbook looks.'; return loadInspoImages(order, grid); }
    if (!cards || !cards.length) { note.textContent = 'no cards came back; showing the playbook looks.'; return loadInspoImages(order, grid); }
    try { if (dbNs) await dbNs.doc('inspo/' + key).set({ cards, at: new Date().toISOString(), sources: sources.map(s => s.url) }); } catch (e) {}
  }
  grid.innerHTML = cards.map((c, i) => `<div class="insp" data-p="${i}"><div class="pics one"><div class="ph">pulling…</div></div><span class="eyebrow">${c.trending ? 'trending · ' : ''}${c.source || 'the press'}${c.pal ? ' · ' + c.pal : ''}</span><b>${c.title || ''}</b><p>${c.look || ''}</p><p class="small"><i>why now:</i> ${c.why || ''}</p><p class="small"><i>say:</i> ${c.line || ''}</p><div class="chips"><button type="button" class="ib-board">on her board</button><button type="button" class="ib-ask">ask her</button>${c.url ? `<a href="${c.url}" target="_blank" rel="noopener" style="font-size:.78rem;align-self:center;color:#111">read it</a>` : ''}</div></div>`).join('');
  note.textContent = `${weekKey()}, from ${[...new Set(cards.map(c => c.source).filter(Boolean))].join(', ')}. trending means two or more of them named it.`;
  wireTipButtons(grid, cards, 'p');
  grid.querySelectorAll('.insp').forEach(card => {
    const c = cards[+card.dataset.p];
    card.querySelector('.ib-ask').onclick = () => { const line = `(the stylist wants to offer a look from this week's ${c.source || 'press'}: ${c.title}. ${c.look} ${c.line} ask her in one line whether that is her, as a this or that with pictures where it helps, and keep going from her answer.)`; if (turns.length) { show('s-call'); send(line); } else { $('#go-skip').click(); $('#msg').value = line; $('#call-err').textContent = 'say who it is for, then send. the idea is in the box.'; } };
    card.querySelector('.ib-board').onclick = () => { const imgs = [...card.querySelectorAll('.pics img')].map(i => i.src); if (!imgs.length) { note.textContent = 'the picture is still loading.'; return; } if (!LOOKS) { note.textContent = 'there is no board yet; build her looks first.'; return; } addPhotoTile(imgs[0], 0); show('s-looks'); };
  });
  let k = 0; const fill = async () => { while (k < cards.length) { const i = k++; const c = cards[i]; const card = grid.querySelector(`.insp[data-p="${i}"]`); if (!card) continue; let got = {}; try { got = await fetchImages([c.image].filter(Boolean)); } catch (e) {} const src = c.image && got[c.image]; card.querySelector('.pics').innerHTML = src ? `<img alt="" src="${src}">` : '<div class="ph">picture blocked</div>'; } };
  await Promise.all(Array.from({ length: 3 }, fill));
}

/* text her a trend tip: pick a woman from her files, the text is written from the card and copied; the touch goes on her file */
async function tipText(card) {
  let who = null;
  try { if (dbNs) { const snap = await dbNs.collection('clients').orderBy('updatedAt', 'desc').limit(30).get(); const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })); if (rows.length) { const pick = await askInline('who is it for? a number from her files, or a name', { placeholder: 'e.g. 2, or a first name', note: rows.map((r, i) => `${i + 1}) ${r.name || 'her'}${r.answers && r.answers.occasion ? ' · ' + r.answers.occasion : ''}`).join('<br>') }); if (pick === null) return; const n = parseInt(pick, 10); who = (n && rows[n - 1]) ? rows[n - 1] : { name: pick.trim() || 'her' }; } } } catch (e) {}
  if (!who) { const nm = await askInline('her first name', {}); if (nm === null) return; who = { name: nm.trim() || 'her' }; }
  const name = who.name && who.name !== 'her' ? who.name : '';
  const src = card.source ? ` in ${card.source}` : '';
  const what = card.look || card.what || '';
  const line = card.line || '';
  const msg = `hi${name ? ' ' + name : ''}, saw this${src} this week and thought of you: ${card.title}. ${what} ${line ? line.charAt(0).toUpperCase() + line.slice(1) : ''}${card.url ? '\n' + card.url : ''}\nwant me to pull it for you? free, same as always.`;
  const note = document.getElementById('social-note') || document.getElementById('inspo-note'); if (note) note.textContent = 'the text is written. copy it, paste it into her thread. it is on her file as a trend tip.';
  try { if (dbNs && who.id) { const touches = (who.touches || []).concat([{ type: 'trend tip', title: card.title, source: card.source || '', at: new Date().toISOString() }]); await dbNs.doc('clients/' + who.id).update({ touches, updatedAt: new Date().toISOString() }); } } catch (e) {}
  showText(`the text for ${who.name || 'her'}`, msg, 'edit it if you like, then copy.');
}
function wireTipButtons(grid, cards, key) {
  grid.querySelectorAll('.insp').forEach(card => { const c = cards[+card.dataset[key]]; if (!c) return; const chips = card.querySelector('.chips'); if (!chips || chips.querySelector('.ib-tip')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'ib-tip'; b.textContent = 'text her this'; b.onclick = () => tipText(c); chips.insertBefore(b, chips.querySelector('a')); });
}
