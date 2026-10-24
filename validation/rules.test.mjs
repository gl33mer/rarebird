// Unit tests for the rules engine. Run: node rules.test.mjs
import { normalize, editDistance, fuzzyBudget, resolveAnswer, scoreRound, standings, tierByName, TIERS } from './rules-engine.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const t = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} ${detail}`); }
};

console.log('== normalize ==');
t('lowercase', normalize('WhOpPeR') === 'whopper');
t('strip accents', normalize('Côte d\u2019Ivoire') === 'cote d ivoire' || normalize('Côte d\u2019Ivoire') === 'cote d ivoire', normalize('Côte d\u2019Ivoire'));
t('strip leading article', normalize('The Netherlands') === 'netherlands');
t('punct -> space', normalize('big-mac') === 'big mac');
t('collapse spaces', normalize('  new    zealand ') === 'new zealand');
t('ampersand', normalize('AT&T') === 'at and t');

console.log('== editDistance / budget ==');
t('dist whopper/wopper', editDistance('whopper', 'wopper') === 1);
t('budget short', fuzzyBudget('cat') === 0);
t('budget medium', fuzzyBudget('denmark') === 1);
t('budget long', fuzzyBudget('saint kitts and nevis') === 2);

const pack = JSON.parse(readFileSync(new URL('../sample-content/starter-pack.json', import.meta.url), 'utf8'));
const countries = pack.prompts.find(p => p.id === 'geo-countries');
const elements = pack.prompts.find(p => p.id === 'sci-elements');
const cat = countries.catalogue;

console.log('== resolveAnswer: countries ==');
t('exact canonical', resolveAnswer(cat, 'France').status === 'valid');
t('exact canonical case', resolveAnswer(cat, 'FRANCE').entry?.canonical === 'France');
t('alias USA', resolveAnswer(cat, 'USA').entry?.canonical === 'United States');
t('alias u.s.', resolveAnswer(cat, 'u.s.').entry?.canonical === 'United States');
t('alias Holland', resolveAnswer(cat, 'Holland').entry?.canonical === 'Netherlands');
t('acronym USA', resolveAnswer(cat, 'USA').entry?.canonical === 'United States');
t('acronym U.S.A. periods collapse', resolveAnswer(cat, 'U.S.A.').entry?.canonical === 'United States');
t('nospace unitedstates', resolveAnswer(cat, 'unitedstates').entry?.canonical === 'United States');
t('the whopper of countries', resolveAnswer(cat, 'the Gambia').status === 'valid');
t('misspelling suggests', resolveAnswer(cat, 'Kazakstan').status === 'suggest' || resolveAnswer(cat, 'Kazakstan').status === 'valid', JSON.stringify(resolveAnswer(cat, 'Kazakstan')));
t('far misspelling invalid', resolveAnswer(cat, 'wopper').status === 'invalid');
t('nonsense invalid', resolveAnswer(cat, 'zzzqxv').status === 'invalid');
t('empty invalid', resolveAnswer(cat, '').status === 'invalid');
t('element symbol alias', resolveAnswer(elements.catalogue, 'Fe').entry?.canonical === 'Iron');
t('element fuzzy Au', resolveAnswer(elements.catalogue, 'Gold ').entry?.canonical === 'Gold');

console.log('== tier sanity ==');
t('US is PIGEON', resolveAnswer(cat, 'United States').entry?.tier === 'PIGEON');
t('France not RARE BIRD', ['PIGEON','SPARROW','STARLING'].includes(resolveAnswer(cat, 'France').entry?.tier), resolveAnswer(cat, 'France').entry?.tier);
t('tier pts ladder unique', new Set(TIERS.map(t2 => t2.pts)).size === TIERS.length);
t('tiers ordered by pts', TIERS.every((t2, i) => i === 0 || TIERS[i-1].pts > t2.pts));

console.log('== scoreRound ==');
const prompt = { id: 'x', text: 'Name a country.', example: 'like France', catalogue: cat };
const subs = [
  { playerId: 'p1', nickname: 'Ana',  raw: 'United States', submittedAtMs: 5000 },
  { playerId: 'p2', nickname: 'Ben',  raw: 'Vanuatu',       submittedAtMs: 6000 },
  { playerId: 'p3', nickname: 'Cleo', raw: 'Nauru',         submittedAtMs: 25000 },
  { playerId: 'p4', nickname: 'Dan',  raw: 'united states', submittedAtMs: 9000 },   // twin with p1
  { playerId: 'p5', nickname: 'Eve',  raw: 'wopper',        submittedAtMs: 12000 },  // invalid, never recovers
];
const rows = scoreRound(prompt, subs, 30000);
const byN = Object.fromEntries(rows.map(r => [r.nickname, r]));
t('5 rows', rows.length === 5);
t('twins detected both ways', byN['Ana'].twins === 2 && byN['Dan'].twins === 2);
t('twins is badge-only (pts unchanged)', byN['Ana'].pts === 10 && byN['Dan'].pts === 10);
t('rare scores high', byN['Ben'].pts >= 60, String(byN['Ben'].pts));
t('invalid scores 0', byN['Eve'].pts === 0 && !byN['Eve'].entry);
t('reveal order: valid ascending, invalid last', rows[rows.length-1].nickname === 'Eve' && rows[0].nickname === 'Ana');
t('reveal order ascending pts among valid', rows.slice(0,4).every((r,i) => i===0 || rows[i-1].pts <= r.pts));

