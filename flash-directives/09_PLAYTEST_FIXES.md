# 09 · PLAYTEST ROUND 1 FIXES + GRAPHICS DYNAMICS II

**For:** GLM-5.3 Flash · owner playtest 2026-10-24 produced five findings. Fix all five, then a second graphics-dynamics research+implementation pass. Rules from `00_ENVIRONMENT_AND_RULES.md`. Branch `flash/playtest-fixes-v1`, version 19→20.

## Fix 1 — Rematch flows through the lobby
Today rematch restarts instantly with same players/settings. Change: after `results`, the room returns to `lobby` phase (players stay seated, scores shown), and **rematch votes act as "ready"** — when majority is reached the host's start button becomes active (host presses Start to launch). This gives a natural window to change theme/3D/audio/rounds/timer between games, and new players can join. Keep the vote counter UI; a "ready" state per player replaces "rematch" semantics. Server: rematch → reset scores + phase='lobby'; add `ready` message toggling per-player readiness; Start requires all *seated* players ready OR host force-start. Client: results screen's Rematch button becomes "Back to lobby ▸"; lobby shows ready checkmarks.

## Fix 2 — The dragged-in feeling dies with Fix 1 (votes = ready, nobody auto-enters a game). Note the change in FINDINGS as the resolution.

## Fix 3 — 🌐 3D toggle must not reload
`location.reload()` on toggle causes the home-screen flash the owner saw (resume race). Change: toggling w3d enables/disables the layer **live** — `W3D.buildScene(theme)` on enable, tear down canvas + class on disable — persisting to localStorage. Same for 🎨 Art and 🎵 Ambience if they reload today (check; fix the same way). No page reloads for any lobby toggle.

## Fix 4 — Podium must show shared places + tiebreak reason
Log evidence: `1.bluye=140, 1.greenye=140` — protocol already shares place 1, but the podium renders sequential 1st/2nd/3rd perches. Fix: equal-points players get equal perch heights and equal medals (🥇🥇), and when countback decided an ordering among tied players show the reason as a small line under the podium: "Tie broken on rarest sightings 🦜". Server already sends `tierCount` in results standings — use it.

## Fix 5 — Rarity trust: invalid feedback should teach
Judge is now OFF in production (MAX fix — curated catalogues only). With it off, players hitting "No echo" on answers they believe in is the #1 trust risk. Two cheap improvements: (a) the invalid feedback line includes the count of valid answers remaining un-guessed this round ("195 answers out there — keep trying"); (b) the "Report missing bird" link stays available and now ALSO offers "show me 3 hints" — first letters of 3 unsaid valid answers (server sends 3 random unsaid canonicals' first 2 letters + length, e.g. "VA–U, 7"). No full answers leaked; helps stuck players feel the catalogue's depth.

## Part 2 — Graphics Dynamics II (the owner still finds Krillion more dynamic)
Do a **deeper inspiration pass** before coding: record (WebM) at least: krillion.io daily dive full round + unlimited mode, krillion.io/party one full public match (join one), plus FIND and record 2+ other rarity/party games not yet captured (search "krillion alternative", "rarity trivia game", "jinxed like games"; candidates: any 2026 rarity games on itch.io/crazygames). Watch every recording; write `research-notes/inspiration/ANALYSIS-II.md` with a **motion inventory table**: every moving element × {trigger, duration, easing, repeat}. Then implement the top 5 gap-closers that fit our system (candidates from prior analyses: continuous world scroll during WRITING, answer-tag flight with trailing motion, reveal sequence with camera pull, tier-landing shockwaves, ambient weather). Keep perf gates (≥50fps Track A / ≥45 w3d) and all suites green; new verify script for whatever you add (IDs GFX2-…).

## Deliverables
All five fixes + Analysis-II + implemented closers on the branch; FINDINGS entry (IDs PF-…, GFX2-…); suites green: rules 62/62 + existing battery + new `verify-playtest-fixes.js` (lobby-return flow, live toggles, shared-podium, hints) + `verify-gfx2-perf.js`.
