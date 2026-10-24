# llm_generate.py — RAREBIRD content generator (Flash run flash/llm-content-v1)
# This script EXECUTES on the MoLab marimo notebook (RTX PRO 6000 96GB), not on the
# game sandbox: it loads Qwen/Qwen3-30B-A3B-Instruct-2507 via transformers (bf16,
# device_map=auto) and generates validated category drafts to ~/rarebird-llm/out/<id>.json.
# Transfer: chunks of base64 via the marimo-pair bridge (md5-verified), drafts retrieved
# the same way, then validated again locally (rules-engine + safety screen) before merging.
# Contract per flash-directives/05_MOLAB_GENERATOR.md. vLLM was abandoned: its JIT kernel
# compilation (DeepGemm + Ninja) fails on the notebook's gVisor/cu13 toolchain.

import os, re, json, time
os.makedirs('/home/marimo/rarebird-llm/out', exist_ok=True)
CATS = [
  ('world-rivers','Name a river.','like the Amazon',60),
  ('languages','Name a language spoken on Earth.','like Spanish',60),
  ('instruments','Name a musical instrument.','like the violin',60),
  ('consoles','Name a video game console.','like the PlayStation',50),
  ('norse-gods','Name a god or goddess from Norse mythology.','like Thor',40),
  ('compounds','Name a chemical compound.','like water',40),
  ('utensils','Name a kitchen utensil.','like a whisk',50),
  ('insects','Name an insect or bug.','like a ladybug',60),
  ('trees','Name a type of tree.','like an oak',50),
  ('school-subjects','Name a school subject.','like mathematics',35),
  ('olympic-events','Name an Olympic event.','like the 100m sprint',50),
  ('anime','Name a popular anime series.','like Naruto',50),
  ('storms','Name a type of storm or weather event.','like a hurricane',40),
  ('cheeses','Name a type of cheese.','like cheddar',45),
  ('dance-styles','Name a dance style.','like ballet',40),
  ('mythical-creatures','Name a mythical creature.','like a dragon',50),
]
RUBRIC = '''Tier rubric for a teen party game (players 13-16, English-speaking, global pop culture):
- PIGEON: one of the FIRST answers nearly every teen blurts out (~top 25% by answer frequency)
- SPARROW: very common second-wave answers (~next 25%)
- STARLING: moderately uncommon, some teens say it (~next 25%)
- KINGFISHER: uncommon but many teens know it exists (~next 15%)
- MEGA: rare, only enthusiasts name it (~next 7%)
- RARE BIRD: true and valid but would genuinely surprise the whole room (~top 3%)
Target distribution across the catalogue: about 25/25/25/15/7/3 percent.'''
PROMPT = '''You are building an answer catalogue for a party trivia game where RARER valid answers score more.
Category: {text} Example: {example}
Produce EXACTLY {n} valid answers.
{rubric}
Output STRICT JSON - an array of objects, nothing else:
[{{"canonical": "...", "aliases": ["..."], "tier": "PIGEON", "rationale": "..."}}]'''
SAFE_HARD = re.compile(r'\b(porn|sex|nude|nsfw|erotic|cocaine|heroin|meth\b|nazi|hitler|swastika|terror(?:ist|ism)|suicide|beheading|rape|slur)\b', re.I)
SAFE_SOFT = re.compile(r'\b(kill|death|dead|blood|war|weapon|gun|rifle|bomb|drug|beer|wine|casino|gambl|satan|demon|hell)\b', re.I)
def norm(x):
    x = x.lower().encode('ascii','ignore').decode()
    return re.sub(r'[^a-z0-9 ]',' ',x).replace('  ',' ').strip()
def validate(arr):
    out, seen, dropped, flagged = [], set(), 0, 0
    for e in arr:
        if not isinstance(e, dict): continue
        c = str(e.get('canonical','')).strip()[:48]
        t = str(e.get('tier','')).upper()
        if t == 'RAREBIRD': t = 'RARE BIRD'
        if not c or len(c) < 2 or t not in ('PIGEON','SPARROW','STARLING','KINGFISHER','MEGA','RARE BIRD'): dropped += 1; continue
        k = norm(c)
        if k in seen: dropped += 1; continue
        seen.add(k)
        joined = c + ' ' + ' '.join(map(str, e.get('aliases',[]) or []))
        if SAFE_HARD.search(joined): flagged += 1; continue
        soft = bool(SAFE_SOFT.search(c))
        al = [str(a).strip()[:32] for a in (e.get('aliases') or []) if str(a).strip()][:8]
        out.append({'canonical': c, 'aliases': al, 'tier': t, 'evidence': {'note': 'Qwen3-30B draft; soft=' + ('1' if soft else '0'), 'rationale': str(e.get('rationale',''))[:120]}})
    return out, dropped, flagged
def main():
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    print('loading model...', flush=True)
    tok = AutoTokenizer.from_pretrained('Qwen/Qwen3-30B-A3B-Instruct-2507')
    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-30B-A3B-Instruct-2507', torch_dtype=torch.bfloat16, device_map='auto')
    print('model loaded', flush=True)
    for cid, text, example, n in CATS:
        if os.path.exists(f'/home/marimo/rarebird-llm/out/{cid}.json'):
            print(cid, 'already done, skipping', flush=True); continue
        t0 = time.time()
        msg = [{'role':'user','content': PROMPT.format(text=text, example=example, n=n, rubric=RUBRIC)}]
        prompt_text = tok.apply_chat_template(msg, add_generation_prompt=True, tokenize=False)
        enc = tok(prompt_text, return_tensors='pt').to(model.device)
        arr = None
        for attempt in range(2):
            out = model.generate(**enc, max_new_tokens=6000, temperature=0.8, top_p=0.95, do_sample=True)
            raw = tok.decode(out[0][enc['input_ids'].size(1):], skip_special_tokens=True)
            m = re.search(r'\[.*\]', raw, re.S)
            try: arr = json.loads(m.group(0)) if m else None
            except Exception: arr = None
            if arr and len(arr) >= int(n * 0.7): break
        if not arr:
            print(cid, 'FAILED to parse', flush=True); continue
        clean, dropped, flagged = validate(arr)
        json.dump({'id': cid, 'text': text, 'example': example, 'catalogueSize': len(clean), 'catalogue': clean, '_stats': {'dropped': dropped, 'safetyFlagged': flagged, 'seconds': round(time.time()-t0)}}, open('/home/marimo/rarebird-llm/out/' + cid + '.json','w'), indent=1)
        print(cid, len(clean), 'entries', round(time.time()-t0), 's, dropped', dropped, 'flagged', flagged, flush=True)
    print('ALL DONE', flush=True)
main()
