// Verify the three post-feedback fixes: timer pacing, report flow, gameplay log.
const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await p.locator('#nick').fill('FixBot');
  await p.locator('#btn-create').click();
  await sleep(1200);
  await p.locator('#btn-start').click();
  // wait for a live round
  for (let k = 0; k < 70; k++) { await sleep(400); const vis = await p.locator('#s-round').isVisible().catch(() => false); const pt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
  const prompt = (await p.locator('#prompt-text').textContent()).trim();
  console.log('PROMPT:', prompt);

  // 1) timer pacing: sample countdown over ~5s; must drop ~4-6, not ~10
  const t1 = +await p.locator('#timer').textContent();
  await sleep(5000);
  const t2 = +await p.locator('#timer').textContent();
  const drop = t1 - t2;
  t('timer runs at ~1s/s (was ~2s/s)', drop >= 3 && drop <= 7, `drop=${drop} (${t1}->${t2})`);

  // 2) invalid + report flow
  await p.locator('#answer').fill('zzqqxxyy');
  await p.locator('#btn-send').click();
  await sleep(700);
  t('invalid feedback', /No echo/.test(await p.locator('#answer-feedback').textContent()));
  const reportLink = p.getByText('Report missing bird');
  t('report link appears on invalid', await reportLink.count() > 0);
  await reportLink.first().click();
  await sleep(600);
  // 3) /log endpoint contains our events
  const logTxt = await (await fetch('http://127.0.0.1:3000/log')).text();
  t('log has create event', /"event":"create"| create /.test(logTxt) || logTxt.includes('create'), logTxt.slice(0, 80));
  t('log has roundStart', logTxt.includes('roundStart'));
  t('log has answer attempt', logTxt.includes('"raw":"zzqqxxyy"') || logTxt.includes('zzqqxxyy'));
  t('log has report', logTxt.includes('report'));
  // reports.jsonl written
  const fs = require('node:fs');
  const rep = fs.existsSync('/data/workspace/rarebird-design/prototype/reports.jsonl') ? fs.readFileSync('/data/workspace/rarebird-design/prototype/reports.jsonl', 'utf8') : '';
  t('reports.jsonl has entry', rep.includes('zzqqxxyy'), rep.slice(-120));

  // 4) acronym acceptance live (if this is the countries round)
  if (prompt === 'Name a country.') {
    await p.locator('#answer').fill('U.S.A.');
    await p.locator('#btn-send').click();
    await sleep(800);
    t('U.S.A. accepted live', /United States/.test(await p.locator('#locked-msg').textContent()), await p.locator('#locked-msg').textContent());
  } else {
    console.log('  (countries round not drawn; acronym covered by unit tests)');
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
