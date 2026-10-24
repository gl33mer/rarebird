import { readFile, writeFile } from 'node:fs/promises';
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const els = JSON.parse(await readFile('elements-wikidata.json', 'utf8'));
const out = [];
for (const e of els) {
  const t = encodeURIComponent(e.enTitle.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${t}/monthly/20260901/20260930`;
  let views = null;
  try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) views = (await r.json()).items?.[0]?.views ?? null; } catch {}
  out.push({ ...e, viewsSept2026: views });
  await new Promise(r => setTimeout(r, 300));
}
console.log('ok:', out.filter(o => o.viewsSept2026 !== null).length, '/', out.length);
await writeFile('elements-views.json', JSON.stringify(out, null, 1));
