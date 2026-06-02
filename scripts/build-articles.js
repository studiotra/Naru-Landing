const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');
const OUT_DIR = path.join(ROOT, 'articles');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_HEADER = path.join(ROOT, 'partials', 'site-header.html');

function siteHeaderHtml() {
  const partial = fs.readFileSync(SITE_HEADER, 'utf8');
  return partial.replace(/\{\{ROOT\}\}/g, '../');
}

marked.setOptions({ gfm: true, breaks: false });

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function resolveSlug(fileName, data) {
  const fromName = fileName.replace(/\.md$/i, '');
  return (data.slug || fromName).trim().toLowerCase();
}

function normalizeThumbnail(thumbnail) {
  if (!thumbnail) return '';
  if (thumbnail.startsWith('http')) return thumbnail;
  if (thumbnail.startsWith('/')) return thumbnail;
  return `/${thumbnail.replace(/^\.\.\//, '')}`;
}

function articlePageHtml(article, bodyHtml) {
  const title = escapeHtml(article.title);
  const dek = escapeHtml(article.excerpt || '');
  const category = escapeHtml(article.category || 'Insight');
  const dateLabel = escapeHtml(formatDate(article.date));
  const readTime = escapeHtml(article.readTime || '');
  const author = escapeHtml(article.author || 'Naru Desk');
  const thumb = normalizeThumbnail(article.thumbnail);
  const thumbAlt = escapeHtml(article.thumbnailAlt || article.title);
  const ogImage = thumb ? escapeHtml(thumb) : '';

  const heroImage = thumb
    ? `<figure class="hero-card">
            <img src="${escapeHtml(thumb.replace(/^\//, '../'))}" alt="${thumbAlt}" />
            <figcaption>${category} · ${dateLabel}</figcaption>
          </figure>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${dek}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${dek}" />
${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
<meta property="og:type" content="article" />
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="../colors_and_type.css" />
<link rel="stylesheet" href="../assets/site-chrome.css" />
<link rel="stylesheet" href="../assets/article.css" />
</head>
<body class="min-h-screen">
${siteHeaderHtml()}

  <main>
    <section class="hero">
      <div class="shell">
        <div class="hero-grid">
          <div>
            <div class="eyebrow">${category} · ${dateLabel}</div>
            <h1 class="display">${title}</h1>
            <p class="dek">${dek}</p>
            <div class="meta">
              <span>${author}</span>
              ${readTime ? `<span>${readTime}</span>` : ''}
            </div>
          </div>
          ${heroImage}
        </div>
      </div>
    </section>

    <section class="article-wrap">
      <div class="shell article-grid">
        <article class="article cms-body">
          ${bodyHtml}
          <section class="cta">
            <h3>Exploring a Korea-Canada partnership?</h3>
            <p>Naru supports Korean ventures entering Canada and Canadian partners seeking Korean technology and capital across clean energy and biotech.</p>
            <div class="cta-actions">
              <a class="btn btn-primary" href="mailto:info@narulanding.com">Contact Naru</a>
              <a class="btn btn-secondary" href="../index.html#insights">All insights</a>
            </div>
          </section>
        </article>
        <aside class="aside">
          <div class="aside-card">
            <h3>About this piece</h3>
            <p>${dek}</p>
          </div>
          <div class="aside-card">
            <h3>Contact</h3>
            <p>Email: <a href="mailto:info@narulanding.com">info@narulanding.com</a><br>
            Web: <a href="https://narulanding.com">narulanding.com</a><br>
            Phone: <a href="tel:+14374358730">+1 (437) 435-8730</a></p>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="shell">Naru — Korea-Canada market entry, partnership, and cross-border commercialization.</div>
  </footer>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="../naru-i18n.js"></script>
<script src="../scripts/article-page.js"></script>
</body>
</html>`;
}

function build() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.md'));
  const articles = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = resolveSlug(file, data);
    const bodyHtml = marked.parse(content);

    const article = {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'Insight',
      date: data.date || '',
      dateLabel: formatDate(data.date),
      readTime: data.readTime || '',
      author: data.author || 'Naru Desk',
      thumbnail: normalizeThumbnail(data.thumbnail),
      thumbnailAlt: data.thumbnailAlt || data.title || '',
      featured: Boolean(data.featured),
      url: `articles/${slug}.html`,
    };

    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), articlePageHtml(article, bodyHtml), 'utf8');
    articles.push(article);
  }

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(path.join(DATA_DIR, 'articles.json'), JSON.stringify(articles, null, 2), 'utf8');
  console.log(`Built ${articles.length} article(s) → articles/ and data/articles.json`);
}

build();
