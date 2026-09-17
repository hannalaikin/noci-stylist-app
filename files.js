/* ---------- her file: persistent client memory, corrections, follow-up, second calls ---------- */
let dbNs = null; claude.use('db').then(d => { dbNs = d; const b = document.getElementById('go-files'); if (b) b.hidden = !d; }).catch(() => {});
function slug(s) { return String(s || 'her').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'her'; }
function fileNote(m) { const el = document.getElementById('file-note'); if (el) el.textContent = m || ''; }
function clientBody() {
  const q = S.q || {};
  return { name: q.fname || 'her', quiz: q.quiz || 'none', answers: { occasion: q.occasion || '', when: q.when || '', palette: q.palette || '', pal4: q.pal4 || '', silhouette: q.silhouette || '', feel: q.feel || '', hero: q.hero || '', move: q.move || '', budget: q.budget || '', help: q.help || [], piece: q.piece || '', words: q.words || '', spend: q.spend || '', wish: q.wish || '', style: q.style || '', prints: q.prints || '', helpareas: q.helpareas || [], missing: q.missing || '', shape: q.shape || '', fear: q.fear || '', look: q.look || '', feelkey: q.feelkey || '', matters: q.matters || '' }, narrow: { likes: S.likes || [], neck: S.neck || [], len: S.len || '', shoe: S.shoe || '' }, profile: S.name || '', read: S.read || '', rules: (S.rules || []).map(r => r[0]), updatedAt: new Date().toISOString() };
}
async function saveClient(extra) {
  if (!dbNs) return;
  try {
    if (!S.clientId) {
      let existing = null;
      try { if (false) { /* same names now group into one profile on their own; no question needed */ const snap = await dbNs.collection('clients').orderBy('updatedAt', 'desc').limit(60).get(); const same = snap.docs.filter(d => String((d.data() || {}).name || '').toLowerCase() === String(S.q.fname).toLowerCase()); if (same.length) { S.askedSame = true; const ans = await askInline(`${S.q.fname} already has a file (${same.map(d => (d.data().answers || {}).occasion || 'no occasion').join(', ')}). add this to her file, or start a new one?`, { placeholder: 'same or new', value: 'same' }); if (ans && /same|yes|add/i.test(ans)) existing = same[0]; } } } catch (e) {}
      if (existing) { const d = existing.data(); S.clientId = existing.id; S.clientCreated = d.createdAt; S.calls = (d.calls || 1) + 1; S.priorHistory = (d.history || []).concat(d.delivered ? [d.delivered] : []); }
      else { S.clientId = slug(S.q.fname) + '-' + Date.now().toString(36); S.clientCreated = new Date().toISOString(); }
    }
    const body = Object.assign(clientBody(), { profileKey: nameKey(S.q.fname), phone: S.q.phone || '', createdAt: S.clientCreated, corrections: S.corrections || [], followup: S.followup || null, calls: S.calls || 1 }, S.priorHistory ? { history: S.priorHistory } : {}, extra || {});
    await dbNs.doc('clients/' + S.clientId).set(body);
    fileNote('saved to her file.');
  } catch (e) { fileNote('could not save her file: ' + (e && e.message || e)); }
}
function looksForFile() {
  if (!LOOKS) return null;
  const strip = l => ({ title: l.title, why: l.why, hair: l.hair, makeup: l.makeup, shoe_note: l.shoe_note, layer: l.layer, night_before: l.night_before, items: (l.items || []).map(x => typeof x === 'string' ? { id: x } : { name: x.name, brand: x.brand, retailer: x.retailer, url: x.url, price: x.price, color: x.color, image: x.image || '' }) });
  return { looks: (LOOKS.looks || []).map(strip), held: LOOKS.held ? strip(LOOKS.held) : null, deliveredAt: new Date().toISOString() };
}
function transcriptForFile() { return turns.filter(t => !/^\(/.test(t.content)).map(t => (t.role === 'user' ? 'she: ' : 'stylist: ') + (t.role === 'assistant' ? (safeJSON(t.content, {}).say || '') : t.content)).join('\n').slice(0, 6000); }
function memoryFrom(doc) {
  const d = doc || {}; const a = d.answers || {}; const parts = [];
  parts.push(`name ${d.name}. profile ${d.profile || 'not read'}. read: ${d.read || ''}`);
  parts.push(`answers: occasion ${a.occasion || '?'}, when ${a.when || '?'}, palette ${a.palette || '?'}, silhouette ${a.silhouette || '?'}, feel ${a.feel || '?'}, hero ${a.hero || '?'}, move ${a.move || '?'}, budget ${a.budget || '?'}, help ${(a.help || []).join('; ') || '?'}, piece ${a.piece || 'none'}, shape ${a.shape || '?'}, her words: ${a.words || 'none'}`);
  if (d.narrow) parts.push(`she tapped as her: ${(d.narrow.likes || []).join(', ') || 'none'}; necklines ${(d.narrow.neck || []).join(' and ') || '?'}; length ${d.narrow.len || '?'}; feet ${d.narrow.shoe || '?'}`);
  if (d.delivered && d.delivered.looks) parts.push('looks sent last time: ' + d.delivered.looks.map(l => `${l.title}: ` + (l.items || []).map(i => i.name || i.id).join(', ')).join(' | '));
  if (d.corrections && d.corrections.length) parts.push('stylist corrections last time (learn from these): ' + d.corrections.map(c => `${c.type} ${c.before || ''}${c.after ? ' -> ' + c.after : ''}${c.reason ? ' because ' + c.reason : ''}`).join('; '));
  if (d.followup) parts.push(`what she wore: ${d.followup.worn || '?'}; skipped: ${d.followup.skipped || '?'}; why: ${d.followup.why || '?'}`);
  return parts.join('\n');
}
/* corrections on the look cards */
function wireCorrections() {
  document.querySelectorAll('#lookcards .piece, #pcards-1 .piece').forEach((el, idx) => {
    if (el.querySelector('.fix')) return;
    const bar = document.createElement('div'); bar.className = 'fix';
    bar.innerHTML = '<button type="button" class="swap" style="font-size:.8rem;padding:4px 10px;border-radius:999px;border:1px solid var(--hairline);background:var(--cream)">swap with a link</button><button type="button" class="drop" style="font-size:.8rem;padding:4px 10px;border-radius:999px;border:1px solid var(--hairline);background:var(--cream)">drop</button>';
    el.appendChild(bar);
    const nameEl = el.querySelector('.n'); const before = nameEl ? nameEl.textContent : '';
    bar.querySelector('.drop').onclick = async () => { const reason = (await askInline('why drop it? one line, it trains the brain', { placeholder: 'too young, wrong colour, she has one…' })) || ''; el.style.opacity = '.35'; bar.remove(); S.corrections = S.corrections || []; S.corrections.push({ type: 'drop', before, reason, at: new Date().toISOString() }); await saveClient({ corrections: S.corrections }); };
    bar.querySelector('.swap').onclick = async () => {
      const url = await askInline('paste the product link to swap in', { placeholder: 'https://…' }); if (!url) return; const reason = (await askInline('why? one line, it trains the brain', { placeholder: 'better neckline, in her size…' })) || '';
      fileNote('reading the page…');
      let info = null; try { info = await LIVE_TOOLS.find(t => t.name === 'read_page').execute({ url }); } catch (e) { fileNote('could not read that page'); return; }
      if (!info || !info.name) { fileNote('no product found on that page'); return; }
      const it = normItem({ name: info.name, brand: info.brand, retailer: '', url: info.url || url, price: info.price, image: info.image, color: info.color });
      const got = await fetchImages([it.image]); it.img = got[it.image] || null;
      el.innerHTML = `${it.img ? `<img alt="" src="${it.img}">` : '<div class="ph"></div>'}<div class="n">${it.brand || it.retailer || ''}</div><div class="nm small" style="margin:0">${it.name}</div><div class="p">${it.price ? '$' + it.price : ''}</div><p class="w">swapped by the stylist</p><a href="${it.url}" target="_blank" rel="noopener">shop at ${it.retailer || 'the store'}</a>`;
      S.corrections = S.corrections || []; S.corrections.push({ type: 'swap', before, after: `${it.brand || ''} ${it.name} ${it.url}`.trim(), reason, at: new Date().toISOString() });
      fileNote('swapped.'); await saveClient({ corrections: S.corrections });
    };
  });
}
/* follow-up form + file panel on the looks screen */
function filePanel() {
  if (document.getElementById('filepanel')) return;
  const p = document.createElement('section'); p.id = 'filepanel'; p.className = 'look';
  p.innerHTML = `<p class="eyebrow">her file</p><h2>what she wore, 48 hours after</h2><p class="lead">one line each. it goes on her file and the brain reads it next time.</p>
  <div style="display:grid;gap:8px"><input type="text" id="fu-worn" placeholder="what she wore"><input type="text" id="fu-skipped" placeholder="what she skipped"><input type="text" id="fu-why" placeholder="why, in her words"></div>
  <div class="chips" style="margin-top:10px"><button type="button" id="fu-save">save to her file</button><button type="button" id="fu-open">open her files</button></div><p class="small" id="file-note" style="min-height:1.2em"></p>`;
  const anchor = document.getElementById('sendpanel') || document.getElementById('lookcards'); anchor.insertAdjacentElement('afterend', p);
  document.getElementById('fu-save').onclick = async () => { S.followup = { worn: $('#fu-worn').value.trim(), skipped: $('#fu-skipped').value.trim(), why: $('#fu-why').value.trim(), at: new Date().toISOString() }; await saveClient({ followup: S.followup }); };
  document.getElementById('fu-open').onclick = () => openFiles();
}
/* the files screen */
let openFiles = async function () {
  styledGallery().catch(() => {});
  show('s-files'); const list = document.getElementById('files-list'); list.innerHTML = '<p class="small">loading…</p>';
  if (!dbNs) { list.innerHTML = '<p class="small">her files need the claude app to open.</p>'; return; }
  try {
    const snap = await dbNs.collection('clients').orderBy('updatedAt', 'desc').limit(50).get();
    if (snap.empty) { list.innerHTML = '<p class="small">no files yet. the first call writes the first one.</p>'; return; }
    list.innerHTML = snap.docs.map(d => { const x = d.data(); const a = x.answers || {}; return `<div class="piece" style="grid-template-columns:1fr auto"><div class="n">${x.name} · ${x.profile || 'no read'}</div><div class="p">${(x.updatedAt || '').slice(0, 10)}</div><p class="w" style="grid-column:1/3">${a.occasion || ''}${a.palette ? ' · ' + a.palette : ''}${x.delivered ? ' · looks sent' : ''}${x.followup ? ' · wore: ' + (x.followup.worn || '') : ''}${x.corrections && x.corrections.length ? ' · ' + x.corrections.length + ' corrections' : ''}</p><div style="grid-column:1/3" class="chips"><button type="button" data-id="${d.id}" class="call-again">call her again</button><button type="button" data-id="${d.id}" class="fu-edit">follow-up</button></div></div>`; }).join('');
    list.querySelectorAll('.call-again').forEach(b => b.onclick = e => { e.stopPropagation(); callAgain(b.dataset.id); });
    list.querySelectorAll('.fu-edit').forEach(b => b.onclick = e => { e.stopPropagation(); openFile(b.dataset.id); });
    list.querySelectorAll('.piece').forEach(row => { const bn = row.querySelector('.call-again'); if (bn) { row.style.cursor = 'pointer'; row.onclick = () => openFile(bn.dataset.id); } });
  } catch (e) { list.innerHTML = '<p class="small">could not load: ' + (e && e.message || e) + '</p>'; }
}
async function loadClient(id) { const snap = await dbNs.doc('clients/' + id).get(); return snap.exists ? snap.data() : null; }
async function callAgain(id) {
  const d = await loadClient(id); if (!d) return;
  S.skip = true; S.clientId = id; S.clientCreated = d.createdAt; S.calls = (d.calls || 1) + 1; S.corrections = []; S.followup = null;
  S.q = Object.assign({ fname: d.name, quiz: d.quiz, help: [], spend: '' }, d.answers || {}); S.likes = (d.narrow && d.narrow.likes) || []; S.neck = (d.narrow && d.narrow.neck) || []; S.len = (d.narrow && d.narrow.len) || ''; S.shoe = (d.narrow && d.narrow.shoe) || '';
  S.name = d.profile || 'not read yet'; S.read = d.read || ''; S.rules = []; S.memory = memoryFrom(d);
  turns = []; LOOKS = null; show('s-call'); $('#chat').innerHTML = ''; bubble('her', `${d.name}'s file is open: ${d.profile || 'no read'}${d.answers && d.answers.occasion ? ', last time ' + d.answers.occasion : ''}. type what she needs this time.`);
}
async function followUpFor(id) {
  const d = await loadClient(id); if (!d) return; const worn = await askInline('what she wore', { value: (d.followup && d.followup.worn) || '' }); if (worn === null) return; const skipped = (await askInline('what she skipped', { value: (d.followup && d.followup.skipped) || '' })) || ''; const why = (await askInline('why, in her words', { value: (d.followup && d.followup.why) || '' })) || '';
  try { await dbNs.doc('clients/' + id).update({ followup: { worn, skipped, why, at: new Date().toISOString() }, updatedAt: new Date().toISOString() }); openFile(id); } catch (e) { fileNote('could not save: ' + (e && e.message || e)); }
}
/* ---------- stylist feedback on the output: the grading loop ---------- */
const FB_TAGS = ['good, send it', 'board makes no sense', 'picture missing', 'price missing', 'wrong piece for her', 'story is off', 'look two moved too much', 'asked the wrong question', 'too old', 'too young', 'ignored what she tapped'];
function feedbackPanel() {
  if (document.getElementById('fbpanel')) return;
  const p = document.createElement('section'); p.id = 'fbpanel'; p.className = 'look';
  p.innerHTML = `<p class="eyebrow">stylist feedback</p><h2>did this work? say why, the brain reads it next time</h2>
  <div class="chips" id="fb-tags">${FB_TAGS.map(t => `<button type="button" data-v="${t}">${t}</button>`).join('')}</div>
  <textarea id="fb-text" rows="3" placeholder="what was wrong or right, in your words: the one shoulder was right, the story should be ten percent softer, the mood board had pants"></textarea>
  <div class="chips" style="margin-top:8px"><button type="button" id="fb-save">save feedback</button></div><p class="small" id="fb-note" style="min-height:1.2em"></p>`;
  const anchor = document.getElementById('filepanel') || document.getElementById('sendpanel') || document.getElementById('lookcards'); anchor.insertAdjacentElement('afterend', p);
  const chosen = new Set();
  p.querySelectorAll('#fb-tags button').forEach(b => b.onclick = () => { b.classList.toggle('on'); b.style.background = b.classList.contains('on') ? 'var(--ink)' : ''; b.style.color = b.classList.contains('on') ? 'var(--paper)' : ''; if (b.classList.contains('on')) chosen.add(b.dataset.v); else chosen.delete(b.dataset.v); });
  document.getElementById('fb-save').onclick = async () => {
    const text = document.getElementById('fb-text').value.trim(); if (!chosen.size && !text) { document.getElementById('fb-note').textContent = 'tap a tag or write a line first'; return; }
    if (!dbNs) { document.getElementById('fb-note').textContent = 'feedback needs the claude app to save.'; return; }
    const looksSummary = LOOKS ? (LOOKS.looks || []).map(l => l.title + ': ' + (l.items || []).map(x => typeof x === 'string' ? x : (x.name || '')).join(', ')).join(' | ') : '';
    try { await dbNs.collection('feedback').add({ clientId: S.clientId || null, name: (S.q && S.q.fname) || 'her', tags: [...chosen], text, looks: looksSummary.slice(0, 600), occasion: (S.q && S.q.occasion) || '', palette: (S.q && S.q.palette) || '', at: new Date().toISOString() }); document.getElementById('fb-note').textContent = 'saved. the brain reads the last 40 notes at the start of every call.'; } catch (e) { document.getElementById('fb-note').textContent = 'could not save: ' + (e && e.message || e); }
  };
}
async function loadFeedbackMemory() {
  if (!dbNs) return '';
  try { const snap = await dbNs.collection('feedback').orderBy('at', 'desc').limit(40).get(); const lines = snap.docs.map(d => { const x = d.data(); return `${(x.tags || []).join(', ')}${x.text ? ': ' + x.text : ''}${x.occasion ? ' (' + x.occasion + ')' : ''}`; }).filter(Boolean); return lines.join('\n').slice(0, 3000); } catch (e) { return ''; }
}

/* what we've styled: every look that left the house, as a tile, like a stylist's portfolio */
async function styledGallery() {
  const host = document.getElementById('styled'); if (!host || !dbNs) return;
  host.innerHTML = '<p class="small">pulling what we have styled…</p>';
  let rows = []; try { const snap = await dbNs.collection('clients').orderBy('updatedAt', 'desc').limit(24).get(); rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.delivered && r.delivered.looks && r.delivered.looks.length); } catch (e) { host.innerHTML = ''; return; }
  if (!rows.length) { host.innerHTML = '<p class="small">nothing styled yet. the first looks you send will show here.</p>'; return; }
  host.innerHTML = '<p class="eyebrow">what we have styled</p><div class="styledgrid">' + rows.map(r => r.delivered.looks.slice(0, 2).map((l, li) => `<div class="stile" data-id="${r.id}" data-l="${li}"><div class="stitle">${l.title || ''}</div><div class="spics">${(l.items || []).filter(i => i.image).slice(0, 4).map(i => `<div class="sp" data-u="${i.image}"></div>`).join('')}</div><div class="smeta">${r.name || 'her'}${r.answers && r.answers.occasion ? ' · ' + r.answers.occasion : ''}</div></div>`).join('')).join('') + '</div>';
  host.querySelectorAll('.stile').forEach(t => t.onclick = () => openFile(t.dataset.id));
  const cells = [...host.querySelectorAll('.sp')]; let k = 0;
  const fill = async () => { while (k < cells.length) { const c = cells[k++]; try { const g = await fetchImages([c.dataset.u]); if (g[c.dataset.u]) c.innerHTML = `<img alt="" src="${g[c.dataset.u]}">`; } catch (e) {} } };
  await Promise.all(Array.from({ length: 4 }, fill));
}

