# Flash run 2026-10-24 — art integration + QA

## What I did
- Branch `flash/art-qa-v1`. Symlinked `prototype/public/assets -> ../../assets` so the client can GET the art pack (no server-logic change; git-friendly).
- New `prototype/public/art.js`: manifest loader (`ART.init/tier/tierExtra/flavor/ambient/countdownArt/podiumArt/burstArt/icon/chip/emptyPerch/loadingBird/ogCover`), fail-soft (any failure → null + emoji fallback), cache-busted `?v=<V>`.
- `prototype/public/index.html` wiring (all behind `?art=1` / `localStorage rarebird-art=1`, `?art=0` escape): tier-chip sprites + ruler mark sprites + reveal row portraits + NO-SIGHTING empty-perch; countdown flock/rocket motif; ambient layers per theme (birds: sky-bands + drifting clouds + tree-line; cosmos: tiled starfield + nebulae + img-Earth (shrink preserved via patched `FX.setProgress`) + sun); podium perches/launchpads + winner crown; burst particles use feather/stardust sprites with hue tint; mute/chat/wager icons; favicon + og:image/twitter meta; host lobby 🎨 toggle (sets localStorage, reloads).
- `prototype/public/fx.js`: `burst()` accepts `{sprite}`; TIER_LADDER gained `hue` for sprite tinting; `setProgress()` scales an `<img>` earth when present.
- Version handshake: `CLIENT_VERSION = 11` (server.mjs — bump only) + `const V = 11` + `fx.js?v=11` (index.html).
- New tests: `prototype/verify/verify-art.js` (18 checks incl. art=0 fallback); retargeted `verify-{graphics,chat-theme,timers}-3100.js` (base 127.0.0.1:3100, token flashtest, art=1 active); screenshot matrix walker `prototype/verify/shots.js`.

## Test results (exact numbers)
- `validation/rules.test.mjs`: **62/62** (untouched engine).
- `verify-art.js`: **18/18** (manifest served; art=1: chip/row/ruler/podium/countdown/favicon/og/icons; art=0: emoji fallback intact).
- `verify-graphics-3100.js`: **12/12** · `verify-chat-theme-3100.js`: **12/12** · `verify-timers-3100.js`: **8/8** (all with art=1).
- Screenshot matrix: **27 shots** in `prototype/verify/shots/` (2 themes × home/lobby/lobby-full/countdown/round/round-invalid/round-locked/reveal/podium/chat × 390 + round/reveal at 320 & 768 + reduced-motion) + 6 re-shots after fixes.

## Defects: ID | screen | viewport | severity | shot | fixed?
- FQ-1 | reveal (SPLIT rows) | 390 | major (readability) | birds-reveal-390x844.png (v1) | ✅ fixed — rowArt 30px, gap 6px, answrap min-width:0, nick ellipsis, twins font 11px. Re-shot clean.
- FQ-8 | lobby (host) | all | block (raw `${...}` rendered literally) | cosmos-countdown-390x844.png (v1) | ✅ fixed — static label + JS sets "🎨 Art: on/off".
- FQ-10 | countdown | all | block (motif invisible) | both countdown v1 shots | ✅ fixed — ROOT CAUSE: `<img>` of a viewBox-only SVG computes 0×0 with only max-* CSS; gave `.cdArt` explicit 120×120 + object-fit. Re-shot: rocket renders with liftoff animation.
- FQ-9 | podium | 390 | major | birds-podium v1 | ✅ fixed — same root cause; explicit width + aspect-ratio 400/420. Crown + perches/launchpads render (re-shot).
- FQ-6 | reveal (cosmos) | 390 | minor | cosmos-reveal v1 (sun over caption) | ✅ fixed — sun 84px, opacity .45, top 1%.
- FQ-5 | reveal ruler | 390/320 | minor (label truncation) | cosmos-reveal | ✅ fixed — 9.5px + ellipsis (labels now "KINGF…", intentional).
- FQ-11 (not fixed, by design): headless-Chromium shows □ boxes for emoji (medals 🥇 etc.) — missing emoji font in the test browser only; phones render fine. Do not "fix" by removing emoji: they are the no-art fallback.
- FQ-12 (not fixed, minor): winner-nick ellipsis ("W.") is aggressive at 30% max-width on solo reveals; acceptable, revisit with real names in playtests.

## Not fixed / open questions
1. `art=1` is still opt-in by design — promotion to default is a MAX merge decision after human eyeball on the live URL (`?art=1`).
2. `assets` reached via symlink `prototype/public/assets -> ../../assets`; production build should copy/serve `assets/` explicitly (deployment note for MAX).
3. Ruler labels for cosmos flavors ("Interstellar") still truncate at 46px gutter — cosmetic.
4. verify-*-3100 copies exist because the canonical suites live in /data/workspace/research — MAX may want to consolidate locations.

