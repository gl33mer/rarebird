# 02 · DEEP VISUAL QA RUN (you are the eyes)

**Goal:** a systematic, screenshot-driven visual audit of the live client on YOUR port-3100 instance (after 01, or standalone against current emoji UI) — finding layout/rendering/UX defects a text model can't see. You have vision; use it on your own screenshots.

## Method
1. Serve the client (port 3100, per 00 rules). Use Playwright (chromium path in 00) with contexts at: 390×844 (iPhone), 320×568 (small), 768×1024 (tablet).
2. Walk EVERY screen: home (empty + error states: bad code, locked room), lobby (1/3/12 players, host vs non-host, kick ×, theme chip, lock toggle), countdown (both themes), round (typing, invalid + report link, suggestion chip, ambiguous chips, locked, Top Call placed, timer warn ≤8s, 2/5 locked-in counter), reveal (solo + 5 players; PIGEON→RARE BIRD rows; SPLIT×n badge; ×2/½ badges; rarity lines; ruler labels per theme), podium (1/2/3 places, tie), chat drawer (presets, unread badge).
3. Interleave real games: 3 contexts playing to completion (answers from `prototype/pack.json` catalogues), incl. one Twins/SPLIT round (two contexts submit the same MEGA+ answer) and one Top Call round.
4. For each screenshot: LOOK at it. Check: nothing clipped/overlapped (esp. mute button vs titles, safe-area bottoms), text ≥13px readable, contrast on dark bg, tap targets ≥44px, tier colors distinct, animations land (no mid-flight captures for the "settled" shot — wait 3s).
5. Also emulate: prefers-reduced-motion, 200ms network throttling (does the countdown still pace?), a forced stale client (v-1 → pink update banner shows).

## Deliverables (flash-directives/FINDINGS.md + shots/)
- Defect table: `ID | screen | viewport | severity (block/major/minor) | screenshot path | suggested fix`. Number them FQ-1, FQ-2…
- For each defect you can fix CONFIDENTLY within CSS/HTML (padding, overlap, z-index, font-size): fix it on your branch, note before/after screenshots. Anything touching game logic or the rules engine: report only.
- A one-paragraph verdict per theme: "ships as-is" vs "needs X".

## Known suspects (from earlier QA rounds — verify fixed, not assumed)
Mute button overlapping headers on reveal/podium; ruler labels legibility at 320px; first reveal row vs caption spacing; emoji fallback boxes in headless (fine on phones — confirm on the matrix); chat drawer z-index over lobby controls.
