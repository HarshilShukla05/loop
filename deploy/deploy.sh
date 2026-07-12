#!/usr/bin/env bash
# Build + ship Loop to the VM: dashboard SPA, Go binary, migrations. Then run
# migrations and restart services. Re-runnable for every release.
# Access is via gcloud SSH (override VM/ZONE env to point elsewhere).
#
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
ZONE="${ZONE:-asia-south1-a}"
VM="${VM:-loop-vm}"

echo ">>> build dashboard (single-origin: relative API base)"
( cd ../dashboard && VITE_API_URL="" VITE_LANDING_URL="https://loop.lmk.co.in" npm run build )

echo ">>> cross-compile server (linux/amd64, static)"
( cd ../server && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o /tmp/loop-server ./cmd/server )

echo ">>> package"
rm -rf /tmp/loop-pkg && mkdir -p /tmp/loop-pkg/dist /tmp/loop-pkg/migrations
cp -r ../dashboard/dist/* /tmp/loop-pkg/dist/
cp /tmp/loop-server /tmp/loop-pkg/
cp ../server/db/migrations/*.sql /tmp/loop-pkg/migrations/
COPYFILE_DISABLE=1 tar --no-xattrs -C /tmp/loop-pkg -czf /tmp/loop-pkg.tgz .

echo ">>> ship"
gcloud compute scp --zone="$ZONE" /tmp/loop-pkg.tgz "$VM":/tmp/loop-pkg.tgz

echo ">>> install + migrate + restart"
gcloud compute ssh "$VM" --zone="$ZONE" --command='
  set -e
  rm -rf /tmp/loop-pkg && mkdir -p /tmp/loop-pkg && tar -C /tmp/loop-pkg -xzf /tmp/loop-pkg.tgz
  sudo install -m 0755 -o loop -g loop /tmp/loop-pkg/loop-server /opt/loop/loop-server
  sudo rsync -a --delete /tmp/loop-pkg/migrations/ /opt/loop/migrations/
  sudo rsync -a --delete /tmp/loop-pkg/dist/ /var/www/loop-dashboard/
  sudo chown -R loop:loop /opt/loop
  sudo bash -c "set -a; source /opt/loop/.env; set +a; goose -dir /opt/loop/migrations postgres \"\$DATABASE_URL\" up"
  sudo systemctl restart loop
  sudo systemctl reload caddy || sudo systemctl restart caddy
  sleep 1; systemctl is-active loop caddy
'
echo ">>> deployed."
