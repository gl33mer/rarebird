// Fetch 3 new data categories: circulating currencies, car manufacturers, dog breeds.
import { writeFile } from 'node:fs/promises';
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const QUERIES = {
  currencies: `SELECT ?i ?label ?enTitle WHERE { ?i wdt:P31 wd:Q8142 ; wdt:P498 ?iso . ?i rdfs:label ?label FILTER(LANG(?label)="en") OPTIONAL { ?sl schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . } } LIMIT 4000`,
  carbrands: `SELECT DISTINCT ?i ?label ?enTitle WHERE { { ?i wdt:P31 wd:Q10429667 } UNION { ?i wdt:P31 wd:Q786820 } ?i rdfs:label ?label FILTER(LANG(?label)="en") OPTIONAL { ?sl schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . } } LIMIT 8000`,
  dogbreeds: `SELECT ?i ?label ?enTitle WHERE { ?i wdt:P31 wd:Q39367 . ?i rdfs:label ?label FILTER(LANG(?label)="en") OPTIONAL { ?sl schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . } } LIMIT 4000`,
};
async function sparql(q) {
  const res = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q) + '&format=json', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('sparql ' + res.status);
  const data = await res.json();
  const map = new Map();
  for (const r of data.results.bindings) {
    const id = r.i.value.split('/').pop();
    if (!map.has(id)) map.set(id, { id, label: r.label.value, enTitle: r.enTitle?.value ?? null });
  }
  return [...map.values()];
}
async function views(title) {
  const t = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${t}/monthly/20260901/20260930`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  try { return (await r.json()).items?.[0]?.views ?? null; } catch { return null; }
}
const out = {};
for (const [key, q] of Object.entries(QUERIES)) {
  const rows = (await sparql(q)).filter(r => r.enTitle);
  console.log(key, 'with articles:', rows.length);
  const cap = key === 'dogbreeds' ? 260 : rows.length; // cap breeds fetch time
  const withViews = [];
  for (let i = 0; i < Math.min(cap, rows.length); i++) {
    const v = await views(rows[i].enTitle);
    withViews.push({ ...rows[i], viewsSept2026: v });
    if (i % 40 === 0) console.log(`  ${key} ${i}/${Math.min(cap, rows.length)}`);
    await new Promise(r => setTimeout(r, 320));
  }
  const ok = withViews.filter(r => r.viewsSept2026 !== null).sort((a, b) => b.viewsSept2026 - a.viewsSept2026);
  // keep the top-N by views (drops defunct/ultra-obscure tails for brands/breeds)
  const keep = key === 'currencies' ? ok.length : Math.min(key === 'dogbreeds' ? 120 : 90, ok.length);
  out[key] = ok.slice(0, keep);
  console.log(key, 'kept:', out[key].length, '| top:', out[key][0]?.label, '| bottom:', out[key].at(-1)?.label);
  await writeFile(`${key}.json`, JSON.stringify(out[key], null, 1));
}
