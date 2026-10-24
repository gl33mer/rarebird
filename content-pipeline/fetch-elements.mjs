// Chemical elements (instance of chemical element) with symbol + enwiki title.
const QUERY = `
SELECT ?el ?label ?symbol ?enTitle WHERE {
  ?el wdt:P31 wd:Q11344 .
  ?el rdfs:label ?label FILTER(LANG(?label)="en")
  OPTIONAL { ?el wdt:P1086 ?sym . }
  OPTIONAL { ?sl schema:about ?el ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle . }
  OPTIONAL { ?el wdt:P246 ?symbol . }
} LIMIT 2000`;
const UA = 'RarebirdDesign/0.1 (game design research; contact: design@example.invalid)';
const res = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(QUERY) + '&format=json', { headers: { 'User-Agent': UA } });
const data = await res.json();
const map = new Map();
for (const r of data.results.bindings) {
  const id = r.el.value.split('/').pop();
  if (!map.has(id)) map.set(id, { id, label: r.label.value, symbol: r.symbol?.value ?? null, enTitle: r.enTitle?.value ?? null });
}
const out = [...map.values()].filter(e => e.enTitle).sort((a,b) => a.label.localeCompare(b.label));
console.log('elements:', out.length);
await (await import('node:fs/promises')).writeFile('elements-wikidata.json', JSON.stringify(out, null, 1));