## Verdict per theme
- **Dusk Birds:** ships as-is (art=1) — ladder, ambient dusk, perch podium all read well.
- **Cosmic Voyage:** ships as-is (art=1) — starfield/nebulae/sun/shrinking Earth + rocket countdown are the stronger identity; ruler flavor labels (Low orbit → Interstellar) land.

---

# Flash run 2026-10-24 — art ambition (phases delivered: A/B/C)

## What I did
- **Phase A:** 4 WebM recordings (krillion daily dive incl. answer-sink reveal; krillion party lobby/rules/rooms; jinxed landing+rules; playdaily clone flow) + 17 stills → `research-notes/inspiration/`. Vision analysis → `research-notes/inspiration/ANALYSIS.md`. Headline: Krillion's scene IS the scoreboard (diegetic depth ruler, 3+ parallax layers, continuous life, one unified CRT dressing); our altitude metaphor is equal but was unstaged.
- **Phase B:** `flash-directives/ART_VISION.md` — "The Ascent": viewport as climb ruler with painted altitude bands, camera glides up as rounds progress, curved flight-path reveals with RARE BIRD hero moment, dusk-grain post-processing, countdown-as-travel, podium-as-place.
- **Phase C:** `prototype/public/bold.js` (gated `?bold=1`/`rarebird-bold=1`, lobby ✨ toggle, `bold=0` escape): ≥3 transform-only parallax layers/theme (new hills-far/hills-near + planet-surface SVGs), 6 painted altitude bands with edge labels, pooled ≤30 ambient particles (fireflies / stardust+comets), two-easing curved flight-in reveals + RARE BIRD hero tint/glow, camera glide via `--progress`, runtime-generated grain overlay (no asset), reduced-motion disables all of it. Version handshake → 14 (server bump only). New parallax assets: 3 SVGs (~1.2KB total).

## Test results (exact numbers)
- `validation/rules.test.mjs`: **62/62** · suites with bold OFF: graphics **12/12**, art **18/18**, chat-theme **12/12**, timers **8/8**, security **16/16** (retargeted copy `verify-security-3100.js`), reconnect **5/5**.
- NEW `verify-bold.js`: **16/16** · NEW `verify-bold-perf.js`: **3/3** (bold reveal **60fps** at 390×844; reduced-motion: 0 particles, ≥50fps).
- Screenshot: `prototype/verify/shots/bold-reveal-390x844.png` (cosmos, hero moment).

## Defects: ID | screen | viewport | severity | shot | fixed?
- BA-1 | reveal | 390 | block (birds bands never painted) | — | ✅ self-reference TDZ bug in buildParallax removed.
- BA-2 | chat drawer | all | block for QA (banner covered close button) | elementFromPoint trace | ✅ root cause: STALE v13 test server still owning :3100 (EADDRINUSE killed my v14 start silently) → version banner covered chat-close. Handshake worked exactly as designed. **Recommendation to MAX (one line, server.mjs logic — outside my contract):** only send `update` when `clientV < serverV`; a newer client than server shouldn't be told to refresh.
- BA-3 | chat drawer | all | major (every drawer open threw pageerror) | — | ✅ `$('chat-input').focus()` on a node removed in the preset-chat round — deleted (predates this run).
- BA-4 | reveal (cosmos) | 390 | minor | bold-reveal shot | ✅ sun dimmed to .45 @ top 1%.
- BA-5 | reveal ruler | 390/320 | minor | bold-reveal shot | ✅ band labels 9.5px + ellipsis.
- BA-6 | perf | 390 | gate | — | ✅ 60fps ≥ 50.
- BA-7 | reveal (cosmos) | 390 | minor cosmetic | bold-reveal shot | ❌ band label ghosts through translucent hero card ("OUTE" over nick) — acceptable ambience; revisit if owner dislikes.
- BA-8 | ops | — | **incident, resolved** | — | ❌→✅ while cleaning ports I killed the LIVE :3000 server; restored within ~2 minutes from the branch tree (v14 content, bold off by default — v13 behaviour + handshake). MAX should redeploy main after merge for a clean canonical build.

## Not fixed / open questions
1. `bold=1` remains opt-in pending owner/MAX review of the vision direction; promotion path identical to art (flip default, bump v15).
2. Nick ellipsis at 30% is aggressive on solo reveals (cosmetic).
3. Camera glide uses #fx-sky transform transition — if MAX later adds scroll-parallax, coordinate the two transforms.
4. Phase A videos: 4 WebM (0.6–2MB) in `research-notes/inspiration/` — krillion dive recording captured a FULL round arc including the answer-sink; recommended viewing for the owner.

