// Merge: existing 7 prompts + 3 new data categories (with editorial overrides) + 4 hand-authored.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
const TIERS = [
  { name: 'RARE BIRD', minPct: 99, pts: 100 }, { name: 'MEGA', minPct: 95, pts: 85 },
  { name: 'KINGFISHER', minPct: 85, pts: 60 }, { name: 'STARLING', minPct: 60, pts: 30 },
  { name: 'SPARROW', minPct: 30, pts: 15 }, { name: 'PIGEON', minPct: 0, pts: 10 },
];
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(the|a|an) /, '');
function buildCat(rows, { override = {}, aliases = {}, cap = null, drop = [] }) {
  let list = rows.filter(r => r.viewsSept2026 != null && !drop.includes(r.label));
  list.sort((a, b) => b.viewsSept2026 - a.viewsSept2026);
  if (cap) list = list.slice(0, cap);
  const seen = new Set(); list = list.filter(r => { const k = norm(r.label); if (seen.has(k)) return false; seen.add(k); return true; });
  const n = list.length;
  return list.map((r, i) => {
    const pct = Math.round(100 * i / Math.max(1, n - 1));
    const tier = override[r.label] ?? TIERS.find(t => pct >= t.minPct).name;
    return { canonical: r.label, aliases: (aliases[r.label] || []).slice(0, 12), tier, evidence: { viewsSept2026: r.viewsSept2026, rarityPct: pct, wikidata: r.id, tierFromData: TIERS.find(t => pct >= t.minPct).name, ...(override[r.label] ? { note: 'editorial override' } : {}) } };
  });
}
const mk = (id, text, example, rows) => ({ id, text, example, catalogueSize: rows.length, catalogue: rows.map(([c, t, a]) => ({ canonical: c, aliases: a || [], tier: t, evidence: { note: 'hand-authored demo prompt' } })) });

const pack = JSON.parse(await readFile('../prototype/pack.json', 'utf8'));

// --- data categories with editorial passes ---
const CUR = JSON.parse(await readFile('currencies.json', 'utf8'));
const curCat = buildCat(CUR, {
  override: { // teens say these first regardless of wiki attention
    'United States dollar': 'PIGEON', 'Euro': 'PIGEON', 'Pound sterling': 'PIGEON', 'Japanese yen': 'PIGEON',
    'Indian rupee': 'SPARROW', 'Swiss franc': 'SPARROW', 'Australian dollar': 'SPARROW', 'Canadian dollar': 'SPARROW',
    'Chinese yuan': 'SPARROW', 'Russian ruble': 'SPARROW', 'West African CFA franc': 'STARLING', 'Bitcoin': 'SPARROW',
  },
  aliases: { 'United States dollar': ['dollar', 'USD', 'US dollar', 'American dollar'], 'Euro': ['EUR'], 'Pound sterling': ['pound', 'GBP', 'British pound', 'UK pound'], 'Japanese yen': ['yen', 'JPY'], 'Indian rupee': ['rupee'], 'Australian dollar': ['AUD'], 'Canadian dollar': ['CAD'], 'Swiss franc': ['franc', 'CHF'] },
  drop: ['Unidad Previsional', 'SUR (software)', 'Zimbabwean bonds'],
});
const CAR = JSON.parse(await readFile('carbrands.json', 'utf8'));
const carCat = buildCat(CAR, {
  override: { Toyota: 'PIGEON', Ford: 'PIGEON', BMW: 'PIGEON', Volkswagen: 'PIGEON', Mercedes: 'SPARROW', Honda: 'PIGEON', Tesla: 'PIGEON', Ferrari: 'SPARROW', Porsche: 'SPARROW', Nissan: 'PIGEON', Hyundai: 'SPARROW', Kia: 'SPARROW', Stellantis: 'KINGFISHER' },
  aliases: { BMW: ['Bayerische Motoren Werke', 'Bimmer'], Mercedes: ['Mercedes Benz', 'Mercedes-Benz'], Volkswagen: ['VW'], 'Tesla, Inc.': ['Tesla Motors'] },
  drop: ['General Motors', 'Ford Motor Company'].length > 0 ? ['General Motors'] : [],
});
const DOG = JSON.parse(await readFile('dogbreeds.json', 'utf8'));
const dogCat = buildCat(DOG, {
  override: { 'Labrador Retriever': 'PIGEON', 'German Shepherd': 'PIGEON', 'Golden Retriever': 'PIGEON', 'Poodle': 'PIGEON', 'Bulldog': 'SPARROW', 'Beagle': 'SPARROW', 'Pug': 'SPARROW', 'Chihuahua': 'SPARROW', Dachshund: 'SPARROW' },
  cap: 120,
});

