import json, os, shutil, subprocess, re, base64
ROOT = os.path.dirname(os.path.abspath(__file__))
cat = json.load(open(os.path.join(ROOT, 'catalog.json')))
# copy + downsize catalog images into app/img/cat
os.makedirs(os.path.join(ROOT, 'app/img/cat'), exist_ok=True)
for it in cat:
    for k in ('model_img', 'flat_img'):
        f = it.get(k)
        if f and os.path.exists(os.path.join(ROOT, 'imgs/cat', f)):
            out = os.path.join(ROOT, 'app/img/cat', f)
            if not os.path.exists(out):
                subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '62', '--resampleWidth', '640', os.path.join(ROOT, 'imgs/cat', f), '--out', out], capture_output=True)
        else:
            it[k] = None
from PIL import Image, ImageDraw, ImageFilter
def cutout(src, dst, tol=34):
    im = Image.open(src).convert('RGB'); w, h = im.size; tmp = im.copy()
    for pt in [(1,1),(w-2,1),(1,h-2),(w-2,h-2),(w//2,1),(1,h//2),(w-2,h//2),(w//2,h-2)]:
        try: ImageDraw.floodfill(tmp, pt, (255,0,255), thresh=tol)
        except Exception: pass
    mask = Image.new('L', (w,h), 255); tp = tmp.load(); mp = mask.load()
    for y in range(h):
        for x in range(w):
            if tp[x,y] == (255,0,255): mp[x,y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert('RGBA'); out.putalpha(mask); bb = mask.getbbox()
    if not bb: return False
    out = out.crop((max(0,bb[0]-8),max(0,bb[1]-8),min(w,bb[2]+8),min(h,bb[3]+8))); out.thumbnail((520,700)); out.save(dst, optimize=True); return True
for it in cat:
    f = it.get('flat_img'); it['cut_img'] = None
    if f:
        dst = os.path.join(ROOT, 'app/img/cat', f.replace('_flat.jpg','_cut.png'))
        if os.path.exists(dst) or cutout(os.path.join(ROOT,'imgs/cat',f), dst):
            it['cut_img'] = os.path.basename(dst)
slim = [{k: it.get(k) for k in ('id', 'name', 'brand', 'retailer', 'url', 'price', 'color', 'slot', 'tags', 'neckline', 'length', 'sizes', 'model_img', 'flat_img', 'cut_img', 'notes')} for it in cat]

taste_html=''

html = r'''<title>in the bag</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap">
<style>
:root{--paper:#fdfcfb;--cream:#faf9f6;--ink:#131110;--ink-soft:#4d463f;--lipstick:#e8112d;--graphite:#77706a;--hairline:#e7e3dc;--chip:#f3efe8;--ivory:#efe6d6;--camel:#c69c6d;--choc:#4a2c1c;--navy:#4a5a7a;--black:#131110;--r:16px;--pill:999px;--gutter:clamp(18px,4.5vw,48px)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#161412;--cream:#1d1a17;--ink:#f3efe9;--ink-soft:#cfc7bd;--lipstick:#ff4a5e;--graphite:#a49c93;--hairline:#332e29;--chip:#26221e}}
:root[data-theme="dark"]{--paper:#161412;--cream:#1d1a17;--ink:#f3efe9;--ink-soft:#cfc7bd;--lipstick:#ff4a5e;--graphite:#a49c93;--hairline:#332e29;--chip:#26221e}
*{box-sizing:border-box} html,body{height:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Figtree,"Avenir Next","Segoe UI",Arial,sans-serif;font-size:1.0625rem;line-height:1.55;padding-block:0 60px;padding-inline:var(--gutter)}
img{max-width:100%;display:block} button{font:inherit;color:inherit;cursor:pointer}
.wrap{max-width:600px;margin:0 auto}
.mast{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding-block:22px 10px;border-bottom:1px solid var(--hairline)}
.wordmark{font-size:1.7rem;font-weight:500;letter-spacing:-.02em;line-height:1} .wordmark b{color:var(--lipstick);font-weight:500}
.eyebrow{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--graphite);font-weight:500;margin:0 0 6px}
h1{font-size:clamp(2.3rem,7vw,3.4rem);line-height:1.02;font-weight:400;letter-spacing:-.03em;margin:34px 0 14px;text-wrap:balance}
h1 em,h2 em{font-style:normal;color:var(--lipstick)}
h2{font-size:clamp(1.6rem,5vw,2.2rem);line-height:1.08;font-weight:400;letter-spacing:-.02em;margin:0 0 6px;text-wrap:balance}
.tq h2{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:500;font-size:clamp(1.9rem,6vw,2.5rem);text-align:center} .tq h2 em{font-style:italic;color:var(--ink)}
p{margin:0 0 12px} .lead{font-size:1.15rem;color:var(--ink-soft)} .sub{text-align:center;color:var(--graphite);font-size:.92rem;margin-bottom:14px}
.cta{display:inline-flex;align-items:center;gap:10px;background:var(--ink);color:var(--paper);border:0;border-radius:var(--pill);padding:15px 26px;font-size:1rem;font-weight:500;text-decoration:none}
.cta.ghost{background:transparent;color:var(--ink);border:1px solid var(--ink)} .cta[disabled]{opacity:.4;cursor:default}
.small{font-size:.85rem;color:var(--graphite)}
.screen{padding-block:8px 24px}
.tq{padding-block:30px;border-bottom:1px solid var(--hairline)} .tq:last-of-type{border-bottom:0}
.pick{display:grid;grid-template-columns:repeat(4,1fr);gap:6px} .pick button,.row button{position:relative;padding:0;border:2px solid transparent;border-radius:12px;overflow:hidden;background:var(--cream);text-align:left}
.pick button img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:top} .pick button span,.row button span{display:block;font-size:.72rem;padding:6px 8px;color:var(--ink-soft);line-height:1.25}
.pick button.on,.row button.on{border-color:var(--lipstick)} .pick button.on span,.row button.on span{color:var(--ink)}
.pick button.on::after,.row button.on::after{content:'';position:absolute;top:8px;right:8px;width:14px;height:14px;border-radius:50%;background:var(--lipstick)}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px} .row button img{width:100%;aspect-ratio:1;object-fit:cover;object-position:top}
@media (max-width:520px){.pick{grid-template-columns:repeat(2,1fr)}}
.opts{display:flex;justify-content:space-around;gap:8px;margin-top:18px}
.opts button{background:none;border:0;display:flex;flex-direction:column;align-items:center;gap:9px;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:500;color:var(--ink-soft);padding:4px}
.dot{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--ink);transition:background .15s} .opts button.on .dot{background:var(--lipstick);border-color:var(--lipstick)} .opts button.on{color:var(--ink)}
.q{padding-block:26px;border-bottom:1px solid var(--hairline)} .q:last-of-type{border-bottom:0}
.q .hint{color:var(--graphite);font-size:.9rem;margin:-2px 0 12px}
.choices{display:grid;grid-template-columns:1fr 1fr;gap:8px} .choices.one{grid-template-columns:1fr}
.choices button{text-align:left;background:var(--cream);border:1px solid var(--hairline);border-radius:12px;padding:13px 14px;font-size:.98rem;line-height:1.3} .choices button.on{border-color:var(--ink);background:var(--paper);box-shadow:inset 0 0 0 1px var(--ink)}
.choices button small{display:block;color:var(--graphite);font-size:.8rem;margin-top:2px}
.pal{display:flex;gap:6px;margin-bottom:8px} .pal i{width:18px;height:18px;border-radius:50%;display:block;border:1px solid var(--hairline)}
textarea,input[type=text]{width:100%;font:inherit;color:#131110;background:#fff;border:1px solid var(--hairline);border-radius:12px;padding:12px 14px;resize:vertical}
.err{color:var(--lipstick);font-size:.9rem;margin-top:8px;min-height:1.2em}
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px}
/* results */
.read{background:var(--cream);border:1px solid var(--hairline);border-radius:var(--r);padding:16px 18px;margin:12px 0 22px}
.first{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:16px;align-items:start;margin-bottom:22px}
.first img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px;background:var(--cream)}
.first ol{margin:0;padding-left:18px;color:var(--ink-soft)} .first li{margin-bottom:6px}
.held{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px}
.held div{border:1px solid var(--hairline);border-radius:10px;padding:12px 10px;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:1.1rem;text-align:center;background:var(--cream)}
.rule{border-top:1px solid var(--hairline);padding:12px 0} .rule b{font-weight:500;display:block} .rule span{color:var(--graphite);font-size:.88rem}
.sealed{display:inline-block;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--hairline);border-radius:var(--pill);padding:1px 7px;margin-left:6px;color:var(--graphite);vertical-align:middle}
/* chat */
.chat{display:flex;flex-direction:column;gap:10px;margin:14px 0}
.b{max-width:88%;padding:12px 15px;border-radius:18px;line-height:1.45;white-space:pre-wrap}
.b.her{align-self:flex-start;background:var(--cream);border:1px solid var(--hairline);border-bottom-left-radius:6px}
.b.me{align-self:flex-end;background:var(--ink);color:var(--paper);border-bottom-right-radius:6px}
.b.think{color:var(--graphite);font-style:italic}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 6px}
.chips button{background:var(--paper);border:1px solid var(--ink);border-radius:var(--pill);padding:8px 14px;font-size:.92rem}
.compose{display:flex;gap:8px;margin-top:8px;position:sticky;bottom:10px}
.compose input{flex:1;background:var(--paper)} .compose button{background:var(--ink);color:var(--paper);border:0;border-radius:var(--pill);padding:0 18px;font-weight:500}
/* looks */
.board{position:relative;width:100%;aspect-ratio:4/5;background:#f4f1eb;border:1px solid var(--hairline);border-radius:6px;overflow:hidden;margin:8px 0 10px;color:#131110}
.board .cut{position:absolute;background:#fff;border:1px solid rgba(19,17,16,.08);border-radius:4px;padding:6%;box-sizing:border-box} .board .cut img{width:100%;height:100%;object-fit:contain}
.board .photo{position:absolute;overflow:hidden;border-radius:4px;border:1px solid rgba(19,17,16,.08);background:#fff} .board .photo img{width:100%;height:100%;object-fit:cover;object-position:top}
.board .dots{position:absolute;display:flex;flex-direction:row;gap:6px} .board .dots i{display:block;width:clamp(14px,2.6vw,22px);aspect-ratio:1;border-radius:50%} .board .titleblock{position:absolute;background:#fff;border:1px solid rgba(19,17,16,.08);border-radius:4px;padding:5% 6%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;color:#131110;overflow:hidden} .board .titleblock .eyebrow{font-size:clamp(.5rem,1.3vw,.62rem);letter-spacing:.16em;color:#6b6560;margin:0} .board .titleblock .t{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:clamp(.95rem,2.8vw,1.5rem);line-height:1.05;margin:4px 0} .board .titleblock .cap{font-size:clamp(.5rem,1.3vw,.62rem);letter-spacing:.12em;text-transform:uppercase;color:#6b6560;margin:0 0 6px}
.board .tile{transition:none} .prow{display:flex;justify-content:space-between;gap:16px;padding:16px 4px;border-top:1px solid #ececea;cursor:pointer} .prow:hover{background:#faf9f7} .prow b{font-family:"Bodoni Moda",Didot,serif;font-weight:400;font-size:1.25rem;display:block} .prow span{color:#6f6f6f;font-size:.82rem} .prow .pm{text-align:right;font-size:.82rem;color:#2b2b2b;line-height:1.5} #askbox{position:fixed;inset:0;background:rgba(17,17,17,.35);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px} .askcard{background:#fff;border:1px solid #e6e6e6;padding:22px;width:min(520px,100%);box-shadow:0 20px 60px rgba(0,0,0,.18)} .asklabel{font-family:"Bodoni Moda",Didot,serif;font-size:1.25rem;margin:0 0 10px} .askcard textarea,.askcard input{width:100%} .askbtns{display:flex;gap:8px;margin-top:12px} .askcard .small{white-space:pre-line;max-height:160px;overflow:auto} .racklog{grid-column:1/-1;border:1px solid #e6e6e6;padding:14px;max-height:260px;overflow:auto;line-height:1.7} #s-rack.waiting #rack-build,#s-rack.waiting #rack-auto,#s-rack.waiting #rack-line{display:none} .styledgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:10px 0 26px} .stile{background:#fff;border:1px solid #e6e6e6;padding:10px 8px 8px;cursor:pointer} .stitle{font-family:"Bodoni Moda",Didot,serif;font-style:italic;text-align:center;font-size:.95rem;margin-bottom:6px} .spics{display:grid;grid-template-columns:1fr 1fr;gap:4px} .sp{aspect-ratio:1;background:#f6f6f4} .sp img{width:100%;height:100%;object-fit:contain;display:block;background:#fff} .smeta{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#6f6f6f;text-align:center;margin-top:8px} .ib-tip{background:#111!important;color:#fff!important;border-color:#111!important} .lookgrid{display:grid;grid-template-columns:1.55fr 1fr;gap:16px;align-items:start;margin:14px 0 8px} .boardcol{min-width:0;position:sticky;top:12px} .lookgrid.solo{grid-template-columns:minmax(0,640px);justify-content:center} .lookgrid.solo .boardcol{position:static} .pcards{display:grid;grid-template-columns:1fr 1fr;gap:12px} .pcard,.pcard.piece{position:relative;background:#fff;border:1px solid #e6e6e6;padding:16px 10px 14px;text-align:center;display:flex!important;flex-direction:column;align-items:center;gap:4px;grid-template-columns:none} .pcard img,.pcard .ph{width:100%;aspect-ratio:1;object-fit:contain;background:#fff;display:block;margin-bottom:8px} .pcard .ph{background:#f6f6f4} .pcard .n{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#111;line-height:1.3} .pcard .p{font-weight:500;font-size:.95rem} .pcard a{color:#111;font-weight:600;font-size:.82rem;text-decoration:underline} .pcard .w{font-size:.75rem;color:#6f6f6f;margin:0} .pcard .fix{display:flex;gap:6px;margin-top:8px;justify-content:center;grid-column:auto} .pcard .nm{font-size:.8rem;color:#2b2b2b;line-height:1.3} .pcard .fix button{font-size:.72rem;padding:4px 8px;border-radius:2px;border:1px solid #cfcfcf;background:#fff;color:#111} .board.square{aspect-ratio:1/1} .board .btitle{position:absolute;left:0;right:0;top:3.5%;text-align:center;font-family:"Bodoni Moda",Didot,serif;font-style:italic;font-size:clamp(1rem,2.6vw,1.45rem);color:#111;z-index:4;pointer-events:none} .board.square .caption{display:none} .look .lookgrid{margin-top:8px} @media (max-width:640px){.lookgrid{grid-template-columns:1fr}} .who .chips button{background:#fff;color:#131110;border:1px solid #131110} .who .chips button.on{background:#131110;color:#fff} .insp{border:1px solid var(--hairline);border-radius:12px;padding:10px;background:#fff;color:#131110;font-size:.85rem;line-height:1.4} .insp .pics{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px} .insp .pics.one{grid-template-columns:1fr} .insp .pics.one img,.insp .pics.one .ph{aspect-ratio:4/5} .insp .pics img,.insp .pics .ph{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;background:var(--cream);display:block;font-size:.7rem;padding:6px;color:#6b6560} .insp b{display:block;font-weight:500;font-size:1rem;margin:2px 0 4px} .insp p{margin:0 0 6px} .insp .chips{margin-top:6px} .insp .chips button{font-size:.78rem;padding:5px 10px;background:#fff;color:#131110;border-color:#131110} .rk a,.insp a{color:#131110} #s-inspo .rack{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))} .chips button.on{background:var(--ink);color:var(--paper)} .board .tile.sel{outline:2px solid var(--lipstick);outline-offset:2px} .board .hd{position:absolute;right:-7px;bottom:-7px;width:16px;height:16px;border-radius:50%;background:var(--lipstick);cursor:nwse-resize;z-index:9} .board .line[contenteditable]:focus{outline:1px dashed var(--lipstick);background:rgba(255,255,255,.5)} #boardtools .bt{font-size:.8rem;padding:4px 10px;border-radius:999px;border:1px solid var(--hairline);background:var(--cream)} #lookcards [contenteditable]:focus,#looknote:focus{outline:1px dashed var(--lipstick);background:#fff} #who-age button.on,.chips button.on{background:var(--ink);color:var(--paper);border-color:var(--ink)} .rack{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px} .rk{display:block;position:relative;border:1.5px solid var(--hairline);border-radius:12px;padding:8px;background:#fff;color:#131110;opacity:.55;cursor:pointer;font-size:.8rem;line-height:1.35} .rk.on{opacity:1;border-color:var(--ink)} .rk input{position:absolute;top:10px;left:10px;width:18px;height:18px;margin:0;z-index:2} .rk img,.rk .ph{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;background:var(--cream);display:block;margin-bottom:6px} .rk b{display:block;font-weight:500} .rk span{display:block;color:#6b6560} .rk em{display:block;font-style:italic;margin-top:4px} .rk a{display:inline-block;margin-top:4px;font-size:.75rem} .tips{margin:6px 0 0 18px;padding:0;font-size:.95rem;line-height:1.5} .tips li{margin:2px 0} .alts{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:8px} .alts a{display:block;text-decoration:none;color:inherit;font-size:.78rem;line-height:1.3} .alts img,.alts .ph{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;background:var(--cream);margin-bottom:4px;display:block} .picrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;width:100%;margin-bottom:8px} .picrow button{padding:0;border-radius:12px;overflow:hidden;text-align:left;background:var(--cream);border:1px solid var(--hairline)} .picrow img,.picrow .ph{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:#e9e5df} .picrow span{display:block;padding:6px 8px;font-size:.82rem} #runit{background:var(--cream);color:var(--ink);border:1px solid var(--hairline)} .who{display:grid;gap:8px;margin:0 0 14px;padding:14px;border:1px solid var(--hairline);border-radius:var(--r);background:#fff;color:#131110} .who .row{display:flex;gap:8px;flex-wrap:wrap} .who input{flex:1;min-width:140px} .board .card{position:absolute;background:#fff;color:#131110;border-radius:10px;box-shadow:0 8px 24px rgba(19,17,16,.12);padding:3% 2% 2%;text-align:center;font-size:clamp(.55rem,1.6vw,.72rem);letter-spacing:.08em;text-transform:uppercase;line-height:1.3;width:16%} .board .card img{object-fit:contain}
.board .card img{width:100%;aspect-ratio:1;object-fit:contain;margin-bottom:5%} .board .card b{display:block;font-size:1.25em;letter-spacing:0;text-transform:none;font-weight:500}
.board .line{position:absolute;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:clamp(1rem,3.2vw,1.5rem);line-height:1.15;max-width:28%;color:#131110}
.look{padding-block:24px;border-top:1px solid var(--hairline)}
.piece{display:grid;grid-template-columns:84px 1fr auto;gap:4px 14px;padding:12px 0;border-top:1px solid var(--hairline);align-items:start}
.piece:first-of-type{border-top:0} .piece img{width:84px;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:10px;background:var(--cream);grid-row:span 3}
.piece .n{font-weight:500} .piece .p{font-weight:500;white-space:nowrap} .piece .w{grid-column:2/4;color:var(--ink-soft);font-size:.92rem;margin:0}
.piece a{grid-column:2/4;font-size:.88rem}
.finish{display:grid;grid-template-columns:96px 1fr;gap:8px 12px;margin-top:10px;font-size:.95rem} .finish dt{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--graphite);font-weight:500;padding-top:3px} .finish dd{margin:0}
.total{display:flex;justify-content:space-between;border-top:2px solid var(--ink);padding-top:10px;font-weight:500;margin-top:8px}
.note{font-size:1.15rem;line-height:1.45;font-style:italic;border-left:2px solid var(--lipstick);padding-left:16px;margin:8px 0 22px}
@media (max-width:520px){.first{grid-template-columns:1fr}.held{grid-template-columns:1fr}.board{aspect-ratio:4/5}.board .line{max-width:40%}.finish{grid-template-columns:1fr}}
/* ---------- the house look: white, editorial serif, square black buttons, hairlines ---------- */
:root{color-scheme:light;--paper:#ffffff;--cream:#f6f6f4;--ink:#111111;--ink-soft:#2b2b2b;--lipstick:#111111;--graphite:#6f6f6f;--hairline:#e6e6e6;--chip:#f3f3f1;--r:2px;--pill:2px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#ffffff;--cream:#f6f6f4;--ink:#111111;--ink-soft:#2b2b2b;--lipstick:#111111;--graphite:#6f6f6f;--hairline:#e6e6e6;--chip:#f3f3f1}}
:root[data-theme="dark"]{--paper:#ffffff;--cream:#f6f6f4;--ink:#111111;--ink-soft:#2b2b2b;--lipstick:#111111;--graphite:#6f6f6f;--hairline:#e6e6e6;--chip:#f3f3f1}
body{font-family:Inter,"Helvetica Neue",Arial,sans-serif;font-size:.98rem;line-height:1.6;color:#111;background:#fff;letter-spacing:.005em}
.wrap{max-width:760px}
.mast{padding-block:26px 14px;border-bottom:1px solid #e6e6e6;align-items:center}
.wordmark{font-family:"Bodoni Moda",Didot,"Times New Roman",serif;font-weight:400;font-size:1.75rem;letter-spacing:.02em} .wordmark b{color:#111}
.eyebrow{font-size:.66rem;letter-spacing:.2em;color:#6f6f6f;font-weight:500}
h1,h2,.tq h2,#lookhead{font-family:"Bodoni Moda",Didot,"Times New Roman",serif;font-weight:400;font-style:normal;letter-spacing:.005em}
h1{font-size:clamp(2.2rem,6vw,3.1rem);line-height:1.08;margin:40px 0 16px} h1 em,h2 em{color:#111;font-style:italic}
h2{font-size:clamp(1.5rem,4.2vw,2rem);line-height:1.12}
.tq h2{font-style:normal;font-size:clamp(1.7rem,5vw,2.2rem)} .tq h2 em{font-style:italic}
.lead{font-size:1.02rem;color:#2b2b2b;line-height:1.65}
.small,.sub,.q .hint{color:#6f6f6f}
.cta{border-radius:2px;background:#111;color:#fff;padding:15px 30px;font-size:.92rem;font-weight:500;letter-spacing:.02em} .cta.ghost{background:#fff;color:#111;border:1px solid #111}
.chips button,#boardtools .bt,.fix button,.insp .chips button,.who .chips button{border-radius:2px;background:#fff;color:#111;border:1px solid #cfcfcf;padding:9px 16px;font-size:.85rem;letter-spacing:.01em}
.chips button.on,#who-age button.on,.who .chips button.on{background:#111;color:#fff;border-color:#111}
.choices button{background:#fff;border:1px solid #e0e0e0;border-radius:2px;padding:14px 16px;font-size:.95rem} .choices button.on{border-color:#111;box-shadow:inset 0 0 0 1px #111;background:#fff}
textarea,input[type=text]{background:#fff;border:1px solid #d6d6d6;border-radius:2px;color:#111;padding:13px 14px}
.compose input{border-radius:2px} .compose button{border-radius:2px;background:#111;color:#fff;border:0;padding:0 22px} #runit{border-radius:2px;background:#fff;color:#111;border:1px solid #111}
.b{border-radius:2px;font-size:.97rem;line-height:1.55} .b.her{background:#f6f6f4;color:#111;border:1px solid #ececea} .b.me{background:#111;color:#fff} .b.think{color:#6f6f6f;background:#fff;border:1px dashed #d6d6d6}
.pick button,.row button,.picrow button{border-radius:2px;background:#fff;border:1px solid #e6e6e6} .pick button.on,.row button.on{border-color:#111;box-shadow:inset 0 0 0 1px #111} .pick button.on::after,.row button.on::after{background:#111}
.pick button img,.row button img,.picrow img{background:#f6f6f4}
.look,.rk,.insp,.who,#sendpanel,#filepanel,#fbpanel{background:#fff;border:1px solid #e6e6e6;border-radius:2px;padding:28px 26px}
.look h2{text-align:center;margin:6px 0 10px} .look .eyebrow{text-align:center;display:block} .look .lead{text-align:center;font-family:"Bodoni Moda",serif;font-style:italic;font-size:1.08rem;color:#2b2b2b;max-width:44ch;margin:0 auto 18px}
.piece{border-top:1px solid #ececea;align-items:start} .piece img{width:96px;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:0;background:#f6f6f4} .piece .n{font-weight:500;letter-spacing:.005em} .piece .p{font-weight:500} .piece a{color:#111} .piece .w{color:#6f6f6f;font-size:.85rem} .alts img{border-radius:0} .rk img{border-radius:0} .rk b{font-family:Inter,sans-serif;font-size:.82rem} .rk span{font-size:.78rem} .board .photo.mood img{filter:saturate(.92) contrast(1.02)} .board .photo.prod:not(.flat) img{object-position:top center}
.finish dt{color:#6f6f6f;letter-spacing:.16em;font-size:.66rem} .total{border-top:1px solid #111;font-weight:500}
.tips{color:#2b2b2b} .alts a span{color:#2b2b2b}
.rk{padding:10px} .rk.on{border-color:#111} .rk input{accent-color:#111}
.insp{padding:12px} .insp b{font-family:"Bodoni Moda",serif;font-weight:400;font-size:1.15rem} .insp .eyebrow{display:block}
#s-inspo h1,#s-rack h1{text-align:center} #s-inspo .chips{justify-content:center}
.board{background:#fff;border:1px solid #e6e6e6;border-radius:2px}
.board .photo{border:0;border-radius:0;background:#fff} .board .photo.prod img{object-fit:contain;object-position:center;padding:0;box-sizing:border-box} .board .cut{padding:0;background:transparent} .board .cut img{object-fit:contain;transform:scale(1.08)} .board .photo.prod img{object-fit:cover;object-position:top} .board .photo.prod.flat{background:#fff} .board .photo.prod.flat img{object-fit:contain;object-position:center;transform:scale(1.04)} .board .empty{background:#f6f6f4;display:flex;align-items:center;justify-content:center;text-align:center;padding:8%;font-size:clamp(.55rem,1.4vw,.75rem);line-height:1.35;color:#6f6f6f} .board .empty small{display:block;margin-top:4px;font-size:.85em} .board .caption{position:absolute;left:2.5%;bottom:1.5%;font-size:clamp(.5rem,1.2vw,.62rem);letter-spacing:.16em;text-transform:uppercase;color:#6f6f6f} .board .cut{background:#fff;border:0;border-radius:0;padding:4%}
.board .titleblock{background:#fff;border:0;border-radius:0;align-items:center;text-align:center;justify-content:center;gap:6px}
.board .titleblock .t{font-family:"Bodoni Moda",Didot,serif;font-style:normal;font-size:clamp(1rem,3vw,1.6rem);line-height:1.1}
.board .titleblock .eyebrow{letter-spacing:.22em} .board .titleblock .cap{letter-spacing:.14em}
.board .dots{justify-content:center} .board .dots i{width:clamp(10px,2vw,16px);border:1px solid rgba(0,0,0,.15)!important}
.board .line{font-family:"Bodoni Moda",Didot,serif;font-style:italic}
#boardtools{color:#6f6f6f;font-size:.8rem} #boardtools .paper{border:1px solid #d6d6d6}
.nav .cta{border-radius:2px}
.err{color:#b00020}
.tq{border-bottom:1px solid #ececea} .q{border-bottom:1px solid #ececea}
@media (max-width:520px){.look,.who,#sendpanel,#filepanel,#fbpanel{padding:20px 16px}}
</style>

<div class="wrap">
<header class="mast"><div class="wordmark">in the b<b>.</b>ag</div><span class="eyebrow" id="step" style="margin:0">your personal stylist</span></header>

<section class="screen" id="s-door">
  <p class="eyebrow">for the stylist · after the quiz</p>
  <h1>her answers are in. <em>now build her.</em></h1>
  <p class="lead">put in what the quiz already told you, narrow it with her on the line, name what she needs help with, and the call runs from there: her read, her rules, the questions to ask, and two looks on a board to send.</p>
  <p class="small">nothing here is sold. the looks are free and it stays free.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="cta" id="go-q">put her answers in →</button><button class="cta ghost" id="go-skip">or skip ahead and just ask her →</button><button class="cta ghost" id="go-quick">just get a look →</button><button class="cta ghost" id="go-inspo">this week's looks</button><button class="cta ghost" id="go-files" hidden>her files</button></div>
  <p class="small" style="margin-top:10px">skip ahead when there is no quiz yet: type what she needs, and she asks for the rest.</p>
</section>


<section class="screen" id="s-q" hidden>
  <div class="q"><h2>who is she?</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input type="text" id="fname" placeholder="first name"><input type="text" id="spend" placeholder="monthly outfit spend, if asked"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><input type="text" id="qsize" placeholder="her size, e.g. S or 6"><input type="text" id="qbrands" placeholder="stores she already shops"></div><p class="sub" style="margin:10px 0 4px">her age range, it picks the stores</p><div class="choices" data-q="age"><button data-v="under 25">under 25</button><button data-v="25 to 34">25 to 34</button><button data-v="35 to 44">35 to 44</button><button data-v="45 plus">45 plus</button></div></div>
  <div class="q"><h2>which quiz did she take?</h2>
    <div class="choices" data-q="quiz"><button data-v="the closet">the closet</button><button data-v="the date">the date</button></div></div>
  <div id="closet-fields">
    <div class="q"><h2>the wish</h2><p class="hint">what's the one thing you wish someone would just tell you about your closet?</p>
      <div class="choices" data-q="wish"><button data-v="what actually goes with what i already own">what goes with what i own</button><button data-v="what i should stop buying">what i should stop buying</button><button data-v="what my style even is at this point">what my style even is</button><button data-v="how to make getting dressed less stressful">getting dressed, less stressful</button></div></div>
    <div class="q"><h2>her style</h2>
      <div class="choices" data-q="style"><button data-v="effortless">effortless and down to earth</button><button data-v="bold">confident and bold</button><button data-v="classic">classic and elegant</button><button data-v="urban">urban, cool girl</button></div></div>
    <div class="q"><h2>prints</h2>
      <div class="choices" data-q="prints"><button data-v="solid, no print">solid, no print</button><button data-v="soft florals">soft florals</button><button data-v="stripes">stripes</button><button data-v="something bolder, animal or graphic">bolder, animal or graphic</button></div></div>
    <div class="q"><h2>silhouette</h2>
      <div class="choices" data-q="silhouette"><button data-v="fitted">fitted and sleek</button><button data-v="relaxed">relaxed and easy</button><button data-v="structured">structured and tailored</button><button data-v="flowy">flowy and soft</button></div></div>
    <div class="q"><h2>where it needs help</h2><p class="hint">as many as she tapped.</p>
      <div class="choices multi" data-q="helpareas"><button data-v="everyday: at home, school, or work">everyday</button><button data-v="going out">going out</button><button data-v="one specific occasion">one specific occasion</button><button data-v="weekends">weekends</button></div></div>
    <div class="q"><h2>what her closet is missing</h2>
      <div class="choices" data-q="missing"><button data-v="a few basics that would tie the rest together">a few basics</button><button data-v="one statement piece i don't have the confidence to buy alone">one statement piece</button><button data-v="genuinely no idea, that's the point">genuinely no idea</button><button data-v="nothing. i just need help putting new looks together">nothing, just new looks</button></div></div>
    <div class="q"><h2>her shape</h2><p class="hint">a shape, not a size. it changes which cuts she opens with.</p>
      <div class="choices" data-q="shape"><button data-v="oval">oval</button><button data-v="hourglass">hourglass</button><button data-v="rectangle">rectangle</button><button data-v="pear">pear</button><button data-v="inverted triangle">inverted triangle</button></div></div>
  </div>
  <div id="date-fields" hidden>
    <div class="q"><h2>the fear</h2>
      <div class="choices" data-q="fear"><button data-v="showing up underdressed">underdressed</button><button data-v="showing up overdressed">overdressed</button><button data-v="buying something i'll never wear again">never wearing it again</button><button data-v="not feeling like myself in it">not feeling like me</button></div></div>
    <div class="q"><h2>the look</h2>
      <div class="choices" data-q="look"><button data-v="classic">classic and tailored</button><button data-v="easy">easy and relaxed</button><button data-v="bold">bold and statement-making</button><button data-v="romantic">romantic and feminine</button></div></div>
    <div class="q"><h2>the feeling</h2>
      <div class="choices" data-q="feelkey"><button data-v="effortless">effortless, like i didn't try</button><button data-v="polished">polished and pulled together</button><button data-v="best">like the best version of myself</button><button data-v="comfortable">comfortable first, always</button></div></div>
    <div class="q"><h2>what matters</h2>
      <div class="choices" data-q="matters"><button data-v="getting the exact right look">the exact right look</button><button data-v="something that makes me feel confident">feeling confident</button><button data-v="investment pieces i'll keep for years">investment pieces</button><button data-v="whatever's easiest to pull off">whatever's easiest</button></div></div>
  </div>
  <div class="q"><h2>what's coming up</h2><p class="hint">from the quiz, or from what she wrote.</p>
    <div class="choices" data-q="occasion"><button data-v="a wedding">a wedding</button><button data-v="a bachelorette">a bachelorette</button><button data-v="a night out">a night out</button><button data-v="a work thing">a work thing</button><button data-v="a trip">a trip</button><button data-v="a date">a date</button><button data-v="a birthday">a birthday</button></div>
    <div class="choices" data-q="when" style="margin-top:8px"><button data-v="this week">this week</button><button data-v="two to four weeks">2 to 4 weeks</button><button data-v="a month or two">a month or two</button><button data-v="no date, just want to be ready">no date yet</button></div></div>
  <div class="q"><h2>palette</h2>
    <div class="choices" data-q="palette">
      <button data-v="warm"><span class="pal"><i style="background:#c69c6d"></i><i style="background:#efe6d6"></i><i style="background:#4a2c1c"></i></span>warm neutrals<small>camel, cream, chocolate</small></button>
      <button data-v="cool"><span class="pal"><i style="background:#131110"></i><i style="background:#fff"></i><i style="background:#9a9a9a"></i></span>cool neutrals<small>black, white, grey</small></button>
      <button data-v="jewel"><span class="pal"><i style="background:#0f6e56"></i><i style="background:#1f3a8a"></i><i style="background:#6b1f2b"></i></span>jewel tones<small>emerald, sapphire, wine</small></button>
      <button data-v="soft"><span class="pal"><i style="background:#f4c0d1"></i><i style="background:#b7c4a5"></i><i style="background:#b5d4f4"></i></span>soft tones<small>blush, sage, powder blue</small></button>
      <button data-v="earth"><span class="pal"><i style="background:#6b6b3a"></i><i style="background:#b5532a"></i><i style="background:#c9744e"></i></span>earth tones<small>olive, rust, terracotta</small></button>
      <button data-v="bright"><span class="pal"><i style="background:#e8112d"></i><i style="background:#1f4fd8"></i><i style="background:#e0409c"></i></span>brights<small>red, cobalt, hot pink</small></button>
      <button data-v="black"><span class="pal"><i style="background:#131110"></i><i style="background:#2a2624"></i><i style="background:#4a4441"></i></span>all black<small>black on black, texture does the work</small></button>
      <button data-v="denim"><span class="pal"><i style="background:#3b5b8a"></i><i style="background:#ffffff;border-color:#ccc"></i><i style="background:#c8a67a"></i></span>denim and white<small>blue, white, tan</small></button></div></div>
  <div class="q"><h2>in her words</h2><p class="hint">paste it exactly. read it twice.</p><textarea id="words" rows="3" placeholder="she left this blank"></textarea></div>
  <div class="nav"><span class="err" id="q-err" style="max-width:60%"></span><button class="cta" id="go-taste">narrow it with her →</button></div>
</section>
<section class="screen" id="s-taste" hidden>
  <p class="lead" id="taste-intro"></p>
  <div class="tq"><p class="eyebrow">narrow it · 1 of 6</p><h2 id="pick-h">tap every one that's <em>you</em></h2><p class="sub">not the one you admire. the one you'd actually wear there.</p><p class="sub" id="brand-h">first, the brands that are her. tap up to four, then find her pieces.</p><div class="chips" id="brand-row"></div><div class="chips" style="margin:8px 0"><button type="button" id="brand-go">find her pieces →</button></div><p class="small" id="pick-note" style="min-height:1.2em"></p><div class="pick" id="pick-grid"></div></div>
  <div class="tq"><p class="eyebrow">narrow it · 2 of 6</p><h2>which <em>neckline</em>?</h2><p class="sub">tap up to two.</p><div class="row" id="neck-row"></div></div>
  <div class="tq"><p class="eyebrow">narrow it · 3 of 6</p><h2>which <em>length</em>?</h2><div class="row" id="len-row"></div></div>
  <div class="tq"><p class="eyebrow">narrow it · 4 of 6</p><h2>and on your <em>feet</em>?</h2><div class="row" id="shoe-row"></div></div>
  <div class="tq"><p class="eyebrow">narrow it · 5 of 6</p><h2>what should people <em>notice first</em>?</h2><p class="sub">one hero. everything else stays quiet so it can.</p>
    <div class="choices" data-q="hero"><button data-v="my shoulders and collarbone">shoulders and collarbone</button><button data-v="my waist">my waist</button><button data-v="my legs">my legs</button><button data-v="my back">my back</button><button data-v="the colour on me">the colour on me</button><button data-v="one accessory, and my face">one accessory, and my face</button></div></div>
  <div class="tq"><p class="eyebrow">narrow it · 6 of 6</p><h2>the one thing you'd <em>move</em> this time.</h2><p class="sub">she keeps you you, then moves one thing ten percent.</p>
    <div class="choices" data-q="move"><button data-v="colour">colour</button><button data-v="shape">shape</button><button data-v="texture">texture</button><button data-v="accessories">accessories</button></div></div>
  <div class="nav"><span class="err" id="taste-err"></span><button class="cta" id="go-help">next →</button></div>
</section>
<section class="screen" id="s-help" hidden>
  <p class="eyebrow">last one</p>
  <h2>what do you actually need help with?</h2>
  <p class="hint" style="color:var(--graphite);margin-bottom:12px">tap as many as apply. it decides what she spends the fifteen minutes on.</p>
  <div class="choices multi" data-q="help">
    <button data-v="the whole outfit, from scratch">the whole outfit, from scratch</button>
    <button data-v="build around something i already own">build around something i own</button>
    <button data-v="just the finish: shoes, bag, jewelry">just the finish<small>shoes, bag, jewelry</small></button>
    <button data-v="hair and makeup to go with it">hair and makeup to go with it</button>
    <button data-v="what to buy versus what i already have">what to buy vs what i have</button>
    <button data-v="i bought something and can't make it work">i bought something and can't make it work</button>
  </div>
  <div class="q" style="border:0;padding-top:18px"><h2 style="font-size:1.3rem">what she'd spend on this</h2><div class="choices" data-q="budget"><button data-v="under $150">under $150</button><button data-v="$150 to $300">$150 to $300</button><button data-v="$300 to $600">$300 to $600</button><button data-v="whatever it takes">whatever it takes</button></div></div>
  <div class="q" style="border:0;padding-top:18px"><h2 style="font-size:1.3rem">the piece, if there is one</h2><p class="hint">the thing you own, or the thing you bought. brand and colour is enough.</p><input type="text" id="piece" placeholder="black satin midi from zara, never worn"></div>
  <div class="nav"><span class="err" id="help-err"></span><button class="cta" id="go-results">see my read →</button></div>
</section>

<section class="screen" id="s-results" hidden>
  <p class="eyebrow">your read</p>
  <h1 id="pname"></h1>
  <div class="read" id="pread"></div>
  <p class="eyebrow">your first look, built</p>
  <div class="first"><img id="firstimg" alt=""><ol id="firstpieces"></ol></div>
  <p class="eyebrow">held for the call</p>
  <div class="held" id="heldtitles"></div>
  <p class="eyebrow">your four rules · she opens them on the call</p>
  <div id="rules"></div>
  <div class="nav"><span class="small">fifteen minutes. free. and it stays free.</span><button class="cta" id="go-call">she's ready, call now →</button></div>
</section>

<section class="screen" id="s-inspo" hidden>
  <p class="eyebrow">inspo · for the stylist, refreshed weekly</p>
  <h1>this week, <em>in fashion.</em></h1>
  <div class="chips" style="margin:6px 0 10px"><button type="button" id="inspo-tab-week" class="on">this week, from the press</button><button type="button" id="inspo-tab-social">what's trending</button><button type="button" class="start-board">start a board for someone</button><button type="button" id="inspo-back">back</button></div>
  <div id="inspo-week"><p class="small" id="inspo-note" style="min-height:1.2em"></p><div class="rack" id="inspogrid"></div></div>
  <div id="inspo-social" hidden><p class="small" id="social-note" style="min-height:1.2em"></p><div class="rack" id="socialgrid"></div></div>
</section>
<section class="screen" id="s-rack" hidden>
  <p class="eyebrow">the rack · what the brain found, before she sees anything</p>
  <h1>pick what is <em>her.</em></h1>
  <p class="lead" id="rack-note"></p>
  <div class="rack" id="rackgrid"></div>
  <input type="text" id="rack-line" placeholder="a line for the brain, optional: softer, less skin, the red one is the hero" style="margin-top:12px">
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="cta" id="rack-build">build the looks with these →</button><button class="cta ghost" id="rack-auto">let the brain pick</button><button class="cta ghost" id="rack-more">ask her more first</button></div>
</section>
<section class="screen" id="s-call" hidden>
  <p class="eyebrow">on the line · you type what she says, the brain gives you the next line</p>
  <div class="who" id="who" hidden><p class="eyebrow">who is this for</p><div class="row"><input type="text" id="who-name" placeholder="her first name"><input type="text" id="who-phone" placeholder="her phone, the join key"></div><div class="row"><input type="text" id="who-size" placeholder="her size, e.g. S or 6"><input type="text" id="who-brands" placeholder="stores she already shops"></div><div class="chips" id="who-age"><button type="button" data-v="under 25">under 25</button><button type="button" data-v="25 to 34">25 to 34</button><button type="button" data-v="35 to 44">35 to 44</button><button type="button" data-v="45 plus">45 plus</button></div><p class="small">name and age first; the questions and the stores are picked for her, not for you.</p></div>
  <div class="chat" id="chat"></div>
  <div class="chips" id="chips"></div>
  <p class="small" style="margin:0 0 6px"><button type="button" class="to-inspo" style="border:0;background:none;text-decoration:underline;font-size:.85rem;padding:0;cursor:pointer">need an idea? this week's looks</button></p>
  <form class="compose" id="compose"><input type="text" id="msg" placeholder="what she just said, in her words" autocomplete="off"><button type="submit">send</button></form>
  <p class="err" id="call-err"></p>
</section>

<section class="screen" id="s-file" hidden>
  <p class="eyebrow">her profile</p>
  <h1 id="file-head"></h1>
  <p class="small" id="file-sub"></p>
  <div class="chips" style="margin:8px 0 14px"><button type="button" id="file-call">call her again</button><button type="button" id="file-send">send the looks again</button><button type="button" id="file-fu">what she wore</button><button type="button" id="file-note">add a note</button><button type="button" id="file-back">back to files</button></div>
  <div id="file-body"></div>
</section>
<section class="screen" id="s-files" hidden>
  <div class="chips" style="margin:6px 0 4px"><button type="button" id="files-back-top">back</button></div>
  <p class="eyebrow">her files · one profile per person</p>
  <h1>every woman we've <em>dressed.</em></h1>
  <p class="lead">tap a woman to open her file: what we know, the looks we sent, what changed, what she wore. from there you can call her again or send the looks again.</p>
  <div id="files-list"></div>
  <div id="styled" style="margin-top:28px"></div>
  <div class="nav"><button class="cta ghost" id="files-back">back</button></div>
</section>

<section class="screen" id="s-looks" hidden>
  <p class="eyebrow" id="lookfor">for the stylist · what you will send her</p>
  <p class="small" style="margin:0">the line she will read, tap to edit:</p>
  <h1 id="lookhead" style="margin-top:6px"></h1>
  <p class="note" id="looknote"></p>
  <div class="lookgrid"><div class="boardcol"><div class="board" id="board"></div></div><div class="pcards" id="pcards-1"></div></div>
  <div id="lookcards"></div>
  <div class="nav"><button class="cta ghost" id="show-held">open the held look</button><button class="cta ghost to-inspo" type="button">this week's looks</button><button class="cta ghost" id="to-files" type="button">her files</button><button class="cta" id="back-chat">ask her something</button></div>
  <p class="small" style="margin-top:20px">send this to her within 24 hours. free, and it stays free. she's on the list for first drops this fall, and you keep her file.</p>
</section>
</div>

<script>
const CATALOG = __CATALOG__;
const BRAIN = __BRAIN__;
const IMG = __IMG__;
const im = p => IMG[p] || p;
const NAMES = {effortless:{warm:"The Easy Camel",cool:"The Off-Duty Minimalist",jewel:"The Low-Key Jewel",soft:"The Quiet Confidence"},bold:{warm:"The Warm Statement",cool:"The Sharp Monochrome",jewel:"The Modern Bold",soft:"The Soft Power"},classic:{warm:"The Polished Classic",cool:"The Clean Line",jewel:"The Deep Heirloom",soft:"The Gentle Tailor"},urban:{warm:"The Downtown Neutral",cool:"The City Uniform",jewel:"The Street Gem",soft:"The Soft Edge"}};
const READS = {effortless:{warm:"effortless and down to earth, in camel, cream and chocolate: the colours already go together, so most of the deciding is done before you open the closet.",cool:"effortless, in black, white and grey: you want getting dressed to be one decision, and the palette has already made it.",jewel:"effortless, in emerald, sapphire and wine: you let the colour do the talking so the outfit doesn't have to.",soft:"effortless, in blush, sage and powder blue: you'd rather be the calmest thing in the room than the loudest."},bold:{warm:"confident and bold, in camel, cream and chocolate: the colours stay quiet, so the shape and the scale do the announcing.",cool:"confident and bold, in black, white and grey: you want the line, not the colour, to be the loud part.",jewel:"confident and bold, in emerald, sapphire and wine: you dress to be noticed, and you picked the three colours that get noticed on their own.",soft:"confident and bold, in blush, sage and powder blue: quiet colours worn as if they're not, so the shape does the talking."},classic:{warm:"classic, in camel, cream and chocolate: you like a thing that was right before it was fashionable, and still is.",cool:"classic, in black, white and grey: a clean line and a colour that stays out of its way.",jewel:"classic, in emerald, sapphire and wine: shapes that never date, in colours with some weight to them.",soft:"classic, in blush, sage and powder blue: you want it done properly and you want it done gently."},urban:{warm:"cool girl, in camel, cream and chocolate: sharp city shapes in colours that take the edge off them, on purpose.",cool:"cool girl, in black, white and grey: a uniform, mostly black, that looks decided rather than default.",jewel:"cool girl, in emerald, sapphire and wine: one jewel colour worn like a sneaker, not a gown.",soft:"cool girl, in blush, sage and powder blue: sharp shapes in gentle colours, and the contrast is the point."}};
const FIRST = {"warm-fitted":["a chocolate crew neck knit, close to the body","a camel slim trouser, a pressed crease to the ankle","tan flat leather sandals, one wide strap"],"warm-relaxed":["a chocolate linen overshirt, worn open","a cream chunky knit, a deep v neck","a camel wide-leg trouser, pooling at the shoe"],"warm-structured":["a chocolate tailored blazer, one button","a cream ribbed knit top, tucked in","a camel straight trouser, a pressed crease to the floor"],"warm-flowy":["a camel and cream panelled midi dress, a deep v neck","a wide gathered sash at the waist, the skirt full below","tan flat sandals, a strap at the toe and the ankle"],"cool-fitted":["a white crew neck tee, close to the body","a black slim trouser, a pressed crease to the ankle","white low top sneakers"],"cool-relaxed":["a grey cardigan, worn open, a dropped shoulder","a white long-sleeve tee, loose, untucked","a black wide-leg trouser, hem on the shoe"],"cool-structured":["a grey tailored blazer, a wide lapel","a white shirt, collar open, tucked in","a black straight trouser, a pressed crease to the floor"],"cool-flowy":["a black and cream floral midi dress, a v neck","a gathered waist, the skirt full to mid calf","white low top sneakers"],"jewel-fitted":["a sapphire satin shirt, collar open, tucked in","an emerald slim trouser, a pressed crease to the ankle","a wine leather tote on the shoulder"],"jewel-relaxed":["a sapphire oversized shirt, sleeves pushed up","an emerald wide-leg trouser, hem to the floor","a soft wine leather bag, on a long strap"],"jewel-structured":["an emerald tailored blazer, worn open, a strong shoulder","a sapphire shirt, two buttons undone, tucked in","a black straight trouser, a pressed crease to the ankle"],"jewel-flowy":["a wine satin midi dress, a low v neck","a gathered waist, the skirt full below","black strappy sandals"],"soft-fitted":["a blush fitted knit, close to the body","a sage slim trouser, a pressed crease to the ankle","cream flat sandals"],"soft-relaxed":["a powder blue oversized shirt, worn open","a cream ribbed tank, loose at the hem","a sage wide-leg trouser, hem on the shoe"],"soft-structured":["a sage tailored blazer, one button","a cream shirt, collar open, tucked in","a blush straight trouser, a pressed crease to the floor"],"soft-flowy":["a blush and cream floral midi dress, a v neck","a gathered waist, the skirt full to mid calf","cream flat sandals"]};
const RULES = {wish:{"what actually goes with what i already own":["The three things you already own that go with nearly everything","and the one rule that connects the rest"],"what i should stop buying":["The one shape you keep bringing home that never gets worn","why it fails on you, and what to reach for instead"],"what my style even is at this point":["Your style, in three words","she takes them from the three things you wear most"],"how to make getting dressed less stressful":["How to get dressed in five minutes without thinking about it","one top shape, one bottom shape, and the rest stays on the hanger"]},missing:{"a few basics that would tie the rest together":["The three basics that would tie your closet together","named as shape, colour and fabric, so you know one when you see it"],"one statement piece i don't have the confidence to buy alone":["The one statement piece that is actually yours to wear","the shape, the colour, and the three things you already own that go with it"],"genuinely no idea, that's the point":["What your closet is missing, read from what you already wear most","it is usually one piece, and rarely the one you would guess"],"nothing. i just need help putting new looks together":["The three pairings in your closet you have never tried","she walks the first one with you on the call, piece by piece"]},fear:{"showing up underdressed":["The one thing that makes any outfit read as dressed","it is not the dress, and you probably own it"],"showing up overdressed":["How to dress down one notch without looking like you gave up","the fabric, not the shape, is what reads as too much"],"buying something i'll never wear again":["How to make this the outfit you keep wearing after","built around one piece you own, plus one shape worth finding"],"not feeling like myself in it":["How to dress up and still look like you","she starts from the thing you wear most, not from the invitation"]},palette:{warm:["Which of camel, cream and chocolate goes next to your face","and which one belongs below the waist"],cool:["The grey that makes your skin look clear, not tired","and how close to your face the black should sit"],jewel:["The one jewel tone that lights up your face","and where the other two go so they still get worn"],soft:["How to keep blush and sage from washing you out","one darker piece next to the face does it"]},silhouette:{fitted:["Where fitted should end so it reads as sleek, not tight","one hem and one sleeve, both an inch off where you have them"],relaxed:["How to wear relaxed clothes and still look put together","one thing fitted, and it is usually the shoe"],structured:["The jacket length that makes tailoring look like it was made for you","and the one shoulder seam to check first"],flowy:["How to wear flowy without losing your waist","one piece that holds a line, the rest can move"]},occasion:{"a wedding":["Your wedding look, built","and the two pieces that work after it"],"a night out":["The one shape for a night out that you never have to adjust","the hem, the neckline and the shoe it needs"],"a work thing":["How to look senior in a room full of suits, without wearing one","the neckline, the hem and the one colour that do it"],"a trip":["The six pieces that dress a whole trip from one bag","what to pack, what to leave"],"a date":["The one thing to wear on a date that still feels like you","one soft thing, one sharp thing"],"a birthday":["How to look like the guest of honour without dressing as one","one colour next to your face, one hem, the rest from what you own"]}};
const HELD = {"a wedding":["the rehearsal","the wedding","the morning after"],"a night out":["the pregame","the night","the day after"],"a work thing":["the meeting","the drinks after","the tuesday"],"a trip":["the flight","the dinner","the beach"],"a date":["the first drink","the dinner","the walk home"],"a birthday":["the dinner","the party","the brunch"]};
const S = {taste:{}, q:{}};
const PAL_FAMILY = {warm:'warm',cool:'cool',jewel:'jewel',soft:'soft',earth:'warm',bright:'jewel',black:'cool',denim:'cool'};
const PAL_NAME = {warm:'camel, cream and chocolate',cool:'black, white and grey',jewel:'emerald, sapphire and wine',soft:'blush, sage and powder blue',earth:'olive, rust and terracotta',bright:'red, cobalt and hot pink',black:'black on black',denim:'denim, white and tan'};
const $ = s => document.querySelector(s);
function show(id){document.querySelectorAll('.screen').forEach(e=>e.hidden = e.id!==id); window.scrollTo({top:0}); $('#step').textContent = ({'s-door':'your personal stylist','s-q':'her answers · 1 of 4','s-taste':'narrow it · 2 of 4','s-help':'what she needs · 3 of 4','s-results':'her read · 4 of 4','s-call':'the call','s-rack':'the rack','s-inspo':'inspo','s-file':'her file','s-looks':'her looks','s-files':'her files'})[id];}
$('#go-q').onclick = () => show('s-q');
$('#go-files').onclick = () => openFiles(); $('#to-files').onclick = () => openFiles(); $('#files-back').onclick = () => show('s-door'); $('#files-back-top').onclick = () => show('s-door');
$('#go-quick').onclick = () => { $('#go-skip').click(); S.quick = true; $('#msg').placeholder = 'what she needs, one line. we go straight to the rack.'; $('#chat').innerHTML = ''; bubble('her', 'her name and age, then one line on what she needs. no questions, straight to the pieces.'); };
$('#go-skip').onclick = () => { S.quick = false; S.skip = true; S.q = { fname: 'her', quiz: 'none', occasion: '', when: '', palette: '', silhouette: '', feel: '', hero: '', move: '', budget: '', help: [], piece: '', words: '', spend: '' }; S.likes = []; S.neck = []; S.len = ''; S.shoe = ''; S.name = 'not read yet'; S.read = 'no quiz on file, she skipped ahead.'; S.rules = []; show('s-call'); $('#chat').innerHTML = ''; $('#who').hidden = false; $('#who-age').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('#who-age').querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); S.q.age = b.dataset.v; $('#call-err').textContent = ''; }; bubble('her', "who is it for, then type what she needs in her own words. i'll ask the rest like a stylist would, and you can say run with it any time."); };
document.querySelector('.choices[data-q=quiz]').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const d = b.dataset.v==='the date'; $('#closet-fields').hidden = d; $('#date-fields').hidden = !d; }));
const DATE_NAMES = {classic:{effortless:"The Offhand Classic",polished:"The Sharp Guest",best:"The Finest Cut",comfortable:"The Lived-In Tailoring"},easy:{effortless:"The Light Touch",polished:"The Soft Polish",best:"The Good Day",comfortable:"The Unbothered"},bold:{effortless:"The Accidental Headline",polished:"The Set Piece",best:"The Big Entrancer",comfortable:"The Loud Comfort"},romantic:{effortless:"The Easy Elegance",polished:"The Composed Romantic",best:"The Full Bloom",comfortable:"The Soft Landing"}};
const DATE_READS = {classic:{effortless:"a proper cut, worn like you found it on the chair.",polished:"tailored lines, and nothing left to fix once you are through the door.",best:"tailoring, and you standing all the way up in it.",comfortable:"a tailored shape, worn until it stops asking anything of you."},easy:{effortless:"relaxed shapes that look like you never gave it a second thought.",polished:"relaxed, but each piece pressed and on purpose.",best:"easy shapes, worn on the day everything was already going your way.",comfortable:"comfort first, relaxed second, and the room can catch up."},bold:{effortless:"one statement piece, worn as if it happened to be nearest the door.",polished:"a statement, planned down to the last button, and meant to look it.",best:"a statement piece, and an entrance the whole room notices.",comfortable:"a statement, as long as you can sit down in it."},romantic:{effortless:"soft shapes that look like they fell into place on their own.",polished:"soft, feminine shapes, with every hem and edge finished.",best:"soft shapes, and you in them at the moment the room looks up.",comfortable:"soft, feminine shapes, and none you would be waiting to take off."}};
const FEEL_TEXT = {effortless:"effortless, like i didn't try",polished:"polished and pulled together",best:"like the best version of myself",comfortable:"comfortable first, always"};
$('#go-help').onclick = () => { if (!S.q.hero || !S.q.move) { $('#taste-err').textContent = 'the hero and the one thing to move, then next'; return; } if (!S.likes.length && !(S.likesLive && S.likesLive.length)) { $('#taste-err').textContent = 'tap at least one piece that\'s you'; return; } if (!S.neck.length) { $('#taste-err').textContent = 'pick a neckline, even a maybe'; return; } if (!S.len || !S.shoe) { $('#taste-err').textContent = 'length and feet, then she can build'; return; } show('s-help'); };
S.likes = []; S.neck = []; S.len = ''; S.shoe = '';
const PAL = {warm:/ivory|cream|camel|chocolate|natural|peyote|bone|brown|tan|gold|nuvola/i, cool:/black|white|grey|silver|platinum/i, jewel:/black|wine|emerald|sapphire|navy/i, soft:/blue|ivory|natural|print|floral|peyote/i, earth:/olive|rust|terracotta|chocolate|brown|tan|camel|khaki/i, bright:/red|cobalt|pink|fuchsia|cherry|blue|black/i, black:/black|onyx|noir/i, denim:/blue|white|ivory|denim|tan|natural|lanier|huron|ondine/i};
const OCC = {'a bachelorette': it => it.slot==='dress' || it.slot==='top' || /satin|lace|silk|linen/.test(it.tags.join()), 'a wedding': it => it.slot==='dress' || (it.slot==='top' && /silk|ruffle|lace/.test(it.tags.join())), 'a night out': it => it.slot==='dress' || /satin|lace|cami|knit/.test(it.tags.join()), 'a work thing': it => /trouser|blazer|cami|knit|cardigan|blouse|tee|tank/.test(it.tags.join()) || it.slot==='top', 'a trip': it => /denim|tank|tee|slip|mule|sneaker|bomber|cardigan/.test(it.tags.join()), 'a date': it => it.slot==='dress' || it.slot==='top' || /satin|denim/.test(it.tags.join()), 'a birthday': it => it.slot==='dress' || /satin|lace|silk/.test(it.tags.join())};
const NECK = it => { const n = (it.neckline||'').toLowerCase(); if (/strapless/.test(n)) return 'strapless'; if (/square/.test(n)) return 'square'; if (/scoop/.test(n)) return 'scoop'; if (/v-neck|v /.test(n)) return 'a low v'; if (/straight/.test(n)) return 'straight across'; if (/crew/.test(n)) return 'crew'; return null; };
function buildNarrow(){
  const occ = OCC[S.q.occasion] || (()=>true), pal = PAL[S.q.palette];
  let cands = CATALOG.filter(it => it.model_img && occ(it) && it.slot!=='shoe' && it.slot!=='bag' && it.slot!=='jewelry');
  let inPal = cands.filter(it => pal.test(it.color||''));
  if (inPal.length < 6) inPal = inPal.concat(cands.filter(it => !inPal.includes(it))).slice(0,8); else inPal = inPal.slice(0,8);
  $('#pick-grid').innerHTML = inPal.map(it => `<button type="button" data-id="${it.id}"><img alt="" src="${im('img/cat/'+it.model_img)}"><span>${it.brand} ${it.name}<br>${NECK(it)||''}${it.length&&it.length!=='na'?' · '+it.length:''}</span></button>`).join('');
  $('#pick-grid').querySelectorAll('button').forEach(b => b.onclick = () => { b.classList.toggle('on'); S.likes = [...$('#pick-grid').querySelectorAll('button.on')].map(x=>x.dataset.id); $('#taste-err').textContent=''; });
  const seen = {}; CATALOG.filter(it=>it.model_img && (it.slot==='dress'||it.slot==='top')).forEach(it => { const n = NECK(it); if (n && !seen[n]) seen[n] = it; });
  $('#neck-row').innerHTML = Object.entries(seen).map(([n,it]) => `<button type="button" data-v="${n}"><img alt="" src="${im('img/cat/'+it.model_img)}"><span>${n}</span></button>`).join('');
  $('#neck-row').querySelectorAll('button').forEach(b => b.onclick = () => { if (!b.classList.contains('on') && S.neck.length>=2) return; b.classList.toggle('on'); S.neck = [...$('#neck-row').querySelectorAll('button.on')].map(x=>x.dataset.v); $('#taste-err').textContent=''; });
  const lenPick = {mini: CATALOG.find(it=>it.length==='mini'&&it.model_img), midi: CATALOG.find(it=>it.length==='midi'&&it.model_img)};
  $('#len-row').innerHTML = Object.entries(lenPick).map(([l,it]) => `<button type="button" data-v="${l}"><img alt="" src="${im('img/cat/'+it.model_img)}" style="object-position:bottom"><span>${l}</span></button>`).join('') + `<button type="button" data-v="either"><span style="padding:40% 8px;text-align:center">either, she decides</span></button>`;
  $('#len-row').querySelectorAll('button').forEach(b => b.onclick = () => { $('#len-row').querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); S.len = b.dataset.v; $('#taste-err').textContent=''; });
  const shoePick = [['a heel', CATALOG.find(it=>it.id==='sm-hana-block-sandal')],['a flat', CATALOG.find(it=>it.id==='sm-rafe-suede-mule')],['a sneaker', CATALOG.find(it=>it.id==='sm-jaxson-black')]];
  $('#shoe-row').innerHTML = shoePick.map(([l,it]) => `<button type="button" data-v="${l}"><img alt="" src="${im('img/cat/'+(it.flat_img||it.model_img))}" style="object-fit:contain;background:#fff"><span>${l}</span></button>`).join('');
  $('#shoe-row').querySelectorAll('button').forEach(b => b.onclick = () => { $('#shoe-row').querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); S.shoe = b.dataset.v; $('#taste-err').textContent=''; });
}
document.querySelectorAll('.choices').forEach(c => c.querySelectorAll('button').forEach(b => b.onclick = () => {
  if (c.classList.contains('multi')) { b.classList.toggle('on'); S.q[c.dataset.q] = [...c.querySelectorAll('button.on')].map(x=>x.dataset.v); $('#help-err').textContent=''; return; }
  c.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); S.q[c.dataset.q] = b.dataset.v; $('#q-err').textContent=''; }));
$('#go-taste').onclick = () => {
  const q = S.q; const isDate = q.quiz==='the date';
  const need = isDate ? ['quiz','fear','look','feelkey','matters','occasion','when','palette'] : ['quiz','wish','style','prints','silhouette','missing','shape','occasion','when','palette'];
  const LBL = {quiz:'which quiz she took', wish:'the wish', style:'her style', prints:'prints', silhouette:'how clothes sit', missing:'what her closet is missing', shape:'shape', occasion:'what is coming up', when:'when', palette:'her palette', fear:'her fear', look:'the look', feelkey:'how she wants to feel', matters:'what matters'};
  const miss = need.filter(k=>!q[k]);
  if (miss.length) { $('#q-err').textContent = 'still needs a tap on: ' + miss.map(k=>LBL[k]||k).join(', '); const first = document.querySelector(`.choices[data-q="${miss[0]}"]`); if (first) { first.scrollIntoView({behavior:'smooth', block:'center'}); first.style.outline = '2px solid var(--lipstick)'; first.style.outlineOffset = '6px'; first.style.borderRadius = '12px'; setTimeout(()=>{ first.style.outline=''; }, 2500); } return; }
  q.words = $('#words').value.trim(); q.fname = $('#fname').value.trim() || 'her'; q.spend = $('#spend').value.trim(); q.size = $('#qsize').value.trim(); q.brands = $('#qbrands').value.trim();
  if (isDate) { q.silhouette = {classic:'structured',easy:'relaxed',bold:'fitted',romantic:'flowy'}[q.look]; q.feel = FEEL_TEXT[q.feelkey]; }
  else { q.fear = {"what actually goes with what i already own":"not feeling like myself in it","what i should stop buying":"buying something i'll never wear again","what my style even is at this point":"not feeling like myself in it","how to make getting dressed less stressful":"showing up underdressed"}[q.wish]; q.feel = {effortless:"effortless, like i didn't try",bold:"like the best version of myself",classic:"polished and pulled together",urban:"effortless, like i didn't try"}[q.style]; }
  q.pal4 = PAL_FAMILY[q.palette] || 'warm'; const pal = PAL_NAME[q.palette];
  $('#taste-intro').textContent = `${q.fname}'s answers: ${q.occasion}, ${q.when}, in ${pal}, ${q.silhouette}. these are the pieces that fit that. narrow it with her on the line.`;
  try { buildNarrow(); } catch (e) { $('#q-err').textContent = 'could not build the narrow step: ' + (e && e.message || e); return; }
  show('s-taste'); if (typeof narrowLive === 'function') narrowLive().catch(() => {});
};
function styleFromTaste(){ const q = S.q; if (/^hot/.test(q.feel)) return 'bold'; if (q.silhouette==='structured' || /polished/.test(q.feel)) return 'classic'; if (q.silhouette==='relaxed') return 'urban'; return 'effortless'; }
$('#go-results').onclick = () => {
  if (!S.q.help || !S.q.help.length) { $('#help-err').textContent = 'tap at least one so she knows where to start'; return; } if (!S.q.budget) { $('#help-err').textContent = 'what she\'d spend, even roughly'; return; }
  S.q.piece = $('#piece').value.trim();
  if (S.q.quiz==='the date') { S.style = {classic:'classic',easy:'effortless',bold:'bold',romantic:'effortless'}[S.q.look]; S.name = DATE_NAMES[S.q.look][S.q.feelkey]; S.read = DATE_READS[S.q.look][S.q.feelkey]; }
  else { S.style = S.q.style; S.name = NAMES[S.style][S.q.pal4]; S.read = READS[S.style][S.q.pal4]; }
  if (S.q.pal4 !== S.q.palette) S.read = S.read.replace(/in [^:]+:/, 'in ' + PAL_NAME[S.q.palette] + ':');
  $('#pname').textContent = S.name; $('#pread').textContent = S.read + ' two of her taps, in one sentence.';
  const key = S.q.pal4 + '-' + S.q.silhouette; $('#firstimg').src = im('img/looks/' + key + '.webp'); $('#firstpieces').innerHTML = (FIRST[key]||[]).map(p=>'<li>'+p+'</li>').join('');
  $('#heldtitles').innerHTML = (HELD[S.q.occasion]||['the first','the second','the third']).map(h=>'<div>'+h+'</div>').join('');
  S.rules = S.q.quiz==='the date' ? [RULES.occasion[S.q.occasion], RULES.fear[S.q.fear], RULES.palette[S.q.pal4], RULES.silhouette[S.q.silhouette]] : [RULES.wish[S.q.wish], RULES.palette[S.q.pal4], RULES.silhouette[S.q.silhouette], RULES.missing[S.q.missing]];
  $('#rules').innerHTML = S.rules.map(r=>'<div class="rule"><b>'+r[0]+'<span class="sealed">sealed</span></b><span>'+r[1]+'</span></div>').join('');
  show('s-results'); try { if (typeof saveClient === 'function') saveClient(); } catch (e) {}
};
/* ---------- the call ---------- */
let sampleFn = null, turns = [], ctl = null, LOOKS = null;
claude.use && claude.use('sample').then(s => { sampleFn = s; });
const catalogLines = CATALOG.map(c => `${c.id} | ${c.slot} | ${c.brand} ${c.name} | ${c.color||''} | $${c.price} | ${c.length||''} ${c.neckline||''} | ${(c.tags||[]).join(',')}`).join('\n');
function rulesTurn(){
  const q = S.q;
  if (S.skip) return `You are her stylist at "in the bag": a young, warm, direct personal stylist who talks like her most stylish friend, in lowercase, short sentences, no emoji, no dashes, no exclamation marks. Your method, in full, is the playbook below; follow it.\n\n${BRAIN}\n\n${S.memory ? 'HER FILE FROM EARLIER CALLS (use it; do not re-ask what it answers; build on what she wore and what the stylist corrected): ' + S.memory + '\n' : 'There is NO quiz on file: she skipped ahead and is typing what she needs.'}${S.feedbackMemory ? 'STYLIST FEEDBACK ON PAST OUTPUTS (the human stylists graded earlier looks; fix these patterns): ' + S.feedbackMemory + '\n' : ''} Her name: ${q.fname}. Age range: ${q.age || 'ask'} (store tier: ${typeof tierFor === 'function' ? tierFor(q.age) : 'mid'}; search that tier first and never send a woman over 30 to the young stores unless she named them). Size: ${q.size || 'ask if you need stock'}. Stores she shops: ${q.brands || 'ask'}. Use her name. What you know comes only from the conversation. Ask like a stylist would, ONE question per message, each with 2 to 4 tappable options, in this order, skipping anything she already answered: what is coming up, where exactly and when; which side of it she is on (the bride, a guest, the host, the honoree) whenever the occasion has a convention, because it flips the colour rule (a bride at her bachelorette wears white only; a guest never wears white); the dress code and who will be there; her age range if unknown; a this or that with pictures (two or three garment directions, e.g. the slip vs the column vs the corset); her palette (name the colours, eight families: warm neutrals, cool neutrals, jewel tones, soft tones, earth, brights, all black, denim and white); how she likes clothes to sit and where she likes skin (leg, back, shoulder, waist, low cut); her hero, what people notice first; the brands she buys and one she wishes she could; a style icon whose clothes she loves, as names only, never a picture of a person; budget; what she already owns for it (shoes, a layer); what she needs help with (hair, makeup, the shoe, the layer). Up to eight questions. From the second question on, always include "run with it" as the last option; when she says run with it, stop asking, infer the rest from what you have, and build. You have live tools: search_stores (fast; up to 16 stores picked by her age tier, with prices and photos; pass tier young, mid or classic to steer it), search_web (google via firecrawl; use it for brands she named and for anything the stores lack, e.g. site:zara.com or site:revolve.com) and read_page. When you have enough, SOURCE LIKE A STYLIST, never guess on one dress: run four to six searches before you choose. For the hero piece run three phrasings built from the rules (the formula, the neckline she likes, the colour by its name, the fabric, e.g. "wine satin cowl slip midi", "burgundy one shoulder midi dress", "oxblood corset midi"), then one search each for the shoe, the jewelry, the bag or layer. Compare at least six real candidates for the hero. THEN, before any looks, show the human stylist the rack: reply with "rack", 6 to 9 real pieces you found (every hero candidate worth a look, plus the shoe, jewelry, bag or layer options), each with its slot, one short why, drawn from at least three different stores (run search_stores with two tiers and search_web for a brand she named), and pick true on the ones you would use; "looks" stays null and "say" is one line like "here is the rack". The stylist ticks what is her and sends the picks back; ONLY THEN deliver two complete looks and one held look from those pieces, with the runners up in "alts". Look one solves exactly what she asked. Look two is a second answer to the same brief, not a variation: a different silhouette or a different colour from her palette, same rules, same hero, and it shares at most one piece with look one. Each look: 3 to 5 items across slots, one hero, everything else quiet. The OCCASION CONVENTIONS in the playbook rule every piece (a bride at her bachelorette is white or ivory only in every look, guests never in white at a wedding or bachelorette); if her palette answer conflicts with the convention, the convention wins and you say so in one line. Every item you deliver MUST carry a real price and an image url; if a search result lacks either, call read_page on it before using it, and if it still lacks them pick another piece. Every item must be a garment, shoe, bag or jewelry that belongs to the look; no trousers in a dress look unless she asked. Prefer pieces whose product photography is clean and editorial (a plain studio or white background, a clear flat shot); when two pieces are equally right, take the one that photographs like a magazine, and skip anything whose picture looks cheap, busy or watermarked. Look two is a second answer to the same brief, not a variation of look one: a different silhouette or a different colour from her palette, same rules, same hero, sharing at most one piece with look one, so she has a real choice. Respect the neckline and hero she chose in every look.  Prices in USD.\n\nBuilt-in catalog, the fallback (id | slot | piece | colour | price | length neckline | tags):\n${catalogLines}\n\nYou are writing the words the human stylist will SAY to her on the phone, and the human types back what she answered. Reply with ONLY a JSON object, never a status update or a summary in prose (if you are mid way, still reply as JSON with "say" and "options"), no code fences, no line breaks inside strings, and keep the whole reply under 3500 characters (when delivering looks: "why" is one sentence, each finish field under 12 words, at most 4 items per look, no description fields): {"say": string (the next thing to say, 1 to 4 short sentences, lowercase, second person), "options": string[] (0 to 4 short tappable replies, empty when you deliver looks), "pictures": optional, for a this or that question only: [2 to 4 of {"label": the tappable answer, "search": an image search phrase for that garment direction, e.g. "wine satin slip dress editorial"}], garments only, never a person, "rack": null or [6 to 9 of {"slot": dress|top|bottom|shoe|jewelry|bag|layer, "why": under 10 words, "pick": boolean, "item": {"name","brand","url","price","image","color"} copied exactly from the tool result}] (the rack reply has looks null and is under 3500 characters), "looks": null or [{"title": string, "items": [each item either a catalog id string, or for a live piece an object {"name","brand","retailer","url","price","image","color"} copied exactly from the tool result], "why": string, "hair": string, "makeup": string, "shoe_note": string, "layer": string, "night_before": string, "tips": [3 short lines naming the rule each choice runs on, e.g. "one hero: the lace panels. everything else quiet"], "alts": [up to 3 runner up pieces for the hero, same live object shape]}, {second look}], "held": null or {"title": string, "items": [same item shapes], "why": string}, "done": boolean (true only when looks are delivered), "palette": one of warm, cool, jewel, soft, earth, bright, black, denim once you know it (warm = camel cream chocolate; cool = black white grey; jewel = emerald sapphire wine; soft = blush sage powder blue; earth = olive rust terracotta; bright = red cobalt hot pink; black = all black; denim = denim white tan), "occasion": a short phrase for the event only, e.g. "bachelorette weekend in nashville" (never her role or the date in it), "headline": when delivering looks, one cute lowercase line for the top of her page, under 12 words, her name first, warm and specific to the event (e.g. "hanna, the farm wedding is handled. two looks, one in your back pocket."), "setting": when delivering looks, one short lowercase line for the board caption naming the place, the dress code and the month (e.g. "traders point farm, indiana · black tie optional · october"), "mood": when delivering looks, 4 short image search phrases for a high fashion mood board, no two alike: 1) the setting as a magazine would shoot it (e.g. "indiana farm wedding at dusk vogue"), 2) a fabric or texture close up in her palette (e.g. "oxblood silk satin drape close up"), 3) the beauty reference (e.g. "slick low bun editorial"), 4) a campaign or runway feeling that matches the look (e.g. "black tie optional autumn wedding guest campaign"); never a person's name, never stock photo words}`;
  return `You are her stylist at "in the bag": a young, warm, direct personal stylist who talks like her most stylish friend, in lowercase, short sentences, no emoji, no dashes, no exclamation marks. You dress people for a living. Your method, in full, is the playbook below; follow it.

${BRAIN}
 You are on a fifteen minute call with her right now. There is nothing to sell; the looks are free.

Her name: ${q.fname}. Quiz: ${q.quiz}. Profile: ${S.name}. Read: ${S.read} ${q.quiz==='the closet' ? `Wish: ${q.wish}. Style: ${q.style}. Prints: ${q.prints}. Where it needs help: ${(q.helpareas||[]).join(', ')||'not said'}. Closet missing: ${q.missing}. Shape (garment language only): ${q.shape}.` : `Fear: ${q.fear}. Look: ${q.look}. What matters: ${q.matters}.`} Monthly outfit spend, if asked: ${q.spend||'not yet'}. From the pieces that fit her answers, she tapped these as her (prefer them and things like them; live ones carry a link, catalog ones an id): ${[...(S.likesLive || []).map(x => `${x.brand} ${x.name} $${x.price} ${x.url}`), ...S.likes].join('; ') || 'none'}. Age range: ${q.age || 'not said'} (store tier: ${typeof tierFor === 'function' ? tierFor(q.age) : 'mid'}; search that tier first and never send a woman over 30 to the young stores unless she named them). Size: ${q.size || 'not said'}. Stores she shops: ${q.brands || 'not said'}. Necklines she likes: ${S.neck.join(' and ') || 'not said'}. Length: ${S.len}. On her feet: ${S.shoe}. Coming up: ${q.occasion}, ${q.when}. Palette: ${PAL_NAME[q.palette] || q.palette}. Silhouette: ${q.silhouette}. Wants to feel: ${q.feel}. What people should notice first, her hero: ${q.hero}; look one is built so that reads first and everything else is quiet. The one thing she will move this time: ${q.move}; look two leans into that and is a different answer to the same brief, sharing at most one piece with look one. Budget: ${q.budget}. What she needs help with (she tapped these): ${(q.help||[]).join('; ')}. The piece she named: ${q.piece || '(none)'}. In her words: ${q.words || '(left blank)'}.
${S.memory ? 'HER FILE FROM EARLIER CALLS (use it; do not re-ask what it answers): ' + S.memory + '\n' : ''}${S.feedbackMemory ? 'STYLIST FEEDBACK ON PAST OUTPUTS (the human stylists graded earlier looks; fix these patterns): ' + S.feedbackMemory + '\n' : ''}Her four sealed rules, which you open on this call in your own words, one at a time when relevant: 1) ${S.rules[0][0]}: ${S.rules[0][1]}. 2) ${S.rules[1][0]}: ${S.rules[1][1]}. 3) ${S.rules[2][0]}: ${S.rules[2][1]}. 4) ${S.rules[3][0]}: ${S.rules[3][1]}.

How the call goes. First message: one or two lines, use her first name, and go straight to what is coming up (${q.occasion}, ${q.when}) and what she said she needs help with. Do not recite her profile or the read; those are for the stylist's eyes. Ask the single most useful question about the occasion itself: for a wedding or a bachelorette, which side she is on (bride, guest, host) and the dress code, because that flips the colour rule; for a wedding, the venue and the time of day; for a night out, where and who; for work, the room she walks into; for a trip, the climate and the days. If she named a piece, start from that piece. Then ask at most three more questions, ONE per message, each with 2 to 4 tappable options so she never has to generate an answer. Good questions: what she wears most and what she bought and never wears; the brands she buys and the ones she wishes she could; her style icon; hot how (leg, back, shoulder, waist); the colour she gets complimented in; heel height. Open a sealed rule in plain words whenever it answers something she said. Never comment on her body; describe what a garment does. You have live tools: search_stores (fast; up to 16 stores picked by her age tier, with prices and photos; pass tier young, mid or classic), search_web (google via firecrawl; for brands she named, e.g. site:zara.com) and read_page. When you have enough (after 3 to 5 exchanges), SOURCE LIKE A STYLIST, never guess on one dress: run four to six searches before you choose, three phrasings for the hero built from the rules (formula, neckline, colour by name, fabric), then one each for the shoe, the jewelry, the bag or layer. Compare at least six real candidates for the hero. THEN, before any looks, show the human stylist the rack: reply with "rack", 6 to 9 real pieces you found (hero candidates plus shoe, jewelry, bag or layer options), each with slot, one short why, drawn from at least three different stores (run search_stores with two tiers and search_web for a brand she named), and pick true on the ones you would use; "looks" stays null and "say" is one line like "here is the rack". The stylist ticks what is her and sends the picks back; ONLY THEN deliver two complete looks and one held look from those pieces, runners up in "alts", and only fall back to the built-in catalog ids below when the stores have nothing right. Then deliver two complete looks and one held look, respecting her hates (a "hell no" direction never appears), her palette, her budget, and one shape she loves. Look one solves exactly what she asked for help with (build around her piece if she named one, and say so in the layer or why field); look two moves one thing ten percent along what she loved. If she only wants the finish, the looks are still complete but the why explains the finish. Each look: 3 to 5 items across slots, one hero, everything else quiet. The OCCASION CONVENTIONS in the playbook rule every piece (a bride at her bachelorette is white or ivory only in every look, guests never in white at a wedding or bachelorette); if her palette answer conflicts with the convention, the convention wins and you say so in one line. Every item you deliver MUST carry a real price and an image url; if a search result lacks either, call read_page on it before using it, and if it still lacks them pick another piece. Every item must be a garment, shoe, bag or jewelry that belongs to the look; no trousers in a dress look unless she asked. Prefer pieces whose product photography is clean and editorial (a plain studio or white background, a clear flat shot); when two pieces are equally right, take the one that photographs like a magazine, and skip anything whose picture looks cheap, busy or watermarked. Look two is a second answer to the same brief, not a variation of look one: a different silhouette or a different colour from her palette, same rules, same hero, sharing at most one piece with look one, so she has a real choice. Respect the neckline and hero she chose in every look. 

Built-in catalog, the fallback (id | slot | piece | colour | price | length neckline | tags):
${catalogLines}

You are writing the words the human stylist will SAY to her on the phone, and the human types back what she answered. Reply with ONLY a JSON object, never a status update or a summary in prose (if you are mid way, still reply as JSON with "say" and "options"), no code fences, no line breaks inside strings, and keep the whole reply under 3500 characters (when delivering looks: "why" is one sentence, each finish field under 12 words, at most 4 items per look, no description fields): {"say": string (the next thing to say to her, 1 to 4 short sentences, lowercase, second person), "options": string[] (0 to 4 short tappable replies, empty when you deliver looks), "pictures": optional, for a this or that question only: [2 to 4 of {"label": the tappable answer, "search": an image search phrase for that garment direction, e.g. "wine satin slip dress editorial"}], garments only, never a person, "rack": null or [6 to 9 of {"slot": dress|top|bottom|shoe|jewelry|bag|layer, "why": under 10 words, "pick": boolean, "item": {"name","brand","url","price","image","color"} copied exactly from the tool result}] (the rack reply has looks null and is under 3500 characters), "looks": null or [{"title": string (3 words, like a name), "items": [each item either a catalog id string, or for a live piece an object {"name","brand","retailer","url","price","image","color"} copied exactly from the tool result], "why": string (2 sentences, the rule it runs on), "hair": string, "makeup": string, "shoe_note": string, "layer": string (from her closet if she named one), "night_before": string, "tips": [3 short lines naming the rule each choice runs on, e.g. "one hero: the lace panels. everything else quiet"], "alts": [up to 3 runner up pieces for the hero, same live object shape]}, {second look}], "held": null or {"title": string, "items": [same item shapes], "why": string}, "done": boolean (true only when looks are delivered), "headline": when delivering looks, one cute lowercase line for the top of her page, under 12 words, her name first, warm and specific to the event (e.g. "hanna, the farm wedding is handled. two looks, one in your back pocket."), "setting": when delivering looks, one short lowercase line for the board caption naming the place, the dress code and the month (e.g. "traders point farm, indiana · black tie optional · october"), "mood": when delivering looks, 4 short image search phrases for a high fashion mood board, no two alike: 1) the setting as a magazine would shoot it (e.g. "indiana farm wedding at dusk vogue"), 2) a fabric or texture close up in her palette (e.g. "oxblood silk satin drape close up"), 3) the beauty reference (e.g. "slick low bun editorial"), 4) a campaign or runway feeling that matches the look (e.g. "black tie optional autumn wedding guest campaign"); never a person's name, never stock photo words}.`;
}
function bubble(cls, text){ const d = document.createElement('div'); d.className = 'b ' + cls; d.textContent = text; $('#chat').appendChild(d); d.scrollIntoView({block:'end'}); return d; }
function chips(opts){ $('#chips').innerHTML = ''; (opts||[]).forEach(o => { const b = document.createElement('button'); b.type='button'; b.textContent = o; b.onclick = () => send(o); $('#chips').appendChild(b); }); }
async function ask(){
  if (!sampleFn) { $('#call-err').textContent = "she can't pick up in this preview. open the page in the claude app to take the call."; return; }
  const th = bubble('her think', 'she\'s thinking…'); chips([]); $('#call-err').textContent = '';
  ctl = new AbortController();
  try {
    const r = await sampleFn.json([{role:'user', content: rulesTurn()}, ...turns], {cache:false, signal: ctl.signal, modelTier:'default'});
    th.remove();
    const say = String(r.say || '').trim(); if (say) bubble('her', say);
    turns.push({role:'assistant', content: JSON.stringify(r)});
    if (r.done && Array.isArray(r.looks) && r.looks.length) { LOOKS = r; setTimeout(renderLooks, 900); } else chips(r.options);
  } catch (e) {
    th.remove();
    const copy = {not_granted:"she needs your ok to use claude for this call. reload and allow it.", rate_limited:"give her a second and try again.", invalid_json:"she stumbled. say that again?", refused:"she can't answer that one. try another way.", cancelled:""}[e.code] || "the line dropped. say that again?";
    $('#call-err').textContent = copy;
  }
}
function send(text){ if (!text) return; const who = $('#who'); if (who && !who.hidden) { const nm = $('#who-name').value.trim(); if (S.quick && nm && !S.q.age) S.q.age = '25 to 34'; if (!nm || !S.q.age) { $('#call-err').textContent = 'her name and her age range first.'; return; } if (S.quick && !/run with it/i.test(text)) text = text.trim() + ' run with it.'; S.q.fname = nm; S.q.phone = $('#who-phone').value.trim(); S.q.size = $('#who-size').value.trim(); S.q.brands = $('#who-brands').value.trim(); who.hidden = true; $('#call-err').textContent = ''; text = `(for ${nm}, ${S.q.age}${S.q.size ? ', size ' + S.q.size : ''}${S.q.brands ? ', shops at ' + S.q.brands : ''}) ` + text; } bubble('me', text); turns.push({role:'user', content:text}); $('#msg').value=''; if (/run with it/i.test(text) && !LOOKS && typeof rackWaiting === 'function') rackWaiting(); ask(); }
$('#compose').onsubmit = e => { e.preventDefault(); send($('#msg').value.trim()); };
$('#go-call').onclick = () => { show('s-call'); if (!turns.length) { turns.push({role:'user', content:'(she picked up. open the call.)'}); ask(); } };
$('#back-chat').onclick = () => show('s-call');
/* ---------- looks ---------- */
const byId = id => CATALOG.find(c => c.id === id);
const PALDOTS = {warm:['#efe6d6','#c69c6d','#4a2c1c','#6b1f2b','#131110'],cool:['#ffffff','#9a9a9a','#131110','#6b1f2b','#4a5a7a'],jewel:['#efe6d6','#0f6e56','#1f3a8a','#6b1f2b','#131110'],soft:['#f4c0d1','#b7c4a5','#b5d4f4','#4a2c1c','#131110'],earth:['#efe6d6','#6b6b3a','#b5532a','#c9744e','#4a2c1c'],bright:['#efe6d6','#e8112d','#1f4fd8','#e0409c','#131110'],black:['#131110','#2a2624','#4a4441','#7a736e','#efe6d6'],denim:['#ffffff','#9db4d6','#3b5b8a','#c8a67a','#131110']};
function renderLooks(){
  const looks = LOOKS.looks.map(l => ({...l, items: (l.items||[]).map(byId).filter(Boolean)}));
  const held = LOOKS.held ? {...LOOKS.held, items:(LOOKS.held.items||[]).map(byId).filter(Boolean)} : null;
  $('#lookhead').innerHTML = (S.q.fname||'her') + ', ' + S.name.replace('The ','the ') + ', for ' + S.q.occasion + '. <em>two looks,</em> one held.';
  $('#looknote').textContent = looks[0]?.why || '';
  const all = [...looks[0].items, ...(looks[1]?.items||[])];
  const heroPhoto = all.find(it => it.model_img && (it.slot==='dress' || it.slot==='top')) || all.find(it=>it.model_img);
  const cuts = all.filter(it => it !== heroPhoto && (it.cut_img || it.model_img)).slice(0,6);
  const pos = [[34,3,24,58],[56,2,20,50],[74,8,20,40],[36,58,20,38],[58,52,22,44],[78,54,18,40]];
  let b = '<div class="dots">' + PALDOTS[S.q.palette].map(c=>'<i style="background:'+c+';border:1px solid var(--hairline)"></i>').join('') + '</div>';
  if (heroPhoto) b += `<div class="photo" style="left:9%;top:5%;width:24%;height:62%"><img alt="" src="${im('img/cat/'+heroPhoto.model_img)}"></div>`;
  cuts.forEach((it,i) => { const p = pos[i]; const rot = [-4,3,-2,5,-3,2][i]; if (it.cut_img) b += `<div class="cut" style="left:${p[0]}%;top:${p[1]}%;width:${p[2]}%;height:${p[3]}%;transform:rotate(${rot}deg)"><img alt="" src="${im('img/cat/'+it.cut_img)}"></div>`; else b += `<div class="photo" style="left:${p[0]}%;top:${p[1]}%;width:${p[2]*0.8}%;height:${p[3]*0.8}%;transform:rotate(${rot}deg)"><img alt="" src="${im('img/cat/'+it.model_img)}"></div>`; });
  const money = all.slice().sort((a,b)=>b.price-a.price).slice(0,2);
  money.forEach((it,i) => { const src = it.cut_img||it.flat_img||it.model_img; b += `<div class="card" style="left:${i?82:12}%;top:${i?74:72}%"><img alt="" src="${im('img/cat/'+src)}">${it.brand}<b>$${it.price}</b></div>`; });
  b += `<div class="line" style="left:10%;top:88%;max-width:60%">${looks[0].title}</div>`;
  $('#board').innerHTML = b;
  const card = (l, i) => `<div class="look"><p class="eyebrow">look ${i} · ${i===1 ? S.q.occasion : 'one step further'}</p><h2>${l.title}</h2><p class="lead">${l.why||''}</p>` +
    l.items.map(it => `<div class="piece"><img alt="" src="${im('img/cat/'+(it.model_img||it.flat_img||''))}"><div class="n">${it.brand} ${it.name}</div><div class="p">$${it.price}</div><p class="w">${it.color||''}${it.sizes?' · '+it.sizes:''}${it.notes?' · '+it.notes:''}</p><a href="${it.url}">open at ${it.retailer}</a></div>`).join('') +
    `<dl class="finish"><dt>hair</dt><dd>${l.hair||''}</dd><dt>makeup</dt><dd>${l.makeup||''}</dd><dt>shoe</dt><dd>${l.shoe_note||''}</dd><dt>layer</dt><dd>${l.layer||''}</dd><dt>night before</dt><dd>${l.night_before||''}</dd></dl>` +
    `<div class="total"><span>this look</span><span>$${l.items.reduce((s,x)=>s+(+x.price||0),0).toFixed(2)}</span></div></div>`;
  $('#lookcards').innerHTML = looks.map((l,i)=>card(l,i+1)).join('');
  $('#show-held').hidden = !held;
  $('#show-held').onclick = () => { $('#lookcards').insertAdjacentHTML('beforeend', `<div class="look"><p class="eyebrow">held · the third look</p><h2>${held.title}</h2><p class="lead">${held.why||''}</p>` + held.items.map(it=>`<div class="piece"><img alt="" src="${im('img/cat/'+(it.model_img||it.flat_img||''))}"><div class="n">${it.brand} ${it.name}</div><div class="p">$${it.price}</div><p class="w">${it.color||''}</p><a href="${it.url}">open at ${it.retailer}</a></div>`).join('') + '</div>'); $('#show-held').hidden = true; };
  show('s-looks');
}
</script>
'''
def duri(path):
    ext=path.rsplit('.',1)[1]; mime={'jpg':'image/jpeg','webp':'image/webp','png':'image/png'}[ext]
    return 'data:'+mime+';base64,'+base64.b64encode(open(path,'rb').read()).decode()
IMG={}
for d in ('looks','cat'):
    for f in sorted(os.listdir(os.path.join(ROOT,'app/img',d))):
        IMG[f'img/{d}/{f}']=duri(os.path.join(ROOT,'app/img',d,f))
html = re.sub(r'src="(img/taste/[^"]+)"', lambda m: 'src="'+duri(os.path.join(ROOT,'app',m.group(1)))+'"', html)
html = html.replace('__CATALOG__', json.dumps(slim, ensure_ascii=False)).replace('__IMG__', json.dumps(IMG)).replace('__BRAIN__', json.dumps(open(os.path.join(ROOT,'brain.txt')).read()))
html = html.rstrip() + '\n<script>\n' + open(os.path.join(ROOT,'live.js')).read() + '\n</script>\n<script>\n' + open(os.path.join(ROOT,'board.js')).read() + '\n</script>\n<script>\n' + open(os.path.join(ROOT,'send.js')).read() + '\n</script>\n<script>\n' + open(os.path.join(ROOT,'files.js')).read() + '\n</script>\n<script>\n' + open(os.path.join(ROOT,'inspo.js')).read() + '\n</script>\n'
open(os.path.join(ROOT, 'app/index.html'), 'w').write(html)
files = {}
for d in ('looks', 'taste', 'cat'):
    for f in sorted(os.listdir(os.path.join(ROOT, 'app/img', d))):
        files[f'img/{d}/{f}'] = f'app/img/{d}/{f}'
json.dump(files, open(os.path.join(ROOT, 'app/files.json'), 'w'), indent=0)
print('html KB', len(html)//1024, 'files', len(files), 'catalog', len(slim))
