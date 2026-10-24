// Empirical tier calibrator: merges our own play frequencies (answers.jsonl)
// with the pack's data tiers and suggests adjustments for editorial review.
// Usage: node rate-catalogue.mjs [answers.jsonl] [../prototype/pack.json]
import { readFile } from 'node:fs/promises';

const [ansPath = '../prototype/answers.jsonl', packPath = '../prototype/pack.json'] = process.argv.slice(2);
let answers = [];
try { answers = (await readFile(ansPath, 'utf8')).trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); }
catch { console.error('no answers.jsonl yet — play some games first'); process.exit(0); }
const pack = JSON.parse(await readFile(packPath, 'utf8'));

const counts = new Map(); // promptId -> Map(canonical -> n)
for (const a of answers) {
  if (!counts.has(a.promptId)) counts.set(a.promptId, new Map());
  const m = counts.get(a.promptId);
  m.set(a.canonical, (m.get(a.canonical) ?? 0) + 1);
}

const RARITY_ORDER = ['PIGEON', 'SPARROW', 'STARLING', 'KINGFISHER', 'MEGA', 'RARE BIRD'];
console.log('# Tier calibration report (empirical vs authored)\n');
for (const prompt of pack.prompts) {
  const m = counts.get(prompt.id);
  if (!m || m.size === 0) continue;
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  console.log(`## ${prompt.text} (${total} answers observed)`);
  const ranked = [...m.entries()].sort((a, b) => b[1] - a[1]);
  for (const [canonical, n] of ranked) {
    const entry = prompt.catalogue.find(e => e.canonical === canonical);
    const authored = entry?.tier ?? 'NOT-IN-CATALOGUE';
    const pct = Math.round(100 * n / total);
    // heuristic: frequently-said answers should sit in common tiers
    let suggest = null;
    if (!entry) suggest = 'ADD to catalogue (players say it!)';
    else if (pct >= 25 && RARITY_ORDER.indexOf(authored) >= 3) suggest = `consider demoting (said ${pct}% of the time but tiered ${authored})`;
    else if (pct === 0 && false) suggest = null;
    console.log(`  ${String(n).padStart(3)}× (${String(pct).padStart(3)}%) ${canonical.padEnd(34)} authored=${authored}${suggest ? '  ⚠ ' + suggest : ''}`);
  }
  console.log('');
}
console.log('# Rules: suggestions only — a human merges them (04 §8). Empirical tiers become\n# authoritative once a prompt has ≥100 observed answers.');
