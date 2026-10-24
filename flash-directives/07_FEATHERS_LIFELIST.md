# 07 · FEATHERS ECONOMY + LIFE LIST COLLECTION

**For:** GLM-5.3 Flash · **Branch:** `flash/economy-v1` · rules from `00_ENVIRONMENT_AND_RULES.md` apply (never touch :3000; :3100 yours; version handshake → next integer; FINDINGS; defect IDs EC-1…). **Run this AFTER the graphics-depth run** (or standalone if graphics is deferred).

## Design rationale (owner ideas, MAX-scoped — read first)
Two owner proposals, both good when session-scoped: **(1) Splendor-style spendable tokens** — solves a real flaw: Top Call is currently free to press, so pressing it when confident is a no-brainer. A scarce stake makes it a decision. **(2) Card collection** — the review's "life list" retention idea (D-30); **no login ever** (privacy posture for minors is a hard constraint) — localStorage only. If either feature wants an account to "work properly", cut the feature instead.

## Feature 1 — Feathers (session economy, server-authoritative)
- Each player starts **3 feathers** per game (not per round; reset on rematch). **Display is theme-flavored (D-40): 🪶 "Feathers" in Dusk Birds, ⭐ "Starlight" in Cosmic Voyage — one client map `{birds:['🪶','Feathers'],cosmos:['⭐','Starlight']}`, server state/protocol stays `feathers`.** Shown as count next to the life-list score in the round HUD and in the lobby pill row.
- **Top Call now costs 1 feather**: the 🎯 button shows the cost and is disabled at 0. Server rejects `wager` when the player has 0 feathers (`answerAck {status:'wager_no_feathers'}`).
- Resolution (in `endWriting` scoring): doubled outcome → **+2 feathers back** (net +1); halved outcome → stake stays lost. Feathers persist across rounds within the game.
- Server state: `room.feathers: Map<pid, int>`; include `feathers` per player in `publicRoom`; deduct on accepted wager; credit on 'doubled' at scoring; reset in `startCountdown` (game start) and rematch.
- Client: feather chips animate (-1 on press, +2 pop on win); disable state syncs from `state`.
- Balance gate: sim extension — add `smartW3` (smart + spends all 3 feathers on its three most-confident rounds by recall-latency heuristic) to `validation/simulate.mjs` playRound results plumbing; report whether feather-scarcity changes smartW vs smart win share materially (expectation: slight, not dominant). Unit tests: economy transitions (start 3, reject at 0, +2 refund) in a new `prototype/verify/verify-economy.js` protocol test + extend `validation/rules.test.mjs` ONLY if you add pure functions (do not modify existing scoreRound semantics — Top Call ×2/½ math is unchanged; feathers wrap it).
- Config: `settings.feathers: 'on' | 'off'` (default on) so we can A/B in playtests.

## Feature 2 — Life List (local-only collection)
- On every reveal where YOUR row is `MEGA` or `RARE BIRD`: record `{canonical, tier, promptId, text, ts}` into `localStorage['rarebird-lifelist']` (dedupe by promptId+canonical; cap 500).
- UI: a "🃏 Life List" button on the results screen and lobby (next to theme toggles) opens a full-screen modal: grid of cards — each card = the tier portrait art (already in the manifest: `MEGA`/`RARE BIRD` sprites per theme), the answer name, prompt text small, tier ribbon in tier color. Count badge on the button ("12").
- A landing animation when a new card is earned: after the reveal row lands, a small card flies from the row to a corner "collection" pocket (transform-only, 800ms) — the collectible dopamine moment.
- Share: "Copy collection" button → clipboard text summary (`RAREBIRD life list 🦜 — 12 cards: Vanuatu (RARE BIRD) · …`). No canvas/image export this run.
- No server involvement at all (no protocol changes; server never sees the life list). Test: `verify-lifelist.js` — play a solo game landing a MEGA+, assert localStorage populated, modal renders cards, dedupe works, copy button fills clipboard.

## Tests & gates
All existing suites green on :3100 + the two new verifies + rules 62/62 (or more if you added unit tests). Economy assertions in a 3-player browser game: one player spends to 0, rejection path exercised, refund on doubled round. FINDINGS with exact numbers; version bump both sides; branch pushed.
