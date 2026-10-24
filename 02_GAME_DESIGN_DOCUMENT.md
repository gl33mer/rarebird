# 02 · Game Design Document — RAREBIRD

Companion specs: scoring detail in `04`, multiplayer protocol in `03`, screens in `05`. The reference implementation of every rule here is `validation/rules-engine.mjs` (38 passing unit tests).

---

## 1. Product and experience

### 1.1 Positioning
A free browser party game of absurd knowledge. "The rarest right answer wins." No app, no account, no tutorial — a code and a nickname. For friend groups (~13–17) with 10–20 minutes: school breaks, bus rides, sleepovers.

### 1.2 Target players and situations
- **Primary:** groups of 3–8 friends, each on their own phone, in the same room or scattered.
- **Secondary:** pairs (works, spicier); up to 12 supported.
- **Situation:** "we have 15 minutes" — join ≤30s, game 4–8 min, rematch instantly.

### 1.3 Core player motivations
1. **Show off obscure knowledge** — the kid who knows the rarest bird (answer) gets the glory.
2. **Shared surprise** — hearing what friends came up with; the TWINS moment; the "you know THAT?" reaction.
3. **Readable competition** — everyone understands "rare = more points" in one sentence; standings update every round.
4. **Rematch hunger** — "I have better answers this time" is always one tap away.

### 1.4 The central mechanic and why it's enjoyable
One open-ended prompt, one secret answer, a shared clock. The pleasure is the **reveal ladder**: Pigeons come home first (cheap laughs), rare birds land last (the dramatic close), and the scoreboard explains itself. Knowledge breadth + judged risk ("do I go safe with Spain or dig for Vanuatu?") replace pure speed.

### 1.5 The first 30 seconds
1. Friend sends a link (or the site URL) — page loads instantly to one screen: nickname box, **Create a room**, code box + **Join**.
2. Type nickname (persisted locally) → Create → a big 4-letter code appears ("HAZJ").
3. Friends open the link, type nickname + code → they pop into the lobby as name pills.
4. Host taps **Start** (3 rounds default). 3-second flock countdown → first prompt. Total elapsed: ~25–30 seconds.

### 1.6 A complete representative session (worked, from the verified prototype run)

Players **Ada, Bob, Cleo** · 3 rounds · 30s each.

- **Round 1 — "Name an animal."** Ada locks "Dog" in 6s (safe). Cleo types "asdfqwerty" → *"No echo! Try again."* → corrects to "Cat". Bob waits... and submits "Saiga" at 22s. Clock ends. **Reveal:** Dog *(Pigeon ·10)* → Cat *(Pigeon ·10)* → Saiga *(Rare Bird ·100 — the rarest band of the catalogue, 2 of 10 valid answers live here)*.
- **Round 2 — "Name a country."** Everyone locks. Reveal: "United States" *(Pigeon ·10, TWINS ×2 — Ada & Cleo both said it, badge shown, points unchanged)* → "Peru" *(Starling ·30)* → "Vanuatu" *(Kingfisher ·60)*.
- **Round 3 — "Name a colour."** Bob mistypes "Ceriise" → chip: *"Did you mean Cerise? [Submit it]"* → confirms *(Rare Bird ·100)*. Ada: "Blue" *(Pigeon ·10)*. Cleo: "Green" *(Sparrow ·15)*.
- **Podium:** 🥇 Bob 260 · 🥈 Cleo 55 · 🥉 Ada 30. Best sighting callout: *“Bob spotted ‘Saiga’ — Rare Bird, +100.”* → **Rematch 🔁** (2 of 3 tap it) → new prompts, scores reset, same room.

Session length: ~5 minutes for 3 rounds. This exact session ran across three independent browser sessions in the prototype (see `06` §5).

