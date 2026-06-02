(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cardHtml(article, layout) {
    const title = escapeHtml(article.title);
    const excerpt = escapeHtml(article.excerpt || '');
    const category = escapeHtml(article.category || 'Insight');
    const thumbAlt = escapeHtml(article.thumbnailAlt || article.title);
    const thumb = article.thumbnail || 'assets/bridging-the-pacific-thumbnail.png';
    const thumbSrc = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    const metaLine = [article.dateLabel, article.readTime].filter(Boolean).join(' · ');

    if (layout === 'featured') {
      return `<a href="${article.url}" class="card card-hover overflow-hidden reveal grid lg:grid-cols-[1.05fr,.95fr]">
        <div class="min-h-[260px] bg-[color:var(--paper-2)]">
          <img src="${thumbSrc}" alt="${thumbAlt}" class="w-full h-full object-cover" />
        </div>
        <div class="p-6 md:p-8 flex flex-col justify-center">
          <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--mist)]">
            <span class="chip">${category}</span>
            ${metaLine ? `<span>${metaLine}</span>` : ''}
          </div>
          <h3 class="display text-2xl mt-4 leading-tight">${title}</h3>
          <p class="text-sm text-[color:var(--mist)] mt-3 leading-relaxed">${excerpt}</p>
          <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style="color:var(--pine)">
            Read article <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </div>
        </div>
      </a>`;
    }

    return `<a href="${article.url}" class="card card-hover overflow-hidden reveal">
      <img src="${thumbSrc}" alt="${thumbAlt}" class="w-full h-64 md:h-80 object-cover" />
      <div class="p-6 md:p-8">
        <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--mist)]">
          <span class="chip">${category}</span>
          ${metaLine ? `<span>${metaLine}</span>` : ''}
        </div>
        <h3 class="display text-2xl md:text-3xl mt-4 leading-tight">${title}</h3>
        <p class="text-sm text-[color:var(--mist)] mt-4 leading-relaxed">${excerpt}</p>
        <div class="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style="color:var(--pine)">
          Open article <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
        </div>
      </div>
    </a>`;
  }

  async function renderArticles() {
    const homeEl = document.getElementById('home-articles-list');
    const insightsEl = document.getElementById('insights-articles-list');
    if (!homeEl && !insightsEl) return;

    try {
      const response = await fetch('/data/articles.json');
      const articles = await response.json();
      if (!Array.isArray(articles) || !articles.length) return;

      const featured = articles.find((a) => a.featured) || articles[0];
      const rest = articles.filter((a) => a.slug !== featured.slug);

      if (homeEl) {
        homeEl.innerHTML = cardHtml(featured, 'featured');
      }

      if (insightsEl) {
        const cards = [cardHtml(featured, 'grid'), ...rest.map((a) => cardHtml(a, 'grid'))];
        insightsEl.innerHTML = cards.join('');
      }

      if (window.lucide) window.lucide.createIcons();
      if (typeof armReveals === 'function') armReveals();
    } catch (error) {
      console.warn('Could not load articles.json', error);
    }
  }

  document.addEventListener('DOMContentLoaded', renderArticles);
})();
