// RAREBIRD disposable multiplayer prototype — proves the game loop end-to-end.
// This is NOT production code: it is the validation artifact for the design
// package (see 06_TEST_PLAN_AND_RESULTS.md). Production implementation is
// specified in 03_MULTIPLAYER_TECHNICAL_SPEC.md.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';
import { resolveAnswer, scoreRound, standings, tierByName } from './rules-engine.mjs';

const PACK = JSON.parse(readFileSync(new URL('./pack.json', import.meta.url), 'utf8'));
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------- gameplay log
// Every player-visible game event gets a timestamped line here, mirrored into a
// ring buffer served at GET /log so QA sessions can be reviewed after the fact.
const LOG_RING = [];
export const _logRing = LOG_RING; // (test hook)
function glog(event, data = {}) {
  const line = `${new Date().toISOString()} ${event} ${JSON.stringify(data)}`;
  LOG_RING.push(line); if (LOG_RING.length > 400) LOG_RING.shift();
  console.log(line);
}

// ------------------------------------------------------------- helpers
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const makeCode = () => Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
const makeId = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const cleanNick = s => (s ?? '').toString().replace(/\s+/g, ' ').trim().slice(0, 14) || 'Birder';

const SETTINGS_DEFAULTS = { rounds: 3, roundMs: 30000, revealMs: 8000, theme: 'birds' };
const THEMES = new Set(['birds', 'cosmos']);
// chat guardrails: kids + strangers-of-the-internet safety
const CHAT = { maxLen: 100, perPlayerWindowMs: 10000, perPlayerMax: 5 };
const PROFANITY = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard', 'dick', 'pussy', 'asshole', 'wanker', 'slut', 'whore'];
const maskProfanity = t => t.replace(new RegExp(`\\b(${PROFANITY.join('|')})\\b`, 'gi'), m => m[0] + '🐦'.repeat(m.length - 1));
const ROOM_TTL_AFTER_EMPTY = 5 * 60 * 1000;
const REJOIN_WINDOW = 120 * 1000;

// ------------------------------------------------------------- optional judge
// Prototype-only robustness layer: when an answer misses the catalogue, ask an
// externally hosted "decision engine" (e.g. a small model on a MoLab notebook,
// see JUDGE.md) whether the answer is a real member of the category. Admitted
// answers join THIS room's in-memory catalogue only, tagged for editorial
// review. Disabled unless LLM_JUDGE_URL is set. Production keeps curated
// catalogues (D-16); this is a field-test aid, not a product feature.
// Client version handshake: the inline-script client travels with the HTML,
// so a stale cached HTML = old behaviours (field-observed: static countdown,
// no ascent reveal). Clients announce their version; mismatches get an 'update'
// nudge and are logged.
const CLIENT_VERSION = 7;

const JUDGE_URL = process.env.LLM_JUDGE_URL || null;
const JUDGE_TIMEOUT_MS = 2500;
const JUDGE_CAP_PER_ROUND = 6;
const VALID_TIERS = new Set(['PIGEON', 'SPARROW', 'STARLING', 'KINGFISHER', 'MEGA', 'RARE BIRD']);
async function judgeAnswer(promptText, raw) {
  if (!JUDGE_URL) return null;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), JUDGE_TIMEOUT_MS);
  try {
    const res = await fetch(JUDGE_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: promptText, answer: raw }), signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j || j.valid !== true) return { valid: false };
    const tier = VALID_TIERS.has(j.tier) ? j.tier : 'STARLING';
    return { valid: true, canonical: (j.canonical || raw).toString().slice(0, 48), tier };
  } catch { return null; } finally { clearTimeout(to); }
}

// ------------------------------------------------------------- state
/** rooms: Map<code, room>
 *  room = { code, hostId, players: Map<pid, player>, settings, phase,
 *           roundIndex, prompts: [prompt...], submissions: Map<pid, {raw, atMs, confirmed}>,
 *           rounds: [rows...], phaseEndsAt, created, emptySince }
 *  player = { pid, token, nick, socket|null, lastSeen, connected, answered }
 */
