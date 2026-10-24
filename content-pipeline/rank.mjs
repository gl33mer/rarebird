import { readFile, writeFile } from 'node:fs/promises';
const rows = JSON.parse(await readFile('countries-views.json', 'utf8')).filter(r => r.viewsSept2026 !== null);
// rank: most views = most popular = lowest rarity percentile... define popularityRank desc
const sorted = [...rows].sort((a, b) => b.viewsSept2026 - a.viewsSept2026);
const n = sorted.length;
const ranked = sorted.map((r, i) => ({ ...r, popularityRank: i + 1, rarityPct: Math.round(100 * (n - i) / n) }));
// tier boundaries: rarityPct >= 99 -> MEGA; >=95 -> ...; define 6 tiers
const TIERS = [
  { name: 'MEGA', minPct: 99, pts: 100 },
  { name: 'LIFEBIRD', minPct: 95, pts: 85 },
  { name: 'KINGFISHER', minPct: 85, pts: 60 },
  { name: 'STARLING', minPct: 60, pts: 30 },
  { name: 'SPARROW', minPct: 30, pts: 15 },
  { name: 'PIGEON', minPct: 0, pts: 10 },
];
for (const r of ranked) r.tier = TIERS.find(t => r.rarityPct >= t.minPct).name;
const counts = {};
for (const r of ranked) counts[r.tier] = (counts[r.tier] || 0) + 1;
console.log('tier counts:', counts);
console.log('\nTop 12 most popular (PIGEONs):', ranked.slice(0, 12).map(r => `${r.label}(${(r.viewsSept2026/1000).toFixed(0)}k)`).join(', '));
console.log('\nRarest 15 (MEGA):', ranked.slice(-15).map(r => `${r.label}(${r.viewsSept2026})`).join(', '));
console.log('\nMid examples (STARLING):', ranked.filter(r => r.tier === 'STARLING').slice(0, 8).map(r => r.label).join(', '));
console.log('\nCheck famous-rare: Vanuatu=', ranked.find(r=>r.label==='Vanuatu')?.tier, ' Kazakhstan=', ranked.find(r=>r.label==='Kazakhstan')?.tier, ' Bhutan=', ranked.find(r=>r.label==='Bhutan')?.tier, ' France=', ranked.find(r=>r.label==='France')?.tier);
await writeFile('countries-ranked.json', JSON.stringify(ranked, null, 1));
