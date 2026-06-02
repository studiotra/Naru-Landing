# Naru Landing — GitHub Pages

Static site for [narulanding.com](https://narulanding.com). Upload **this folder only** as the repository root (or push its contents to an empty repo).

## What’s included

```
index.html
colors_and_type.css
naru-i18n.js
assets/                 (includes k-tech-carbon-bridge-guide.pdf)
articles/
Brand fonts/
```

## Deploy on Vercel

This repo is configured for Vercel with:

- **Build command:** `npm run build`
- **Output directory:** `.` (repo root — not `public`)

If the dashboard still shows **Output Directory: `public`**, change it to **`.`** or leave blank so `vercel.json` applies. See [Vercel: missing public directory](https://vercel.com/docs/errors/error-list#missing-public-directory).

## Publish on GitHub Pages

1. Create a new GitHub repository (e.g. `narulanding` or `narulanding-site`).
2. Upload **everything inside** `github-publish/` to the repo root — not the parent Google Drive folder.
3. In the repo: **Settings → Pages → Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
4. Save. After a minute or two, the site is live at `https://<username>.github.io/<repo>/`.

### Custom domain (optional)

In **Settings → Pages**, set **Custom domain** to `narulanding.com` and add the DNS records GitHub shows (usually `A` records + `CNAME` for `www`).

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Updating the live site

After editing the main project files, refresh this bundle by copying again from the parent folder:

- `index.html`, `colors_and_type.css`, `naru-i18n.js`
- `assets/`, `articles/`
- Font files under `Brand fonts/` (see parent `.gitignore` / project notes)

Commit and push to GitHub; Pages redeploys automatically.

## Vercel + Resend lead magnet capture

This repo now includes `api/lead-magnet.js` (a Vercel Serverless Function) to store lead-magnet emails in Resend before opening the PDF.

Set these environment variables in Vercel Project Settings:

- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`

Then redeploy. The front-end posts to `/api/lead-magnet` and opens `assets/k-tech-carbon-bridge-guide.pdf` on success.

## Article CMS (Supabase)

Articles are stored in **Supabase** and served at runtime — no redeploy needed when you publish.

The Vercel **Supabase** integration should already inject:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

For local seeding, also set `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API).

### One-time database setup

1. In [Supabase](https://supabase.com/dashboard) → **SQL Editor**, run the contents of `supabase/schema.sql`.
2. Seed your first article from the repo markdown (optional):

```bash
cd github-publish
npm install
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npm run seed:articles
```

Or add rows manually in **Table Editor** → `articles`.

### Managing content

Open **Supabase → Table Editor → `articles`**. Fields:

| Column | Notes |
|--------|--------|
| `slug` | URL path, e.g. `my-new-post` → `/articles/my-new-post` |
| `title`, `excerpt`, `category`, `author`, `read_time` | Listing + hero |
| `body` | Markdown |
| `thumbnail` | Path like `assets/my-thumb.png` or full URL |
| `featured` | Homepage teaser |
| `published` | Must be `true` to appear on the site |
| `published_at` | Shown date |

Changes go live within about a minute (API cache). No git commit required.

### How the site loads articles

- **Listings:** `GET /api/articles` → home + insights sections
- **Article page:** `/articles/[slug]` → `articles/view.html` + `GET /api/article?slug=...`
- **Fallback:** If Supabase is empty or unavailable, the build still generates `data/articles.json` from `content/articles/*.md`

### Legacy Decap CMS (optional)

`/admin/` (Decap + GitHub) still works if you prefer git-based drafts. For production, use Supabase as the source of truth and set `published = true` there after editing.

## Do not upload

- `recovery-codes.txt`, `.pptx`, `.docx`, meeting notes, or draft HTML variants (`Naru Landing KO.html`, etc.)
