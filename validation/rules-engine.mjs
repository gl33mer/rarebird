// RAREBIRD rules engine — pure functions, zero dependencies.
// This is the reference implementation of the scoring & validation rules in
// 02_GAME_DESIGN_DOCUMENT.md and 04_CONTENT_AND_SCORING_SPEC.md.
// The production server should port these functions 1:1 (they are deliberately
// dependency-free and synchronous so they can run identically on server & client).

// ---------------------------------------------------------------- normalisation
export function normalize(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')   // strip accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')                                   // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an|el|la|les|der|die|das) /, '');             // leading articles
  return s;
}

// Damerau-Levenshtein (optimal string alignment): like Levenshtein but
// adjacent transpositions ("teh"->"the") cost 1 — the common kid/L2 typo.
export function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev2 = null, prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        cur[j] = Math.min(cur[j], (prev2 ?? prev)[j - 2] + 1);
      }
    }
    prev2 = prev; prev = cur;
  }
  return prev[n];
}

// Soundex — crude phonetic key; used ONLY as a confirm-gated suggestion source
// so severe misspellings ("Kolombia") still get a nudge without auto-locking.
export function soundex(s) {
  const codes = { b:'1',f:'1',p:'1',v:'1', c:'2',g:'2',j:'2',k:'2',q:'2',s:'2',x:'2',z:'2', d:'3',t:'3', l:'4', m:'5',n:'5', r:'6' };
  const w = s.replace(/[^a-z]/g, '');
  if (!w) return '';
  let out = w[0].toUpperCase(), last = codes[w[0]] ?? '';
  for (const ch of w.slice(1)) {
    const c = codes[ch] ?? '';
    if (c && c !== last) out += c;
    if (ch !== 'h' && ch !== 'w') last = c;
    if (out.length >= 4) break;
  }
  return (out + '000').slice(0, 4);
}

const FILLER = new Set(['and', 'of', 'the', 'de', 'di', 'da']);
const tokens = n => n.split(' ').filter(Boolean);
const significant = n => tokens(n).filter(t => !FILLER.has(t));

// fuzzy tolerance grows with answer length; short answers demand exactness
export function fuzzyBudget(norm) {
  if (norm.length <= 3) return 0;
  if (norm.length <= 5) return 1;
  return Math.min(2, Math.floor(norm.length / 6));
}

// ---------------------------------------------------------------- resolution
// catalogue entry: { canonical, aliases: string[], tier, evidence? }
// returns:
//   { status: 'valid',  entry }                    — locked-in answer
//   { status: 'suggest', entry, typed }            — near-miss; player must confirm
//   { status: 'invalid', typed }                   — no echo; player may retry
export function resolveAnswer(catalogue, raw) {
  const typed = (raw ?? '').toString().slice(0, 64).trim();
  if (!typed) return { status: 'invalid', typed };
  const n = normalize(typed);
  if (!n) return { status: 'invalid', typed };
  // index both spaced and space-collapsed forms so acronyms resolve:
  // "U.S.A." -> "u s a" -> "usa" matches alias "USA"; "unitedstates" matches "United States"
  const byNorm = new Map();
  const addForm = (form, e) => { if (form && form.length >= 2 && !byNorm.has(form)) byNorm.set(form, e); };
  for (const e of catalogue) {
    for (const src of [e.canonical, ...(e.aliases || [])]) {
      const f = normalize(src);
      if (!f) continue;
      addForm(f, e);
      addForm(f.replace(/ /g, ''), e);
    }
  }
  const hit = byNorm.get(n) || byNorm.get(n.replace(/ /g, ''));
  if (hit) return { status: 'valid', entry: hit };

  // token-subset match: "saint kitts nevis" == "saint kitts and nevis"
  // (typed significant tokens must ALL appear in the entry, and there must be
  // at least 2 of them — single-token subsets are too ambiguous)
  const typedToks = tokens(n);
  if (significant(n).length >= 2) {
    // each typed token must match an entry token (or a filler word) exactly or
    // within the fuzzy budget — catches "teh netherlands", "saint kitts nevis"
    let subsetHit = null, ambiguous = false;
    for (const e of catalogue) {
      const entryToks = [...new Set([...tokens(normalize(e.canonical)), ...(e.aliases || []).flatMap(a => tokens(normalize(a)))])];
      let all = true;
      const used = new Set();
      for (const t of typedToks) {
        const budget = Math.max(fuzzyBudget(t), FILLER.has(t) ? 1 : 0);
        let found = false;
        for (const cand of [...entryToks, ...FILLER]) {
          if (used.has(cand)) continue;
          if (cand === t || editDistance(t, cand) <= Math.max(budget, cand.length <= 3 ? 1 : budget)) { used.add(cand); found = true; break; }
        }
        if (!found) { all = false; break; }
      }
      if (all) { if (subsetHit && subsetHit !== e) { ambiguous = true; break; } subsetHit = e; }
    }
    if (subsetHit && !ambiguous) return { status: 'valid', entry: subsetHit };
  }
  // fuzzy: unique best match within budget wins
  const budget = fuzzyBudget(n);
  if (budget > 0) {
    let best = null, bestD = Infinity, ambiguous = false;
    for (const [k, e] of byNorm) {
      const cap = Math.max(fuzzyBudget(k), budget);        // tolerance of the longer form
      const d = editDistance(n, k);
      if (d <= cap) {
        if (d < bestD) { best = e; bestD = d; ambiguous = false; }
        else if (d === bestD && best && e !== best) ambiguous = true;
      }
    }
    if (best && !ambiguous) return { status: 'suggest', entry: best, typed };
  }

  // phonetic suggestion (confirm-gated): unique best soundex match among real-length
  // words only — short forms ("ZAF", "RSA") and keyboard mash must not trigger it
  const ph = soundex(n);
  if (ph && n.length >= 5 && ph.slice(1).replace(/0/g, '').length >= 2) {
    let phBest = null, phAmbiguous = false;
    for (const [k, e] of byNorm) {
      if (k.length < 5) continue;
      if (Math.abs(k.length - n.length) > 2) continue;
      if (soundex(k) === ph) { if (phBest && phBest !== e) { phAmbiguous = true; break; } phBest = e; }
    }
    if (phBest && !phAmbiguous) return { status: 'suggest', entry: phBest, typed, via: 'phonetic' };
  }
  return { status: 'invalid', typed };
}

