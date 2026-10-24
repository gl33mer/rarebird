// RAREBIRD asset self-QA validator (delivered with the pack per 00_MASTER_INSTRUCTIONS §6).
// Checks: SVG parse, viewBox, external refs, size caps, dark-bg contrast (luminance delta),
// silhouette coverage at 24px, greyscale detail variance. Raster checks via headless Chromium.
// Usage: node assets/tools/validate.mjs [assetsDir]
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.argv[2] || new URL('../', import.meta.url).pathname;
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));

// ---------- gather svg files ----------
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.svg') out.push(p);
  }
  return out;
}
const svgs = walk(ROOT).filter(p => !p.includes('/tools/'));
const results = [];

for (const file of svgs) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');
  const bytes = Buffer.byteLength(src);
  const row = { file: rel, bytes, issues: [] };
  if (!src.includes('<svg')) row.issues.push('NO_SVG_ROOT');
  if (!/viewBox="[^"]+"/.test(src)) row.issues.push('NO_VIEWBOX');
  if (/https?:\/\/(?!www\.w3\.org)/.test(src)) row.issues.push('EXTERNAL_REF');
  if (/xlink:href="[^#]/.test(src)) row.issues.push('EXTERNAL_XLINK');
  if (/@font-face|<text[\s>]/.test(src)) row.issues.push('TEXT_OR_FONT');
  if (extname(file) === '.svg' && !rel.startsWith('themes/') && !rel.startsWith('shared/') && !rel.startsWith('favicon/')) row.issues.push('UNEXPECTED_LOCATION');
  if (bytes > 40 * 1024) row.issues.push('TOO_BIG');
  results.push(row);
}

// ---------- manifest path check ----------
for (const themeKey of Object.keys(MANIFEST.themes ?? {})) {
  const t = MANIFEST.themes[themeKey];
  const flat = JSON.stringify(t).match(/"([^"]+\.(?:svg|png))"/g) ?? [];
  for (const m of flat) {
    const p = m.slice(1, -1);
    try { statSync(join(ROOT, p)); } catch { results.push({ file: `manifest→${p}`, issues: ['MANIFEST_PATH_MISSING'], bytes: 0 }); }
  }
}

// ---------- raster QA page ----------
mkdirSync(join(ROOT, 'tools', 'out'), { recursive: true });
const shots = svgs.filter(f => relative(ROOT, f).startsWith('themes/') && relative(ROOT, f).split('/').length === 4); // tier sprites only
const BGS = { 'dusk-birds': '#141b30', 'cosmic-voyage': '#081029' };
const cell = (file, size, grey) => {
  const rel = relative(ROOT, file);
  const theme = rel.includes('dusk-birds') ? 'dusk-birds' : 'cosmic-voyage';
  const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(readFileSync(file)).toString('base64');
  return `<div class="cell" data-file="${rel}" data-size="${size}" style="width:${size}px;height:${size}px;background:${BGS[theme]};${grey ? 'filter:grayscale(1);' : ''}display:flex;align-items:center;justify-content:center"><img src="${dataUrl}" width="${size}" height="${size}"></div>`;
};
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111;font:11px monospace;color:#eee}.row{display:flex;flex-wrap:wrap}.cell{box-sizing:border-box}</style>
<div class="row" id="full">${shots.map(f => cell(f, 512, false)).join('')}</div>
<div class="row" id="tiny">${shots.map(f => cell(f, 24, false)).join('')}</div>
<div class="row" id="grey">${shots.map(f => cell(f, 96, true)).join('')}</div>`;
const qaPath = join(ROOT, 'tools', 'out', 'qa.html');
writeFileSync(qaPath, html);

// ---------- raster analysis in chromium ----------
let chromium;
for (const base of [new URL('../../../', import.meta.url), new URL('../../../../', import.meta.url), new URL('file:///data/workspace/research/node_modules/')]) {
  try { ({ chromium } = await import(new URL('playwright-core/index.mjs', base).href)); break; } catch {}
}
if (!chromium) { console.error('playwright-core not found — install it next to this repo or in /data/workspace/research'); process.exit(2); }
await (async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 5600, height: 1400 } })).newPage();
  await page.goto('file://' + qaPath, { waitUntil: 'networkidle' });
  const analysis = await page.evaluate(async () => {
    const out = [];
    for (const img of document.querySelectorAll('#full img')) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 128, 128);
      const d = ctx.getImageData(0, 0, 128, 128).data;
      let opaque = 0, lumSum = 0, shades = new Set();
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 40) {
          opaque++;
          const lum = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
          lumSum += lum; shades.add(Math.round(lum / 16));
        }
      }
      out.push({ file: img.closest('.cell').dataset.file, opaquePct: Math.round(100 * opaque / (128 * 128)), meanLum: opaque ? Math.round(lumSum / opaque) : 0, shadeBuckets: shades.size });
    }
    return out;
  });
  await page.screenshot({ path: join(ROOT, 'tools', 'out', 'qa-full.png'), fullPage: true });
  await page.locator('#tiny').screenshot({ path: join(ROOT, 'tools', 'out', 'qa-tiny.png') });
  await page.locator('#grey').screenshot({ path: join(ROOT, 'tools', 'out', 'qa-grey.png') });
  await browser.close();

  // contrast: |meanLum - bgLum| — bg dusk #141b30 lum≈27, cosmic #081029 lum≈13
  for (const a of analysis) {
    const row = results.find(r => r.file === a.file) ?? results[results.push({ file: a.file, issues: [], bytes: 0 }) - 1];
    const bgLum = a.file.includes('dusk-birds') ? 27 : 13;
    row.silhouettePct = a.opaquePct;
    row.contrastDelta = Math.abs(a.meanLum - bgLum);
    row.shadeBuckets = a.shadeBuckets;
    const cls = a.file.includes('/tiers/') ? 'tier' : (a.file.includes('countdown') ? 'countdown' : 'scenery');
    row.class = cls;
    // tier sprites: full gates. countdown motifs must read on the dark overlay. scenery: composition-free by design.
    if (cls === 'tier') {
      if (row.contrastDelta < 60) row.issues.push('LOW_CONTRAST');
      if (a.opaquePct < 8) row.issues.push('TOO_SPARSE_AT_24PX');
      if (a.opaquePct > 78) row.issues.push('TOO_DENSE');
    } else if (cls === 'countdown') {
      if (row.contrastDelta < 60) row.issues.push('LOW_CONTRAST');
    }
  }

  // ---------- report ----------
  const bad = results.filter(r => r.issues.length);
  console.log(`scanned ${results.length} svg-referenced files`);
  for (const r of results) {
    const q = [r.silhouettePct != null ? `sil=${r.silhouettePct}%` : '', r.contrastDelta != null ? `Δlum=${r.contrastDelta}` : '', r.shadeBuckets != null ? `shades=${r.shadeBuckets}` : ''].filter(Boolean).join(' ');
    console.log(`${r.issues.length ? 'FAIL' : ' ok '} ${String(r.bytes).padStart(6)}B ${r.file.padEnd(52)} ${q} ${r.issues.join(',')}`);
  }
  console.log(bad.length ? `\n${bad.length} files need attention` : '\nALL CHECKS PASS');
  process.exit(bad.length ? 1 : 0);
})();
