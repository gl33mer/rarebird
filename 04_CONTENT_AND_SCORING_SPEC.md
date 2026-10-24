# 04 · Content and Scoring Specification — RAREBIRD

Everything here is demonstrated by real artifacts: `sample-content/starter-pack.json` (generated 2026-10-23 from live Wikidata + Wikimedia Pageviews data) and `validation/rules-engine.mjs` (38 passing tests).

---

## 1. Content schema

```jsonc
pack = {
  id: "starter-pack-v1",
  generated: "2026-10-23",
  source: { wikidata: "CC0", pageviews: "2026-09 monthly, agent=user, Wikimedia Pageviews API (CC0)" },
  prompts: [ prompt, … ]
}
prompt = {
  id: "geo-countries",            // stable slug
  text: "Name a country.",
  example: "like France",          // optional, shown under the prompt
  catalogueSize: 197,
  catalogue: [ entry, … ]
}
entry = {
  canonical: "United States",      // display + match target
  aliases: ["USA","US","America","U.S.","United States of America"],
  tier: "PIGEON",                  // PIGEON|SPARROW|STARLING|KINGFISHER|MEGA|RARE BIRD
  evidence: {                      // audit trail — why this tier (never shown in-game except rarityPct)
    viewsSept2026: 1520446,        // raw popularity signal
    rarityPct: 0,                  // percentile within catalogue, 100=rarest
    wikidata: "Q30",
    tierFromData: "PIGEON",        // pre-override tier
    note?: "manual override: news traffic"
  }
}
```

Rules: aliases ≤14 per entry; catalogue size 30–500 (smaller = guessing noise; larger = editorial burden); every entry needs at least one objective popularity signal or an explicit `note`.

## 2. Where tiers come from (the core of the game's fairness)

**Definition: an answer's tier measures how unlikely a typical player is to say it — not how often the internet reads about it.**

Pipeline (all authoring-time, zero runtime API calls):

