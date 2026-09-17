/* ---------- live sourcing: the stylist brain can search stores, google, read a page, and the page fetches photos ---------- */
let mcpNs = null, apifyNames = null;
claude.use('mcp').then(m => { mcpNs = m; if (m) m.listTools('Apify').then(r => { const t = ((r.servers && r.servers[0] && r.servers[0].tools) || []).map(x => x.name); apifyNames = { rag: t.find(n => /rag-web-browser/.test(n)), ds: t.find(n => /get-dataset-items/.test(n)) }; }).catch(() => {}); }).catch(() => {});
function liveStatus(msg) { const el = document.getElementById('live-status'); if (el) el.textContent = msg || ''; const log = document.getElementById('rack-log'); if (log && msg && log.dataset.last !== msg) { log.dataset.last = msg; const li = document.createElement('div'); li.textContent = msg; log.appendChild(li); log.scrollTop = log.scrollHeight; } }
/* in page questions: the artifact frame blocks browser pop ups, so every question is asked here */
function askInline(label, opts) {
  opts = opts || {};
  return new Promise(res => {
    const old = document.getElementById('askbox'); if (old) old.remove();
    const box = document.createElement('div'); box.id = 'askbox';
    box.innerHTML = `<div class="askcard"><p class="asklabel">${label}</p>${opts.multiline ? `<textarea id="ask-in" rows="4">${opts.value || ''}</textarea>` : `<input type="text" id="ask-in" value="${(opts.value || '').replace(/"/g, '&quot;')}" placeholder="${(opts.placeholder || '').replace(/"/g, '&quot;')}">`}${opts.note ? `<p class="small">${opts.note}</p>` : ''}<div class="askbtns"><button type="button" id="ask-ok" class="cta">${opts.okText || 'ok'}</button><button type="button" id="ask-no" class="cta ghost">${opts.cancelText || 'cancel'}</button></div></div>`;
    document.body.appendChild(box);
    const inp = box.querySelector('#ask-in'); setTimeout(() => inp.focus(), 30);
    const done = v => { box.remove(); res(v); };
    box.querySelector('#ask-ok').onclick = () => done(inp.value);
    box.querySelector('#ask-no').onclick = () => done(null);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !opts.multiline) { e.preventDefault(); done(inp.value); } if (e.key === 'Escape') done(null); });
  });
}
function showText(label, text, note) {
  const old = document.getElementById('askbox'); if (old) old.remove();
  const box = document.createElement('div'); box.id = 'askbox';
  box.innerHTML = `<div class="askcard"><p class="asklabel">${label}</p><textarea id="ask-in" rows="7">${text}</textarea><p class="small" id="ask-note">${note || ''}</p><div class="askbtns"><button type="button" id="ask-copy" class="cta">copy it</button><button type="button" id="ask-no" class="cta ghost">close</button></div></div>`;
  document.body.appendChild(box);
  box.querySelector('#ask-copy').onclick = async () => { const ta = box.querySelector('#ask-in'); try { await navigator.clipboard.writeText(ta.value); box.querySelector('#ask-note').textContent = 'copied. paste it into her thread.'; } catch (e) { ta.select(); box.querySelector('#ask-note').textContent = 'select the text and copy it.'; } };
  box.querySelector('#ask-no').onclick = () => box.remove();
}
function rackWaiting() {
  show('s-rack'); const grid = $('#rackgrid');
  grid.innerHTML = '<div id="rack-log" class="small racklog"><div>finding her pieces…</div></div>';
  $('#rack-note').textContent = 'the brain is shopping for her. this takes a minute or two. the pieces land here.';
  document.getElementById('s-rack').classList.add('waiting');
}
function shq(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }
function withTimeout(p, ms, what) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error((what || 'call') + ' timed out')), ms))]); }
async function bash(cmd, ms) {
  if (!mcpNs) throw new Error('no connector');
  const r = await withTimeout(mcpNs.callTool('Composio', 'COMPOSIO_REMOTE_BASH_TOOL', { command: cmd }, { cache: false }), ms || 40000, 'sandbox');
  const p = r.payload; return (p && p.data && p.data.stdout) || (typeof p === 'string' ? p : '');
}
const STORE_TIERS = {
  young: ['us.princesspolly.com', 'meshki.us', 'whitefoxboutique.com', 'www.edikted.com', 'www.beginningboutique.com', 'www.dissh.com', 'withjean.com', 'www.becandbridge.com', 'www.ohpolly.com', 'www.frankiesbikinis.com', 'www.tonybianco.com', 'www.stevemadden.com'],
  mid: ['us.sirthelabel.com', 'www.posse.com', 'damsonmadder.com', 'kitristudio.com', 'www.faithfullthebrand.com', 'www.aya-muse.com', 'silklaundry.com', 'www.cultgaia.com', 'staud.clothing', 'www.hemantandnandita.com', 'us.missoma.com', 'www.alohas.io', 'www.byfar.com', 'www.gorjana.com', 'www.bychari.com', 'www.dissh.com'],
  classic: ['www.aninebing.com', 'www.everlane.com', 'shopdoen.com', 'www.christydawn.com', 'www.hillhousehome.com', 'staud.clothing', 'www.cultgaia.com', 'www.aloyoga.com', 'silklaundry.com', 'www.alohas.io', 'us.missoma.com', 'us.sirthelabel.com', 'www.faithfullthebrand.com']
};
function tierFor(age) { const a = String(age || '').toLowerCase(); if (/under|teen/.test(a)) return 'young'; const n = parseInt((a.match(/\d+/) || ['30'])[0], 10); if (n < 25) return 'young'; if (n >= 40 || /plus|over/.test(a)) return 'classic'; return 'mid'; }
function storesFor(age, tier) { const k = tier && STORE_TIERS[tier] ? tier : tierFor(age); const own = STORE_TIERS[k]; const rest = Object.keys(STORE_TIERS).filter(x => x !== k).flatMap(x => STORE_TIERS[x]); return [...new Set([...own, ...rest])].slice(0, 16); }
const STORES = storesFor('');
const PY_SEARCH = `python3 - <<'PY'
import os, json, urllib.request, urllib.parse, concurrent.futures, re
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36","Accept":"application/json"}
q=os.environ.get('Q',''); stores=json.loads(os.environ.get('STORES','[]')); out=[]
def hit(s):
    u=f"https://{s}/search/suggest.json?"+urllib.parse.urlencode({"q":q,"resources[type]":"product","resources[limit]":4,"resources[options][unavailable_products]":"hide"})
    try:
        j=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=12).read().decode('utf-8','ignore'))
        res=[]
        for p in j.get("resources",{}).get("results",{}).get("products",[])[:4]:
            img=p.get("image") or (p.get("featured_image") or {}).get("url") or ""
            res.append({"store":s.replace('www.','').replace('us.',''),"title":p.get("title"),"price":p.get("price"),"url":"https://"+s+(p.get("url") or "").split("?")[0],"image":img.split("?")[0]+"?width=700" if "cdn.shopify.com" in img else img,"available":p.get("available",True)})
        return res
    except Exception as e:
        return ('fail', s)
failed=[]
with concurrent.futures.ThreadPoolExecutor(14) as ex:
    for r in ex.map(hit, stores):
        if isinstance(r, tuple): failed.append(r[1])
        else: out.extend(r)
print(json.dumps({"items": out[:24], "failed": failed}))
PY`;
function parseSuggest(host, txt) {
  let j = null; try { j = JSON.parse(txt); } catch (e) { return []; }
  return (((j.resources || {}).results || {}).products || []).slice(0, 4).map(p => { const img = p.image || (p.featured_image || {}).url || ''; return { store: host.replace('www.', '').replace('us.', ''), title: p.title, price: p.price, url: 'https://' + host + String(p.url || '').split('?')[0], image: /cdn\.shopify\.com/.test(img) ? img.split('?')[0] + '?width=700' : img, available: p.available !== false, tags: (p.tags || []).filter(x => /occasion|hierarchy/i.test(x)).slice(0, 4) }; });
}
async function storeSearch(query, hosts) {
  hosts = (hosts || []).slice(0, 16); let items = [], failed = hosts;
  try { const r = safeJSON(await bash('Q=' + shq(String(query)) + ' STORES=' + shq(JSON.stringify(hosts)) + ' ' + PY_SEARCH), null); if (r && Array.isArray(r.items)) { items = r.items; failed = r.failed || []; } else if (Array.isArray(r)) { items = r; failed = []; } } catch (e) {}
  if (failed.length && mcpNs) {
    const todo = failed.slice(0, 8); let i = 0;
    const worker = async () => { while (i < todo.length) { const h = todo[i++]; try { const u = `https://${h}/search/suggest.json?q=${encodeURIComponent(String(query))}&resources[type]=product&resources[limit]=4&resources[options][unavailable_products]=hide`; const r = await mcpNs.callTool('Firecrawl', 'firecrawl_scrape', { url: u, formats: ['rawHtml'], maxAge: 3600000, onlyMainContent: false }, { cache: false }); const raw = (r.payload || {}).rawHtml || ''; items = items.concat(parseSuggest(h, raw)); } catch (e) {} } };
    await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker));
  }
  return items;
}
const PY_READ = `python3 - <<'PY'
import os, json, urllib.request, re, html
url=os.environ.get('U','')
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36","Accept":"text/html"}
try:
    t=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=25).read().decode('utf-8','ignore')
except Exception as e:
    print(json.dumps({"error":str(e)[:120],"url":url})); raise SystemExit
def meta(p):
    m=re.search(r'<meta[^>]+(?:property|name)="%s"[^>]+content="([^"]*)"'%p,t) or re.search(r'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="%s"'%p,t)
    return html.unescape(m.group(1)) if m else None
out={"url":url,"name":meta("og:title") or (re.search(r'<title>(.*?)</title>',t,re.S).group(1).strip() if re.search(r'<title>',t) else None),"image":meta("og:image"),"brand":None,"price":None,"sizes":None,"description":(meta("og:description") or "")[:200]}
for s in re.findall(r'<scr${''}ipt[^>]+application/ld\\+json[^>]*>(.*?)</scr${''}ipt>',t,re.S):
    try: j=json.loads(s)
    except Exception: continue
    for o in (j if isinstance(j,list) else [j]):
        if isinstance(o,dict) and o.get('@type') in ('Product','ProductGroup'):
            b=o.get('brand'); out['brand']=b.get('name') if isinstance(b,dict) else b
            of=o.get('offers') or {}; of=of[0] if isinstance(of,list) and of else of
            out['price']=out['price'] or of.get('price') or of.get('lowPrice'); out['name']=o.get('name') or out['name']
            im=o.get('image'); out['image']=out['image'] or (im if isinstance(im,str) else (im or [None])[0])
if not out['price']:
    m=re.findall(r'"price"\\s*:\\s*"?(\\d+(?:\\.\\d+)?)',t)
    if m:
        v=float(m[0]); out['price']=v/100 if v>1000 and '.' not in m[0] else v
sz=re.findall(r'"(?:option1|size|title)"\\s*:\\s*"((?:XXS|XS|S|M|L|XL|XXL|\\d{1,2}(?:\\.5)?|US \\d{1,2}))"',t)
if sz: out['sizes']=', '.join(dict.fromkeys(sz))[:80]
print(json.dumps(out))
PY`;
const PY_IMAGE = `python3 - <<'PY'
import os, json, urllib.request, urllib.parse, base64, io
u=os.environ.get('URL','')
host=urllib.parse.urlsplit(u).netloc
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36","Accept":"image/avif,image/webp,image/*,*/*;q=0.8","Referer":"https://"+host+"/"}
def get(x, hdr):
    return urllib.request.urlopen(urllib.request.Request(x,headers=hdr),timeout=15).read()
def shrink(b):
    from PIL import Image
    im=Image.open(io.BytesIO(b)).convert('RGB')
    for w,q in ((520,62),(460,55),(400,50),(340,45)):
        x=im.copy(); x.thumbnail((w,int(w*1.5))); bio=io.BytesIO(); x.save(bio,'JPEG',quality=q,optimize=True); out=bio.getvalue()
        if len(out)<=30000: return out
    return out
tries=[(u,UA),(u.split('?')[0],UA),("https://images.weserv.nl/?url="+urllib.parse.quote(u,safe='')+"&w=520&output=jpg&q=60",{"User-Agent":UA["User-Agent"]}),("https://wsrv.nl/?url="+urllib.parse.quote(u.split('?')[0],safe='')+"&w=520&output=jpg&q=60",{"User-Agent":UA["User-Agent"]})]
err=''
for x,h in tries:
    try:
        b=get(x,h)
        if len(b)<800: err='tiny'; continue
        b=shrink(b)
        print(json.dumps({"u":u,"d":"data:image/jpeg;base64,"+base64.b64encode(b).decode()})); raise SystemExit
    except SystemExit: raise
    except Exception as e: err=str(e)[:60]
print(json.dumps({"u":u,"e":err}))
PY`;
function safeJSON(s, fb) { try { return JSON.parse(s); } catch (e) { const i = s.indexOf('['), j = s.lastIndexOf(']'); const k = s.indexOf('{'), l = s.lastIndexOf('}'); try { if (i >= 0 && j > i) return JSON.parse(s.slice(i, j + 1)); if (k >= 0 && l > k) return JSON.parse(s.slice(k, l + 1)); } catch (e2) {} return fb; } }
const LIVE_TOOLS = [
  { name: 'search_stores', description: 'Search up to 16 fashion stores at once, picked by her age tier: young (princess polly, meshki, white fox, edikted, beginning boutique, dissh, with jean, bec and bridge, oh polly, frankies, tony bianco, steve madden), mid (sir, posse, damson madder, kitri, faithfull, aya muse, silk laundry, cult gaia, staud, hemant and nandita, missoma, alohas, by far, gorjana, by chari), classic (anine bing, everlane, doen, christy dawn, hill house, staud, cult gaia, alo, silk laundry). Pass tier to steer it or leave it and her age is used. Fast, about 8 seconds. Returns up to 24 in stock pieces with store, title, price, url and image. Run it several times with different words for the same piece; use plain product words (wine satin slip midi, gold hoop, black block heel sandal)', inputSchema: { type: 'object', properties: { query: { type: 'string' }, tier: { type: 'string', description: 'young, mid or classic; optional' } }, required: ['query'] },
    execute: async ({ query, tier }) => { liveStatus('looking in the stores for ' + query + '…'); const items = await storeSearch(String(query), storesFor(S.q && S.q.age, tier)); liveStatus(''); if (!items.length) throw new Error('nothing in the stores for that; try different words or search_web'); remember(items); return items.map(i => ({ store: i.store, title: i.title, price: i.price, url: i.url, image: i.image })); } },
  { name: 'search_web', description: 'Web search for a piece anywhere online, including Zara, Aritzia, Revolve, Reformation, Mango, Lulus and Nordstrom. Fast, about 5 seconds. Returns up to 6 pages with title, url and a description that often includes prices and product names. Use it when the stores did not have the piece or she named a brand. Follow with read_page on the one you want before recommending it.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    execute: async ({ query }) => {
      if (!mcpNs) throw new Error('web search is not connected here; use search_stores');
      liveStatus('searching the web for ' + query + '…');
      try {
        const r = await mcpNs.callTool('Firecrawl', 'firecrawl_search', { query: String(query), limit: 6 }, { cache: false });
        const p = r.payload || {}; const web = (p.data && p.data.web) || [];
        liveStatus('');
        if (web.length) return web.map(w => ({ title: w.title, url: w.url, description: String(w.description || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').slice(0, 220) }));
      } catch (e) { liveStatus(''); if (!apifyNames || !apifyNames.rag) throw new Error('web search failed: ' + (e.message || e.code || '')); }
      if (!apifyNames || !apifyNames.rag) throw new Error('nothing found on the web for that');
      liveStatus('googling ' + query + '…');
      const run = await mcpNs.callTool('Apify', apifyNames.rag, { query: String(query), maxResults: 3, outputFormats: ['markdown'], waitSecs: 45 }, { cache: false });
      const rp = run.payload || {}; const dsId = rp.storages && rp.storages.datasets && rp.storages.datasets.default && rp.storages.datasets.default.id; if (!dsId) throw new Error('search did not finish');
      const rows = await mcpNs.callTool('Apify', apifyNames.ds, { datasetId: dsId, fields: 'searchResult.title,metadata.url,searchResult.description,metadata.openGraph', limit: 3 }, { cache: false }); liveStatus('');
      return ((rows.payload && rows.payload.items) || []).map(r => { const og = (r['metadata.openGraph'] || []).find(o => o.property === 'og:image'); return { title: r['searchResult.title'], url: r['metadata.url'], description: (r['searchResult.description'] || '').slice(0, 160), image: og && og.content }; }); } },
  { name: 'read_page', description: 'Open one product page url and return its name, brand, price, currency, color, image, sizes in stock and a short description. Works on any retailer. Use it to confirm a piece from search_web before recommending it, or when she names a piece with a link.', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    execute: async ({ url }) => {
      liveStatus('opening the page…');
      try {
        const r = await mcpNs.callTool('Firecrawl', 'firecrawl_scrape', { url: String(url), formats: ['json'], onlyMainContent: true, jsonOptions: { prompt: 'Extract the product on this page.', schema: { type: 'object', properties: { name: { type: 'string' }, brand: { type: 'string' }, price: { type: 'number' }, currency: { type: 'string' }, color: { type: 'string' }, image: { type: 'string' }, sizes_in_stock: { type: 'string' }, description: { type: 'string' } } } } }, { cache: false });
        const p = r.payload || {}; const j = p.json || {}; const m = p.metadata || {};
        liveStatus('');
        if (j.name || m.ogTitle) return remember([{ url: String(url), name: j.name || m.ogTitle, brand: j.brand || m['twitter:data2'] || '', price: j.price, currency: j.currency || 'USD', color: j.color || '', image: j.image || m.ogImage || m['og:image'] || '', sizes: j.sizes_in_stock || '', description: (j.description || m.ogDescription || '').slice(0, 200) }])[0];
      } catch (e) { liveStatus(''); }
      liveStatus('opening the page the slow way…');
      const out = await bash('U=' + shq(String(url)) + ' ' + PY_READ); liveStatus(''); const got = safeJSON(out, { error: 'could not read', url }); if (got && got.name) remember([got]); return got; } }
];
window.IMGCACHE = window.IMGCACHE || {};
async function fetchImages(urls) {
  const all = [...new Set(urls.filter(u => u && /^https?:/.test(u)))];
  const out = {}; all.forEach(u => { if (IMGCACHE[u]) out[u] = IMGCACHE[u]; });
  const need = all.filter(u => !out[u]);
  if (!need.length || !mcpNs) return out;
  let i = 0, done = 0;
  liveStatus('pulling the photos… 0 of ' + need.length);
  const worker = async () => { while (i < need.length) { const u = need[i++]; try { const r = safeJSON(await bash('URL=' + shq(u) + ' ' + PY_IMAGE, 25000), {}); if (r && r.d && r.d.length < 60000) { out[u] = r.d; IMGCACHE[u] = r.d; } } catch (e) {} done++; liveStatus('pulling the photos… ' + done + ' of ' + need.length); } };
  await Promise.all(Array.from({ length: Math.min(6, need.length) }, worker));
  liveStatus('');
  return out;
}
function isBg(d, p) { const r = d[p], g = d[p + 1], b = d[p + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mn > 200 && (mx - mn) < 14; }
const BADIMG = /logo|placeholder|no-image|noimage|missing|default|swatch|size-?guide|sizechart|icon|badge/i;
function whiteness(uri) {
  return new Promise(res => { const img = new Image(); img.onload = () => { try { const c = document.createElement('canvas'); const w = c.width = 64, h = c.height = 64; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data; let n = 0, ok = 0; for (let i = 0; i < w; i++) for (const j of [0, 1, h - 2, h - 1]) { const p = (j * w + i) * 4; n++; if (isBg(d, p)) ok++; } for (let j = 0; j < h; j++) for (const i of [0, 1, w - 2, w - 1]) { const p = (j * w + i) * 4; n++; if (isBg(d, p)) ok++; } res(ok / n); } catch (e) { res(0); } }; img.onerror = () => res(0); img.src = uri; });
}
/* the clean product shot on white, from the store's product feed, for a wishi style collage */
async function ghostShot(it) {
  if (!it || !it.url || !mcpNs) return null;
  const k = String(it.url).split('?')[0]; SEEN[k] = SEEN[k] || {};
  if (SEEN[k].flat) return SEEN[k].flat;
  let cands = [];
  if (/\/products\//.test(k)) {
    try { const r = await mcpNs.callTool('Firecrawl', 'firecrawl_scrape', { url: k + '.js', formats: ['rawHtml'], maxAge: 86400000, onlyMainContent: false }, { cache: false }); const j = JSON.parse((r.payload || {}).rawHtml || '{}'); const imgs = (j.images || []).map(u => (u.startsWith('//') ? 'https:' + u : u)); const png = imgs.filter(u => /\.png(\?|$)/i.test(u)); const rest = imgs.filter(u => !/\.png(\?|$)/i.test(u)); cands = [...png.slice(0, 2), ...rest.slice(-2), ...rest.slice(0, 1)].filter((u, i, a) => a.indexOf(u) === i && !BADIMG.test(u)).slice(0, 4).map(u => u.split('?')[0] + '?width=700'); if (j.variants && j.variants.length) SEEN[k].sizes = j.variants.filter(v => v.available).map(v => v.title).join(', ').slice(0, 60); } catch (e) {}
  }
  if (!cands.length && it.image && !BADIMG.test(it.image)) cands = [it.image];
  const got = await fetchImages(cands); let best = null, bestScore = -1;
  for (const u of cands) { if (!got[u]) continue; const sc = await whiteness(got[u]); if (sc > bestScore) { bestScore = sc; best = got[u]; } }
  if (best && bestScore >= 0.6) { SEEN[k].flat = best; return best; }
  return null;
}
function cutoutFromDataUri(uri, tol) {
  return new Promise(res => { const img = new Image(); img.onload = () => { try { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height); const w = c.width, h = c.height, px = d.data; const bg = [px[0], px[1], px[2]]; const near = i => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < tol; const seen = new Uint8Array(w * h); const st = [0, w - 1, (h - 1) * w, w * h - 1, (w >> 1), (h - 1) * w + (w >> 1), (h >> 1) * w, (h >> 1) * w + w - 1]; while (st.length) { const p = st.pop(); if (seen[p]) continue; if (!near(p * 4)) continue; seen[p] = 1; px[p * 4 + 3] = 0; const X = p % w, Y = (p / w) | 0; if (X > 0) st.push(p - 1); if (X < w - 1) st.push(p + 1); if (Y > 0) st.push(p - w); if (Y < h - 1) st.push(p + w); } x.putImageData(d, 0, 0); res(c.toDataURL('image/png')); } catch (e) { res(uri); } }; img.onerror = () => res(uri); img.src = uri; });
}
/* the call, with live tools */
async function ask() {
  if (!sampleFn) { $('#call-err').textContent = "the brain can't pick up in this preview. open the page in the claude app."; return; }
  const th = bubble('her think', 'thinking…'); chips([]); $('#call-err').textContent = '';
  if (!document.getElementById('live-status')) { const s = document.createElement('p'); s.id = 'live-status'; s.className = 'small'; s.style.minHeight = '1.2em'; document.getElementById('compose').insertAdjacentElement('beforebegin', s); }
  ctl = new AbortController();
  if (S.feedbackMemory === undefined && typeof loadFeedbackMemory === 'function') { try { S.feedbackMemory = await loadFeedbackMemory(); } catch (e) { S.feedbackMemory = ''; } }
  try {
    const r = await sampleFn.json([{ role: 'user', content: rulesTurn() }, ...turns], { signal: ctl.signal, modelTier: 'default', tools: mcpNs ? LIVE_TOOLS : undefined });
    th.remove(); liveStatus(''); window.__jsonRetry = false; document.querySelectorAll('.b.think').forEach(x => x.remove());
    handleReply(r);
  } catch (e) {
    th.remove(); liveStatus('');
    if (e.code === 'invalid_json') {
      const r2 = salvageJSON(e.text || '');
      if (r2) { window.__jsonRetry = false; document.querySelectorAll('.b.think').forEach(x => x.remove()); handleReply(r2); return; }
      if (!window.__jsonRetry) { window.__jsonRetry = true; window.LAST_BAD = e.text || ''; bubble('her think', 'debug: reply was ' + (e.text ? e.text.length : 0) + ' chars, code ' + e.code + ', ' + (e.message || '') + ' :: ' + String(e.text || '').slice(0, 160).replace(/\s+/g, ' ') + ' … ' + String(e.text || '').slice(-120).replace(/\s+/g, ' ')); turns.push({ role: 'user', content: '(that reply was not valid JSON or was cut off. reply again with ONLY the JSON object, no code fences, no prose, no line breaks inside strings, and keep the whole thing under 3500 characters: the rack at most 8 pieces with only name, brand, url, price, image; or when delivering looks, "why" one sentence, finish fields under 12 words, at most 4 items per look, alts at most 2, image and url copied exactly from the tool results.)' }); bubble('her think', 'one sec, tightening that up…'); return ask(); }
    }
    const copy = { not_granted: "the brain needs your ok to use claude for this call. reload and allow it.", rate_limited: "give it a second and try again.", invalid_json: "it stumbled twice. type \"send the rack as json\" or \"send the looks as json\" and it will try once more." + (e.text ? ' (reply was ' + e.text.length + ' characters)' : ''), refused: "it can't answer that one. try another way.", tools_unavailable: "live sourcing isn't available in this view; the brain will use the built-in pieces.", cancelled: "" }[e.code] || ("the line dropped: " + (e.message || '') + ". say that again?");
    $('#call-err').textContent = copy;
  }
}
function salvageJSON(text) {
  if (!text) return null;
  const CTRL = new RegExp('[\u0000-\u001f]+', 'g');
  let s = String(text).replace(/```(?:json)?/g, '').trim();
  const i = s.indexOf('{'), j = s.lastIndexOf('}'); if (i < 0) return null;
  s = s.slice(i, j > i ? j + 1 : undefined);
  const tries = [s, s.replace(CTRL, ' '), s.replace(/,\s*([}\]])/g, '$1').replace(CTRL, ' ')];
  for (const c of tries) { try { const o = JSON.parse(c); if (o && typeof o === 'object' && (o.say || o.looks || o.rack)) return o; } catch (e) {} }
  let c = s.replace(CTRL, ' '); let inStr = false, depth = [];
  for (let k = 0; k < c.length; k++) { const ch = c[k]; if (ch === '"' && c[k - 1] !== '\\') inStr = !inStr; if (inStr) continue; if (ch === '{' || ch === '[') depth.push(ch); if (ch === '}' || ch === ']') depth.pop(); }
  if (inStr) c += '"';
  c = c.replace(/,\s*$/, '') + depth.reverse().map(d => d === '{' ? '}' : ']').join('');
  try { const o = JSON.parse(c.replace(/,\s*([}\]])/g, '$1')); if (o && typeof o === 'object' && (o.say || o.looks || o.rack)) { o._salvaged = true; return o; } } catch (e) {}
  return null;
}
function handleReply(r) {
  const say = String(r.say || '').trim(); if (say) bubble('her', say);
  turns.push({ role: 'assistant', content: JSON.stringify(r) });
  window.LAST_REPLY = r;
  if (S.skip) { if (r.palette && PALDOTS[r.palette]) { S.q.palette = r.palette; S.q.pal4 = (typeof PAL_FAMILY !== 'undefined' && PAL_FAMILY[r.palette]) || r.palette; } if (r.occasion && !S.q.occasion) S.q.occasion = String(r.occasion); }
  let hasLooks = Array.isArray(r.looks) && r.looks.length && r.looks.some(l => l && Array.isArray(l.items) && l.items.length);
  const stub = hasLooks && r.looks.some(l => !l || !Array.isArray(l.items) || l.items.length < 2 || /placeholder|lorem|tbd/i.test((l.why || '') + ' ' + (l.title || '')));
  if (stub && !window.__stubRetry) { window.__stubRetry = true; hasLooks = false; const all = S.rackItems || []; turns.push({ role: 'user', content: `(that came back with a placeholder or an empty look. build both looks and the held look properly from the rack: ${all.map((x, n) => `${n + 1}) ${x.slot || ''} ${x.it.brand || ''} ${x.it.name} $${x.it.price || ''} ${x.it.url || ''}`.trim()).join('; ')}. every item a full live object copied from these, 3 to 5 items per look, a real why, hair, makeup, shoe, layer, night before. reply with ONLY the looks JSON.)` }); bubble('her think', 'one sec, filling that in properly…'); ask(); return; }
  const hasRack = !hasLooks && Array.isArray(r.rack) && r.rack.length >= 3;
  if (hasRack) { S.rack = r.rack; chips([]); document.getElementById('s-rack').classList.remove('waiting'); setTimeout(() => renderRack(r.rack).catch(err => { $('#call-err').textContent = 'the rack broke: ' + (err && err.message || err); }), 300); }
  else if (hasLooks) { LOOKS = r; setTimeout(() => renderLooks().catch(err => { $('#call-err').textContent = 'the looks came back but the board broke: ' + (err && err.message || err); show('s-looks'); }), 600); }
  else if (r.done || /look one|look two|holding one more|two looks|here is the rack/i.test(say)) {
    if (!window.__askedForLooks) { window.__askedForLooks = true; turns.push({ role: 'user', content: '(the page did not receive the ' + (S.rackPicked ? 'looks' : 'rack') + '. reply again with ONLY the JSON object, ' + (S.rackPicked ? '"looks" holding the two complete looks and "held" the third' : '"rack" holding 6 to 8 pieces') + ', every item a full live object with name, brand, url, price, image. no options.)' }); ask(); }
    else $('#call-err').textContent = 'it said it was ready but did not send it. say "send it as json" to try again.';
  }
  else { const rk = document.getElementById('s-rack'); if (rk && !rk.hidden) { rk.classList.remove('waiting'); show('s-call'); } chips(r.options); if (Array.isArray(r.pictures) && r.pictures.length && typeof pictureChips === 'function') pictureChips(r.pictures); if (typeof runItButton === 'function') runItButton(); }
}

window.SEEN = window.SEEN || {};
function remember(items) { (items || []).forEach(i => { if (i && i.url) { const k = String(i.url).split('?')[0]; SEEN[k] = Object.assign(SEEN[k] || {}, { url: i.url, name: i.title || i.name, brand: i.brand || i.store, price: i.price, image: i.image, color: i.color, sizes: i.sizes }); } }); return items; }
function normItem(x) {
  if (typeof x === 'string') { const c = byId(x); return c ? { ...c, live: false, img: c.model_img ? im('img/cat/' + c.model_img) : null, cut: c.cut_img ? im('img/cat/' + c.cut_img) : null, retailer: c.retailer } : null; }
  if (x && typeof x === 'object') { const c = x.id ? byId(x.id) : null; if (c) return normItem(x.id); const k = x.url ? String(x.url).split('?')[0] : ''; const seen = (k && SEEN[k]) || {}; return { id: x.url || x.name, name: seen.name || x.name || x.title || '', brand: x.brand || x.store || seen.brand || '', retailer: x.retailer || x.store || (x.url ? x.url.replace(/^https?:\/\/(www\.|us\.)?/, '').split('/')[0] : ''), url: x.url, price: Number(seen.price || x.price) || 0, color: x.color || seen.color || '', sizes: x.sizes || seen.sizes || '', notes: x.notes || '', image: seen.image || x.image, live: true }; }
  return null;
}
async function renderLooks() {
  const dedupe = arr => { const seen = new Set(); return arr.filter(i => { const k = String(i.url || i.id || i.name || '').split('?')[0].toLowerCase() || (i.name || '').toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
  const looks = LOOKS.looks.map(l => ({ ...l, items: dedupe((l.items || []).map(normItem).filter(Boolean)) }));
  const held = LOOKS.held ? { ...LOOKS.held, items: (LOOKS.held.items || []).map(normItem).filter(Boolean) } : null;
  looks.forEach(l => { l.alts = (Array.isArray(l.alts) ? l.alts : []).map(normItem).filter(Boolean); });
  const live = [...looks.flatMap(l => l.items), ...looks.flatMap(l => l.alts), ...(held ? held.items : [])].filter(i => i.live && i.image && !i.img);
  show('s-looks'); const hl = (LOOKS.headline && String(LOOKS.headline).trim()) || ((S.q.fname && S.q.fname !== 'her' ? S.q.fname + ', ' : '') + (S.q.occasion ? 'your ' + String(S.q.occasion).replace(/^(a|an|the)\s+/, '') + ' is handled' : 'your looks are here') + '. <em>two looks,</em> and one in your back pocket.'); $('#lookhead').innerHTML = hl; const lf = document.getElementById('lookfor'); if (lf) lf.textContent = `for ${S.q.fname || 'her'} · ${S.q.occasion || 'what is coming up'}${S.q.age ? ' · ' + S.q.age : ''} · what you will send her`; $('#lookhead').contentEditable = 'true'; $('#lookhead').spellcheck = false; $('#lookhead').title = 'tap to edit the headline'; $('#looknote').textContent = (looks[0] && looks[0].why) || ''; $('#board').innerHTML = '<p class="small" style="padding:16px">pulling her photos…</p>';
  const got = await fetchImages([...new Set(live.map(i => i.image))]);
  for (const it of live) { it.img = got[it.image] || null; }
  // pieces that still have no photo: open the page and take its picture
  const bare = live.filter(it => !it.img && it.url).slice(0, 6);
  if (bare.length && mcpNs) { liveStatus('finding the missing photos…'); await Promise.all(bare.map(async it => { try { const info = await LIVE_TOOLS.find(x => x.name === 'read_page').execute({ url: it.url }); if (info && info.image) { it.image = info.image; if (info.price && !it.price) it.price = Number(info.price) || it.price; const g = await fetchImages([info.image]); it.img = g[info.image] || null; } } catch (e) {} })); liveStatus(''); }
  liveStatus('finding the clean product shots…');
  await Promise.all([...looks.flatMap(l => l.items)].filter(i => i.live && i.url).slice(0, 10).map(async it => { try { const f = await ghostShot(it); if (f) { it.flat = f; } } catch (e) {} }));
  liveStatus('');
  for (const it of live) { if (it.image && BADIMG.test(it.image) && !it.flat) { it.img = null; it.bad = true; } }
  const piece = it => `<div class="pcard piece" data-url="${it.url || ''}">${(it.flat || it.img) ? `<img alt="" src="${it.flat || it.img}">` : '<div class="ph"></div>'}<div class="n">${it.brand || it.retailer || ''}</div><div class="nm small" style="margin:0">${it.name}</div><div class="p">${it.price ? '$' + it.price : ''}</div><p class="w">${it.color || ''}${it.sizes ? ' · ' + it.sizes : ''}${it.notes ? ' · ' + it.notes : ''}</p><a href="${it.url || '#'}" target="_blank" rel="noopener">shop at ${it.retailer || 'the store'}</a></div>`;
  const tips = l => Array.isArray(l.tips) && l.tips.length ? `<p class="eyebrow" style="margin-top:14px">the rules behind it</p><ul class="tips">${l.tips.slice(0, 4).map(x => `<li>${x}</li>`).join('')}</ul>` : '';
  const alts = l => { const a = (Array.isArray(l.alts) ? l.alts : []).map(normItem).filter(Boolean); if (!a.length) return ''; return `<p class="eyebrow" style="margin-top:14px">if not that one, these</p><p class="small" style="margin:-2px 0 6px">the other pieces it weighed for the main piece. tap swap on the card above to use one.</p><div class="alts">${a.slice(0, 4).map(it => `<a href="${it.url || '#'}">${it.img ? `<img alt="" src="${it.img}">` : '<div class="ph"></div>'}<span>${it.brand ? it.brand + ' ' : ''}${it.name}${it.price ? ' · $' + it.price : ''}</span></a>`).join('')}</div>`; };
  const card = (l, i) => `<div class="look"><p class="eyebrow">look ${i} · ${i === 1 ? (S.q.occasion || 'the ask') : 'a second answer'}</p><h2>${l.title || ''}</h2><p class="lead">${l.why || ''}</p>` + (i === 1 ? '' : `<div class="lookgrid"><div class="boardcol"><div class="board" id="board-2"></div></div><div class="pcards">${l.items.map(piece).join('')}</div></div>`) + tips(l) + alts(l) + `<dl class="finish">${[['hair',l.hair],['makeup',l.makeup],['shoe',l.shoe_note],['layer',l.layer],['night before',l.night_before]].filter(x=>x[1]).map(x=>`<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl><div class="total"><span>this look</span><span>$${l.items.reduce((s, x) => s + (+x.price || 0), 0).toFixed(2)}</span></div></div>`;
  $('#lookcards').innerHTML = looks.map((l, i) => card(l, i + 1)).join('');
  { const lg = $('#board').closest('.lookgrid'); if (lg) lg.classList.remove('solo'); }
  $('#pcards-1').innerHTML = looks[0].items.map(piece).join('');
  await buildBoard(looks);
  $('#show-held').hidden = !held;
  try { if (typeof sendPanel === 'function') sendPanel(); } catch (e) {}
  try { if (typeof filePanel === 'function') { filePanel(); wireCorrections(); saveClient({ delivered: looksForFile(), transcript: transcriptForFile() }); } } catch (e) {}
  try { if (typeof feedbackPanel === 'function') feedbackPanel(); } catch (e) {}
  document.querySelectorAll('#lookcards .look h2, #lookcards .look .lead, #lookcards .finish dd, #lookcards .tips li, #looknote').forEach(el => { el.contentEditable = 'true'; el.spellcheck = false; });
  $('#show-held').onclick = () => { $('#lookcards').insertAdjacentHTML('beforeend', `<div class="look"><p class="eyebrow">held · the third look</p><h2>${held.title || ''}</h2><p class="lead">${held.why || ''}</p>` + '<div class="pcards">' + held.items.map(piece).join('') + '</div></div>'); $('#show-held').hidden = true; };
}
