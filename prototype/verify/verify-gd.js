// verify-gd.js — RUN flash/graphics-depth-v1: Track A assertions (actors, phases, spectacle, audio gate).
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message.slice(0, 150)));
  await p.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(1100);
  t('gd enabled by default (bold on)', await p.evaluate(() => document.querySelectorAll('.gd-actor').length >= 1));
  t('birds actors: balloon twins + lighthouse', (await p.locator('.gd-balloon').count()) === 2 && (await p.locator('.gd-lighthouse').count()) === 1);
  t('lighthouse beam sweeping', (await p.locator('.gd-beam').count()) === 1);
  t('no AudioContext before gesture/opt-in', await p.evaluate(() => !window.__gdAudioRunning));

  // lobby → cosmos theme → actors swap
  await p.locator('#nick').fill('GDBot');
  await p.locator('#btn-create').click();
  await p.locator('#btn-audio').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  await sleep(600);
  t('host sees 🎵 Ambience toggle (off default)', /off/.test(await p.locator('#btn-audio').textContent()));
  await p.locator('#chat-close').click(); await sleep(400); // drawer covers lobby controls — close first
  await p.locator('#btn-theme').click(); await sleep(900);
  t('cosmos actors: ISS + planet-x', (await p.locator('.gd-iss').count()) === 1 && (await p.locator('.gd-planetx').count()) === 1);
  await p.locator('#btn-rounds').click(); await sleep(150); await p.locator('#btn-rounds').click(); await sleep(150);
  await p.locator('#btn-start').click();
  // phase class during writing
  let prompt = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p.locator('#s-round').isVisible().catch(() => false); prompt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
  t('phase-writing class during round', await p.evaluate(() => document.body.classList.contains('phase-writing')));
  const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
  const pr = PACK.prompts.find(x => x.text === prompt);
  const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD')?.canonical ?? pr.catalogue.at(-1).canonical : 'Vanuatu';
  await p.locator('#answer').fill(rare); await p.locator('#btn-send').click();
  for (let k = 0; k < 40; k++) { if (await p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(600);
  const shaft = await p.locator('#gd-shaft').count();
  console.log(`  (light shaft ${shaft ? 'fired' : 'not fired — answer was not RARE BIRD tier'})`);
  await p.screenshot({ path: 'shots/gd-reveal-390x844.png' });
  // results → podium scene
  for (let r = 1; r < 3; r++) {
    for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p.locator('#s-round').isVisible().catch(() => false); prompt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
    const pr2 = PACK.prompts.find(x => x.text === prompt);
    const ans2 = pr2 ? pr2.catalogue.at(-1).canonical : 'Vanuatu';
    await p.locator('#answer').fill(ans2); await p.locator('#btn-send').click();
    for (let k = 0; k < 40; k++) { if (await p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    await sleep(9000);
  }
  for (let k = 0; k < 50; k++) { if (await p.locator('#s-results').isVisible().catch(() => false)) break; await sleep(500); }
  await sleep(700);
  t('podium scene class', await p.evaluate(() => document.body.classList.contains('podium')));
  await p.screenshot({ path: 'shots/gd-podium-390x844.png' });
  t('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
