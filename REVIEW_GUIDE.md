# REVIEW GUIDE — for an external model reviewing the RAREBIRD design package

**Prepared 2026-10-24 for an independent design/security review.** You are reviewing DOCUMENTS AND DECISIONS, not running code. The package is a game design + technical spec for a browser multiplayer party game aimed at groups of ~15-year-olds (school breaks, phones, no accounts). A working prototype exists and is referenced as evidence throughout.

## What to read (in order)
1. `README.md` — index + glossary.
2. `00_EXECUTIVE_DECISION.md` — the concept and why.
3. `02_GAME_DESIGN_DOCUMENT.md` — rules, wager experiment, chat guardrails, themes.
4. `03_MULTIPLAYER_TECHNICAL_SPEC.md` — protocol, state machine, exploit hardening table.
5. `04_CONTENT_AND_SCORING_SPEC.md` — data licensing (Wikidata CC0 / Wikimedia pageviews), tiering, fuzzy matching v2.
6. `05_UI_UX_SPEC.md`, `07_DEPLOYMENT_AND_OPERATIONS.md`, `08_IMPLEMENTATION_HANDOFF.md`, `09_DECISIONS_AND_OPEN_QUESTIONS.md`.
Evidence artifacts: `06_TEST_PLAN_AND_RESULTS.md` (what was actually tested — includes 5 rounds of field feedback), `validation/` (executable tests), `prototype/` (working server+client).

## Review focus — pointed questions

### Security (assume adversarial teens + internet strangers)
- WebSocket server: no Origin check on upgrade (same-origin assumption) — is that acceptable for a no-account game, or a CSRF-style risk? What's the minimal fix?
- Room codes: 4 chars from 31-symbol alphabet (~923k). Join-guessing is rate-limited per-socket but unlimited per-connection — propose a cheap brute-force dampener.
- Message validation depth: length caps + type whitelisting exist; what's missing (numeric coercion? `confirm` flags? JSON depth)?
- Host-authority powers (start/skip/settings): abuse vectors when host is malicious or idle?
- `LLM_JUDGE_URL` runtime fetch: SSRF/prompt-injection surface if a judge is enabled (answer text → external service)?
- `instabox-port` public URL: what does exposing `/log` (nicknames + typed answers) leak, and to whom? Should it be token-gated?

### Privacy & safety (audience includes minors)
- We store: nothing persistent except anonymous `reports.jsonl` + `answers.jsonl` (promptId+canonical) + ephemeral ring log with nicknames/chat. Chat is profanity-masked via small denylist. Gaps?
- What moderation/legal considerations ship-block for a public launch in your jurisdiction assumptions?

### Robustness & fairness
- Fuzzy v2 (`04` §4c): token-subset + Damerau + confirm-gated phonetic. Known false-positive traps are tested; what exploit classes remain (alias-squatting long answers, homoglyphs, right-to-left overrides)?
- Scoring: tier percentiles from a mix of pageviews + editorial overrides + (future) empirical frequencies — fairness failure modes?
- Wager experiment (D-23): any degenerate strategy we haven't simulated?

### Operational
- Single InstaBox process, in-memory rooms, restart loses games (documented). Given the audience, is that acceptable or must v1 persist room snapshots?
- What monitoring/alerting is the minimum before inviting real friend groups?

### Out of scope (do not flag as missing)
Accounts, DMs, persistent profiles, public room lists, matchmaking, horizontal scaling, native apps, monetization — deliberately excluded (see `09` decision log).

## Output format requested
A table: `Doc § | Issue | Severity (block/major/minor) | Concrete fix`. Then a short "top 3 before real users" list. Be adversarial; the design has survived five rounds of field testing already, so we value novel failure modes over restatements.
