# Deploying to your Ubuntu server

App code lives at `/mnt/apps/mayhem-tracker`, the SQLite DB at `/mnt/data/mayhem-tracker` — separate mounts, set via `DATA_DIR` in the systemd unit.

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

## 3. Create a dedicated user (optional but recommended)

```bash
sudo useradd -r -s /usr/sbin/nologin mayhem
sudo chown -R mayhem:mayhem /mnt/apps/mayhem-tracker /mnt/data/mayhem-tracker
```

If you'd rather run it as yourself, just change `User=` in the systemd unit below to your username.

## 4. Install the systemd service

```bash
sudo cp deploy/mayhem-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mayhem-tracker
sudo systemctl status mayhem-tracker
```

It listens on `127.0.0.1:3001` only — not exposed externally. Data lives in `/mnt/data/mayhem-tracker` (set via `DATA_DIR` in the unit file).

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

## 7. Build each friend's agent exe

Build this part **on a Windows machine** (the exe is Windows-only for now) — your own laptop is fine:

```powershell
cd packages\agent
npm run build-agent -- --server=https://your.domain.com --token=<token-from-step-6> --name=FriendName
```

Produces `packages/agent/dist/mayhem-agent-FriendName.exe`. Send that single file to them — no further setup, just run it once (League must be installed; it doesn't need to be open yet, the agent will keep retrying until it is). It registers itself to start automatically on login.

## Updating later

```bash
cd /mnt/apps/mayhem-tracker
git pull
npm install
npm run build -w @mayhem-tracker/web
sudo systemctl restart mayhem-tracker
```
