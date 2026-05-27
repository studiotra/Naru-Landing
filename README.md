# Naru Landing — GitHub Pages

Static site for [narulanding.com](https://narulanding.com). Upload **this folder only** as the repository root (or push its contents to an empty repo).

## What’s included

```
index.html
colors_and_type.css
naru-i18n.js
assets/
articles/
Brand fonts/
```

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

## Do not upload

- `recovery-codes.txt`, `.pptx`, `.docx`, meeting notes, or draft HTML variants (`Naru Landing KO.html`, etc.)
