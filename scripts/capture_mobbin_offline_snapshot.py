#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import hashlib
import json
import mimetypes
import posixpath
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from playwright.async_api import Page, Response, async_playwright


DEFAULT_URL = (
    "https://mobbin.com/"
    "?utm_source=siteinspire&utm_medium=referral&utm_campaign=partnerships"
)
RESOURCE_ATTRS = ("src", "poster", "imagesrcset", "srcset")
CSS_URL_RE = re.compile(r"url\((?P<quote>['\"]?)(?P<url>.*?)(?P=quote)\)")
CSS_IMPORT_RE = re.compile(r"@import\s+(?:url\()?[\"']?(?P<url>[^\"')]+)")


@dataclass
class ResourceRecord:
    url: str
    local_relpath: str
    content_type: str
    size: int


def sanitize_part(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-")
    return cleaned or "resource"


def extension_for(content_type: str, parsed_path: str) -> str:
    path_ext = Path(parsed_path).suffix.lower()
    content_type = (content_type or "").split(";")[0].strip().lower()
    special = {
        "application/javascript": ".js",
        "application/json": ".json",
        "application/wasm": ".wasm",
        "font/woff2": ".woff2",
        "font/woff": ".woff",
        "image/jpeg": ".jpg",
        "image/svg+xml": ".svg",
        "image/webp": ".webp",
        "text/css": ".css",
        "text/html": ".html",
        "text/javascript": ".js",
        "text/plain": ".txt",
        "video/mp4": ".mp4",
    }
    if content_type in special:
        content_ext = special[content_type]
    else:
        content_ext = mimetypes.guess_extension(content_type) or ""

    if content_ext:
        if not path_ext or path_ext != content_ext:
            return content_ext

    return path_ext or ".bin"


def build_local_relpath(url: str, content_type: str) -> str:
    parsed = urlparse(url)
    host = sanitize_part(parsed.netloc or "local")
    path_parts = [sanitize_part(part) for part in parsed.path.split("/") if part]
    if not path_parts:
        path_parts = ["index"]

    filename = path_parts[-1]
    stem = Path(filename).stem or "resource"
    ext = extension_for(content_type, parsed.path)
    hashed = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]

    if parsed.query:
        filename = f"{sanitize_part(stem)}--{hashed}{ext}"
    elif not Path(filename).suffix:
        filename = f"{sanitize_part(filename)}{ext}"

    path_parts[-1] = filename
    return posixpath.join("assets", host, *path_parts)


def to_local_url(local_relpath: str, current_relpath: str) -> str:
    current_dir = posixpath.dirname(current_relpath) or "."
    rel = posixpath.relpath(local_relpath, current_dir)
    return rel if rel != "." else "./"


def should_capture(response: Response) -> bool:
    resource_type = response.request.resource_type
    if resource_type in {"eventsource", "ping", "websocket"}:
        return False
    return response.status == 200