1. **Enumerate the catalogue** — Wikidata SPARQL (CC0). E.g. `?c wdt:P31 wd:Q3624078` → 197 sovereign states with labels + aliases + enwiki sitelinks. Executed scripts: `fetch-countries.mjs`, `fetch-elements.mjs`, `fetch-views.mjs`, `build-pack.mjs` (all preserved in `content-pipeline/` of this package).
2. **Rank by popularity** — Wikimedia Pageviews per-article API, `agent=user`, one recent full month, one request per title (~350ms spacing: 197/197 succeeded, no 429s; `fetch-views.mjs`).
3. **Percentile → provisional tier** — sort catalogue most→least popular; `rarityPct = round(100·rank/(n−1))`; map through the tier table (below).
4. **Editorial pass (mandatory)** — a human fixes what raw data gets wrong. Real traps caught during this design pass, each documented in `09`:
   - **Duplicate entities:** "Netherlands" vs "Kingdom of the Netherlands" are *both* sovereign states in Wikidata — must merge (views re-fetched for the common-name article: Netherlands 212k vs the Kingdom's 42k).
   - **Attention ≠ answer-likelihood:** Yemen (news-driven, 322k views) ranked among the most "popular" countries although almost nobody would *say* Yemen for "name a country" — editorially demoted from PIGEON to STARLING. Same for Israel, Ukraine, Syria.
   - **Formal names:** keep the common name as canonical ("China", not "People's Republic of China").
   - **Missing real-world knowledge:** aliases for how teens actually type (USA, U.S., UK, England→United Kingdom? **No** — England is a distinct entity; UK aliases Britain/Great Britain, and England resolves to its own entry if present).
5. **Publish** — pack JSON committed to the repo, loaded at server boot.

**Alternative signal sources evaluated** (full report in research notes): Wikidata (CC0) ✅ used · Pageviews API/dumps (CC0) ✅ used · ProtoQA human-survey dataset (CC BY 4.0) — good calibration source for future survey-style prompts (attribution required) · Steam/Twitch/Last.fm/GeoNames — usable per-domain, deferred · Google Trends (alpha-gated) and Spotify (dev-mode lockout) — not usable. **Our own aggregated answers** become the best signal post-launch: log every locked answer (prompt id + canonical) and re-tier packs from observed frequencies in ~monthly refreshes (v1.1; privacy-safe: no player linkage, counts only).

## 3. Tier table (canonical)

| Tier | rarityPct | points | counts in the shipped 197-entry country catalogue |
|---|---|---|---|
| PIGEON | 0–29 | 10 | 54 |
| SPARROW | 30–59 | 15 | 59 |
| STARLING | 60–84 | 30 | 51 |
| KINGFISHER | 85–94 | 60 | 22 |
| MEGA | 95–98 | 85 | 8 |
| RARE BIRD | 99–100 | 100 | 3 |

Points ladder 10/15/30/60/85/100 mirrors the reference game's proven 10/15/30/60/85/100 (identical mathematics, our own names/identity). Why six tiers: matches player intuition of "obvious / normal / less common / rare / very rare / insane", and the ladder keeps a 5-round game's totals in the 100–400 range — readable numbers.

## 4. Answer validation (normative)

Implemented and unit-tested in `validation/rules-engine.mjs`:

1. **Normalize** (both sides): NFKD → strip combining marks → lowercase → `&`→" and " → non-alphanumeric→space → collapse → strip leading `the|a|an|el|la|les|der|die|das`.
2. **Exact match** on normalized canonical + aliases → `valid` (locked).
3. **Fuzzy suggest** if no exact hit: edit distance ≤ `min(2, floor(len/6))` (0 for ≤3 chars, 1 for ≤5) against every canonical+alias, unique best only → `suggest` → player confirms → locked as canonical.
4. Else `invalid` → "No echo! Try again." (retry freely; clock runs).
5. First valid/suggested-and-confirmed answer **locks** the player for the round.

6. **Acronym/space folding:** each canonical/alias is indexed under its normalized form **and** its space-collapsed form, and lookups try both — so `U.S.A.` → `u s a` → `usa` matches alias `USA`, and `unitedstates` matches `United States`. (Added after field QA: punctuated acronyms were bouncing.)

Worked cases (tested): `WHOPPER`≡`whopper` · `the Gambia`≡`Gambia` · `USA`/`U.S.A.`/`unitedstates`→United States · `Unted States`→suggest "United States" · `wopper`/`zzzqxv`→invalid · `Fe`→Iron · `Holland`→Netherlands.

## 4b. Prompt & rating generation tooling (added 2026-10-23)

`content-pipeline/generate-prompts.mjs` — three draft modes, **always followed by the human editorial pass**:
- `class QID "Name a X." "like Y" [cap]` — Wikidata class → catalogue → pageview tiers; auto-flags top-10%-by-views entries (`TOP-VIEWS: verify teens would actually say this`) for the attention-bias review.
- `list file.txt` — hand lists (`text || example` header, `canonical | tier | aliases;…` rows).
- `constrained "text" --seeds=A,B` — stubs for subset prompts (e.g. "flag has exactly two colours"); catalogue needs LLM-assisted or hand curation, then verification.
`content-pipeline/rate-catalogue.mjs` — empirical calibrator: merges `answers.jsonl` (every locked answer is now logged by the server: promptId + canonical + tier) into a per-prompt report suggesting tier adjustments (e.g. "said 30% of the time but tiered KINGFISHER — consider demoting"). Empirical tiers become authoritative at ≥100 observations per prompt. This is the "better ratings" flywheel: play → log → calibrate → re-tier.

## 4c. Fuzzy matching v2 (kids & non-native speakers, added 2026-10-23)

Layered matching in `resolveAnswer`, all suggestions confirm-gated (never auto-lock):
1. Normalized exact (casefold, accents, articles, punctuation, space-collapse/acronyms).
2. **Token-subset with fuzzy tokens** — "saint kitts nevis" = "Saint Kitts and Nevis"; "teh netherlands" (transposed article) matches because each typed token fuzzy-matches an entry token or a filler word.
3. **Damerau-Levenshtein** (transpositions cost 1: "teh"→"the") within length-scaled budgets.
4. **Phonetic (Soundex) suggestion** — severe misspellings ("Kolombia" → Colombia) still get a *chip to confirm*, gated to ≥5-char words with 2+ significant phoneme digits so "ZAF"/mash never trigger it.
Tested: 54/54 unit cases including the false-positive traps.

## 5. Scoring edge rules
- TWINS on canonical match (aliases count): badge only, MVP (config `twinsPolicy: 'badge'|'none'|'jinx'` — `jinx` splits points and is OFF pending playtest).
- Late (past server deadline): not scored.
- No lock by deadline: NO SIGHTING row, 0 pts.
- Standings tie-break: points → countback (RARE BIRD count, then MEGA, then KINGFISHER) → shared place.

## 6. Prompt catalogue for launch (content plan)

| # | Prompt | Domain | Catalogue source | Size |
|---|---|---|---|---|
| 1 | Name a country. | geography | **built** (Wikidata+pageviews, shipped) | 197 |
| 2 | Name a chemical element. | science | **built** (shipped) | 118 |
| 3–6 | Name a colour / animal / fruit / European capital | mixed | demo built (colours/animals/fruits shipped, 10 each — expand to 40–80 by hand) | 40–195 |
| 7–10 | Name a sport / musical instrument / dog breed / planet&moon | mixed | Wikidata enumerations + pageviews | 30–200 |
| 11–14 | Name a brand of… / a video game console / a Marvel character / a pizza chain | pop culture | hand-curated (100–200 each) | 40–150 |
| 15–20 | Seasonal/school packs | — | hand-curated | 30–60 |

**Launch bar: ≥40 prompts, ≥8 domains, no domain >20% of the pack** (diversity so rematches don't repeat). Prompt repetition guard: a room never draws the same prompt twice in one game; consecutive games prefer least-recently-used prompts.

## 7. Content authoring & review pipeline
1. Draft catalogue (script or hand).
2. Fetch popularity signals (script, timestamped).
3. Compute provisional tiers (script).
4. **Human review pass** — checklist: duplicates merged; news-contamination overrides; canonical = common name; aliases cover teen spellings/abbreviations; obvious entries sanity-checked against intuition ("would a 15-year-old know this exists?").
5. Playtest locally (the validation harness scores sample answers against the pack).
6. Merge PR; pack version bumps; server reloads packs on deploy.

## 8. Missing-answer reports (the reference game's loudest complaint, fixed)
- Invalid-feedback UI carries a small **"Report missing bird"** link (active only on `invalid`).
- Server appends `{promptId, typed, code, ts}` to `reports.jsonl` (no player data).
- Weekly triage: reports hitting ≥3 distinct rooms become candidate entries; adding an entry mid-tier is safe (no score changes; new rarityPct computed; if inserting shifts a tier boundary, note it in pack changelog — rare and non-urgent since tiers are percentile bands, not exact ranks).
- Display of rarity uses stored `rarityPct` snapshot, so late additions never retroactively change a tier.

## 9. Legal/IP hygiene
- Mechanics inspired by Krillion are not copied: our own name/identity (birdwatching vs ocean), tier names, prompt wording, catalogue content, code, art. No Krillion text, graphics, tiers, or question bank reused.
- Data: Wikidata CC0 (no attribution burden, we still credit), Pageviews CC0. ProtoQA if used later: CC BY 4.0 attribution required.
- Ship a `CREDITS` line in-page footer: "Answer data: Wikidata (CC0) · Wikimedia Pageviews (CC0)".

## 10. Sample deck
`sample-content/starter-pack.json` (updated 2026-10-23, evening) = **14 prompts, 1,183 entries**: 5 data-pipeline (countries 197, elements 118, currencies 171, car brands 89, dog breeds 120) + 9 hand-authored (colours 41, animals 81, fruits 62, sports 61, European capitals 59, pizza toppings 45, superheroes 50, Greek gods 44, board/card games 46). Editorial passes on the new data categories: currency attention outliers demoted (West African CFA franc is the most-read currency article but nobody says it first — dollar/euro/pound forced to PIGEON); Stellantis demoted (conglomerate, not a teen answer); dog-breed list capped at top 120 by views. Pipeline scripts: `content-pipeline/fetch-newcats.mjs`, `build-extended.mjs` (correct Wikidata classes matter: car brand = Q10429667 ∪ manufacturer Q786820, dog breed = Q39367 — guessed IDs were wrong and returned nothing; always verify class IDs via the wbsearchentities API). The prototype runs on this deck today; the launch deck per §6 replaces it.
