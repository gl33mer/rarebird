// Round-5 verification: chat drawer (2 clients), cosmos theme, larger card.
const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (n, c, d = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`FAIL  ${n} ${d}`); } };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const mk = async () => { const c = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' }); await sleep(700); return { c, p }; };
  const A = await mk(), B = await mk();
  await A.p.locator('#nick').fill('Chatty'); await A.p.locator('#btn-create').click(); await sleep(1300);
  const code = (await A.p.locator('#room-code').textContent()).trim();
  await B.p.locator('#nick').fill('Listener'); await B.p.locator('#join-code').fill(code); await B.p.locator('#btn-join').click(); await sleep(1100);

  console.log('== chat drawer ==');
  t('chat toggle visible', await A.p.locator('#chat-toggle').isVisible());
  await A.p.locator('#chat-toggle').click(); await sleep(400);
  t('drawer opens from left', await A.p.locator('#chat-drawer').evaluate(el => el.classList.contains('open')));
  await A.p.locator('#chat-input').fill('hello flock!'); await A.p.locator('#chat-send').click();
  await sleep(900);
  const aLog = await A.p.locator('#chat-log').textContent();
  t('sender sees own message', /hello flock!/.test(aLog), aLog);
  const bBadge = await B.p.locator('#chat-toggle').innerHTML();
  t('receiver gets unread badge', /badge/.test(bBadge), bBadge);
  await B.p.locator('#chat-toggle').click(); await sleep(500);
  const bLog = await B.p.locator('#chat-log').textContent();
  t('receiver sees message + nick', /Chatty/.test(bLog) && /hello flock!/.test(bLog), bLog);
  await A.p.locator('#chat-close').click(); await sleep(300);
  t('drawer closes', !(await A.p.locator('#chat-drawer').evaluate(el => el.classList.contains('open'))));

  console.log('== cosmos theme ==');
  // ensure all drawers closed before touching lobby controls
  for (const S of [A, B]) { await S.p.evaluate(() => { document.getElementById('chat-drawer')?.classList.remove('open'); document.getElementById('chat-backdrop')?.classList.remove('on'); }); }
  await sleep(300);
  await A.p.locator('#btn-theme').click(); await sleep(300);
  t('theme stepper shows Cosmos', /Cosmos/.test(await A.p.locator('#btn-theme').textContent()));
  await A.p.locator('#btn-start').click();
  // countdown then round
  for (let k = 0; k < 80; k++) { await sleep(400); const vis = await A.p.locator('#s-round').isVisible().catch(() => false); const pt = (await A.p.locator('#prompt-text').textContent().catch(() => '')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await A.p.locator('#answer').isEnabled().catch(() => false)) break; }
  t('body flagged cosmos theme', (await A.p.evaluate(() => document.body.dataset.theme)) === 'cosmos');
  t('earth sprite rendered', await A.p.locator('#fx-earth').count() === 1);
  await A.p.screenshot({ path: 'cosmos_round.png' });
  const prompt = (await A.p.locator('#prompt-text').textContent()).trim();
  const QUIZ = { 'Name a country.': 'Vanuatu', 'Name a chemical element.': 'Dubnium', 'Name a colour.': 'Cerise', 'Name an animal.': 'Saiga', 'Name a fruit.': 'Mangosteen', 'Name a sport.': 'Curling', 'Name a European capital city.': 'Vaduz', 'Name a currency.': 'Taka', 'Name a car brand.': 'Lancia', 'Name a dog breed.': 'Basenji', 'Name a pizza topping.': 'Truffle', 'Name a superhero.': 'Squirrel Girl', 'Name a Greek god or goddess.': 'Hebe', 'Name a board game or card game.': 'Root' };
  await A.p.locator('#answer').fill(QUIZ[prompt] ?? 'Peru'); await A.p.locator('#btn-send').click();
  await B.p.locator('#answer').fill('Blue'); await B.p.locator('#btn-send').click();
  for (let k = 0; k < 90; k++) { if (await A.p.locator('#s-reveal').isVisible().catch(() => false)) break; await sleep(400); }
  await sleep(3200);
  const ruler = await A.p.locator('.altitude-ruler').textContent();
  t('cosmos ruler uses flavor labels', /Interstellar|Jupiter|Mars/.test(ruler), ruler);
  const title = await A.p.locator('#reveal-title').textContent();
  t('cosmos reveal title', /breaks orbit/.test(title), title);
  await A.p.screenshot({ path: 'cosmos_reveal.png' });
  t('larger card class present in round screen', await A.p.locator('#s-round .card.big').count() === 1);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
