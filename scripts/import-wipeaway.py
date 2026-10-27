#!/usr/bin/env python3
"""Inventory WipeAway.ca and copy its first-party image assets locally."""

from __future__ import annotations

import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ORIGIN = "https://wipeaway.ca"
ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "legacy-assets"
CONTENT_DIR = ROOT / "content"
USER_AGENT = "Mozilla/5.0 (compatible; WipeAway site migration)"
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


class ContentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.capture: str | None = None
        self.buffer: list[str] = []
        self.sections: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.title = ""
        self.description = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in {"title", "h1", "h2", "h3", "p", "li"}:
            self.capture = tag
            self.buffer = []
        if tag == "meta" and values.get("name") == "description":
            self.description = values.get("content") or ""
        if tag == "a" and values.get("href"):
            self.links.append({"href": values.get("href") or "", "text": ""})
        if tag == "img":
            source = values.get("data-original") or values.get("src") or ""
            if source:
                self.images.append({"src": source, "alt": values.get("alt") or ""})

    def handle_data(self, data: str) -> None:
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.capture == tag:
            text = " ".join("".join(self.buffer).split())
            if text:
                if tag == "title":
                    self.title = text
                else:
                    self.sections.append({"tag": tag, "text": text})
            self.capture = None
            self.buffer = []


def clean_asset_url(url: str) -> str | None:
    url = html.unescape(url).strip("'\" )")
    if url.startswith("//"):
        url = "https:" + url
    if not url.startswith("http"):
        return None
    parsed = urllib.parse.urlsplit(url)
    if parsed.hostname not in {"wipeaway.ca", "static.tildacdn.one", "thb.tildacdn.one"}:
        return None
    path = parsed.path.lower()
    if not path.endswith(IMAGE_EXTENSIONS):
        return None
    if parsed.hostname == "thb.tildacdn.one":
        path_parts = [part for part in parsed.path.split("/") if part]
        if "empty" in path_parts or "resize" in parsed.path or "resizeb" in parsed.path:
            if len(path_parts) >= 2:
                url = f"https://static.tildacdn.one/{path_parts[0]}/{path_parts[-1]}"
    return url


def local_name(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    original = Path(parsed.path).name
    stem = re.sub(r"[^a-z0-9]+", "-", Path(original).stem.lower()).strip("-")[:48] or "asset"
    suffix = Path(original).suffix.lower() or ".bin"
    digest = hashlib.sha1(url.encode()).hexdigest()[:10]
    return f"{stem}-{digest}{suffix}"


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    sitemap = ET.fromstring(fetch(f"{ORIGIN}/sitemap.xml"))
    urls = [node.text or "" for node in sitemap.iter() if node.tag.endswith("loc")]
    pages: list[dict[str, object]] = []
    asset_urls: set[str] = set()

    for index, url in enumerate(urls, 1):
        body = fetch(url).decode("utf-8", errors="replace")
        parser = ContentParser()
        parser.feed(body)
        for candidate in re.findall(r"https?://[^\s\"'<>]+", body):
            cleaned = clean_asset_url(candidate)
            if cleaned:
                asset_urls.add(cleaned)
        pages.append({
            "url": url,
            "path": urllib.parse.urlsplit(url).path or "/",
            "title": parser.title,
            "description": parser.description,
            "sections": parser.sections,
            "links": parser.links,
            "images": parser.images,
        })
        print(f"[{index}/{len(urls)}] {url}")
        time.sleep(0.05)

    mapping: dict[str, str] = {}
    failures: list[dict[str, str]] = []
    for index, url in enumerate(sorted(asset_urls), 1):
        filename = local_name(url)
        try:
            data = fetch(url)
            (ASSET_DIR / filename).write_bytes(data)
            mapping[url] = f"/legacy-assets/{filename}"
        except Exception as exc:
            failures.append({"url": url, "error": str(exc)})
        if index % 25 == 0 or index == len(asset_urls):
            print(f"assets {index}/{len(asset_urls)}")

    inventory = {
        "source": ORIGIN,
        "pages": pages,
        "asset_mapping": mapping,
        "asset_failures": failures,
    }
    (CONTENT_DIR / "wipeaway-inventory.json").write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"pages": len(pages), "assets": len(mapping), "failures": len(failures)}))


if __name__ == "__main__":
    main()
