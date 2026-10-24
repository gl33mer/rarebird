// Build game-ready pack from raw Wikidata+pageviews snapshots.
// Pipeline: dedup -> filter -> percentile tiers -> editorial overrides -> pack JSON.
import { readFile, writeFile } from 'node:fs/promises';

const TIERS = [
  { name: 'RARE BIRD', minPct: 99, pts: 100 },
  { name: 'MEGA', minPct: 95, pts: 85 },
  { name: 'KINGFISHER', minPct: 85, pts: 60 },
  { name: 'STARLING', minPct: 60, pts: 30 },
  { name: 'SPARROW', minPct: 30, pts: 15 },
  { name: 'PIGEON', minPct: 0, pts: 10 },
];
const tierOf = pct => TIERS.find(t => pct >= t.minPct);

// ---- editorial layer (demonstrates the review step) ----
const COUNTRY_RENAME = { 'People\u2019s Republic of China': 'China', 'Republic of the Congo': 'Congo-Brazzaville' }; // common-name canonicalisation
const COUNTRY_TIER_OVERRIDE = { // pageview rank misstates answer-likelihood (news traffic)
  Yemen: 'STARLING', Israel: 'SPARROW', Ukraine: 'SPARROW', Syria: 'STARLING',
  Vanuatu: 'KINGFISHER', Bhutan: 'KINGFISHER', Kazakhstan: 'STARLING',
};
const COUNTRY_EXTRA_ALIASES = { 'United States': ['USA','US','America','U.S.','United States of America'], 'United Kingdom': ['UK','U.K.','Britain','Great Britain','England'], Netherlands: ['Holland'], 'Czech Republic': ['Czechia'], 'Ivory Coast': ['C\u00f4te d\u2019Ivoire','Ivory coast'] };

const ELEMENTS_REAL = new Set(['Hydrogen','Helium','Lithium','Beryllium','Boron','Carbon','Nitrogen','Oxygen','Fluorine','Neon','Sodium','Magnesium','Aluminium','Silicon','Phosphorus','Sulfur','Chlorine','Argon','Potassium','Calcium','Scandium','Titanium','Vanadium','Chromium','Manganese','Iron','Cobalt','Nickel','Copper','Zinc','Gallium','Germanium','Arsenic','Selenium','Bromine','Krypton','Rubidium','Strontium','Yttrium','Zirconium','Niobium','Molybdenum','Technetium','Ruthenium','Rhodium','Palladium','Silver','Cadmium','Indium','Tin','Antimony','Tellurium','Iodine','Xenon','Caesium','Barium','Lanthanum','Cerium','Praseodymium','Neodymium','Promethium','Samarium','Europium','Gadolinium','Terbium','Dysprosium','Holmium','Erbium','Thulium','Ytterbium','Lutetium','Hafnium','Tantalum','Tungsten','Rhenium','Osmium','Iridium','Platinum','Gold','Mercury','Thallium','Lead','Bismuth','Polonium','Astatine','Radon','Francium','Radium','Actinium','Thorium','Protactinium','Uranium','Neptunium','Plutonium','Americium','Curium','Berkelium','Californium','Einsteinium','Fermium','Mendelevium','Nobelium','Lawrencium','Rutherfordium','Dubnium','Seaborgium','Bohrium','Hassium','Meitnerium','Darmstadtium','Roentgenium','Copernicium','Nihonium','Flerovium','Moscovium','Livermorium','Tennessine','Oganesson']);

function norm(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(the|a|an) /, '');
}

function buildCatalogue(rows, { drop = [], rename = {}, tierOverride = {}, extraAliases = {}, filter = null, addAliases = [] } = {}) {
  let list = rows.filter(r => r.viewsSept2026 !== null);
  for (const r of list) r.label = r.label.charAt(0).toUpperCase() + r.label.slice(1);
  if (filter) list = list.filter(r => filter(r));
  const dropSet = new Set(drop);
  list = list.filter(r => !dropSet.has(r.label));
  for (const r of list) if (rename[r.label]) r.label = rename[r.label];
  // dedup by normalized label keeping the one with more views
  const byNorm = new Map();
  for (const r of list) {
    const k = norm(r.label);
    if (!byNorm.has(k) || byNorm.get(k).viewsSept2026 < r.viewsSept2026) byNorm.set(k, r);
  }
  list = [...byNorm.values()].sort((a, b) => b.viewsSept2026 - a.viewsSept2026);
  const n = list.length;
  return list.map((r, i) => {
    const pct = Math.round(100 * i / Math.max(1, n - 1));
    let tier = tierOf(pct).name;
    if (tierOverride[r.label]) tier = tierOverride[r.label];
    const aliases = [...new Set([...(r.aliases || []), ...(extraAliases[r.label] || []), ...(addAliases.map(f => f(r)).flat().filter(Boolean))])].filter(a => norm(a) !== norm(r.label)).slice(0, 14);
    return {
      canonical: r.label,
      aliases,
      evidence: { viewsSept2026: r.viewsSept2026, rarityPct: pct, wikidata: r.id, tierFromData: tierOf(pct).name },
      tier,
    };
  });
}

const countries = JSON.parse(await readFile('countries-views.json', 'utf8'));
const elements = JSON.parse(await readFile('elements-views.json', 'utf8'));

const countryCat = buildCatalogue(countries, { drop: [], rename: COUNTRY_RENAME, tierOverride: COUNTRY_TIER_OVERRIDE, extraAliases: COUNTRY_EXTRA_ALIASES, addAliases: [r => [r.symbol && r.enTitle === r.label ? null : null]] });
const elementCat = buildCatalogue(elements, { filter: e => ELEMENTS_REAL.has(e.label) || ELEMENTS_REAL.has(e.label.toLowerCase()), addAliases: [e => [e.symbol]] });

const pack = {
  id: 'starter-pack-v1',
  generated: '2026-10-23',
  source: { wikidata: 'CC0', pageviews: '2026-09 monthly, agent=user, via Wikimedia Pageviews API (CC0)' },
  prompts: [
    {
      id: 'geo-countries',
      text: 'Name a country.',
      example: 'like France',
      catalogueSize: countryCat.length,
      catalogue: countryCat,
    },
    {
      id: 'sci-elements',
      text: 'Name a chemical element.',
      example: 'like oxygen',
      catalogueSize: elementCat.length,
      catalogue: elementCat,
    },
  ],
};
await writeFile('../rarebird-design/sample-content/starter-pack.json', JSON.stringify(pack, null, 1)).catch(async e => { console.error(e.message); });
console.log('countries:', countryCat.length, '| elements:', elementCat.length);
const c = {};
for (const x of countryCat) c[x.tier] = (c[x.tier]||0)+1;
console.log('country tiers:', c);
const e2 = {};
for (const x of elementCat) e2[x.tier] = (e2[x.tier]||0)+1;
console.log('element tiers:', e2);
console.log('sample rare country:', countryCat.find(x => x.tier === 'RARE BIRD')?.canonical, '| sample rare element:', elementCat.find(x => x.tier === 'RARE BIRD')?.canonical, '| most common element:', elementCat[0]?.canonical);
