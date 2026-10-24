// verify-bold-perf.js — rAF-sampled fps gate for the bold layer (bold=1) + reduced-motion assertion.
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';

async function playToReveal(p) {
  const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
  await p.locator('#nick').fill('PerfBot');
  await p.locator('#btn-create').click(); await sleep(1300);
  await p.locator('#btn-start').click();
  let prompt = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p.locator('#s-round').isVisible().catch(() => false); prompt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
  const pr = PACK.prompts.find(x => x.text === prompt);
  const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD')?.canonical ?? pr.catalogue.at(-1).canonical : 'Vanuatu';
  await p.locator('#answer').fill(rare); await p.locator('#btn-send').click();
  for (let k = 0; k < 40; k++) { if (await p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
}

async function sampleFps(p, ms) {
  return p.evaluate(async dur => {
    let frames = 0; const t0 = performance.now();
    await new Promise(res => {
      const loop = () => { frames++; (performance.now() - t0 < dur) ? requestAnimationFrame(loop) : res(); };
      requestAnimationFrame(loop);
    });
    return Math.round(frames / dur * 1000);
  }, ms);
}

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  // fps during reveal with bold=1
  const c1 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p1 = await c1.newPage();
  await p1.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(900);
  await playToReveal(p1);
  const fps = await sampleFps(p1, 5000);
  console.log('  bold fps (390x844, reveal):', fps);
  t('bold fps ≥50', fps >= 50, String(fps));

  // reduced-motion: particles absent
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(900);
  t('reduced-motion: no particles', await p2.evaluate(async () => {
    await new Promise(r => setTimeout(r, 5000));
    return document.querySelectorAll('.bold-particle').length === 0;
  }));
  const fps2 = await sampleFps(p2, 3000);
  t('reduced-motion fps ≥50', fps2 >= 50, String(fps2));

  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
