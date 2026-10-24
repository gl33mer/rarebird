# Flash run 2026-10-24 — art integration + QA

## What I did
- Branch `flash/art-qa-v1`. Symlinked `prototype/public/assets -> ../../assets` so the client can GET the art pack (no server-logic change; git-friendly).
- New `prototype/public/art.js`: manifest loader (`ART.init/tier/tierExtra/flavor/ambient/countdownArt/podiumArt/burstArt/icon/chip/emptyPerch/loadingBird/ogCover`), fail-soft (any failure → null + emoji fallback), cache-busted `?v=<V>`.
- `prototype/public/index.html` wiring (all behind `?art=1` / `localStorage rarebird-art=1`, `?art=0` escape): tier-chip sprites + ruler mark sprites + reveal row portraits + NO-SIGHTING empty-perch; countdown flock/rocket motif; ambient layers per theme (birds: sky-bands + drifting clouds + tree-line; cosmos: tiled starfield + nebulae + img-Earth (shrink preserved via patched `FX.setProgress`) + sun); podium perches/launchpads + winner crown; burst particles use feather/stardust sprites with hue tint; mute/chat/wager icons; favicon + og:image/twitter meta; host lobby 🎨 toggle (sets localStorage, reloads).
- `prototype/public/fx.js`: `burst()` accepts `{sprite}`; TIER_LADDER gained `hue` for sprite tinting; `setProgress()` scales an `<img>` earth when present.
- Version handshake: `CLIENT_VERSION = 11` (server.mjs — bump only) + `const V = 11` + `fx.js?v=11` (index.html).
- New tests: `prototype/verify/verify-art.js` (18 checks incl. art=0 fallback); retargeted `verify-{graphics,chat-theme,timers}-3100.js` (base 127.0.0.1:3100, token flashtest, art=1 active); screenshot matrix walker `prototype/verify/shots.js`.

## Test results (exact numbers)
- `validation/rules.test.mjs`: **62/62** (untouched engine).
- `verify-art.js`: **18/18** (manifest served; art=1: chip/row/ruler/podium/countdown/favicon/og/icons; art=0: emoji fallback intact).
- `verify-graphics-3100.js`: **12/12** · `verify-chat-theme-3100.js`: **12/12** · `verify-timers-3100.js`: **8/8** (all with art=1).
- Screenshot matrix: **27 shots** in `prototype/verify/shots/` (2 themes × home/lobby/lobby-full/countdown/round/round-invalid/round-locked/reveal/podium/chat × 390 + round/reveal at 320 & 768 + reduced-motion) + 6 re-shots after fixes.

## Defects: ID | screen | viewport | severity | shot | fixed?
- FQ-1 | reveal (SPLIT rows) | 390 | major (readability) | birds-reveal-390x844.png (v1) | ✅ fixed — rowArt 30px, gap 6px, answrap min-width:0, nick ellipsis, twins font 11px. Re-shot clean.
- FQ-8 | lobby (host) | all | block (raw `${...}` rendered literally) | cosmos-countdown-390x844.png (v1) | ✅ fixed — static label + JS sets "🎨 Art: on/off".
- FQ-10 | countdown | all | block (motif invisible) | both countdown v1 shots | ✅ fixed — ROOT CAUSE: `<img>` of a viewBox-only SVG computes 0×0 with only max-* CSS; gave `.cdArt` explicit 120×120 + object-fit. Re-shot: rocket renders with liftoff animation.
- FQ-9 | podium | 390 | major | birds-podium v1 | ✅ fixed — same root cause; explicit width + aspect-ratio 400/420. Crown + perches/launchpads render (re-shot).
- FQ-6 | reveal (cosmos) | 390 | minor | cosmos-reveal v1 (sun over caption) | ✅ fixed — sun 84px, opacity .45, top 1%.
- FQ-5 | reveal ruler | 390/320 | minor (label truncation) | cosmos-reveal | ✅ fixed — 9.5px + ellipsis (labels now "KINGF…", intentional).
- FQ-11 (not fixed, by design): headless-Chromium shows □ boxes for emoji (medals 🥇 etc.) — missing emoji font in the test browser only; phones render fine. Do not "fix" by removing emoji: they are the no-art fallback.
- FQ-12 (not fixed, minor): winner-nick ellipsis ("W.") is aggressive at 30% max-width on solo reveals; acceptable, revisit with real names in playtests.

## Not fixed / open questions
1. `art=1` is still opt-in by design — promotion to default is a MAX merge decision after human eyeball on the live URL (`?art=1`).
2. `assets` reached via symlink `prototype/public/assets -> ../../assets`; production build should copy/serve `assets/` explicitly (deployment note for MAX).
3. Ruler labels for cosmos flavors ("Interstellar") still truncate at 46px gutter — cosmetic.
4. verify-*-3100 copies exist because the canonical suites live in /data/workspace/research — MAX may want to consolidate locations.

## Verdict per theme
- **Dusk Birds:** ships as-is (art=1) — ladder, ambient dusk, perch podium all read well.
- **Cosmic Voyage:** ships as-is (art=1) — starfield/nebulae/sun/shrinking Earth + rocket countdown are the stronger identity; ruler flavor labels (Low orbit → Interstellar) land.