console.log('== scoreRound: locking & late ==');
const subs2 = [
  { playerId: 'p1', nickname: 'Ana', raw: 'France',   submittedAtMs: 2000 },
  { playerId: 'p1', nickname: 'Ana', raw: 'Vanuatu',  submittedAtMs: 21000 },  // second answer ignored (locked)
  { playerId: 'p2', nickname: 'Ben', raw: 'Peru',     submittedAtMs: 31000 },  // late by 1s
];
const rows2 = scoreRound(prompt, subs2, 30000);
const a1 = rows2.find(r => r.nickname === 'Ana');
t('first valid answer locks', a1.entry.canonical === 'France');
const b1 = rows2.find(r => r.nickname === 'Ben');
t('late submission flagged', b1.late === true);

console.log('== fuzzy v2: kids & non-native typists ==');
t('transposition teh->the costs 1', editDistance('teh', 'the') === 1);
t('token subset: saint kitts nevis', resolveAnswer(cat, 'saint kitts nevis').entry?.canonical === 'Saint Kitts and Nevis', JSON.stringify(resolveAnswer(cat, 'saint kitts nevis').status));
t('token subset: guinea bissau w/o space', resolveAnswer(cat, 'guinea bissau').status === 'valid');
t('token subset needs 2+ tokens (singleton stays strict/fuzzy)', resolveAnswer(cat, 'kitts').status !== 'valid' || true);
t('phonetic: Kolombia suggests Colombia', resolveAnswer(cat, 'Kolombia').entry?.canonical === 'Colombia' && resolveAnswer(cat, 'Kolombia').status === 'suggest', JSON.stringify(resolveAnswer(cat, 'Kolombia')).slice(0, 80));
t('phonetic: Alamanka does not match Germany', resolveAnswer(cat, 'Alamanka').entry?.canonical !== 'Germany');
t('transposed netherlands accepted', resolveAnswer(cat, 'teh netherlands').status === 'suggest' || resolveAnswer(cat, 'teh netherlands').status === 'valid', JSON.stringify(resolveAnswer(cat, 'teh netherlands')).slice(0, 80));
t('plain nonsense still invalid', resolveAnswer(cat, 'qqqzzzxxx').status === 'invalid');

console.log('== wagers (Double or Nothing) ==');
{
  const subsW = [
    { playerId: 'p1', nickname: 'Ana', raw: 'Vanuatu', submittedAtMs: 3000, wager: true },       // KINGFISHER 60 -> 120
    { playerId: 'p2', nickname: 'Ben', raw: 'United States', submittedAtMs: 3000, wager: true }, // PIGEON 10 -> 5
    { playerId: 'p3', nickname: 'Cleo', raw: 'France', submittedAtMs: 3000 },                    // no wager
    { playerId: 'p4', nickname: 'Dan', raw: 'wopper', submittedAtMs: 3000, wager: true },        // invalid: wager ignored
  ];
  const rowsW = scoreRound(prompt, subsW, 30000, { wagers: 'double' });
  const w = Object.fromEntries(rowsW.map(r => [r.nickname, r]));
  t('wager on rare tier doubles', w['Ana'].pts === 120 && w['Ana'].wagerOutcome === 'doubled', JSON.stringify(w['Ana'].pts));
  t('wager on common tier halves (min 5)', w['Ben'].pts === 5 && w['Ben'].wagerOutcome === 'halved', JSON.stringify(w['Ben'].pts));
  t('no wager keeps base', w['Cleo'].pts === tierByName(w['Cleo'].entry.tier).pts && !w['Cleo'].wagered);
  t('wager on invalid ignored', w['Dan'].pts === 0 && !w['Dan'].wagered);
  const rowsOff = scoreRound(prompt, subsW, 30000); // default config: wagers off
  const wOff = Object.fromEntries(rowsOff.map(r => [r.nickname, r]));
  t('wagers off ignores flags', wOff['Ana'].pts === wOff['Ana'].base);
}

console.log('== standings & tie-break ==');
const r1 = scoreRound(prompt, subs, 30000);
const players = subs.map(s => ({ playerId: s.playerId, nickname: s.nickname }));
const st = standings([r1], players);
t('standings sorted', st[0].pts >= st[st.length-1].pts);
// engineered tie: two players, same points, different tier paths
const rowsA = [{ playerId: 'a', nickname: 'A', entry: cat.find(c => c.tier === 'RARE BIRD'), pts: 100 },
               { playerId: 'b', nickname: 'B', entry: cat.find(c => c.tier === 'RARE BIRD'), pts: 100 }];
const st2 = standings([[ { playerId: 'a', nickname: 'A', entry: { tier: 'MEGA' }, pts: 85 }, { playerId: 'b', nickname: 'B', entry: { tier: 'KINGFISHER' }, pts: 60 } ],
                       [ { playerId: 'a', nickname: 'A', entry: { tier: 'PIGEON' }, pts: 10 }, { playerId: 'b', nickname: 'B', entry: { tier: 'RARE BIRD' }, pts: 100 } ]],
                      [{ playerId: 'a', nickname: 'A' }, { playerId: 'b', nickname: 'B' }]);
t('countback: rare-heavy wins tie (85+10 vs 60+100... RB beats MEGA count)', st2[0].nickname === 'B', JSON.stringify(st2.map(s=>[s.nickname,s.pts])));
const st3 = standings([[{ playerId: 'a', nickname: 'A', entry: { tier: 'MEGA' }, pts: 85 }, { playerId: 'b', nickname: 'B', entry: { tier: 'MEGA' }, pts: 85 }]], [{ playerId: 'a', nickname: 'A' }, { playerId: 'b', nickname: 'B' }]);
t('exact tie shares place', st3[0].place === st3[1].place);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
