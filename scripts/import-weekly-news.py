#!/usr/bin/env python3
"""Import Weekly News HTML articles into assets/data/posts.json."""
import json
import re
import pathlib
import html as html_lib

ROOT = pathlib.Path(__file__).resolve().parents[1]
WEEKLY = ROOT.parent / "Weekly News"
POSTS_PATH = ROOT / "assets/data/posts.json"

SLUG_OVERRIDES = {
    "2026-08-17-ai-energy-infrastructure-korea-north-america.html": "firm-clean-power-ai-bottleneck",
    "2026-07-13-ai-power-infrastructure-korea-canada.html": "ai-power-stack-korea-compute-build-out-july-2026",
    "2026-07-20-ai-power-infrastructure-korea-canada.html": "power-becomes-ai-bottleneck-korea-grid-july-2026",
}

COVER_BY_SLUG = {
    "deliverable-megawatts-ai-infrastructure-korea-north-america": "assets/imgs/blog/blog-11.webp",
    "ai-power-infrastructure-korea-north-america": "assets/imgs/blog/blog-10.webp",
    "firm-clean-power-ai-bottleneck": "assets/imgs/blog/blog-9.webp",
    "ai-power-race-korea-north-america": "assets/imgs/blog/blog-8.webp",
    "ai-energy-infrastructure-korea-north-america": "assets/imgs/blog/blog-7.webp",
    "ai-power-stack-korea-compute-build-out-july-2026": "assets/imgs/blog/blog-6.webp",
    "power-becomes-ai-bottleneck-korea-grid-july-2026": "assets/imgs/blog/blog-12.webp",
    "2026-07-13-ai-power-infrastructure-korea-canada": "assets/imgs/blog/blog-6.webp",
    "2026-07-20-ai-power-infrastructure-korea-canada": "assets/imgs/blog/blog-12.webp",
}


def extract_slug(text: str, filename: str) -> str:
    if filename in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[filename]
    m = re.search(r"Suggested Slug:\s*</strong>\s*([^<]+)", text, re.I)
    if not m:
        m = re.search(r"Suggested Slug:\s*([a-z0-9-]+)", text, re.I)
    if m:
        return m.group(1).strip()
    base = filename.replace(".html", "")
    if re.match(r"\d{4}-\d{2}-\d{2}-", base):
        return base
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")


def extract_title(text: str) -> str:
    m = re.search(r'id="article-title"[^>]*>([^<]+)', text)
    if m:
        return html_lib.unescape(m.group(1).strip())
    m = re.search(r'class="article-title[^"]*"[^>]*>([^<]+)', text)
    if m:
        return html_lib.unescape(m.group(1).strip())
    m = re.search(r'<h1 class="display">([^<]+)', text)
    if m:
        return html_lib.unescape(m.group(1).strip())
    m = re.search(r"<title>([^<]+?)\s*[-—]", text)
    if m:
        return html_lib.unescape(m.group(1).strip())
    return ""


def extract_meta_description(text: str) -> str:
    m = re.search(r'name="description"\s+content="([^"]+)"', text)
    if m:
        return html_lib.unescape(m.group(1).strip())
    return ""


def extract_body_html(text: str) -> str:
    body = ""
    for marker in (
        '<div class="article-body" id="article-body">',
        '<div class="article-body">',
    ):
        i = text.find(marker)
        if i >= 0:
            start = i + len(marker)
            end = len(text)
            for end_marker in ('<div class="article-cta">', '<section class="cta">'):
                j = text.find(end_marker, start)
                if j >= 0:
                    end = min(end, j)
            body = text[start:end].strip()
            break
    if not body:
        m = re.search(
            r'<article class="article cms-body">(.*?)</article>',
            text,
            re.S,
        )
        if m:
            body = m.group(1).strip()
    if not body:
        return ""
    body = re.split(r"<h2>\s*SEO\s*</h2>", body, flags=re.I)[0]
    body = re.split(r"<section class=\"cta\">", body, flags=re.I)[0]
    body = body.strip()
    # normalize whitespace between tags lightly
    body = re.sub(r"\s*\n\s*", " ", body)
    body = re.sub(r">\s+<", "><", body)
    return body


def extract_date(filename: str) -> str:
    m = re.match(r"(\d{4}-\d{2}-\d{2})-", filename)
    return m.group(1) if m else "2026-01-01"


def excerpt_from_body(body: str, meta: str) -> str:
    if meta:
        return meta[:320]
    plain = re.sub(r"<[^>]+>", " ", body)
    plain = re.sub(r"\s+", " ", plain).strip()
    if len(plain) > 280:
        return plain[:277].rsplit(" ", 1)[0] + "…"
    return plain


def main():
    posts = json.loads(POSTS_PATH.read_text(encoding="utf-8"))
    existing = {p["slug"] for p in posts}
    added = []

    for path in sorted(WEEKLY.glob("*.html")):
        raw = path.read_text(encoding="utf-8")
        filename = path.name
        slug = extract_slug(raw, filename)
        if slug in existing:
            print("skip (exists):", slug)
            continue
        title = extract_title(raw)
        if not title:
            print("skip (no title):", filename)
            continue
        body = extract_body_html(raw)
        if not body or len(body) < 200:
            print("skip (no body):", filename)
            continue
        meta = extract_meta_description(raw)
        cover = COVER_BY_SLUG.get(slug, "assets/imgs/blog/blog-5.webp")
        entry = {
            "slug": slug,
            "title": title,
            "category": "Market Trends",
            "date": extract_date(filename),
            "author": "Naru",
            "cover": cover,
            "excerpt": excerpt_from_body(body, meta),
            "body": body,
        }
        posts.append(entry)
        existing.add(slug)
        added.append(slug)
        print("added:", slug)

    posts.sort(key=lambda p: p.get("date", ""), reverse=True)
    POSTS_PATH.write_text(
        json.dumps(posts, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Total posts:", len(posts), "| New:", len(added))


if __name__ == "__main__":
    main()
