// Publish-path verification: play through the PUBLIC https/wss URL.
const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const BASE = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const A = await browser.newContext({ viewport: { width: 390, height: 844 } }).then(c => c.newPage());
  await A.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(1000);
  await A.locator('#nick').fill('PubA');
  await A.locator('#btn-create').click();
  await sleep(2000);
  const code = (await A.locator('#room-code').textContent()).trim();
  t('create via public URL', /^[A-Z0-9]{4}$/.test(code), code);
  console.log('PUBLIC ROOM CODE:', code);
  const B = await browser.newContext({ viewport: { width: 390, height: 844 } }).then(c => c.newPage());
  await B.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(800);
  await B.locator('#nick').fill('PubB');
  await B.locator('#join-code').fill(code);
  await B.locator('#btn-join').click();
  await sleep(1500);
  t('second device joins via public URL', /PubB/.test(await A.locator('#lobby-players').textContent().catch(() => '')));
  await A.locator('#btn-start').click();
  // play one round
  let prompt = '';
  for (let k = 0; k < 60; k++) { await sleep(500); prompt = (await A.locator('#prompt-text').textContent().catch(() => '')).trim(); const vis = await A.locator('#s-round').isVisible().catch(() => false); if (vis && prompt.length > 6 && !prompt.includes('…') && await A.locator('#answer').isEnabled().catch(() => false)) break; }
  t('round started via public URL', prompt.length > 6, prompt);
  console.log('PROMPT:', prompt);
  const quick = { 'Name a country.': 'Vanuatu', 'Name a chemical element.': 'Iron', 'Name a colour.': 'Cerise', 'Name an animal.': 'Saiga', 'Name a fruit.': 'Mangosteen' };
  await A.locator('#answer').fill(quick[prompt] ?? 'Peru'); await A.locator('#btn-send').click();
  await sleep(600);
  const quickB = { 'Name a country.': 'United States', 'Name a chemical element.': 'Gold', 'Name a colour.': 'Blue', 'Name an animal.': 'Dog', 'Name a fruit.': 'Apple' };
  await B.locator('#answer').fill(quickB[prompt] ?? 'France'); await B.locator('#btn-send').click();
  await sleep(1200);
  // wait for reveal and screenshot
  for (let k = 0; k < 50; k++) { if (await A.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(400); }
  await sleep(2200); // let rows animate in
  t('reveal visible', await A.locator('#s-reveal').isVisible().catch(() => false));
  await A.screenshot({ path: 'rb_reveal_public.png' });
  await B.screenshot({ path: 'rb_reveal_public_b.png' });
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
