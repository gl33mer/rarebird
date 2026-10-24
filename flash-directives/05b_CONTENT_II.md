# 05b · CONTENT RUN II — bigger catalogues, better rarity, better questions (QA2 items 5–6)

**Branch:** `flash/content-ii-v1` · MoLab notebook (same session as 05; marimo-pair bridge, token from owner). Amendments to `05_MOLAB_GENERATOR.md`:

1. **Bigger:** regenerate all 16 existing categories at **n=90–120** (was 35–95) plus 10 NEW categories aimed at intrigue/humor: "Name a smell everyone recognizes but can't name", "Name something that was cooler in the 90s", "Name an excuse for being late", "Name a superpower that would actually be annoying", "Name a food that's overrated", "Name something parents always say", "Name a bad first-date idea", "Name something you'd take from a hotel room", "Name a phobia you actually understand", "Name a job that sounds fun but isn't". Output to `prototype/pack-expansions/drafts2/`.
2. **Better rarity (5):** strengthen the rubric with anchor examples per tier (PIGEON = "the answer said in the first 3 seconds"; RARE BIRD = "fewer than 1 in 30 teens would say it — but everyone nods when they hear it"), require the model to rank-order its own PIGEON/SPARROW candidates before assigning, and enforce the 25/25/25/15/7/3 histogram with a rebalance pass (demote/promote borderline entries by rationale length heuristic — flag all rebalanced entries in evidence).
3. **Better questions (6):** prompts must pass a "would a 15-year-old lean in?" bar — concrete, opinionated, or funny ("Name a food that's overrated" not "Name a food"). For each new category include one `hook` line (witty one-liner shown as the example slot candidate).
4. Same in-notebook validation gauntlet (tier whitelist, dedupe, self-resolution via ported normalize, safety screen 0 hard). Retrieval via chunked base64 (md5-verified). **MAX merges into pack.json** (replacing superseded duplicates per category).

Deliverables: `drafts2/*.json`, updated `content-pipeline/llm_generate.py` mirror, FINDINGS with per-category histograms.
