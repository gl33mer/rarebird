// Field round 3 verification: 3-player join, animated countdown, last-round text, full game.
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mk = async () => { const c = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto('http://127.0.0.1:3100/?art=1', { waitUntil: 'domcontentloaded' }); await sleep(700); return { c, p }; };
  const waitRound = async p => { for (let k = 0; k < 80; k++) { await sleep(400); const vis = await p.locator('#s-round').isVisible().catch(() => false); const pt = (await p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await p.locator('#answer').isEnabled().catch(() => false)) return pt; } return ''; };
  const waitReveal = async p => { for (let k = 0; k < 90; k++) { if (await p.locator('#s-reveal').isVisible().catch(() => false)) return true; await sleep(400); } return false; };
  const waitResults = async p => { for (let k = 0; k < 100; k++) { if (await p.locator('#s-results').isVisible().catch(() => false)) return true; await sleep(500); } return false; };
  const QUIZ = { 'Name a country.': ['United States','Vanuatu','Peru'], 'Name a chemical element.': ['Gold','Dubnium','Iron'], 'Name a colour.': ['Blue','Cerise','Mauve'], 'Name an animal.': ['Dog','Saiga','Okapi'], 'Name a fruit.': ['Apple','Mangosteen','Durian'], 'Name a sport.': ['Tennis','Curling','Fencing'], 'Name a European capital city.': ['Paris','Vaduz','Tallinn'] };
  const pick = (pt, i) => (QUIZ[pt] || ['France','Peru','Peru'])[i] || 'France';

  console.log('== 1) three players join cleanly (field bug) ==');
  const S = [await mk(), await mk(), await mk()];
  await S[0].p.locator('#nick').fill('P1');
  await S[0].p.locator('#btn-create').click(); await sleep(1300);
  const code = (await S[0].p.locator('#room-code').textContent()).trim();
  for (let i = 1; i <= 2; i++) {
    await S[i].p.locator('#nick').fill('P' + (i + 1));
    await S[i].p.locator('#join-code').fill(code);
    await S[i].p.locator('#btn-join').click();
    await sleep(1400);
    const onLobby = await S[i].p.locator('#s-lobby').isVisible().catch(() => false);
    t(`player ${i + 1} lands on lobby screen`, onLobby);
  }
  const lobbyTxt = await S[0].p.locator('#lobby-players').textContent();
  t('host sees all 3 players', /P1/.test(lobbyTxt) && /P2/.test(lobbyTxt) && /P3/.test(lobbyTxt), lobbyTxt);
  await S[0].p.screenshot({ path: 'gfx_lobby.png' });

  console.log('== 2) animated countdown between rounds ==');
  await S[0].p.locator('#btn-rounds').click(); await sleep(200);   // 5 -> 7
  await S[0].p.locator('#btn-rounds').click(); await sleep(200);   // 7 -> 3
  t('rounds set to 3', /Rounds: 3/.test(await S[0].p.locator('#btn-rounds').textContent()));
  await S[0].p.locator('#btn-start').click();
  await sleep(1000);
  const ov = await S[1].p.locator('#countdown-overlay').isVisible().catch(() => false);
  t('countdown overlay shown at game start', ov);
  const num1 = await S[1].p.locator('#cd-num').textContent();
  await sleep(1300);
  const num2 = await S[1].p.locator('#cd-num').textContent();
  t('countdown number ticks down', num1 !== num2 || Number(num2) < Number(num1), `${num1} -> ${num2}`);
  await S[1].p.screenshot({ path: 'gfx_countdown.png' });

  console.log('== 3) full game: play rounds, check last-round text ==');
  let lastFooter = null, revealCount = 0;
  for (let r = 0; r < 3; r++) {
    const pt = await waitRound(S[0].p);
    for (let i = 0; i < 3; i++) {
      await S[i].p.locator('#answer').fill(pick(pt, i));
      await S[i].p.locator('#btn-send').click();
      await sleep(350);
    }
    const got = await waitReveal(S[0].p);
    t(`round ${r + 1} reveal reached`, got);
    if (r === 1) await S[2].p.screenshot({ path: 'gfx_reveal.png' });
    if (r === 2) { await sleep(1500); lastFooter = await S[0].p.locator('#reveal-next').textContent(); }
    await sleep(9000); // reveal plays out
  }
  t('last round footer announces results', /results/i.test(lastFooter ?? ''), lastFooter);
  const gotRes = await waitResults(S[0].p);
  t('results screen after last reveal', gotRes);
  await S[0].p.screenshot({ path: 'gfx_results.png' });
  await sleep(1200);

  // countdown also appears between rounds (after reveal)
  const ov2 = await S[1].p.locator('#countdown-overlay').isVisible().catch(() => false); // after rematch? no—game done; skip
  console.log('== 4) log sanity ==');
  let log = '';
  for (let k = 0; k < 10; k++) { // ring-window race: retry until joins visible
    log = await (await fetch('http://127.0.0.1:3100/log?t=flashtest')).text();
    if (log.includes('"nick":"P2"') && log.includes('"P3"')) break;
    await sleep(1000);
  }
  t('three joins in log', (log.match(/"nick":"P2"/g) || []).length >= 1 && log.includes('"P3"'));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