// ---------------------------------------------------------------- tiers & scoring
export const TIERS = [
  { name: 'RARE BIRD', pts: 100, minPct: 99 },
  { name: 'MEGA',      pts: 85,  minPct: 95 },
  { name: 'KINGFISHER',pts: 60,  minPct: 85 },
  { name: 'STARLING',  pts: 30,  minPct: 60 },
  { name: 'SPARROW',   pts: 15,  minPct: 30 },
  { name: 'PIGEON',    pts: 10,  minPct: 0  },
];
export const tierByName = name => TIERS.find(t => t.name === name);

// ---------------------------------------------------------------- round scoring
// submissions: [{ playerId, nickname, raw, submittedAtMs, wager? }] — submittedAtMs is
// ms after round start (server-authoritative). deadlineMs = round duration.
// Config: { twinsPolicy: 'badge' | 'none', wagers: 'double' | 'off' }
//   wager ('Double or Nothing'): player-backed self-confidence bet.
//   KINGFISHER/MEGA/RARE BIRD pay x2, lower tiers pay half (floor 5).
export const WAGER_RISK_TIERS = new Set(['KINGFISHER', 'MEGA', 'RARE BIRD']);
export function scoreRound(prompt, submissions, deadlineMs, config = {}) {
  const cfg = { twinsPolicy: 'badge', wagers: 'off', ...config };
  const resolved = [];
  const locked = new Set();
  const rows = [];
  for (const s of submissions) {
    const late = s.submittedAtMs > deadlineMs;
    if (locked.has(s.playerId)) continue;              // first valid answer locks
    const r = resolveAnswer(prompt.catalogue, s.raw);
    if (r.status === 'valid') {
      locked.add(s.playerId);
      const base = tierByName(r.entry.tier).pts;
      let pts = base, wagered = false, wagerOutcome = null;
      if (cfg.wagers === 'double' && s.wager) {
        wagered = true;
        if (WAGER_RISK_TIERS.has(r.entry.tier)) { pts = base * 2; wagerOutcome = 'doubled'; }
        else { pts = Math.max(5, Math.floor(base / 2)); wagerOutcome = 'halved'; }
      }
      rows.push({ playerId: s.playerId, nickname: s.nickname, entry: r.entry, typed: s.raw, pts, base, wagered, wagerOutcome, timedOut: false, late });
    } else if (r.status === 'suggest') {
      rows.push({ playerId: s.playerId, nickname: s.nickname, entry: null, typed: s.raw, suggest: r.entry, pts: 0, timedOut: false, late });
    } else {
      rows.push({ playerId: s.playerId, nickname: s.nickname, entry: null, typed: s.raw, pts: 0, timedOut: false, late });
    }
  }
  // players with no valid answer at deadline
  // (caller passes a row with timedOut: true for players who never locked one)

  // twins detection over locked rows
  const byCanonical = new Map();
  for (const row of rows) if (row.entry) {
    const k = row.entry.canonical;
    if (!byCanonical.has(k)) byCanonical.set(k, []);
    byCanonical.get(k).push(row);
  }
  for (const [, group] of byCanonical) {
    if (group.length > 1) {
      for (const row of group) row.twins = group.length;
    }
  }
  if (cfg.twinsPolicy === 'none') for (const row of rows) delete row.twins; // still computed above; policy gates future use
  // reveal order: fewest points first, drama last; ties alphabetical; no-answer at end
  rows.sort((a, b) => (a.entry ? 0 : 1) - (b.entry ? 0 : 1) || a.pts - b.pts || (a.nickname || '').localeCompare(b.nickname || ''));
  return rows;
}

// ---------------------------------------------------------------- standings
// game: rounds: [rows...] each row {playerId, nickname, pts, entry}
// tie-break: total pts, then countback by tier (most RARE BIRD, then MEGA, ...),
// then shared place.
export function standings(rounds, players) {
  const agg = new Map(players.map(p => [p.playerId, { playerId: p.playerId, nickname: p.nickname, pts: 0, tierCount: Object.fromEntries(TIERS.map(t => [t.name, 0])) }]));
  for (const rows of rounds) for (const row of rows) {
    const a = agg.get(row.playerId); if (!a) continue;
    a.pts += row.pts;
    if (row.entry) a.tierCount[row.entry.tier] += 1;
  }
  const list = [...agg.values()].sort((a, b) =>
    b.pts - a.pts ||
    b.tierCount['RARE BIRD'] - a.tierCount['RARE BIRD'] ||
    b.tierCount['MEGA'] - a.tierCount['MEGA'] ||
    b.tierCount['KINGFISHER'] - a.tierCount['KINGFISHER'] ||
    a.nickname.localeCompare(b.nickname));
  // shared places for exact ties (all tiebreakers equal)
  list.forEach((p, i) => { p.place = (i > 0 && JSON.stringify([p.pts, p.tierCount]) === JSON.stringify([list[i-1].pts, list[i-1].tierCount])) ? list[i-1].place : i + 1; });
  return list;
}
