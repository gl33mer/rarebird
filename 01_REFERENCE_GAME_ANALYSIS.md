# 01 · Reference Game Analysis

**Status:** Complete · **Evidence gathered:** 2026-10-23 (all dates checked 2026-10-23 unless noted)
**Method:** first-hand browser automation of the live games (Chromium + Playwright-core on this InstaBox), plus targeted web research. Screenshots in [`screenshots/`](screenshots/); raw interaction logs in [`research-notes/`](research-notes/).

Legend used throughout: **[OBS]** = directly observed in the live interface; **[INF]** = reasonable inference, clearly reasoned; **[UNK]** = unknown / not observable; **[3P]** = third-party claim not verified against first-party sources.

---

## 1. Games investigated

| Game | URL | Relationship | How investigated |
|---|---|---|---|
| Krillion — The Daily Dive | https://krillion.io/ | Original reference | Played several full dives with scripted browsers |
| Krillion — Puffer Party | https://krillion.io/party | Official multiplayer mode | Hosted a private room, drove 3 automated players through a complete match |
| Krillion — Unlimited / Archive / Packs | https://krillion.io/unlimited/classic, /archive, /packs | Official modes | Loaded and inspected |
| Jinxed | https://jinxed.party/ | Independent competitor inspired by Krillion | Landing + rules |
| "Krillion Unlimited" on Playdaily | https://playdaily.org/krillion | **Unofficial clone riding the brand — not the original** | Web research (3P + page content) |
| Noillirk (Playdaily) | https://playdaily.org | Inverted variant (most-common wins) | Web research (3P) |

