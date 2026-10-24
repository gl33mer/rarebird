# 01 · Brand & Style Guide — RAREBIRD

The one document that decides every judgement call. Both themes are siblings: same geometry rules, same escalation rhythm, different worlds.

## 1. Brand in one line
**"The field notebook of a friend group that got lost somewhere beautiful."** Cozy, competitive, a bit nerdy, never corporate. Think: hand-illustrated nature guide × late-night phone screen.

## 2. The canonical tier system (memorize this)

Six tiers, fixed canonical colours (hex), fixed points. These colours are ALREADY in the live game UI — your art must harmonize with them, not fight them:

| Tier | Points | Hex | Dusk Birds identity | Cosmic Voyage identity | Escalation step |
|---|---|---|---|---|---|
| PIGEON | 10 | `#8D99AE` | street pigeon, plump, unimpressed | satellite / low-orital probe | 1 — mundane |
| SPARROW | 15 | `#A4B787` | house sparrow, cheerful | the Moon (crescent, friendly face optional) | 2 — familiar |
| STARLING | 30 | `#6FC3DF` | starling mid-flight, iridescent hint | Mars (rust, tiny polar cap) | 3 — uncommon |
| KINGFISHER | 60 | `#43D8B0` | kingfisher diving, electric teal | Jupiter (bands + Great Red Spot) | 4 — impressive |
| MEGA | 85 | `#FFC53D` | exotic bird-of-paradise silhouette | Kuiper Belt object / icy comet | 5 — spectacular |
| RARE BIRD | 100 | `#FF5D8F` | mythical-feeling bird, crest lit | **friendly original alien** waving | 6 — once-in-a-game |

**Escalation rhythm (critical):** step 1–2 are quiet and grounded; 3–4 add motion and colour; 5 adds spectacle; 6 is a small firework. Each step must be instantly rankable against its neighbours (show all six in a row: could a stranger order them?).

## 3. Palette rules
- Backgrounds stay in the existing gradients (dusk `#05070F→#2B3A67`, cosmos `#020208→#101A3F`). Your art adds **local colour**, not new backgrounds.
- Each tier asset uses its canonical hex as the dominant accent, plus 1–2 neighbouring hues. Muted fill + vivid accent > fully saturated blob.
- Neutral ink `#EEF3F7`, dim `#9FB0CC`, panel `rgba(255,255,255,.06–.10)`.
- Produce `palette.json`: `{ theme: { tokens: { name: hex } } }` listing every colour you used.

## 4. Shape language
- **Rounded > sharp.** Corner radius feel ≈ 12–16px equivalents. Nothing aggressive.
- Dusk Birds: organic curves, feather-teardrop motifs, soft paper grain (subtle noise, ≤ 6% opacity).
- Cosmic Voyage: circles/orbits/ellipses dominate; friendly asymmetry (one crooked antenna beats a symmetric robot).
- Every tier portrait = **one clear silhouette**. If the inner 80% cropped is unrecognizable, redesign. Test at 24px.
- Greyscale test: silhouette + detail density must keep all six tiers distinguishable with colour removed.

## 5. Typography (only where the brief allows text: logos)
- Wordmark "RAREBIRD": chunky rounded lowercase, tracking +2%; "RARE" in ink `#EEF3F7`, "BIRD" in tier-gold `#FFC53D`. One subtle feather/star spark allowed. Cosmos variant may swap the spark for an orbit ring.
- `logo-mark.svg` = the bird/alien icon alone, works at 16px.

## 6. Mood per theme
- **Dusk Birds:** golden hour into blue hour. Calm, warm, a little nostalgic. The reveal should feel like dusk birdwatching with friends — cozy stakes.
- **Cosmic Voyage:** 2 a.m. telescope session. Vast, quiet wonder, tiny heroes. The reveal feels like a mission-control ascent. NEVER menacing: aliens are curious, space is soft, darkness is velvety not hostile.

## 7. Do / Don't
- ✅ Do vary line weights (2–4px strokes at 512 canvas) for liveliness.
- ✅ Do leave breathing room — mobile screens crop.
- ❌ Don't use drop shadows heavier than 20% opacity.
- ❌ Don't use pure black `#000` or pure white `#FFF`.
- ❌ Don't add religious, national, or brand symbols.
- ❌ Don't copy pose/composition from Wingspan cards, Krillion art, or emoji designs — the current emoji are placeholders you're replacing, not references to mimic.

## 8. Reference materials available to you
- Live screenshots: `../screenshots/*.png` (current UI, tier chips, reveal screen with altitude ladder, cosmic theme screenshots `cosmos_*.png`).
- The fx layer contract (how art is consumed): `05_MANIFEST_AND_INTEGRATION.md` next file, and `../05_UI_UX_SPEC.md` §0a for the animation philosophy.
