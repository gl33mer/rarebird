# RUN PROMPT — paste this to GLM-5.3 Flash (Graphics Depth run)

You are GLM-5.3 Flash executing a production run on the RAREBIRD project. Work in `/data/workspace/rarebird-design` (git repo; gh authed as gl33mer). Follow the directives exactly. If anything is ambiguous or resists 15 minutes of diagnosis: STOP, write it up in `flash-directives/FINDINGS.md`, end the run.

## MISSION
Execute **directive `flash-directives/06_GRAPHICS_DEPTH.md`** — close the ambience gap vs Krillion:
- **Track A (deliver fully):** Living Scene — illustrated set-piece actors (balloons, lighthouse, ISS transits, comets), a round-reactive world (ambient speeds up during WRITING, endgame tint on the last round), a reveal spectacle pass (light shaft + band pulse + slow-motion beat for RARE BIRD, dust poofs for pigeons), a podium place with the climbed sky behind it, and opt-in synthesized WebAudio ambience (no audio assets; gesture-gated; mute-respecting).
- **Track B (stretch, honest A-only delivery is a good run):** `?w3d=1` three.js layer — **license gate first**: verify the license of `https://huggingface.co/datasets/scenario-labs/3d-collection` and record it in FINDINGS; use it ONLY if CC0/MIT is verifiable. Default safe sources: Kenney.nl (CC0), Quaternius (CC0), or pure procedural low-poly geometry. Gates: ≥45fps @390×844, DPR ≤1.5, lazy-loaded ≤2MB only when flagged, `w3d=0`/reduced-motion → Track A exactly.

## REQUIRED READING (in order)
1. `flash-directives/06_GRAPHICS_DEPTH.md` (the spec) · 2. `flash-directives/00_ENVIRONMENT_AND_RULES.md` (hard rules) · 3. `research-notes/inspiration/ANALYSIS.md` + the `rec-krillion-dive.webm` recording (the bar to close) · 4. `flash-directives/ART_VISION.md` (the world model: The Ascent) · 5. `prototype/public/bold.js`, `fx.js`, `art.js`, `index.html` · 6. `assets/manifest.json` + `assets/NOTES.md` + `asset-directives/01_BRAND_AND_STYLE.md` · 7. `prototype/verify/verify-bold*.js` (patterns + perf sampling)

## ENVIRONMENT
Node 22; Chromium `/usr/bin/chromium`; `playwright-core` at `/data/workspace/research/node_modules` (absolute require). **NEVER touch the live :3000 server.** Yours: `cd prototype && RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs` (mock judge on :8787 if down). Current version **16** → you bump to **17** (both `CLIENT_VERSION` in server.mjs and `const V` + all `?v=` imports in index.html).

## HARD RULES
Branch `git checkout -b flash/graphics-depth-v1` → push `-u origin`, never merge to main, never force-push. Do NOT modify: `validation/rules-engine.mjs`, `prototype/pack.json`, docs 00-09, `answers.jsonl`/`reports.jsonl`, `assets/manifest.json` (new asset FILES are fine), `prototype/server.mjs` logic (version bump only). All art is original, house style; competitor recordings are study-only. Everything transform/opacity; `prefers-reduced-motion` fully respected; Track A adds ≤40KB.

## TESTS THAT MUST PASS (:3100, before reporting done)
`validation/rules.test.mjs` 62/62 · existing suites green: graphics 12/12, art 18/18, chat-theme 12/12, timers 8/8, bold 16/16, bold-perf 3/3, reconnect 5/5, security 16/16 · NEW `verify-gd.js` + `verify-gd-perf.js` (≥50fps with Track A live) · if Track B: `verify-w3d.js` (≥45fps flagged, zero three.js requests unflagged).

## DELIVERABLES — EXACT PLACEMENT
Track A/B code + new actor SVGs (`assets/themes/*/ambient/actors/`) → `prototype/public/` + `assets/` · new tests → `prototype/verify/` · version 17 both sides · **side-by-side screen recording (ours vs rec-krillion-dive.webm) with your verdict on the ambience gap** → referenced in FINDINGS · run report appended to `flash-directives/FINDINGS.md` (defects GD-1…) · everything on branch `flash/graphics-depth-v1`, pushed.

## FINDINGS FORMAT
```
# Flash run <date> — graphics depth (tracks delivered: A / A+B)
## What I did
## Test results (exact numbers)
## Defects: ID | screen | viewport | severity | shot | fixed?
## License verdict (scenario-labs dataset; sources used)
## Ambience-gap verdict (from the side-by-side) + open questions
```

Note: directive 07 (Feathers + Life List) is the NEXT run — do not start it here. Begin with the required reading. Good hunting.
