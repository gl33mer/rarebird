// Mock judge for local testing: admits answers matching simple heuristics.
// Run: node mock-judge.mjs   (listens :8787)
import { createServer } from 'node:http';
createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(404).end(); return; }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const { category = '', answer = '' } = JSON.parse(body || '{}');
    const a = answer.toLowerCase().trim();
    // admit any 3+ letter alphabetic word that isn't keyboard mash
    const looksReal = /^[a-z][a-z' -]{2,40}$/.test(a) && !/(.)\1{2,}/.test(a) && !/[qxz]{2,}/.test(a) && !/asdf|qwer|zzz/.test(a);
    const canonical = a.replace(/\b\w/g, c => c.toUpperCase());
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(looksReal ? { valid: true, canonical, tier: 'STARLING' } : { valid: false }));
    console.log(new Date().toISOString(), 'judge', category, '→', answer, looksReal ? 'ADMIT' : 'reject');
  });
}).listen(8787, () => console.log('mock judge on :8787'));
