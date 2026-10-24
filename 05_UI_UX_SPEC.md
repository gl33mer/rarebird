# 05 · UI/UX Specification — RAREBIRD

Mobile-first, thumb-only, one-hand portrait use. The verified prototype (`prototype/public/index.html`, screenshots `screenshots/rb_*.png`) implements the skeleton of every screen below; this document is the target design for production.

---

## 0a. The altitude metaphor + fx layer (added 2026-10-23, field round 3)

**Altitude = rarity.** Krillion's mirror-image: answers don't sink, they **fly**. PIGEONs stay near the ground; a RARE BIRD soars to the stratosphere. Implemented in the prototype as the reveal's centerpiece: each answer card flies from the bottom of the sky to its tier's altitude band, with a tier-name altitude ruler up the left edge ("the flock ascends"). The ambient background is a layered dusk sky whose bands double as altitude zones — stars and aurora live where the rare birds fly. (Owner asked: fly higher, farther, or migration? Decision: **flying higher** for round-to-round scoring; **migration** is reserved as the future campaign/pack-progression metaphor — a pack is a "migration route".)

**Graphics & animation layer (`prototype/public/fx.js`)** — built to scale, framework-free:
- One table (`TIER_LADDER`) drives all tier visuals (colour, emoji, altitude fraction) — restyling is a one-file change.
- Declarative API: `FX.ambient()` (sky/clouds/stars), `FX.ascend(el, tier)` (flight to altitude), `FX.burst(x, y, {tier})` (pooled particles, capped 60), `FX.countdown(el, n)`, `FX.shake(el)`.
- Hard rules baked in: animate only `transform`/`opacity`; every spawn self-cleans; `prefers-reduced-motion` collapses to fades. Production swaps sprite sheets/Lottie in **at the same call sites** — no logic changes.

## 0b. Art-direction note (added 2026-10-23, from owner feedback)

The flock/birdwatching metaphor should carry the art: think **field-guide-meets-Wingspan mood** — illustrated bird portraits per tier family (pigeons → rare birds), paper-grain backgrounds, hand-lettered numerals, habitat backdrops per content pack (woods / coast / city). **IP guardrail:** Wingspan (Stonemaier Games) is a protected commercial work — we take mood-level inspiration only (naturalist illustration, warm palette, calm typography), never its art, card layouts, iconography or trade dress. Produce a mood board + style frames in M5 before committing art (see `09` Q-08).

## 1. Design principles
1. **One column, one action per screen.** The next thing to do is always the biggest element.
2. **The reveal is the show.** Everything else is a stagehand.
3. **Readable at arm's length** — 16px minimum body, 44px touch targets.
4. **No modal tutorials.** Rules are learned by round 1 (the reveal teaches tiers instantly).
5. **Dark, cozy, high-contrast** — break-time corridors, sunlight readability secondary to evening vibes, but keep WCAG AA contrast.

## 2. Visual direction
- **Identity:** birdwatching field-notebook × neon dusk. Background deep navy-charcoal `#101418`; cards `#1A2028`; ink `#EEF3F7`; accent warm gold `#FFB703` (binocular glint).
- **Tier colours** (chips + reveal): PIGEON grey `#7A8A99` · SPARROW sage `#9AA87A` · STARLING sky `#5FB0D9` · KINGFISHER teal `#4DD4AC` · MEGA gold `#FFB703` · RARE BIRD pink `#FF5D8F`.
- **Type:** system stack for reliability (production may swap in a display face for headings only); tabular numerals for timers/points.
- **Motion:** rows pop in (350ms, 450ms stagger); tier chip flips colour; RARE BIRD rows get a 1.2s feather-burst + chirp. All animations respect `prefers-reduced-motion`.
- **Sound:** optional; single chirp per reveal row, deeper coo for PIGEON, sparkle for RARE BIRD; mute toggle persisted. Off by default on first run (school!).

## 3. Screens (S1–S5) and navigation

```
S1 HOME ──create──► S2 LOBBY ──host start──► S3 ROUND ⇄ S4 REVEAL ──last──► S5 RESULTS
   │                    ▲                      (server-driven loop)              │
   └──── join by code ──┘◄────────────── rematch (majority) ───────────────────┘
```

### S1 · Home
```
┌──────────────────────────────┐
│  RARE(BIRD)  🦜              │  wordmark, "spot the rarest answer"
│  ┌────────────────────────┐  │
│  │ Your nickname          │  │  persisted locally
│  └────────────────────────┘  │
│  [   Create a room       ]   │  primary (gold)
│  ┌──────┐  [ Join ]          │  4-char code box + ghost button
│  │ CODE │                    │  numeric-ish keyboard, auto-uppercase
│  └──────┘                    │
│  one answer per round · the  │
│  rarest valid answer wins    │  one-line rules footer
└──────────────────────────────┘
```
States/errors: bad code → inline red line ("No room with that code"); game in progress → "Already flying — try again later"; full → "Room is full".

