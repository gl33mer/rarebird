// RAREBIRD prompt generator — drafts new prompts from Wikidata classes.
// Usage:
//   node generate-prompts.mjs class QID "Name a X." "like Y" [cap]   → data-pipeline draft
//   node generate-prompts.mjs list prompts.draft.txt                 → hand-list draft
//   node generate-prompts.mjs constrained "Name a country whose flag has exactly two colours." \
//        --seeds Japan,Poland,Monaco                                  → curation stub
// Drafts ALWAYS need the editorial pass (04 §2 step 4): generator flags
// attention-outliers for review; a human finalises tiers + aliases.
import { writeFile } from 'node:fs/promises';

const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const TIERS = [
  { name: 'RARE BIRD', minPct: 99 }, { name: 'MEGA', minPct: 95 }, { name: 'KINGFISHER', minPct: 85 },
  { name: 'STARLING', minPct: 60 }, { name: 'SPARROW', minPct: 30 }, { name: 'PIGEON', minPct: 0 },
];

async function sparql(q) {
  const res = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q) + '&format=json', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('SPARQL ' + res.status);
  const j = await res.json();
  const map = new Map();
  for (const r of j.results.bindings) {
    const id = r.i.value.split('/').pop();
    if (!map.has(id)) map.set(id, { id, label: r.label?.value, enTitle: r.enTitle?.value ?? null, alias: r.alias?.value ?? null });
    else if (r.alias?.value && map.get(id).aliases?.length < 12) (map.get(id).aliases ??= []).push(r.alias.value);
  }
  return [...map.values()];
}
async function views(title) {
  const t = encodeURIComponent(title.replace(/ /g, '_'));
  const r = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${t}/monthly/20260901/20260930`, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  try { return (await r.json()).items?.[0]?.views ?? null; } catch { return null; }
}

const norm = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

async function genClass(qid, text, example, cap = 250) {
  const rows = (await sparql(`SELECT ?i ?label ?enTitle ?alias WHERE { ?i wdt:P31 wd:${qid} . ?i rdfs:label ?label FILTER(LANG(?label)="en") OPTIONAL { ?sl schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . } OPTIONAL { ?i skos:altLabel ?alias FILTER(LANG(?alias)="en") } } LIMIT 20000`)).filter(r => r.enTitle && r.label);
  console.error(`entities with articles: ${rows.length}`);
  const withViews = [];
  for (let i = 0; i < Math.min(cap, rows.length); i++) {
    const v = await views(rows[i].enTitle);
    if (v != null) withViews.push({ ...rows[i], views: v });
    await new Promise(r => setTimeout(r, 320));
  }
  withViews.sort((a, b) => b.views - a.views);
  const kept = withViews.slice(0, Math.min(cap, withViews.length));
  const n = kept.length;
  const catalogue = kept.map((r, i) => {
    const pct = Math.round(100 * i / Math.max(1, n - 1));
    return {
      canonical: r.label, aliases: (r.aliases || []).slice(0, 10),
      tier: TIERS.find(t => pct >= t.minPct).name,
      evidence: { viewsSept2026: r.views, rarityPct: pct, wikidata: r.id },
      // generator review flags — resolve these in the editorial pass (04 §2)
      reviewFlag: i < Math.ceil(n * 0.10) ? 'TOP-VIEWS: verify teens would actually say this (news/attention bias?)' : undefined,
    };
  });
  return { id: 'gen-' + norm(text).replace(/[^a-z0-9]+/g, '-').slice(0, 30), text, example, catalogueSize: n, catalogue, _draft: true };
}

function genList(text, example, lines) {
  const catalogue = lines.map(l => {
    const [canonical, tier, aliases] = l.split('|').map(x => x?.trim());
    return { canonical, aliases: aliases ? aliases.split(';').map(a => a.trim()) : [], tier: tier || 'SPARROW', evidence: { note: 'hand list — assign tiers!' }, reviewFlag: 'HAND LIST: verify tier' };
  }).filter(e => e.canonical);
  return { id: 'gen-' + norm(text).replace(/[^a-z0-9]+/g, '-').slice(0, 30), text, example, catalogueSize: catalogue.length, catalogue, _draft: true };
}

function genConstrained(text, seeds) {
  return { id: 'gen-' + norm(text).replace(/[^a-z0-9]+/g, '-').slice(0, 30), text, example: '', catalogueSize: seeds.length,
    catalogue: seeds.map(s => ({ canonical: s, aliases: [], tier: 'SPARROW', evidence: { note: 'constrained prompt stub' }, reviewFlag: 'CONSTRAINED: curate full list + tiers (LLM draft + verify, or hand)' })),
    _draft: true };
}

const [mode, ...rest] = process.argv.slice(2);
let draft;
if (mode === 'class') {
  const [qid, text, example, cap] = rest;
  draft = await genClass(qid, text, example, cap ? +cap : 250);
} else if (mode === 'list') {
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(rest[0], 'utf8');
  const [meta, ...lines] = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const [text, example] = meta.split('||').map(x => x.trim());
  draft = genList(text, example, lines);
} else if (mode === 'constrained') {
  const text = rest[0].replace(/--seeds.*$/, '').trim();
  const seeds = (process.argv.find(a => a.startsWith('--seeds=')) ?? '').replace('--seeds=', '').split(',').map(s => s.trim()).filter(Boolean);
  draft = genConstrained(text, seeds);
} else {
  console.error('modes: class QID "text" "example" [cap] | list file | constrained "text" --seeds=A,B');
  process.exit(1);
}
await writeFile('prompt-draft.json', JSON.stringify(draft, null, 1));
console.error(`draft written: prompt-draft.json (${draft.catalogueSize} entries, ${draft.catalogue.filter(e => e.reviewFlag).length} flagged for review)`);
