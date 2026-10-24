# RUN PROMPT — paste this to GLM-5.3 Flash (art integration + deep visual QA)

You are GLM-5.3 Flash executing a production run on the RAREBIRD project. Work in `/data/workspace/rarebird-design` (git repo, gh authed as gl33mer). This prompt is self-contained for the essentials; the directive files listed under REQUIRED READING carry the full detail. Follow them exactly.

---

## MISSION
Two runs, in order:
1. **ART INTEGRATION** — wire the delivered art pack into the game client behind an `art=1` flag, replacing emoji placeholders in both themes.
2. **DEEP VISUAL QA** — a systematic screenshot-driven audit of every screen/theme/viewport using real games, with confident CSS-level fixes applied.

## REQUIRED READING (in this order, before writing any code)
1. `flash-directives/00_ENVIRONMENT_AND_RULES.md` — environment facts + hard rules
2. `flash-directives/01_ART_INTEGRATION.md` — the integration spec (swap points, loader contract, tests)
3. `flash-directives/02_DEEP_VISUAL_QA.md` — the QA protocol (walk list, defect taxonomy)
4. `assets/manifest.json` — the asset contract (paths + tier flavors)
5. `assets/NOTES.md` — integration notes from the art run (chip uses `currentColor`; bursts tint-ready; earth perfectly round; rocket flame-stretch space)
6. `prototype/public/fx.js` — the current theme/ambient/FX layer you are extending
7. `prototype/public/index.html` — the client (inline CSS + module script; emoji placeholders marked by TIERS table, countdown, podium, particles, mute/chat icons)
8. `prototype/server.mjs` — ONLY to know `CLIENT_VERSION` and message types; do not modify logic
9. `prototype/verify/verify-graphics.js` and `prototype/verify/verify-chat-theme.js` — the style/pattern for your new tests (copy + retarget base URL)
10. Skim: `README.md`, `05_UI_UX_SPEC.md` §0a (fx philosophy), `06_TEST_PLAN_AND_RESULTS.md` (what "done" has meant historically)

## ENVIRONMENT FACTS
- Node 22 (`node script.mjs`), Chromium at `/usr/bin/chromium`, `playwright-core` at `/data/workspace/research/node_modules` (ESM imports ignore NODE_PATH — require by absolute path or `cd /data/workspace/research && node <script>`).
- **The LIVE human server is port 3000. NEVER kill/restart/test against it.** Run your own:
  `cd prototype && RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs`
  (mock judge: `node prototype/mock-judge.mjs` on :8787 — start it first if not running.)
- Rules tests: `node validation/rules.test.mjs` → must remain 62/62.

## HARD RULES
1. Branch only: `git checkout -b flash/art-qa-v1` → commit → `git push -u origin flash/art-qa-v1`. **Never merge to main, never force-push.** GLM-5.3 (MAX) reviews and merges.
2. **Version handshake on any client-visible change**: bump BOTH `CLIENT_VERSION` in `prototype/server.mjs` AND `const V` + `fx.js?v=` in `prototype/public/index.html` to 11 (next integer). Stale clients are the #1 field bug.
3. Do NOT modify: `validation/rules-engine.mjs`, `assets/manifest.json` (schema/paths — art files themselves are fine), `prototype/pack.json`, docs `00-09`, `answers.jsonl`, `reports.jsonl`, `prototype/server.mjs` logic (only the version bump).
4. Fail-soft art: if the manifest or any asset fails to load, the client must fall back to today's emoji/gradients. The game must never break on art.
5. Reproducibility: commit every script you write. If an instruction is ambiguous or a failure resists 15 minutes of diagnosis — STOP, write it up in FINDINGS.md, end the run. Honest partial delivery beats a broken guess.

## RUN 1 — ART INTEGRATION (spec: `flash-directives/01_ART_INTEGRATION.md`)
Build: asset loader (`ART.ready/tier()/theme()/icon()` from `assets/manifest.json`, version-cache-busted, fail-soft) → swap the exact slots listed in the spec (tier chips, ruler marks, reveal portraits, countdown flock/rocket, ambient sky/clouds/tree-line + starfield/nebulae/earth/sun, podium perches/launchpads, burst particles, shared icons, NO-SIGHTING empty-perch, loading bird, favicon + og:image meta) → gate everything behind `art=1` URL param or `localStorage rarebird-art=1`, with a small 🎨 toggle in the host lobby that sets localStorage and reloads.
Weight budget ≤150KB added on first paint; lazy-load the non-active theme; `prefers-reduced-motion` disables drift/particles.

## RUN 2 — DEEP VISUAL QA (spec: `flash-directives/02_DEEP_VISUAL_QA.md`)
Playwright matrix: 390×844, 320×568, 768×1024 × both themes × every screen (home/lobby/countdown/round/reveal/podium/chat), including edge states (invalid + report link, suggestion chip, ambiguous chips, locked, Top Call placed, SPLIT×n badge, tie podium, unread badge, update banner) and 3-context real games to completion on YOUR server. Look at every screenshot with your vision; fix only confident CSS/HTML-level defects; re-verify known suspects listed in the spec.

## TESTS THAT MUST PASS (on your :3100 server, before you report done)
1. `node validation/rules.test.mjs` → 62/62
2. Retargeted copies of `verify-graphics.js`, `verify-chat-theme.js`, `verify-timers.js` (base URL 127.0.0.1:3100, log token `flashtest`) → all green, WITH `art=1` active
3. NEW `prototype/verify/verify-art.js`: with `art=1` asserts sprites loaded from manifest paths (tier chip, ambient layers, podium, favicon link) and emoji absent from those slots; with `art=0` asserts emoji fallback intact; runs against :3100
4. Full screenshot matrix captured

## DELIVERABLES — EXACT PLACEMENT
| Deliverable | Location |
|---|---|
| Modified client (loader wiring, swaps, 🎨 toggle, favicon/og meta, V=11) | `prototype/public/index.html` |
| Asset loader + art-aware FX additions | `prototype/public/art.js` (new) and/or `prototype/public/fx.js` |
| Version bump | `prototype/server.mjs` (CLIENT_VERSION only) |
| New automated test | `prototype/verify/verify-art.js` |
| Retargeted suite copies | `prototype/verify/verify-*-3100.js` |
| Screenshot matrix (named `theme-screen-viewport.png`) | `prototype/verify/shots/` |
| Defect table + run report + open questions (append, don't overwrite) | `flash-directives/FINDINGS.md` |
| Everything | branch `flash/art-qa-v1`, pushed |

## FINDINGS.md FORMAT
```
# Flash run <date> — art integration + QA
## What I did
## Test results (exact numbers)
## Defects: ID | screen | viewport | severity | shot | fixed? (FQ-1…)
## Not fixed / open questions
## Verdict per theme: ships as-is / needs X
```

Begin with the required reading. Good hunting.
