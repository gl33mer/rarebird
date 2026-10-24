// Fetch a finite entity catalogue from Wikidata SPARQL (CC0): sovereign states
// with English labels, aliases and enwiki sitelink titles.
const Q = `
SELECT ?item ?itemLabel ?aliases (SAMPLE(?title) AS ?enTitle) WHERE {
  ?item wdt:P31/wdt:P279* wd:Q3624078 .   # sovereign state
  FILTER NOT EXISTS { ?item wdt:P576 [] } # not dissolved
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  OPTIONAL { ?item skos:altLabel ?alias FILTER(LANG(?alias)="en") BIND(CONCAT(?alias) AS ?aliasesRaw) }
  OPTIONAL { ?wikilink schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title . }
}
GROUP BY ?item ?itemLabel ?aliases
`;
