#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path


STYLE_HREF_RE = re.compile(
    r'href="/_next/static/css/(?P<filename>[^"?]+\.css)(?:\?[^"]*)?"'
)
SCRIPT_PRELOAD_RE = re.compile(r'<link[^>]+rel="preload"[^>]+as="script"[^>]*\/?>')
SCRIPT_TAG_RE = re.compile(r"<script\b[^>]*>.*?</script>", re.DOTALL)
LOCAL_CSS_TOKEN = "__LOCAL_CSS_{}__"
NEXT_ROOT = "https://mobbin.com/_next/"


def rewrite_html(html: str) -> str:
    placeholders: list[tuple[str, str]] = []

    def stash_stylesheet(match: re.Match[str]) -> str:
        token = LOCAL_CSS_TOKEN.format(len(placeholders))
        replacement = f'href="./css/{match.group("filename")}"'
        placeholders.append((token, replacement))
        return token

    html = STYLE_HREF_RE.sub(stash_stylesheet, html)
    html = html.replace("/_next/", NEXT_ROOT)
    html = SCRIPT_PRELOAD_RE.sub("", html)
    html = SCRIPT_TAG_RE.sub("", html)

    for token, replacement in placeholders:
        html = html.replace(token, replacement)

    return html


def rewrite_css(css_text: str) -> str:
    return css_text.replace("/_next/", NEXT_ROOT)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: make_mobbin_snapshot_renderable.py <snapshot_dir>", file=sys.stderr)
        return 1

    snapshot_dir = Path(sys.argv[1]).resolve()
    index_path = snapshot_dir / "index.html"
    raw_index_path = snapshot_dir / "index.raw.html"
    css_dir = snapshot_dir / "css"

    if not index_path.exists():
        print(f"missing file: {index_path}", file=sys.stderr)
        return 1
    if not css_dir.exists():
        print(f"missing directory: {css_dir}", file=sys.stderr)
        return 1

    if not raw_index_path.exists():
        shutil.copy2(index_path, raw_index_path)

    html = raw_index_path.read_text(encoding="utf-8")
    index_path.write_text(rewrite_html(html), encoding="utf-8")

    for css_path in sorted(css_dir.glob("*.css")):
        css_text = css_path.read_text(encoding="utf-8")
        css_path.write_text(rewrite_css(css_text), encoding="utf-8")

    print(f"renderable snapshot updated: {snapshot_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
