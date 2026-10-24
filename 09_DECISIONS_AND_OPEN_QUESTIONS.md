# 09 · Decisions, Open Questions, References

## 1. Decision log

| ID | Decision | Rationale | Alternatives rejected | Status |
|---|---|---|---|---|
| D-01 | Concept: simultaneous hidden-answer rounds + synchronized tiered reveal in private rooms ("RAREBIRD") | Proven core loop (Krillion) + fills the no-downtime multiplayer slot (Puffer=turns, Jinxed=typing strain); fits 15-min breaks; lowest mechanic risk | 7 alternatives compared in `00` §2 | Final |
| D-02 | 6 tiers, points 10/15/30/60/85/100, percentile bands within each catalogue | Matches reference game's proven ladder math with own identity; readable totals; sim shows clean separation | 5-tier ladder (less resolution at the top); continuous scoring (opaque) | Final |
| D-03 | Tiers = rarity percentile within the prompt's finite catalogue; pageviews as evidence + mandatory editorial pass | Pageviews measure attention not answer-likelihood (Yemen trap, observed); finite catalogue = transparent + offline | Pure pageview automation; pure hand-tiering (unscalable, inconsistent) | Final |
| D-04 | Validation: normalize → alias exact → unique-best fuzzy suggest-with-confirm → invalid retry | Krillion's validated UX pattern; avoids wrong-answer locking (confirm step), keeps clock pressure | Auto-accept fuzzy (locks wrong answers); no fuzzy (teens mistype constantly) | Final |
| D-05 | TWINS = badge only, no score effect | Coincidence shouldn't punish (Jinxed) or reward herding (bonus); badge gives the social story; playtest may flip to `jinx` via config | jinx split (punitive); points bonus (herding incentive) | MVP; revisit post-playtest |
| D-06 | Round timer default 30s; host can pick 20/45 | Sim: 20s → speed+judgment dominate (smart 67% win share); 30s → balanced tension (49% vs 49%); 45s → depth dominant (66%) | Fixed 25s (reference's solo number — but our rounds are simultaneous & social) | Final defaults |
| D-07 | Transport: `ws` + JSON; Socket.IO only as fallback | Dependency-minimal; WSS proven through instabox-port. Socket.IO buys HTTP-polling fallback for school filters — unproven need | Socket.IO from day 1 (heavier, engine.io dep) | MVP; revisit if playtests hit blocked networks |
| D-08 | One Node process, in-memory rooms, no DB | Audience size; privacy (minors); ops simplicity; rooms are ephemeral by nature | Redis/Postgres (unneeded; adds failure modes) | Final for MVP |
| D-09 | No accounts/persistence at launch; localStorage identity only | Brief forbids registration; minors privacy; party games don't need it | Browser-keyed ratings (Puffer-style) — deferred | Final for MVP |
| D-10 | No daily mode at MVP; v1.1 feature | Party loop is the hypothesis under test; daily adds server-side per-day state + time-zone logic | Clone-with-daily-first (drifts from brief's "play together") | Final |
| D-11 | Content licensing: Wikidata (CC0) + Wikimedia Pageviews (CC0) + hand-authored; ProtoQA (CC BY) optional later | Verified practically usable, free, cacheable; no runtime deps | Google Trends (alpha-gated), Spotify (dev-mode lockout), Twitch/Steam (auth overhead, narrow domains) — all researched | Final |
| D-12 | Own identity (birdwatching); no Krillion assets/wording/tier names | IP hygiene per mission; ocean-depth metaphor is theirs | — | Final |
| D-13 | Rematch by majority (≥⌈n/2⌉), one tap | Keeps group momentum without host bottleneck | Host-only restart; unanimous | Final |
| D-14 | Max 12 players/room, 200 rooms | Server headroom on 4 vCPU; 12 covers friend-group use; larger = reveal slog | 20+ (reveal pacing breaks) | MVP |
| D-15 | Client clock contract: snapshot server skew ONCE per roundStart; never recompute per tick | Field-QA bug: per-tick recomputation doubled the visible countdown → reveals fired "early"; fixed + regression test 2026-10-23 | Per-tick skew (bug), client-authoritative timers | Final |
| D-16 | No external question/answer APIs at runtime; optional LLM-assisted **authoring** step instead | Runtime calls add latency/quota/key/cost/ToS failure modes inside timed rounds (also forbidden by brief); curated CC0 catalogues already proven. An LLM can accelerate catalogue drafting + alias generation at authoring time (human review still mandatory), which is where any "generator edge" belongs | Live-API validation during rounds; question APIs (Open Trivia DB etc.) for prompts | Final |
| D-17 | Gameplay event log + `GET /log` (last 200) on the prototype; structured events in production | Field QA was impossible without observability ("are you logging my gameplay?"); events: create/join/disconnect/roundStart/answer(raw, match, msLeft)/roundEnd(reason)/reveal/results/report | No logging (un-debugable); full analytics (privacy) | Final |
| D-18 | Phase-machine timer epochs: every transition bumps a sequence number and clears pending timers; callbacks check their epoch | Field bug: an early "all_locked" round end left its 30s timer alive, killing the NEXT round 2.5s in (log-confirmed 2026-10-23); regression test added | clearTimeout sprinkled at call sites only (fragile) | Final |
| D-19 | Optional prototype-only LLM judge for out-of-catalogue answers (env-flag `LLM_JUDGE_URL`, external notebook-hosted endpoint, capped, room-local, logged) | Closes the "correct answer rejected" gap during field tests without touching production design; production stays curated-catalogues-only (D-16) | Judge in production (latency/ToS/fairness); loosening normalization instead | Prototype-only |
| D-20 | Visual system = **altitude metaphor**: rarity = how high the answer flies (anti-Krillion: up, not down); migration reserved as the future pack-progression metaphor | Owner-suggested direction; mirrors the reference game's depth gimmick with our own identity; already the reveal's mechanic (cards fly to tier bands) | distance-flown (harder to read); pure decoration | Final |
| D-21 | All animation goes through one declarative `fx.js` layer (tier table drives visuals; transform/opacity only; capped, self-cleaning, reduced-motion aware) | Scalability: art can restyle everything from one table and swap sprites/Lottie without touching logic; QA-able via screenshots | Ad-hoc CSS per feature (already fragmenting) | Final |
| D-22 | Client version handshake + `no-store` HTML: clients send `v`, server nudges stale ones with a tap-to-refresh banner and logs `staleClient` | Field bug: stale cached clients silently ran old UI (static countdown, no ascent) and looked like server bugs; the inline-script client means the HTML *is* the app version | Forced reloads (kills mid-game sessions); ETag dance (overkill for a prototype) | Final |
| D-24 | Flock chat: ephemeral, filtered (profanity mask, 100 chars, 5/10s), drawer UI, QA-logged only | Owner feature; banter is core to party feel; minors-safe by construction (no persistence, no DMs) | Persistent chat / DMs / unmoderated free text | Final (prototype), production needs moderation review |
| D-25 | Theme packs over one ruleset: Cosmic Voyage (distance-from-Earth) alongside Dusk Birds; host-selectable | Owner's space idea; validates the fx-layer scalability claim; tier names/points theme-invariant | Hardcoded single skin; per-theme forks of rules | Final |
| D-26 | Fuzzy v2: Damerau + fuzzy-token subsets + confirm-gated phonetic suggestions | Real players are kids and non-native typists; every suggestion still requires a confirm tap so wrong-answer risk stays ~0; false-positive traps unit-tested (ZAF, mash) | Looser auto-accept (locks wrong answers); strict matching (frustration) | Final |
| D-27 | Prompt generator + empirical ratings flywheel (generate-prompts.mjs / rate-catalogue.mjs / answers.jsonl) | Content velocity with human review; own play data is the compounding ratings edge no external API has | LLM-only generation without verification; static tiers forever | Final (tooling); tiers empirical at ≥100 obs |
| D-23 | **Double or Nothing wager** (opt-in per round after locking: rare tiers ×2, common ½) as a field experiment | Owner asked for Hi/Lo-style betting; this shape fits simultaneous play (no turns), adds self-knowledge tension, one tap; measured via playtest before production default | Hi/Lo duels (turn-based — future mode); always-on for everyone (unwanted complexity for newcomers) | Experiment (prototype ON) |

## 2. Rejected alternatives worth remembering (future modes)
- **Hot-potato elimination** (Puffer-style) — different session shape, official comp exists; revisit as party-mode variant if group wants longer sessions.
- **Jinx twins variant** — one config flag; decide on playtest laughter data.
- **Predict-the-majority mode** (Noillirk-style) — needs our own aggregated answer frequencies (collected from launch) to have a ground truth; v2 candidate.
- **Solo daily + share line** — the retention layer; v1.1 (D-10).
- **Trend/rising-falling prompts** — seasonal content experiments once pageview history accumulates in-house.

## 3. Open questions (ranked by risk)

| # | Question | Why it matters | How to resolve |
|---|---|---|---|
| Q-01 | Is the synchronized reveal actually fun for teens? | Whole product hypothesis | §8 playtest of `06`; keep/revise/abandon criteria defined there |
| Q-02 | Do catalogue gaps frustrate players on pop-culture prompts? | loudest complaint in the reference community | report button + weekly triage; measure reports/prompt |
| Q-03 | Server restart kills running rooms — acceptable? | parties get interrupted on box stop | MVP: yes (documented). v1.1: persist minimal room snapshots to disk if complaints |
| Q-04 | Do school networks block WSS in the wild? | breaks the core venue | playtest on school Wi-Fi; if yes → Socket.IO polling fallback (D-07) |
| Q-05 | What's the stranger story (public rooms/matchmaking)? | growth vs. moderation burden | defer until organic demand; requires content-moderation plan for minors |
| Q-06 | Timer fairness across slow keyboards/autocorrect? | phones differ | measure lock-time distribution post-launch; consider 35s if p95 > 28s |
| Q-07 | Should aliases ever be worth slightly less (discourage "USA"-spam)? | purity vs. friendliness | no evidence of problem; revisit if playtests show alias exploitation complaints |
| Q-08 | Art direction: lean into Wingspan-adjacent field-guide aesthetic? | Owner likes the idea; strong fit with the flock metaphor — but must stay mood-level inspiration (no copying Wingspan's art, cards or trade dress; it is a protected commercial game) | mood board + 2–3 style frames during M5 polish; decide before art production |

## 4. Assumptions (explicit, each labeled)
- **A1:** Teens' answer-likelihood for common categories roughly tracks a log-popularity curve (basis: Family-Feud-style norms, ProtoQA shapes, our sim design). *Assumption — validated only indirectly.*
- **A2:** 30s suffices to recall+type a mid-rarity answer on a phone (sim model; not measured with real teens). *Tested only in model form.*
- **A3:** Wikidata/pageview monthly snapshots stay representative for months; packs refreshed quarterly. *Reasonable; verify on first refresh.*
- **A4:** instabox.tech URLs are acceptable to share among friends (no domain needed at MVP). *Operational assumption.*
- **A5:** ~40 prompts is enough launch content for a friend group to play a week without prompt fatigue. *Judgment call; measure rematch prompt-repeat complaints.*

## 5. Reference list (dates checked 2026-10-23)

**First-party (played directly):**
- https://krillion.io/ · /party · /unlimited/classic · /archive · /packs · /faq — the reference game, its party mode, monetization; played multiple dives + a hosted party match (screenshots in `screenshots/`).
- https://jinxed.party/ — rules modal captured first-hand.

**Third-party (research; treated as commentary):**
- r/Krillion (~25k members): subreddit, dev AMA (~Sep 12 2026), criticism threads ("How is answer rarity ACTUALLY determined?", "seriously needs work") — community pain points.
- KrillionHQ (krillionhq.com) — fan archive; dive numbering ⇒ launch ≈ 2026-07-16.
- Playlin 40 chart (playlin.io/game/krillion) — #1 week of 2026-10-19.
- X posts — share format "Krillion #99 🦐 170".
- playdaily.org + playdaily.org/krillion — brand-riding clone ("Krillion Unlimited", rooms of 40); its Noillirk inversion game.
- jinxed.party/like-krillion — Jinxed positioning post.
- ProtoQA dataset — github.com/iesl/protoqa-data (CC BY 4.0), human "name a…" answer distributions.
- Battig & Montague (1969) category norms — academic lineage (via literature).
- Genre/context: BBC Pointless (2009), Family Feud, Scattergories, Google Feud, Jackbox Fibbage/Wits & Wagers, codenames.game, kahoot.it ecosystem analyses (Teachfloor 2024, EdWeek 2023), Wordle retention coverage (WSJ 2024, CNBC 2022, NYT 2022).
- Data sources (verified via official docs): Wikimedia Pageviews REST API + Pageview Complete dumps (CC0), Wikidata SPARQL + WDQS limits, DBpedia, Steam Web API terms (100k calls/day), Twitch Helix (800 pts/min), Google Trends API alpha (gated), Spotify quota modes (dev lockout), MusicBrainz (CC0, 1 rps), Last.fm, GeoNames (CC BY), IMDB non-commercial datasets.
- Environment: MACHINE.md (instabox facts), `instabox-port` behaviour (WSS verified first-hand).

## 6. Artifacts & where they came from
| Artifact | Produced by | Notes |
|---|---|---|
| `screenshots/*.png` | Playwright-core sessions | Krillion dives, Puffer Party match, Jinxed, prototype screens |
| `research-notes/party*.log` | raw interaction logs | the hosted party match transcript |
| `sample-content/starter-pack.json` | `content-pipeline/*.mjs` | real Wikidata+pageview generated pack |
| `validation/rules-engine.mjs` + `rules.test.mjs` | this design pass | 38/38 green; the scoring contract |
| `validation/simulate.mjs` | this design pass | 20k simulated games; tables in `06` |
| `prototype/` | this design pass | verified disposable multiplayer prototype (NOT production) |
| `prototype/verify/*.js` | copied from research workspace | the automated multi-browser tests of `06` |
