# 03 · OPTIONAL: Content expansion run (only after 01+02 are done)

**Goal:** grow the prompt pack 14 → 30+ prompts using the existing pipeline, with editorial discipline. All output is DRAFT until GLM-5.3 (MAX) merges.

## Tools (all exist, read them first)
- `content-pipeline/generate-prompts.mjs` — `class QID "Name a X." "like Y" [cap]` drafts from Wikidata+pageviews with TOP-VIEWS review flags.
- `content-pipeline/fetch-newcats.mjs` / `build-extended.mjs` — the working examples.
- `content-pipeline/rate-catalogue.mjs` — empirical calibration report.
- `content-pipeline/safety-screen.mjs` — hard/soft flags; hard flags MUST be resolved (remove/rename) before submission.
- Verify class IDs via the Wikidata search API (a wrong QID once returned a footballer).

## Targets (aim 16+ new prompts across domains)
Data-pipeline candidates (find correct QIDs): world rivers (cap 150), languages by speakers, programming languages, musical instruments, Olympic sports, phobias?, chess openings (cap 60), elements-adjacent (compounds?), famous scientists, video games (instance-of video game — huge; cap by views), anime characters (IP names as factual answers are OK), Nobel laureates. Hand-authored candidates: school subjects, pizza chains, urban legends, board game mechanics, "things in a backpack", bathroom items, circus acts, knots, fonts.
Tier distribution per prompt ≈ 25/25/25/15/7/3 (PIGEON→RARE BIRD) by TEEN ANSWER-LIKELIHOOD, not fame. Aliases: 3-8 per entry where people abbreviate.

## Rules
- Every prompt: 30–500 entries, min catalogue 30 enforced; dedupe normalized canonicals; every canonical must self-resolve (`validation/rules-engine.mjs` resolveAnswer in a loop — see 06's checks).
- Safety screen must end 0 hard flags per pack; soft flags listed for human sign-off.
- New prompts go in a NEW file `prototype/pack-expansion.json` (same schema). Do NOT edit pack.json.
- Report: prompts added, entry counts, tier histograms, any editorial overrides you made and why.

## Explicitly do NOT
Ship copyrighted question text, add accounts/persistence, touch the rules engine, or promote drafts into pack.json — merging is MAX's job.
