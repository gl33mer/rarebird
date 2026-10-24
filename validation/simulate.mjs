// Strategy simulation for RAREBIRD scoring. Run: node simulate.mjs
// IMPORTANT: bots prove score/strategy properties of the RULES, not that the
// game is fun. The recall-latency model is an ASSUMPTION (see 06 doc).
import { resolveAnswer, tierByName, TIERS } from './rules-engine.mjs';
import { readFileSync } from 'node:fs';

// deterministic RNG for reproducibility
let seed = 42;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = arr => arr[Math.floor(rand() * arr.length)];
const lognormal = (median, sigma) => median * Math.exp(sigma * (Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())));

const pack = JSON.parse(readFileSync(new URL('../sample-content/starter-pack.json', import.meta.url), 'utf8'));
const catalogues = pack.prompts.map(p => p.catalogue);
// synthetic Zipf catalogue (popularity rank r -> weight 1/r) for generality
const synth = Array.from({ length: 200 }, (_, i) => ({ canonical: 'Item' + i, aliases: [], tier: null, synthRank: i }));
// tier synthetic by percentile
const n = synth.length;
synth.forEach((e, i) => { e.tier = TIERS.find(t => Math.round(100 * i / (n - 1)) >= t.minPct).name; });

const STRATS = {
  obvious:   { pctRange: [0, 0.15],  recallBase: 2.5 },
  mainstream:{ pctRange: [0.30, 0.70], recallBase: 4 },
  smart:     { pctRange: [0.82, 0.95], recallBase: 8 },
  deep:      { pctRange: [0.90, 1.0], recallBase: 13 },
  random:    { pctRange: [0, 1],     recallBase: 6 },
  smartW:    { pctRange: [0.82, 0.95], recallBase: 8,  alwaysWager: true },  // Top Call every round
  deepW:     { pctRange: [0.90, 1.0], recallBase: 13, alwaysWager: true },
  memo1:     { memorize: true },  // both memorizers pick the SAME rarest entry
  memo2:     { memorize: true },
};
function chooseEntry(cat, strat) {
  if (strat.memorize) return cat[cat.length - 1]; // the single rarest entry, always
  const [lo, hi] = strat.pctRange;
  for (let tries = 0; tries < 50; tries++) {
    const idx = Math.floor(rand() * cat.length);
    const pct = idx / (cat.length - 1);           // 0 = most popular (catalogues are popularity-sorted by builder)
    if (pct >= lo && pct <= hi) return cat[idx];
  }
  return cat[cat.length - 1];
}
function typo(s) {
  const i = Math.floor(rand() * s.length);
  const c = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(rand() * 26)];
  const mode = rand();
  if (mode < 0.5) return s.slice(0, i) + c + s.slice(i + 1);       // substitute
  if (mode < 0.8) return s.slice(0, i) + s.slice(i + 1);           // delete
  return s.slice(0, i) + c + s.slice(i);                           // insert
}
// catalogues in pack are sorted most-popular-first (builder sorts desc by views)
const TIER_PTS = { 'PIGEON': 10, 'SPARROW': 20, 'STARLING': 40, 'KINGFISHER': 65, 'MEGA': 85, 'RARE BIRD': 100 };
const TIER_ORD = { 'PIGEON': 0, 'SPARROW': 1, 'STARLING': 2, 'KINGFISHER': 3, 'MEGA': 4, 'RARE BIRD': 5 };
const tierAt = (cat, e) => e.tier ?? (TIER_ORD[e.tier] !== undefined ? e.tier : 'STARLING');
function applyRoomRules(results) {
  const locked = Object.entries(results).filter(([, r]) => r.outcome === 'valid' && r.entry);
  const byCanon = new Map();
  for (const [, r] of locked) byCanon.set(r.entry.canonical, (byCanon.get(r.entry.canonical) ?? 0) + 1);
  for (const [, r] of locked) {
    const n = byCanon.get(r.entry.canonical);
    if (n > 1) r.pts = Math.max(5, Math.floor(r.pts / n)); // SPLIT rule (D-05b)
  }
  if (locked.length) {
    const maxOrd = Math.max(...locked.map(([, r]) => TIER_ORD[r.tier]));
    const atTop = locked.filter(([, r]) => TIER_ORD[r.tier] === maxOrd);
    for (const [name, r] of locked) {
      if (!r.wager) continue;
      const isUniqueTop = atTop.length === 1 && atTop[0][0] === name;
      r.pts = isUniqueTop ? r.pts * 2 : Math.max(5, Math.floor(r.pts / 2));
    }
  }
}
function playRound(cat, strats, timerSec, typoRate) {
  const results = {};
  for (const [name, strat] of Object.entries(strats)) {
    const entry = chooseEntry(cat, strat);
    const rarityPct = cat.indexOf(entry) / (cat.length - 1);
    const recall = lognormal(strat.recallBase * (0.5 + rarityPct), 0.5);  // rarer = slower, high variance
    const type = 1.2 + entry.canonical.length / 12;
    let t = recall + type;
    let pts = 0, outcome = 'valid';
    let raw = entry.canonical;
    if (rand() < typoRate) {
      raw = typo(entry.canonical);
      const r = resolveAnswer(cat, raw);
      if (r.status === 'suggest') t += 3;                       // confirm chip
      else { t += 6; raw = entry.canonical; }                   // retry corrected
    }
    let res = null;
    if (t > timerSec) { pts = 0; outcome = 'timeout'; }
    else {
      res = resolveAnswer(cat, raw);
      if (res.status === 'valid') pts = tierByName(res.entry.tier).pts;
      else { pts = 0; outcome = 'invalid'; }
    }
    results[name] = { pts, outcome, tier: res?.entry?.tier ?? entry.tier, entry: res?.status === 'valid' ? res.entry : entry, wager: !!strat.alwaysWager && outcome === 'valid' };
  }
  applyRoomRules(results);
  return results;
}
function runGames({ games = 4000, rounds = 5, timerSec = 30, typoRate = 0.15, ladder = null, strats = STRATS }) {
  const acc = Object.fromEntries(Object.keys(strats).map(k => [k, { pts: 0, timeouts: 0, invalids: 0, wins: 0, games: 0, tierWins: 0 }]));
  const pairwise = {};
  const names = Object.keys(strats);
  for (let g = 0; g < games; g++) {
    const totals = Object.fromEntries(names.map(k => [k, 0]));
    for (let r = 0; r < rounds; r++) {
      const cat = pick([...catalogues, synth]);
      const res = playRound(cat, strats, timerSec, typoRate);
      for (const k of names) totals[k] += res[k].pts;
    }
    const max = Math.max(...Object.values(totals));
    const winners = names.filter(k => totals[k] === max);
    for (const k of names) {
      acc[k].pts += totals[k]; acc[k].games++;
      if (winners.includes(k)) acc[k].wins += 1 / winners.length;
    }
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const key = `${names[i]}>${names[j]}`;
      pairwise[key] = pairwise[key] || { a: 0, b: 0 };
      if (totals[names[i]] > totals[names[j]]) pairwise[key].a++;
      else if (totals[names[i]] < totals[names[j]]) pairwise[key].b++;
    }
  }
  return { acc, pairwise };
}

const scenarios = [
  { label: 'baseline: 30s timer, 15% typo rate', opts: {} },
  { label: 'fast: 20s timer', opts: { timerSec: 20 } },
  { label: 'relaxed: 45s timer', opts: { timerSec: 45 } },
  { label: 'clean typists: 5% typo rate', opts: { typoRate: 0.05 } },
  { label: 'sloppy: 30% typo rate', opts: { typoRate: 0.30 } },
];
for (const sc of scenarios) {
  seed = 42;
  const { acc, pairwise } = runGames(sc.opts);
  console.log(`\n=== ${sc.label} (4000 games x 5 rounds) ===`);
  const rows = Object.entries(acc).map(([k, v]) => ({ strat: k, mean: (v.pts / v.games).toFixed(1), winShare: (100 * v.wins / v.games).toFixed(1) + '%' }));
  rows.sort((a, b) => b.mean - a.mean);
  console.table(rows);
  const pw = Object.entries(pairwise).filter(([, v]) => v.a + v.b > 0).map(([k, v]) => `${k}: ${v.a}-${v.b}`);
  console.log('head-to-head (wins):', pw.join('  '));
}
