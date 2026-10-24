# 03 · Multiplayer Technical Specification — RAREBIRD

A working reference implementation of everything in this document exists in `prototype/` (verified across independent browser sessions and the public URL — see `06`). Production may rewrite, but must preserve the contracts and state machine described here.

---

## 1. Architecture

```
┌──────────────┐  WSS/HTTPS   ┌─────────────────────────────┐
│ Phone client │◄────────────►│  Node.js server (one process)│
│ static SPA   │              │  ├ HTTP: static files, /healthz│
│ (no build    │              │  ├ ws: game protocol         │
│  step in MVP)│              │  ├ rooms (in-memory Map)      │
└──────────────┘              │  ├ packs (JSON at boot)       │
                              │  └ reports.jsonl (append-only)│
                              └──────────┬───────────────────┘
                                         │ instabox-port publish 3000
                                         ▼
                            https://<box>-3000.instabox.tech
```

- **One process, one port.** Static client + WebSocket on the same origin (verified: WSS upgrade passes through `instabox-port`; `06` §6).
- **Server-authoritative:** all timers, answer validity, scoring, standings. Clients render.
- **In-memory only.** Rooms die on restart; nothing worth persisting survives a party. The only disk artifact is `reports.jsonl`.
- **Dependencies: `ws` only** (prototype) — or Socket.IO in production **if** the school-network polling fallback proves necessary (decision D-07 in `09`); start with `ws` + JSON messages, which is dependency-light and transport-agnostic.

## 2. Room lifecycle

```
created ──► LOBBY ──(host: start)──► COUNTDOWN ──► WRITING ──► REVEAL ──┐
  ▲                                     ▲                              │
  │                                     └────── next round ◄───────────┤
  │                                                                    │ last round done
  └────────── REMATCH ◄────────────── RESULTS ◄────────────────────────┘
(any state) ──all players gone 5 min──► GC
```

| Transition | Trigger | Guard |
|---|---|---|
| LOBBY→COUNTDOWN | host `start` | phase=LOBBY, ≥1 player |
| COUNTDOWN→WRITING | server timer 3s | — |
| WRITING→REVEAL | server timer 30s **or** all connected players locked (+1.2s) | — |
| REVEAL→(next) COUNTDOWN | server timer rows×2.2s+2.5s (cap 14s) or host skip | more rounds remain |

**Timer epochs (mandatory implementation pattern):** every phase transition increments a room sequence number and clears pending timers; every scheduled callback acts only if the sequence number it captured is still current. Rationale: a round that ends early (all players locked) leaves its deadline timer pending — without epochs it fires into the *next* round and kills it after seconds (field-observed, log-confirmed). A regression test for this is part of the milestone gates (`08` §6).
| REVEAL→RESULTS | same, last round | — |
| RESULTS→COUNTDOWN | `rematch` votes ≥ ⌈n/2⌉ | phase=RESULTS |
| any→deleted | no connected players for 5 min | GC loop 30s |

## 3. Server data structures (prototype-shape, portable)

```js
room = {
  code,                    // 4 chars from ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no 0/O/1/I)
  hostId,
  players: Map<pid, { pid, token, nick, socket, connected, answered, lastSeen }>,
  settings: { rounds: 3|5|7, roundMs: 30000, revealMs: auto },
  phase, roundIndex, prompts: [prompt…],   // prompts pre-drawn at start (catalogues stay server-side)
  submissions: Map<pid, { raw, suggest?, confirmed?, atMs, status: 'invalid'|'suggest'|'locked' }>,
  rounds: [revealRows…],                    // scoring history
  standings, rematchVotes, emptySince,
}
```

Client-visible room state (sent on every change; catalogue is **never** included):
```js
{ code, phase, settings, roundIndex, totalRounds, phaseEndsAt?, serverNow,
  players: [{ pid, nick, connected, answered, isHost }] }
```

## 4. Wire protocol (JSON over WebSocket)

### Client → server
| type | payload | notes |
|---|---|---|
| `create` | `{nickname, rounds?}` | → `joined{code,pid,token,isHost}` + `state` |
| `join` | `{code, nickname}` | errors: `no_room`/`in_progress`/`full` |
| `start` | `{rounds?}` | host only, LOBBY only |
| `answer` | `{raw ≤64 chars, confirm:boolean}` | WRITING only; confirm=true accepts a prior suggestion |
| `skipReveal` | `{}` | host only |
| `rematch` | `{}` | RESULTS only; majority triggers restart |
| `leave` | `{}` | — |
| *(connect-time)* | `?room=CODE&token=TOKEN` query on the ws URL | resume/reconnect path |

