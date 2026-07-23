import { parseBody, saveToResendContacts } from './_resend-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'landing-guide');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId =
    process.env.RESEND_SEGMENT_ID ||
    process.env.RESEND_AUDIENCE_ID;

  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      saved: false,
      warning: 'RESEND_API_KEY is not set — PDF will still download.',
    });
  }

  try {
    const result = await saveToResendContacts(email, {
      apiKey,
      segmentId,
      source,
      locale: String(body.locale || 'en') === 'kr' ? 'kr' : 'en',
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('lead-magnet Resend error:', error?.message || error);
    return res.status(502).json({
      ok: false,
      error: error?.message || 'Unable to save contact',
    });
  }
}
