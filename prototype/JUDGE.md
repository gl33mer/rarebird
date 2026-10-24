# Optional "decision engine" (LLM judge) for the prototype

Answers that miss the curated catalogue can be adjudicated by an external HTTP
endpoint you host (e.g. a small open model on a MoLab notebook). This is a
**prototype robustness aid**, not a production feature — production stays on
curated CC0 catalogues (see ../09_DECISIONS_AND_OPEN_QUESTIONS.md D-16).

## Contract

`POST $LLM_JUDGE_URL` with `{"category": "Name an animal.", "answer": "cheetah"}`
must reply within 2.5s with:

```json
{"valid": true, "canonical": "Cheetah", "tier": "SPARROW"}
```

- `valid` — boolean, is it a real single answer in this category
- `canonical` — display form (fallback: the raw input)
- `tier` — one of PIGEON | SPARROW | STARLING | KINGFISHER | MEGA | RARE BIRD
  (how likely is a random teen to say it; fallback: STARLING)

Invalid example: `{"valid": false}`. Server behaviour: capped at 6 calls per
room per round, 2.5s timeout, admitted answers join that room's in-memory
catalogue tagged `llm-adjudicated` (logged as `judgeAdmit`, never written to
the pack), round can still end while judging (verdict is then dropped).

## Run with a judge

```bash
LLM_JUDGE_URL=http://127.0.0.1:8787/judge node server.mjs
# or against your hosted notebook:
LLM_JUDGE_URL=https://your-notebook-host/judge node server.mjs
```

## Mock judge for testing

```bash
node mock-judge.mjs   # listens on :8787, admits known-pattern answers
```

## Hosting a real one on a notebook (any OpenAI-compatible stack)

Expose exactly one route; adapt the system prompt to your model:

```python
# FastAPI + transformers example (run on a GPU notebook, expose via its public URL)
from fastapi import FastAPI; from pydantic import BaseModel
app = FastAPI()
TIERS = ["PIGEON","SPARROW","STARLING","KINGFISHER","MEGA","RARE BIRD"]
class Q(BaseModel): category: str; answer: str
@app.post("/judge")
def judge(q: Q):
    # feed your model: f'Category: "{q.category}". Is "{q.answer}" one specific real
    # member? How likely would a teenager say it (0=always..5=almost never)?
    # Reply JSON {valid, canonical, tier}.'  -> parse, clamp tier into TIERS
    ...
```

Latency budget: keep p95 under ~2s; the game tolerates a miss (falls back to
"No echo"). Keep the endpoint private-ish (unguessable path) — it is called
only by your game server, max 6×/round.
