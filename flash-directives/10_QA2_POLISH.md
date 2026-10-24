# 10 · QA-ROUND-2 POLISH — items 1,2,3,4,8(partial),10

**Branch:** `flash/qa2-polish-v1` · version 21→22 · standard rules (00). FINDINGS IDs QA2-…

1. **Same-tier overlap (QA finding 1):** in `renderReveal`, rows landing in the same altitude band overlap when 2+ players share a tier. Fix the band stacking: compute rows-per-band first, allocate each band a vertical slice proportional to occupancy (min row height 56px, shrink the free bands), and offset within the band. No overlap at up to 6 players sharing one tier — verify with a scripted 5-player same-answer game.
2. **Chat default open (2):** drawer opens by default (first visit) once a room is joined; remember open/closed in localStorage. Badge still works.
3. **Per-player vs room settings (3):** move 🎨 Art / 🌐 3D / 🎵 Ambience OUT of host-controls into a personal settings row visible to EVERY player in the lobby (they're already per-player localStorage — the UI just hid them). Rounds/timer/theme stay host-only. Label the two groups: "Room (host)" / "Yours".
4. **Hide pool size (4):** remove "N valid answers out there" from the prompt card and invalid feedback (owner decision D-42 — QA2 supersedes playtest-1's trust fix; the 3-hint nudge remains the trust mechanism). Blind modifier already strips it; strip everywhere.
5. **Dopamine audio extensions (8):** stingers currently fire for RARE BIRD/MEGA/KINGFISHER(soft) — add a pleasant rising two-note for STARLING, a tiny tick for SPARROW/PIGEON landings when ambience is on; add a "whoosh+chime" on Top Call win; confetti burst volume on podium +2× (exists lightly). All through the existing synth (no assets), mute-respecting.
6. **Special-round instructions (10):** the 🎲 chip is a label; expand to a one-line instruction under the prompt: Blind → "No hints this round — say the first true thing you believe", Blacklist → "🕊️ {answer} is grounded — anyone who says it scores nothing", Double feathers → "Doubled Top Calls refund double feathers", Final round (item 9, directive 11) → its own line. Server already sends the modifier object.

**Tests:** new `verify-qa2.js`: 5-player same-tier reveal with zero overlap (bounding-box assertion), chat auto-opens + persists, settings row visible to non-host, no pool-size strings anywhere, modifier instruction lines render. Full battery green.
