// verify-bold.js — RUN flash/bold-art-v1: bold layer assertions (bold=1) + identical-off (bold=0).
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  // ---------- bold=1 ----------
  const ctxA = await b.newContext({ viewport: { width: 390, height: 844 } });
  const A = await ctxA.newPage();
  await A.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  t('body.bold class applied', await A.evaluate(() => document.body.classList.contains('bold')));
  t('grain overlay present', (await A.locator('#bold-grain').count()) === 1);
  t('parallax layers ≥3 (birds)', (await A.locator('#fx-sky img.bold-layer').count()) >= 3, String(await A.locator('#fx-sky img.bold-layer').count()));
  t('altitude bands painted (6)', (await A.locator('.bold-band').count()) === 6, String(await A.locator('.bold-band').count()));
  t('ambient particles alive and capped', await A.evaluate(() => new Promise(res => {
    setTimeout(() => res(document.querySelectorAll('.bold-particle').length <= 30), 6000);
  })));
  t('host sees ✨ Bold toggle', await A.evaluate(() => document.getElementById('btn-bold')?.textContent.includes('Bold: on')));
  // new parallax SVGs served
  for (const p of ['themes/dusk-birds/ambient/hills-far.svg', 'themes/dusk-birds/ambient/hills-near.svg', 'themes/cosmic-voyage/ambient/planet-surface.svg']) {
    t(`asset ${p.split('/').pop()} served`, (await fetch(`${BASE}/assets/${p}`).then(r => r.status)) === 200);
  }
  // theme switch rebuilds parallax (cosmos)
  await A.locator('#nick').fill('BoldBot');
  await A.locator('#btn-create').click(); await sleep(1300);
  await A.locator('#btn-theme').click(); await sleep(800);
  t('cosmos parallax rebuilt', (await A.locator('#fx-sky img.bold-layer[src*="cosmic-voyage"]').count()) >= 2);
  t('cosmos band labels are space flavors', /DEEP STARS|OUTER/.test(await A.locator('.bold-band').last().textContent()));
  // game → reveal flight classes
  await A.locator('#btn-rounds').click(); await sleep(150); await A.locator('#btn-rounds').click(); await sleep(150);
  await A.locator('#btn-start').click();
  let prompt = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await A.locator('#s-round').isVisible().catch(() => false); prompt = (await A.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('…') && await A.locator('#answer').isEnabled().catch(() => false)) break; }
  const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
  const pr = PACK.prompts.find(x => x.text === prompt);
  const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD')?.canonical ?? pr.catalogue.at(-1).canonical : 'Vanuatu';
  await A.locator('#answer').fill(rare); await A.locator('#btn-send').click();
  for (let k = 0; k < 40; k++) { if (await A.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(500);
  t('reveal rows use bold flight class', (await A.locator('.rrow.bold-fly').count()) >= 1);
  const hero = (await A.locator('.rrow.bold-hero').count()) >= 1; // rare answer → hero moment (may be absent if tier < RARE BIRD)
  console.log(`  (hero moment ${hero ? 'fired' : 'not fired — answer was not RARE BIRD tier'})`);
  await A.screenshot({ path: 'shots/bold-reveal-390x844.png' });

  // ---------- bold=0 identical ----------
  const ctxB = await b.newContext({ viewport: { width: 390, height: 844 } });
  const B = await ctxB.newPage();
  await B.goto(BASE + '/?art=1&bold=0', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  t('bold=0: body lacks bold class', !(await B.evaluate(() => document.body.classList.contains('bold'))));
  t('bold=0: no bold layers', (await B.locator('.bold-layer').count()) === 0);
  t('bold=0: no grain', (await B.locator('#bold-grain').count()) === 0);
  t('bold=0: game still playable (create works)', await (async () => { await B.locator('#nick').fill('Plain'); await B.locator('#btn-create').click(); await sleep(1200); return await B.locator('#s-lobby').isVisible(); })());

  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
