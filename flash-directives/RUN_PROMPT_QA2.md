# RUN PROMPT — paste to GLM-5.3 Flash (QA-round-2 triple session)

Three runs in order. Work in /data/workspace/rarebird-design (gh authed as gl33mer). Stop rule: 15 min stuck → FINDINGS.md → next run. Never touch live :3000; yours is :3100 (RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs). Standard hard rules (00_ENVIRONMENT_AND_RULES.md); version handshake per run: 21→22→23.

RUN 1 — QA2 POLISH (branch flash/qa2-polish-v1): directive flash-directives/10_QA2_POLISH.md — same-tier overlap fix (band-proportional stacking, no overlap at 6 players same tier), chat default-open with persistence, per-player settings row (art/3D/audio) for everyone vs host-only room settings (labelled), remove pool-size strings everywhere (D-42), dopamine audio extensions (all tiers + Top Call win + podium confetti ×2, synth-only), special-round instruction lines. NEW verify-qa2.js + full battery.

RUN 2 — LIVING LADDER (branch flash/living-ladder-v1): directive flash-directives/11_LIVING_LADDER.md — persistent right-edge mini-ladder all phases, live player markers (stable colors, reveal climb with stagger, ready-pulse on lock), camera tracks the leader with parallax spread emphasis, trail motes on arrivals + leader shimmer. FINAL ROUND: always niche-pool prompt + DOUBLE POINTS (post-pass, not rules engine) + 🏁 chip/instructions; author prototype/pack-niche.json (15 quirky prompts, full validation gauntlet). Server touches: final flag + double-points + niche draw only. NEW verify-living-ladder.js + perf gate extension + full battery.

RUN 3 — CONTENT II (branch flash/content-ii-v1): directive flash-directives/05b_CONTENT_II.md on the MoLab notebook (marimo-pair skill, token from owner) — 16 categories regenerated at n=90–120 + 10 new intrigue/humor categories with hooks, strengthened rarity rubric (anchor examples, self-rank pass, histogram rebalance), full validation gauntlet, drafts to prototype/pack-expansions/drafts2/ + llm_generate.py mirror. MAX merges into pack.json.

Each run: branch pushed, FINDINGS entry (QA2-/LL-/CT2- IDs), all suites green. Begin with directive 10. Good hunting.
