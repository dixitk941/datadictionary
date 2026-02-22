#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DataDict AI – VPS deploy script
# Run on the server as root (or a sudo user):
#   bash deploy.sh
#
# Safe to re-run — it updates an existing install without disturbing other sites.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="https://github.com/dixitk941/datadictionary.git"
DEPLOY_DIR="/var/www/datadictionary"
BACKEND_DIR="$DEPLOY_DIR/backend"
SERVICE="datadictionary-api"
NGINX_CONF="nginx-api.aitoolcraft.com.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/api.aitoolcraft.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/api.aitoolcraft.com"

echo ""
echo "═══════════════════════════════════════"
echo " DataDict AI — VPS Deploy"
echo "═══════════════════════════════════════"
echo ""

# ── 1. System packages ────────────────────────────────────────────────────────
echo "[1/7] Installing system deps..."
apt-get update -qq
apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv python3-dev \
    gcc g++ libpq-dev freetds-dev git nginx curl > /dev/null

# ── 2. Clone or pull ──────────────────────────────────────────────────────────
echo "[2/7] Fetching latest code..."
if [ -d "$DEPLOY_DIR/.git" ]; then
    git -C "$DEPLOY_DIR" pull --ff-only
else
    git clone "$REPO" "$DEPLOY_DIR"
fi

# ── 3. Python virtualenv + dependencies ───────────────────────────────────────
echo "[3/7] Installing Python packages..."
python3 -m venv "$BACKEND_DIR/venv"
"$BACKEND_DIR/venv/bin/pip" install --upgrade pip -q
"$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q

# ── 4. .env file ──────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo ""
    echo "[4/7] No .env found — creating from example."
    echo "      *** Edit $BACKEND_DIR/.env and add your MISTRAL_API_KEY ***"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
else
    echo "[4/7] .env already exists — skipping (not overwriting)."
fi

# Ensure CORS includes production domain
grep -q "CORS_ORIGINS_EXTRA" "$BACKEND_DIR/.env" || \
    echo "CORS_ORIGINS_EXTRA=https://aitoolcraft.com,https://www.aitoolcraft.com" \
    >> "$BACKEND_DIR/.env"

# ── 5. Ownership ──────────────────────────────────────────────────────────────
echo "[5/7] Setting file ownership..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 750 "$BACKEND_DIR"
chmod 640 "$BACKEND_DIR/.env"

# ── 6. systemd service ────────────────────────────────────────────────────────
echo "[6/7] Installing systemd service..."
cp "$BACKEND_DIR/datadictionary-api.service" /etc/systemd/system/"$SERVICE".service
systemctl daemon-reload
systemctl enable "$SERVICE"
systemctl restart "$SERVICE"
sleep 2
systemctl is-active --quiet "$SERVICE" && echo "    ✓ Service running" || \
    { echo "    ✗ Service failed — check: journalctl -u $SERVICE -n 40"; exit 1; }

# ── 7. nginx site (isolated — other sites untouched) ─────────────────────────
echo "[7/7] Configuring nginx..."
cp "$BACKEND_DIR/$NGINX_CONF" "$NGINX_AVAILABLE"
[ -L "$NGINX_ENABLED" ] || ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"

nginx -t && systemctl reload nginx && echo "    ✓ nginx reloaded"

echo ""
echo "═══════════════════════════════════════"
echo " Deploy complete!"
echo ""
echo " Backend : http://127.0.0.1:8432"
echo " Public  : https://api.aitoolcraft.com"
echo ""
echo " Next steps:"
echo "  1. Add your MISTRAL_API_KEY to $BACKEND_DIR/.env"
echo "     then: systemctl restart $SERVICE"
echo "  2. Add DNS A record in Cloudflare:"  
echo "     api.aitoolcraft.com → 45.148.244.104 (Proxied ON)"
echo "  3. (Optional) Get free SSL:"
echo "     certbot --nginx -d api.aitoolcraft.com"
echo "═══════════════════════════════════════"
