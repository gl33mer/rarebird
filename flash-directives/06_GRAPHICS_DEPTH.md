# 06 · GRAPHICS DEPTH — "Living Scene" (Track A) + "3D Ascent" (Track B)

**For:** GLM-5.3 Flash · **Branch:** `flash/graphics-depth-v1` · rules from `00_ENVIRONMENT_AND_RULES.md` apply (never touch :3000; your own server on :3100; version handshake → **17**; FINDINGS.md report; defect IDs GD-1…).

## Context
Live is v16: bold layer (parallax silhouettes, altitude bands, particles, grain) is ON by default and verified 60fps — and the owner's verdict is that it's still **underwhelming vs Krillion's living pixel-art ocean**. Krillion wins with: an illustrated world (not gradients), continuous diegetic life, and a scoring scene that IS the game. Evidence + our direction: `research-notes/inspiration/ANALYSIS.md`, `flash-directives/ART_VISION.md`. This run closes the gap in two tracks. Deliver Track A fully first; Track B is a stretch goal — an honest A-only delivery with great FINDINGS beats a broken B.

## Track A — Living Scene (default-on upgrade of the bold layer)
1. **Illustrated band set-pieces** (extend the art pack, house style — you authored the existing SVGs):
   - Dusk Birds: a hot-air balloon that drifts up during WRITING (round-scaled altitude), a lighthouse/tower silhouette at LOW PERCHES, wind-blown leaves gusting near the ground band.
   - Cosmos: the ISS transiting once per round (tiny, glinting), a comet with a proper tail on a random ~20s cadence, a distant second planet that rises with `--progress`.
   - These are scene actors with simple 2-keyframe or drift animations; transform/opacity only.
2. **Round-reactive world**: during WRITING the ambient speeds up subtly (birds circle faster / star drift quickens); on the last round the sky gets a distinct endgame tint (deep violet dusk / aurora band in cosmos). Drive from existing `--progress` + a new `--phase` var you set on roundStart/reveal.
3. **Reveal spectacle pass**: when the RARE BIRD card lands — a radial light shaft from the top of the screen down to the card (conic/linear gradient div, 500ms), the altitude band it lands in pulses its label once, and a slow-motion beat (reveal stagger pauses ~600ms) before the +100 count-up. PIGEON landings get a tiny dust poof near the ground band (3 particles, pooled).
4. **Podium place**: results screen gets the climbed sky behind it (reuse bands at final `--progress`), winner perch art scales up 10% with a slow bob; confetti = existing burst particles in tier colors, 24 count, one shot.
5. **Sound ambience (opt-in, default off)**: tiny WebAudio synth pad — no assets: a low sine drone + filtered noise "wind" for birds / soft shimmer for cosmos, LFO-modulated; reveal stingers (rising arpeggio for RARE BIRD, soft thud for PIGEON). Starts only after first user gesture (autoplay policy); respects the existing mute; volume ≤0.15. All synthesized in code — zero downloads.
6. **Perf/compat**: all of A must hold ≥50fps at 390×844 on :3100 (extend `verify-bold-perf.js` or new `verify-gd-perf.js`), respect `prefers-reduced-motion` (actors static, no drone), and add ≤40KB.

## Track B — 3D Ascent (stretch, behind `?w3d=1`)
A real WebGL layer behind the DOM (transparent three.js canvas under the UI, above current CSS scene; lazy-load a vendored `three.min.js` ONLY when the flag is on).
- **Assets — license gate first (GD Step 0):** check `https://huggingface.co/datasets/scenario-labs/3d-collection` license. Use its models ONLY if CC0/MIT is verifiable on the page (record the license text in FINDINGS). Default safe sources: **Kenney.nl** (CC0) and **Quaternius** (CC0) low-poly packs; or pure procedural geometry (three.js primitives + vertex colors) which needs zero downloads and matches our low-poly-friendly house style.
- Scene: birds theme = low-poly hill layers at 3 depths + a boids flock (~20 instanced birds) that migrates upward with `--progress`; cosmos = low-poly planet with atmosphere rim + moon + instanced star points + 2 drifting satellites. Camera ascends per round (lerp). DOM reveal cards stay DOM; the 3D is the living backdrop.
- Gates: ≥45fps at 390×844 with DPR capped 1.5; total lazy-loaded JS+assets ≤2MB; `w3d=0` and reduced-motion → current Track A scene exactly; iOS Safari must not fall over (test via headless Chromium at minimum, note limitations honestly).
- New test `verify-w3d.js`: flag on → canvas + renderer present, fps sampled ≥45; flag off → no canvas, no three.js request (assert via request interception).

## Tests (both tracks)
All existing suites green (rules 62/62; graphics 12/12; art 18/18; chat-theme 12/12; timers 8/8; bold 16/16; bold-perf 3/3; reconnect 5/5; security 16/16 — on your :3100). New: `verify-gd.js` (Track A actors present, phase-reactive vars, reveal light shaft, reduced-motion fallbacks), `verify-gd-perf.js`, and `verify-w3d.js` if B attempted. **Deliverable: a side-by-side screen RECORDING (ours vs the Krillion dive recording in research-notes/inspiration/) with your verdict on whether we've closed the ambience gap — attach to FINDINGS.**

## Deliverables
Code in `prototype/public/` (new SVGs under `assets/themes/*/ambient/actors/`), tests in `prototype/verify/`, version → 17 (both sides), FINDINGS entry, branch pushed. Same stop rule: 15 minutes stuck → document → end run.
