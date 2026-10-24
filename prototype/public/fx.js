// RAREBIRD fx layer — declarative, dependency-free animation module.
// Principles (keep these when extending; production swaps sprites/Lottie in at
// the same call sites — see 05_UI_UX_SPEC.md §"Graphics & animation layer"):
//   1. animate ONLY transform + opacity (GPU-composited, no layout thrash)
//   2. every spawn is capped and self-cleaning (no DOM leaks)
//   3. prefers-reduced-motion collapses to simple fades
//   4. tier visuals come from one table (TIER_LADDER) so art can restyle globally
export const TIER_LADDER = {
  'NO SIGHTING': { alt: 0.03, color: '#8d99ae', emoji: '🫥', hue: 0 },
  'PIGEON':      { alt: 0.10, color: '#8d99ae', emoji: '🕊️', hue: 0 },
  'SPARROW':     { alt: 0.26, color: '#a4b787', emoji: '🐦', hue: 40 },
  'STARLING':    { alt: 0.46, color: '#6fc3df', emoji: '✨', hue: 160 },
  'KINGFISHER':  { alt: 0.66, color: '#43d8b0', emoji: '🦅', hue: 120 },
  'MEGA':        { alt: 0.84, color: '#ffc53d', emoji: '🦉', hue: 0 },
  'RARE BIRD':   { alt: 0.97, color: '#ff5d8f', emoji: '🦜', hue: 300 },
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reducedMotion = () => reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- ambient themes
// Two procedural themes sharing one contract. Cosmic Voyage = the "fly as far
// from Earth as possible" metaphor: rarity = distance; the Earth sprite shrinks
// as the game progresses (round distance grows). Seeded PRNG per room.
export function seededRand(seed) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; };
}

let ambientKind = null;
export function ambient(kind = 'birds', seed = 'rarebird') { buildAmbient(kind, seed); }
export function setTheme(kind, seed) { buildAmbient(kind, seed); }

function buildAmbient(kind, seed) {
  ambientKind = kind;
  let sky = document.getElementById('fx-sky');
  if (sky) sky.remove();
  sky = document.createElement('div');
  sky.id = 'fx-sky';
  const rnd = seededRand(seed);
  if (kind === 'cosmos') {
    sky.innerHTML = `
      <div class="fx-band" style="background:linear-gradient(#020208,#050520);top:0;height:45%"></div>
      <div class="fx-band" style="background:linear-gradient(#050520,#0a1030);top:45%;height:35%"></div>
      <div class="fx-band" style="background:linear-gradient(#0a1030,#101a3f);top:80%;height:20%"></div>
      <div class="fx-nebula n1"></div><div class="fx-nebula n2"></div>
      <div class="fx-stars"></div>
      <div class="fx-earth" id="fx-earth">🌍</div>`;
  } else {
    sky.innerHTML = `
      <div class="fx-band" style="background:linear-gradient(#05070f,#0b1020);top:0;height:18%"></div>
      <div class="fx-band" style="background:linear-gradient(#0b1020,#16213e);top:18%;height:22%"></div>
      <div class="fx-band" style="background:linear-gradient(#16213e,#22355f);top:40%;height:24%"></div>
      <div class="fx-band" style="background:linear-gradient(#22355f,#2b3a67);top:64%;height:20%"></div>
      <div class="fx-band" style="background:linear-gradient(#2b3a67,#1a2338);top:84%;height:16%"></div>
      <div class="fx-stars"></div>
      <div class="fx-cloud c1">☁️</div><div class="fx-cloud c2">☁️</div><div class="fx-cloud c3">☁️</div>
      <div class="fx-flock">v</div>`;
  }
  // seeded starfield (deterministic per room seed)
  const field = document.createElement('div');
  field.className = 'fx-stars2';
  for (let i = 0; i < 70; i++) {
    const st = document.createElement('i');
    st.style.left = (rnd() * 100).toFixed(1) + '%';
    st.style.top = (rnd() * 100).toFixed(1) + '%';
    st.style.opacity = (0.25 + rnd() * 0.7).toFixed(2);
    st.style.animationDelay = (rnd() * 6).toFixed(1) + 's';
    st.style.transform = `scale(${(0.5 + rnd() * 1.4).toFixed(2)})`;
    field.appendChild(st);
  }
  sky.appendChild(field);
  document.body.prepend(sky);
  if (reducedMotion()) for (const el of sky.querySelectorAll('.fx-cloud,.fx-flock,.fx-stars,.fx-stars2,.fx-nebula,.fx-earth')) el.style.animation = 'none';
}

