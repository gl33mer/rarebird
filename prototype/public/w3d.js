// RAREBIRD w3d layer — Track B "3D Ascent" (directive 06 Track B).
// three.js r152 (MIT, vendored) — procedural low-poly scenes, no external assets.
// Gated ?w3d=1 / localStorage rarebird-w3d=1. Fail-soft: any error → layer removed, Track A stands.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const W3D = {
  enabled: false,
  _three: null, _renderer: null, _scene: null, _camera: null, _flock: null,
  _boids: [], _target: null, _sat: [], _raf: 0, _theme: 'birds', _t: 0,

  async init(enabled) {
    this.enabled = !!enabled;
    if (!this.enabled) return false;
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = '/vendor/three.min.js?v=18';
        s.onload = res; s.onerror = () => rej(new Error('three load failed'));
        document.head.appendChild(s);
      });
      if (!window.THREE) throw new Error('no THREE');
      this._three = window.THREE;
      return true;
    } catch (e) {
      console.warn('[w3d] fail-soft:', e.message);
      this.enabled = false;
      return false;
    }
  },

  buildScene(themeId) {
    if (!this.enabled) return;
    this._theme = themeId;
    const T = this._three;
    if (!this._renderer) {
      this._renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      this._renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      this._renderer.setSize(innerWidth, innerHeight);
      const cv = this._renderer.domElement;
      cv.id = 'w3d-canvas';
      cv.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
      document.body.insertBefore(cv, document.getElementById('fx-sky')?.nextSibling || document.body.firstChild);
      addEventListener('resize', () => { this._renderer.setSize(innerWidth, innerHeight); this._camera.aspect = innerWidth / innerHeight; this._camera.updateProjectionMatrix(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) this._pause(); else this._resume(); });
    }
    // clear scene
    if (this._scene) this._scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this._scene = new T.Scene();
    this._camera = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
    this._camera.position.set(0, 0, 26);
    const flat = (geo, color, x, y, z, rx = 0) => {
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color, flatShading: true }));
      m.position.set(x, y, z); m.rotation.x = rx; this._scene.add(m); return m;
    };
    const light = new T.DirectionalLight(0xfff2d0, 1.1); light.position.set(6, 10, 8); this._scene.add(light);
    this._scene.add(new T.AmbientLight(0x33415e, 1.2));
    this._boids = []; this._sat = [];
    if (themeId === 'cosmos') {
      const planet = flat(new T.IcosahedronGeometry(7, 1), 0x6a5acd, -10, -12, -6);
      planet.rotation.z = 0.4;
      const ring = new T.Mesh(new T.TorusGeometry(11, 0.5, 8, 40), new T.MeshBasicMaterial({ color: 0xc9b8f0 }));
      ring.position.copy(planet.position); ring.rotation.x = Math.PI / 2.3; this._scene.add(ring);
      const moon = flat(new T.IcosahedronGeometry(1.6, 1), 0xa9b8d4, 13, 6, -4);
      this._moon = moon;
      const starGeo = new T.BufferGeometry();
      const pos = new Float32Array(900);
      for (let i = 0; i < 900; i += 3) { pos[i] = (Math.random() - 0.5) * 90; pos[i + 1] = (Math.random() - 0.5) * 60; pos[i + 2] = -20 - Math.random() * 40; }
      starGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
      this._scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xeef3f7, size: 0.18 })));
      for (let i = 0; i < 2; i++) {
        const sat = flat(new T.BoxGeometry(0.8, 0.5, 0.5), 0x8d99ae, 0, 0, -8);
        this._sat.push(sat);
      }
    } else {
      const hillC = [0x16213e, 0x101828, 0x0a0e1a];
      for (let i = 0; i < 3; i++) {
        const g = new T.PlaneGeometry(90, 14, 24, 1);
        const arr = g.attributes.position.array;
        for (let v = 0; v < arr.length; v += 3) arr[v + 1] += Math.sin(arr[v] * (0.3 + i * 0.15)) * (2.2 - i * 0.5);
        g.computeVertexNormals();
        const hill = new T.Mesh(g, new T.MeshStandardMaterial({ color: hillC[i], flatShading: true }));
        hill.position.set(0, -8 + i * 3.2, -i * 9);
        this._scene.add(hill);
      }
      const geo = new T.ConeGeometry(0.35, 1.1, 4);
      const mat = new T.MeshStandardMaterial({ color: 0x2b3a67, flatShading: true });
      this._flock = new T.InstancedMesh(geo, mat, 20);
      this._scene.add(this._flock);
      for (let i = 0; i < 20; i++) {
        this._boids.push({ x: (Math.random() - 0.5) * 16, y: 2 + Math.random() * 6, z: -6 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.02, s: 0.7 + Math.random() * 0.6 });
      }
      this._target = new T.Vector3(0, 4, -6);
    }
    document.body.classList.add('w3d');
    this._info = { meshes: this._scene.children.length, theme: themeId, animated: !reduced() };
    window.__w3dInfo = this._info;
    if (reduced()) { this._renderOnce(); this._raf = 0; }
    else this._resume();
  },

  setProgress(roundIndex, totalRounds) {
    if (!this.enabled) return;
    const t = totalRounds > 1 ? Math.min(1, roundIndex / (totalRounds - 1)) : 0;
    this._progress = t;
    if (this._camera) this._camY = -3 + t * 11;
  },

  _renderOnce() { if (this._renderer && this._scene) this._renderer.render(this._scene, this._camera); },
  _pause() { cancelAnimationFrame(this._raf); this._raf = 0; },
  _resume() {
    if (this._raf || !this._renderer) return;
    const loop = () => {
      this._raf = requestAnimationFrame(() => { this._tick(); loop(); });
    };
    this._raf = requestAnimationFrame(() => { this._tick(); loop(); });
  },
  _tick() {
    const T = this._three, t = (this._t += 0.016);
    if (this._camY !== undefined) this._camera.position.y += ((this._camY ?? 0) - this._camera.position.y) * 0.02;
    if (this._theme === 'cosmos') {
      if (this._moon) this._moon.position.x = 13 * Math.cos(t * 0.2), this._moon.position.y = 6 * Math.sin(t * 0.2);
      this._sat.forEach((s, i) => { const a = t * (0.3 + i * 0.15) + i * 3; s.position.set(Math.cos(a) * 16, Math.sin(a) * 9, -8); s.rotation.y = a; });
    } else if (this._flock) {
      // minimal boids: cohesion toward a wandering target + separation-lite
      this._target.x = Math.sin(t * 0.3) * 8; this._target.y = 3 + Math.sin(t * 0.17) * 3 + (this._progress ?? 0) * 4;
      // hoisted temps: zero per-frame allocation (GC was capping fps at ~38)
      const m = this._tmpM ??= new T.Matrix4(), q = this._tmpQ ??= new T.Quaternion();
      const up = this._tmpUp ??= new T.Vector3(0, 1, 0), v3 = this._tmpV ??= new T.Vector3(), pos = this._tmpP ??= new T.Vector3(), scl = this._tmpS ??= new T.Vector3();
      this._boids.forEach((b, i) => {
        b.vx += ((this._target.x - b.x) * 0.0006 + (Math.random() - 0.5) * 0.004);
        b.vy += ((this._target.y - b.y) * 0.0006 + (Math.random() - 0.5) * 0.003);
        b.vx = Math.max(-0.05, Math.min(0.05, b.vx)); b.vy = Math.max(-0.04, Math.min(0.04, b.vy));
        b.x += b.vx; b.y += b.vy;
        q.setFromUnitVectors(up, v3.set(b.vx, b.vy + 0.05, 0).normalize());
        m.compose(pos.set(b.x, b.y, b.z), q, scl.set(b.s, b.s, b.s));
        this._flock.setMatrixAt(i, m);
      });
      this._flock.instanceMatrix.needsUpdate = true;
    }
    this._renderer.render(this._scene, this._camera);
  },

  disable() { // live teardown (playtest fix 3: no page reloads)
    this.enabled = false;
    this._pause();
    document.getElementById('w3d-canvas')?.remove();
    document.body.classList.remove('w3d');
    if (this._scene) this._scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this._scene = null; this._renderer = null; this._three = null; window.__w3dInfo = null;
  },

  info() {
    return this._renderer ? { ...this._info, running: this._raf > 0 || reduced() } : null;
  },
};
