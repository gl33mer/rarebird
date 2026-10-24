// Sovereign states + aliases + enwiki title from Wikidata (CC0). One row per country.
const ENDPOINT = 'https://query.wikidata.org/sparql';
const QUERY = `
SELECT ?country ?label ?alias ?enTitle WHERE {
  ?country wdt:P31 wd:Q3624078 .
  FILTER NOT EXISTS { ?country wdt:P576 [] }
  ?country rdfs:label ?label FILTER(LANG(?label) = "en")
  OPTIONAL { ?country skos:altLabel ?alias FILTER(LANG(?alias) = "en") }
  OPTIONAL { ?sitelink schema:about ?country ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . }
}
LIMIT 8000`;
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const url = ENDPOINT + '?query=' + encodeURIComponent(QUERY) + '&format=json';
const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/sparql-results+json' } });
if (!res.ok) { console.error('HTTP', res.status, await res.text().then(t => t.slice(0, 300))); process.exit(1); }
const data = await res.json();
const rows = data.results.bindings;
const byCountry = new Map();
for (const r of rows) {
  const id = r.country.value.split('/').pop();
  if (!byCountry.has(id)) byCountry.set(id, { id, label: r.label.value, aliases: new Set(), enTitle: null });
  const c = byCountry.get(id);
  if (r.alias) c.aliases.add(r.alias.value);
  if (r.enTitle) c.enTitle = r.enTitle.value;
}
const out = [...byCountry.values()].map(c => ({ ...c, aliases: [...c.aliases].slice(0, 12) }));
out.sort((a, b) => a.label.localeCompare(b.label));
console.log('countries:', out.length);
console.log('missing enwiki title:', out.filter(c => !c.enTitle).map(c => c.label).join(', ') || 'none');
console.log('sample:', JSON.stringify(out.find(c => c.label === 'Japan'), null, 1));
await (await import('node:fs/promises')).writeFile('countries-wikidata.json', JSON.stringify(out, null, 1));
