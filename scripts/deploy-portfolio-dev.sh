#!/usr/bin/env bash

set -euo pipefail

DOMAIN="portfolio.lawdigest.cloud"
PORT="8878"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="portfolio-web-dev"
NGINX_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
APP_USER="ubuntu"
NODE_BIN="/home/ubuntu/.nvm/versions/node/v22.17.1/bin"
PM2_ENV="PATH=${NODE_BIN}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin PM2_HOME=/home/ubuntu/.pm2"
ADMIN_ENV_FILE="${REPO_DIR}/.runtime/portfolio-admin.env"
ADMIN_USERNAME="libera3920"
ADMIN_PASSWORD='parkmj9260!portfolio'

if [[ $EUID -ne 0 ]]; then
  echo "이 스크립트는 root 권한으로 실행하세요: sudo $0" >&2
  exit 1
fi

cd "$REPO_DIR"

mkdir -p "$(dirname "$ADMIN_ENV_FILE")"
chown "$APP_USER:$APP_USER" "$(dirname "$ADMIN_ENV_FILE")"
if [[ -f "$ADMIN_ENV_FILE" ]]; then
  set -a
  source "$ADMIN_ENV_FILE"
  set +a
fi
if [[ -z "${PORTFOLIO_ADMIN_SESSION_SECRET:-}" ]]; then
  ADMIN_SESSION_SECRET="$(openssl rand -hex 32 | tr -d '\n')"
else
  ADMIN_SESSION_SECRET="$PORTFOLIO_ADMIN_SESSION_SECRET"
fi
{
  printf 'PORTFOLIO_ADMIN_USERNAME=%q\n' "$ADMIN_USERNAME"
  printf 'PORTFOLIO_ADMIN_PASSWORD=%q\n' "$ADMIN_PASSWORD"
  printf 'PORTFOLIO_ADMIN_SESSION_SECRET=%q\n' "$ADMIN_SESSION_SECRET"
} > "$ADMIN_ENV_FILE"
chmod 600 "$ADMIN_ENV_FILE"
chown "$APP_USER:$APP_USER" "$ADMIN_ENV_FILE"

set -a
source "$ADMIN_ENV_FILE"
set +a

if [[ ! -d node_modules ]]; then
  sudo -u "$APP_USER" env PATH="${NODE_BIN}:$PATH" npm install
fi

sudo -u "$APP_USER" env PATH="${NODE_BIN}:$PATH" npm run patch:react-grab

if sudo -u "$APP_USER" env $PM2_ENV pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  sudo -u "$APP_USER" env $PM2_ENV PORTFOLIO_ADMIN_USERNAME="$PORTFOLIO_ADMIN_USERNAME" PORTFOLIO_ADMIN_PASSWORD="$PORTFOLIO_ADMIN_PASSWORD" PORTFOLIO_ADMIN_SESSION_SECRET="$PORTFOLIO_ADMIN_SESSION_SECRET" pm2 restart "$APP_NAME" --update-env
else
  sudo -u "$APP_USER" env $PM2_ENV PORTFOLIO_ADMIN_USERNAME="$PORTFOLIO_ADMIN_USERNAME" PORTFOLIO_ADMIN_PASSWORD="$PORTFOLIO_ADMIN_PASSWORD" PORTFOLIO_ADMIN_SESSION_SECRET="$PORTFOLIO_ADMIN_SESSION_SECRET" pm2 start "${NODE_BIN}/npm" --name "$APP_NAME" -- run dev
fi

cat > "$NGINX_AVAIL" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;
}
NGINX

ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

echo "Development deployment complete: https://${DOMAIN}"
echo "Admin login: https://${DOMAIN}/admin/login"
echo "Admin password file: ${ADMIN_ENV_FILE}"
