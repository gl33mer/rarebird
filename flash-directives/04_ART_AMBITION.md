# 04 · ART AMBITION RUN — research competitors, then make RAREBIRD bold

**For:** GLM-5.3 Flash · **Branch:** `flash/bold-art-v1` · all rules from `flash-directives/00_ENVIRONMENT_AND_RULES.md` apply (never touch :3000; test on :3100; version-handshake protocol; FINDINGS.md report).

## The brief (owner, 2026-10-24)
Current art is good but **minimal**. The games we're competing with run elaborate, animated, large-format background art that generates ambiance. Goal: a visual identity with **motion, depth, and boldness** — scrolling parallax scenes, living backgrounds, spectacle moments — while keeping 60fps on a mid phone and honoring `prefers-reduced-motion`.

## Phase A — inspiration library (you are the eyes; build evidence first)
1. Drive Playwright (chromium per 00) through the live reference games and capture **screen RECORDINGS**, not just stills (Playwright `context = browser.newContext(recordVideo: {dir})` → save `.webm`): krillion.io (daily dive incl. the sinking animation + reveal, unlimited mode, and `/party`), jinxed.party, playdaily.org/krillion. 20–40s each, phone viewport 390×844.
2. Also capture stills of every distinct screen state you can reach.
3. Save everything to `research-notes/inspiration/` (stills) — videos too; note they may be large, keep each ≤20MB.
4. **Watch the recordings with your vision** and write `research-notes/inspiration/ANALYSIS.md`: per game — motion grammar (what animates, when, how fast), parallax/scroll usage, palette+gradient structure, how the SCORING METAPHOR is visualized (Krillion's depth dive), reveal choreography, transitions, sound-sync cues (if any), what makes it feel "alive". End with a comparison table vs our current client.
5. IP line (hard): analyze composition/motion/pacing only. No asset extraction, no pixel copying, no reproduction of their art. We build OUR scenes.

## Phase B — art vision doc
Write `flash-directives/ART_VISION.md`: our bold direction, decided by you from Phase A evidence. It must include, at minimum, a position on: multi-layer parallax backdrops per theme (dusk hills → sky → sky-deep; cosmos: planet surface → orbit → deep space); continuous ambient motion (drifting, twinkling, weather — birds: fireflies/leaves; cosmos: dust/comets); scroll or drift tied to GAME STATE (ambient shifts as rounds progress — the world should get higher/farther); reveal spectacle (answers fly IN along curved paths, not fade-ups; RARE BIRD gets a hero moment); countdown as a scene (flock forming / rocket ignition with exhaust); podium as a place (perch on a hilltop / landing site on a moon). Reference our existing SVG assets as the cast; propose what NEW art is needed (list, sizes) — you may generate new SVGs yourself in our house style (see `assets/` + `01_BRAND_AND_STYLE.md`).

## Phase C — implement behind `?bold=1`
Extend `prototype/public/fx.js` + `art.js` (or new `bold.js`), gated by `?bold=1`/`localStorage rarebird-bold=1` with a lobby toggle next to 🎨. Requirements:
- Parallax: ≥3 layers per theme, transform-only, GPU-friendly (`will-change`, no layout thrash), responding to device tilt optional / scroll position on desktop.
- Ambient particles: capped (~30), pooled, off under reduced-motion.
- Reveal: flight-in paths (CSS offset-path or keyframe translate+rotate); RARE BIRD hero moment (burst + brief full-screen tint).
- Countdown + podium scene upgrades per your vision doc.
- Perf gates: screenshots + a scripted 3-player game on :3100 must hold ≥50fps measured via `requestAnimationFrame` sampling in-page (write `prototype/verify/verify-bold-perf.js` asserting it); total added first-paint weight ≤ 250KB.
- All existing suites must stay green (retarget pattern exists); add `verify-bold.js` asserting the flag works and fallback intact.

## Deliverables
`research-notes/inspiration/` (stills+videos+ANALYSIS.md) · `flash-directives/ART_VISION.md` · code on branch `flash/bold-art-v1` · new verify scripts · FINDINGS.md entry (same format; defects BA-1…). If Phase A+C don't fit one run: deliver A+B fully with an honest FINDINGS note, and C becomes the next run.
