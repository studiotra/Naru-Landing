import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  return { url, serviceKey, anonKey };
}

export function getSupabaseClient(useServiceRole = false) {
  const { url, serviceKey, anonKey } = getSupabaseConfig();
  const key = useServiceRole && serviceKey ? serviceKey : anonKey;

  if (!url || !key) {
    throw new Error('Missing Supabase URL or API key in environment variables');
  }

  return createClient(url, key);
}

export function formatArticleDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function mapArticleRow(row) {
  const publishedAt = row.published_at || row.created_at;
  const thumbnail = row.thumbnail || '';

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    category: row.category || 'Insight',
    author: row.author || 'Naru Desk',
    readTime: row.read_time || '',
    thumbnail: thumbnail.startsWith('http') || thumbnail.startsWith('/')
      ? thumbnail
      : thumbnail
        ? `/${thumbnail.replace(/^\//, '')}`
        : '',
    thumbnailAlt: row.thumbnail_alt || row.title,
    featured: Boolean(row.featured),
    publishedAt,
    dateLabel: formatArticleDate(publishedAt),
    url: `articles/${row.slug}`,
  };
}

export function markdownToHtml(markdown) {
  return marked.parse(String(markdown || ''));
}
