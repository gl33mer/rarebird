# RUN PROMPT — paste to GLM-5.3 Flash (Track B: 3D Ascent + Economy)

Two runs in one session, in order. Work in /data/workspace/rarebird-design (gh authed as gl33mer). Stop-and-document rule: 15 min stuck → FINDINGS.md → end run.

## RUN 1 — 3D ASCENT (branch flash/w3d-v1)
Read first: flash-directives/06_GRAPHICS_DEPTH.md (Track B section — license gate now RESOLVED: CC-BY-4.0 accepted per D-39, credits required), 00_ENVIRONMENT_AND_RULES.md, prototype/public/gd.js + bold.js (your layering model), verify-bold-perf.js (perf sampling pattern). Current version 17 → bump 18.
- Build `?w3d=1` (localStorage rarebird-w3d, lobby 🌐 toggle): transparent three.js canvas between the CSS scene and the DOM UI, lazy-load a vendored three.min.js ONLY when flagged (≤2MB; vendor into prototype/public/vendor/).
- Scene (procedural first — primitives + vertex colors; optional curated subset of scenario-labs/3d-collection if it adds clear value, record model+license per FINDINGS, add credits line to footer): birds = low-poly hill layers ×3 depths + boids flock (~20 instanced birds) migrating up with --progress; cosmos = low-poly planet with atmosphere rim + moon + instanced star points + 2 drifting satellites. Camera lerps upward per round.
- Gates: ≥45fps @390×844 (DPR cap 1.5) via NEW verify-w3d.js; zero three.js requests when unflagged (assert via request interception); reduced-motion → static frame; w3d=0 → current Track A exactly; existing suites all green.
- Version-bump checklist now includes gd.js's dynamic import of fx.js.

## RUN 2 — FEATHERS + LIFE LIST (branch flash/economy-v1)
Read first: flash-directives/07_FEATHERS_LIFELIST.md in full, then 00 rules. Version 18 → 19 (separate branch, bump again).
- Server-authoritative feathers economy (3/game, Top Call costs 1, doubled refunds +2, reject at 0, config on/off), **theme-flavored display per D-40** (🪶 Feathers / ⭐ Starlight — client map only, protocol stays `feathers`).
- Life List local-only collection (localStorage, MEGA/RARE BIRD cards from manifest portraits, card-fly-in on earn, modal grid + copy-summary; no server involvement).
- Tests: NEW verify-economy.js + verify-lifelist.js + sim extension (smartW3) per directive; all existing suites green.

Deliverables per directive: code, tests, version bumps, FINDINGS entries (defect IDs W3D-…, EC-…), branches pushed. Never touch live :3000; your server is :3100 (RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs).
