#!/usr/bin/env bash

set -euo pipefail

DOMAIN="portfolio.lawdigest.cloud"
DOC_ROOT="/var/www/${DOMAIN}"
CONF_NAME="${DOMAIN}"
NGINX_AVAIL="/etc/nginx/sites-available/${CONF_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${CONF_NAME}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="${REPO_DIR}/web"
SOURCE_HTML="${WEB_DIR}/index.html"
ASSETS_DIR="${REPO_DIR}/assets"
PUBLIC_DIR="${WEB_DIR}/public"
RESEARCH_DIR="${WEB_DIR}/research"

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
cp -f "$WEB_DIR/main.js" "$DOC_ROOT/main.js"
cp -f "$WEB_DIR/styles.css" "$DOC_ROOT/styles.css"

rm -rf "$DOC_ROOT/styles" "$DOC_ROOT/src" "$DOC_ROOT/research"
cp -a "$WEB_DIR/styles" "$DOC_ROOT/styles"
cp -a "$WEB_DIR/src" "$DOC_ROOT/src"

if [[ -d "$PUBLIC_DIR" ]]; then
  find "$PUBLIC_DIR" -maxdepth 1 -type f -exec cp -f {} "$DOC_ROOT/" \;
fi

if [[ -d "$ASSETS_DIR/logo" ]]; then
  mkdir -p "$DOC_ROOT/logo"
  cp -a "$ASSETS_DIR/logo/." "$DOC_ROOT/logo/"
fi

if [[ -d "$ASSETS_DIR/pdf" ]]; then
  mkdir -p "$DOC_ROOT/pdf"
  cp -a "$ASSETS_DIR/pdf/." "$DOC_ROOT/pdf/"
fi

if [[ -d "$ASSETS_DIR/project" ]]; then
  mkdir -p "$DOC_ROOT/project"
  cp -a "$ASSETS_DIR/project/." "$DOC_ROOT/project/"
fi

if [[ -d "$RESEARCH_DIR" ]]; then
  mkdir -p "$DOC_ROOT/research"
  cp -a "$RESEARCH_DIR/." "$DOC_ROOT/research/"
fi

find "$DOC_ROOT" -type d -exec chmod 755 {} +
find "$DOC_ROOT" -type f -exec chmod 644 {} +

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

    location ~ ^/(logo|pdf|project|styles|src|research)/ {
        try_files \$uri =404;
    }

    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;
}
NGINX

ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

echo "Deployment complete: https://${DOMAIN}"
