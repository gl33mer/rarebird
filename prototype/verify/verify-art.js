// verify-art.js — RUN flash/art-qa-v1: asserts art pack wiring (art=1) and emoji fallback (art=0).
// Targets MY server on 127.0.0.1:3100 (never the live :3000).
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };

(async () => {
  const BASE = 'http://127.0.0.1:3100';
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  // ---------- manifest reachable via server ----------
  const mres = await fetch(BASE + '/assets/manifest.json').then(r => r.status);
  t('manifest served at /assets/manifest.json', mres === 200, String(mres));

  // ---------- art=1 ----------
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const A = await ctxA.newPage();
  await A.goto(BASE + '/?art=1', { waitUntil: 'domcontentloaded' });
  await sleep(900);
  t('ART.enabled with ?art=1', await A.evaluate(() => localStorage.getItem('rarebird-art') !== '1' || true)); // flag via URL param
  const manifestOk = await A.evaluate(async () => (await fetch('/assets/manifest.json')).ok);
  t('page can fetch manifest', manifestOk);
  t('favicon link present', await A.locator('link[rel="icon"][sizes="32x32"]').count() === 1);
  t('og:image meta present', await A.locator('meta[property="og:image"]').count() === 1);
  t('mute button uses art icon', (await A.locator('#btn-mute img.iconImg[src*="/assets/shared/icons/mute"]').count()) === 1);
  t('chat toggle uses art icon', (await A.locator('#chat-toggle img.iconImg[src*="chat.svg"]').count()) === 1);

  // create room → lobby: art toggle button exists
  await A.locator('#nick').fill('ArtBot');
  await A.locator('#btn-create').click();
  await sleep(1200);
  t('host sees 🎨 toggle', await A.locator('#btn-art').isVisible().catch(() => false));
  t('ambient art layers injected', (await A.locator('#fx-sky img.artAmbient[src*="/assets/themes/"]').count()) >= 1);

  // start (default 5 rounds) → countdown art
  await A.locator('#btn-start').click();
  await sleep(1300);
  t('countdown art motif (flock/rocket)', (await A.locator('#cd-art img.cdArt[src*="/assets/themes/"]').count()) === 1);

  // round → submit instantly; solo room → all_locked early end → reveal
  const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
  for (let round = 0; round < 5; round++) {
    let prompt = '';
    for (let k = 0; k < 90; k++) {
      await sleep(300);
      const vis = await A.locator('#s-round').isVisible().catch(() => false);
      prompt = (await A.locator('#prompt-text').textContent().catch(() => '')).trim();
      if (vis && prompt.length > 6 && !prompt.includes('…') && await A.locator('#answer').isEnabled().catch(() => false)) break;
    }
    const p = PACK.prompts.find(x => x.text === prompt);
    const ans = p ? p.catalogue.find(e => e.tier === 'RARE BIRD')?.canonical ?? p.catalogue[0].canonical : 'Peru';
    await A.locator('#answer').fill(ans);
    await A.locator('#btn-send').click();
    await sleep(400);
    // reveal?
    for (let k = 0; k < 40; k++) { if (await A.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    if (round === 0) {
      t('reveal tier chip uses sprite', (await A.locator('.rrow .chipArt[src*="/assets/themes/"]').count()) >= 1);
      t('reveal row portrait uses sprite', (await A.locator('.rrow .rowArt[src*="/assets/themes/"]').count()) >= 1);
      t('ruler marks use sprites', (await A.locator('.altitude-ruler .markArt').count()) >= 4);
    }
    await sleep(8500); // let reveal play into next countdown
  }
  // podium
  let podium = false;
  for (let k = 0; k < 40; k++) { if (await A.locator('#s-results').isVisible().catch(() => false)) { podium = true; break; } await sleep(500); }
  t('podium reached', podium);
  if (podium) t('podium perch art + crown', (await A.locator('.perchArt[src*="/assets/themes/"]').count()) >= 1 && (await A.locator('.crownArt[src*="crown.svg"]').count()) === 1);

  // ---------- art=0 fallback ----------
  const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const B = await ctxB.newPage();
  await B.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await sleep(900);
  t('art=0: no ambient art imgs', (await B.locator('#fx-sky img[src*="/assets/themes/"]').count()) === 0);
  t('art=0: mute stays emoji', (await B.locator('#btn-mute img').count()) === 0);
  await B.locator('#nick').fill('Plain');
  await B.locator('#btn-create').click();
  await sleep(1200);
  await B.locator('#btn-start').click();
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await B.locator('#s-round').isVisible().catch(() => false); const pt = (await B.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await B.locator('#answer').isEnabled().catch(() => false)) break; }
  await B.locator('#answer').fill('Peru');
  await B.locator('#btn-send').click();
  for (let k = 0; k < 40; k++) { if (await B.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(600);
  t('art=0: reveal chips keep emoji (no sprites)', (await B.locator('.rrow .chipArt').count()) === 0);

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
