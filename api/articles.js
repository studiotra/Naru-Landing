import { getSupabaseClient, mapArticleRow } from '../lib/articles.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient(false);
    const { data, error } = await supabase
      .from('articles')
      .select(
        'slug, title, excerpt, category, author, read_time, thumbnail, thumbnail_alt, featured, published_at, created_at'
      )
      .eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const articles = (data || []).map(mapArticleRow);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(articles);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Supabase is not configured',
    });
  }
}
