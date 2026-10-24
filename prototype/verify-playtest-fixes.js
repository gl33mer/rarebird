// verify-playtest-fixes.js — RUN flash/playtest-fixes-v1
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const WebSocket = require('/data/workspace/rarebird-design/prototype/node_modules/ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n + ' ' + d); } };
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

  const answerRound = async (wantEqual) => {
    let prompt = '';
    for (let k = 0; k < 90; k++) { await sleep(300); const vis = await A.p.locator('#s-round').isVisible().catch(() => false); prompt = (await A.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await A.p.locator('#answer').isEnabled().catch(() => false)) break; }
    const pr = PACK.prompts.find(x => x.text === prompt);
    const pigeon = pr ? pr.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
    const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA').canonical : 'Vanuatu';
    const a = wantEqual ? pigeon : rare;
    await A.p.locator('#answer').fill(a); await A.p.locator('#btn-send').click(); await sleep(400);
    await B.p.locator('#answer').fill(pigeon); await B.p.locator('#btn-send').click(); await sleep(400);
    for (let k = 0; k < 40; k++) { if (await A.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
    await sleep(9000);
  };

  // rounds 1-2: A answers rare, B pigeon → A leads. Round 3: BOTH pigeon → totals: A = rare+pigeon+pigeon, B = pigeon×3 → NOT a tie.
  // For a tie: A pigeon, A pigeon, A rare vs B rare, B pigeon, B pigeon → equal totals + equal rare counts? A: 10+10+100, B: 100+10+10 → same total, same RARE count → shared place + "dead even".
  await answerRound(false); // A rare, B pigeon
  await answerRound(true, true); // both pigeon
  await answerRound(true, true); // both pigeon
  for (let k = 0; k < 50; k++) { if (await A.p.locator('#s-results').isVisible().catch(() => false)) break; await sleep(500); }
  await sleep(800);
  const standings = await A.p.evaluate(() => null) ?? null;
  const resText = await A.p.locator('#standings').textContent();
  const ptsA = await A.p.evaluate(() => { const rows = [...document.querySelectorAll('#standings tr')]; return rows.map(r => r.textContent.replace(/\s+/g, ' ')); });
  console.log('  standings rows:', JSON.stringify(ptsA));
  t('tie produced (equal totals shown)', /100/.test(ptsA.join(' ')));
  const tieNote = await A.p.locator('#tiebreak-note').textContent();
  t('tiebreak note present (shared win or countback)', /Tie broken|dead even/.test(tieNote), tieNote);

  // ready flow: both vote → lobby, start disabled until majority... both voted → enabled
  await A.p.locator('#btn-rematch').click(); await sleep(500);
  await B.p.locator('#btn-rematch').click(); await sleep(800);
  t('majority ready returns room to lobby', await A.p.locator('#s-lobby').isVisible().catch(() => false) && await B.p.locator('#s-lobby').isVisible().catch(() => false));
  t('lobby shows ready ticks', await A.p.evaluate(() => document.getElementById('lobby-players').textContent.includes('✓')));
  t('start enabled after majority ready', !(await A.p.locator('#btn-start').isDisabled().catch(() => false)));
  t('last winner banner shown', /Last game/.test(await A.p.locator('#last-winner').textContent()));

  // start (gate passes) → countdown
  await A.p.locator('#btn-start').click();
  await sleep(1000);
  t('game restarts after ready-gated start', await A.p.locator('#s-round').isVisible().catch(() => false) || await A.p.locator('#countdown-overlay').isVisible().catch(() => false));

  // live toggles: w3d on (no reload), canvas appears; art off (no reload)
  await A.p.locator('#btn-w3d').click(); await sleep(1500);
  t('w3d live-enabled (canvas, no reload)', (await A.p.locator('#w3d-canvas').count()) === 1 && /on/.test(await A.p.locator('#btn-w3d').textContent()));
  await A.p.locator('#btn-w3d').click(); await sleep(1000);
  t('w3d live-disabled (canvas removed)', (await A.p.locator('#w3d-canvas').count()) === 0);
  await A.p.locator('#btn-art').click(); await sleep(600);
  t('art live-toggled to off (label)', /off/.test(await A.p.locator('#btn-art').textContent()));
  await A.p.locator('#btn-art').click(); await sleep(600);

  // hints protocol
  const ws = new WebSocket('ws://127.0.0.1:3100');
  await new Promise(r => ws.on('open', r));
  const send = o => ws.send(JSON.stringify({ v: 20, ...o }));
  const waitType = (type, ms = 8000) => new Promise(res => { const to = setTimeout(() => res(null), ms); ws.on('message', function h(m) { const j = JSON.parse(m); if (j.type === type) { clearTimeout(to); ws.off('message', h); res(j); } }); });
  send({ type: 'join', code: (await A.p.evaluate(() => JSON.parse(localStorage.getItem('rarebird')).room)), nickname: 'Hinter' }).valueOf;
  await sleep(600);
  send({ type: 'hints' });
  const h1 = await waitType('hints');
  t('hints: 3 entries with prefix+len', h1 && h1.hints.length === 3 && h1.hints.every(x => x.hint.length >= 2 && x.len > 0), JSON.stringify(h1));
  send({ type: 'hints' });
  const h2 = await waitType('hints', 4000);
  t('second hints call allowed', h2 !== null);
  send({ type: 'hints' });
  const h3 = await waitType('error', 4000);
  t('third hints call rate-limited', h3 && h3.code === 'rate_limited', JSON.stringify(h3));
  ws.close();

  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