### Server → client
| type | payload | when |
|---|---|---|
| `joined` | `{code, pid, token, isHost}` | client persists `{room,pid,token}` in localStorage |
| `state` | room snapshot (above) | after any change |
| `countdown` | `{endsAt, serverNow}` | 3s pre-round |
| `roundStart` | `{roundIndex, totalRounds, roundId, prompt{text,example,size}, durationMs, endsAt, serverNow}` | WRITING begins |
| `answerAck` | `{status:'locked', canonical}` / `{status:'suggest', suggestion}` / `{status:'invalid', msg}` / `{status:'already_locked'}` | immediate per-answer feedback |
| `reveal` | `{roundIndex, rows:[{nickname, typed, canonical?, tier?, pts, timedOut, twins, rarityPct?}], endsAt, serverNow}` | after WRITING ends |
| `results` | `{standings:[{place,nick,pts,tierCount}], bestAnswer{nick,canonical,tier,pts}}` | final |
| `rematchVote` | `{nick, votes, total}` | live vote count |
| `error` | `{code, msg}` | human-readable; codes: `no_room`,`in_progress`,`full`,`rate_limited`,`server` |

**Clock sync (exact client contract):** every timed message carries `serverNow` and `endsAt`. On receipt of `roundStart` the client computes the skew **once** — `skew = serverNow − Date.now()` — and every countdown tick renders `left = endsAt − (Date.now() + skew)`. Recomputing the skew per tick makes the visible countdown run ~2× real time (a real prototype bug, found in field QA 2026-10-23 and fixed: players saw the reveal fire while their timer still showed seconds left). Regression test: over a live 5-second window the displayed number must drop by 4–6. The **server deadline always wins** — a client whose clock drifts may see the input disabled a beat early/late, never an extra/missing second of authority.

## 5. State machine / timing rules
- Phase timers are server `setTimeout`s, set once per transition, guarded by `if (room.phase !== expected) return` (late fire after a rematch/reset is dropped).
- `answer.atMs` is computed **server-side** as time since round start; anything > `roundMs` is late → ignored for scoring (`rules-engine.scoreRound` flags `late`).
- Early round end: when every **connected** player's submission status is `locked`, server waits 1.2s (anticipation) then reveals. Disconnected players' missing answers become NO SIGHTING rows.

## 6. Disconnects, rejoin, refresh
- Socket close → player marked `connected:false` (pill greys out via `state`); seat retained.
- **Rejoin:** client reconnects with `?room&token`; server re-attaches the socket to the retained player and replays current context: `state` + (if WRITING) `roundStart` with remaining time + the player's pending suggestion/lock. **Verified in prototype: mid-round reload resumes the round** (`06` §5).
- Seat cleanup after 120s disconnected only in LOBBY/RESULTS (host reassignment to earliest remaining player); during a game the seat persists to round end (a disconnected player simply scores NO SIGHTINGs).
- All players gone → room GC'd after 5 min.
- Refresh mid-reveal/results → `state` + `results` replay puts the client back on the right screen.

## 7. Exploit hardening (MVP bar, all implemented in prototype)
| Threat | Mitigation |
|---|---|
| Flooding | 12 msgs / 5s per socket → `rate_limited` |
| Oversized/absurd payloads | raw truncated to 64 chars server-side; message JSON parse-try/catch; unknown types ignored |
| Double answers / answer swapping | first `locked` submission final (`already_locked` ack) |
| Timer manipulation | server-only deadlines; client timers are cosmetic |
| Catalogue scraping | catalogue never sent before reveal; reveal exposes only canonical+tier+rarityPct |
| Nickname spoofing/abuse | dedup with numeric suffix, 14-char cap, escaping, denylist (content-side) |
| Code guessing / ghosting | 4 chars from 31-symbol alphabet ≈ 923k codes; join refused mid-game; no public list in MVP |

## 8. Server/client responsibility split
| Server (authoritative) | Client (presentation) |
|---|---|
| Rooms, codes, join rules | Screens, animations, sounds |
| Round timing & phase transitions | Cosmetic countdown (offset-corrected) |
| Catalogues, validation, fuzzy match | Input UI, suggestion chip, "No echo" flash |
| Scoring, TWINS, standings, tie-breaks | Reveal choreography, podium |
| Rate limits, sanitisation, persistence of reports | localStorage identity (`room/pid/token`, nickname) |

## 9. Performance expectations
One room ≈ 10 players × (1 state/round-change + a few acks) — trivially handled by `ws` on 1 vCPU: hundreds of concurrent rooms fit in memory (~2KB/room state, packs shared). Static page ≈ 8KB. Bottleneck is the phone keyboard, not the server. No scaling work is in scope (see `09` Q-05).

## 10. Technology choices (evaluated, not assumed)
- **Node + `ws`**: chosen after verifying the deployment path end-to-end (WSS through instabox-port confirmed). Zero transitive deps beyond `ws`.
- **Socket.IO**: rejected for MVP (heavier, adds engine.io); retained as fallback plan if school-network WebSocket blocking shows up in playtests (D-07). The JSON protocol above maps 1:1 to Socket.IO events if needed.
- **TypeScript**: for the production build (the prototype is plain JS ESM; the handoff defines the port).
- **No database, no Redis, no auth service** — deliberately (privacy + ops simplicity for a minors audience).
