// RAREBIRD graphics-depth layer (GD) — Track A "Living Scene".
// Scene actors, phase-reactive world, reveal spectacle, podium place, synth ambience.
// Depends on the art pack (injected ART) and the bold layer being on; fail-soft everywhere.
const V = new URL(import.meta.url).searchParams.get('v') || '0';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const GD = {
  enabled: false,
  _art: null,
  _audio: null,

  init(enabled, art) {
    this.enabled = !!enabled && !!art?.enabled;
    this._art = art;
    if (!this.enabled) return false;
    const css = document.createElement('style');
    css.textContent = `
      body.bold .gd-actor { position:absolute; pointer-events:none; will-change:transform,opacity; }
      body.bold .gd-balloon { left:8%; width:64px; animation: gdFloat 14s ease-in-out infinite alternate; }
      body.bold .gd-lighthouse { right:6%; bottom:11%; width:46px; opacity:.9; }
      body.bold .gd-beam { position:absolute; right:10%; bottom:22%; width:130px; height:5px; border-radius:3px;
        background:linear-gradient(90deg, rgba(255,209,102,.55), transparent); transform-origin:right center;
        animation: gdSweep 7s ease-in-out infinite alternate; }
      @keyframes gdSweep { from { transform:rotate(-16deg);} to { transform:rotate(14deg);} }
      @keyframes gdFloat { from { transform:translateY(0) rotate(-2deg);} to { transform:translateY(-26px) rotate(2deg);} }
      body.bold .gd-iss { top:14%; left:-180px; width:110px; opacity:.85; }
      body.bold .gd-iss.transit { animation: gdTransit 16s linear forwards; }
      @keyframes gdTransit { from { transform:translateX(0);} to { transform:translateX(620px);} }
      body.bold .gd-planetx { right:-70px; width:150px; opacity:.85; transition: bottom 2s, width 2s; }
      body.bold #gd-endtint { position:fixed; inset:0; z-index:34; pointer-events:none; opacity:.85; transition: opacity 1.2s; display:none; }
      body.bold.endgame #gd-endtint { display:block; }
      body.bold.phase-writing .bold-particle { animation-duration: inherit; }
      body.bold #gd-shaft { position:fixed; z-index:37; pointer-events:none; top:0; width:220px; margin-left:-110px;
        background:linear-gradient(180deg, rgba(255,93,143,.5), rgba(255,93,143,.06) 75%, transparent);
        animation: gdShaft .6s ease-out both; }
      @keyframes gdShaft { from { opacity:0; transform:scaleY(.4);} to { opacity:1; transform:scaleY(1);} }
      body.bold .bold-band.pulse span { color:#FFD166; text-shadow:0 0 12px rgba(255,209,102,.7); transition: all .3s; }
      body.bold.podium #gd-endtint { opacity:.5; }
      body.bold.podium .perch { animation: gdBob 3s ease-in-out infinite alternate; }
      @keyframes gdBob { from { transform:translateY(0);} to { transform:translateY(-6px);} }
      @media (prefers-reduced-motion: reduce) {
        body.bold .gd-actor, body.bold .gd-beam { animation:none !important; }
        body.bold #gd-shaft { display:none !important; }
      }`;
    document.head.appendChild(css);
    const tint = document.createElement('div');
    tint.id = 'gd-endtint';
    document.body.appendChild(tint);
    return true;
  },

  setPhase(phase, isLastRound) {
    if (!this.enabled) return;
    document.body.classList.toggle('phase-writing', phase === 'writing');
    document.body.classList.toggle('endgame', phase === 'writing' && !!isLastRound);
    document.body.classList.toggle('podium', phase === 'results');
    const tint = document.getElementById('gd-endtint');
    if (tint) tint.style.background = this._art?.currentTheme() === 'cosmos'
      ? 'linear-gradient(180deg, rgba(122,77,255,.14), rgba(2,2,8,.55))'
      : 'linear-gradient(180deg, rgba(90,60,140,.16), rgba(5,7,15,.6))';
  },

  buildActors(themeId) {
    if (!this.enabled) return;
    const sky = document.getElementById('fx-sky');
    if (!sky) return;
    sky.querySelectorAll('.gd-actor, .gd-beam').forEach(n => n.remove());
    const u = rel => this._art.url(rel);
    if (themeId === 'cosmos') {
      const iss = document.createElement('img');
      iss.className = 'gd-actor gd-iss'; iss.src = u('themes/cosmic-voyage/ambient/actors/iss.svg'); iss.alt = '';
      sky.appendChild(iss);
      setTimeout(() => iss.classList.add('transit'), 1500);
      const px = document.createElement('img');
      px.className = 'gd-actor gd-planetx'; px.src = u('themes/cosmic-voyage/ambient/actors/planet-x.svg'); px.alt = '';
      px.style.bottom = '-160px';
      sky.appendChild(px);
      setTimeout(() => { px.style.bottom = '6%'; }, 400);
    } else {
      const balloon = document.createElement('img');
      balloon.className = 'gd-actor gd-balloon'; balloon.src = u('themes/dusk-birds/ambient/actors/balloon.svg'); balloon.alt = '';
      balloon.style.top = '30%';
      sky.appendChild(balloon);
      const lh = document.createElement('img');
      lh.className = 'gd-actor gd-lighthouse'; lh.src = u('themes/dusk-birds/ambient/actors/lighthouse.svg'); lh.alt = '';
      sky.appendChild(lh);
      const beam = document.createElement('div');
      beam.className = 'gd-beam';
      sky.appendChild(beam);
    }
  },

  revealSpectacle(tier, rowEl) {
    if (!this.enabled || reduced() || !rowEl) return;
    if (tier === 'RARE BIRD') {
      const r = rowEl.getBoundingClientRect();
      const shaft = document.createElement('div');
      shaft.id = 'gd-shaft';
      shaft.style.left = (r.left + r.width / 2) + 'px';
      shaft.style.height = (r.top + r.height) + 'px';
      document.body.appendChild(shaft);
      setTimeout(() => shaft.remove(), 700);
      const idx = Math.min(5, Math.floor((1 - (r.top + r.height / 2) / innerHeight) * 6));
      const band = document.querySelectorAll('.bold-band')[Math.max(0, Math.min(5, idx))];
      if (band) { band.classList.add('pulse'); setTimeout(() => band.classList.remove('pulse'), 1600); }
      this.stinger('rare');
    } else if (tier === 'PIGEON') {
      const r = rowEl.getBoundingClientRect();
      this._art && 0;
      import('./fx.js?v=17').then(FX => FX.burst(r.left + r.width / 2, Math.min(innerHeight - 20, r.bottom + 6), { tier: 'PIGEON', count: 3 }));
    } else if (tier === 'MEGA' || tier === 'KINGFISHER') {
      this.stinger('mid');
    }
  },

  podiumScene() {
    if (!this.enabled) return;
    this.setPhase('results');
    const sky = document.getElementById('fx-sky');
    if (sky && !reduced()) {
      for (let i = 0; i < 3; i++) setTimeout(() => {
        import('./fx.js?v=17').then(FX => FX.burst(80 + Math.random() * (innerWidth - 160), 120 + Math.random() * 200, { tier: i === 0 ? 'RARE BIRD' : 'MEGA', count: 8 }));
      }, i * 500);
    }
  },

  // ---- synth ambience: no assets, gesture-gated, mute-respecting ----
  ambience(enabled, isMuted, themeId) {
    if (enabled) {
      this._audio ??= this._makeAudio();
      this._audio.setTheme(themeId, isMuted);
      this._audio.start();
    } else this._audio?.stop();
  },
  setMuted(m) { this._audio?.setMuted(m); },
  stinger(kind) {
    if (!this._audio?.running) return;
    this._audio.stinger(kind);
  },
  _makeAudio() {
    let ctx = null, master = null, nodes = [], running = false, muted = false, theme = 'birds';
    const ensure = () => {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.12; master.connect(ctx.destination);
    };
    const noiseBuffer = () => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    };
    return {
      get running() { return running; },
      setTheme(t, m) { theme = t; muted = m; if (master) master.gain.value = m ? 0 : 0.12; },
      setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.12; },
      start() {
        ensure(); if (running) return; running = true;
        ctx.resume();
        const drone = ctx.createOscillator();
        drone.type = 'sine'; drone.frequency.value = theme === 'cosmos' ? 82 : 110;
        const dg = ctx.createGain(); dg.gain.value = 0.5;
        drone.connect(dg).connect(master); drone.start(); nodes.push(drone);
        if (theme === 'cosmos') {
          const s2 = ctx.createOscillator(); s2.type = 'sine'; s2.frequency.value = 82.7;
          const g2 = ctx.createGain(); g2.gain.value = 0.3;
          s2.connect(g2).connect(master); s2.start(); nodes.push(s2);
        }
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
        const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = theme === 'cosmos' ? 900 : 500;
        const ng = ctx.createGain(); ng.gain.value = theme === 'cosmos' ? 0.05 : 0.09;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
        const lg = ctx.createGain(); lg.gain.value = 200;
        lfo.connect(lg).connect(filt.frequency); lfo.start();
        src.connect(filt).connect(ng).connect(master); src.start();
        nodes.push(src, lfo);
      },
      stop() {
        running = false;
        nodes.forEach(n => { try { n.stop(); } catch {} }); nodes = [];
        if (ctx) ctx.suspend();
      },
      stinger(kind) {
        if (!running || muted) return;
        const notes = kind === 'rare' ? [660, 880, 1320] : kind === 'mid' ? [520, 700] : [180];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.09);
          g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.09 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.5);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + i * 0.09); o.stop(ctx.currentTime + i * 0.09 + 0.55);
        });
      },
    };
  },
};
