# NOTES — RAREBIRD asset pack v1

**Produced by:** GLM-5.3 (MAX) · 2026-10-24 · against `../asset-directives/00…06`
**Scope delivered:** P0 + P1 + P2 complete, plus the optional `06` themed content-pack drafts (see `content/`).

---

## 1. Design decisions (and why)

1. **One illustration system, two worlds.** All 14 tier sprites share: 512 viewBox, 7px-class rounded strokes, flat fills with one darker shade + one lighter accent per form, subject centred in the inner 80%. This keeps future animation (bob/ascend/burst) uniform.
2. **Escalation is carried by pose + density, not just colour** (greyscale test): pigeon/satellite grounded and plump → sparrow/moon cheerful and simple → starling/mars in motion → kingfisher/jupiter imposing → mega/kuiper spectacular (crest fan / twin tails) → rare-bird/interstellar luminous with companions (light trail / sun glint).
3. **Warm recognizability accents:** beaks `#D9A066`, legs `#B0552F`, kingfisher chestnut band `#E76F51` — real-world colour cues that make birds read as birds; documented in `palette.json`.
4. **Cosmic tier hexes appear as rim/aura accents** (Mars' teal atmosphere, Jupiter's teal limb, comet's gold tail) so sprites tie to the canonical chip colours without fighting their natural identity (Mars stays rust).
5. **Aliens:** three distinct original species — the RARE BIRD waver (one big eye, saucer), the MEGA scholar (tall, three eyes, star chart), and the RARE-BIRD greeting committee (two aliens, banner). Cute > cool everywhere; zero resemblance to known IP.
6. **flock-silhouette recoloured to light** `#B9C6DD` — the self-QA caught that the original dark silhouette would be invisible on the game's dark countdown overlay. (My directive said "single flat dark tone"; that was wrong — light is correct. Deviation documented here.)
7. **starfield-tile is seamless by construction** (no star crosses the tile edge; all stars within 8–92%).
8. **perch/launchpad medals** carry stroke-drawn numerals (no `<text>` elements anywhere in the pack — app renders all strings).
9. **og-cover** composed from the pack's own ambient/tier assets + app-rendered-style wordmark; posterized (10-step channel quantization) to fit the ≤300KB cap at 177KB.
10. **cosmos podium = landing pads** rather than planets — keeps the "mission" narrative (winners get bigger pads).

## 2. Self-QA results

`tools/validate.mjs` (in-repo, rerunnable): parse/viewBox/external-ref/text checks on all SVGs, manifest path existence, raster analysis (silhouette %, luminance delta vs theme background, shade-bucket detail count) via headless Chromium.

- **All 26 SVGs: PASS.** Tier sprites: contrast Δlum 92–187 (gate ≥60), silhouette 10–40%, detail 8–15 shade buckets, all ≤2.7KB.
- Validator gates are **scoped per asset class** (tier sprites get the full gates; scenery/ambient are exempt from silhouette/contrast gates by design — a background is *meant* to be full-bleed and low-contrast; countdown motifs get the contrast gate).
- Rasters: og-cover 177KB ≤ 300KB; favicons 16/32/180 + icon.svg; two 6-up contact sheets (1080×740).
- Visual review pass done on qa-full/qa-tiny/qa-grey strips + contact sheets + og-cover (two og-cover iterations; v1 had the alien occluding the tagline).

## 3. Known limitations & revision candidates (for the feedback round)

- **Kingfisher** reads as "generic teal bird" at small sizes — the dive pose helps but the silhouette could exaggerate the dagger beak/crest further. *Candidate for v1.1.*
- **The Moon** crescent is slender; a chunkier crescent would read better at 24px. *Candidate.*
- **Kuiper comet** nucleus could be ~15% larger relative to tail. *Minor.*
- **Sparrow beak** is small; the open-beak chirp helps. *Fine.*
- Logos use system-ui-style geometric strokes drawn as paths (no fonts embedded); a display typeface pass later would refine the wordmark. *P3 polish.*
- og-cover posterization is invisible at share scale but technically reduces gradient smoothness.

## 4. Extras (outside the directive tree, flagged per §2.7 of the master instructions)

- `tools/validate.mjs`, `tools/qa.html`, `tools/out/qa-*.png` — the self-QA harness and evidence. Kept in-repo intentionally so the buyer can rerun the gates.
- `content/draft-pack-space.json`, `content/draft-pack-birds.json` — the `06` optional text deliverable (drafts, awaiting editorial pass).
- No files were skipped; nothing renamed.

## 5. Hand-off notes for integration (GLM-5.3 MAX)

- `manifest.json` paths verified to exist; tier keys are canonical (`RARE BIRD` includes the space).
- The tier-chip uses `currentColor` for the notch — tint via CSS `color` per tier.
- feather/stardust bursts are near-white by design for app-side tinting.
- earth.svg is a perfect circle: the app's shrink-per-round animation will stay round.
- rocket.svg leaves clear space under the flame for the CSS stretch effect.
