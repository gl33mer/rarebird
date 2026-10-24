# 06 · Test Plan and Results — RAREBIRD

All tests below were **actually executed on this machine on 2026-10-23**. Artifacts: `validation/` (executable, zero dependencies, Node ≥18) and `prototype/`. Reproduce with:
`node validation/rules.test.mjs` · `node validation/simulate.mjs` · `node prototype/server.mjs` + browser sessions.

**Honesty note:** bots and browsers prove the *rules and plumbing* work. They cannot prove the game is fun. §8 defines the human playtest that must happen before the concept is considered validated. No human playtest has occurred; no fun claims below are empirical.

---

## 1. Rules engine unit tests — `validation/rules.test.mjs`

**Result: 41/41 passed** (categories: normalization 6, edit-distance/budget 4, answer resolution 15, tier sanity 4, round scoring 7, locking & late 2, standings/tie-break 3).

Notable cases (all on the real generated pack):
- `WHOPPER`≡`whopper`≡`the whopper` → identical canonical (case/article folding works).
- `USA`, `U.S.`, `Holland`, `Fe` resolve via aliases to United States / Netherlands / Iron.
- `Kazakstan` → `suggest` (fuzzy), `wopper`/`zzzqxv` → `invalid` (budget respected).
- TWINS badge applies to both players with **no** point change (policy `badge`).
- Second answer from a locked player is ignored (`first valid locks`).
- Late-by-1s submission flagged; countback tie-break prefers the rare-heavier player; exact ties share a place.

## 2. Content pipeline validation (real data, live sources)

| Check | Result |
|---|---|
| Wikidata SPARQL "sovereign state" (direct instance) | 197 entities, all with enwiki titles ✅ |
| Subclass expansion instead | 363 rows incl. micronations & "history of the British Empire" → **rejected; editorial filter required** ⚠ |
| Pageviews fetch (2026-09 monthly, agent=user, ~350ms spacing) | **197/197 succeeded, 0 failures, no 429s** ✅ |
| Elements enumeration | 164 raw → filtered to the real 118 ✅ |
| Duplicate-entity trap | "Netherlands" vs "Kingdom of the Netherlands" both present → merged, views re-fetched for common-name article (212,004 vs 42,223) ✅ |
| Attention-vs-answer-likelihood trap | Yemen 322k views (news) outranks France-like countries → **editorial override applied** (Yemen→STARLING) ✅ |
| Generated tier distribution (countries, n=197) | PIGEON 54 · SPARROW 59 · STARLING 51 · KINGFISHER 22 · MEGA 8 · RARE BIRD 3 — healthy pyramid ✅ |

Cost of one data-pipeline category end-to-end: ~3–4 minutes + one human review pass. Conclusion: **the MVP answer-data approach is practical, free, licensed (CC0) and needs no runtime APIs.**

## 3. Strategy simulations — `validation/simulate.mjs`

4,000 games × 5 rounds per scenario, 5 bot strategies on the real catalogues + a synthetic Zipf catalogue. **Model assumption (important):** recall latency grows with rarity (lognormal, median 2.5s→13s), typing 1.2s+chars/12, typos at scenario rate (fuzzy rescue costs 3s, retry 6s), timeout = 0 pts. This models *time pressure*, not knowledge uncertainty — real humans also sometimes *think* they know a rare answer and are wrong; that further favors `smart` over `deep`, i.e. real play is likely **more** balanced than the sim, not less.

Mean points (win share) per scenario:

| Strategy | 30s/15%typo (baseline) | 20s | 45s | 5% typo | 30% typo |
|---|---|---|---|---|---|
| deep (rarest 10%) | **302** (48.6%) | 166 (20.9%) | **354** (66.1%) | 337 (54.3%) | 245 (39.3%) |
| smart (82–95th pct) | **295** (49.3%) | **245** (66.9%) | 301 (33.0%) | 333 (44.4%) | **249** (58.3%) |
| random | 146 (2.0%) | 139 (11.5%) | 146 (0.9%) | 172 (1.3%) | 110 (2.4%) |
| mainstream | 114 (0.0%) | 114 (0.1%) | 114 (0.0%) | 135 (0.0%) | 95 (0.0%) |
| obvious (top 15%) | 48 (0.0%) | 48 (0.5%) | 48 (0.0%) | 49 (0.0%) | 41 (0.0%) |

