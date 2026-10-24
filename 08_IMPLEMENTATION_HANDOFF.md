# 08 · Implementation Handoff — RAREBIRD MVP

**For the implementing agent (GLM-5.3 Flash Vision).** You are building the production RAREBIRD party game from this design package. A disposable prototype already proves the loop end-to-end — **read it, run it, then build fresh code to the contracts below.** Do not ship the prototype itself: it is plain-JS scaffolding without the production structure, TS types, or polish defined here.

---

## 0. Golden rules
1. **Server is authoritative** (timers, validity, scoring, standings). Clients render and never decide.
2. **No external API calls at runtime.** Packs are static JSON (already generated for you).
3. **No accounts, no DB, no chat.** In-memory rooms + one JSONL reports file.
4. Mobile-first single-column portrait UI; every touch target ≥44px.
5. The rules logic **must** be ported from `validation/rules-engine.mjs` (41 passing tests) or made bit-compatible with it — those tests are the contract (`node validation/rules.test.mjs` must pass against your port).
5b. The client countdown MUST snapshot the server skew once per `roundStart` (`03` §4 clock contract) — never recompute per tick — and ship the 1s/s pacing regression test.

## 1. What to build first, and why
**Milestone 1 = the core loop, ugly but real.** Joining a room and playing one synchronized round with a reveal is the entire product hypothesis; everything else is decoration. Each milestone ends with the two-browser verification defined in §6 — a milestone isn't done until it passes.

## 2. Milestones (ordered)

### M1 — Room + round skeleton (day 1)
- Server: TypeScript port of the protocol/state machine in `03` §2–§5 (`ws` only). Load `content/packs/starter-pack.json` (copy `sample-content/starter-pack.json`).
- Client: S1 Home, S2 Lobby, S3 Round with server-driven timer; single round → reveal → repeat `settings.rounds`.
- Done when: **two browser sessions** create/join/play 3 rounds and see identical reveals (§6 T1).

### M2 — Validation UX (day 1–2)
- `answerAck` flows: locked / suggest-chip + confirm / invalid retry; first-lock-wins; input disable on lock; answered counter.
- Done when: T2 passes (invalid, fuzzy-confirm, double-send guard).

### M3 — Full game + podium + rematch (day 2)
- RESULTS screen with standings + countback + shared places, best-sighting card, rematch majority vote, host skip-reveal.
- Done when: T3 passes (rare-picker beats obvious-picker in standings; rematch restarts; host skip works).

### M4 — Resilience (day 2–3)
- Reconnect via `?room&token` resume (state + roundStart replay + pending suggestion), disconnect pills, seat cleanup windows, room GC, rate limiting, late-answer guard.
- Done when: T4 passes (reload mid-round resumes; flood gets `rate_limited`).

### M5 — Production content + UI polish (day 3–4)
- Expand pack toward `04` §6 launch bar (≥40 prompts; at minimum: ship the 2 data-pipeline prompts + 8 hand-authored 40+ entry prompts across domains — use the existing `content-pipeline/` scripts to generate 2 more data categories, e.g. world capitals, sports).
- Full `05` UI: tier colours, reveal staging + reduced-motion, TWINS badge, rarity transparency line, share button, sounds + mute, `Report missing bird` → `reports.jsonl`.
- Done when: T5 (UX pass) and pack lint pass.

### M6 — Deploy (day 4)
- `07` runbook executed on the InstaBox: pm2 + `instabox-port publish 3000`; healthz verified from the public URL; play the full T1 again **through the public URL on two separate devices**.
- Done when: §6 T6 passes.

## 3. Source tree (create exactly this)

```
rarebird/
├── package.json              # deps: ws; dev: typescript, tsx, vitest, @types/ws, @types/node
├── tsconfig.json             # strict, ESM, NodeNext
├── src/
│   ├── server.ts             # entry: http + static + ws wiring
│   ├── rooms.ts              # Room registry, lifecycle, GC, codes
│   ├── game.ts               # phase machine (countdown/writing/reveal/results), timers
│   ├── protocol.ts           # message types (C2S/S2C unions) — mirrors 03 §4
│   ├── rules.ts              # PORT of validation/rules-engine.mjs (same exported names)
│   ├── packs.ts              # load + prompt draw (no-repeat, LRU preference)
│   ├── ratelimit.ts          # 12/5s per socket
│   └── reports.ts            # append reports.jsonl
├── public/
│   ├── index.html            # SPA, no build step (module script)
│   ├── app.js                # client state machine + rendering
│   └── style.css
├── content/packs/starter-pack.json
├── test/
│   ├── rules.test.ts         # port of validation/rules.test.mjs — MUST pass
│   ├── game.test.ts          # phase transitions, early-end, late answers, tie-breaks
│   └── rooms.test.ts         # join guards, reconnect resume, rate limit (ws client sim)
└── DEPLOY.md                 # copy of 07 essentials
```