// cosmic: Earth shrinks as rounds advance (we fly farther away)
export function setProgress(roundIndex, totalRounds) {
  const earth = document.getElementById('fx-earth');
  if (!earth) return;
  const t = totalRounds > 1 ? roundIndex / (totalRounds - 1) : 0;
  const img = earth.querySelector('img');
  if (img) {
    const px = Math.max(26, 96 - t * 70);
    img.style.width = px + 'px'; img.style.height = px + 'px';
  } else {
    earth.style.fontSize = `${Math.max(18, 64 - t * 46)}px`;
  }
  earth.style.opacity = String(Math.max(0.25, 1 - t * 0.7));
}

// ---------------------------------------------------------------- ascent (the marquee move)
// Fly an answer chip from the bottom of its container to its tier altitude.
export function ascend(el, tierName, { container, delay = 0 } = {}) {
  const t = TIER_LADDER[tierName] ?? TIER_LADDER['NO SIGHTING'];
  el.style.opacity = '0';
  const h = container ? container.clientHeight : innerHeight;
  const targetY = -(h * (1 - t.alt) - h * 0.08); // from bottom lane up to band
  if (reducedMotion()) {
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = `translateY(${targetY * 0.15}px)`; }, delay);
    return;
  }
  el.animate([
    { transform: 'translateY(0) translateX(0)', opacity: 0 },
    { transform: `translateY(${targetY * 0.3}px) translateX(6px)`, opacity: 1, offset: .35 },
    { transform: `translateY(${targetY}px) translateX(0)`, opacity: 1 },
  ], { duration: 900, delay, easing: 'cubic-bezier(.22,.9,.28,1)', fill: 'forwards' });
}

// ---------------------------------------------------------------- bursts
const POOL_MAX = 60; let live = 0;
export function burst(x, y, { tier = 'STARLING', count = 10 } = {}) {
  if (reducedMotion()) return;
  const t = TIER_LADDER[tier];
  for (let i = 0; i < count && live < POOL_MAX; i++) {
    live++;
    const p = document.createElement('div');
    p.className = 'fx-particle';
    if (opts.sprite) { // art mode: sprite particle, tier-tinted via filter
      p.style.backgroundImage = `url("${opts.sprite}")`;
      p.style.backgroundSize = 'contain'; p.style.backgroundRepeat = 'no-repeat';
      p.style.width = '18px'; p.style.height = '18px';
      p.style.filter = `hue-rotate(${t.hue ?? 0}deg) saturate(1.15)`;
    } else {
      p.textContent = i % 3 === 0 ? t.emoji : '·';
    }
    p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.color = t.color;
    document.body.appendChild(p);
    const a = (Math.PI / 2) * (0.2 + Math.random() * 0.6) + (Math.random() - 0.5); // mostly upward
    const v = 60 + Math.random() * 120;
    const dx = Math.cos(a) * v * (Math.random() < .5 ? -1 : 1), dy = -Math.sin(a) * v;
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 400, easing: 'ease-out' }).onfinish = () => { p.remove(); live--; };
  }
}

// ---------------------------------------------------------------- countdown
// Big 3-2-1 with a forming flock; returns a handle to stop early.
export function countdown(el, seconds = 3) {
  let n = Math.ceil(seconds), stop = false;
  const step = () => {
    if (stop) return;
    el.textContent = String(n);
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    if (n <= 0) { el.textContent = '🛫'; return; }
    n--; setTimeout(step, 1000);
  };
  step();
  return { cancel: () => { stop = true; } };
}

// ---------------------------------------------------------------- screen shake (rare bird landings)
export function shake(el, { strength = 4 } = {}) {
  if (reducedMotion()) return;
  el.animate([
    { transform: 'translateX(0)' }, { transform: `translateX(-${strength}px)` },
    { transform: `translateX(${strength}px)` }, { transform: 'translateX(0)' },
  ], { duration: 220, iterations: 2 });
}
