#!/usr/bin/env bash

set -euo pipefail

DOMAIN="portfolio.lawdigest.cloud"
DOC_ROOT="/var/www/${DOMAIN}"
CONF_NAME="${DOMAIN}"
NGINX_AVAIL="/etc/nginx/sites-available/${CONF_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${CONF_NAME}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_HTML="${REPO_DIR}/web/index.html"

if [[ $EUID -ne 0 ]]; then
  echo "이 스크립트는 root 권한으로 실행하세요: sudo $0" >&2
  exit 1
fi

if [[ ! -f "$SOURCE_HTML" ]]; then
  echo "소스 파일이 없습니다: $SOURCE_HTML" >&2
  exit 1
fi

mkdir -p "$DOC_ROOT"
cp -f "$SOURCE_HTML" "$DOC_ROOT/index.html"

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

    root ${DOC_ROOT};
    index index.html;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;
}
NGINX

ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

echo "Deployment complete: https://${DOMAIN}"
