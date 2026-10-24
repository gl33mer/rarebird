// verify-playtest-fixes.js — RUN flash/playtest-fixes-v1
// Covers: rematch→lobby + ready gate, live toggles, shared-podium tie note, hints rate limit.
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const WebSocket = require('/data/workspace/rarebird-design/prototype/node_modules/ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';
const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');

async function main() {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mk = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' }); await sleep(800); return { c, p }; };
  const A = await mk(), B = await mk();
  await A.p.locator('#nick').fill('FixA'); await A.p.locator('#btn-create').click(); await sleep(1300);
  await B.p.locator('#nick').fill('FixB'); await B.p.locator('#join-code').fill((await A.p.locator('#room-code').textContent()).trim()); await B.p.locator('#btn-join').click(); await sleep(1100);
  await A.p.locator('#btn-rounds').click(); await sleep(150); await A.p.locator('#btn-rounds').click(); await sleep(150); // 3 rounds
  await A.p.locator('#btn-start').click();

  const answerRound = async (aPigeon) => {
    let prompt = '';
    for (let k = 0; k < 90; k++) { await sleep(300); const vis = await A.p.locator('#s-round').isVisible().catch(() => false); prompt = (await A.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await A.p.locator('#answer').isEnabled().catch(() => false)) break; }
    const pr = PACK.prompts.find(x => x.text === prompt);
    const pigeon = pr ? pr.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
    const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA').canonical : 'Vanuatu';
    await A.p.locator('#answer').fill(aPigeon ? pigeon : rare); await A.p.locator('#btn-send').click(); await sleep(400);
    await B.p.locator('#answer').fill(pigeon); await B.p.locator('#btn-send').click(); await sleep(400);
    for (let k = 0; k < 40; k++) { if (await A.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    await sleep(9000);
  };

  // tie engineering: A = pigeon, pigeon, rare; B = pigeon, pigeon, pigeon → A total 10+10+100=120, B 30 → NOT tie.
  // Correct tie: A = rare, pigeon, pigeon (100+10+10=120); B = pigeon, pigeon, rare (10+10+100=120) → equal totals + equal RARE counts → dead even.
  await answerRound(false); // A rare, B pigeon
  await answerRound(true);  // both pigeon
  await answerRound(true);  // both pigeon — wait, that gives A 120 vs B 30.
  // NOTE: engineered tie requires B's rare in the LAST round; adjust: r1 both pigeon, r2 both pigeon, r3 A rare+B rare → 100 vs 100 equal AND equal RARE counts.
  // The 3 rounds above were: r1 A rare/B pigeon, r2 both pigeon, r3 both pigeon → A 120, B 30 — NOT a tie.
  // So instead: play 3 fresh rounds in a NEW room with the tie sequence.
  await b.close();

  const b2 = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mk2 = async () => { const c = await b2.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' }); await sleep(800); return { c, p }; };
  const C = await mk2(), D = await mk2();
  await C.p.locator('#nick').fill('TieC'); await C.p.locator('#btn-create').click(); await sleep(1300);
  await D.p.locator('#nick').fill('TieD'); await D.p.locator('#join-code').fill((await C.p.locator('#room-code').textContent()).trim()); await D.p.locator('#btn-join').click(); await sleep(1100);
  await C.p.locator('#btn-rounds').click(); await sleep(150); await C.p.locator('#btn-rounds').click(); await sleep(150);
  await C.p.locator('#btn-start').click();
  const seq = [[true, false], [true, true], [false, true]]; // [A pigeon?, B pigeon?] → r1: A p, B rare; r2: both p; r3: A rare, B p
  // Wait — target: totals equal + RARE counts equal. A: p,p,rare (10+10+100=120); B: rare,p,p (100+10+10=120). RARE each 1. TIE "dead even".
  // seq[r] = [aPigeon, bPigeon]: r1 [true,false] r2 [true,true] r3 [false,true]
  for (const [aP, bP] of seq) {
    let prompt = '';
    for (let k = 0; k < 90; k++) { await sleep(300); const vis = await C.p.locator('#s-round').isVisible().catch(() => false); prompt = (await C.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await C.p.locator('#answer').isEnabled().catch(() => false)) break; }
    const pr = PACK.prompts.find(x => x.text === prompt);
    const pigeon = pr ? pr.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
    const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA').canonical : 'Vanuatu';
    await C.p.locator('#answer').fill(aP ? pigeon : rare); await C.p.locator('#btn-send').click(); await sleep(400);
    await D.p.locator('#answer').fill(bP ? pigeon : rare); await D.p.locator('#btn-send').click(); await sleep(400);
    for (let k = 0; k < 40; k++) { if (await C.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    await sleep(9000);
  }
  for (let k = 0; k < 50; k++) { if (await C.p.locator('#s-results').isVisible().catch(() => false)) break; await sleep(500); }
  await sleep(800);
  const rows = await C.p.evaluate(() => [...document.querySelectorAll('#standings tr')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  console.log('  standings:', JSON.stringify(rows));
  t('tie produced (equal totals)', rows.length === 2 && rows[0].split(' ')[1] === rows[1].split(' ')[1], rows.join(' | '));
  const note = await C.p.locator('#tiebreak-note').textContent();
  t('tiebreak note rendered', /Tie broken|dead even/.test(note), note);

  // ready flow: C votes first → with 2 players, majority (1) returns the room to lobby immediately;
  // D's screen flips automatically. Ready ticks + winner banner + start gating all assertable in lobby.
  await C.p.locator('#btn-rematch').click(); await sleep(900);
  t('C vote returns room to lobby (majority of 2 = 1)', await C.p.locator('#s-lobby').isVisible().catch(() => false));
  t('D flipped to lobby too', await D.p.locator('#s-lobby').isVisible().catch(() => false));
  t('ready ticks shown', await C.p.evaluate(() => document.getElementById('lobby-players').textContent.includes('\u2713')));
  t('last winner banner shown', /Last game/.test(await C.p.locator('#last-winner').textContent()));
  t('start enabled after majority ready', !(await C.p.locator('#btn-start').isDisabled().catch(() => false)));

  // live toggles: no reload, canvas appears/disappears
  const urlBefore = C.p.url();
  await C.p.locator('#btn-w3d').click(); await sleep(1500);
  t('w3d live-enabled (canvas + no reload)', (await C.p.locator('#w3d-canvas').count()) === 1 && C.p.url() === urlBefore);
  await C.p.locator('#btn-w3d').click(); await sleep(1000);
  t('w3d live-disabled (canvas removed)', (await C.p.locator('#w3d-canvas').count()) === 0);
  await C.p.locator('#btn-art').click(); await sleep(500);
  t('art live-toggle label flips', /off/.test(await C.p.locator('#btn-art').textContent()));
  await C.p.locator('#btn-art').click(); await sleep(500);
  // D readies (join raised majority to 2) → start enables
  await D.p.locator('#btn-ready').click(); await sleep(700);
  t('start enabled after D readies (3 players, 2 ready)', !(await C.p.locator('#btn-start').isDisabled().catch(() => false)));

  // hints: Hinter joins while still in lobby; C starts; hints work during writing
  const ws = new WebSocket('ws://127.0.0.1:3100');
  await new Promise(r => ws.on('open', r));
  ws.send(JSON.stringify({ v: 20, type: 'join', code: (await C.p.evaluate(() => JSON.parse(localStorage.getItem('rarebird')).room)), nickname: 'Hinter' }));
  await sleep(800);
  await C.p.locator('#btn-start').click();
  let launched = false;
  for (let k = 0; k < 40; k++) { await sleep(300); if ((await C.p.locator('#s-round').isVisible().catch(() => false)) && (await C.p.locator('#prompt-text').textContent().catch(() => '')).length > 6) { launched = true; break; } }
  t('ready-gated start launches game', launched);
  for (let k = 0; k < 60; k++) { await sleep(300); if (await C.p.locator('#s-round').isVisible().catch(() => false)) break; } // wait for writing phase
  ws.send(JSON.stringify({ v: 20, type: 'hints' }));
  const h1 = await new Promise(res => { const to = setTimeout(() => res(null), 6000); ws.on('message', function h(m) { const j = JSON.parse(m); if (j.type === 'hints') { clearTimeout(to); ws.off('message', h); res(j); } }); });
  t('hints: 3 entries with prefix+len', h1 && h1.hints.length === 3 && h1.hints.every(x => x.hint.length >= 2 && x.len > 0), JSON.stringify(h1));
  for (let k = 0; k < 60; k++) { await sleep(300); if (await C.p.locator('#s-round').isVisible().catch(() => false)) break; } // wait for writing phase
  ws.send(JSON.stringify({ v: 20, type: 'hints' }));
  const h2 = await new Promise(res => { const to = setTimeout(() => res('timeout'), 6000); ws.on('message', function h(m) { const j = JSON.parse(m); if (j.type === 'hints') { clearTimeout(to); ws.off('message', h); res('ok'); } }); });
  t('second hints call allowed', h2 === 'ok');
  for (let k = 0; k < 60; k++) { await sleep(300); if (await C.p.locator('#s-round').isVisible().catch(() => false)) break; } // wait for writing phase
  ws.send(JSON.stringify({ v: 20, type: 'hints' }));
  const h3 = await new Promise(res => { const to = setTimeout(() => res(null), 6000); ws.on('message', function h(m) { const j = JSON.parse(m); if (j.type === 'error') { clearTimeout(to); ws.off('message', h); res(j); } }); });
  t('third hints call rate-limited', h3 && h3.code === 'rate_limited', JSON.stringify(h3));
  ws.close();

  await b2.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
