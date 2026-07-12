# Operating the Loop VM (prod)

Host: GCP `loop-vm`, zone `asia-south1-a`, project `loop-prod-479c9c`, IP `8.231.125.168`,
site `https://app.loop.lmk.co.in`. The server runs as a **systemd service** (`loop`) —
it auto-starts on boot and auto-restarts on crash. Do **not** `make run` here.

## Access
`gcloud compute config-ssh` writes an SSH host entry, so plain ssh works:
```bash
ssh loop-vm.asia-south1-a.loop-prod-479c9c
```
Handy aliases (~/.zshrc):
```bash
alias loop-ssh='ssh loop-vm.asia-south1-a.loop-prod-479c9c'
alias loop-logs='ssh loop-vm.asia-south1-a.loop-prod-479c9c "sudo journalctl -u loop -f"'
```

## Logs & service
```bash
sudo journalctl -u loop -f                 # live server logs (≈ watching make run)
sudo journalctl -u loop -f | grep -i webhook
sudo journalctl -u loop -n 50 --no-pager   # recent
sudo systemctl status loop                 # status
sudo systemctl restart loop                # restart
sudo journalctl -u caddy -f                # TLS / reverse-proxy logs
```

## Database
```bash
sudo -u postgres psql loop
sudo -u postgres psql loop -c "SELECT username,external_account_id,ig_id,status FROM connections;"
```

## Deploy a new build (from your Mac, in ~/loop/deploy/)
```bash
./deploy.sh    # build dashboard + Go, ship, goose migrate, restart loop + caddy
```
Config lives in `/opt/loop/.env` on the VM (0640, never committed). Edit + `sudo systemctl restart loop` to apply.