class SnapshotBuilder:
    def __init__(self, output_dir: Path, page_url: str) -> None:
        self.output_dir = output_dir
        self.page_url = page_url
        self.records: dict[str, ResourceRecord] = {}
        self.response_tasks: set[asyncio.Task[None]] = set()
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
            }
        )

    def register_bytes(self, url: str, content_type: str, body: bytes) -> None:
        if not body or url in self.records:
            return

        local_relpath = build_local_relpath(url, content_type)
        target = self.output_dir / local_relpath
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
        self.records[url] = ResourceRecord(
            url=url,
            local_relpath=local_relpath,
            content_type=content_type,
            size=len(body),
        )

    async def record_response(self, response: Response) -> None:
        if not should_capture(response):
            return
        try:
            body = await response.body()
        except Exception:
            return
        self.register_bytes(
            response.url,
            response.headers.get("content-type", ""),
            body,
        )

    async def load_page(self) -> str:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            page = await browser.new_page(viewport={"width": 1440, "height": 1200})
            page.on("response", self._queue_response_task)

            await page.goto(self.page_url, wait_until="load", timeout=120000)
            await page.wait_for_timeout(4000)
            await self.scroll_to_bottom(page)
            await page.wait_for_timeout(3000)

            html = await page.content()

            await browser.close()
            if self.response_tasks:
                await asyncio.gather(*sorted(self.response_tasks, key=id))
            return html

    def _queue_response_task(self, response: Response) -> None:
        task = asyncio.create_task(self.record_response(response))
        self.response_tasks.add(task)
        task.add_done_callback(self.response_tasks.discard)

    async def scroll_to_bottom(self, page: Page) -> None:
        previous_height = -1
        stable_rounds = 0

        while stable_rounds < 3:
            current_height = await page.evaluate("document.body.scrollHeight")
            if current_height == previous_height:
                stable_rounds += 1
            else:
                stable_rounds = 0

            previous_height = current_height
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1200)

        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(800)

    def fetch_missing_url(self, url: str) -> None:
        if not url or url in self.records:
            return
        if not url.startswith(("http://", "https://")):
            return

        response = self.session.get(url, timeout=60)
        response.raise_for_status()
        self.register_bytes(
            response.url,
            response.headers.get("content-type", ""),
            response.content,
        )

    def collect_resource_urls_from_html(self, html: str) -> set[str]:
        soup = BeautifulSoup(html, "html.parser")
        urls: set[str] = set()

        for tag in soup.find_all(True):
            for attr in RESOURCE_ATTRS:
                value = tag.get(attr)
                if not value:
                    continue
                if attr.endswith("srcset"):
                    urls.update(self._extract_srcset_urls(value, self.page_url))
                else:
                    urls.add(urljoin(self.page_url, value))

            if tag.name == "link" and "stylesheet" in (tag.get("rel") or []):
                href = tag.get("href")
                if href:
                    urls.add(urljoin(self.page_url, href))

            style_value = tag.get("style")
            if style_value:
                urls.update(self.collect_urls_from_css_text(style_value, self.page_url))

        for style_tag in soup.find_all("style"):
            urls.update(self.collect_urls_from_css_text(style_tag.get_text(), self.page_url))

        return {url for url in urls if url.startswith(("http://", "https://"))}

    def collect_urls_from_css_text(self, css_text: str, base_url: str) -> set[str]:
        urls: set[str] = set()
        for match in CSS_URL_RE.finditer(css_text):
            raw = match.group("url").strip()
            if raw.startswith(("data:", "blob:", "#")) or not raw:
                continue
            urls.add(urljoin(base_url, raw))

        for match in CSS_IMPORT_RE.finditer(css_text):
            raw = match.group("url").strip()
            if raw.startswith(("data:", "blob:", "#")) or not raw:
                continue
            urls.add(urljoin(base_url, raw))

        return urls

    def fetch_missing_css_dependencies(self) -> None:
        seen_css: set[str] = set()
        while True:
            added = 0
            css_records = [
                record
                for record in self.records.values()
                if record.content_type.split(";")[0].strip().lower() == "text/css"
                and record.url not in seen_css
            ]
            if not css_records:
                break

            for record in css_records:
                seen_css.add(record.url)
                css_path = self.output_dir / record.local_relpath
                css_text = css_path.read_text(encoding="utf-8", errors="ignore")
                for dependency_url in self.collect_urls_from_css_text(css_text, record.url):
                    if dependency_url not in self.records:
                        self.fetch_missing_url(dependency_url)
                        added += 1
            if added == 0:
                break

    def rewrite_css_files(self) -> None:
        css_records = [
            record
            for record in self.records.values()
            if record.content_type.split(";")[0].strip().lower() == "text/css"
        ]
        for record in css_records:
            css_path = self.output_dir / record.local_relpath
            css_text = css_path.read_text(encoding="utf-8", errors="ignore")
            css_text = self._rewrite_css_text(css_text, record.url, record.local_relpath)
            css_path.write_text(css_text, encoding="utf-8")

    def _rewrite_css_text(self, css_text: str, css_url: str, current_relpath: str) -> str:
        def replace_url(match: re.Match[str]) -> str:
            raw = match.group("url").strip()
            if raw.startswith(("data:", "blob:", "#")) or not raw:
                return match.group(0)
            absolute = urljoin(css_url, raw)
            record = self.records.get(absolute)
            if not record:
                return match.group(0)
            quote = match.group("quote") or ""
            local = to_local_url(record.local_relpath, current_relpath)
            return f"url({quote}{local}{quote})"

        return CSS_URL_RE.sub(replace_url, css_text)

    def build_html(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup.find_all(["script", "noscript", "iframe"]):
            tag.decompose()

        for tag in soup.find_all("link"):
            rel = set(tag.get("rel") or [])
            if "stylesheet" not in rel:
                tag.decompose()

        for tag in soup.find_all(True):
            if tag.name == "a":
                href = tag.get("href")
                if href and not href.startswith(("#", "mailto:", "tel:", "javascript:")):
                    tag["data-original-href"] = href
                    tag["href"] = "#"
                continue

            for attr in ("src", "poster"):
                value = tag.get(attr)
                if not value:
                    continue
                absolute = urljoin(self.page_url, value)
                record = self.records.get(absolute)
                if record:
                    tag[attr] = to_local_url(record.local_relpath, "index.html")

            for attr in ("srcset", "imagesrcset"):
                value = tag.get(attr)
                if not value:
                    continue
                tag[attr] = self._rewrite_srcset(value, "index.html")

            if tag.name == "link" and "stylesheet" in (tag.get("rel") or []):
                href = tag.get("href")
                if href:
                    absolute = urljoin(self.page_url, href)
                    record = self.records.get(absolute)
                    if record:
                        tag["href"] = to_local_url(record.local_relpath, "index.html")

            style_value = tag.get("style")
            if style_value:
                tag["style"] = self._rewrite_css_text(style_value, self.page_url, "index.html")

        for style_tag in soup.find_all("style"):
            style_tag.string = self._rewrite_css_text(
                style_tag.get_text(),
                self.page_url,
                "index.html",
            )

        return str(soup)

    def _extract_srcset_urls(self, srcset: str, base_url: str) -> set[str]:
        urls: set[str] = set()
        for part in srcset.split(","):
            candidate = part.strip()
            if not candidate:
                continue
            url = candidate.split()[0]
            urls.add(urljoin(base_url, url))
        return urls

    def _rewrite_srcset(self, srcset: str, current_relpath: str) -> str:
        parts: list[str] = []
        for part in srcset.split(","):
            candidate = part.strip()
            if not candidate:
                continue
            chunks = candidate.split()
            url = chunks[0]
            descriptor = " ".join(chunks[1:])
            absolute = urljoin(self.page_url, url)
            record = self.records.get(absolute)
            if record:
                rewritten_url = to_local_url(record.local_relpath, current_relpath)
                parts.append(" ".join(filter(None, [rewritten_url, descriptor])))
            else:
                parts.append(candidate)
        return ", ".join(parts)

    def write_manifest(self) -> None:
        manifest_path = self.output_dir / "snapshot-manifest.json"
        payload = {
            "page_url": self.page_url,
            "resource_count": len(self.records),
            "resources": [
                {
                    "url": record.url,
                    "local_relpath": record.local_relpath,
                    "content_type": record.content_type,
                    "size": record.size,
                }
                for record in sorted(self.records.values(), key=lambda item: item.local_relpath)
            ],
        }
        manifest_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")


async def run(output_dir: Path, page_url: str) -> None:
    builder = SnapshotBuilder(output_dir, page_url)
    output_dir.mkdir(parents=True, exist_ok=True)

    html = await builder.load_page()
    (output_dir / "index.live.html").write_text(html, encoding="utf-8")

    for url in sorted(builder.collect_resource_urls_from_html(html)):
        if url not in builder.records:
            try:
                builder.fetch_missing_url(url)
            except Exception:
                continue

    builder.fetch_missing_css_dependencies()
    builder.rewrite_css_files()

    offline_html = builder.build_html(html)
    (output_dir / "index.html").write_text(offline_html, encoding="utf-8")
    builder.write_manifest()


def main(argv: Iterable[str]) -> int:
    args = list(argv)
    if len(args) < 2:
        print(
            "usage: capture_mobbin_offline_snapshot.py <output_dir> [page_url]",
            file=sys.stderr,
        )
        return 1

    output_dir = Path(args[1]).resolve()
    page_url = args[2] if len(args) > 2 else DEFAULT_URL
    asyncio.run(run(output_dir, page_url))
    print(f"offline snapshot written to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
