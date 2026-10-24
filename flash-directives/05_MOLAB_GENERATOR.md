# 05 · MoLab GENERATOR RUN — local Qwen as the content engine

**For:** GLM-5.3 Flash · **Branch:** `flash/llm-content-v1` · rules from `00_ENVIRONMENT_AND_RULES.md` apply. Extra rule: **never commit the marimo auth token** — take it from the owner at run time.

## Context (MAX set this up 2026-10-24)
- MoLab notebook (marimo) at `https://sb-95ceebb8c370e967.sb.molab.run/` — RTX PRO 6000 Blackwell 96GB, torch 2.11+cu130, HF_TOKEN in env.
- A detached bootstrap was started: `pip install vllm` then `vllm serve Qwen/Qwen3-32B-FP8 --port 8900` with logs at `~/rarebird-llm/setup.log` and `~/rarebird-llm/serve.log` on the notebook.
- Drive the notebook with the marimo-pair skill: `bash /data/home/.agents/skills/marimo-pair/scripts/execute-code.sh --url <URL> --token <TOKEN> -c "..."` (run the `help(cm)` inspection first, per the skill).

## Step 0 — health check
Via execute-code: check `~/rarebird-llm/serve.log` tail; when ready, `curl -s localhost:8900/v1/models` from inside the notebook should list the model, and a tiny chat completion should return. If the install/serve failed, diagnose from the logs (common: vLLM wheel vs torch pin mismatch → retry `pip install -U vllm`; OOM → lower `--gpu-memory-utilization`; model too big → fall back to `Qwen/Qwen3-32B-FP8` already chosen for fit). Report honestly in FINDINGS if blocked.

## Step 1 — generation harness (in the notebook, as marimo cells via cm)
Build a cell-driven batch generator with this contract:
- Input: a list of category specs (from `content-pipeline/generate-prompts.mjs` style: id, text, example, target size, domain).
- For each category, prompt the model (temperature 0.7, JSON mode or strict-JSON parsing with retry): produce `{canonical, aliases[3..8], tier}` entries where **tier = teen answer-likelihood bucket** (PIGEON=everyone says it first … RARE BIRD=almost nobody; rubric included in the prompt), plus one-line tiering rationale.
- Validate in-notebook with the same checks as our pipeline: tier whitelist, dedupe (normalized), self-resolution via a port of `normalize()` from `validation/rules-engine.mjs`, catalogue size ≥30.
- Also generate a **safety screen pass**: flag entries matching the patterns in `content-pipeline/safety-screen.mjs` (port the regexes).
- Output: `draft-pack-<domain>-v1.json` in our pack schema — print the JSON from the cell in chunks (or base64) and save it into the repo at `prototype/pack-expansions/` from your shell.
- Batch discipline: ≤40 categories per run, checkpoint after each (write partial JSON to `~/rarebird-llm/out/`), resume-safe.

## Step 2 — target domains (first run)
16 categories, mixed: hand-pick from `03_OPTIONAL_CONTENT_EXPANSION.md` plus: rivers, languages, instruments, video-game consoles, Greek mythology vs Norse, chemical compounds, world currencies already done — pick NEW ones. Every prompt keeps house style `Name a X.` + example.

## Step 3 — judge probe (optional, timeboxed 20 min)
From YOUR sandbox shell, test whether `https://8900-sb-95ceebb8c370e967.sb.molab.run/v1/models` resolves (E2B port-subdomain pattern). If yes: note it — the game's `LLM_JUDGE_URL` could point there for PRIVATE field tests (never production; D-31). If no, done — mock judge stays.

## Deliverables
- `content-pipeline/llm_generate.py` (mirrors the notebook logic; committed for reproducibility) — even though it executes in the notebook.
- `prototype/pack-expansions/draft-pack-*-v1.json` files + tier rationales.
- `flash-directives/FINDINGS.md` entry: model health, generation stats (entries, reject rate at validation), pack summaries, judge-probe result.
- Merging drafts into `pack.json` is MAX's job. Never edit pack.json yourself.
