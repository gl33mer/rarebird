// Focused validation-UX probe: invalid feedback, fuzzy suggestion confirm, late answer.
const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (name, cond, detail = '') => { if (cond) { pass++; console.log(`  ok  ${name}`); } else { fail++; console.log(`FAIL  ${name} ${detail}`); } };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await p.locator('#nick').fill('Val');
  await p.locator('#btn-create').click();
  await sleep(1200);
  await p.locator('#btn-start').click();
  // wait for a prompt that is a country round (cycle rooms until match — max 3 tries since random 3 of 5)
  let prompt = '';
  for (let i = 0; i < 3; i++) {
    for (let k = 0; k < 60; k++) { await sleep(500); prompt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); const roundVisible = await p.locator('#s-round').isVisible().catch(() => false);
    if (roundVisible && prompt.length > 6 && prompt !== 'Get ready…' && !prompt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
    if (prompt === 'Name a country.') break;
    // play through this round instantly to reach next
    const quick = { 'Name a colour.': 'Blue', 'Name an animal.': 'Dog', 'Name a fruit.': 'Apple', 'Name a chemical element.': 'Iron' }[prompt];
    if (quick) { await p.locator('#answer').fill(quick); await p.locator('#btn-send').click(); }
    await sleep(9000); // reveal
  }
  t('reached a country round', prompt === 'Name a country.', prompt);
  // 1) invalid
  await p.locator('#answer').fill('zzzqqqxxx');
  await p.locator('#btn-send').click();
  await sleep(800);
  t('invalid feedback shown', /No echo/.test(await p.locator('#answer-feedback').textContent()), await p.locator('#answer-feedback').textContent());
  t('input still enabled after invalid', await p.locator('#answer').isEnabled());
  // 2) fuzzy suggestion
  await p.locator('#answer').fill('Unted States');
  await p.locator('#btn-send').click();
  await sleep(900);
  const chipVisible = await p.locator('#confirm-chip').isVisible().catch(() => false);
  const chipText = await p.locator('#btn-confirm').textContent().catch(() => '');
  console.log('  (suggest chip:', chipVisible, JSON.stringify(chipText), ')');
  if (chipVisible) {
    await p.locator('#btn-confirm').click();
    await sleep(800);
    t('fuzzy confirm locks', /locked in/.test(await p.locator('#locked-msg').textContent()), await p.locator('#locked-msg').textContent());
  } else {
    // 'Unted States' may resolve invalid; then try 'Canada ' with trailing space
    await p.locator('#answer').fill('Canad ');
    await p.locator('#btn-send').click();
    await sleep(900);
    const chip2 = await p.locator('#confirm-chip').isVisible().catch(() => false);
    t('fuzzy suggestion appears for near-miss', chip2, 'second try: ' + (await p.locator('#answer-feedback').textContent()));
    if (chip2) { await p.locator('#btn-confirm').click(); await sleep(700); t('fuzzy confirm locks', /locked in/.test(await p.locator('#locked-msg').textContent())); }
  }
  // 3) locked input rejects further typing (server-side lock)
  const before = await p.locator('#locked-msg').textContent();
  t('already locked acknowledged', /locked in/.test(before));
  await p.screenshot({ path: 'rb_validation.png' });
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
