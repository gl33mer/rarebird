// shots.js — RUN flash/art-qa-v1: capture the visual QA matrix (both themes × viewports × screens).
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const { mkdirSync } = require('node:fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://127.0.0.1:3100/?art=1';
const OUT = '/data/workspace/rarebird-design/prototype/verify/shots';
mkdirSync(OUT, { recursive: true });
const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
const VIEWPORTS = [[390, 844], [320, 568], [768, 1024]];

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  for (const theme of ['birds', 'cosmos']) {
    // primary context at 390
    const c1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p1 = await c1.newPage();
    await p1.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(900);
    await p1.screenshot({ path: `${OUT}/${theme}-home-390x844.png` });
    await p1.locator('#nick').fill(theme === 'birds' ? 'Wren' : 'Nova');
    await p1.locator('#btn-create').click();
    await sleep(1300);
    await p1.screenshot({ path: `${OUT}/${theme}-lobby-390x844.png` });
    // extra joiners for a fuller lobby + later multi-viewports
    const others = [];
    for (const [w, h] of [[320, 568], [768, 1024]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await c.newPage();
      await p.goto(BASE, { waitUntil: 'domcontentloaded' });
      await sleep(700);
      const code = (await p1.locator('#room-code').textContent()).trim();
      await p.locator('#nick').fill(`F${w}`);
      await p.locator('#join-code').fill(code);
      await p.locator('#btn-join').click();
      await sleep(900);
      others.push({ c, p, w, h });
    }
    if (theme === 'cosmos') { await p1.locator('#btn-theme').click(); await sleep(500); }
    await p1.screenshot({ path: `${OUT}/${theme}-lobby-full-390x844.png` });

    // start (set rounds to 3: 5→7→3)
    await p1.locator('#btn-rounds').click(); await sleep(200);
    await p1.locator('#btn-rounds').click(); await sleep(200);
    await p1.locator('#btn-start').click();
    await sleep(1200); // mid-countdown
    await p1.screenshot({ path: `${OUT}/${theme}-countdown-390x844.png` });

    const answerFor = async (page) => {
      let prompt = '';
      for (let k = 0; k < 90; k++) {
        await sleep(300);
        const vis = await page.locator('#s-round').isVisible().catch(() => false);
        prompt = (await page.locator('#prompt-text').textContent().catch(() => '')).trim();
        if (vis && prompt.length > 6 && !prompt.includes('…') && await page.locator('#answer').isEnabled().catch(() => false)) break;
      }
      const p = PACK.prompts.find(x => x.text === prompt);
      const rare = p ? p.catalogue.find(e => e.tier === 'RARE BIRD')?.canonical ?? p.catalogue.at(-1).canonical : 'Vanuatu';
      const common = p ? p.catalogue.find(e => e.tier === 'PIGEON')?.canonical ?? 'France' : 'France';
      return { prompt, rare, common };
    };

    // ROUND 1: capture round screen on all viewports; invalid + locked states on 390; submit; reveal everywhere
    {
      const { prompt, rare, common } = await answerFor(p1);
      await p1.locator('#answer').fill('qqqzzzxxx');
      await p1.locator('#btn-send').click();
      await sleep(700);
      await p1.screenshot({ path: `${OUT}/${theme}-round-invalid-390x844.png` });
      await p1.locator('#answer').fill(rare);
      await p1.locator('#btn-send').click();
      await sleep(600);
      await p1.locator('#btn-wager').click().catch(() => {});
      await sleep(400);
      await p1.screenshot({ path: `${OUT}/${theme}-round-locked-390x844.png` });
      for (const o of others) {
        await o.p.locator('#answer').fill(common);
        await o.p.locator('#btn-send').click();
        await sleep(300);
        await o.p.screenshot({ path: `${OUT}/${theme}-round-${o.w}x${o.h}.png` });
      }
      for (let k = 0; k < 40; k++) { if (await p1.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
      await sleep(3800); // rows settle at altitude
      await p1.screenshot({ path: `${OUT}/${theme}-reveal-390x844.png` });
      for (const o of others) await o.p.screenshot({ path: `${OUT}/${theme}-reveal-${o.w}x${o.h}.png` });
      await sleep(6000);
    }
    // chat drawer shot (390) between rounds
    await p1.locator('#chat-toggle').click();
    await sleep(500);
    await p1.locator('#chat-presets button').first().click();
    await sleep(700);
    await p1.screenshot({ path: `${OUT}/${theme}-chat-390x844.png` });
    await p1.locator('#chat-close').click();
    await sleep(300);

    // rounds 2-3: play fast, then podium
    for (let r = 0; r < 2; r++) {
      const { rare, common } = await answerFor(p1);
      await p1.locator('#answer').fill(rare); await p1.locator('#btn-send').click(); await sleep(300);
      for (const o of others) { await o.p.locator('#answer').fill(common); await o.p.locator('#btn-send').click(); await sleep(300); }
      for (let k = 0; k < 40; k++) { if (await p1.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
      await sleep(9000);
    }
    for (let k = 0; k < 50; k++) { if (await p1.locator('#s-results').isVisible().catch(() => false)) break; await sleep(500); }
    await sleep(900);
    await p1.screenshot({ path: `${OUT}/${theme}-podium-390x844.png` });

    for (const o of others) await o.c.close();
    await c1.close();
  }

  // reduced-motion spot check (birds, 390)
  const c3 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p3 = await c3.newPage();
  await p3.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(900);
  await p3.screenshot({ path: `${OUT}/birds-home-reduced-motion-390x844.png` });
  await c3.close();

  await browser.close();
  console.log('matrix captured');
})().catch(e => { console.error('ERR', e); process.exit(1); });
