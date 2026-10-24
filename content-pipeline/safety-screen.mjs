// Pack safety screen: flags adult/violent/controversial/profanity terms in
// canonicals + aliases so a human signs off before packs reach kids (review row).
// Usage: node safety-screen.mjs [pack.json ...]
import { readFile } from 'node:fs/promises';
const FLAG = /\b(porn|sex|nude|nsfw|erotic|strip(?:per|club)|cocaine|heroin|meth|crack cocaine|crack pipe|weed|vodka|whisk(?:e)?y|tequila|vape|cigarette|nazi|hitler|swastika|terror(?:ist|ism)|jihad|suicide|beheading|gore| execution|massacre|genocide|rape|slur|kKK|kkk)\b/i;
const SOFT = /\b(kill|death|dead|blood|war|weapon|gun|rifle|bomb|drug|beer|wine|casino|gambl|satan|demon|hell)\b/i;
for (const f of process.argv.slice(2)) {
  const pack = JSON.parse(await readFile(f, 'utf8'));
  let hard = 0, soft = 0;
  console.log(`\n# ${f}`);
  for (const p of pack.prompts) {
    for (const e of p.catalogue) {
      const text = [e.canonical, ...(e.aliases ?? [])].join(' | ');
      if (FLAG.test(text)) { console.log(`  HARD  ${p.id}  ${e.canonical}`); hard++; }
      else if (SOFT.test(text)) { console.log(`  soft  ${p.id}  ${e.canonical}`); soft++; }
    }
  }
  console.log(`  → ${hard} hard (remove/replace), ${soft} soft (human sign-off)`);
}