/* her file page: everything we know and everything we sent, in one place */
let openFile = async function (id) {
  const d = await loadClient(id); if (!d) return;
  show('s-file'); S.openFileId = id;
  const a = d.answers || {};
  const looks = (d.delivered && d.delivered.looks) || [];
  const earlier = (d.history || []).flatMap(h => (h && h.looks) || []);
  const pc = it => `<div class="pcard" data-url="${it.url || ''}">${it.image ? `<div class="ph" data-u="${it.image}"></div>` : '<div class="ph"></div>'}<div class="n">${it.brand || it.retailer || ''}</div><div class="nm small" style="margin:0">${it.name || it.id || ''}</div><div class="p">${it.price ? '$' + it.price : ''}</div>${it.url ? `<a href="${it.url}" target="_blank" rel="noopener">shop at ${it.retailer || 'the store'}</a>` : ''}</div>`;
  $('#file-head').textContent = d.name || 'her';
  $('#file-sub').textContent = [a.occasion, a.when, a.palette, d.profile].filter(Boolean).join(' · ') + (d.updatedAt ? ' · ' + d.updatedAt.slice(0, 10) : '');
  const facts = [['age', a.age], ['size', a.size], ['shops', a.brands], ['silhouette', a.silhouette], ['hero', a.hero], ['budget', a.budget], ['shape', a.shape], ['in her words', a.words], ['read', d.read]].filter(x => x[1]);
  $('#file-body').innerHTML = `
    <div class="look"><p class="eyebrow">what we know</p><dl class="finish">${facts.map(x => `<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl></div>
    ${looks.map((l, i) => `<div class="look"><p class="eyebrow">look ${i + 1} · sent ${(d.delivered.deliveredAt || '').slice(0, 10)}</p><h2>${l.title || ''}</h2><p class="lead">${l.why || ''}</p><div class="pcards">${(l.items || []).map(pc).join('')}</div></div>`).join('')}
    ${earlier.length ? `<div class="look"><p class="eyebrow">earlier looks on her file</p><ul class="tips">${earlier.map(l => `<li>${l.title || ''}: ${(l.items || []).map(i => i.name || i.id).join(', ')}</li>`).join('')}</ul></div>` : ''}
    ${d.boards && d.boards.length ? `<div class="look"><p class="eyebrow">mood boards</p><ul class="tips">${d.boards.map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.title}</li>`).join('')}</ul></div>` : ''}
    ${d.corrections && d.corrections.length ? `<div class="look"><p class="eyebrow">what the stylist changed</p><ul class="tips">${d.corrections.map(c => `<li>${c.type} ${c.before || ''}${c.after ? ' → ' + c.after : ''}${c.reason ? ', because ' + c.reason : ''}</li>`).join('')}</ul></div>` : ''}
    ${d.followup ? `<div class="look"><p class="eyebrow">what she wore</p><dl class="finish"><dt>wore</dt><dd>${d.followup.worn || ''}</dd><dt>skipped</dt><dd>${d.followup.skipped || ''}</dd><dt>why</dt><dd>${d.followup.why || ''}</dd></dl></div>` : ''}
    ${d.touches && d.touches.length ? `<div class="look"><p class="eyebrow">trend tips we sent her</p><ul class="tips">${d.touches.map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.title}${x.source ? ' (' + x.source + ')' : ''}</li>`).join('')}</ul></div>` : ''}
    ${d.notes && d.notes.length ? `<div class="look"><p class="eyebrow">notes</p><ul class="tips">${d.notes.map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.text}</li>`).join('')}</ul></div>` : ''}`;
  const cells = [...$('#file-body').querySelectorAll('.ph[data-u]')]; let k = 0;
  const fill = async () => { while (k < cells.length) { const c = cells[k++]; try { const g = await fetchImages([c.dataset.u]); if (g[c.dataset.u]) c.outerHTML = `<img alt="" src="${g[c.dataset.u]}">`; } catch (e) {} } };
  fill(); fill(); fill();
  $('#file-call').onclick = () => callAgain(id);
  $('#file-fu').onclick = () => followUpFor(id);
  $('#file-note').onclick = async () => { const text = await askInline('a note for her file', { multiline: true }); if (!text) return; const notes = (d.notes || []).concat([{ text, at: new Date().toISOString() }]); try { await dbNs.doc('clients/' + id).update({ notes, updatedAt: new Date().toISOString() }); openFile(id); } catch (e) {} };
  $('#file-send').onclick = () => { if (!looks.length) { return; } const name = d.name && d.name !== 'her' ? d.name : ''; const txt = `hi${name ? ' ' + name : ''}, your looks again for ${a.occasion || 'what is coming up'}.\n\n` + looks.map((l, i) => `look ${i + 1}, ${(l.title || '').toLowerCase()}:\n` + (l.items || []).map(it => `· ${it.brand ? it.brand + ' ' : ''}${it.name || ''}${it.price ? ' $' + it.price : ''}${it.url ? ' ' + it.url : ''}`).join('\n')).join('\n\n') + '\n\nreply with anything.'; showText('the text, ready to paste', txt); };
  $('#file-back').onclick = () => openFiles();
}

