# 00 · Executive Decision

**Working title:** **RAREBIRD** — the rarity party game
**Decision date:** 2026-10-23 · **Status:** design package complete, ready for implementation
**Read next:** `02_GAME_DESIGN_DOCUMENT.md` (the game), `08_IMPLEMENTATION_HANDOFF.md` (what to build first)

---

## 1. The concept in one paragraph

A free, no-signup browser party game for 2–12 friends on their phones. Everyone joins a room with a 4-letter code and a nickname. Each round shows the **whole room the same open-ended category at the same moment** ("Name a country"), and everyone secretly types one answer under a shared 30-second clock. When the clock ends, answers are revealed **one by one, least rare first**: common answers score a little ("Pigeon · 10"), genuinely obscure-but-valid answers score a lot ("Rare Bird · 100"). Identical answers get a **TWINS 👯** badge — a story, not a penalty. After 3–7 rounds the podium screen crowns the group's champion of obscure knowledge, and **one tap starts a rematch** with the same friends. The metaphor is birdwatching: answers are *sightings*, the score is your *life list*, and the rarest birds are worth the most.

## 2. Why this concept wins (selection rationale)

Eight materially different concepts were developed and compared (full comparison in §3; each concept's loop, risks and fastest experiment were worked through):

| # | Concept | Verdict |
|---|---|---|
| A | **RAREBIRD** — simultaneous hidden answers + synchronized tiered reveal in private rooms | **SELECTED** |
| B | Faithful solo daily + async friend leaderboard (pure Krillion clone) | Rejected as primary — no live togetherness; weakest fit for "play together during a break" |
| C | Hot-potato elimination (Puffer Party clone) | Rejected as primary — spectator downtime scales with group size; already exists officially; kept as future mode |
| D | Brainstorm + duplicate-jinx (Jinxed clone) | Rejected — typing many answers on phones is laborious; punitive coincidence |
| E | Predict-the-majority (Family Feud inversion, Noillirk-style) | Rejected as primary — friend groups of 4–8 are too small a sample; kept as future mode |
| F | Hi/Lo rarity duels on live external data | Rejected — external API dependency at round time; 2-player focus conflicts with group play |
| G | "Deep Cut Draft" — asymmetric bluffing with hidden rare answers | Rejected — complex rules teach poorly in a 15-minute break; high design risk |
| H | Trend-spotter (rising/falling interest over time) | Rejected — authoring-heavy; niche; kept as possible seasonal mode |

**Why A wins on the evidence:**

1. **It keeps the proven core intact.** Krillion's daily loop (validated by ~25k-person subreddit, #1 daily-game chart, first-hand play) is: prompt → one rare valid answer → tiered payoff. RAREBIRD changes only *who you play with* — the mechanic risk is minimal, exactly what the mission brief prefers ("a faithful implementation of the basic game loop is an entirely acceptable first release").
2. **It fixes the reference's biggest social gap.** Krillion solo is asynchronous comparison; Puffer Party (official multiplayer) is turn-based, so 5 friends watch one friend type. Simultaneous play + synchronized reveal gives every player agency in every second of a short break, and the reveal — the emotionally strongest moment of rare-answer games — becomes a shared spectacle. Neither Puffer Party (turns) nor Jinxed (many-answer typing strain) occupies this slot.
3. **It fits the constraints precisely.** Phones, no install, no registration, 6–10-minute sessions, rematch in one tap, 2–12 players, one small server (fully simulated and prototyped — see below).
4. **Its differentiation is real but cheap.** TWINS badge, visible rarity percentiles ("only 9 of 195 answers are rarer"), a missing-answer report button, and the birdwatching identity differentiate from Krillion without changing the proven loop.

## 3. Research basis (what was actually investigated, not assumed)

| Question | Method | Finding |
|---|---|---|
| How does the reference game actually work? | Scripted Chromium played multiple full Krillion dives; captured timers, tiers (10/15/30/60/85/100), retry-on-invalid, fuzzy-correct-with-confirm, prompt style, results screen | `01_REFERENCE_GAME_ANALYSIS.md` §2 |
| How does its official multiplayer work? | Hosted a private Puffer Party room; drove 3 automated players through a complete match to the victory screen | §3 of same |
| What do competitors do? | First-hand Jinxed rules; research on Noillirk/Playdaily clone, genre lineage (Pointless, Scattergories, Family Feud) | §4–6 |
| Can answers be validated without live APIs? | **Built the pipeline**: Wikidata SPARQL (CC0) → 197 sovereign states; Wikimedia Pageviews (CC0) → 197/197 fetches succeeded; editorial dedup caught real traps (Netherlands/"Kingdom of the Netherlands" duplication; news traffic making Yemen look like a "top" answer) | `04_CONTENT_AND_SCORING_SPEC.md` |
| Does the scoring produce good competition? | **Simulated 20,000 games** × 5 strategies × 5 timing scenarios: rarity-seekers beat obvious-pickers (core appeal holds); 30s timer keeps deep vs smart strategies in near-perfect tension (48.6% vs 49.3% win share); 20s and 45s timers each make one approach dominant | `06_TEST_PLAN_AND_RESULTS.md` |
| Does the multiplayer loop actually work? | **Built a disposable prototype** (Node + ws + the reference rules engine) and verified with independent browser sessions: 3-player full game, standings correct (rare-picker won 260:55:30), rematch votes, mid-round reconnect, invalid feedback, fuzzy-suggestion confirm — plus the same flow again through the **public HTTPS/WSS URL** via instabox-port | `06` §4–6 |
| Is browser→server WebSocket viable on this host? | Echo server published via `instabox-port publish`, WSS round-trip confirmed | `07_DEPLOYMENT_AND_OPERATIONS.md` |

## 4. Key trade-offs accepted

- **Editorial tiers over purely computed tiers.** Pageviews measure attention, not answer-likelihood (the Yemen problem). Tiers are authored per catalogue using pageview percentiles as *evidence*, with an explicit editorial pass. Cost: content needs human review. Benefit: fairness that matches player intuition + full offline operation.
- **Simultaneous rounds over turn-based play.** Cost: no watching-the-holder-sweat drama (that's Puffer Party's strength). Benefit: zero downtime — decisive for 15-minute breaks.
- **TWINS as a badge, not a penalty or bonus (MVP).** Coincidental matching shouldn't punish friends (Jinxed's choice) and shouldn't reward piling onto common answers. The badge creates the story ("we're synced") without distorting strategy. Revisit after playtest with a data-driven switch.
- **No daily mode at launch.** The party loop is the product; a solo daily (same-prompt-for-everyone, midnight-local reset) is the natural v1.1 retention layer once the core is proven with real groups.
- **No accounts, no persistence beyond the room.** Rooms live in memory and die 5 minutes after the last player leaves. The only stored artifacts are anonymous missing-answer reports. This is a privacy feature for a minors-adjacent audience, and a simplicity win.