const rooms = new Map();

function publicRoom(room, forPid) {
  const players = [...room.players.values()].map(p => ({
    pid: p.pid, nick: p.nick, connected: p.connected, answered: p.answered, isHost: p.pid === room.hostId,
  }));
  return {
    code: room.code, phase: room.phase, settings: room.settings,
    players, roundIndex: room.roundIndex, totalRounds: room.prompts.length,
    phaseEndsAt: (room.phase === 'writing' || room.phase === 'countdown') ? room.phaseEndsAt : null,
    serverNow: now(),
  };
}

function promptView(prompt) { // catalogue is server-secret until reveal
  return { id: prompt.id, text: prompt.text, example: prompt.example, size: prompt.catalogue.length };
}

function broadcast(room, type, payload) {
  const msg = JSON.stringify({ type, ...payload });
  for (const p of room.players.values()) if (p.socket && p.connected) p.socket.send(msg);
}
function sendTo(player, type, payload) {
  if (player.socket && player.connected) player.socket.send(JSON.stringify({ type, ...payload }));
}

function pickPrompts(n) {
  const pool = [...PACK.prompts];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

// ---- phase machine with timer epochs -------------------------------------
// Every phase transition bumps room.phaseSeq and clears pending timers.
// A scheduled callback only acts if the epoch it captured is still current.
// (Fixes the field bug where an early "all_locked" round end left its 30s
// timer alive to assassinate the NEXT round 2.5s in — see 06 §7b.)
function clearTimers(room) {
  clearTimeout(room.tCountdown); clearTimeout(room.tRound); clearTimeout(room.tReveal);
  clearTimeout(room.tEarly);
  room.tCountdown = room.tRound = room.tReveal = room.tEarly = null;
}

function startCountdown(room) {
  clearTimers(room);
  room.phaseSeq = (room.phaseSeq || 0) + 1;
  const seq = room.phaseSeq;
  room.phase = 'countdown';
  room.phaseEndsAt = now() + 3500;
  glog('countdown', { room: room.code, nextRound: room.roundIndex });
  broadcast(room, 'state', { room: publicRoom(room) });
  broadcast(room, 'countdown', { endsAt: room.phaseEndsAt, serverNow: now() });
  room.tCountdown = setTimeout(() => {
    if (room.phaseSeq !== seq || room.phase !== 'countdown') return;
    startWriting(room);
  }, 3500);
}

function startWriting(room) {
  if (room.phase !== 'countdown') return; // room may have been reset
  room.phaseSeq = (room.phaseSeq || 0) + 1;
  const seq = room.phaseSeq;
  room.phase = 'writing';
  room.submissions = new Map();
  room.judgeCalls = 0;
  for (const p of room.players.values()) p.answered = false;
  room.phaseEndsAt = now() + room.settings.roundMs;
  const prompt = room.prompts[room.roundIndex];
  glog('roundStart', { room: room.code, round: room.roundIndex, promptId: prompt.id, prompt: prompt.text, durationMs: room.settings.roundMs });
  broadcast(room, 'roundStart', {
    roundIndex: room.roundIndex, roundId: prompt.id, prompt: promptView(prompt),
    durationMs: room.settings.roundMs, endsAt: room.phaseEndsAt, serverNow: now(),
    totalRounds: room.prompts.length, theme: room.settings.theme,
  });
  broadcast(room, 'state', { room: publicRoom(room) });
  room.tRound = setTimeout(() => {
    if (room.phaseSeq !== seq || room.phase !== 'writing') return; // stale timer from an early-ended round must not fire
    glog('roundEnd', { room: room.code, round: room.roundIndex, reason: 'timer' });
    endWriting(room);
  }, room.settings.roundMs);
}

function endWriting(room, reason = 'timer') {
  if (room.phase !== 'writing') return;
  clearTimers(room);
  room.phaseSeq = (room.phaseSeq || 0) + 1;
  const seq = room.phaseSeq;
  const prompt = room.prompts[room.roundIndex];
  const validSubs = [...room.submissions.values()].filter(s => s.status === 'locked').map(s => ({ playerId: s.playerId, nickname: s.nickname, raw: s.confirmed ?? s.raw, submittedAtMs: s.atMs, wager: !!s.wager }));
  const computed = scoreRound(prompt, validSubs, room.settings.roundMs, { wagers: 'double' });
  const timeoutRows = [...room.players.values()].filter(p => {
    const s = room.submissions.get(p.pid); return !s || s.status !== 'locked';
  }).map(p => ({ playerId: p.pid, nickname: p.nick, entry: null, typed: room.submissions.get(p.pid)?.raw ?? '', pts: 0, timedOut: true }));
  const allRows = [...computed, ...timeoutRows];
  room.rounds.push(allRows);
  room.phase = 'reveal';
  room.phaseEndsAt = now() + room.settings.revealMs;
  const revealRows = allRows.map(r => ({
    nickname: r.nickname, typed: r.typed, canonical: r.entry?.canonical ?? null,
    tier: r.entry?.tier ?? null, pts: r.pts, base: r.base ?? null, wagered: r.wagered ?? false, wagerOutcome: r.wagerOutcome ?? null,
    timedOut: r.timedOut ?? false, twins: r.twins ?? 0,
    rarityPct: r.entry?.evidence?.rarityPct ?? null,
  }));
  broadcast(room, 'reveal', { roundIndex: room.roundIndex, rows: revealRows, endsAt: room.phaseEndsAt, serverNow: now(), next: room.roundIndex + 1 >= room.prompts.length ? 'results' : 'round' });
  broadcast(room, 'state', { room: publicRoom(room) });
  glog('reveal', { room: room.code, round: room.roundIndex, rows: revealRows.map(r => `${r.nickname}:"${r.canonical ?? r.typed}"=${r.tier ?? 'NO SIGHTING'}+${r.pts}${r.twins > 1 ? ' TWINS' : ''}`) });
  room.tReveal = setTimeout(() => {
    if (room.phaseSeq !== seq || room.phase !== 'reveal') return;
    nextAfterReveal(room);
  }, room.settings.revealMs);
}

function nextAfterReveal(room) {
  if (room.phase !== 'reveal') return;
  if (room.roundIndex + 1 >= room.prompts.length) {
    room.phase = 'results';
    room.standings = standings(room.rounds, [...room.players.values()].map(p => ({ playerId: p.pid, nickname: p.nick })));
    const best = room.rounds.flat().filter(r => r.entry).sort((a, b) => b.pts - a.pts)[0];
    broadcast(room, 'results', {
      standings: room.standings.map(s => ({ place: s.place, nick: s.nickname, pts: s.pts, tierCount: s.tierCount })),
      bestAnswer: best ? { nick: best.nickname, canonical: best.entry.canonical, tier: best.entry.tier, pts: best.pts } : null,
      serverNow: now(),
    });
    glog('results', { room: room.code, standings: room.standings.map(s => `${s.place}.${s.nickname}=${s.pts}`) });
    broadcast(room, 'state', { room: publicRoom(room) });
  } else {
    room.roundIndex += 1;
    startCountdown(room);
  }
}

function rematch(room) {
  clearTimers(room);
  clearTimeout(room.tEarly); room.tEarly = null;
  room.rounds = []; room.roundIndex = 0; room.standings = null; room.rematchVotes = new Set();
  room.prompts = pickPrompts(room.settings.rounds);
  startCountdown(room);
}

function gcLoop() {
  for (const [code, room] of rooms) {
    const anyConnected = [...room.players.values()].some(p => p.connected);
    if (!anyConnected) {
      if (!room.emptySince) room.emptySince = now();
      else if (now() - room.emptySince > ROOM_TTL_AFTER_EMPTY) rooms.delete(code);
    } else room.emptySince = null;
  }
  setTimeout(gcLoop, 30 * 1000);
}
gcLoop();

// ------------------------------------------------------------- sockets
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (path === '/healthz') { res.writeHead(200); res.end('ok'); return; }
  if (path === '/log') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(LOG_RING.slice(-200).join('\n') + '\n');
    return;
  }
  // static files from public/ (path-traversal safe)
  const rel = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  if (!/^[\w.-]+(?:\/[\w.-]+)*$/.test(rel)) { res.writeHead(404); res.end(); return; }
  try {
    const file = readFileSync(new URL('./public/' + rel, import.meta.url));
    const ext = '.' + (rel.split('.').pop() || '');
    // the HTML carries the whole inline client: it must never be served stale
    const cache = ext === '.html' ? 'no-store' : 'no-cache';
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': cache });
    res.end(file);
  } catch { res.writeHead(404); res.end('not found'); }
});
const wss = new WebSocketServer({ server });
const RATE = { max: 12, windowMs: 5000 };

