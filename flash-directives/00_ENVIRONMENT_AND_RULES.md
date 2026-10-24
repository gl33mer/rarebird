# 00 · Environment & Rules for the FLASH run

**For:** GLM-5.3 Flash, executing directives in this folder.
**Repo:** /data/workspace/rarebird-design (also https://github.com/gl33mer/rarebird, private; gh is authed as gl33mer).

## Environment facts (verified)
- Linux sandbox; Node 22, Python 3.13; Chromium at `/usr/bin/chromium`; `playwright-core` installed at `/data/workspace/research/node_modules` (set `NODE_PATH` or require by absolute path — ESM imports ignore NODE_PATH, use a path-based import or run scripts with `cd /data/workspace/research`).
- The LIVE game (humans are playing it) is the server on **port 3000**, published at https://3000-agqvt6kcpzgbnygkvb7ittns74.instabox.tech.
- Log QA endpoint: `curl 'http://127.0.0.1:3000/log?t=<RAREBIRD_LOG_TOKEN>'` — the token was set at the last restart (`testtoken123` unless changed).
- Rules tests: `node validation/rules.test.mjs` (must stay 62/62 or grow).
- Existing verify suites (browser-driven, in `prototype/verify/`): verify-graphics (full 3-player game), verify-chat-theme, verify-timers, verify-security, verify-topcall, verify-judge, verify-validate. They assume a server on 127.0.0.1:3000 with `RAREBIRD_LOG_TOKEN=testtoken123` and the mock judge on :8787.

## HARD RULES (violations break humans' games or the repo)
1. **NEVER restart, kill, or run tests against the server on port 3000.** Run your own: `cd prototype && RAREBIRD_LOG_TOKEN=flashtest LLM_JUDGE_URL=http://127.0.0.1:8787/judge PORT=3100 node server.mjs` and point your tests at 127.0.0.1:3100. Publish your own URL only if needed: `instabox-port publish 3100` (unpublish after).
2. **Never `git push --force`, never rewrite history.** Commit to a branch: `git checkout -b flash/<run-name>`; push the branch; do NOT merge to main — GLM-5.3 (MAX) reviews and merges.
3. **Version handshake:** any client-visible change (HTML/JS/CSS/fx.js) requires bumping BOTH `CLIENT_VERSION` in `prototype/server.mjs` AND `const V` in `prototype/public/index.html` (+ the `fx.js?v=` query) to the same next integer. Stale clients are the #1 field bug.
4. Don't touch: `validation/rules-engine.mjs` (the scoring contract — if a test legitimately needs a change, STOP and report instead), `assets/manifest.json` paths (art files may be edited, the manifest schema not), `docs 00-09` (append via NOTES-style files instead), `answers.jsonl`/`reports.jsonl`.
5. Everything you run must be reproducible: commit scripts you used under `prototype/verify/` or `tools/`.
6. If an instruction is ambiguous or a test fails for a reason you can't diagnose in 15 minutes: STOP, write the finding to `flash-directives/FINDINGS.md`, and end the run. Partial, honest delivery beats a broken guess.

## Report format (always)
Append to `flash-directives/FINDINGS.md`: what you did, test results (exact numbers), screenshots taken (paths), defects found/fixed, defects found/NOT fixed, open questions.
