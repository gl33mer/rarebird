// Phase A — inspiration capture: recordings + stills of reference games (motion/pacing study ONLY).
// IP: no asset extraction; frames are for internal analysis of composition/motion.
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = '/data/workspace/rarebird-design/research-notes/inspiration';
const fs = require('node:fs');
fs.mkdirSync(OUT, { recursive: true });

const POOLS = {
  food: ['McFlurry', 'Chalupa', 'Filet-O-Fish'], animal: ['bombardier beetle', 'spitting cobra', 'skunk'],
  shape: ['hypotenuse', 'chord', 'apex'], gym: ['lateral raise', 'tricep dip', 'face pull'],
  wii: ['Wii Chess', 'Wii Party', 'Wii Play'], colour: ['cerise', 'mauve', 'chartreuse'],
  country: ['Vanuatu', 'Chad', 'Peru'], default: ['cerulean', 'Vanuatu', 'trowel'],
};
const answerFor = t => { t = t.toLowerCase(); for (const [k, v] of Object.entries(POOLS)) if (t.includes(k)) return v[0]; return POOLS.default[0]; };

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  // ---- 1) krillion daily dive (full round arc: descent → prompt → answer → sink reveal) ----
  const c1 = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  const p1 = await c1.newPage();
  await p1.goto('https://krillion.io/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await sleep(2500);
  await p1.screenshot({ path: `${OUT}/krillion-01-home.png` });
  await p1.getByText('BEGIN DESCENT').first().click({ force: true });
  await sleep(4200); // descent + countdown
  await p1.screenshot({ path: `${OUT}/krillion-02-descent.png` });
  let prompt = '';
  for (let k = 0; k < 60; k++) { await sleep(400); prompt = (await p1.locator('.prompt').first().textContent().catch(() => '')).trim(); if (prompt) break; }
  await p1.screenshot({ path: `${OUT}/krillion-03-prompt.png` });
  console.log('krillion prompt:', prompt.slice(0, 50));
  for (let t = 0; t < 16 && !(await p1.locator('.ds-input').count()); t++) await sleep(500);
  await p1.locator('.ds-input').first().fill(answerFor(prompt));
  await p1.locator('.ds-input').first().press('Enter');
  await sleep(1200);
  await p1.screenshot({ path: `${OUT}/krillion-04-answered.png` });
  await sleep(3000); // sink animation
  await p1.screenshot({ path: `${OUT}/krillion-05-sunk-reveal.png` });
  await sleep(4000);
  await p1.screenshot({ path: `${OUT}/krillion-06-tier-card.png` });
  await c1.close(); // flushes webm

  // ---- 2) krillion party: lobby + a live public-room glimpse ----
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  const p2 = await c2.newPage();
  await p2.goto('https://krillion.io/party', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await sleep(3000);
  await p2.screenshot({ path: `${OUT}/krillion-party-01-lobby.png` });
  await p2.getByText('HOW TO PLAY').first().click({ force: true }).catch(() => {});
  await sleep(1200);
  await p2.screenshot({ path: `${OUT}/krillion-party-02-rules.png` });
  await p2.keyboard.press('Escape'); await sleep(500);
  await p2.evaluate(() => { const e = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && /PUFFER PARTY/i.test(x.textContent) && x.tagName !== 'BODY'); window.scrollTo(0, 400); });
  await sleep(2500); // watch public rooms list live-update
  await p2.screenshot({ path: `${OUT}/krillion-party-03-rooms.png` });
  await c2.close();

  // ---- 3) jinxed.party: landing + rules + room create ----
  const c3 = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  const p3 = await c3.newPage();
  await p3.goto('https://jinxed.party/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await sleep(2500);
  await p3.screenshot({ path: `${OUT}/jinxed-01-home.png` });
  await p3.getByText('HOW TO PLAY').first().click({ force: true }).catch(() => {});
  await sleep(1200);
  await p3.screenshot({ path: `${OUT}/jinxed-02-rules.png` });
  await c3.close();

  // ---- 4) playdaily krillion clone: unlimited flow ----
  const c4 = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  const p4 = await c4.newPage();
  await p4.goto('https://playdaily.org/krillion', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3500);
  await p4.screenshot({ path: `${OUT}/playdaily-01-landing.png` });
  const btns = await p4.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 12));
  console.log('playdaily buttons:', JSON.stringify(btns));
  for (const label of ['Play', 'Classic', 'Start', 'Unlimited']) {
    const el = p4.getByText(label, { exact: false }).first();
    if (await el.count()) { await el.click({ force: true, timeout: 3000 }).catch(() => {}); await sleep(2000); break; }
  }
  await p4.screenshot({ path: `${OUT}/playdaily-02-ingame.png` });
  await sleep(4000);
  await p4.screenshot({ path: `${OUT}/playdaily-03-state.png` });
  await c4.close();

  await b.close();
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.webm')).map(f => { const s = fs.statSync(`${OUT}/${f}`); return `${f} ${Math.round(s.size / 1e6 * 10) / 10}MB`; });
  console.log('videos:', files.join(', ') || 'none');
})().catch(e => { console.error('ERR', e); process.exit(1); });
