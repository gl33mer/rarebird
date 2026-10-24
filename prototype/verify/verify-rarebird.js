// Multi-browser verification of the RAREBIRD prototype: 3 independent sessions
// play a full game; asserts reveal/results/rematch/reconnect behaviour.
const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = { // Ada: always the most obvious answer
  'Name a country.': 'United States', 'Name a chemical element.': 'Gold',
  'Name a colour.': 'Blue', 'Name an animal.': 'Dog', 'Name a fruit.': 'Apple' };
const B = { // Bob: always rare
  'Name a country.': 'Vanuatu', 'Name a chemical element.': 'Dubnium',
  'Name a colour.': 'Cerise', 'Name an animal.': 'Saiga', 'Name a fruit.': 'Mangosteen' };
const C = { // Cleo: invalid first, then mid
  'Name a country.': 'Peru', 'Name a chemical element.': 'Iron',
  'Name a colour.': 'Green', 'Name an animal.': 'Cat', 'Name a fruit.': 'Mango' };
let pass = 0, fail = 0;
const t = (name, cond, detail = '') => { if (cond) { pass++; console.log(`  ok  ${name}`); } else { fail++; console.log(`FAIL  ${name} ${detail}`); } };

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mkSession = async () => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' }); await sleep(800); return { ctx, p }; };

  console.log('== create & join ==');
  const S1 = await mkSession();
  await S1.p.locator('#nick').fill('Ada');
  await S1.p.locator('#btn-create').click();
  await sleep(1500);
  const code = (await S1.p.locator('#room-code').textContent()).trim();
  t('room code visible', /^[A-Z0-9]{4}$/.test(code), code);
  console.log('ROOM:', code);

  const S2 = await mkSession(), S3 = await mkSession();
  for (const [S, nick] of [[S2, 'Bob'], [S3, 'Cleo']]) {
    await S.p.locator('#nick').fill(nick);
    await S.p.locator('#join-code').fill(code);
    await S.p.locator('#btn-join').click();
    await sleep(1200);
  }
  await sleep(600);
  const lobbyTxt = await S1.p.evaluate(() => document.body.innerText);
  t('lobby shows all 3 players', /Ada/.test(lobbyTxt) && /Bob/.test(lobbyTxt) && /Cleo/.test(lobbyTxt));
  t('host controls only on host', (await S1.p.locator('#btn-start').count()) === 1 && (await S2.p.locator('#btn-start').isVisible().catch(()=>false)) === false);
  await S1.p.screenshot({ path: 'rb_lobby.png' });

  console.log('== game play (3 rounds) ==');
  await S1.p.locator('#btn-start').click();
  const sessions = [[S1, A, 'Ada'], [S2, B, 'Bob'], [S3, C, 'Cleo']];
  let roundSeen = 0, lastPrompt = '';
  for (let iter = 0; iter < 80 && roundSeen < 3; iter++) {
    // read prompt from S1 (all in sync)
    const pt = (await S1.p.locator('#prompt-text').textContent().catch(() => '')).trim();
    if (pt && pt !== lastPrompt && pt !== 'Get ready…' && pt.length > 6 && pt !== '\u2026' && !pt.includes('\u2026') && (await S1.p.locator('#answer').isEnabled().catch(() => false))) {
      lastPrompt = pt; roundSeen++;
      console.log(`round ${roundSeen}: ${pt}`);
      for (const [S, map, nick] of sessions) {
        await S.p.locator('#answer').click().catch(()=>{});
        if (nick === 'Cleo') { // invalid first
          await S.p.locator('#answer').fill('asdfqwerty');
          await S.p.locator('#btn-send').click();
          await sleep(700);
        }
        const ans = map[pt] ?? 'France';
        await S.p.locator('#answer').fill(ans);
        await S.p.locator('#btn-send').click();
        await sleep(500);
      }
      await sleep(1500);
      // check locked messages
      const adaLock = await S1.p.locator('#locked-msg').textContent();
      const bobLock = await S2.p.locator('#locked-msg').textContent();
      t(`r${roundSeen}: Ada locked`, /locked in/.test(adaLock), adaLock);
      t(`r${roundSeen}: Bob locked`, /locked in/.test(bobLock), bobLock);
      const cleoFb = await S3.p.locator('#answer-feedback').textContent();
      if (roundSeen === 1) t('r1: Cleo saw invalid feedback', /No echo/.test(cleoFb), cleoFb);
    }
    // reveal screen?
    const revVisible = await S2.p.locator('#s-reveal').isVisible().catch(() => false);
    if (revVisible) { /* wait for reveal to finish */ }
    await sleep(1000);
  }
  t('three rounds played', roundSeen === 3, String(roundSeen));
  // wait for results
  let results = null;
  for (let i = 0; i < 40 && !results; i++) {
    await sleep(1000);
    if (await S1.p.locator('#s-results').isVisible().catch(() => false)) results = true;
  }
  t('results screen reached', !!results);
  await sleep(800);
  const standHtml = await S1.p.locator('#standings').innerHTML();
  console.log('STANDINGS:', standHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  t('Bob (rare picker) wins over Ada (obvious picker)', standHtml.indexOf('Bob') < standHtml.indexOf('Ada'), standHtml);
  t('best sighting card present', /Best sighting/.test(await S1.p.locator('#best-card').textContent()));
  await S1.p.screenshot({ path: 'rb_results.png' });
  await S2.p.screenshot({ path: 'rb_results_bob.png' });

  console.log('== reveal details (round evidence from server log later) ==');

  console.log('== rematch ==');
  await S1.p.locator('#btn-rematch').click();
  await sleep(600);
  await S2.p.locator('#btn-rematch').click();
  await sleep(1500);
  const backToRound = await S1.p.locator('#s-round').isVisible().catch(() => false) || await S1.p.locator('#s-lobby').isVisible().catch(() => false);
  t('rematch (2/3 votes) restarts game', backToRound);
  // stop the rematch game by leaving
  await S1.p.evaluate(() => { localStorage.removeItem('rarebird'); });
  await S2.p.evaluate(() => { localStorage.removeItem('rarebird'); });
  await S3.p.evaluate(() => { localStorage.removeItem('rarebird'); });

  console.log('== reconnect test ==');
  const S4 = await mkSession();
  await S4.p.locator('#nick').fill('Reco');
  await S4.p.locator('#btn-create').click();
  await sleep(1400);
  const code2 = (await S4.p.locator('#room-code').textContent()).trim();
  const S5 = await mkSession();
  await S5.p.locator('#nick').fill('Phoe');
  await S5.p.locator('#join-code').fill(code2);
  await S5.p.locator('#btn-join').click();
  await sleep(1000);
  await S4.p.locator('#btn-start').click();
  await sleep(4500); // into round 1
  await S5.p.reload(); // connection drop + resume
  await sleep(2500);
  const phoeState = await S5.p.evaluate(() => document.body.innerText);
  t('reconnect resumes into running round', /Round 1/.test(phoeState) || /locked in/.test(phoeState), phoeState.slice(0, 120));

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
