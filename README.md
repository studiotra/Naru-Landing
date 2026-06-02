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

## Vercel Web Analytics

The site includes the [Vercel Web Analytics](https://vercel.com/docs/analytics/quickstart) script on all public pages (`partials/vercel-analytics.html`).

1. In Vercel → **naru-landing** → **Analytics** → enable **Web Analytics**.
2. Redeploy so the `/_vercel/insights/script.js` endpoint is active.
3. View traffic at [your project analytics](https://vercel.com/studiotrapetra-5132s-projects/naru-landing/analytics).

No npm package required for this static HTML setup.

## Article CMS (Decap)

Upload and edit articles at **[narulanding.com/admin](https://narulanding.com/admin/)**.

### How it works

1. Sign in with GitHub at `/admin/`.
2. Write articles in the CMS (markdown + metadata + thumbnail).
3. Decap commits to `content/articles/*.md` in GitHub.
4. Vercel runs `npm run build`, generating `articles/[slug].html` and `data/articles.json`.
5. The site updates after deploy (~1–2 min).

### One-time GitHub OAuth setup (Vercel)

The Netlify OAuth bridge (`api.netlify.com`) only works for Netlify-hosted sites. This project uses **`api/oauth.js`** on Vercel instead.

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   - **Application name:** Naru CMS
   - **Homepage URL:** `https://narulanding.com`
   - **Authorization callback URL:** `https://narulanding.com/api/oauth`
2. Copy the **Client ID** and generate a **Client secret**.
3. In **Vercel → Project → Settings → Environment Variables**, add:
   - `GITHUB_OAUTH_CLIENT_ID`
   - `GITHUB_OAUTH_CLIENT_SECRET`
4. Redeploy, then open `/admin/` and log in with GitHub.

Your GitHub user needs **write access** to `studiotra/Naru-Landing`.

### Local preview

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:8080` and `http://localhost:8080/admin/` (OAuth only works on the deployed URL unless you add a second OAuth callback for localhost).

### New article checklist

- Title, slug, excerpt, category, date
- Thumbnail (saved under `assets/uploads/`)
- Body in markdown
- **Featured on homepage** if needed
- Publish in CMS → wait for Vercel deploy

## Do not upload

- `recovery-codes.txt`, `.pptx`, `.docx`, meeting notes, or draft HTML variants (`Naru Landing KO.html`, etc.)