// --- hand-authored prompts ---
const hand = [
  mk('test-toppings', 'Name a pizza topping.', 'like pepperoni', [
    ['Pepperoni','PIGEON'],['Cheese','PIGEON'],['Mushroom','PIGEON'],['Ham','PIGEON'],['Pineapple','PIGEON'],['Onion','PIGEON'],['Bacon','SPARROW'],['Sausage','SPARROW'],['Olives','SPARROW'],['Peppers','SPARROW'],['Chicken','SPARROW'],['Tomato','SPARROW'],['Salami','SPARROW'],['Meatballs','SPARROW'],['Jalapeños','SPARROW',['jalapenos']],
    ['Anchovies','STARLING'],['Artichoke','STARLING'],['Spinach','STARLING'],['Garlic','STARLING'],['Basil','STARLING'],['Prosciutto','STARLING'],['Feta','STARLING'],['Sun-dried tomato','STARLING'],['Rocket','STARLING'],['Sweetcorn','STARLING'],['Tuna','STARLING'],
    ['Gorgonzola','KINGFISHER'],['Truffle','KINGFISHER'],['Bresaola','KINGFISHER'],['Capers','KINGFISHER'],['Courgette','KINGFISHER'],['Egg','KINGFISHER'],['Nduja','KINGFISHER'],['Burrata','KINGFISHER'],
    ['Fugu'.replace('Fugu','Caviar'),'MEGA'],['Fig','MEGA'],['Pear','MEGA'],['Potato','MEGA'],['Hummus','MEGA'],['Kangaroo','MEGA'],['Crocodile','MEGA'],
    ['Gold leaf','RARE BIRD'],['Zucchini flowers','RARE BIRD'],['Buffalo ciclata'.length > 0 ? 'Ndjahi' : '','RARE BIRD'],['Bananapepper honey','RARE BIRD'.length > 0 ? 'Scorpion pepper honey' : '','RARE BIRD']]),
  mk('test-superheroes', 'Name a superhero.', 'like Spider-Man', [
    ['Spider-Man','PIGEON'],['Batman','PIGEON'],['Superman','PIGEON'],['Iron Man','PIGEON'],['Hulk','PIGEON'],['Wonder Woman','PIGEON'],['Captain America','PIGEON'],['Thor','SPARROW'],['Flash','SPARROW'],['Aquaman','SPARROW'],['Black Panther','SPARROW'],['Deadpool','SPARROW'],['Wolverine','SPARROW'],['Catwoman','SPARROW'],['Harley Quinn','SPARROW'],['Thanos'.replace('Thanos','Venom'),'SPARROW'],
    ['Doctor Strange','STARLING'],['Scarlet Witch','STARLING'],['Black Widow','STARLING'],['Hawkeye','STARLING'],['Cyborg','STARLING'],['Beast Boy','STARLING'],['Starfire','STARLING'],['Raven','STARLING'],['Green Lantern','STARLING'],['Ant-Man','STARLING'],['Wasp','STARLING'],['Vision','STARLING'],['Gambit','STARLING'],['Rogue','STARLING'],['Storm','STARLING'],
    ['Moon Knight','KINGFISHER'],['She-Hulk','KINGFISHER'],['Squirrel Girl','KINGFISHER'],['Nova','KINGFISHER'],['Blue Beetle','KINGFISHER'],['Booster Gold','KINGFISHER'],['Constantine','KINGFISHER'],['Zatanna','KINGFISHER'],['Martian Manhunter','KINGFISHER'],
    ['Saitama','MEGA'],['All Might','MEGA'],['Invincible','MEGA'],['Homelander','MEGA'],['Midnighter','MEGA'],['The Tick','MEGA'],
    ['Mister Miracle','RARE BIRD'],['Mettle'.length > 0 ? 'Squirrel Girl'.length > 0 ? 'Forbush Man' : '' : '','RARE BIRD'],['Dazzler','RARE BIRD'],['Arm Fall Off Boy','RARE BIRD']]),
  mk('test-greekgods', 'Name a Greek god or goddess.', 'like Zeus', [
    ['Zeus','PIGEON'],['Hades','PIGEON'],['Poseidon','PIGEON'],['Athena','PIGEON'],['Ares','SPARROW'],['Apollo','SPARROW'],['Artemis','SPARROW'],['Aphrodite','SPARROW'],['Hermes','SPARROW'],['Hera','SPARROW'],['Demeter','SPARROW'],['Dionysus','SPARROW'],['Hephaestus','SPARROW'],
    ['Persephone','STARLING'],['Eros','STARLING'],['Nike','STARLING'],['Helios','STARLING'],['Selene','STARLING'],['Iris','STARLING'],['Nemesis','STARLING'],['Pan','STARLING'],['Thanatos','STARLING'],['Hypnos','STARLING'],['Asclepius','STARLING'],['Tyche','STARLING'],
    ['Hebe','KINGFISHER'],['Enyo','KINGFISHER'],['Boreas','KINGFISHER'],['Eos','KINGFISHER'],['Hestia','KINGFISHER'],['Cronus','KINGFISHER'],['Rhea','KINGFISHER'],['Aeolus','KINGFISHER'],
    ['Moros','MEGA'],['Charon','MEGA'],['Eris','MEGA'],['Geras','MEGA'],['Phobos','MEGA'],['Deimos','MEGA'],['Kratos','MEGA'],
    ['Zelus','RARE BIRD'],['Hedylogos','RARE BIRD'],['Anteros','RARE BIRD'],['Ephilates'.replace('Ephilates','Ephialtes'),'RARE BIRD']]),
  mk('test-boardgames', 'Name a board game or card game.', 'like Monopoly', [
    ['Monopoly','PIGEON'],['Chess','PIGEON'],['Checkers','PIGEON'],['Scrabble','PIGEON'],['Uno','PIGEON'],['Cluedo','SPARROW',['Clue']],['Risk','SPARROW'],['Battleship','SPARROW'],['Poker','SPARROW'],['Blackjack','SPARROW'],['Solitaire','SPARROW'],['Jenga','SPARROW'],['Connect Four','SPARROW'],['Twister','SPARROW'],['Yahtzee','SPARROW'],['Dominoes','SPARROW'],
    ['Catan','STARLING'],['Carcassonne','STARLING'],['Pandemic','STARLING'],['Ticket to Ride','STARLING'],['Azul','STARLING'],['Codenames','STARLING'],['Exploding Kittens','STARLING'],['Cards Against Humanity','STARLING'],['Dixit','STARLING'],['Wingspan','STARLING'],['Splendor','STARLING'],['7 Wonders','STARLING'],['Forbidden Island','STARLING'],
    ['Terraforming Mars','KINGFISHER'],['Scythe','KINGFISHER'],['Root','KINGFISHER'],['Spirit Island','KINGFISHER'],['Brass Birmingham','KINGFISHER'],['Twilight Struggle','KINGFISHER'],['Gaia Project','KINGFISHER'],['Agricola','KINGFISHER'],
    ['Ark Nova','MEGA'],['Dune Imperium','MEGA'],['Nemesis','MEGA'],['Viticulture','MEGA'],['Everdell','MEGA'],['Teotihuacan','MEGA'],
    ['Antiquity','RARE BIRD'],['High Frontier','RARE BIRD'],['The Campaign for North Africa','RARE BIRD']]),
];
// fix accidental placeholder junk in hand lists
for (const p of hand) p.catalogue = p.catalogue.filter(e => e.canonical && e.canonical.length > 1 && !/Forbush/.test(e.canonical) || e.canonical === 'Forbush Man');
for (const p of hand) {
  const seen = new Set(); const out = [];
  for (const e of p.catalogue) { const k = e.canonical.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(e); } }
  p.catalogue = out; p.catalogueSize = out.length;
}

pack.prompts.push(
  { id: 'geo-currencies', text: 'Name a currency.', example: 'like the euro', catalogueSize: curCat.length, catalogue: curCat },
  { id: 'tech-carbrands', text: 'Name a car brand.', example: 'like Toyota', catalogueSize: carCat.length, catalogue: carCat },
  { id: 'life-dogbreeds', text: 'Name a dog breed.', example: 'like a poodle', catalogueSize: dogCat.length, catalogue: dogCat },
  ...hand,
);
await writeFile('../prototype/pack.json', JSON.stringify(pack, null, 1));
await copyFile('../prototype/pack.json', '../sample-content/starter-pack.json');
console.log('TOTAL prompts:', pack.prompts.length);
console.log(pack.prompts.map(p => `${p.id}(${p.catalogue.length})`).join(' '));
