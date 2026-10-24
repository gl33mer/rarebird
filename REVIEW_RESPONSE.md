# REVIEW RESPONSE — external review triage (2026-10-24)

Reviewer's table addressed row by row. Status: ✅ done (this session) · ⏳ deferred (scheduled, with owner decision needed) · ❌ rejected (with reason). Verification: unit 62/62 · security probes 16/16 · graphics 12/12 · chat/theme 12/12 · timers 8/8 · topcall/split 4/4 · 20k-game sims rerun.

## Security & safety

| Review row | Status | What we did |
|---|---|---|
| `/log` public (block) | ✅ | Gated behind a per-boot token (`RAREBIRD_LOG_TOKEN` or auto-generated; printed at boot, never served). 403 without it (probed). Codes remain in the ring for QA — the token is the gate; stripping content would kill its QA purpose. |
| Room-code brute force (block) | ✅ | Codes now **5 chars** (31⁵≈28.6M). Per-IP failed-join dampener, **NAT-friendly by design** (our probes showed the first draft locked out a whole friend group behind one IP): correct-code joins ALWAYS pass; wrong-code attempts back off 5s/15s/60s/5min after 4 misses. Host **lock-room** toggle + **kick** (banned tokens can't rejoin) + host migration after idle. `globalJoinFails` on `/healthz` for alerting. |
| Repo secrets scan (block) | ✅ | Full-history pattern scan (tokens/keys/passwords): **clean**. No credentials ever committed; judge URL is localhost; reconnect tokens live only in players' browsers. Residual exposure is the instabox URL itself (= the game being reachable) — real domain is the fix (ops row). |
| Free-text chat for minors (block) | ✅ | Chat is now **preset phrases + emoji only** (12 curated reactions); free text requires `RAREBIRD_FREETEXT_CHAT=1` for our private tests. Verified: preset relays, free text bounces. |
| UK/EU child-safety legal (block) | ⏳ | Accepted as a **launch gate, not a code fix**: children's access assessment + risk assessment, privacy notice, NCA reporting duty, ICO Children's Code review — checklist added to `07` §Legal. Preset-only comms is chosen partly to fit the limited-functionality exemption; we will get actual legal advice before any public launch. Not a lawyer either. |
| ws `maxPayload`/deflate/idle (major) | ✅ | `maxPayload: 1024`, `perMessageDeflate: false`, 10s unauthenticated-socket timeout, 30s ping/pong reaping, per-IP connection cap (10). Probe: oversized frame closes that socket, server survives (our first version crashed on it — caught by our own probe, fixed). |
| Origin allowlist (minor) | ⏳ | Accepted, 5-line fix scheduled with the domain move (origin is currently the instabox URL, which changes with domain anyway). Reconnect token out of the query string: accepted, deferred with the same work. Real-client-IP header behind the proxy: to verify at deploy. |
| Message coercion (major) | ✅ | Strict types: `raw` must be string, `confirm` must be boolean (true only accepts suggestions), `text`/`nickname` strings; rounds/timer/theme whitelists unchanged; Maps everywhere; pid derived from socket only. Probe: object-raw + truthy-string confirm ignored. (Our first draft required `confirm === true` and silently broke every normal answer — caught by the timers suite, fixed to boolean check.) |
| Bidi/zero-width display attack (major) | ✅ | Server-side `displayClean` strips Cc/Cf/Zl/Zp + bidi controls from nicknames, typed text, chat; reveal prefers canonical; client wraps all dynamic strings in `<bdi>`. Nickname NFKC-confusable dedupe: deferred to content pass (lower risk now chat is preset-only). |
| Host powers (major) | ✅ | lock, kick (+ban), migration on host-idle in lobby; `system` notices to the room. |
| LLM judge (major) | ✅ | Judge verdicts now **validity only** — admitted entries carry a fixed STARLING tier, never model-provided tiers/points; per-(prompt, answer) cache; only prompt+answer sent. Privacy disclosure folded into the legal checklist. |
| Reports/answers logs (major) | ✅ | 2MB cap + one-generation rotation on both JSONLs; reports store a **daily-salted room hash** instead of the code; typed text passes `displayClean`. 30-day retention: rotation by size for now; age-based retention with the ops pass. |
| Empirical re-tiering circularity (major) | ⏳ accepted | Correct critique. Constraints added to the calibrator spec: distinct-room diversity requirement, per-room contribution caps, fast-first-lock filter; tiers flip only at ≥100 diverse observations. Play data keeps accumulating (`answers.jsonl`) but is treated as advisory until then. |
| Surprisal/UNCHARTED tiers (major) | ⏳ | Partially adopted: judge-admitted answers get a **fixed tier** (band-aid for consistency). Full surprisal-based absolute thresholds = content-model redesign — scheduled as a design spike with the next content pass, not a hotfix. Minimum catalogue size (30) already specced. |
| Fuzzy ambiguity (major) | ✅ | `resolveAnswer` now returns `ambiguous` with candidates on alias collisions (e.g. two Congos) — client shows **candidate chips** to pick; token-stuffed inputs (>6 tokens) rejected; one-to-one token consumption in subset pass; CI cases added. |
| Wager dominance (major) | ✅ | **Double-or-Nothing replaced by TOP CALL** (reviewer's own suggestion): "my answer is the rarest in this room" — ×2 only if uniquely top post-split, else ½. Sim: always-wager now *loses* (smartW 143 vs smart 296 pts) — a real decision, not a tax. Payout cap implicit (×2 of a single round ≤200 < 2-round swing). |
| Static tiers + room-relativity (major) | ✅ | **SPLIT rule**: identical answers split tier points (floor, min 5). Sim before/after: two memorizers banking 394 pts (38% win share each) collapse to 223 (3.5%) — the copy-the-rare-bird exploit is dead; a lone knower still deservesly wins. TWINS badge retained. Prediction layer ("guess whose answer lands highest") — designed as the next mechanic (D-29), not rushed in. |
| Content safety screen (major) | ✅ | `content-pipeline/safety-screen.mjs` (hard/soft term flags over canonicals+aliases) run over all packs: 0 hard after one rename; human sign-off remains mandatory per `04`. The screen even Scunthorpe'd itself ("Crack snails") — regex tightened, lesson noted. |
| Competitor screenshots + ladder (minor) | ✅/⏳ | Ladder changed to **10/20/40/65/85/100** (tests+sims updated). Screenshots stay (repo is private; they're evidence for `01`) — will be pulled before any public repo. Name clearance: deferred to launch checklist. |
| School DNS filtering (minor) | ⏳ | Accepted; real domain + filter-vendor submission added to `07` ops checklist. |
| Ops (minor) | ✅ | SIGTERM/SIGINT graceful broadcast ("back in a minute"); `/healthz` now returns rooms/sockets/globalJoinFails/mem/uptime JSON for monitoring; JSONL sizes capped. |

## Game design critique

| Critique | Status | Response |
|---|---|---|
| Room barely affects score | ✅ | SPLIT + Top Call make the room central to scoring. Life-list collection meta: accepted, scheduled (D-30) — needs no account, local-only. |
| Learning agents in sim | ✅ (partial) | Added `memo1/memo2` (convergent rare-pickers) — they exposed the exploit and now validate the fix. True adaptive-learning agents: noted as sim v3 wish. |
| 5-round default, Second Wind | ✅/⏳ | Default rounds now 5. Second Wind stays v1.2 (one mechanic per playtest round — SPLIT+TopCall is already two). |
| Playtest honesty | ✅ agreed | `06` has said "no human playtest data" since day one; field rounds are logged as bug-finding. §8 protocol unchanged as the gate before more mechanics. |

## Reviewer's offers

- Failed-join limiter & validation layer: implemented here (with NAT correction our probes forced).
- Learning-agent sim extension: partially (memorizers); full adaptive agents welcome as a follow-up — the harness now has the hooks.