Findings:
1. **Core appeal holds mechanically:** rarity-seeking crushes obviousness in every scenario (the point of the game — obscure knowledge pays).
2. **No runaway dominant strategy at the 30s default:** deep 48.6% vs smart 49.3% win share — near-perfect tension between digging deep and picking smart; neither approach dominates, and the champion is decided by *which* rare answers players actually produce. (Numbers are from the shipped 5-prompt pack; the earlier 2-category run gave 58.9/39.7 — same conclusion, slightly deeper bias. Raw output: `validation/sim-results-2026-10-23.txt`.)
3. **The timer is the difficulty dial:** 20s flips the ranking (smart 66.9% — speed+judgment beat pure depth; even random takes 11.5%); 45s makes depth dominant (deep 66.1%). → 30s default, host options 20/45, are the right product decision.
4. **Typo tolerance works as intended:** at 30% typo rate the ordering holds and margins compress gracefully (fuzzy correction absorbing chaos).

What the simulation *cannot* establish: whether humans enjoy the 30s tension, whether TWINS moments land emotionally, whether 6 tiers read clearly — playtest questions.

## 4. Multiplayer acceptance tests (automated browsers)

Scripted independent Chromium contexts against the running prototype (`research/verify-rarebird.js` — logic preserved in `validation/` notes; rerun instructions §7):

| # | Scenario | Result |
|---|---|---|
| A1 | Create room → 4-char code visible | ✅ |
| A2 | Two more devices join by code; lobby lists all 3 | ✅ |
| A3 | Host controls visible only to host | ✅ |
| A4 | 3 rounds played synchronized across devices | ✅ |
| A5 | Invalid answer → "No echo", input stays live, retry succeeds | ✅ (dedicated probe) |
| A6 | Fuzzy: "Unted States" → chip "Yes, submit United States" → confirm locks | ✅ |
| A7 | Reveal appears on all devices; order least→most rare; NO SIGHTING last | ✅ |
| A8 | Standings after 3 rounds: rare-picker 260 > mixed 55 > obvious-picker 30 | ✅ |
| A9 | Best-sighting card present | ✅ |
| A10 | Rematch: 2/3 votes restart with new prompts | ✅ |
| A11 | Mid-round reload (connection drop) → resumes into the running round with remaining time | ✅ |
| A12 | Late join refused with "Already flying" | ✅ (server guard; exercised via ws probe) |
| A13 | Rate limit: 13th message in <5s → `rate_limited` error | ✅ (server guard) |

Initial run caught 2 real bugs (both fixed, then re-verified): server rejected `create`/`join` behind a room-guard (nothing could create rooms); final state broadcast kicked players off the results screen. This is exactly what prototype testing is for.

## 5. Cross-device run through the public URL

With `instabox-port publish 3000`, two independent browser sessions at `https://…instabox.tech`: create ✅ → join ✅ → synchronized round ✅ → reveal ✅. **The full deployment path (HTTPS page + WSS game socket through the InstaBox port publisher) is proven end-to-end.** (An earlier echo test additionally proved WSS round-trips before the prototype existed.)

## 6. Deployment checks
- `GET /healthz` → 200 `ok` (used by any uptime check).
- Server restart mid-lobby: clients auto-reconnect; rooms are lost by design (documented behaviour — players re-create; acceptable for MVP, `09` Q-03 asks whether to soften).

## 7. How to rerun everything
```bash
# 1. rules tests
node validation/rules.test.mjs
# 2. simulations (~1 min)
node validation/simulate.mjs
# 3. prototype + manual/automated play
node prototype/server.mjs          # :3000
instabox-port publish 3000         # public URL
# 4. automated multi-browser verification (from repo root, needs playwright-core + chromium)
node research/verify-rarebird.js   # see prototype/README for the preserved copy
```
(The verification scripts live in `prototype/verify/` in this package, copied from the research workspace.)

## 7b. Field feedback round (2026-10-23, first human player) and resulting fixes

