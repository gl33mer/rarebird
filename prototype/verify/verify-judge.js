const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await sleep(700);
  await p.locator('#nick').fill('JudgeBot');
  await p.locator('#btn-create').click(); await sleep(1300);
  await p.locator('#btn-start').click();
  for (let k = 0; k < 80; k++) { await sleep(400); const vis = await p.locator('#s-round').isVisible().catch(() => false); const pt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
  const prompt = (await p.locator('#prompt-text').textContent()).trim();
  console.log('PROMPT:', prompt);
  await p.screenshot({ path: 'verify_upgrade_round.png' });
  // 1) keyboard mash must still be rejected (judge says invalid)
  await p.locator('#answer').fill('qqqxxxzzz'); await p.locator('#btn-send').click(); await sleep(3200);
  t('mash rejected even with judge', /No echo/.test(await p.locator('#answer-feedback').textContent()), await p.locator('#answer-feedback').textContent());
  // 2) real-but-out-of-catalogue answer admitted via judge
  await p.locator('#answer').fill('wombat'); await p.locator('#btn-send').click();
  await sleep(600);
  t('checking feedback shown', /field guide|Checking/.test(await p.locator('#answer-feedback').textContent()), await p.locator('#answer-feedback').textContent());
  await sleep(3000);
  const lock = await p.locator('#locked-msg').textContent();
  t('judge admitted + locked', /Wombat/.test(lock), lock);
  const log = await (await fetch('http://127.0.0.1:3000/log')).text();
  t('log has judgeAdmit', log.includes('judgeAdmit'));
  // reveal shows the admitted answer with a tier
  for (let k = 0; k < 90; k++) { if (await p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(400); }
  await sleep(2600);
  const rev = await p.locator('#reveal-list').textContent();
  t('reveal includes Wombat with points', /Wombat/.test(rev) && /\+\d+/.test(rev), rev.slice(0, 80));
  await p.screenshot({ path: 'verify_upgrade_reveal.png' });
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
