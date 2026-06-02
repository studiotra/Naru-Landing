/**
 * One-time seed: copies content/articles/*.md into Supabase.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 *   npm run seed:articles
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run again.');
    process.exit(1);
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('No content/articles folder found.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.md'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    const row = {
      slug: data.slug || file.replace(/\.md$/, ''),
      title: data.title,
      excerpt: data.excerpt || '',
      category: data.category || 'Insight',
      body: content.trim(),
      author: data.author || 'Naru Desk',
      read_time: data.readTime || '8 min read',
      thumbnail: data.thumbnail || '',
      thumbnail_alt: data.thumbnailAlt || data.title,
      featured: Boolean(data.featured),
      published: true,
      published_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };

    const { error } = await supabase.from('articles').upsert(row, { onConflict: 'slug' });

    if (error) {
      console.error('Failed for', file, error.message);
      process.exit(1);
    }

    console.log('Seeded:', row.slug);
  }

  console.log('Done. Articles are live via /api/articles after deploy.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