wss.on('connection', (socket, req) => {
  socket._msgs = [];
  socket._room = null; socket._pid = null;
  const url = new URL(req.url, 'http://x');
  const resumeCode = url.searchParams.get('room');
  const resumeToken = url.searchParams.get('token');

  const rateOk = () => {
    const t = now();
    socket._msgs = socket._msgs.filter(x => t - x < RATE.windowMs);
    if (socket._msgs.length >= RATE.max) { sendTo({ socket, connected: true }, 'error', { code: 'rate_limited', msg: 'Slow down a moment.' }); return false; }
    socket._msgs.push(t); return true;
  };

  const handle = (data) => {
    const { type, ...args } = data;
    // --- resume path ---
    if (type === 'resume' && resumeCode && resumeToken) {
      const room = rooms.get(resumeCode.toUpperCase());
      const player = room && [...room.players.values()].find(p => p.token === resumeToken);
      if (!player) { socket.send(JSON.stringify({ type: 'error', code: 'no_room', msg: 'Room not found or expired.' })); return; }
      player.socket = socket; player.connected = true; player.lastSeen = now();
      socket._room = room.code; socket._pid = player.pid;
      glog('resume', { room: room.code, nick: player.nick, phase: room.phase });
      sendTo(player, 'state', { room: publicRoom(room, player.pid) });
      if (room.phase === 'countdown') {
        sendTo(player, 'countdown', { endsAt: room.phaseEndsAt, serverNow: now(), nextRound: room.roundIndex, totalRounds: room.prompts.length });
      }
      if (room.phase === 'writing') {
        const prompt = room.prompts[room.roundIndex];
        const remainMs = Math.max(0, room.phaseEndsAt - now());
        sendTo(player, 'roundStart', { roundIndex: room.roundIndex, roundId: prompt.id, prompt: promptView(prompt), durationMs: room.settings.roundMs, endsAt: room.phaseEndsAt, serverNow: now() });
        const s = room.submissions.get(player.pid);
        if (s?.status === 'suggest') sendTo(player, 'answerAck', { status: 'suggest', suggestion: s.suggest.canonical });
        if (s?.status === 'locked') sendTo(player, 'answerAck', { status: 'locked', canonical: s.confirmed ?? s.raw });
      }
      return;
    }
    const handleRoomless = () => {
      switch (type) {
        case 'create': {
          const nick = cleanNick(args.nickname);
          const code = makeCode();
          const settings = { ...SETTINGS_DEFAULTS, rounds: [3, 5, 7].includes(+args.rounds) ? +args.rounds : 3 };
          if (THEMES.has(args.theme)) settings.theme = args.theme;
          if ([20000, 30000, 45000].includes(+args.roundMs)) settings.roundMs = +args.roundMs;
          const room2 = { code, hostId: null, players: new Map(), settings, phase: 'lobby', roundIndex: 0, prompts: [], submissions: new Map(), rounds: [], phaseEndsAt: null, created: now(), emptySince: null, standings: null };
          rooms.set(code, room2);
          const pid = makeId(); const token = makeId() + makeId();
          room2.players.set(pid, { pid, token, nick, socket, connected: true, lastSeen: now(), answered: false });
          room2.hostId = pid;
          socket._room = code; socket._pid = pid;
          glog('create', { room: code, nick, rounds: settings.rounds });
          sendTo(room2.players.get(pid), 'joined', { code, pid, token, isHost: true });
          sendTo(room2.players.get(pid), 'state', { room: publicRoom(room2, pid) });
          return true;
        }
        case 'join': {
          const code = (args.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const room2 = rooms.get(code);
          if (!room2) { socket.send(JSON.stringify({ type: 'error', code: 'no_room', msg: 'No room with that code.' })); return true; }
          if (room2.phase !== 'lobby' && room2.phase !== 'results') { socket.send(JSON.stringify({ type: 'error', code: 'in_progress', msg: 'Game already running.' })); return true; }
          if (room2.players.size >= 12) { socket.send(JSON.stringify({ type: 'error', code: 'full', msg: 'Room is full.' })); return true; }
          const pid = makeId(); const token = makeId() + makeId();
          let nick = cleanNick(args.nickname); const taken = new Set([...room2.players.values()].map(p => p.nick.toLowerCase()));
          while (taken.has(nick.toLowerCase())) nick = nick.slice(0, 12) + Math.floor(Math.random() * 90 + 10);
          room2.players.set(pid, { pid, token, nick, socket, connected: true, lastSeen: now(), answered: false });
          socket._room = code; socket._pid = pid;
          glog('join', { room: code, nick, players: room2.players.size });
          sendTo(room2.players.get(pid), 'joined', { code, pid, token, isHost: pid === room2.hostId });
          broadcast(room2, 'state', { room: publicRoom(room2, pid) });
          return true;
        }
        default: return false;
      }
    };
    if (handleRoomless()) return;
    const room = rooms.get(socket._room || '');
    if (!room) { socket.send(JSON.stringify({ type: 'error', code: 'not_in_room', msg: 'Join a room first.' })); return; }
    const me = room.players.get(socket._pid);

    switch (type) {
      case 'start': {
        if (!me || me.pid !== room.hostId || room.phase !== 'lobby') return;
        if ([3, 5, 7].includes(+args.rounds)) room.settings.rounds = +args.rounds;
        if ([20000, 30000, 45000].includes(+args.roundMs)) room.settings.roundMs = +args.roundMs;
        if (THEMES.has(args.theme)) room.settings.theme = args.theme;
        room.prompts = pickPrompts(room.settings.rounds);
        room.rounds = []; room.roundIndex = 0;
        glog('start', { room: room.code, by: me.nick, settings: room.settings });
        startCountdown(room);
        break;
      }
      case 'answer': {
        if (room.phase !== 'writing' || !me) return;
        const prev = room.submissions.get(me.pid);
        if (prev?.status === 'locked') { sendTo(me, 'answerAck', { status: 'already_locked' }); return; }
        const prompt = room.prompts[room.roundIndex];
        const raw = (args.raw ?? '').toString().slice(0, 64).trim();
        const atMs = Math.min(room.settings.roundMs, Math.max(0, now() - (room.phaseEndsAt - room.settings.roundMs)));
        if (!raw) return;
        const r = resolveAnswer(prompt.catalogue, raw);
        glog('answer', { room: room.code, round: room.roundIndex, nick: me.nick, promptId: prompt.id, raw, status: r.status, match: r.entry?.canonical ?? null, msLeft: Math.max(0, room.phaseEndsAt - now()) });
        if (r.status === 'valid') {
          room.submissions.set(me.pid, { playerId: me.pid, nickname: me.nick, raw, confirmed: r.entry.canonical, atMs, status: 'locked' });
          try { appendFileSync(new URL('./answers.jsonl', import.meta.url), JSON.stringify({ ts: new Date().toISOString(), promptId: prompt.id, canonical: r.entry.canonical, tier: r.entry.tier }) + '\n'); } catch {}
          me.answered = true;
          sendTo(me, 'answerAck', { status: 'locked', canonical: r.entry.canonical, tierHint: null });
          broadcast(room, 'playerAnswered', { pid: me.pid, nick: me.nick });
          broadcast(room, 'state', { room: publicRoom(room) });
        } else if (r.status === 'suggest' && args.confirm) {
          room.submissions.set(me.pid, { playerId: me.pid, nickname: me.nick, raw, confirmed: r.entry.canonical, atMs, status: 'locked' });
          me.answered = true;
          sendTo(me, 'answerAck', { status: 'locked', canonical: r.entry.canonical });
          broadcast(room, 'playerAnswered', { pid: me.pid, nick: me.nick });
          broadcast(room, 'state', { room: publicRoom(room) });
        } else if (r.status === 'suggest') {
          room.submissions.set(me.pid, { playerId: me.pid, nickname: me.nick, raw, suggest: r.entry, atMs, status: 'suggest' });
          sendTo(me, 'answerAck', { status: 'suggest', suggestion: r.entry.canonical });
        } else {
          room.submissions.set(me.pid, { playerId: me.pid, nickname: me.nick, raw, atMs, status: 'invalid' });
          if (JUDGE_URL && (room.judgeCalls || 0) < JUDGE_CAP_PER_ROUND) {
            room.judgeCalls = (room.judgeCalls || 0) + 1;
            const seq = room.phaseSeq;
            sendTo(me, 'answerAck', { status: 'checking', msg: 'Checking the field guide…' });
            judgeAnswer(prompt.text, raw).then(verdict => {
              if (room.phaseSeq !== seq || room.phase !== 'writing' || !room.players.has(me.pid)) return; // round over / player gone
              if (verdict && verdict.valid) {
                const entry = { canonical: verdict.canonical, aliases: [], tier: verdict.tier, evidence: { note: 'llm-adjudicated live', typed: raw } };
                prompt.catalogue.push(entry);
                room.submissions.set(me.pid, { playerId: me.pid, nickname: me.nick, raw, confirmed: entry.canonical, atMs, status: 'locked' });
                me.answered = true;
                glog('judgeAdmit', { room: room.code, round: room.roundIndex, nick: me.nick, raw, canonical: entry.canonical, tier: entry.tier });
                sendTo(me, 'answerAck', { status: 'locked', canonical: entry.canonical });
                broadcast(room, 'playerAnswered', { pid: me.pid, nick: me.nick });
                broadcast(room, 'state', { room: publicRoom(room) });
                if (!room.tEarly && [...room.players.values()].every(p => room.submissions.get(p.pid)?.status === 'locked')) {
                  const seq2 = room.phaseSeq;
                  room.tEarly = setTimeout(() => { room.tEarly = null; if (room.phaseSeq === seq2 && room.phase === 'writing') endWriting(room, 'all_locked'); }, 1200);
                }
              } else {
                glog('judgeReject', { room: room.code, round: room.roundIndex, nick: me.nick, raw });
                sendTo(me, 'answerAck', { status: 'invalid', msg: 'No echo! Try again.' });
              }
            });
          } else {
            sendTo(me, 'answerAck', { status: 'invalid', msg: 'No echo! Try again.' });
          }
        }
        // everyone answered? end early
        const everyone = [...room.players.values()].every(p => room.submissions.get(p.pid)?.status === 'locked');
        if (everyone && !room.tEarly) {
          const seq = room.phaseSeq;
          glog('roundEnd', { room: room.code, round: room.roundIndex, reason: 'all_locked' });
          room.tEarly = setTimeout(() => {
            room.tEarly = null;
            if (room.phaseSeq !== seq || room.phase !== 'writing') return;
            endWriting(room, 'all_locked');
          }, 1200);
        }
        break;
      }
      case 'report': {
        const prompt = room.prompts[room.roundIndex] ?? room.prompts[0];
        const entry = { ts: new Date().toISOString(), promptId: args.promptId ?? prompt?.id ?? null, typed: (args.raw ?? '').toString().slice(0, 64), room: room.code };
        try { appendFileSync(new URL('./reports.jsonl', import.meta.url), JSON.stringify(entry) + '\n'); } catch {}
        glog('report', entry);
        sendTo(me, 'answerAck', { status: 'reported' });
        break;
      }
      case 'wager': {
        if (room.phase !== 'writing' || !me) return;
        const sub = room.submissions.get(me.pid);
        if (sub?.status !== 'locked') return;
        if (sub.wager) { sendTo(me, 'answerAck', { status: 'already_wagered' }); return; }
        sub.wager = true;
        glog('wager', { room: room.code, round: room.roundIndex, nick: me.nick });
        sendTo(me, 'answerAck', { status: 'wagered' });
        break;
      }
      case 'chat': {
        if (!me) return;
        const text = maskProfanity((args.text ?? '').toString().replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT.maxLen));
        if (!text) return;
        const t = now();
        me._chat = (me._chat || []).filter(x => t - x < CHAT.perPlayerWindowMs);
        if (me._chat.length >= CHAT.perPlayerMax) { sendTo(me, 'error', { code: 'rate_limited', msg: 'Easy on the chat 🐦' }); return; }
        me._chat.push(t);
        glog('chat', { room: room.code, nick: me.nick, text });
        broadcast(room, 'chat', { nick: me.nick, text, ts: t });
        break;
      }
      case 'skipReveal': {
        if (room.phase === 'reveal' && me?.pid === room.hostId) nextAfterReveal(room);
        break;
      }
      case 'rematch': {
        if (room.phase !== 'results' || !me) return;
        room.rematchVotes = room.rematchVotes || new Set();
        room.rematchVotes.add(me.pid);
        broadcast(room, 'rematchVote', { nick: me.nick, votes: room.rematchVotes.size, total: room.players.size });
        const majority = room.rematchVotes.size >= Math.ceil(room.players.size / 2);
        if (majority) { room.rematchVotes = new Set(); rematch(room); }
        break;
      }
      case 'leave': {
        if (me) {
          glog('leave', { room: room.code, nick: me.nick });
          room.players.delete(me.pid);
          if (room.players.size === 0) { clearTimers(room); rooms.delete(room.code); }
          else broadcast(room, 'state', { room: publicRoom(room) });
        }
        socket._room = null;
        break;
      }
      default: break;
    }
  };

  socket.on('message', m => {
    if (!rateOk()) return;
    let data; try { data = JSON.parse(m.toString()); } catch { return; }
    if (data && Number.isFinite(+data.v)) socket._clientV = +data.v;
    if (socket._clientV != null && socket._clientV !== CLIENT_VERSION) {
      // once per mismatch per socket version
      if (socket._warnedV !== socket._clientV) {
        socket._warnedV = socket._clientV;
        glog('staleClient', { clientV: socket._clientV, serverV: CLIENT_VERSION });
        socket.send(JSON.stringify({ type: 'update', current: CLIENT_VERSION, theirs: socket._clientV }));
      }
    }
    try { handle(data); } catch (e) { console.error('handler error', e); socket.send(JSON.stringify({ type: 'error', code: 'server', msg: 'Something went wrong.' })); }
  });
  socket.on('close', () => {
    const room = rooms.get(socket._room || '');
    if (!room) return;
    const me = room.players.get(socket._pid);
    if (me) {
      glog('disconnect', { room: room.code, nick: me.nick, phase: room.phase });
      me.connected = false; me.socket = null; me.disconnectedAt = now();
      broadcast(room, 'state', { room: publicRoom(room) });
      // drop player after rejoin window if game not running; keep seat during game
      setTimeout(() => {
        if (me.connected) return;
        const r2 = rooms.get(room.code); if (!r2) return;
        if (r2.phase === 'lobby' || r2.phase === 'results') {
          r2.players.delete(me.pid);
          if (r2.players.size === 0) rooms.delete(r2.code);
          else { if (r2.hostId === me.pid) r2.hostId = [...r2.players.keys()][0]; broadcast(r2, 'state', { room: publicRoom(r2) }); }
        }
      }, REJOIN_WINDOW);
    }
  });
});

server.listen(PORT, () => console.log(`rarebird prototype on :${PORT}`));
