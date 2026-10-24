// Wikimedia Pageviews per-article API (CC0): mean daily views, Sept 2026, agent=user.
import { readFile, writeFile } from 'node:fs/promises';
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const countries = JSON.parse(await readFile('countries-wikidata.json', 'utf8'));
const START = '20260901', END = '20260930';
const results = [];
let i = 0;
for (const c of countries) {
  i++;
  const title = encodeURIComponent(c.enTitle.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${title}/monthly/${START}/${END}`;
  let views = null, err = null;
  for (let attempt = 0; attempt < 3 && views === null; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 200) {
        const j = await res.json();
        views = j.items?.[0]?.views ?? null;
      } else if (res.status === 404) { err = 'no data'; break; }
      else { err = 'HTTP ' + res.status; await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); }
    } catch (e) { err = e.message; await new Promise(r => setTimeout(r, 2000)); }
  }
  results.push({ ...c, viewsSept2026: views, viewsErr: err });
  if (i % 25 === 0) console.log(`...${i}/${countries.length}`);
  await new Promise(r => setTimeout(r, 350));
}
const ok = results.filter(r => r.viewsSept2026 !== null);
console.log(`fetched: ${ok.length} ok, ${results.length - ok.length} failed/missing`);
await writeFile('countries-views.json', JSON.stringify(results, null, 1));
console.log('failures:', results.filter(r => r.viewsSept2026 === null).map(r => `${r.label}(${r.viewsErr})`).join(', ') || 'none');