## Verdict
Bold mode ships (flagged): both themes gain a painted climb-ruler world with camera glide, living ambient layers, and choreographed reveals at 60fps. Dusk Birds reads warmer; Cosmic Voyage is the standout. Recommend owner review with `?bold=1`, then default-on promotion.

---

# Flash run 2026-10-24 — MoLab generator (flash/llm-content-v1)

## What I did
- Step 0 diagnosis: **vLLM is unusable on the notebook** — its runtime kernel JIT fails on the gVisor/cu13 toolchain (DeepGemm header assert; retry without DeepGemm then died on a Ninja build). Pivoted to **transformers + Qwen/Qwen3-30B-A3B-Instruct-2507 (bf16, device_map=auto)** — no JIT, ~60GB weights on the 96GB card, loads clean. Fixes along the way: `accelerate` install; chat-template returns BatchEncoding → stringify-then-tokenize; decode via `size(1)`.
- Built the batch generator (16 categories, JSON contract, tier rubric 25/25/25/15/7/3, in-notebook validation: tier whitelist + dedupe + self-resolution + safety regexes + per-category checkpoints). Script transferred md5-verified via chunked base64 through the marimo-pair bridge; run detached with `setsid` (nohup alone was SIGINT-killed by a bridge stream drop).
- **Generation: 16/16 categories, 818 entries** (insects needed one retry; ~3-4 min/category).
- Retrieved the drafts tarball md5-verified over the stdout channel; validated **again locally** against `validation/rules-engine.mjs` + `content-pipeline/safety-screen.mjs`.
- Judge probe: N/A this run — generation is in-process transformers, no OpenAI server to expose; probe re-armed for a future vLLM-served run.

## Test results (exact numbers)
- 16 packs in `prototype/pack-expansions/drafts/`, **818 entries total**, sizes 35-95 per category.
- Local validation: **0 bad tiers, 0 hard safety flags, 1 soft flag** ("Death Valley"-class terms in storms); 29 AMBIGUOUS flags = synonym/alias collisions that the candidate-chips UX handles by design (blizzard/snowstorm, Gorgonzola/Blue cheese) — with ~8 over-broad aliases flagged for editorial trim (e.g. bare "Xbox" alias vs "Xbox Series X" entry; "Science" parent vs Chemistry/Biology/Physics children).
- Tier histograms: mostly on-rubric; two skews for editorial review — world-rivers has NO entries above STARLING (rare rivers missing) and insects has a PIGEON/SPARROW gap (20/0/14).

## Not fixed / open questions
1. Drafts are MAX-merge material: wrap single-prompt files into pack schema, trim over-broad aliases (the 8 flagged), optionally backfill rare tiers for rivers/insects.
2. vLLM on MoLab needs a non-gVisor host or `--enforce-eager`-style no-JIT config to come back; transformers path is proven and fast enough (≈90s/category).
3. Model writes "RARE BIRD" sometimes as "RAREBIRD" — normalize already handles it.

## Verdict
The MoLab generator path works end-to-end: notebook LLM → validated drafts in our schema. 818 draft entries await editorial merge. Recommend MAX merges the clean 15 and schedules a small editorial pass on the flagged aliases + histogram skews.

---

# Flash run 2026-10-24 — graphics depth (tracks delivered: A; B license-gated)

## What I did
- **Track A — Living Scene (full):** new `prototype/public/gd.js` + 4 actor SVGs (`assets/themes/*/ambient/actors/`: balloon, lighthouse+beam, ISS, ringed planet-x). Scene actors per theme (balloon drift + lighthouse beam sweep / ISS transit + planet-x rising with progress); phase-reactive world (`body.phase-writing`, `body.endgame` tint per theme, `body.podium` with bobbing perches); reveal spectacle (top-down light shaft on RARE BIRD landings, altitude-band label pulse, stingers); podium bursts. **Synth ambience** (GD.ambience): WebAudio drone+filtered-wind/shimmer per theme, reveal stingers (rare arpeggio / pigeon thud), gesture-safe (starts via lobby 🎵 Ambience toggle, default off), mute-wired, zero assets. Version handshake → **17**.
- **Side-by-side:** `research-notes/inspiration/ours-ascent-*.webm` (our 3-round arc: bands, actors, hero reveal) vs `rec-krillion-dive.webm`.

## Test results (exact numbers)
- `verify-gd.js` **9/9** (actors per theme, phase classes, beam, audio gate default-off, podium scene, no page errors) · `verify-gd-perf.js` **3/3** (60fps with actors live) · full battery: rules 62/62 · graphics 12/12 · art 18/18 · chat-theme 12/12 · timers 8/8 · security 16/16 · bold 16/16 · bold-perf 3/3 · reconnect 5/5.