Interface contracts you must not improvise:
- `rules.ts` exports: `normalize(raw): string`, `editDistance(a,b): number`, `fuzzyBudget(n): number`, `resolveAnswer(catalogue, raw): {status:'valid'|'suggest'|'invalid', entry?, typed}`, `scoreRound(prompt, submissions, deadlineMs, config?): rows`, `standings(rounds, players): ranked[]`, `TIERS`.
- Wire protocol exactly as `03` §4 (message `type` strings are the contract; adding fields is allowed, renaming is not).
- Room state shape per `03` §3 (keys used by the protocol).

## 4. Behaviour spec for the core loop (the exact expected sequence)
1. Host taps Start → all clients get `countdown` (3s) → `roundStart` with `prompt{text, example, size}` — **never the catalogue**.
2. Each client sends `answer{raw}`; server answers per-player `answerAck` within ~50ms; `state` broadcast updates the `answered` count (no content leaks).
3. WRITING ends at server deadline **or** 1.2s after all connected players locked.
4. Server computes rows via `scoreRound` (valid-locked submissions only; everyone else NO SIGHTING), sorts reveal least→most points, broadcasts `reveal`.
5. Reveal auto-advance ≈ `rows.length × 2.2s + 2.5s` (host skip = immediate).
6. After last round: `results` with standings + best sighting.
7. Rematch: ≥⌈n/2⌉ votes → fresh prompt draw, zeroed scores, straight to countdown.

## 5. Testing requirements
- `npm test` runs vitest: rules port (all 38 cases from `validation/rules.test.mjs`), game-phase transitions (mocked timers), room/protocol integration with real sockets on an ephemeral port.
- Simulation harness stays as-is (`validation/simulate.mjs`) and must be runnable against the production pack format.
- Definition of done for every milestone = §6 below on the real UI, not unit tests alone.

## 6. Verification: how to actually test the experience (required, not optional)
Run **two (or three) independent browser sessions** — separate profiles or devices, never one tab twice:
1. **T1 loop:** A creates → shares code → B & C join → play 3 rounds → each device's reveal shows identical rows; scores accumulate per round on all devices.
2. **T2 validation:** B types garbage (sees "No echo", retries fine), types a near-miss (sees suggestion chip, confirms, locks); B tries to answer twice (second is ignored).
3. **T3 outcomes:** make A always answer the most obvious entry and C rare ones → standings order C > B > A at results; rematch with 2 votes restarts with different prompts.
4. **T4 resilience:** B reloads mid-round (resumes with remaining time); flood B's socket with 20 rapid messages (gets `rate_limited`); close B entirely (pill greys, NO SIGHTING rows at deadline).
5. **T5 UX pass:** at 390×844 no horizontal scroll; timer readable; reveal legible; reduced-motion respected (devtools emulate).
6. **T6 public:** through the instabox-port URL from two separate physical devices (phones), full game.

**A static screenshot, a single-session demo, or green unit tests alone are NOT done.** The definition of done for the MVP is T1–T6 all passing on separate devices/sessions.

## 7. Publishing (the exact commands)
```bash
npm run build            # if you add a build step, output must be served by server.ts
pm2 start "node dist/server.js" --name rarebird   # or tsx src/server.ts
instabox-port publish 3000
curl -s https://3000-<machine>.instabox.tech/healthz
# after a machine stop/start: pm2 resurrect && instabox-port publish 3000
```

## 8. Explicitly OUT of scope for this build
- Solo daily mode, streaks, share cards (v1.1 concepts — build neither UI nor backend).
- Accounts, auth, persistent profiles, chat, spectator links, public room lists, matchmaking, ratings.
- Any runtime call to Wikidata/Wikimedia/any external API; any database; Docker; CDN; analytics with personal data.
- Jinx twins variant (leave the `twinsPolicy` config flag, default `badge`).
- Horizontal scaling, i18n (English only), native apps.

## 9. Where every answer lives
| Question | Doc |
|---|---|
| What is the game? | `02` |
| Exact scoring & tiers? | `02` §2.4, `04` §3 |
| Message formats & states? | `03` §2–§4 |
| Answer matching rules? | `04` §4 + `validation/rules-engine.mjs` |
| Screens & interactions? | `05` |
| What did tests establish? | `06` |
| How to deploy? | `07` |
| Why is X the way it is? | `09` (decision log) |
