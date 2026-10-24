// Security probes per review: /log gate, brute-force backoff, payload cap, strict types, lock/kick, presets.
const WebSocket = require('/data/workspace/rarebird-design/prototype/node_modules/ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };

async function main() {
  // 1) /log gate
  t('/log denied without token', await fetch('http://127.0.0.1:3100/log').then(r => r.status) === 403);
  t('/log denied wrong token', await fetch('http://127.0.0.1:3100/log?t=x').then(r => r.status) === 403);
  t('/log opens with token', await fetch('http://127.0.0.1:3100/log?t=flashtest').then(r => r.status) === 200);
  const h = await fetch('http://127.0.0.1:3100/healthz').then(r => r.json());
  t('healthz stats json', h && h.ok === true && 'globalJoinFails' in h);

  const send = (w, o) => w.send(JSON.stringify({ v: 8, ...o }));
  const waitType = (w, type, ms = 10000) => new Promise(res => { const to = setTimeout(() => res(null), ms); w.on('message', function h(m) { const j = JSON.parse(m); if (j.type === type) { clearTimeout(to); w.off('message', h); res(j); } }); });
  const open = () => new Promise(r => { const w = new WebSocket('ws://127.0.0.1:3100'); w.on('open', () => r(w)); });

  // 2) legit flow FIRST (before IP poisoning)
  const a = await open();
  send(a, { type: 'create', nickname: 'FlowBot', theme: 'birds' });
  const joined = await waitType(a, 'joined');
  t('create works (5-char code)', joined && /^[A-Z2-9]{5}$/.test(joined.code), joined?.code);
  const b = await open();
  send(b, { type: 'join', code: joined.code, nickname: 'FlowBot2' });
  const st = await waitType(b, 'state');
  t('join works', st && st.room.players.length === 2);

  // 3) preset chat relay; free text rejected
  send(a, { type: 'chat', preset: 'gg! 🎉' });
  const chat1 = await waitType(b, 'chat');
  t('preset chat relays', chat1 && chat1.text === 'gg! 🎉', JSON.stringify(chat1));
  send(a, { type: 'chat', text: 'free text should bounce' });
  t('free-text chat rejected', (await waitType(b, 'chat', 1500)) === null);

  // 4) lock room + kick
  send(a, { type: 'lockRoom', locked: true });
  await sleep(400);
  const c2 = await open();
  send(c2, { type: 'join', code: joined.code, nickname: 'LockedOut' });
  const lockErr = await waitType(c2, 'error');
  t('locked room refuses joins', lockErr && lockErr.code === 'locked', JSON.stringify(lockErr));
  send(a, { type: 'lockRoom', locked: false });
  await sleep(300);
  send(a, { type: 'kick', nick: 'FlowBot2' });
  const bClosed = new Promise(r => b.on('close', r));
  t('kicked socket closed', await Promise.race([bClosed.then(() => true), sleep(2500).then(() => false)]));
  a.close(); c2.close();

  // 5) strict types: non-string raw + truthy-confirm ignored
  const wT = await open();
  let gotAck = false;
  wT.on('message', m => { const j = JSON.parse(m); if (j.type === 'answerAck') gotAck = true; });
  send(wT, { type: 'answer', raw: { evil: true }, confirm: 'yes' });
  await sleep(900);
  t('non-string raw / truthy confirm ignored', !gotAck);
  wT.close();

  // 6) payload cap: oversized frame closes socket, server survives
  const wsBig = await open();
  let closed = false; wsBig.on('close', () => { closed = true; });
  wsBig.send(JSON.stringify({ v: 8, type: 'join', code: 'AAAAA', nickname: 'x'.repeat(3000) }));
  await sleep(1500);
  t('oversized payload rejected gracefully', closed);
  t('server survives oversized payload', await fetch('http://127.0.0.1:3100/healthz').then(r => r.ok));

  // 7) brute force LAST (poisons shared IP)
  let sawSlow = false;
  for (let i = 0; i < 7 && !sawSlow; i++) {
    const w = await open();
    w.on('message', m => { const j = JSON.parse(m); if (j.code === 'slow_down') sawSlow = true; });
    send(w, { type: 'join', code: 'ZZZZZ', nickname: 'Brute' + i });
    await sleep(200);
    w.close();
  }
  t('brute force triggers slow_down', sawSlow);
  const h2 = await fetch('http://127.0.0.1:3100/healthz').then(r => r.json());
  t('healthz counts failed joins', h2.globalJoinFails >= 5, String(h2.globalJoinFails));
  t('server healthy after everything', h2.ok === true);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e); process.exit(1); });
