# 06 · Optional: Themed Content Pack DRAFTS (text deliverable)

**Priority: AFTER all graphics (P0–P2). Only if graphics are complete.** This is a text task your reasoning mode is well suited to; GLM-5.3 (MAX) will verify, tier-check and merge. Everything you produce here is a **DRAFT for editorial review** — mark it as such in `assets/NOTES.md`.

## Deliverable
`assets/content/draft-pack-space.json` and `assets/content/draft-pack-birds.json`, each following EXACTLY the pack schema below (same as `../sample-content/starter-pack.json`).

```json
{
  "id": "draft-space-v1",
  "generated": "2026-10-24",
  "prompts": [
    {
      "id": "space-planets",
      "text": "Name a planet or dwarf planet.",
      "example": "like Mars",
      "catalogueSize": 10,
      "catalogue": [
        { "canonical": "Mars", "aliases": [], "tier": "PIGEON", "evidence": { "note": "LLM draft — verify tier" } }
      ]
    }
  ]
}
```

## Rules
1. Tier names ONLY from: `PIGEON, SPARROW, STARLING, KINGFISHER, MEGA, RARE BIRD`.
2. **Tier by answer-likelihood for a 14–16-year-old**, not fame: what would they SAY first? (Mars before Mercury; eagle before emu.) Aim for the distribution roughly 25/25/25/15/7/3 percent of the catalogue.
3. Catalogue sizes 30–120 entries. Every entry: real, unambiguous, single instance (no "dogs" for an animal prompt). Include 3–8 aliases per entry where people abbreviate ("US", "U.S.A.").
4. No proprietary question text copied from other games; write prompts in our house style: `Name a ⟨thing⟩.` + `(like X)` example.
5. Keep it teen-appropriate and world-cultures-friendly (mix Western/Asian/African/South-American references in pop-culture lists).

## Space pack — target 8 prompts
Suggestions (improve freely): planets & dwarf planets · moons of the solar system · constellations · real space missions or telescopes · things astronauts use · sci-fi spaceships from fiction (generic-safe: use franchise names but original ship names only as factual references, e.g. "USS Enterprise" is fine) · famous astronomers or astronauts · things you'd see in the night sky.

## Birds pack — target 8 prompts
Suggestions: common garden birds · birds of prey · flightless birds · colourful tropical birds · seabirds · birds that can't fly far but run fast · famous birds from fiction (Big Bird, Hedwig — factual references fine) · bird behaviours (migration, courtship dances).

## Self-QA before delivery
- Every canonical resolves uniquely within its own catalogue (no duplicates after case/accent folding).
- Spot-check 10 random entries per prompt: would a teen know it exists? Is the tier intuitive vs its neighbours?
- Ship a one-paragraph-per-prompt "tiering rationale" in `NOTES.md`.
