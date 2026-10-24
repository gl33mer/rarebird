// RAREBIRD bold layer — "The Ascent" (ART_VISION.md Phase C).
// Parallax climb-ruler world, ambient life, flight-path reveals, grain dressing.
// Gated by ?bold=1 / localStorage rarebird-bold=1. Fail-soft: null URLs and missing
// nodes are skipped; with bold off the client is byte-identical in behavior.
import { ART } from './art.js?v=14';

const V = new URL(import.meta.url).searchParams.get('v') || '0';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let live = 0; const POOL_MAX = 30;

export const BOLD = {
  enabled: false,

  init(enabled) {
    this.enabled = !!enabled;
    if (!this.enabled) return false;
    if (!ART.enabled) { this.enabled = false; return false; } // bold builds on the art pack
    document.body.classList.add('bold');
    this.buildGrain();
    return true;
  },

  // ---- the climb ruler: camera + painted altitude bands ----
  setProgress(roundIndex, totalRounds) {
    if (!this.enabled) return;
    const t = totalRounds > 1 ? Math.min(1, roundIndex / (totalRounds - 1)) : 0;
    document.body.style.setProperty('--progress', t.toFixed(3));
    document.body.style.setProperty('--dusk', (0.35 + t * 0.4).toFixed(3)); // sky deepens as we climb
  },

  buildParallax(themeId) {
    if (!this.enabled) return;
    document.querySelectorAll('.bold-layer, .bold-band, .bold-particle').forEach(n => n.remove());
    if (live) { live = 0; }
    const sky = document.getElementById('fx-sky');
    if (!sky) return;
    const u = rel => ART.url(rel);
    const layers = themeId === 'cosmos'
      ? [
          { src: u('themes/cosmic-voyage/ambient/nebula-1.svg'), depth: 0.25, top: '-4%', h: '46%', op: 0.55 },
          { src: u('themes/cosmic-voyage/ambient/planet-surface.svg'), depth: 0.85, top: 'auto', h: '15%', op: 1 },
          { src: u('themes/cosmic-voyage/ambient/starfield-tile.svg'), depth: 0.5, top: 0, h: '100%', op: 0.9, tile: true },
        ]
      : [
          { src: u('themes/dusk-birds/ambient/hills-far.svg'), depth: 0.55, top: 'auto', h: '19%', op: 1 },
          { src: u('themes/dusk-birds/ambient/hills-near.svg'), depth: 0.9, top: 'auto', h: '13%', op: 1 },
          { src: u('themes/dusk-birds/ambient/tree-line.svg'), depth: 0.7, top: 'auto', h: '9%', op: 1 },
        ];
    layers.forEach(L => {
      if (!L.src) return;
      const img = document.createElement('img');
      img.className = 'bold-layer';
      img.src = L.src; img.alt = '';
      img.style.opacity = String(L.op);
      if (L.tile) img.style.cssText += 'width:100%;height:100%;object-fit:cover;';
      else {
        img.style.cssText += `left:0;right:0;width:100%;${L.top === 'auto' ? `bottom:0;height:${L.h};object-fit:fill;` : `top:${L.top};height:${L.h};object-fit:cover;`}`;
        img.style.animation = `boldDrift${Math.ceil(L.depth * 3)} ${(46 - L.depth * 22).toFixed(0)}s ease-in-out infinite alternate`;
      }
      img.style.setProperty('--depth', L.depth);
      sky.appendChild(img);
    });
    // painted altitude bands (the climb ruler made visible): 6 zones with edge labels
    const bands = themeId === 'cosmos'
      ? ['SURFACE', 'SKY', 'HIGH ORBIT', 'MOON LANE', 'OUTER', 'DEEP STARS']
      : ['LOW PERCHES', 'OPEN SKY', 'HIGH THERMALS', 'TREETOP CLOUDS', 'STRATOSPHERE', 'STARS'];
    bands.forEach((label, i) => {
      const zone = document.createElement('div');
      zone.className = 'bold-band';
      zone.style.bottom = `${(i / 6) * 100}%`;
      zone.innerHTML = `<i></i><span>${label}</span><i></i>`;
      sky.appendChild(zone);
    });
    if (!reduced()) this.ambientLoop(themeId);
  },

  // ---- ambient life: pooled, capped, theme-flavored ----
  ambientLoop(themeId) {
    const spawn = () => {
      if (!this.enabled || live >= POOL_MAX || document.hidden) return;
      live++;
      const p = document.createElement('div');
      p.className = 'bold-particle';
      if (themeId === 'cosmos') {
        const comet = Math.random() < 0.12;
        p.style.cssText = comet
          ? 'width:70px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#cfe6ff);'
          : 'width:3px;height:3px;border-radius:50%;background:#dcebf5;';
        const dur = comet ? 2600 : 5000 + Math.random() * 7000;
        p.style.left = comet ? '-80px' : `${Math.random() * 96}%`;
        p.style.top = `${8 + Math.random() * 78}%`;
        p.animate(comet
          ? [{ transform: 'translate(0,0) rotate(-14deg)', opacity: 0.9 }, { transform: 'translate(560px,180px) rotate(-14deg)', opacity: 0 }]
          : [{ transform: 'translateY(0)', opacity: 0.15 + Math.random() * 0.5 }, { transform: `translateY(${comet ? 0 : -14 - Math.random() * 20}px)`, opacity: 0.05 }],
          { duration: dur, easing: comet ? 'linear' : 'ease-in-out' }).onfinish = () => { p.remove(); live--; };
      } else {
        // firefly: warm drifting dot with a soft pulse
        p.style.cssText = `width:5px;height:5px;border-radius:50%;background:#ffd166;box-shadow:0 0 8px 2px rgba(255,209,102,.5);left:${Math.random() * 92}%;top:${42 + Math.random() * 48}%;`;
        const drift = 30 + Math.random() * 60, rise = 20 + Math.random() * 40;
        p.animate([
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${drift}px,${-rise}px)`, opacity: 0.85, offset: 0.4 },
          { transform: `translate(${drift * 2}px,${-rise * 2}px)`, opacity: 0 },
        ], { duration: 9000 + Math.random() * 8000, easing: 'ease-in-out' }).onfinish = () => { p.remove(); live--; };
      }
      document.getElementById('fx-sky')?.appendChild(p);
    };
    for (let i = 0; i < 10; i++) setTimeout(spawn, i * 900);
    clearInterval(this._spawner);
    this._spawner = setInterval(() => { if (!reduced()) spawn(); }, 1400);
  },

  // ---- reveal flight: curved two-easing arc + RARE BIRD hero moment ----
  flyIn(rowEl, tier, delayMs) {
    if (!this.enabled || reduced()) return false;
    const rare = tier === 'RARE BIRD';
    rowEl.classList.add('bold-fly');
    if (rare) {
      rowEl.classList.add('bold-hero');
      const tint = document.createElement('div');
      tint.className = 'bold-heroTint';
      document.body.appendChild(tint);
      setTimeout(() => tint.remove(), 420);
    }
    return true;
  },

  // ---- dusk grain: tiny runtime-generated noise tile, one overlay div ----
  buildGrain() {
    if (document.getElementById('bold-grain')) return;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const d = ctx.createImageData(64, 64);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 10;
    }
    ctx.putImageData(d, 0, 0);
    const g = document.createElement('div');
    g.id = 'bold-grain';
    g.style.backgroundImage = `url(${c.toDataURL()})`;
    document.body.appendChild(g);
  },
};