> **Critical disambiguation.** `playdaily.org/krillion` is *not* the reference game. It is a third-party implementation that brands itself "the original Krillion game with an added unlimited mode" with its own scoring constants (e.g. Plankton = 4 pts/40 m vs the real game's 10 pts). Krillion's own FAQ warns that "others have falsely claimed to be the creator, including someone behind a copycat clone." Mechanics, content and ownership of the two must never be conflated. **[3P/OBS]**

---

## 2. Krillion — The Daily Dive (single-device core game)

### 2.1 Core loop **[OBS]**

1. Landing page: title screen with depth-themed scenery, `DIVE #100`, buttons: `BEGIN DESCENT`, `ARCHIVE ⟲`, `THEMED PACKS`, `UNLIMITED ∞`, plus `HOW TO PLAY`, `Privacy`, and a promoted `PUFFER PARTY` button with a live player count (~10,980 at check time).
2. How-to-play modal (verbatim):
   > 7 PROMPTS A DAY. SAME FOR EVERYONE.
   > 25 SECONDS TO NAME ONE THING.
   > RARE ANSWERS SCORE BIG. OBVIOUS ONES FLOAT.
   > THE PICK THAT FEELS CLEVER? THE SCHOOL THOUGHT OF IT TOO.
   > EVERY POINT SINKS YOU 10 METRES. 700 IS THE TRENCH.
   > ONE DIVE PER DAY. NO SECOND CHANCES.
3. Press `BEGIN DESCENT` → short atmospheric descent → prompt card: `PROMPT 1 OF 7`, the category text, hint `▼ rarer answers sink deeper ▼`, then a ~2 s "descending · the clock starts in 2" pre-round countdown before a 25 s timer starts.
4. Player types one answer into a dock input (button label `DIVE`) and submits.
5. Feedback: the answer "sinks" in the ocean scene to the depth of its tier; a card shows tier name, the echoed canonical answer, `+N PTS · sink Mm`, and flavor text (e.g. `PLANKTON / “Chicken McNuggets” / +10 PTS · sink 100m / The answer everyone blurts out.`).
6. Interstitial with a `DESCEND ▼` button — **round transitions are player-paced**, not auto-advanced.
7. After prompt 7: `DIVE COMPLETE` screen with total `SCORE` and total depth (e.g. 235 pts / 2,350 m) and a `SURFACE ▲` action.

### 2.2 Scoring **[OBS]**

Six named tiers, fixed point values, shown in-game as literal depth markers in the scenery:

| Tier | Points | Sink depth |
|---|---|---|
| PLANKTON | 10 | 100 m |
| TOO CLEVER | 15 | 150 m |
| SCHOOLER | 30 | 300 m |
| RARE | 60 | 600 m |
| DEEP CUT | 85 | 850 m |
| ONE IN A KRILLION | 100 | 1,000 m |

- Max score 700 ("THE TRENCH"); score × 10 m = depth. Depth zones (sunlight → midnight → abyssal → hadal) are decorated with real-world reference points (deepest scuba dive 332 m, Titanic at 3,800 m).
- Worked observations: "Chicken McNuggets" → PLANKTON 10; "Whopper" → low tier (observed sinking toward ~100 m; final tier card captured for McNuggets only) **[OBS/INF]**; "Chalupa" → SCHOOLER 30; "McFlurry" → SCHOOLER 30; "bombardier beetle", "hypotenuse", "lateral raise", "Wii Chess" all accepted (individual tiers not captured; dive total 235 over 5 valid answers) **[OBS]**.
- "TOO CLEVER" (15) sits between the most obvious tier and the mid tier — inferred to punish "obscure-but-wrong-feeling" or mildly-creative picks... its exact criterion is **[UNK]**; the name suggests answers that are trying too hard to be rare while still being relatively common.

### 2.3 Answer validation **[OBS]**

- **Invalid answer:** inline reply `“x”: no echo. try again` — the round *continues*, the clock keeps running; you may retry unlimited times within the timer. An expired timer yields `NOTHING LANDED / — / +0 PTS / the clock beat you to it.`
- **Misspelling:** near-miss `chiken mcnuggets` → correction widget: `“chiken mcnuggets” → corrects to “Chicken McNuggets” — submit again to confirm · or edit`. So: fuzzy-match suggestion + explicit confirm step (costing time). **[OBS]**
- **Casing/articles:** `WHOPPER` and `the whopper` both accepted same as `whopper` → case-insensitive, leading article stripped. **[OBS]**
- Exact rejection examples: `wopper`, `bic mac` (typos beyond threshold), `Chad` for an animal category. **[OBS]**

### 2.4 Prompts (content style) **[OBS]**

Dive #100 (2026-10-23) prompts, verbatim:

1. `Name a branded fast-food menu item (like the Big Mac).`
2. `Name an animal that sprays, spits or squirts something to defend itself.`
3. `Name a part of a 2D or 3D shape (like a radius).`
4. `Name an upper-body gym exercise (strength exercises only; no full-body moves).`
5. `Name a Nintendo Wii game.`
6. `Name a rap song with over 100 million Spotify streams.`
7. *(not captured — dive consumed)*

Style: open-ended "Name a X" with an example or a scoping qualifier; several are *constrained lists* ("with over 100M Spotify streams") that only make sense with a **curated finite answer catalogue**. A prompt referencing Spotify streams is strong evidence answers are editorially curated lists, then tiered. **[INF]**

### 2.5 Cadence, retention, monetization **[OBS + 3P]**

- One dive per day per browser identity (localStorage; no registration). Daily resets at **midnight local time** (dev AMA) — no global reset moment. **[3P]**
- Share format observed organically on X: `Krillion #99 🦐 170` (dive number + shrimp emoji + score). **[3P]**
- Unlimited mode (`/unlimited/classic`): "THE ENDLESS DIVE — dive after dive", per-browser dive counter, `OPEN THE DIVE LOG ∞`. **[OBS]**
- Archive: past dailies behind `UNLOCK UNLIMITED · $5 — one time. any unlock removes ads across the whole site.` **[OBS]** Monetization = one-time purchase, no subscription.
- Themed packs (`/packs`): Words & Language, At the Movies, Sports, Geography (30 chapters each), Music "coming soon"; banner `FREE FOR NOW · BETA / ANSWERS & SCORING MAY HAVE ISSUES`. **[OBS]**
- Launched ~mid-July 2026 (dive numbering: #1 on Jul 16, 2026 → #100 on Oct 23, 2026). Solo dev ("kp"). r/Krillion ≈25k members; #1 on the Playlin 40 chart (week of Oct 19, 2026). **[3P]**

### 2.6 Presentation quality **[OBS]**

Pixel-art ocean, CRT-ish scanline overlay, animated mascot with speech bubble ("blub!"), sonar-sweep timer widget, ambient depth flavor text streaming past. Sound toggle present. Very strong identity; the theme *is* the scoring metaphor (rarity = depth). Mobile-portrait layout works at 390×844.

### 2.7 Community pain points (design opportunities) **[3P, from r/Krillion threads]

- Distrust of opaque rarity: "How is answer rarity ACTUALLY determined?" — corpus-frequency + LLM assistance + manual review (dev FAQ/AMA), but players can't see why an answer got its tier.
- Valid answers rejected because the curated list is incomplete → frustration; no in-game channel to report missing answers.
- Autocorrect/alias generosity disputes (too strict vs too lax).
- These are the loudest complaints; both are addressable by design (finite catalogues + transparent per-answer rarity + a report-missing-answer button).

---

## 3. Krillion — Puffer Party (official multiplayer)

Investigated first-hand: hosted a private room, drove 3 automated players (separate browser contexts/devices) through a complete match to the victory screen. **[OBS unless noted]**

### 3.1 Meta structure

- Landing (`/party`): nickname (locked to marine creature tiers: KRILL, SCHOOLER "5-day", SQUID "14-day", ANGLER "30-day", EVIL "45-day" — time-based unlockables), player-count buckets (1V1 / 3S / 4–6 / 8–10), **RATED** (per-browser Elo, "RATING 1200", matchmaking "near your rating · it moves") vs QUICK PLAY (unrated), `HOST A ROOM` (PUBLIC · LISTED toggle), `JOIN BY CODE` (4 letters), and a live **PUBLIC ROOMS** list (~50 shown: code, host name, `n/seats · IN THE LOBBY|PLAYING`, JOIN/FULL). Live counter `WHO'S PLAYING` (~11k).
- Room seats observed in the wild: 2, 3, 4, 5, 6, 10, 16 → configurable seats, commonly 6.
- "your rating is saved on this browser · sign in to keep it everywhere" → optional accounts exist; casual path is browser-local.

### 3.2 Room & lobby

- Host lobby shows: room code, `LIVES 2`, `MIN. TURN 8s`, `SEATS 6` (all with ◀ ▶ steppers), `RULES EDIT`, per-player `READY` toggles, `WAKE THE PUFFER ▼` (start), `AUTO-JOIN`, `INVITE`, `HOW TO PLAY`.
- Guests see `▸ waiting for HostBot to wake the puffer` — **only the host starts**; everyone must be ready (host can presumably force-start with open seats — we started with 3/6 ready and it worked).
- Rules modal (verbatim):
  > Answer the question before the puffer explodes on you.
  > Rarer answers get you closer to an extra heart.
  > No reusing answers for the current question.

### 3.3 Match flow (observed in our 3-player game)

1. `GET READY — ▸ the puffer is waking up` countdown.
2. `CATEGORY 1` card, e.g. `Name a symbol or shape that appears on a national flag (like a star)`, hint `▼ any answer passes the puffer ▼`.
3. Turn order shown as `▸ GuestA is up` on spectators' screens and `▸ your puffer · type an answer` on the holder's screen. Answers broadcast live to everyone once accepted (answer text appears next to the player's name).
4. Invalid answer: `“pizza”: no echo. keep going` — retry until the puffer pops.
5. If the holder can't produce a valid answer in time, the puffer pops: the holder loses a heart (heart count visible near the input, e.g. 2 → 1 → 0), `▸ GuestA is out`, `FLOATING 2/3` tracker updates.
6. New category transitions: `CATEGORY 3 / New category / ▼ here it comes ▼ / NEW / Name a character from Peter Pan`.
7. Victory: `GAME OVER / YOU WIN — last one floating`, plus a **star rating prompt** (`HOW WAS THAT ROUND? 1 MEH … 5 GREAT`), `PLAY AGAIN`, `AUTO-JOIIN` buttons.

### 3.4 Design reading of Puffer Party **[INF]**

- It converts the rarity game into a **hot-potato elimination** game: knowledge breadth + speed under social pressure; the audience is spectators watching the holder sweat.
- Rarity is repurposed as a **heart economy** ("rarer answers get you closer to an extra heart") rather than points — rarity buys survivability, not victory margin.
- "No reusing answers" prevents cycling the same obvious answers and drains the common-answer pool over a category's life, forcing the group toward rarer territory — an elegant pressure curve.
- Costs: significant **downtime** for non-holders (watching others type); turn-based pacing is slow for a 15-minute school break with 6+ players; ratings/leaderboards add a persistent-identity pull the brief wants to avoid.

---

## 4. Jinxed (jinxed.party) — closest independent multiplayer comp

- Rules modal (verbatim) **[OBS]**: `Each round shows a prompt / Type all the answers you can / Rarer answers score more / Same answer as a friend? Jinxed!`
- Landing: nickname → CREATE A ROOM / QUICK PLAY / JOIN. Free, no signup; "BUY ME A COFFEE" donation monetization. **[OBS]**
- Third-party details **[3P]**: 4-letter room codes, up to 20 players, rare answers "brew better potions" (≈8,000 vs 1,000 pts), duplicated answers are "jinxed" and split points. Marketed directly at Krillion fans (`jinxed.party/like-krillion`, launched via r/Krillion post).
- Design reading **[INF]**: simultaneous brainstorm (type many answers) + rarity scoring + duplicate penalty = Scattergories' social tension with Krillion's rarity payoff. Typing many answers on phones is laborious; the jinx makes coincidence punitive.

## 5. Noillirk (playdaily.org) — inverted variant **[3P]**

Name literally "Krillion" reversed: 7 survey prompts, 15 s each, up to 30 players, **most-common answer wins** (Family-Feud direction). Existence proves the mechanic space around "how common is your answer" is active in both directions.

## 6. Genre lineage (summary; sources in 09 / reference list)

Family Feud (1976, most-popular wins) → Scattergories (uniqueness wins) → Pointless (BBC 2009, least-popular survey answer wins — the direct ancestor) → Google Feud (autocomplete guessing) → Krillion (2026, corpus-rarity daily) → multiplayer wave: Puffer Party (official), Jinxed, Noillirk, Playdaily clone. Academic ancestor: Battig & Montague (1969) category production norms; modern licensed survey dataset: ProtoQA (CC BY 4.0).

## 7. Cross-game comparison

| Dimension | Krillion Daily | Puffer Party | Jinxed | Noillirk |
|---|---|---|---|---|
| Play pattern | Solo daily, async social | Live turn-based elimination | Live simultaneous brainstorm | Live simultaneous |
| Answers per player/round | 1 | 1 (on your turn) | many | 1 **[3P]** |
| Rarity direction | rare wins | rare → extra hearts | rare wins, duplicates split | common wins |
| Round timer | 25 s | holder-limited (min turn 8 s) | round clock **[UNK]** | 15 s **[3P]** |
| Session length | ~3–4 min | minutes–10s of min | ~minutes | ~2–3 min |
| Join friction | none (solo) | nickname + code | nickname + code | nickname + code |
| Identity | browser-local streak | optional rating/accts | none | browser-local, optional sign-in |
| Downtime for a 6-player group | n/a | high (watching turns) | none (simultaneous) | none |

## 8. What the reference evidence implies for our design

1. **The daily solo loop is proven and loved**; the ask is to make it *social and synchronous* for friend groups.
2. **Simultaneous play fits the 15-minute-break constraint** better than hot-potato turns (no spectator downtime), a gap neither Puffer Party (turn-based) nor Jinxed (typing-many strain) fills cleanly.
3. **Hidden answers + synchronized reveal is the key party ingredient** the reference games lack in solo mode — the emotional payoff of rare-answer games is the *reveal*, and doing it together multiplies it.
4. **Finite curated catalogues** (evident from Krillion's constrained prompts) are the dependable backbone for validation + transparent tiers; community's biggest complaints (opaque rarity, rejected valid answers) are fixable by making catalogues visible-ish and reportable.
5. **Fuzzy-correction-with-confirm** is the validated UX for misspellings; **retry-on-invalid within the timer** is the validated pacing (no round loss, just time pressure).
6. **4-character join codes + nickname + no signup** is the standard, proven join flow (Krillion Party, Jinxed, Codenames, Kahoot-style PINs).
7. **School-network reality:** WebSocket-based .io games are sometimes blocked by school filters; a transport with an HTTP polling fallback is a real consideration, not paranoia.
8. **Don't copy** Krillion's ocean/depth identity, prompt wording, tier names, or code — mechanics-level inspiration only, per the mission's IP constraints.

## 9. Source list (checked 2026-10-23)

**First-party (played/inspected directly):** krillion.io (home, dive #100, how-to-play, unlimited, archive, packs) · krillion.io/party (hosted match) · jinxed.party (landing, rules) — screenshots in `screenshots/`.
**Third-party:** r/Krillion (~25k members) + dev AMA + criticism threads · KrillionHQ archive (dive numbering → launch ~2026-07-16) · Playlin 40 chart (#1, week of 2026-10-19) · X share-format posts · playdaily.org + /krillion (clone) · jinxed.party/like-krillion · ProtoQA dataset (github.com/iesl/protoqa-data, CC BY 4.0). Full URLs in `09_DECISIONS_AND_OPEN_QUESTIONS.md` reference list.
