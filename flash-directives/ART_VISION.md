# ART VISION — "The Ascent" (bold layer direction, v1)

Derived from `research-notes/inspiration/ANALYSIS.md`. Core move: **steal Krillion's strongest idea and invert it fully** — their ocean is a depth ruler; our sky becomes a *climb ruler*. The whole viewport is the altitude ladder. When answers reveal, the camera **ascends** past painted altitude bands and each answer card flies to its band. By the final round the room is at the edge of space.

## 1. The world is a climb ruler
- Paint 6 altitude BANDS into the background as full-width zones with faint labels + altitude ticks on BOTH edges (not a 46px gutter): LOW PERCHES · OPEN SKY · HIGH THERMALS · TREETOP CLOUDS · STRATOSPHERE · STARS (birds) / SURFACE · SKY · HIGH ORBIT · MOON LANE · OUTER · DEEP STARS (cosmos).
- Background is a **tall scrolling world** (≈ 3× viewport): round 1 near the ground, final round near space. Camera position = round progress (`--progress` CSS var, already planned via `FX.setProgress`).
- Between rounds the camera *glides upward* during the countdown — the countdown becomes travel, like Krillion's descent.

## 2. Alive at all times (per theme)
- **Dusk Birds:** 3+ parallax silhouette layers (far hills, mid tree-line, near grasses/reeds) drifting at different speeds; rising fireflies (warm dots, ~14, pooled); occasional bird silhouettes crossing far layer; sun glow that follows round progress downward.
- **Cosmos:** tiled starfield on TWO depths (slow/fast drift), nebulae breathing (opacity oscillation), Earth below shrinking per round (existing), passing satellite/comet streak every ~20s, dust motes (~20 pooled).
- All transform/opacity; particles pooled + capped 30 total; everything off under `prefers-reduced-motion`.

## 3. Reveal choreography — "the flock ascends" as a scene
- On reveal: camera glides up one band; answer cards **fly in along curved paths** (`offset-path` bezier from bottom-right sweeping to their altitude slot, slight rotation, staggered 500ms).
- PIGEON rows settle quickly and quietly near the ground; each higher tier lands higher with a small poof of theme particles (feather/stardust bursts already built).
- **RARE BIRD hero moment:** brief full-screen radial tint in the tier pink (180ms), double shake, larger burst, and the card gets a crown + slow pulsing glow for the rest of the reveal.
- Altitude bands flash softly as each card lands in them — the ruler teaches itself.

## 4. One post-processing idea: "dusk grain"
A single unified dressing (our CRT equivalent): a very subtle film-grain/vignette overlay (static, 3-4% opacity) + a slow sky-hue drift as rounds progress (dusk deepens / space darkens). Cheap, one div, huge cohesion. No scanlines — that's their signature; ours is dusk grain.

## 5. Countdown & podium as places
- Countdown = **travel**: camera glide + the flock silhouette forming ahead (birds) / rocket with flickering exhaust lifting off (cosmos, existing art, add flame flicker).
- Podium = **a place**: winner's perch sits on a hilltop with the whole climbed sky behind it (birds) / landing pad on a moon surface with Earthrise (cosmos). Reuse perch/launchpad art at large scale behind the podium table.

## 6. New art needed (I generate these, house style, in this run)
- `assets/themes/dusk-birds/ambient/hills-far.svg`, `hills-near.svg` (silhouette layers)
- `assets/themes/cosmic-voyage/ambient/planet-surface.svg` (bottom band for early rounds)
- Both themes: `grain.png`-style overlay implemented as CSS (no asset), band labels as HTML text (app-rendered, per our no-baked-text rule).

## 7. Non-goals (this run)
No sprite-walk cycles, no Lottie, no canvas particle engine, no sound-sync, no device-tilt. These are the next bold increments if this one lands.

## Perf/compat budget
Transform/opacity only; ≤30 pooled particles; total new first-paint weight ≤ 250KB (new SVGs ≈ 4KB; everything else reuses art pack); ≥50fps on :3100 mid-viewport; `?bold=1`/`rarebird-bold=1` flag, `bold=0` escape; reduced-motion = static layers, no particles, reveals keep simple fades.
