# 07 · Deployment and Operations — RAREBIRD

Target environment: **one InstaBox sandbox** (this machine's class: 4 vCPU / 8 GB / 16–20 GB disk, outbound internet, no inbound ports — public access exclusively via `instabox-port`). Everything below was **verified on this machine** unless marked otherwise.

---

## 1. Local development

```bash
git clone <repo> && cd rarebird
npm install            # runtime deps: ws (+ dev: typescript, vitest — see 08)
npm run dev            # node server.mjs on :3000 (or tsx watch)
# open http://localhost:3000 in two browser profiles / two devices on the LAN
```
- No env vars required for dev. No database, no migrations, no secrets.
- Content packs live in `content/packs/*.json`; the server loads them at boot; hot-reload endpoint `POST /admin/reload-packs` guarded by `ADMIN_TOKEN` (ops convenience; restart also fine).

## 2. Production deployment on InstaBox (verified path)

1. **Run the server persistently.** The sandbox has no systemd user session by default; two supported options:
   - `pm2 start "node server.mjs" --name rarebird` (pm2 via npm i -g pm2) — survives shell exit, restarts on crash; **pm2 resurrect is lost on a machine stop** (processes die with the VM) → after any stop/start, `pm2 resurrect` or re-`start`. 
   - plain `nohup node server.mjs &` from the dashboard Terminal tab — fine for a game night, gone when the shell dies.
2. **Publish:** `instabox-port publish 3000` → prints `https://3000-<machine>.instabox.tech`. URL lives **until unpublished or the sandbox stops** (verified: HTTP + WSS both proxied; WebSocket upgrade confirmed with an echo round-trip and by playing the prototype through it).
3. **Verify:** `curl https://…/healthz` → `ok`; open the URL on two phones.
4. **To retract access:** `instabox-port unpublish 3000`.

**Machine lifecycle realities (from MACHINE.md):**
- **Stop** ends every process; both disks survive. → after start: `pm2 resurrect` (or restart server) + `instabox-port publish 3000` again (the public URL is stable per port-machine pair — same URL returns).
- **Suspend/snapshot** preserve processes/memory as appropriate; still verify healthz after resume.
- Idle behaviour: an idle Node server holds ~50 MB RSS and ~0 CPU; a machine that's merely on costs nothing extra. There is **no auto-scal story and none is needed** at this audience size.

## 3. Configuration

| Setting | Default | Where |
|---|---|---|
| `PORT` | 3000 | env |
| `RAREBIRD_ADMIN_TOKEN` | unset (admin endpoints off) | env |
| `RAREBIRD_MAX_ROOMS` | 200 | env (protects a 4 vCPU box) |
| `RAREBIRD_MAX_PLAYERS` | 12 | code |
| Pack directory | `content/packs` | code |

Secrets: none needed at MVP (no third-party services). If a domain + TLS fronting is ever wanted, put the instabox URL behind it — not required now.

## 4. Observability & safeguards (MVP bar)
- **Logs:** single structured line per event: room create/join/start/round/reveal/results/GC, errors with stack. Keep 7 days (`RAREBIRD_LOG_DIR`, rotation by size). No player-identifying data beyond nicknames in logs.
- **Health:** `/healthz` returns `ok` + `{rooms, sockets, uptimeMs}`; check externally (e.g. a free uptime pinger hitting the public URL).
- **Rate limits:** per-socket 12 msgs/5s (in place); per-IP connection cap 20 (add in production port).
- **Graceful degradation:** a crashed room must not crash the process — every handler is try/caught (prototype already does this); unhandled server errors close that socket only.
- **Content safety:** nickname denylist; answers validated against catalogues; reveal strings escaped.
- **Backups:** nothing to back up except `reports.jsonl` and pack files — both live in git.

## 5. Operating runbook
| Symptom | Check | Action |
|---|---|---|
| Public URL 502 | `pgrep -f server` ; healthz local | restart server; re-publish port if stopped machine |
| Latency spikes in rounds | healthz rooms/sockets count | cap MAX_ROOMS; restart at quiet hour (rooms are ephemeral — announce in-group) |
| "Wrong answer rejected!" wave | `reports.jsonl` | triage per `04` §8; add entries; deploy pack |
| Abuse (nick flooding) | logs | nickname denylist update; per-IP conn cap |
| Memory creep | RSS in pm2 monit | fix leak (rooms Map is the usual suspect — GC loop already removes empty rooms after 5 min) |

## 6. Security & privacy posture
- HTTPS/WSS via instabox proxy (their TLS). No cookies, no accounts; localStorage holds only `{nickname, room, pid, token}` (a random seat token — revocable by clearing site data).
- Players are minors-adjacent: **no chat, no free-text broadcast, no IPs in stored data** (transient in memory only), no analytics in MVP. If analytics are added later, aggregate events only (counts of rooms/rounds), no nicknames.
- Answer catalogues are server-side secrets until reveal (anti-scraping, `03` §7).

## 7. Limits & future scalability
- One process comfortably serves hundreds of concurrent rooms (`03` §9). Real constraint is operational (one box, restart-on-stop discipline), not compute.
- Growth path (only if ever needed): move to a small VPS + Caddy TLS + systemd; rooms are process-local so horizontal scale would need a room→shard router or Redis pub/sub — explicitly out of scope until a Stranger Population exists (see `09` Q-05).
