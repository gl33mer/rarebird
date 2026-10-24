# RAREBIRD — Design Package

**A browser party game of absurd knowledge: everyone answers the same open prompt at the same moment; the rarest valid answer wins the round.** For ~15-year-old friends on phones during school breaks. No app, no account — a nickname and a 4-letter code.

Package status: **complete, tested, ready for implementation handoff.** Created 2026-10-23 on the InstaBox sandbox by the design agent; next stage: GLM-5.3 Flash Vision builds the production game from `08_IMPLEMENTATION_HANDOFF.md`.

## Reading order

| Doc | What's inside |
|---|---|
| [`00_EXECUTIVE_DECISION.md`](00_EXECUTIVE_DECISION.md) | The chosen concept, why it beat 7 alternatives, research basis, trade-offs |
| [`01_REFERENCE_GAME_ANALYSIS.md`](01_REFERENCE_GAME_ANALYSIS.md) | First-hand analysis of Krillion (daily + Puffer Party), Jinxed, clones; screenshots |
| [`02_GAME_DESIGN_DOCUMENT.md`](02_GAME_DESIGN_DOCUMENT.md) | Rules, loop, scoring, worked sessions, edge cases, modes |
| [`03_MULTIPLAYER_TECHNICAL_SPEC.md`](03_MULTIPLAYER_TECHNICAL_SPEC.md) | Architecture, room lifecycle, state machine, wire protocol, disconnects, exploits |
| [`04_CONTENT_AND_SCORING_SPEC.md`](04_CONTENT_AND_SCORING_SPEC.md) | Prompt schema, catalogue pipeline (Wikidata+pageviews, CC0), tiers, validation, launch content plan |
| [`05_UI_UX_SPEC.md`](05_UI_UX_SPEC.md) | Mobile screens, wireframes, states, accessibility, visual direction |
| [`06_TEST_PLAN_AND_RESULTS.md`](06_TEST_PLAN_AND_RESULTS.md) | Everything actually tested + results (38 unit tests, 20k-game sims, multi-browser runs, public-URL run) + human playtest protocol |
| [`07_DEPLOYMENT_AND_OPERATIONS.md`](07_DEPLOYMENT_AND_OPERATIONS.md) | Dev setup, InstaBox deployment (verified), ops runbook |
| [`08_IMPLEMENTATION_HANDOFF.md`](08_IMPLEMENTATION_HANDOFF.md) | Milestones, source tree, contracts, verification gates — **start here to build** |
| [`09_DECISIONS_AND_OPEN_QUESTIONS.md`](09_DECISIONS_AND_OPEN_QUESTIONS.md) | Decision log D-01…D-14, open questions, assumptions, full reference list |

## Asset production & review (added 2026-10-24)

- **[`asset-directives/`](asset-directives/)** — the production brief for GLM-5.3 Flash (vision): explicit instructions, exact filenames, manifest schema and QA gates for the **Dusk Birds** and **Cosmic Voyage** art packs plus shared UI assets (and optional themed content-pack drafts). Start at `asset-directives/00_MASTER_INSTRUCTIONS.md`. Integration of delivered assets is done back here (GLM-5.3 MAX) per `05_MANIFEST_AND_INTEGRATION.md`.
- **[`REVIEW_GUIDE.md`](REVIEW_GUIDE.md)** — brief for an independent external review of this design package (security, privacy/minors, robustness, ops), with pointed questions and a requested output format.

## Executable artifacts

- **`validation/`** — dependency-free Node tests + simulations:
  - `node validation/rules.test.mjs` → 41/41 passing (scoring contract).
  - `node validation/simulate.mjs` → strategy-balance tables (see `06` §3).
- **`sample-content/starter-pack.json`** — a real generated pack: 195 countries + 118 elements (Wikidata CC0 + Wikimedia pageviews), plus 3 hand-authored demo prompts.
- **`prototype/`** — the **verified disposable multiplayer prototype** (Node + ws). Not production code; it proves the loop and deployment path:
  ```
  node prototype/server.mjs            # http://localhost:3000
  instabox-port publish 3000           # public URL (verified working)
  node prototype/verify/verify-rarebird.js   # multi-browser automated test (needs playwright-core + chromium)
  ```
- **`content-pipeline/`** — the executable Wikidata→pageviews→pack scripts that generated the sample pack.
- **`research-notes/`, `screenshots/`** — raw evidence from the reference-game investigation.

## Glossary

| Term | Meaning |
|---|---|
| **Sighting** | A submitted answer (birdwatching metaphor). |
| **Life list** | A player's total score (birder's checklist term). |
| **Catalogue** | The finite list of valid answers behind one prompt, server-side secret until reveal. |
| **Tier** | Rarity band of an answer within its catalogue: PIGEON 10 · SPARROW 15 · STARLING 30 · KINGFISHER 60 · MEGA 85 · RARE BIRD 100. |
| **rarityPct** | Percentile of an answer's popularity within its catalogue (100 = rarest). |
| **TWINS** | Two+ players giving the same canonical answer in one round; badge only, no score change. |
| **No echo** | Invalid-answer feedback; the player may retry while the clock runs. |
| **Suggestion chip** | "Did you mean X?" fuzzy-match confirm UI. |
| **NO SIGHTING** | Reveal row for a player who locked nothing / timed out. |
| **Countback** | Tie-break by counting higher tiers (RARE BIRD, then MEGA, then KINGFISHER). |
| **WRITING** | The hidden-answer phase; everyone answers simultaneously. |
| **Reveal** | Synchronized staged disclosure of all answers, least rare first. |
| **Pack** | A versioned collection of prompts + catalogues loaded by the server. |
| **instabox-port** | Host facility giving a local port a public HTTPS/WSS URL. |

## One-line pitch
**"Wordle's clever cousin meets your group chat: same question, same 30 seconds — whoever knows the weirdest true answer wins."**
