# 04 · Shared UI Assets (both themes)

Small, precise, used by both themes. Icons follow one family: **2.5px stroke (at 96 canvas), rounded caps/joins, single accent colour `#9FB0CC` with the active state in `#FFC53D`**, transparent backgrounds, no text, 96×96 viewBox.

## Icons — `shared/icons/` (P2, but quick wins)
| File | Depicts | States |
|---|---|---|
| `chat.svg` | speech bubble, tail bottom-left (matches the drawer side) | one glyph |
| `mute-on.svg` / `mute-off.svg` | speaker with/without waves; off = speaker + slash | pair must differ at 20px |
| `wager-dice.svg` | six-side die, 3 pips diagonal | gold pips `#FFC53D` |
| `share.svg` | node-link share glyph | one glyph |
| `report-flag.svg` | small pennant flag | one glyph |
| `crown.svg` | simple 3-point crown, winner flair | gold |

## Chips & states — `shared/ui/` (P1)
- `chips/tier-chip.svg` — 220×72 rounded chip (radius 16) with a left 6px tier-colour notch area and a subtle inner texture; the app tints via CSS. Design so tier text (app-rendered) sits centre-left with an icon slot at left (16px inset).
- `ui/empty-perch.svg` — 320×240 dashed silhouette of a perch with a question-mark bird outline: shown when a player has NO SIGHTING (timed out). Dignified, not sad-shaming: bird is "still migrating".
- `ui/loading-bird.svg` — 160×160 bird silhouette leaning forward as if about to fly (loading state for both themes; in cosmos the app adds an orbit ring around it via CSS).

## Social & app identity — `shared/` + `favicon/` (P2)
- `shared/og-cover.png` — 1200×630: split-diagonal composition, dusk birds left / cosmic voyage right, centred wordmark "RAREBIRD", tagline "the rarest right answer wins", room-code chip visual (e.g. `“K3PW”`). This is the link-preview image when invites are shared — make it sell the game in one glance.
- `favicon/icon.svg` — simplified logo-mark, 64×64.
- `favicon/favicon-16.png`, `favicon-32.png`, `favicon-180.png` — exports (flat, high-contrast on dark browser tabs).

## Motion affordances (design FOR animation)
Several assets get animated by the app's fx layer. Build them animation-ready:
- Tier portraits: keep the subject's centre-of-mass near canvas centre (the app bobs/hovers them ±4px).
- `feather.svg` / `stardust.svg` bursts: design the particle upright; the app rotates randomly.
- `rocket.svg`: leave 10% empty space below the flame (the app stretches the flame via CSS scaleY).
- `earth.svg`: perfectly round silhouette (the app scales it down round-trip each round).
- Everything must also work as a static image (`prefers-reduced-motion` users see no animation).
