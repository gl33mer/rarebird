# RUN PROMPT — paste this to GLM-5.3 Flash (Art Ambition run)

You are GLM-5.3 Flash executing a production run on the RAREBIRD project. Work in `/data/workspace/rarebird-design` (git repo; gh authed as gl33mer). This prompt is self-contained for the essentials; the directive files carry full detail. Follow them exactly. If anything is ambiguous or resists 15 minutes of diagnosis: STOP, write it up in `flash-directives/FINDINGS.md`, end the run.

## MISSION
Execute **directive `flash-directives/04_ART_AMBITION.md`** — a three-phase run that makes RAREBIRD visually bold:
- **Phase A — inspiration library:** play the reference games in Chromium and capture **screen recordings** (WebM via Playwright `recordVideo`) + stills into `research-notes/inspiration/`; watch them with your vision and write `research-notes/inspiration/ANALYSIS.md` (motion grammar, parallax, reveal choreography, what makes each feel alive; comparison table vs our client).
- **Phase B — art vision:** write `flash-directives/ART_VISION.md` — our bold direction (parallax backdrops, ambient motion tied to round progress, flight-path reveals, scene-based countdown/podium), grounded in evidence, reusing our existing SVG cast and proposing new art where needed.
- **Phase C — implement behind `?bold=1`** (localStorage `rarebird-bold=1`, lobby toggle beside 🎨): ≥3 transform-only parallax layers per theme, capped/pooled ambient particles, curved flight-in reveals with a RARE BIRD hero moment, countdown + podium scene upgrades. Perf gate ≥50fps on :3100 via a new `verify-bold-perf.js`; added first-paint weight ≤250KB; `prefers-reduced-motion` disables drift/particles.
If A+C don't fit one run: deliver A+B fully, note it honestly in FINDINGS, and C becomes the next run.

## REQUIRED READING (in order, before writing code)
1. `flash-directives/04_ART_AMBITION.md` — the full spec for this run
2. `flash-directives/00_ENVIRONMENT_AND_RULES.md` — environment + hard rules
3. `flash-directives/02_DEEP_VISUAL_QA.md` — QA method + known visual suspects
4. `prototype/public/fx.js`, `prototype/public/art.js`, `prototype/public/index.html` — the layers you are extending
5. `assets/manifest.json` + `assets/NOTES.md` + `asset-directives/01_BRAND_AND_STYLE.md` — the art cast and house style
6. `prototype/verify/verify-art.js`, `verify-graphics-3100.js` — the test patterns to copy (absolute playwright require, :3100 retarget)
7. Skim `06_TEST_PLAN_AND_RESULTS.md` (review-round section) for what "done" has meant

## ENVIRONMENT FACTS
- Node 22; Chromium at `/usr/bin/chromium`; `playwright-core` at `/data/workspace/research/node_modules` (require by absolute path — ESM ignores NODE_PATH).
- **The LIVE human server is port 3000. NEVER kill/restart/test/record against it.** Run your own: `cd prototype && RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs` (mock judge `node prototype/mock-judge.mjs` on :8787 if not running).
- Current client/server version is **13** — you bump to **14** (see HARD RULES).

## HARD RULES
1. Branch only: `git checkout -b flash/bold-art-v1` → push `-u origin flash/bold-art-v1`. Never merge to main, never force-push. MAX reviews and merges.
2. Version handshake on any client-visible change: bump BOTH `CLIENT_VERSION` in `prototype/server.mjs` AND `const V` + `fx.js?v=` + `art.js?v=` (+ any new module imports) in `prototype/public/index.html` to **14**.
3. Do NOT modify: `validation/rules-engine.mjs`, `assets/manifest.json`, `prototype/pack.json`, docs `00-09`, `prototype/server.mjs` logic (version bump only), `answers.jsonl`, `reports.jsonl`.
4. **IP line (critical):** recordings and analysis of competitor games are for composition/motion/pacing study ONLY. No asset extraction, no pixel copying, no reproducing their art, branding, or code. We build our own scenes in our house style.
5. `bold=1` must fail-soft: with the flag off, today's client behaves identically; with it on, any missing asset falls back to existing art. The game must never break on art.
6. Commit every script you write. Keep videos ≤20MB each.

## TESTS THAT MUST PASS (your :3100 server, before reporting done)
1. `node validation/rules.test.mjs` → 62/62
2. Existing suites stay green with `bold` OFF: `verify-graphics-3100.js` (12/12), `verify-chat-theme-3100.js` (12/12), `verify-timers-3100.js` (8/8), `verify-art.js` (18/18, base 127.0.0.1:3100)
3. NEW `prototype/verify/verify-bold.js`: bold=1 asserts (parallax layers present per theme, particles capped, reveal uses flight paths, toggle exists) and bold=0 asserts identical-to-current behavior
4. NEW `prototype/verify/verify-bold-perf.js`: rAF-sampled fps ≥50 during a 3-player game with bold=1; pass with `prefers-reduced-motion` too (asserts particles off)

## DELIVERABLES — EXACT PLACEMENT
| Deliverable | Location |
|---|---|
| Inspiration stills + WebM recordings | `research-notes/inspiration/` |
| Motion-grammar analysis | `research-notes/inspiration/ANALYSIS.md` |
| Art vision doc | `flash-directives/ART_VISION.md` |
| Bold-layer code (fx.js/art.js/bold.js/index.html wiring, V=14) | `prototype/public/` |
| New tests + perf gate | `prototype/verify/verify-bold.js`, `verify-bold-perf.js` |
| Version bump | `prototype/server.mjs` (CLIENT_VERSION only) |
| Run report (append) | `flash-directives/FINDINGS.md` |
| Everything | branch `flash/bold-art-v1`, pushed |

## FINDINGS.md FORMAT
```
# Flash run <date> — art ambition (phases delivered: A/B/C or A/B)
## What I did
## Test results (exact numbers)
## Defects: ID | screen | viewport | severity | shot | fixed? (BA-1…)
## Not fixed / open questions
## Verdict: does bold mode ship? what's missing?
```

Note: `flash-directives/05_MOLAB_GENERATOR.md` is a SEPARATE later run — do not start it in this session. Begin with the required reading. Good hunting.