/* ---------- profiles: one person, one profile. same names sit together; nothing is deleted ---------- */
function nameKey(n) { return String(n || 'her').trim().toLowerCase().replace(/\s+/g, ' '); }
async function allClients() { const snap = await dbNs.collection('clients').orderBy('updatedAt', 'desc').limit(200).get(); return snap.docs.map(d => ({ id: d.id, ...d.data() })); }
function groupProfiles(rows) { const g = {}; rows.forEach(r => { const k = r.profileKey || nameKey(r.name); (g[k] = g[k] || []).push(r); }); return Object.entries(g).map(([key, docs]) => ({ key, docs, name: docs[0].name || 'her', latest: docs[0] })); }
openFiles = async function () {
  styledGallery().catch(() => {});
  show('s-files'); const list = document.getElementById('files-list'); list.innerHTML = '<p class="small">loading…</p>';
  if (!dbNs) { list.innerHTML = '<p class="small">her files need the claude app to open.</p>'; return; }
  try {
    const rows = await allClients();
    const groups = groupProfiles(rows);
    const head = `<div class="chips" style="margin:0 0 12px"><button type="button" id="new-profile">new profile</button></div>`;
    if (!groups.length) { list.innerHTML = head + '<p class="small">no profiles yet. the first call writes the first one, or make one by hand.</p>'; }
    else list.innerHTML = head + groups.map(g => { const a = g.latest.answers || {}; const looksN = g.docs.reduce((s, d) => s + (((d.delivered && d.delivered.looks) || []).length) + ((d.history || []).reduce((x, h) => x + ((h && h.looks) || []).length, 0)), 0); return `<div class="prow" data-k="${encodeURIComponent(g.key)}"><div><b>${g.name}</b><span>${[a.age, a.size, g.latest.phone || a.phone].filter(Boolean).join(' · ')}</span></div><div class="pm">${g.docs.length} ${g.docs.length > 1 ? 'sessions' : 'session'} · ${looksN} looks · last ${(g.latest.updatedAt || '').slice(0, 10)}<br><span>${g.docs.map(d => (d.answers || {}).occasion).filter(Boolean).slice(0, 3).join(' · ')}</span></div></div>`; }).join('');
    list.querySelectorAll('.prow').forEach(r => r.onclick = () => openProfile(decodeURIComponent(r.dataset.k)));
    document.getElementById('new-profile').onclick = () => newProfile();
  } catch (e) { list.innerHTML = '<p class="small">could not load: ' + (e && e.message || e) + '</p>'; }
};
async function newProfile() {
  const name = await askInline('her first name', {}); if (!name) return;
  const rows = await allClients(); const same = rows.find(r => (r.profileKey || nameKey(r.name)) === nameKey(name));
  if (same) { openProfile(nameKey(name)); return; }
  const phone = (await askInline('her phone, the join key (optional)', {})) || '';
  const age = (await askInline('her age range', { placeholder: 'under 25, 25 to 34, 35 to 44, 45 plus' })) || '';
  const size = (await askInline('her size (optional)', {})) || '';
  const brands = (await askInline('stores she already shops (optional)', {})) || '';
  const id = slug(name) + '-' + Date.now().toString(36); const now = new Date().toISOString();
  try { await dbNs.doc('clients/' + id).set({ name: name.trim(), phone, profileKey: nameKey(name), answers: { age, size, brands }, createdAt: now, updatedAt: now, calls: 0, manual: true }); } catch (e) {}
  openProfile(nameKey(name));
}
openFile = async function (id) { const d = await loadClient(id); if (!d) return; openProfile(d.profileKey || nameKey(d.name)); };
async function openProfile(key) {
  const rows = (await allClients()).filter(r => (r.profileKey || nameKey(r.name)) === key);
  if (!rows.length) { openFiles(); return; }
  show('s-file'); const d = rows[0]; const id = d.id; S.openFileId = id;
  const merged = {}; rows.slice().reverse().forEach(r => Object.entries(r.answers || {}).forEach(([k, v]) => { if (v && (!Array.isArray(v) || v.length)) merged[k] = v; }));
  const sessions = rows.flatMap(r => [...(r.history || []).map(h => ({ at: (h && h.deliveredAt) || r.createdAt, looks: (h && h.looks) || [], occasion: (r.answers || {}).occasion })), ...(r.delivered ? [{ at: r.delivered.deliveredAt || r.updatedAt, looks: r.delivered.looks || [], occasion: (r.answers || {}).occasion }] : [])]).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const collect = k => rows.flatMap(r => r[k] || []);
  const pc = it => `<div class="pcard" data-url="${it.url || ''}">${it.image ? `<div class="ph" data-u="${it.image}"></div>` : '<div class="ph"></div>'}<div class="n">${it.brand || it.retailer || ''}</div><div class="nm small" style="margin:0">${it.name || it.id || ''}</div><div class="p">${it.price ? '$' + it.price : ''}</div>${it.url ? `<a href="${it.url}" target="_blank" rel="noopener">shop at ${it.retailer || 'the store'}</a>` : ''}</div>`;
  $('#file-head').textContent = d.name || 'her';
  $('#file-sub').textContent = `${rows.length} ${rows.length > 1 ? 'sessions together in one profile' : 'session'} · ${sessions.reduce((s, x) => s + x.looks.length, 0)} looks · last ${(d.updatedAt || '').slice(0, 10)}${d.phone ? ' · ' + d.phone : ''}`;
  const facts = [['age', merged.age], ['size', merged.size], ['shops', merged.brands], ['palette', merged.palette], ['silhouette', merged.silhouette], ['hero', merged.hero], ['budget', merged.budget], ['shape', merged.shape], ['in her words', merged.words], ['read', d.read]].filter(x => x[1]);
  const fus = rows.map(r => r.followup).filter(Boolean);
  $('#file-body').innerHTML = `
    <div class="look"><p class="eyebrow">what we know</p>${facts.length ? `<dl class="finish">${facts.map(x => `<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl>` : '<p class="small">nothing yet. call her, or add a note.</p>'}</div>
    ${sessions.map(sn => sn.looks.map((l, i) => `<div class="look"><p class="eyebrow">${(sn.at || '').slice(0, 10)} · ${sn.occasion || 'a look'} · look ${i + 1}</p><h2>${l.title || ''}</h2><p class="lead">${l.why || ''}</p><div class="pcards">${(l.items || []).map(pc).join('')}</div></div>`).join('')).join('')}
    ${collect('boards').length ? `<div class="look"><p class="eyebrow">mood boards</p><ul class="tips">${collect('boards').map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.title}</li>`).join('')}</ul></div>` : ''}
    ${collect('corrections').length ? `<div class="look"><p class="eyebrow">what the stylist changed</p><ul class="tips">${collect('corrections').map(c => `<li>${c.type} ${c.before || ''}${c.after ? ' → ' + c.after : ''}${c.reason ? ', because ' + c.reason : ''}</li>`).join('')}</ul></div>` : ''}
    ${fus.length ? `<div class="look"><p class="eyebrow">what she wore</p>${fus.map(f => `<dl class="finish"><dt>wore</dt><dd>${f.worn || ''}</dd><dt>skipped</dt><dd>${f.skipped || ''}</dd><dt>why</dt><dd>${f.why || ''}</dd></dl>`).join('')}</div>` : ''}
    ${collect('touches').length ? `<div class="look"><p class="eyebrow">trend tips we sent her</p><ul class="tips">${collect('touches').map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.title}${x.source ? ' (' + x.source + ')' : ''}</li>`).join('')}</ul></div>` : ''}
    ${collect('notes').length ? `<div class="look"><p class="eyebrow">notes</p><ul class="tips">${collect('notes').map(x => `<li>${(x.at || '').slice(0, 10)} · ${x.text}</li>`).join('')}</ul></div>` : ''}
    ${rows.length > 1 ? `<p class="small">this profile is ${rows.length} sessions under the same name, shown together. if one of them is a different ${d.name}, open it and rename her.</p><div class="chips" id="sess-list">${rows.map(r => `<button type="button" data-id="${r.id}">rename the ${(r.updatedAt || '').slice(0, 10)} session</button>`).join('')}</div>` : ''}`;
  const cells = [...$('#file-body').querySelectorAll('.ph[data-u]')]; let k = 0;
  const fill = async () => { while (k < cells.length) { const c = cells[k++]; try { const g = await fetchImages([c.dataset.u]); if (g[c.dataset.u]) c.outerHTML = `<img alt="" src="${g[c.dataset.u]}">`; } catch (e) {} } };
  fill(); fill(); fill();
  const sl = document.getElementById('sess-list'); if (sl) sl.querySelectorAll('button').forEach(bn => bn.onclick = async () => { const nn = await askInline('her name for this session, to move it to another profile', {}); if (!nn) return; try { await dbNs.doc('clients/' + bn.dataset.id).update({ name: nn.trim(), profileKey: nameKey(nn), updatedAt: new Date().toISOString() }); openProfile(key); } catch (e) {} });
  $('#file-call').onclick = () => callAgain(id);
  $('#file-fu').onclick = () => followUpFor(id);
  $('#file-note').onclick = async () => { const text = await askInline('a note for her profile', { multiline: true }); if (!text) return; const notes = (d.notes || []).concat([{ text, at: new Date().toISOString() }]); try { await dbNs.doc('clients/' + id).update({ notes, updatedAt: new Date().toISOString() }); openProfile(key); } catch (e) {} };
  $('#file-send').onclick = () => { const last = sessions[0]; if (!last || !last.looks.length) { return; } const name = d.name && d.name !== 'her' ? d.name : ''; const txt = `hi${name ? ' ' + name : ''}, your looks again for ${last.occasion || 'what is coming up'}.\n\n` + last.looks.map((l, i) => `look ${i + 1}, ${(l.title || '').toLowerCase()}:\n` + (l.items || []).map(it => `· ${it.brand ? it.brand + ' ' : ''}${it.name || ''}${it.price ? ' $' + it.price : ''}${it.url ? ' ' + it.url : ''}`).join('\n')).join('\n\n') + '\n\nreply with anything.'; showText('the text, ready to paste', txt); };
  $('#file-back').onclick = () => openFiles();
}