### S2 · Lobby
- Big **room code** (44px, letter-spaced, tap = copy + share sheet on mobile: `navigator.share` fallback clipboard).
- Player pills (host ★, offline = greyed strikethrough, answered-state not shown here).
- Host-only row: **Rounds: 3/5/7** stepper · **Timer: 20/30/45** · **Start** (disabled <1 player).
- Non-hosts: "Waiting for ⟨host nick⟩ to start…" + Leave.
- Auto-join note when solo: "Playing alone? Great for practice."

### S3 · Round (WRITING)
```
┌──────────────────────────────┐
│ Round 2 of 5                 │
│ ┌────────────────────────┐   │
│ │   Name a country.      │   │  24px bold, centered
│ │   (like France)        │   │  dim; "195 valid answers exist"
│ │        21               │   │  40px timer, warn ≤8s (red pulse)
│ │ [ type your answer… ]  │   │  input; Enter = send
│ │ [        Send        ] │   │
│ │ ✗ No echo! Try again.  │   │  invalid flash (shake, 200ms)
│ │ ⟲ Did you mean “Vanuatu”? │ │  suggestion chip: [Submit it] [Keep typing]
│ │ ✓ Vanuatu — locked in  │   │  settles input (disabled) + bird icon
│ │ 2/5 locked in           │  │  live answered count
│ └────────────────────────┘   │
└──────────────────────────────┘
```
- Countdown state (3s): full-bleed "On its way…" with three dots; timer replaces it at round start.
- Input stays enabled after invalid; disabled after lock; keyboard never auto-closes.

### S4 · Reveal
- Title: "Round 2 — the flock answers".
- Rows appear bottom-up **least points first** (NO SIGHTING rows last): `[tier chip] [nick] “answer” [TWINS ×2] [+pts]`.
- Under each rare row (≥KINGFISHER): *"only 9 of 195 valid answers are rarer"* (transparency line — kills the "why 60 not 30?" argument).
- Progress to next round: thin feather bar; host sees **Skip ▸**.
- Example (from the verified prototype screenshot `rb_reveal_public.png`): PIGEON PubB "Gold" +10 → KINGFISHER PubA "Iron" +60 with staggered pop-ins.

### S5 · Results (podium)
- "FLOCK RESULTS" + top-3 podium graphic (perches at heights).
- Best sighting card (dashed gold): "🦆 Best sighting: Bob — 'Saiga' (RARE BIRD, +100)".
- Full standings table: place · nick · pts (countback note on ties: "won on rare sightings").
- **[Rematch 🔁]** + live vote line "2/5 want a rematch…" · [Leave].
- On rematch: straight to countdown; same players.

## 4. Player states (visibility rules)
| State | Lobby pill | Round | Reveal row |
|---|---|---|---|
| connected, not answered | normal | — | — |
| connected, locked | normal + ✓ | "✓ locked" + count | normal row |
| disconnected | greyed ✕ | other players see count exclude them | NO SIGHTING row (grey) |
| host | ★ | — | ★ next to nick |
| rejoined mid-round | un-greys | resume with remaining time + pending chip | normal |

## 5. Interaction details
- **Code input:** uppercase-only, 4 chars, auto-advance focus; paste-tolerant (strips non-alphanumerics).
- **Answer input:** `autocapitalize=off autocorrect=off spellcheck=false` (avoid OS interference — misspellings are our job), maxlength 64, Enter submits, focus held after invalid.
- **Suggestion chip** appears only server-side `suggest`; [Submit it] locks the canonical; [Keep typing] dismisses (can retrigger by resubmitting).
- **Share button (lobby):** `navigator.share({title:'RAREBIRD', text:'Join my flock — code HAZJ', url})` → clipboard fallback + toast "Copied!".
- **Back/refresh:** identity in localStorage auto-resumes into the room (verified). "Leave room" clears it.
- **Double-send guard:** Send disabled while an ack is pending (≤300ms typical).

## 6. Accessibility
- Contrast ≥4.5:1 for text (tier chips use dark text on colour fills).
- Every interactive element ≥44×44px; focus-visible rings; logical tab order (desktop works fine too).
- `role="timer"` + `aria-live="polite"` on round timer; reveal rows announced via live region ("Bob, Saiga, Rare Bird, one hundred points").
- `prefers-reduced-motion`: stagger→0ms, pop→fade.
- Colour-independent tier identity: chip labels always include the tier NAME, never colour alone.
- No audio-required information; sounds are decorative.

## 7. Content safety
- Nickname denylist (small profanity list server-side; violations get "Birder123"-style replacement, not a block — keep it playful and friction-free).
- Answers are validated against catalogues; raw free text never echoes to other players except the player's own typed string in their reveal row (capped 64 chars, escaped).
- Footer: "Answer data: Wikidata (CC0) · Wikimedia Pageviews (CC0)" + "No accounts · nothing saved about you".

## 8. Out of scope for MVP UI
Public room browser, ratings, profiles, spectate links, share-result cards (podium screenshot via OS is fine for now), themes, dark/light toggle (dark only).
