/* ---------- send to her: text, email, board image, her page, pdf ---------- */
let dlNs = null; claude.use('downloads').then(d => { dlNs = d; }).catch(() => {});
function sendPanel() {
  if (document.getElementById('sendpanel')) return;
  const p = document.createElement('section'); p.id = 'sendpanel'; p.className = 'look';
  p.innerHTML = `<p class="eyebrow">send it to her</p><h2>a link by text, the email as the copy she keeps</h2>
  <p class="lead">the text carries one picture of the board and the link. the board picture has no prices on it; it is her inspiration. prices live on her page and in the email.</p>
  <div class="chips" id="sendbtns">
    <button type="button" id="cp-text">copy the text</button>
    <button type="button" id="cp-email">copy the email</button>
    <button type="button" id="dl-board">save the board picture</button>
    <button type="button" id="dl-page">save her page</button>
    <button type="button" id="pr-pdf">print or save as pdf</button>
  </div>
  <p class="small" style="margin:10px 0 4px">bits and pieces:</p>
  <div class="chips" id="sendbits"><button type="button" id="dl-look1">save look 1 as a picture</button><button type="button" id="dl-board2">save the look 2 board</button><button type="button" id="dl-look2">save look 2 as a picture</button><button type="button" id="cp-text1">copy the text for look 1 only</button><button type="button" id="cp-text2">copy the text for look 2 only</button></div>
  <p class="small" id="send-note" style="min-height:1.2em"></p>
  <textarea id="send-preview" rows="8" style="margin-top:8px;font-size:.92rem" readonly></textarea>`;
  const cards = document.getElementById('lookcards'); cards.insertAdjacentElement('afterend', p);
  const note = m => { document.getElementById('send-note').textContent = m || ''; };
  const looks = (LOOKS.looks || []).map(l => ({ ...l, items: (l.items || []).map(normItem).filter(Boolean) }));
  const name = S.q.fname && S.q.fname !== 'her' ? S.q.fname : '';
  const occ = S.q.occasion || 'what is coming up';
  const money = it => it.price ? ' $' + it.price : '';
  const line = it => `${it.brand ? it.brand + ' ' : ''}${it.name}${money(it)}${it.url ? ' ' + it.url : ''}`;
  const fromPage = () => { const cards = [...document.querySelectorAll('#lookcards .look')].slice(0, looks.length); return looks.map((l, i) => { const c = cards[i]; return { ...l, title: (c && c.querySelector('h2') && c.querySelector('h2').textContent.trim()) || l.title, why: (c && c.querySelector('.lead') && c.querySelector('.lead').textContent.trim()) || l.why }; }); };
  const textMsg = () => { const lk = fromPage(); return `hi${name ? ' ' + name : ''}, ${lk[0] ? lk[0].title.toLowerCase() : 'your looks'} is ${occ}. two looks, one held.\n\n` + lk.map((l, i) => `look ${i + 1}, ${l.title.toLowerCase()}:\n` + l.items.map(it => '· ' + line(it)).join('\n') + (l.why ? `\n${l.why}` : '')).join('\n\n'); };
  const _unused = () => '' + `\n\nyour page: [link]\nreply with anything. a mirror photo before you walk out gets one fit note back the same day.`;
  const emailMsg = () => `subject: ${name ? name + ', ' : ''}your two looks${S.q.occasion ? ' for ' + S.q.occasion : ''}\n\n` + textMsg().replace('your page: [link]\n', 'your page: [link]\n\nhair, makeup, the shoe, the layer and the night before are on the page for each look.\n') + `\n\nfree, and it stays free. same stylist every time.`;
  document.getElementById('send-preview').value = textMsg();
  const copy = async (t, what) => { try { await navigator.clipboard.writeText(t); note(what + ' copied. paste it into her thread and drop the link in.'); } catch (e) { note('copy blocked here; select the text below and copy it.'); } document.getElementById('send-preview').value = t; };
  document.getElementById('cp-text').onclick = () => copy(textMsg(), 'the text');
  document.getElementById('cp-email').onclick = () => copy(emailMsg(), 'the email');
  const save = async (filename, data, label) => { if (!dlNs) { note('saving is not available in this view; open the page in the claude app.'); return; } try { await dlNs.save({ filename, data }); note(label + ' saved.'); } catch (e) { note(e && e.code === 'not_granted' ? 'you declined the save.' : 'could not save: ' + (e && e.message || e)); } };
  document.getElementById('dl-board').onclick = async () => {
    note('drawing the board…');
    try {
      if (!window.html2canvas) { await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
      document.querySelectorAll('#board .tile.sel').forEach(x => x.classList.remove('sel'));
      const c = await window.html2canvas(document.getElementById('board'), { backgroundColor: S.paper || '#faf9f6', scale: 2, useCORS: false, ignoreElements: el => el.id === 'boardtools' || (el.classList && el.classList.contains('hd')) });
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      await save((name || 'her') + '-board.png', blob, 'the board picture');
    } catch (e) { note('could not draw the board: ' + (e && e.message || e)); }
  };
  const snap = async (el, filename, label) => { if (!el) { note('there is no ' + label + ' yet.'); return; } note('drawing ' + label + '…'); try { if (!window.html2canvas) { await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); } document.querySelectorAll('.board .tile.sel').forEach(x => x.classList.remove('sel')); const c = await window.html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: false, ignoreElements: x => x.id === 'boardtools' || (x.classList && (x.classList.contains('hd') || x.classList.contains('fix'))) }); const blob = await new Promise(r => c.toBlob(r, 'image/png')); await save(filename, blob, label); } catch (e) { note('could not draw ' + label + ': ' + (e && e.message || e)); } };
  const lookText = i => { const lk = fromPage(); const l = lk[i]; if (!l) return ''; return `hi${name ? ' ' + name : ''}, ${l.title.toLowerCase()} for ${occ}:\n` + l.items.map(it => '· ' + line(it)).join('\n') + (l.why ? `\n${l.why}` : '') + `\n\nreply with anything.`; };
  document.getElementById('dl-look1').onclick = () => snap(document.querySelector('#s-looks .lookgrid'), (name || 'her') + '-look-1.png', 'look 1');
  document.getElementById('dl-board2').onclick = () => snap(document.getElementById('board-2'), (name || 'her') + '-board-2.png', 'the look 2 board');
  document.getElementById('dl-look2').onclick = () => snap(document.querySelector('#lookcards .look .lookgrid'), (name || 'her') + '-look-2.png', 'look 2');
  document.getElementById('cp-text1').onclick = () => copy(lookText(0), 'the text for look 1');
  document.getElementById('cp-text2').onclick = () => copy(lookText(1), 'the text for look 2');
  document.getElementById('dl-page').onclick = async () => {
    const head = document.head.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '');
    const body = `<div class="wrap"><header class="mast"><div class="wordmark">in the b<b>.</b>ag</div><span class="eyebrow">your looks</span></header>` + document.getElementById('s-looks').innerHTML.replace(/<section id="sendpanel"[\s\S]*?<\/section>/, '').replace(/<div class="nav">[\s\S]*?<\/div>\s*<p class="small"/, '<p class="small"') + `</div>`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name ? name + "'s" : 'your'} looks · in the bag</title>${head}<style>body{padding-inline:clamp(18px,4.5vw,48px)} .nav,#sendpanel{display:none}</style></head><body>${body}</body></html>`;
    await save((name || 'her') + '-looks.html', new Blob([html], { type: 'text/html' }), 'her page');
    note('her page saved. host it at intheb.ag/looks/<her name> and put that link in the text.');
  };
  document.getElementById('pr-pdf').onclick = () => { const st = document.createElement('style'); st.textContent = '@media print{.nav,#sendpanel,.compose,.chips{display:none!important} body{padding:0} .board{break-inside:avoid} .look{break-inside:avoid}}'; document.head.appendChild(st); try { window.print(); note('use "save as pdf" in the print dialog.'); } catch (e) { note('printing is blocked in this view; open the page in a browser tab.'); } };
}
