const { chromium } = require('playwright-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await p.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' }); await sleep(700);
  await p.locator('#nick').fill('Shooter');
  await p.locator('#btn-create').click(); await sleep(1200);
  // join two bots to make a 3-row reveal at different tiers
  const b2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await b2.newPage();
  await p2.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' }); await sleep(600);
  const code = (await p.locator('#room-code').textContent()).trim();
  await p2.locator('#nick').fill('Wingman'); await p2.locator('#join-code').fill(code); await p2.locator('#btn-join').click(); await sleep(900);
  const b3 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p3 = await b3.newPage();
  await p3.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' }); await sleep(600);
  await p3.locator('#nick').fill('Skyqueen'); await p3.locator('#join-code').fill(code); await p3.locator('#btn-join').click(); await sleep(900);
  await p.locator('#btn-start').click();
  for (let k = 0; k < 80; k++) { await sleep(400); const vis = await p.locator('#s-round').isVisible().catch(()=>false); const pt = (await p.locator('#prompt-text').textContent().catch(()=>'')).trim(); if (vis && pt.length > 6 && !pt.includes('…') && await p.locator('#answer').isEnabled().catch(()=>false)) break; }
  const QUIZ = { 'Name a country.': ['Vanuatu','United States','Saint Kitts and Nevis'], 'Name a chemical element.': ['Dubnium','Gold','Iron'], 'Name a colour.': ['Cerise','Blue','Mauve'], 'Name an animal.': ['Saiga','Dog','Okapi'], 'Name a fruit.': ['Mangosteen','Apple','Persimmon'], 'Name a sport.': ['Curling','Tennis','Fencing'], 'Name a European capital city.': ['Vaduz','Paris','Tallinn'] };
  const pt = (await p.locator('#prompt-text').textContent()).trim();
  const ans = QUIZ[pt] || ['Vanuatu','United States','Peru'];
  await p.locator('#answer').fill(ans[0]); await p.locator('#btn-send').click(); await sleep(300);
  await p2.locator('#answer').fill(ans[1]); await p2.locator('#btn-send').click(); await sleep(300);
  await p3.locator('#answer').fill(ans[2]); await p3.locator('#btn-send').click();
  for (let k = 0; k < 90; k++) { if (await p.locator('#s-reveal').isVisible().catch(()=>false)) break; await sleep(400); }
  await sleep(4500); // let all rows settle at their altitudes
  await p.screenshot({ path: 'gfx_reveal2.png' });
  console.log('prompt:', pt, '| answers:', ans.join(', '));
  await b.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