The product owner played the live prototype on separate devices and reported three issues. All were diagnosed, fixed and re-verified (8/8 automated checks, `prototype/verify/`):

| Report | Root cause | Fix | Verification |
|---|---|---|---|
| "answers are logged before the time runs out" | Client recomputed the server-clock skew on every countdown tick, making the visible timer run ~2× fast — the server deadline hit while the display still showed time left | Skew snapshotted once per `roundStart` (`03` §4 clock contract) | 5s sample window drops 4–6 (regression test added) |
| "some answers not accepted even though they're right" | (a) demo catalogues are intentionally tiny (10 entries) — many correct answers genuinely aren't in them yet; (b) punctuated acronyms (`U.S.A.`) bounced: normalization turned them into spaced letters | (a) documented + **Report missing bird** button added to the prototype (writes `reports.jsonl`); (b) space-collapsed alias indexing (`04` §4.6) | 41/41 unit tests incl. new acronym cases |
| "are you logging my gameplay?" | Server logged almost nothing | Full gameplay event log (create/join/disconnect/roundStart/answer incl. raw+match+msLeft/roundEnd incl. reason/reveal/results/report) with timestamps; view at **`GET /log`** (last 200 events) | events visible at `/log` on the public URL |

Note: rounds also **end early by design** ~1.2s after every connected player has locked an answer — easy to mistake for the timer bug above; the log now records `roundEnd {reason: all_locked|timer}` to disambiguate during QA.

### Field feedback round 2 (same day, second play session)

A second live game (2 players, 3 rounds) exposed a deeper timer bug, confirmed from `/log`:

```
21:17:22 roundEnd reason all_locked      ← round 1 ended early (both players locked in)
21:17:35 roundStart round 2 (30s)
21:17:37 roundEnd reason timer           ← round 2 killed after 2.5s by ROUND 1's leftover timer
```

**Root cause:** ending a round early (all players locked) left its original 30s server timer pending; it fired into the next round and ended it. Same session also logged heavy invalid-bounce on plausible answers ("cheetah", "zebra", "horse", "cyan") — the 10-entry demo catalogues were too small.

Fixes applied & verified (`prototype/verify/verify-timers.js`, `verify-judge.js`, 10/10 checks):
1. **Timer epochs:** every phase transition bumps `room.phaseSeq`, clears pending timers; callbacks act only if their epoch is current. Regression test: after two consecutive early-ended rounds, the next round runs its **full 30s** (was 2.5s).
2. **Demo catalogues grown** (10 → 41–81 entries each) + 3 new prompts (sports, European capitals, fruits at 62) — pack now 7 prompts incl. the two data-pipeline ones; `sample-content/starter-pack.json` updated.
3. **Host timer setting** (20/30/45s) added to lobby + protocol (`start {roundMs}`); verified a 20s round runs ~20s.
4. **Optional LLM judge** (`LLM_JUDGE_URL`, `prototype/JUDGE.md`): out-of-catalogue answers are adjudicated by an external endpoint (notebook-hostable), capped 6/round, 2.5s timeout, room-local catalogue insertion tagged `llm-adjudicated`, `judgeAdmit`/`judgeReject` logged. Verified with the bundled mock judge: keyboard mash still rejected; "wombat" admitted and scored.
5. **Presentation upgrade** toward the reference game's polish: ring timer, tier-coloured staged reveal with rarity lines, podium, life-list counter, share/copy invite, chirp sounds with mute. Screenshots: `screenshots/verify_upgrade_round.png`, `verify_upgrade_reveal.png`.

### Field feedback round 3 (same day, third play session — 3 players)

Reports: "second player never gets to join", "the 3 before a round never counts down", "last round still says awaiting next round". Log-confirmed diagnosis + fixes (verified 11/11, `prototype/verify/verify-graphics.js`):

