# 02 · Theme Brief: DUSK BIRDS (default theme)

**Metaphor in play:** rarity = altitude. Pigeons stay near the ground; the Rare Bird soars into the stars. Your art replaces the current emoji placeholders in a living reveal animation where each answer card flies upward to its tier band.

---

## T1 · Tier portraits — `themes/dusk-birds/tiers/` (P0)

Six square portraits, 512×512 viewBox, transparent background, one bird each, per the tier identities in `01` §2. Beyond the identities:

| File | Bird | Pose idea (yours to improve) | Detail density |
|---|---|---|---|
| `pigeon.svg` | city pigeon | standing, wing tucked, side-eye | low |
| `sparrow.svg` | house sparrow | perched, chirping, tail up | low |
| `starling.svg` | starling | banking mid-turn, wing spread | medium |
| `kingfisher.svg` | kingfisher | dive pose, beak down, crest up | medium-high |
| `mega.svg` | bird-of-paradise vibe (original species) | display pose, crest fan | high |
| `rare-bird.svg` | mythical original bird | rising, crest trailing light | highest |

Rules:
- Canonical tier hex as the dominant accent; bird silhouettes readable at 24px.
- All six must be renderable in a vertical ladder where higher tier = visually "higher-energy" pose (grounded → rising → soaring).
- One optional 1px-tier-colour halo ≤ 25% opacity. No glow-fest.
- `portraits-6up.png` (1080×720): the six in tier order for quick review.

## T2 · Ambient layers — `themes/dusk-birds/ambient/` (P1)

The app draws gradient bands; your layers float over them:
- `sky-bands.svg` — 1080×1920: a refined 5-band dusk gradient scene (horizon glow, band hazing) that the app may use INSTEAD of flat CSS bands. Include a low sun-glow. Tintable via CSS variables? Keep static; harmony with palette is enough.
- `dusk-clouds-1.svg`, `dusk-clouds-2.svg` — soft cloud clusters ~600×260, drifting feel, ≤ 20% white, blue-hour tint; two shapes so the app can alternate.
- `tree-line.svg` — 1080×140 bottom strip: silhouette tree-line/hedge for the "ground" where pigeons land. 2 tones max, very dark.

## T3 · Countdown motif — `themes/dusk-birds/countdown/` (P1)

- `flock-silhouette.svg` — 480×200: 4–7 small birds in a loose V, single flat dark tone; the app scales/animates them while the 3-2-1 ticks. No text.

## T4 · Podium — `themes/dusk-birds/podium/` (P1)

- `perch-1.svg` / `perch-2.svg` / `perch-3.svg` — winner's perch, second, third; each 400×420, a branch/perch pedestal at increasing grandeur (1st: gilded branch with tiny crest pennant; 2nd: sturdy oak branch; 3rd: simple twig). Transparent bg; the app places nick + points above.

## T5 · Bursts — `themes/dusk-birds/bursts/` (P1)

- `feather.svg` — 96×96 single stylized feather, tier-tintable (design so a CSS hue-rotate/colour overlay works: use near-white fill with 0.4–0.6 opacity strokes so app tinting reads).

## T6 · Logo — `themes/dusk-birds/` (P2)

- `logo.svg` — wordmark per `01` §5 + small bird perched on the final R.
- `logo-mark.svg` — the rare-bird head/bust alone; legible at 16px.
