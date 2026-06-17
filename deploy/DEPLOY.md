# Deploying to your Ubuntu server

App code lives at `/mnt/apps/mayhem-tracker`, the SQLite DB at `/mnt/data/mayhem-tracker` — separate mounts, set via `DATA_DIR` in `deploy/ecosystem.config.cjs`. Runs under your own user (`svilen`) via pm2.

## 1. Get the code + dependencies onto the server

```bash
sudo mkdir -p /mnt/apps/mayhem-tracker /mnt/data/mayhem-tracker
sudo chown $USER:$USER /mnt/apps/mayhem-tracker /mnt/data/mayhem-tracker
git clone <your-repo-url> /mnt/apps/mayhem-tracker
cd /mnt/apps/mayhem-tracker
npm install
```

## 2. Build the web frontend

The server serves the built SPA itself, so it needs to exist before the service starts:

```bash
npm run build -w @mayhem-tracker/web
```

(Re-run this any time you pull web UI changes; the server (`npm run start`) reads source via `tsx` directly, no separate server build step needed.)

## 3. Install pm2 and start the app

```bash
sudo npm install -g pm2
cd /mnt/apps/mayhem-tracker
pm2 start deploy/ecosystem.config.cjs
pm2 status
```

It listens on `127.0.0.1:3001` only — not exposed externally. Data lives in `/mnt/data/mayhem-tracker` (set via `DATA_DIR` in `deploy/ecosystem.config.cjs`).

## 4. Make it survive a reboot

```bash
pm2 save
pm2 startup
```

`pm2 startup` prints a `sudo env PATH=... pm2 startup systemd -u svilen --hp /home/svilen` command — copy/paste and run exactly what it prints (it installs a systemd unit for pm2 itself, scoped to your user). Then `pm2 save` again if you add/change processes later, so the saved list stays current.

(`deploy/mayhem-tracker.service` is a plain-systemd alternative to pm2 if you ever want to drop pm2 — not needed if you're using pm2.)

## 5. nginx + TLS + Cloudflare

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/mayhem-tracker
sudo nano /etc/nginx/sites-available/mayhem-tracker   # set server_name to your real domain
sudo ln -s /etc/nginx/sites-available/mayhem-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Since you're proxying through Cloudflare, a few things differ from a plain nginx+certbot setup:

- **Getting a cert with the orange cloud on**: certbot's `--nginx` plugin does an HTTP-01 challenge directly against your server, which works fine *through* Cloudflare as long as the DNS record is proxied (orange cloud) — Cloudflare passes `/.well-known/acme-challenge/*` through unproxied-style. If it fails, temporarily set the DNS record to "DNS only" (grey cloud), run certbot, then re-enable the proxy:
  ```bash
  sudo certbot --nginx -d your.domain.com
  ```
- **Cloudflare SSL/TLS mode**: set it to **Full (strict)** in the Cloudflare dashboard (SSL/TLS → Overview) now that the origin has a real cert from certbot. Avoid "Flexible" — that leaves Cloudflare→origin traffic unencrypted.
- **Real visitor IPs**: nginx will otherwise log/see Cloudflare's IPs instead of actual visitors. Not critical for a friends-only tracker, but if you care, add Cloudflare's IP ranges as trusted and read `CF-Connecting-IP`:
  ```nginx
  # in the server block, or in a shared snippet
  real_ip_header CF-Connecting-IP;
  # plus set_real_ip_from for each Cloudflare CIDR — see https://www.cloudflare.com/ips/
  ```

Optional: uncomment the `auth_basic` lines in the nginx config for a single shared login across the whole site (since everyone's data is shared anyway, one login is enough — see `htpasswd` command in the comment). Alternatively, Cloudflare Access can gate this at the edge instead, if you'd rather not manage `.htpasswd`.

At this point `https://your.domain.com` should show the dashboard (empty until an agent reports games).

## 6. Mint an agent token per friend

```bash
cd /mnt/apps/mayhem-tracker
DATA_DIR=/mnt/data/mayhem-tracker npm run create-agent -w @mayhem-tracker/server -- "FriendName"
```

Prints a token. Repeat once per person (including yourself).

## 7. Build each friend's agent binary

The build must run on the same OS as the target — you can't cross-compile.

**Windows** (run on a Windows machine):
```powershell
cd packages\agent
npm run build-agent -- --server=https://your.domain.com --token=<token-from-step-6> --name=FriendName
```
Produces `packages/agent/dist/mayhem-agent-FriendName.exe`.

**Mac** (friend runs this on their own Mac):
```bash
cd packages/agent
npm run build-agent -- --server=https://your.domain.com --token=<token-from-step-6> --name=FriendName
```
Produces `packages/agent/dist/mayhem-agent-FriendName`. First run: right-click → Open → Open (Gatekeeper prompt, one time only).

Send the binary to your friend — no further setup needed. It registers itself to start automatically on login.

> **TODO**: Set up GitHub Actions to build all platform binaries in CI so you don't need each person to build their own. One workflow with `windows-latest`, `macos-latest`, `ubuntu-latest` runners, tokens as GitHub secrets, artifacts downloadable from the Actions UI.

## Updating later

```bash
cd /mnt/apps/mayhem-tracker
git pull
npm install
npm run build -w @mayhem-tracker/web
pm2 restart mayhem-tracker
```

## Maintenance

### Clear game data only (keep agent tokens)

Use this when you want a fresh start without having to rebuild and redistribute agent exes:

```bash
sqlite3 /mnt/data/mayhem-tracker/matches.db "DELETE FROM game_augments; DELETE FROM player_stats; DELETE FROM games; DELETE FROM summoner;"
```

### Full DB reset

Wipes everything including agent tokens — you'll need to re-mint tokens (step 6) and rebuild all agent exes (step 7) after this:

```bash
rm /mnt/data/mayhem-tracker/matches.db && pm2 restart mayhem-tracker
```

### Clear a Windows agent's local cache

The agent tracks which games it has already sent in `~/.mayhem-tracker-agent/state.json`. If the server DB was wiped, delete this file so the agent re-submits its history on the next poll:

```bash
rm ~/.mayhem-tracker-agent/state.json
```

### View agent logs

The agent writes logs to `~/.mayhem-tracker-agent/agent.log` on the user's Windows machine. Useful for debugging sync issues.

### Check server logs

```bash
pm2 logs mayhem-tracker --lines 50
sudo tail -50 /var/log/nginx/access.log
```
