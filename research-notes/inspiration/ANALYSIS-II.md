# ANALYSIS-II — motion inventory (Graphics Dynamics II, Phase A)

Evidence: `rec-krillion-unlimited.webm`, `rec-krillion-party-match.webm` + prior recordings/stills. Study-only.

## Motion inventory — Krillion (what's actually moving, always)

| Element | Trigger | Duration/Easing | Repeat |
|---|---|---|---|
| Water light rays | always | ~8s ease sway | infinite |
| Fish schools (far/mid) | always | 12–25s linear cross | infinite |
| Bubbles | always | 3–6s linear rise | infinite |
| Kelp sway | always | ~4s ease sway | infinite |
| Boat bob (surface) | always | ~3s ease | infinite |
| Answer tag sink | on answer | ~2.5s cubic descent to tier band | per reveal |
| Tier band label pulse | tag arrives | ~0.6s once | per reveal |
| Mascot idle bob | always | ~2s | infinite |
| CRT zap | state change | 250ms once | per transition |
| Sonar ping | timer | 1s ring | per second |
| Camera descent | between prompts | ~2s ease | per round |

**The pattern: Krillion NEVER has a still frame.** At least 4 layers move at any instant, all slow (2–25s cycles), all transform/opacity. Motion is ambient-first, event-second.

## What's still missing in RAREBIRD (after bold + gd)
Between our events we DO move (parallax drift, particles, actors) but: (1) our world doesn't **continuously scroll** — Krillion's camera always drifts; (2) our reveal cards fly straight-ish — no trailing motion; (3) no **tier-landing shockwave**; (4) our phase reactivity changes colors, not **speed**; (5) no camera **pull** at reveal start.

## Top 5 closers implemented in this run (see GFX2 commit)
1. Continuous world drift during WRITING (slow #fx-sky upward drift, 60s loop — the world breathes).
2. Tier-landing shockwave: expanding ring at the landed row's altitude (KINGFISHER+).
3. Reveal camera pull: #fx-sky scales 1.04 → 1.0 over 1.2s at reveal start.
4. Trailing motion: answer rows get a fading streak pseudo-element while flying.
5. Phase speed-up: ambient particle/layer animation speeds ×1.4 during WRITING (body.phase-writing multiplier).