## 5. What was tested and what wasn't

**Tested (with artifacts in this package):** rules engine (38 unit tests), scoring behaviour across answer classes, tie-breaks, strategy balance simulations, content pipeline on two real categories, full multiplayer loop across independent browser sessions, deployment path including public WSS.

**Not tested:** whether the game is *fun* for real 15-year-olds. Bots completing rounds is not fun; only a playtest can establish that. `06_TEST_PLAN_AND_RESULTS.md` §8 defines the playtest protocol and the keep/revise/abandon criteria. No human playtest data exists yet and none is claimed.

## 6. Where everything lives

```
rarebird-design/
├── README.md                        ← index + glossary (start here)
├── 00_EXECUTIVE_DECISION.md         ← you are here
├── 01_REFERENCE_GAME_ANALYSIS.md    ← first-hand evidence, screenshots/
├── 02_GAME_DESIGN_DOCUMENT.md
├── 03_MULTIPLAYER_TECHNICAL_SPEC.md
├── 04_CONTENT_AND_SCORING_SPEC.md
├── 05_UI_UX_SPEC.md
├── 06_TEST_PLAN_AND_RESULTS.md
├── 07_DEPLOYMENT_AND_OPERATIONS.md
├── 08_IMPLEMENTATION_HANDOFF.md     ← for the implementing agent
├── 09_DECISIONS_AND_OPEN_QUESTIONS.md
├── sample-content/starter-pack.json ← real generated pack (195 countries, 118 elements)
├── validation/                      ← executable tests + simulations (node, zero deps)
└── prototype/                       ← disposable verified prototype (NOT production code)
```
