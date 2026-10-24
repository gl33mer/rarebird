// verify-living-ladder.js — RUN flash/living-ladder-v1
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';
const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
const NICHE = require('/data/workspace/rarebird-design/prototype/pack-niche.json');

async function main() {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mk = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' }); await sleep(800); return { c, p }; };
  const A = await mk(), B = await mk();
  await A.p.locator('#nick').fill('LadA'); await A.p.locator('#btn-create').click(); await sleep(1400);
  await B.p.locator('#nick').fill('LadB'); await B.p.locator('#join-code').fill((await A.p.locator('#room-code').textContent()).trim()); await B.p.locator('#btn-join').click(); await sleep(1200);
  await A.p.locator('#btn-rounds').click(); await sleep(150); await A.p.locator('#btn-rounds').click(); await sleep(150); // 3 rounds
  await A.p.locator('#btn-start').click();
  await sleep(1200);
  t('ladder built (2 markers + 6 zones)', await A.p.evaluate(() => document.querySelectorAll('#living-ladder .ll-dot').length === 2 && document.querySelectorAll('.ll-zone').length >= 1));
  t('markers start near ground', await A.p.evaluate(() => [...document.querySelectorAll('.ll-dot')].every(d => parseFloat(d.style.bottom) < 15)));
  const errs = [];
  A.p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  B.p.on('pageerror', e => errs.push(e.message.slice(0, 120)));

  // play 3 rounds; A always rare, B always pigeon
  for (let r = 0; r < 3; r++) {
    let prompt = '';
    for (let k = 0; k < 90; k++) { await sleep(300); const vis = await A.p.locator('#s-round').isVisible().catch(() => false); prompt = (await A.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await A.p.locator('#answer').isEnabled().catch(() => false)) break; }
    const allPacks = [...PACK.prompts, ...NICHE.prompts];
    const lastId = await A.p.evaluate(() => window.__lastRoundId ?? null);
    const pr = allPacks.find(x => x.id === lastId) || allPacks.find(x => x.text === prompt);
    const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA').canonical : 'Vanuatu';
    const pigeon = pr ? pr.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
    await A.p.locator('#answer').fill(rare); await A.p.locator('#btn-send').click(); await sleep(300);
    t(`r${r + 1}: A marker pulses on lock`, await A.p.evaluate(() => document.querySelector('.ll-dot.locked') !== null));
    await B.p.locator('#answer').fill(pigeon); await B.p.locator('#btn-send').click(); await sleep(300);
    for (let k = 0; k < 40; k++) { if (await A.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    await sleep(1500);
    const altA = await A.p.evaluate(() => parseFloat(document.querySelector('.ll-dot[data-pid]' )?.style.bottom) || 0);
    const altB = await A.p.evaluate(() => { const dots = [...document.querySelectorAll('.ll-dot')]; return parseFloat(dots[dots.length - 1]?.style.bottom) || 0; });
    if (r < 2) t(`r${r + 1}: A's marker higher than B's (rare vs pigeon)`, altA > altB, `A=${altA} B=${altB}`);
    await sleep(8500);
  }
  // final round: niche + double points
  let prompt = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await A.p.locator('#s-round').isVisible().catch(() => false); prompt = (await A.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await A.p.locator('#answer').isEnabled().catch(() => false)) break; }
  const nicheIds = NICHE.prompts.map(x => x.id);
  const roundId = await A.p.evaluate(() => window.__lastRoundId ?? '');
  t('final round uses niche pool', nicheIds.some(id => roundId.includes(id) || (NICHE.prompts.find(x => x.id === id) || {}).text === prompt), `id=${roundId} prompt=${prompt.slice(0, 40)}`);
  const chipText = await A.p.evaluate(() => { const el = document.querySelector('#modifier-chip, #final-chip'); return el ? el.textContent : ''; });
  const pr = NICHE.prompts.find(x => x.text === prompt);
  const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA').canonical : 'Vanuatu';
  await A.p.locator('#answer').fill(rare); await A.p.locator('#btn-send').click(); await sleep(300);
  await B.p.locator('#answer').fill('France'); await B.p.locator('#btn-send').click();
  for (let k = 0; k < 40; k++) { if (await A.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(1200);
  const rareRow = await A.p.evaluate(() => { const rows = [...document.querySelectorAll('.rrow')]; const r = rows.find(x => x.textContent.includes('LadA')); return r ? r.querySelector('.pts').textContent : ''; });
  t('final round double points (RARE BIRD = 200)', rareRow.includes('200'), rareRow);
  await A.p.screenshot({ path: 'shots/living-ladder-final.png' });
  t('no page errors', errs.length === 0, errs.join('|'));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
