# RAREBIRD disposable prototype

Proves the multiplayer loop end-to-end (see ../06_TEST_PLAN_AND_RESULTS.md).
NOT production code — the production build is specified in ../08_IMPLEMENTATION_HANDOFF.md.

Run:
  npm install          # installs ws
  node server.mjs      # serves UI + game socket on :3000

Verify (automated, needs playwright-core + a chromium binary):
  node verify/verify-rarebird.js    # 3-browser full game, rematch, reconnect (localhost)
  node verify/verify-validate.js    # invalid / fuzzy-suggest UX probe
  node verify/verify-public.js URL  # same through the public instabox-port URL
  node verify/verify-fixes.js       # timer pacing regression, report flow, gameplay log
  node verify/verify-timers.js      # stale-timer regression (early round end must not shorten next round), 20s setting
  node verify/verify-judge.js       # LLM judge flow (needs mock-judge.mjs running)

QA aids:
  GET /log        last 200 gameplay events (create/join/answers incl. raw+match+msLeft/reveal/results/reports)
  reports.jsonl   missing-answer reports ("Report missing bird" link shown on invalid answers)

Optional live adjudication (prototype-only):
  node mock-judge.mjs &                          # local mock
  LLM_JUDGE_URL=http://127.0.0.1:8787/judge node server.mjs   # any endpoint per JUDGE.md (e.g. MoLab-hosted)

Deploy:
  instabox-port publish 3000