### 1.7 Session duration, replayability, invites
- 3 rounds ≈ 4–5 min; 5 ≈ 7 min; 7 ≈ 9 min (host chooses 3/5/7).
- Rematch = one tap by a majority; prompts reshuffle from the pack, tiers stay.
- Invite = share URL + 4-letter code (or the code alone if the URL is known). No friction, nothing to install.

### 1.8 Making feedback satisfying
- Answer lock: immediate "✓ locked in" + a settled bird icon — kills double-guess anxiety.
- Reveal: staged pop-in (450ms/row), tier chip colour-codes the payoff, running points, sound "chirp" per row (muteable).
- Rarity transparency line under rare answers ("only 9 of 195 valid answers are rarer") — turns "why did that get 100?" into "ok, fair" (the #1 complaint about the reference game, pre-empted).

## 2. Game rules

### 2.1 Round sequence and states
Room states: `LOBBY → COUNTDOWN (3s) → WRITING (timer) → REVEAL (auto, rows×2.2s + 2.5s, capped 14s) → [next round COUNTDOWN…] → RESULTS → (REMATCH → COUNTDOWN)`.
All transitions are **server-authoritative** (see `03`). Reveal auto-advances; host may skip it. WRITING ends early when every connected player has locked an answer (plus 1.2s grace for drama).

### 2.2 Prompts
Format: **"Name a ⟨category⟩."** + optional parenthetical example ("(like France)"). Each prompt is backed by a **finite curated catalogue** (30–500 answers) with tier assignments. Example styles (real pack shipped): *Name a country. · Name a chemical element. · Name a colour. · Name an animal. · Name a fruit.* Good prompts are: broadly known as a category, have a long popularity tail, unambiguous edges, teen-appropriate, fun to say aloud.

### 2.3 Answers and validation
- One answer per player per round. First valid submission **locks**.
- **Normalization:** casefold, accent-fold, punctuation→space, collapse spaces, strip leading articles ("the/a/an"). "The Netherlands" = "netherlands".
- **Aliases:** each catalogue entry carries aliases ("USA", "U.S.", "America" → United States; "Holland" → Netherlands; "Fe" → Iron). Alias hits count as the canonical answer and score identically.
- **Misspellings:** near-miss within edit-distance budget (≤1 for 5-char, ≤2 for longer, unique best match only) → *"Did you mean X?"* chip → **confirm to lock**; time keeps running (the reference game's proven pattern).
- **Invalid:** *"No echo! Try again."* — round continues, clock keeps running; unlimited retries within the timer.
- **Timeout / no lock:** 0 points, shown as **NO SIGHTING** in the reveal.
- **Missing valid answer:** "Report missing bird" link on invalid feedback → anonymous report stored for editorial review (fixes the reference game's most-heard complaint).

### 2.4 Scoring
Tiers by **rarity percentile within the prompt's catalogue** (how far from the most-likely answers; percentiles computed at authoring time, `04`):

| Tier | Rarity percentile (of valid answers) | Points | Colour |
|---|---|---|---|
| **PIGEON** | 0–29% (most common) | **10** | grey |

*Ladder v2 (2026-10-24): points are 10/20/40/65/85/100 — deliberately distinct from the reference game's exact ladder (review: clone-visibility).*
| **SPARROW** | 30–59% | **15** | sage |
| **STARLING** | 60–84% | **30** | sky |
| **KINGFISHER** | 85–94% | **60** | teal |
| **MEGA** | 95–98% | **85** | gold |
| **RARE BIRD** | top ~1–2% | **100** | pink |

- Round score = tier points. **No other modifiers in MVP.**
- **TWINS:** two or more players locking the same canonical answer → both rows show **TWINS ×n**; points unchanged (a story, not a punishment — deliberate contrast with Jinxed's split rule; revisit post-playtest via config flag `twinsPolicy`).
- **Late answer** (arrives after deadline server-side): ignored (server clock is the only clock).
- **Tie-break (final standings):** total points → **countback** most RARE BIRDs, then MEGAs, then KINGFISHERs → still tied: **shared place** (no sudden death in MVP).

### 2.4b Double or Nothing (wager — field experiment, implemented in prototype)

After your answer locks, you may tap **🎲 Double or nothing** (once per round, before the round ends):
- KINGFISHER / MEGA / RARE BIRD → **×2 points**
- PIGEON / SPARROW / STARLING → **½ points** (floor 5)
- No answer / invalid → nothing to double (wager void)
The reveal shows **×2!** or **½** badges on wagered rows. Rationale: a self-confidence bet adds Krillion-style "do I really know this?" tension to the safe-pick problem without turn structures; it is opt-in per player per round, so newcomers can ignore it. Config `wagers: 'double' | 'off'`; production default decided post-playtest (D-23).

### 2.4c Flock chat (added field round 5)

Left-anchored slide-in chat drawer (💬 toggle, unread badge) in every room: nickname + message, ephemeral (never persisted; ring-buffered in `/log` for QA). Guardrails: 100-char cap, control-char stripping, profanity mask (🐦 replacement), 5 messages/10s per player, shared socket rate limit. Rationale: the owner wants live banter during rounds; keep it ephemeral + filtered for a minors audience. Production must re-evaluate moderation load before launch (`09` Q-09).

### 2.4d Themes (added field round 5): Dusk Birds × Cosmic Voyage

The identity is swappable **theme packs** over the same rules: canonical tier names and points never change; a theme reskins the metaphor. **Cosmic Voyage** (owner's idea): rarity = *distance from Earth* — tier flavors Low orbit → The Moon → Mars → Jupiter → Kuiper Belt → Interstellar; procedural starfield (seeded per room), nebulae, and an Earth sprite that **shrinks as rounds advance** (the room literally flies farther away). Host picks the theme in the lobby. The graphics contract (`05` §0a) means illustrated art later drops into the same slots.

### 2.4e Think tank — candidate interest mechanics (evaluated 2026-10-23)

| Mechanic | Verdict |
|---|---|
| **Self-confidence wager (Double or Nothing)** | **Implemented** — fits simultaneous play, one tap, big reveal drama |
| Hi/Lo duels (bet whether answer A is rarer than B) | Strong but turn-based; reshapes the loop — future mode, not modifier |
| Predator tokens (steal from a Pigeon-answer player) | Adds attack dynamics; risk of feel-bad moments for the target; future mode |
| Unique-flight bonus (+10 if your answer is rare AND unmatched) | Cheap always-on nudge; hold until wager is playtested (stacking complexity) |
| Second Wind (last place earns ×1.5 on next rare hit) | Rubber-band keeps teen groups together; candidate v1.2, needs group-size tuning |
| Per-prompt "hint: first letter of a MEGA answer" | Anti-friction for stuck players; try after content grows further |
| Streak-within-game (3 rounds ≥KINGFISHER = crown flair) | Cosmetic glory; cheap; bundle with v1.2 polish |

Decision rule for adopting any of these: one new mechanic per playtest round, measured against `06` §8 criteria — never two at once.

### 2.5 Time limits
- WRITING: **30s default**; host can set 20s ("Frantic") or 45s ("Relaxed"). Simulation evidence: 20s raises luck/speed weight, 45s makes pure knowledge dominant, 30s keeps "smart rare" vs "deep rare" in tension (`06` §3).
- COUNTDOWN 3s; REVEAL auto-advance = rows×2.2s + 2.5s settle, capped at 14s (host may skip).

### 2.6 Worked example (real catalogue numbers)
Prompt: *Name a country.* (catalogue: 197, from `sample-content/starter-pack.json`)
- "United States" → PIGEON → +10
- "Peru" → STARLING → +30 (popularity rank 133rd of 197)
- "Vanuatu" → KINGFISHER → +60 (rank 161st of 197; editorial override — see `04` §2)
- "Saint Vincent and the Grenadines" → RARE BIRD → +100 (rank 195th of 197 — only 2 valid answers are rarer)
- "wopper" → no echo; "Kazakstan" → chip "Did you mean Kazakhstan?" → confirm → tier of Kazakhstan (STARLING +30, editorially overridden)
- Timeout → NO SIGHTING, +0

### 2.7 Exploits, dominant strategies, edge cases
- **Copy-the-brainiac?** Impossible during a round: answers are hidden until everyone's clock ends.
- **Always-max-rarity bot?** Valid but risky in the field: obscure answers are slower to recall/type and more likely to be fumbled (modeled in simulation; 20s timer punishes it hardest). Design intent: knowledge should pay, speed should matter a little. Sim shows no strategy above ~60% win share at 30s.
- **Alias farming** (answer "USA" instead of "United States"): scores identically by design; no exploit.
- **Duplicate identities / 12 phones one kid:** rate limit (12 msgs/5s), one answer per round per connection, room cap 12. Acceptable.
- **Mid-round join:** queued as spectator until next round (join allowed in LOBBY/RESULTS only in MVP).
- **Everyone times out:** reveal still runs (all NO SIGHTING rows); game continues.
- **1-player room:** allowed (practice), standings trivially crown them; no special-casing.
- **Same answer via different aliases** ("USA" vs "United States"): same canonical → TWINS correctly detected.

### 2.8 Keeping scoring understandable and fair
Six tiers, one sentence each; points are round numbers; the reveal always shows tier + points + rarity line. Fairness rests on the catalogue being finite and visible-ish: players can reason "195 answers exist, mine was the 193rd most popular". Editorial guidelines (`04`) keep tiering consistent with teen intuition rather than raw web metrics.

### 2.9 Optional modes and future extensions (explicitly NOT MVP)
- **Solo Daily** (same 5 prompts for everyone, midnight-local reset, emoji share line "RAREBIRD 🦜 372") — the retention layer, v1.1.
- **Hot-potato mode** (Puffer-style elimination) — different session shape; v2 candidate.
- **Jinx mode** (twins split points) — one config flag away; decide post-playtest.
- **Public room list / matchmaking, ratings** — only when a stranger population exists; contradicts friends-first MVP.
- **Trend packs** (rising/falling fame prompts) — seasonal content experiment.

## 3. Content design (summary; full detail in `04`)
- Content unit = **prompt** with catalogue [{canonical, aliases[], tier, evidence}].
- Two pipelines proven: **data pipeline** (Wikidata SPARQL → pageview percentiles → editorial pass) and **hand-authoring** (small curated lists). Both shipped in `sample-content/starter-pack.json`.
- Sample deck (shipped, sufficient for real games): countries (195, data-pipeline), chemical elements (118, data-pipeline), colours/animals/fruits (10 each, hand-authored demos). **Launch bar for production: ≥40 prompts across ≥8 domains** (`04` §6).
- Missing-answer reports flow to a JSONL file for editorial triage.

## 4. Progression and retention (minimal by design)
- **In MVP:** nothing persistent except the nickname. No streaks, no accounts, no leaderboards. Justified: the party loop's replay engine is the group, not the meta.
- **v1.1 (post-playtest):** Solo Daily with local streak + share line; "packs" of prompts by theme (school subjects, music, games…).
- **Explicitly rejected for now:** global ratings, accounts, unlockables — persistent identity for minors adds privacy surface and moderation burden with no proven payoff for a friends-first game.

## 5. Privacy, safety, tone
- Nickname only; no accounts, no personal data, no chat (answers are the only user text and are validated against catalogues; free text is never rebroadcast raw — reveals show the *canonical* match or the typed string capped at 64 chars).
- Nicknames: 1–14 chars, whitespace-collapsed, shown with basic escaping; profanity filter list at server (simple denylist, `05` §7).
- Missing-answer reports are anonymous (room code + typed string + prompt id, no IPs stored).
