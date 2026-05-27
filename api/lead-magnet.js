export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const source = String(req.body?.source || 'landing-guide');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return res.status(500).json({
      ok: false,
      error: 'Missing RESEND_API_KEY or RESEND_AUDIENCE_ID',
    });
  }

  try {
    const createResponse = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    });

    if (createResponse.ok) {
      return res.status(200).json({ ok: true, saved: true });
    }

    // If already exists, upsert by updating contact metadata.
    if (createResponse.status === 409) {
      const updateResponse = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unsubscribed: false,
        }),
      });

      if (updateResponse.ok || updateResponse.status === 404) {
        return res.status(200).json({ ok: true, saved: true, duplicate: true });
      }
    }

    const details = await createResponse.text();
    return res.status(502).json({ ok: false, error: `Resend error: ${details}` });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Unexpected server error',
      source,
    });
  }
}
