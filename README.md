# in the bag: the NOCI stylist app

The tool our stylists use after the quiz: run the call, find real pieces, build two looks and one held, send them, keep her profile. This folder is the whole source. Anyone on the team can open it, change it, rebuild it and publish their own copy.

Live copy (Hanna's): https://claude.ai/artifact/QoU3KrgAKp4RpXJEWcriP8
Team front door: https://claude.ai/code/artifact/e8b56509-a3a3-4354-af9e-fa10f363a681

## The fastest way to work on it

Open this folder in Claude Code and say what you want changed. Claude reads this README, edits the right file, rebuilds, and publishes. You do not need to write code.

```bash
cd ~/Documents/NOCI_Stylist_App
claude
```

Good first asks: "add a field for her height on the who form", "make the rack show sizes in stock", "add her closet to the profile page".

## What is in here

| File | What it holds |
| --- | --- |
| `build_app.py` | The page itself (every screen, all the styling) and the stylist's instructions to the brain. Running it writes `app/index.html`, one self-contained page. |
| `brain.txt` | The styling playbook the brain follows: house rules, occasion rules, formulas, colour, fit, trends, stylist methods. Edit this to change how it styles. |
| `live.js` | The call, the live store search, product photos, the rack hand-off, the looks page. |
| `board.js` | The collage, its editing tools, the rack screen, mood boards, brands-first narrowing. |
| `send.js` | Everything under "send it to her": text, email, board picture, her page, PDF, bits and pieces. |
| `files.js` | Her files: profiles, corrections, follow-up, stylist feedback, what we have styled. |
| `inspo.js` | This week's looks and what's trending, both built from the fashion press, plus "text her this". |
| `catalog.json`, `imgs/`, `app/img/` | The small built-in catalog and its photos, used only as a fallback when live search finds nothing. |

## Build it

```bash
python3 build_app.py
```

That writes `app/index.html` (about 6 MB, images are inlined on purpose; the published page cannot load outside files).

## Publish it

From Claude Code, ask: "publish app/index.html as an artifact". To update your own copy later, ask Claude to republish to the same link.

A published copy needs these capabilities, exactly:

```json
{"sample": {}, "downloads": true, "db": {},
 "mcp": {"servers": [
   {"server": "Firecrawl", "tools": ["firecrawl_search", "firecrawl_scrape"]},
   {"server": "Composio", "tools": ["COMPOSIO_REMOTE_BASH_TOOL"]},
   {"server": "Apify", "tools": ["apify--rag-web-browser", "get-dataset-items"]}]}}
```

Two things follow from that:

- Only the person who published a copy can update that copy. A teammate publishes their own copy from this folder. **Each copy has its own profiles**, so agree on one live copy for real clients and treat the others as sandboxes.
- A copy that keeps profiles and uses connectors can only be opened by people in the same Claude workspace. It cannot be made public.

Whoever opens the app needs Firecrawl and Composio connected on their own Claude account.

## Rules that were learned the hard way

- Never use `prompt()`, `alert()` or `confirm()`. The published page blocks them silently and the button looks dead. Use `askInline()` and `showText()` in `live.js`.
- Never write a literal `</script>` inside a JavaScript string in these files. Write `</scr${''}ipt>`.
- The photo fetcher returns one image per call because the sandbox cuts off any reply over about 50 KB.
- Shopify rate-limits the sandbox after bursts. `storeSearch()` falls back to Firecrawl per store. Do not run bulk tests against store sites.
- No cutouts on the board. Use the store's own product shot, contained on white.
- Keep the brain's replies short. Long replies come back cut off; `salvageJSON()` repairs what it can.
- Customer-facing words: lowercase, no emoji, no dashes, say stylist, pick, look. Never algorithm or AI. Never comment on her body. Never a celebrity photo in anything she sees.
- The occasion rules beat her colour answers (a bride at her bachelorette wears white; a wedding guest never does).

## Where the rest lives

- The sales funnel: https://claude.ai/code/artifact/a2694913-28ee-495f-8d22-d01d8c8ee8c9
- The styling playbook: https://claude.ai/code/artifact/6f5996d9-b899-4704-af53-62c72c7e452d
- The principles as a file: `~/Documents/NOCI_Styling_Playbook/styling_principles.md`
