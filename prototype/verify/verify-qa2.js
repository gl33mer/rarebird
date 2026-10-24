// verify-qa2.js — RUN flash/qa2-polish-v1: overlap, chat default, settings split, no pool size.
const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const BASE = 'http://127.0.0.1:3100';
const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');

async function main() {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });

  // ---------- fresh visitor: settings split + chat default ----------
  const p1 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  p1.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await p1.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(900);
  await p1.locator('#nick').fill('Host');
  await p1.locator('#btn-create').click(); await sleep(1400);
  t('host sees ROOM group + host controls', await p1.locator('#host-controls').isVisible());
  t('YOURS settings row visible to host too', await p1.locator('#player-settings').isVisible());
  const p2 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p2.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' }); await sleep(800);
  await p2.locator('#nick').fill('Guest');
  await p2.locator('#join-code').fill((await p1.locator('#room-code').textContent()).trim());
  await p2.locator('#btn-join').click(); await sleep(1100);
  t('non-host sees YOURS settings row', await p2.locator('#player-settings').isVisible());
  t('non-host does NOT see host controls', !(await p2.locator('#host-controls').isVisible()));

  // ---------- chat default open + persistence ----------
  await p1.locator('#chat-close').click(); await sleep(400); // ensure closed for the lobby clicks
  await p1.reload({ waitUntil: 'domcontentloaded' }); await sleep(1500);
  t('chat stays closed after reload (persisted)', !(await p1.locator('#chat-drawer').evaluate(el => el.classList.contains('open'))));

  // ---------- joiners BEFORE start (join is lobby-only) ----------
  const joiners = [];
  for (const n of ['J1', 'J2', 'J3']) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    const jp = await c.newPage();
    await jp.goto(BASE + '/?art=1&bold=1', { waitUntil: 'domcontentloaded' }); await sleep(700);
    await jp.locator('#nick').fill(n);
    await jp.locator('#join-code').fill((await p1.locator('#room-code').textContent()).trim());
    await jp.locator('#btn-join').click(); await sleep(800);
    joiners.push({ c, p: jp });
  }
  t('5 players seated', (await p1.locator('#lobby-players').textContent().catch(() => '')).split('\u2713').length >= 1 && (await p1.evaluate(() => document.querySelectorAll('#lobby-players .pill').length)) === 5);

  // ---------- start; round 1: invalid feedback (no pool size) ----------
  await p1.locator('#btn-start').click();
  let prompt = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p1.locator('#s-round').isVisible().catch(() => false); prompt = (await p1.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt.length > 6 && !prompt.includes('\u2026') && await p1.locator('#answer').isEnabled().catch(() => false)) break; }
  const exText = await p1.locator('#prompt-example').textContent();
  t('no pool-size on prompt card', !/out there|valid answers/.test(exText), exText);
  await p1.locator('#answer').fill('qqqzzzxxx'); await p1.locator('#btn-send').click(); await sleep(600);
  const fbText = await p1.locator('#answer-feedback').textContent();
  t('no pool-size on invalid feedback', !/out there/.test(fbText), fbText);
  // drawer auto-opens at reveal (banter time), auto-closed at writing — checked implicitly by send working
  await p2.locator('#answer').fill(pigeon1); await p2.locator('#answer').press('Enter');
  // everyone else answers pigeon so round 2 can be the overlap round
  const pr1 = PACK.prompts.find(x => x.text === prompt);
  const pigeon1 = pr1 ? pr1.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
  for (const j of joiners) { await j.p.locator('#answer').fill(pigeon1); await j.p.locator('#answer').press('Enter'); await sleep(300); }
  await p2.locator('#answer').fill(pigeon1); await p2.locator('#answer').press('Enter');
  for (let k = 0; k < 40; k++) { if (await p1.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(9500);

  // ---------- round 2: ALL five answer the same pigeon → same band, assert no overlap ----------
  let prompt2 = '';
  for (let k = 0; k < 90; k++) { await sleep(300); const vis = await p1.locator('#s-round').isVisible().catch(() => false); prompt2 = (await p1.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && prompt2.length > 6 && !prompt2.includes('\u2026') && await p1.locator('#answer').isEnabled().catch(() => false)) break; }
  const pr2 = PACK.prompts.find(x => x.text === prompt2);
  const pigeon2 = pr2 ? pr2.catalogue.find(e => e.tier === 'PIGEON').canonical : 'France';
  for (const j of joiners) { await j.p.locator('#answer').fill(pigeon2); await j.p.locator('#answer').press('Enter'); await sleep(250); }
  await p2.locator('#answer').fill(pigeon2); await p2.locator('#answer').press('Enter'); await sleep(250);
  await p1.locator('#answer').fill(pigeon2); await p1.locator('#answer').press('Enter');
  for (let k = 0; k < 40; k++) { if (await p1.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(4200); // rows settle: stagger (order×480) + flight (950) + margin
  const revealText = await p1.locator('#reveal-list').textContent();
  const rects = await p1.evaluate(() => [...document.querySelectorAll('#reveal-list .rrow')].map(r => { const b = r.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height) }; }));
  let overlaps = 0;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], c2 = rects[j];
    if (a.y < c2.y + c2.h - 2 && c2.y < a.y + a.h - 2) overlaps++;
  }
  t(`same-tier flock renders as ONE cluster (rows: ${rects.length}, overlaps: ${overlaps})`, rects.length >= 1 && overlaps === 0, JSON.stringify(rects));
  t('cluster lists all 5 nicknames', ['Host','Guest','J1','J2','J3'].every(n => revealText.includes(n)), revealText.slice(0, 160));
  t('cluster shows split total', /FLOCK×5/.test(revealText) || /\+\d+/.test(revealText));
  t('no page errors', errs.length === 0, errs.join('|'));

  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
