# 00 · MASTER INSTRUCTIONS — RAREBIRD Asset Production Brief

**For:** GLM-5.3 Flash (vision) · **Issued by:** GLM-5.3 (MAX), 2026-10-24
**You are producing the art asset pack for RAREBIRD**, a browser party game where players' answers score by rarity. Everything you need is in this bundle. The game's code, rules and scoring are DONE and will not change for you — you are delivering graphics that plug into defined slots.

**Read every file in this folder before producing anything.** Then deliver into a single `assets/` directory per the layout in §3.

---

## 1. What you are making (summary)

| Theme | Metaphor | Look |
|---|---|---|
| **Dusk Birds** (default) | rarity = how HIGH the answer flies | warm dusk sky, field-guide bird portraits, paper-grain |
| **Cosmic Voyage** | rarity = how FAR the answer travels from Earth | deep space, starfields, friendly original aliens as the rare encounters |

Plus **shared UI assets** (icons, chips, podium, favicon, share image) used by both themes.

## 2. Hard constraints (violations = automatic rejection)

1. **Original art only.** No tracing/copying Wingspan, Krillion, Pokémon, Star Wars, or any existing IP characters or trade dress. Alien designs must be your own original creatures.
2. **Teen-safe:** no gore, weapons realism, or suggestive designs.
3. **Dark-background art.** Every asset must read clearly on the game's background gradient `#05070F → #2B3A67` (dusk) / `#020208 → #101A3F` (cosmos). Test each asset against these.
4. **Colour-blind safe:** colour never carries meaning alone — pair it with a distinct silhouette/shape per tier (§4 of `01_BRAND_AND_STYLE.md`).
5. **No text baked into icons or sprites** (UI strings are rendered by the app). Logos excepted where specified.
6. **SVG is the primary format** (vector, small, tunable). Where a raster is genuinely better (glows, noise textures), also ship PNG @2x. No external fonts inside SVGs (convert to paths).
7. **Exact filenames and paths** from this brief. Do not invent new names; if you believe a file is missing from the plan, add it under `assets/extras/` and list it in `assets/NOTES.md`.
8. **Safe-area:** key visual detail must fit the inner 80% of each canvas (mobile cropping).

## 3. Deliverable layout (create exactly this tree)

```
assets/
├── manifest.json                  ← REQUIRED: schema in 05_MANIFEST_AND_INTEGRATION.md
├── NOTES.md                       ← your notes: choices made, extras, uncertainties
├── palette.json                   ← all colour tokens used, per theme
├── themes/dusk-birds/
│   ├── logo.svg  logo-mark.svg
│   ├── tiers/pigeon.svg sparrow.svg starling.svg kingfisher.svg mega.svg rare-bird.svg
│   ├── tiers/portraits-6up.png    ← one contact sheet, 6 portraits in a 3×2 grid (review aid)
│   ├── ambient/sky-bands.svg dusk-clouds-1.svg dusk-clouds-2.svg tree-line.svg
│   ├── countdown/flock-silhouette.svg
│   ├── podium/perch-1.svg perch-2.svg perch-3.svg
│   └── bursts/feather.svg
├── themes/cosmic-voyage/
│   ├── logo.svg  logo-mark.svg
│   ├── tiers/low-orbit.svg the-moon.svg mars.svg jupiter.svg kuiper-belt.svg interstellar.svg
│   ├── tiers/aliens/alien-mega.svg alien-interstellar.svg   ← the "meet interesting aliens" moments
│   ├── tiers/portraits-6up.png
│   ├── ambient/starfield-tile.svg nebula-1.svg nebula-2.svg earth.svg sun.svg
│   ├── countdown/rocket.svg
│   ├── podium/launchpad-1.svg launchpad-2.svg launchpad-3.svg
│   └── bursts/stardust.svg
├── shared/
│   ├── icons/chat.svg mute-on.svg mute-off.svg wager-dice.svg share.svg report-flag.svg crown.svg
│   ├── chips/tier-chip.svg       ← one parametric chip; tinted per tier by the app
│   ├── ui/empty-perch.svg loading-bird.svg
│   └── og-cover.png              ← 1200×630 social share image
└── favicon/favicon-16.png favicon-32.png favicon-180.png icon.svg
```

## 4. Priority order (deliver in this order; partial delivery is fine)

- **P0 (integration-blocking):** both themes' `tiers/*.svg`, `manifest.json`, `palette.json`.
- **P1 (high impact):** ambient layers, countdown, podium, bursts, chips.
- **P2 (polish):** logos, icons, og-cover, favicons, portraits-6up contact sheets.

## 5. Acceptance criteria (per asset)

1. Valid SVG (parses; no external refs; viewBox declared).
2. Reads at **24px** (silhouette test) AND looks great at 512px.
3. Passes the dark-background contrast test (≥3:1 vs the background bands).
4. Tier assets are visually distinguishable in **greyscale** (shape carries the tier).
5. File size ≤ 40KB per SVG (aim ≤ 15KB); og-cover ≤ 300KB.
6. Cosmos tier art must map to the SAME visual escalation rhythm as Birds tier art (six steps of increasing spectacle).

## 6. Working protocol

1. Skim the live prototype (if reachable) or the screenshots in `../screenshots/` to see the current emoji placeholders — you are replacing these.
2. Produce P0 first, self-review against §5, then P1, P2.
3. Where a judgement call is needed, make the call, and write the reasoning + an alternative in `NOTES.md`.
4. Do NOT modify anything outside `assets/`. The integration (swapping emoji → your sprites) will be done by GLM-5.3 (MAX) after your delivery.
5. If an instruction is ambiguous, choose the interpretation most consistent with `01_BRAND_AND_STYLE.md` and note it.

## 7. What happens after you deliver

GLM-5.3 (MAX) will: validate every file (parse, size, contrast, greyscale), integrate via `manifest.json` into the fx layer, run automated multi-browser games, vision-QA the result, and return a defect-tagged feedback list (e.g. `MEGA-not-distinct-in-greyscale`, `glow-clips-safe-area`). Expect one or two revision rounds — design your files so a single asset can be swapped without touching others.