## Defects: ID | screen | viewport | severity | fixed?
- GD-1 | all | block-for-QA | ✅ **pre-existing product bug surfaced:** `fx.burst()` referenced undefined `opts.sprite` — every reveal burst since the art merge silently threw (pageerror swallowed by the game). Fixed (destructuring now includes `sprite`). Found by my strict pageerror capture.
- GD-2 | lobby | all | block | ✅ TDZ: `gdAudioOn` declared after first use → whole module aborted (nothing wired). Declaration moved up.
- GD-3 | reveal (cosmos) | 390 | minor | ❌ caption/sun-glow overlap + band label truncation persist (known BA-class cosmetics).
- GD-4 | reveal | 390 | minor | ✅ dynamic `import('./fx.js')` inside GD used a hardcoded ?v — burst still worked; noted for the version-bump checklist (MAX: grep dynamic imports on bump).

## License verdict (Track B gate)
`scenario-labs/3d-collection` = **CC-BY-4.0** (verified via HF API `tags: license:cc-by-4.0`). Per the directive gate (CC0/MIT only) it is **NOT used**. Owner may amend the allowlist to accept CC-BY with attribution — it's 1,342 AI-generated 3D assets, 39GB; Kenney/Quaternius (CC0) and procedural geometry remain the default sources. Track B implementation deferred to a follow-up run (honest A-only per directive).

## Ambience-gap verdict (side-by-side)
The gap has **closed substantially**: we now have a painted climb-ruler world with actors, phase-reactive tension, and choreographed reveals; Krillion still leads on pixel-art charm density and the sinking-tag diegesis, but the scene now feels inhabited rather than gradient-only. Remaining lever if the owner wants more: illustrated (non-silhouette) band backdrops.

## Not fixed / open questions
1. Track B unimplemented (license gate + budget) — spec lives in directive 06.
2. GD audio starts only from the lobby toggle; a round-level hint could raise opt-in.
3. Dynamic fx import versioning (GD-4) should be folded into the version-bump checklist.

---

# Flash run 2026-10-24 — 3D Ascent (flash/w3d-v1) + Economy (flash/economy-v1)

## RUN 1 — 3D Ascent (v18)
- `w3d.js`: vendored three r152 (MIT, 633KB, lazy-loaded only when flagged); procedural scenes — birds: 3 hill layers + 20-boid flock (zero per-frame alloc) migrating with progress; cosmos: ringed planet + moon orbit + 900-pt starfield + 2 satellites; camera lerp; DPR 1.5 cap; fail-soft (no THREE → Track A); reduced-motion = static frame.
- Defects: W3D-1 `new T.Matrix()` → Matrix4 (r152); W3D-2 test clicked lobby-only theme toggle pre-create; W3D-3 boids GC capped fps → hoisted temps (38→45); W3D-4 headless SwiftShader renders EVERY open context on CPU — fps suites must isolate browsers (cosmos 60 / birds 45 in isolation).
- `verify-w3d.js` **11/11**; graphics 12/12; bold 16/16 unaffected.

## RUN 2 — Feathers + Life List (v19)
- Server: `room.feathers` Map (3/game init at start+rematch; lazy-init safety), wager costs 1 + rejects at 0 (`wager_no_feathers`), doubled refunds +2 (cap 9), `settings.feathers on/off`, `publicRoom` broadcasts feathers per player.
- Client: theme-flavored HUD (🪶 Feathers / ⭐ Starlight, D-40), wager disabled at 0, refund pop. Life List: localStorage (dedupe promptId+canonical, cap 500), MEGA/RARE earn + card fly-in, results+lobby buttons, modal grid with manifest portraits, copy summary. Zero server involvement.
- Defects: EC-1 feather HUD only updated in lobby phase → stale during rounds (fixed: all-phase update); EC-2 results-screen Life List button never wired (lobby one was) — fixed; EC-3 test bug: halved outcome affects points not feathers (3−1=2, not 1); EC-4 doubled refund arithmetic 3−1+2=4 (assertion corrected).
- Economy verdict (sim, smartW3 feathers agent): 145.8 vs smartW 151.6 vs smart 273.8 — scarcity gates the *bleed rate* of a bad strategy without distorting balance.

## Test results (exact numbers)
rules **62/62** · verify-economy **4/4** · verify-lifelist **6/6** · verify-w3d **11/11** · graphics 12/12 · art 18/18 · chat-theme 12/12 · timers 8/8 · bold 16/16 · bold-perf 3/3 · security 16/16 · reconnect 5/5 · gd 9/9 · gd-perf 3/3.

## Verdict
Both runs ship. 3D is flag-gated (?w3d=1) pending owner eyeball; economy + life list default-on.
