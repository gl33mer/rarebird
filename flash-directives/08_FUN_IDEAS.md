# 08 · FUN IDEAS BACKLOG — creative additions (MAX, 2026-10-24)

Owner mandate: make it *fun*, stay original vs the Krillian-verse (Krillion daily = depth dive; Puffer Party = hot-potato hearts; Jinxed = type-many + duplicate jinx; Noillirk = inverted most-common; Playdaily = utilitarian clone). Our differentiators already: simultaneous hidden answers + synchronized altitude reveal + SPLIT + Top Call + themes. Ideas below are ranked by (fun-per-implementation-cost). Status: ✅ commissioned (directive 08) · 🧪 playtest-gate · 📋 parked.

## ✅ Commissioned in directive 08 — implement in `flash/fun-v1`

1. **Prediction micro-bet — "Read the Flock"** (the dead-time killer; the review's best idea, now concrete). After you lock your answer and while others are still writing, you may tap one player's name: "their answer will fly highest." If correct (their post-split tier is the unique top) → **+25 bonus and +1 feather**; wrong → nothing (no penalty — it's a free side-bet that costs only attention). Server resolves at reveal; shown as a small 🔮 row in the reveal. Why fun: it converts the 20s of waiting into social mind-games ("Maya ALWAYS says Vanuatu"), and it's repeated at school the next day. Cost: modest — protocol gains `prediction {targetPid}`, resolved in scoreRound's caller, one reveal field.
2. **Sudden-death tiebreak.** If the top two standings tie after the final round (post countback), the room auto-plays **one extra round** ("SUDDEN DEATH — highest flight wins") with feathers disabled and a 20s timer. Removes shared-podium anticlimax; ties currently end in 🥇=🥇 which teens will find flat. Cost: small state-machine branch (results → tie → one more round → results).
3. **Emoji share grid.** Upgrade "Copy result to share" to a Wordle-style line the owner's peers already use on X: `RAREBIRD 🦜 3/3 — 🕊️🦅🦜 / ✨🦉🦜 / 🦜🐦🦜` (tier emoji per round, own answers). One string, viral loop, zero accounts. Cost: trivial.
4. **Mystery modifier rounds.** Each game, one random round (never the first) gets a modifier drawn from: **Blind** (example + size hidden), **Double feathers** (wager refunds doubled), **Blacklist** (one PIGEON answer is pre-banned, shown as "🕊️ grounded"). Variety without new rules to learn; each modifier is a small gate on existing fields. Cost: modest.

## 🧪 Playtest-gate (build only after human evidence)
- **Second Wind** (last place earns ×1.5 on rare tiers next round) — rubber-band; risk: feels patronizing to the leader. Sim exists; playtest first.
- **Rivalry pairs** (secret rival per game; beat them for a crown flair) — fun, but needs 4+ players to matter; watch playtest group sizes.
- **Streak flair** (3 KINGFISHER+ in a row = crown by your name) — cosmetic, cheap, wait.
- **Sound-synced reveal** (stingers already exist; full choreography) — after graphics-depth lands.

## 📋 Parked / rejected
- **Accounts, daily streaks, global leaderboards** — retention via accounts is rejected for a minors audience (D-09); local streaks are the compromise already in v1.1 scope.
- **Real-money / cosmetic shop** — cosmetics (hat-wearing birds) are plausible post-playtest; store infrastructure is not.
- **3D models for gameplay objects** — 3D stays backdrop (D-38); gameplay readability is DOM-first.
- **LLM live-judged categories during rounds** — authoring-only (D-16/D-31).

## Competitive-landscape note (from existing research; new pass unnecessary)
Nobody in the sampled landscape has: simultaneous hidden answers with a synchronized altitude reveal, room-relative SPLIT scoring, or a dead-time prediction layer. Jinxed owns duplicate-punishment; Noillirk owns inversion; Puffer Party owns turn-pressure. Our lane — **"the reveal is the show, and you bet on your friends"** — is open. Protect it: any future mechanic must keep the reveal as the emotional peak.
