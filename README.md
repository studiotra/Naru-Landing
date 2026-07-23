# Naru Landing — GitHub Pages / Vercel deploy bundle

Static site for [narulanding.com](https://narulanding.com). Push **this folder** to [studiotra/Naru-Landing](https://github.com/studiotra/Naru-Landing).

## Site structure

```
index.html              Homepage
about.html              About
services.html           Services
insights.html           Insights list
insight-detail.html     Article detail (?slug=...)
contact.html            Contact form
newsletter.html         Newsletter / lead magnet landing page
privacy-policy.html     Privacy policy
admin.html              Blog admin (local drafts → export JSON)
assets/
  css/naru-overrides.css
  data/posts.json       Published insights (EN)
  data/posts-kr.json    Korean insight copy
  js/naru-blog.js       Blog renderer
  js/naru-posts-seed.js Embedded posts (works without fetch)
api/                    Vercel serverless (contact + newsletter via Resend)
```

## Deploy on Vercel

1. Connect repo **studiotra/Naru-Landing** to Vercel.
2. **Output directory:** `.` (root)
3. No build step required for the static HTML.
4. Set environment variables (Production):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Contact form + newsletter emails |
| `CONTACT_TO_EMAIL` | Inbox for contact form + subscriber alerts (default: `info@narulanding.com`) |
| `CONTACT_FROM_EMAIL` | Verified sender on `narulanding.com` |
| `NEWSLETTER_FROM_EMAIL` | Optional sender override for welcome emails |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Resend segment/audience for newsletter contacts |
| `RESEND_SEGMENT_ID` | Fallback segment if newsletter segment is not set |

Contact form POSTs to `/api/contact`. Newsletter signup POSTs to `/api/newsletter` and sends an automated welcome email plus an internal notification.

## Local preview

```bash
npx serve . -p 8080
```

Open `http://localhost:8080`

## Updating insights

1. Edit `assets/data/posts.json` and `assets/data/posts-kr.json`, **or**
2. Use `admin.html` locally, export JSON, and commit.
3. Regenerate seed (optional, for offline preview):

```bash
python3 -c "
import json, pathlib
root = pathlib.Path('assets/data')
posts = json.load(open(root/'posts.json'))
kr = json.load(open(root/'posts-kr.json'))
out = pathlib.Path('assets/js/naru-posts-seed.js')
out.write_text(
  'window.NARU_POSTS_SEED = ' + json.dumps(posts, ensure_ascii=False) + ';\\n'
  'window.NARU_POSTS_KR_SEED = ' + json.dumps(kr, ensure_ascii=False) + ';\\n',
  encoding='utf-8')
"
```

## Push updates

```bash
git add -A
git commit -m "Describe your change"
git push origin main
```

Vercel redeploys automatically after push.
