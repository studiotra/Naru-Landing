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

## Article CMS (Decap)

Upload and edit articles at:

**`https://narulanding.com/admin/`** (or `/admin/` on your Vercel preview URL)

### How it works

1. You write articles in the CMS (markdown + metadata + thumbnail).
2. Decap commits files to `content/articles/*.md` in GitHub.
3. Vercel runs `npm run build`, which generates:
   - `articles/[slug].html` — public article pages
   - `data/articles.json` — listing for the Insights section
4. The site updates automatically after deploy.

### One-time CMS setup (GitHub login)

Decap needs GitHub OAuth to save articles to your repo:

1. Create a **GitHub OAuth App** (Settings → Developer settings → OAuth Apps).
2. **Homepage URL:** `https://narulanding.com`
3. **Callback URL:** `https://api.netlify.com/auth/done`  
   (Netlify’s free OAuth bridge works with Vercel-hosted sites — see [Decap docs](https://decapcms.org/docs/authentication-backends/))
4. Open `/admin/` and sign in with GitHub when prompted.

### Local preview

```bash
cd github-publish
npm install
npm run build
npm run dev
```

Then open `http://localhost:8080` and `http://localhost:8080/admin/`.

### New article checklist

- Title, slug, excerpt, category, date
- Upload thumbnail (saved under `assets/uploads/`)
- Write body in markdown
- Set **Featured on homepage** if it should appear on the home Insights teaser
- Publish in CMS → wait for Vercel deploy (~1–2 min)

## Do not upload

- `recovery-codes.txt`, `.pptx`, `.docx`, meeting notes, or draft HTML variants (`Naru Landing KO.html`, etc.)
