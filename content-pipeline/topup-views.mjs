// Re-fetch views for common-name titles that replace formal-entity articles.
import { readFile, writeFile } from 'node:fs/promises';
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const titles = ['Netherlands', 'Denmark', 'New Zealand'];
const out = {};
for (const t of titles) {
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(t.replace(/ /g,'_'))}/monthly/20260901/20260930`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  out[t] = r.ok ? (await r.json()).items[0].views : null;
  await new Promise(r2 => setTimeout(r2, 350));
}
console.log(out);
await writeFile('topup-views.json', JSON.stringify(out, null, 1));
