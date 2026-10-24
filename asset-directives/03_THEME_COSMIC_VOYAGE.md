# 03 · Theme Brief: COSMIC VOYAGE (space theme)

**Metaphor in play:** rarity = distance from Earth. Common answers never leave low orbit; the rarest answers reach interstellar space — and **meet friendly aliens** (the owner's favourite bit — make those two aliens the stars of this theme). The app currently uses emoji (🌍 shrinking each round, 🚀 countdown); you replace all of it.

---

## T1 · Tier milestones — `themes/cosmic-voyage/tiers/` (P0)

Six square 512×512 assets = stations along the journey (NOT six planets in a row — vary object types):

| File | Object | Notes |
|---|---|---|
| `low-orbit.svg` | small satellite / orbital probe with tiny solar panels | mundane, slightly tired-looking (it's the pigeon tier) |
| `the-moon.svg` | crescent Moon, friendly, optional subtle crater-face | familiar warmth |
| `mars.svg` | rust-red planet, thin polar cap, tiny dust devil | uncommon |
| `jupiter.svg` | banded giant with Great Red Spot, one small moon crossing | impressive; keep bands soft |
| `kuiper-belt.svg` | icy comet/kuiper object with glowing tail | spectacular, cold palette + tier gold accents |
| `interstellar.svg` | a **friendly original alien** waving from a tiny saucer + a distant sun glint | the RARE BIRD equivalent: once-in-a-game |

Alien design rules (both alien files): original species, 2–4 colours, big eyes or expressive equivalent, clearly benevolent, no resemblance to known IP (no E.T., Yoda, Stitch, Klingon silhouettes). Cute beats cool when in doubt.

## T2 · Alien encounter bonus — `themes/cosmic-voyage/tiers/aliens/` (P1)

- `alien-mega.svg` — second alien species (tall, curious, holding a star chart). Used at MEGA tier landings.
- `alien-interstellar.svg` — if distinct from `interstellar.svg`'s waver, make this the "greeting committee" version (two small aliens); otherwise a close-up bust.
These two are the emotional payoff assets — give them the most character of the whole bundle.

## T3 · Ambient — `themes/cosmic-voyage/ambient/` (P1)

- `starfield-tile.svg` — 512×512 **tileable** (edges must wrap seamlessly): 3 star sizes, one or two with 4-point sparkle. Dark-transparent background; the app tiles + parallaxes it.
- `nebula-1.svg` (violet-dominant), `nebula-2.svg` (rose-dominant) — ~800×800 soft radial clouds, ≤ 22% opacity feel, blurred-edge vector shapes.
- `earth.svg` — 512×512 our Earth, soft blue-glow rim, gentle smile NOT required but approachable; must look good at 64px (game-start size) and 18px (final round, far away).
- `sun.svg` — small warm sun/glint for the far background, 256×256.

## T4 · Countdown — `themes/cosmic-voyage/countdown/` (P1)

- `rocket.svg` — 320×480 friendly rocket (rounded fins, one round window, tiny flame); reads at 48px. The app launches it during 3-2-1.

## T5 · Podium — `themes/cosmic-voyage/podium/` (P1)

- `launchpad-1.svg` / `launchpad-2.svg` / `launchpad-3.svg` — 400×420 landing platforms: 1st = full gantry launch pad with laurel-ish rocket ring (gold), 2nd = pad with service arms, 3rd = flat marker pad. Transparent bg.

## T6 · Logo — `themes/cosmic-voyage/` (P2)

- `logo.svg` — wordmark "RAREBIRD" per brand guide with an orbit ring replacing the spark; optional tiny rocket dot on the orbit.
- `logo-mark.svg` — waving-alien head OR rocket-bird hybrid mark; legible at 16px.

## T7 · Cross-theme coherence check (self-QA before delivery)

Place the six dusk-bird portraits and the six cosmic milestones in two rows. A stranger must read BOTH rows as the same ladder of 6 escalating rarities. If the cosmic row reads flatter, push spectacle on kuiper/interstellar.
