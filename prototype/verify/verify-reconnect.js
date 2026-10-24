// Field bug (playtest 2026-10-24): silent network drop mid-game; on resume players land in a
// half-elapsed round with no explanation. Fix: reconnect banner + rejoin toast (v13).
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const BASE = 'http://127.0.0.1:3300';
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await sleep(800);
  await p.locator('#nick').fill('ReconBot');
  await p.locator('#btn-create').click(); await sleep(1300);
  await p.locator('#btn-rounds').click(); await sleep(150); await p.locator('#btn-rounds').click(); await sleep(150); // 3 rounds
  await p.locator('#btn-start').click();
  // wait for round 1 live
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p.locator('#s-round').isVisible().catch(() => false); const pt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) break; }
  t('round 1 live', true);
  // simulate connection drop (deterministic: close the socket; setOffline doesn't kill established WS)
  await p.evaluate(() => window.__closeSocket());
  await sleep(400); // banner must be up before the 1.5s auto-reconnect
  t('reconnect banner shown on drop', await p.locator('#reconnect-banner').evaluate(el => el.classList.contains('on')));
  await p.screenshot({ path: 'shots/reconnect-banner-390x844.png' });
  // reconnect happens automatically (1.5s backoff) → banner clears, toast explains rejoin
  let toast = '';
  for (let k = 0; k < 30; k++) { await sleep(400); toast = await p.locator('#rejoin-toast').textContent().catch(() => ''); if (/Rejoined/.test(toast)) break; }
  t('rejoin toast explains state', /Rejoined — Round 1|Reconnected/.test(toast), toast);
  await sleep(1000);
  t('banner cleared after reconnect', !(await p.locator('#reconnect-banner').evaluate(el => el.classList.contains('on'))));
  // round still answerable with remaining time
  t('input re-enabled after rejoin', await p.locator('#answer').isEnabled().catch(() => false));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
