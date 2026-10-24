# 11 · LIVING LADDER — the flagship QA2 item (7) + final round (9) + distance dopamine (8)

**Branch:** `flash/living-ladder-v1` · version 22→23 · standard rules. FINDINGS IDs LL-…
**Owner's vision (verbatim intent):** "The ladder should be small and on the right the whole game while the players actually move higher into space / birds migrate. Dynamic, scrolling, parallax emphasizing the distance between players, with dynamic enticing art."

## The design (read `ART_VISION.md` + `ANALYSIS-II.md` first)
The scene becomes the scoreboard **during the round, not just the reveal**:
1. **Persistent mini-ladder, right edge:** a slim (~34px) vertical track always visible from countdown through reveal: 6 tier zones with tick marks, plus a live dot per player at their current-game best altitude (start: ground). Micro-labels on the zone boundaries only (LOW → STARS / SURFACE → DEEP STARS).
2. **Player markers climb live:** during WRITING, each player's marker bobs just above the ground band; the moment they lock an answer their marker does a "ready" pulse (no altitude leak — answer stays secret). At REVEAL, markers fly to their earned altitude one-by-one with the card stagger — the ladder IS the reveal summary, and the between-player distance is visible instantly. Markers = player color (assign 6 stable colors by join order) with initial letter.
3. **Camera tracks the leader (scroll/parallax emphasis):** the reveal camera pans up so the current highest marker sits ~70% viewport height; if the spread is large, layers parallax proportionally (near layers faster) so the distance *feels* big. The existing `--progress` world drift continues beneath.
4. **Dopamine (8):** on each marker arrival — tier-colored trail motes from their previous position; leader change mid-reveal triggers a soft shimmer on the new leader's marker; final round arrivals get double confetti (see below).
5. **Special FINAL round (9):** last round is now always flagged `final: true` (server: rounds[total-1]) with **double points** (scoreRound called with a `multiplier: 2` on the final round — implement as a post-pass in endWriting, not in the rules engine) and the prompt drawn from a **niche pool**: a new `pack.json`-adjacent file `prototype/pack-niche.json` (15 quirky-but-guessable prompts you author — e.g. "Name a smell everyone recognizes but can't name.", "Name something that was cooler in the 90s.", "Name an excuse for being late."). Chip + instruction line: "🏁 FINAL ROUND — niche question, DOUBLE POINTS". The niche pool ships in this run (author it yourself; same validation gauntlet as other packs; safety screen 0 hard flags).
6. Ladder reduced-motion: static positions, no trails. Perf: ladder is pure DOM+transform — must not drop the 50fps gate (extend the perf suite).

**Server changes needed (you may touch server.mjs for these two, nothing else):** final-round flag + double-points post-pass + prompt draw: `rounds[n-1]` from niche pool when `room.settings.finalNiche !== 'off'`. Broadcast `final: true` in that roundStart.

**Tests:** new `verify-living-ladder.js` (ladder present all phases, markers = players, reveal climbs, final round double-points verified end-to-end in a 2-player protocol game, niche prompt appears on last round only) + extend perf gate. Full battery green.
