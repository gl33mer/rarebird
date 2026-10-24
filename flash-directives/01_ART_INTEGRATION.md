# 01 · ART INTEGRATION RUN (the graphics finally go live)

**Goal:** wire the delivered art pack (`assets/manifest.json`) into the game client so both themes render sprites/ambient art instead of emoji placeholders — behind a feature flag first, then default-on after QA.

## Current state (read these first)
- `prototype/public/fx.js` — theme-aware ambient (`ambient(kind, seed)`, `setTheme`, `setProgress`), `TIER_LADDER` table (alt + color + emoji per tier), `ascend/burst/countdown/shake`.
- `prototype/public/index.html` — single-page client; emoji placeholders: tier chips (`t.emoji`), countdown (🐦🐦🐦 / 🛫), ambient (CSS gradients + emoji clouds/earth 🌍), podium medals (🥇🥈🥉), particles (text glyphs), mute 🔊, chat 💬, wager 🎲.
- `assets/manifest.json` — every asset path + tier flavors; `assets/NOTES.md` — integration notes (chip notch uses `currentColor`; bursts are near-white for tinting; earth is perfectly round; rocket leaves flame-stretch space).
- Theme selection already works (host lobby chip; `settings.theme`, `roundStart.theme`).

## Build this
1. **Asset loader** (in fx.js or a new `art.js`): fetch `assets/manifest.json` once; expose `ART.ready`, `ART.tier(tierName) -> spriteURL`, `ART.theme(id) -> {ambient…, podium, burst, logo}`, `ART.shared.icon(name)`. Cache-bust with the client version. Fail-soft: if manifest/assets missing → keep emoji (the game must never break on art).
2. **Swap points** (only where listed in manifest §"How the app will use each asset"):
   - tier chip icon slot + reveal ruler marks + (stretch) 40px portrait per reveal row;
   - countdown overlay: flock-silhouette (birds) / rocket (cosmos) with the existing tick animation (rocket may translateY upward per tick; reduced-motion = static);
   - ambient: birds → sky-bands.svg as body background layer + drifting cloud sprites + tree-line pinned to bottom; cosmos → tiled starfield + 2 nebulae + earth.svg replacing the emoji 🌍 (keep the per-round shrink via `FX.setProgress`), sun far background; KEEP the existing CSS-gradient fallback under the art;
   - podium: perch-1/2/3 and launchpad-1/2/3 under 1st/2nd/3rd (replace the plain bars; keep nick+points above);
   - bursts: feather/stardust sprites as the particle bodies (img elements or CSS background on the particle divs, tinted via `filter` or opacity);
   - shared icons: chat/mute/wager/share/report/crown replace their emoji/labels where present (mute button, chat toggle, wager chip can keep text + icon);
   - favicon: link `assets/favicon/favicon-32.png` + icon.svg in index.html; og-cover is meta tags only: `<meta property="og:image" content="/assets/shared/og-cover.png">` + twitter:card.
   - NO SIGHTING row → `shared/ui/empty-perch.svg`; loading → `loading-bird.svg`.
3. **Flag:** all of the above active only when `location.search.includes('art=1')` OR localStorage `rarebird-art=1` (host lobby gets a tiny "🎨 art" toggle that sets the localStorage and reloads) — until QA passes, then make it default and keep `art=0` as the escape hatch.
4. **Performance:** SVGs are small; still lazy-load ambient per theme, don't fetch both themes' art; total added weight on first paint ≤ 150KB. prefers-reduced-motion: no ambient drift/burst particles.

## Tests (must all pass before you report done)
1. `node validation/rules.test.mjs` → 62/62 (untouched).
2. Adapt/run the browser suites against YOUR port-3100 server (edit the base URL in a copy): verify-graphics, verify-chat-theme (cosmos path!), verify-timers → all green.
3. New `prototype/verify/verify-art.js`: with `art=1` — assert tier chip <img>/background set from manifest URLs (not emoji), ambient layers present per theme, podium art present, favicon link present; with `art=0` — assert emoji fallback intact.
4. Screenshot matrix → `prototype/verify/shots/`: both themes × {home, lobby, countdown, round, reveal, podium} at 390×844 AND 320×568. Include one `prefers-reduced-motion` emulation.

## Done means
All suites green on your server, screenshot matrix captured, FINDINGS.md written, branch pushed. Do not publish to the human URL.
