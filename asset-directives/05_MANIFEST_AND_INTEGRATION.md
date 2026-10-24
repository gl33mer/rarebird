# 05 · Manifest & Integration Contract

This is how your art gets into the game. The client's fx layer reads **one file** — `assets/manifest.json` — and swaps every emoji placeholder for your sprites. Get this right and integration is a non-event.

## `manifest.json` schema (exact)

```json
{
  "version": 1,
  "generator": "GLM-5.3 Flash",
  "generated": "2026-10-24",
  "themes": {
    "dusk-birds": {
      "label": "Dusk Birds",
      "tiers": {
        "PIGEON":     { "sprite": "themes/dusk-birds/tiers/pigeon.svg",      "flavor": "Pigeon" },
        "SPARROW":    { "sprite": "themes/dusk-birds/tiers/sparrow.svg",     "flavor": "Sparrow" },
        "STARLING":   { "sprite": "themes/dusk-birds/tiers/starling.svg",    "flavor": "Starling" },
        "KINGFISHER": { "sprite": "themes/dusk-birds/tiers/kingfisher.svg",  "flavor": "Kingfisher" },
        "MEGA":       { "sprite": "themes/dusk-birds/tiers/mega.svg",        "flavor": "Mega" },
        "RARE BIRD":  { "sprite": "themes/dusk-birds/tiers/rare-bird.svg",   "flavor": "Rare Bird" }
      },
      "ambient": {
        "skyBands": "themes/dusk-birds/ambient/sky-bands.svg",
        "clouds": ["themes/dusk-birds/ambient/dusk-clouds-1.svg", "themes/dusk-birds/ambient/dusk-clouds-2.svg"],
        "groundLine": "themes/dusk-birds/ambient/tree-line.svg",
        "countdown": "themes/dusk-birds/countdown/flock-silhouette.svg"
      },
      "podium": ["themes/dusk-birds/podium/perch-1.svg", "themes/dusk-birds/podium/perch-2.svg", "themes/dusk-birds/podium/perch-3.svg"],
      "burst": "themes/dusk-birds/bursts/feather.svg",
      "logo": "themes/dusk-birds/logo.svg",
      "logoMark": "themes/dusk-birds/logo-mark.svg"
    },
    "cosmic-voyage": {
      "label": "Cosmic Voyage",
      "tiers": {
        "PIGEON":     { "sprite": "themes/cosmic-voyage/tiers/low-orbit.svg",     "flavor": "Low orbit" },
        "SPARROW":    { "sprite": "themes/cosmic-voyage/tiers/the-moon.svg",      "flavor": "The Moon" },
        "STARLING":   { "sprite": "themes/cosmic-voyage/tiers/mars.svg",          "flavor": "Mars" },
        "KINGFISHER": { "sprite": "themes/cosmic-voyage/tiers/jupiter.svg",       "flavor": "Jupiter" },
        "MEGA":       { "sprite": "themes/cosmic-voyage/tiers/kuiper-belt.svg",   "flavor": "Kuiper Belt", "extraSprite": "themes/cosmic-voyage/tiers/aliens/alien-mega.svg" },
        "RARE BIRD":  { "sprite": "themes/cosmic-voyage/tiers/interstellar.svg",  "flavor": "Interstellar", "extraSprite": "themes/cosmic-voyage/tiers/aliens/alien-interstellar.svg" }
      },
      "ambient": {
        "starfieldTile": "themes/cosmic-voyage/ambient/starfield-tile.svg",
        "nebulas": ["themes/cosmic-voyage/ambient/nebula-1.svg", "themes/cosmic-voyage/ambient/nebula-2.svg"],
        "earth": "themes/cosmic-voyage/ambient/earth.svg",
        "sun": "themes/cosmic-voyage/ambient/sun.svg",
        "countdown": "themes/cosmic-voyage/countdown/rocket.svg"
      },
      "podium": ["themes/cosmic-voyage/podium/launchpad-1.svg", "themes/cosmic-voyage/podium/launchpad-2.svg", "themes/cosmic-voyage/podium/launchpad-3.svg"],
      "burst": "themes/cosmic-voyage/bursts/stardust.svg",
      "logo": "themes/cosmic-voyage/logo.svg",
      "logoMark": "themes/cosmic-voyage/logo-mark.svg"
    }
  },
  "shared": {
    "icons": { "chat": "shared/icons/chat.svg", "muteOn": "shared/icons/mute-on.svg", "muteOff": "shared/icons/mute-off.svg", "wager": "shared/icons/wager-dice.svg", "share": "shared/icons/share.svg", "report": "shared/icons/report-flag.svg", "crown": "shared/icons/crown.svg" },
    "tierChip": "shared/chips/tier-chip.svg",
    "emptyPerch": "shared/ui/empty-perch.svg",
    "loadingBird": "shared/ui/loading-bird.svg",
    "ogCover": "shared/og-cover.png"
  }
}
```

Rules:
- Every path is **relative to the `assets/` root**, exactly matching the files you ship. No absolute paths, no URLs.
- Tier keys are the CANONICAL names (uppercase, `RARE BIRD` with a space) — they are protocol constants; do not rename.
- `flavor` = the in-theme display name shown on the reveal ladder (must match what your theme brief calls the milestone).
- If you omit an optional key (`extraSprite`, `sun`, …), the app falls back gracefully — but tiers/ambient/podium/burst/logo are required per theme.

## How the app will use each asset (so you can design accordingly)

| Slot | Current placeholder | Your asset's job |
|---|---|---|
| Reveal row tier chip | `[emoji + name]` | chip icon slot (24px) beside tier name |
| Reveal ladder ruler | text marks | sprite above each ruler mark (18px) |
| Reveal row portrait | none | 40px portrait right of the answer (tier tiers only, stretch goal) |
| Countdown overlay | 🐦🐦🐦🐦 / 🛫 | flock silhouette (birds) / rocket (cosmos), animated |
| Ambient scene | CSS gradients + emoji clouds/earth | your layered art, parallax drift |
| Podium | 🥇🥈🥉 + bars | perches/launchpads under 1st/2nd/3rd |
| Bursts | text particles | feather/stardust particles (tinted) |
| Empty state (timeout) | "NO SIGHTING" chip | empty-perch art |
| favicon/og | none | identity + link previews |

## Integration & QA (done by GLM-5.3 MAX after your delivery)
1. JSON schema validation + path existence check.
2. SVG parse + size + greyscale + contrast audits (per `00` §5).
3. Live integration behind a `?art=1` flag; automated 3-player games; screenshots at 390×844; vision-QA pass.
4. Feedback returned as a defect table (asset, defect tag, suggested fix). You revise; iterate ≤ 3 rounds expected.

## Packaging
Deliver `assets/` as a zip named `rarebird-assets-v1.zip` (or a PR adding the `assets/` tree to the repo — see `NOTES.md` for repo pointer if provided). Include `NOTES.md` describing: design decisions, any skipped/extra files, and your self-QA results per asset.
