#!/usr/bin/env bash
# Provision a fresh Ubuntu 24.04 VM to run Loop: Postgres + Caddy + a systemd
# service for the Go binary. Provider-agnostic — works on any Ubuntu host.
# Idempotent enough to re-run. Pass the DB password via env: DB_PASSWORD=... .
#
#   sudo DB_PASSWORD=xxxx bash provision.sh
set -euo pipefail

: "${DB_PASSWORD:?set DB_PASSWORD}"

echo ">>> apt base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https postgresql

echo ">>> caddy repo + install"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y
  apt-get install -y caddy
fi

echo ">>> goose (migration runner)"
if ! command -v goose >/dev/null; then
  GOOSE_VER=$(curl -fsSL https://api.github.com/repos/pressly/goose/releases/latest | grep -oP '"tag_name": "\K[^"]+')
  curl -fsSL "https://github.com/pressly/goose/releases/download/${GOOSE_VER}/goose_linux_x86_64" -o /usr/local/bin/goose
  chmod +x /usr/local/bin/goose
fi

echo ">>> loop system user + dirs"
id loop >/dev/null 2>&1 || useradd --system --home /opt/loop --shell /usr/sbin/nologin loop
mkdir -p /opt/loop /opt/loop/migrations /var/www/loop-dashboard
chown -R loop:loop /opt/loop

echo ">>> postgres role + db (idempotent)"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='loop'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE loop LOGIN PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='loop'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE loop OWNER loop;"
# keep password in sync if re-run
sudo -u postgres psql -c "ALTER ROLE loop PASSWORD '${DB_PASSWORD}';"

echo ">>> place Caddyfile + systemd unit (expected alongside this script)"
HERE="$(cd "$(dirname "$0")" && pwd)"
install -m 0644 "$HERE/Caddyfile" /etc/caddy/Caddyfile
install -m 0644 "$HERE/loop.service" /etc/systemd/system/loop.service
systemctl daemon-reload
systemctl enable caddy >/dev/null 2>&1 || true

echo ">>> provision complete. Run deploy.sh next to ship the binary + SPA."
