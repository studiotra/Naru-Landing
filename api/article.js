import { getSupabaseClient, mapArticleRow, markdownToHtml } from '../lib/articles.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = String(req.query?.slug || '').trim().toLowerCase();
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    const supabase = getSupabaseClient(false);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = mapArticleRow(data);
    article.bodyHtml = markdownToHtml(data.body);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(article);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Supabase is not configured',
    });
  }
}
