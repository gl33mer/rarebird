// Live Top Call + SPLIT verification via protocol.
const WebSocket = require('/data/workspace/rarebird-design/prototype/node_modules/ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const PACK = require('/data/workspace/rarebird-design/prototype/pack.json');
  const send = (w, o) => w.send(JSON.stringify({ v: 8, ...o }));
  const waitType = (w, type, ms = 20000) => new Promise(res => { const to = setTimeout(() => res(null), ms); w.on('message', function h(m) { const j = JSON.parse(m); if (j.type === type) { clearTimeout(to); w.off('message', h); res(j); } }); });
  const open = () => new Promise(r => { const w = new WebSocket('ws://127.0.0.1:3000'); w.on('open', () => r(w)); });
  const a = await open(); send(a, { type: 'create', nickname: 'TopBot' });
  const joined = await waitType(a, 'joined');
  const b = await open(); send(b, { type: 'join', code: joined.code, nickname: 'CopyBot' });
  await waitType(b, 'state');
  send(a, { type: 'start', rounds: 5 });
  let rs = await waitType(a, 'roundStart');
  let prompt = PACK.prompts.find(p => p.id === rs.roundId);
  // find a MEGA/RARE entry both will copy (SPLIT test) and a distinct one for a
  const rare = prompt.catalogue.find(e => e.tier === 'RARE BIRD' || e.tier === 'MEGA');
  const mid = prompt.catalogue.find(e => e.tier === 'STARLING');
  send(a, { type: 'answer', raw: rare.canonical });
  await waitType(a, 'answerAck');
  send(a, { type: 'wager' });
  const wag = await waitType(a, 'answerAck');
  t('wager accepted (Top Call)', wag?.status === 'wagered', JSON.stringify(wag));
  send(b, { type: 'answer', raw: rare.canonical }); // copy → SPLIT, and kills A's top call
  await waitType(b, 'answerAck');
  const rev = await waitType(a, 'reveal', 25000);
  const rowA = rev.rows.find(r => r.nickname === 'TopBot');
  const rowB = rev.rows.find(r => r.nickname === 'CopyBot');
  t('SPLIT applied to identical rare answers', rowA.splitOf === 2 && rowB.splitOf === 2, JSON.stringify([rowA.splitOf, rowB.splitOf]));
  t('split points = tier/n (copy=42, topcall-halved=21)', rowB.pts === 42 && rowA.pts === 21, JSON.stringify([rowA.pts, rowB.pts]));
  t('copied top call halved (not unique top)', rowA.wagered && rowA.wagerOutcome === 'halved', JSON.stringify(rowA));
  a.close(); b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
