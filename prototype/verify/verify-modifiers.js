// verify-modifiers.js — RUN flash/art-density-v1: mystery modifiers (blind/blacklist/doublefeathers)
// + art-density layers. Uses a protocol-driven 3-player game; plays up to 5 rounds; asserts the
// modifier contract whenever the modifier round appears (forced rooms if needed).
const WebSocket = require('/data/workspace/rarebird-design/prototype/node_modules/ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');

async function main() {
  // art-density layer assertions (browser)
  const { chromium } = require('/data/workspace/research/node_modules/playwright-core');
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://127.0.0.1:3100/?art=1&bold=1', { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  t('illustrated sky base layer present', (await p.locator('#fx-sky img.bold-layer[src*="sky-illustration"]').count()) === 1);
  t('meadow foreground layer present', (await p.locator('#fx-sky img.bold-layer[src*="meadow-near"]').count()) === 1);
  t('balloon twin actors (variety)', (await p.locator('.gd-balloon').count()) === 2);
  await p.locator('#nick').fill('ArtDen');
  await p.locator('#btn-create').click(); await sleep(1400);
  await p.locator('#btn-theme').click(); await sleep(900);
  t('nebula scene base (cosmos)', (await p.locator('#fx-sky img.bold-layer[src*="nebula-scene"]').count()) === 1);
  t('moon-surface foreground (cosmos)', (await p.locator('#fx-sky img.bold-layer[src*="moon-surface"]').count()) === 1);
  t('astronaut actor (cosmos)', (await p.locator('.gd-astro').count()) === 1);
  await b.close();

  // modifier protocol test: play full games until each modifier type observed (max 3 games)
  const seen = new Set();
  let groundedTested = false, blindTested = false, doubleTested = false;
  for (let game = 0; game < 3 && seen.size < 3; game++) {
    const ws = new WebSocket('ws://127.0.0.1:3100');
    await new Promise(r => ws.on('open', r));
    const send = o => ws.send(JSON.stringify({ v: 21, ...o }));
    const waitType = (type, ms = 30000) => new Promise(res => { const to = setTimeout(() => res(null), ms); ws.on('message', function h(m) { const j = JSON.parse(m); if (j.type === type) { clearTimeout(to); ws.off('message', h); res(j); } }); });
    const waitRound = async () => { const rs = await waitType('roundStart', 45000); return rs; };
    send({ type: 'create', nickname: 'Mod' + game });
    await waitType('joined');
    send({ type: 'start', rounds: 5 });
    let done = false;
    for (let r = 0; r < 5 && !done; r++) {
      const rs = await waitRound();
      if (!rs) break;
      const pr = PACK.prompts.find(x => x.id === rs.roundId);
      const rare = pr ? pr.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA')?.canonical ?? pr.catalogue.at(-1).canonical : 'Vanuatu';
      const pigeon = pr ? pr.catalogue.find(e => e.tier === 'PIGEON')?.canonical ?? 'France' : 'France';
      if (rs.modifier) {
        seen.add(rs.modifier.type);
        console.log('  modifier round', r + 1, ':', rs.modifier.type, rs.modifier.banned ?? '');
        if (rs.modifier.type === 'blind') {
          blindTested = true;
          t('blind: example stripped server-side', rs.prompt.example === undefined && rs.prompt.size === 0, JSON.stringify(rs.prompt).slice(0, 80));
        }
        if (rs.modifier.type === 'blacklist' && !groundedTested) {
          groundedTested = true;
          send({ type: 'answer', raw: rs.modifier.banned });
          const ack = await waitType('answerAck');
          t('blacklist: grounded answer rejected with 🕊️ message', ack?.status === 'invalid' && /grounded/.test(ack?.msg ?? ''), JSON.stringify(ack));
          send({ type: 'answer', raw: pigeon }); // then answer normally to continue
        } else {
          send({ type: 'answer', raw: rare });
        }
        if (rs.modifier.type === 'doublefeathers' && !doubleTested) {
          doubleTested = true;
          send({ type: 'wager' });
          const wag = await waitType('answerAck', 5000);
          console.log('  (doublefeathers wager placed:', wag?.status + ')');
        }
      } else {
        send({ type: 'answer', raw: rare });
      }
      // await reveal then wait for next countdown
      await waitType('reveal', 45000);
      await sleep(9000);
      if (r === 4) done = true;
    }
    ws.close();
    await sleep(1000);
  }
  t('all 3 modifier types observed across 3 games', seen.size === 3, [...seen].join(','));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