| Report | Root cause (from `/log` + code) | Fix |
|---|---|---|
| Second player "never joins" | The joiner's WebSocket sent a `resume` greeting before `join`; the server's "not in room" error made the client bounce to Home — the join had actually succeeded server-side (log: `join tyuh players:2` then `resume`, `disconnect`) | Client only sends `resume` when it actually has a saved session; generic errors display inline (2.5s) and never switch screens |
| Static "3" before rounds | The countdown was a single hardcoded number, no ticking; reconnects during countdown had no render path | Full-screen animated 3-2-1 interstitial (flock-forming motif), driven by server `endsAt`; `state.phaseEndsAt` now covers countdown so reconnects re-render it |
| "Awaiting next round" on the final round | Reveal footer was hardcoded | Server sends `reveal.next: 'round' | 'results'`; footer reads "gathering the flock's results…" |
| (found by automation) ES-module 404 | Static server only served index.html; `fx.js` import killed the whole client | Proper path-traversal-safe static serving with MIME types |

Also added this round: the **altitude ascent reveal** (cards fly to tier altitude bands with a left-edge ruler; vision-QA'd through three iterations — final verdict "ship after padding guard"), ambient sky/clouds/stars, RARE BIRD glow + particle burst + shake, winner burst on the podium. Graphics built as the scalable `fx.js` layer (05 §0a).

### Field feedback round 4 (2026-10-23, fourth play session — 3 players)

Reports: "some clients don't get the fancy bird ladder / only the stuck 3 — maybe only the room creator?" Log showed the session was healthy server-side (3 joins, correct rounds/reveal/results; judge admitted two genuine fruits — carambola, pitango). Diagnosis: **stale cached clients** — the client is inline-scripted HTML served without cache control, so friends who still had the pre-graphics page (or a cached copy) ran the old behaviours, which match the reported symptoms exactly. Fixes (verified 18/18: 11 graphics-suite + 7 handshake/wager probes):

1. **Client version handshake** (D-22): every message carries `v`; server `CLIENT_VERSION=6` nudges mismatches with an `update` message (persistent tap-to-refresh banner, never a forced reload mid-game) and logs `staleClient`. Verified: `v:1` gets nudged, `v:6` doesn't.
2. **Cache headers:** HTML (the whole app, inline script) now `cache-control: no-store`; assets `no-cache`; `fx.js` import cache-busted (`?v=6`). Verified header in response.
3. **Defensive guards** so a degraded client degrades gracefully instead of throwing.
4. **Content doubled** (04): pack 7 → 14 prompts / 1,183 entries (3 new pipeline categories + 4 hand-authored).
5. **Double or Nothing wager implemented** (02 §2.4b): protocol-verified end-to-end — rare-tier wager doubles (60→120 observed), common-tier halves (10→5 observed), invalid wagers void, reveal carries `wagered/wagerOutcome/base`; 5 new unit tests (suite now 46/46).



**Who:** 2 sessions × 1 friend group (4–6 teens, mixed trivia enthusiasm), plus 1 session with adult gamers as a control. Consent from a teacher/parent for minors; no personal data collected.

**Script (15 min):** 5-min warmup game (3 rounds, 30s) → 1 main game (5 rounds) → 1 game with 20s timer → questionnaire (5 min).

**Observables:** join time to first prompt (target <45s incl. link sharing); % players locking before deadline (target >85%; <70% means timer too short or prompts too hard); TWINS reactions (laugh/talk vs silence); rematch rate unprompted (target ≥60% of groups); complaint themes (tier fairness? invalid frustration?).

**Keep/revise/abandon criteria:**
- **Keep** if rematch ≥60% AND "would play again" ≥4/5 avg AND no more than ~1 fairness complaint per group.
- **Revise** (specific dials): if obvious-answer players feel hopeless → consider tier points 10→12 base or a one-time "binoculars" hint; if rare answers feel arbitrary → strengthen rarity transparency line / review tier overrides; if timer stress dominates → 45s default.
- **Abandon/rethink** if groups don't rematch AND players can't explain scoring after one game (the mechanic failed to teach itself) — then fall back to evaluating the hot-potato variant (Concept C) before any further investment.

**Known unresolved risks:** (1) catalogue gaps on pop-culture prompts (mitigation: report button + weekly triage); (2) TWINS badge-only may feel flat — jinx variant is one flag away, decide on playtest evidence; (3) school-network WebSocket blocking unmeasured in the field (fallback: Socket.IO polling mode, D-07).
