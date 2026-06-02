function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function resendJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function saveToResendContacts(email, source, apiKey, segmentId) {
  const payload = {
    email,
    unsubscribed: false,
  };

  if (segmentId) {
    payload.segments = [{ id: segmentId }];
  }

  if (source) {
    payload.properties = { lead_source: source };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const createResponse = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (createResponse.ok) {
    return { saved: true };
  }

  if (createResponse.status === 409) {
    const updateResponse = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ unsubscribed: false }),
      }
    );

    if (updateResponse.ok) {
      return { saved: true, duplicate: true };
    }
  }

  // Legacy Audiences API (older Resend accounts)
  if (segmentId) {
    const legacyResponse = await fetch(
      `https://api.resend.com/audiences/${segmentId}/contacts`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    if (legacyResponse.ok) {
      return { saved: true, legacy: true };
    }

    if (legacyResponse.status === 409) {
      const legacyUpdate = await fetch(
        `https://api.resend.com/audiences/${segmentId}/contacts/${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ unsubscribed: false }),
        }
      );

      if (legacyUpdate.ok || legacyUpdate.status === 404) {
        return { saved: true, duplicate: true, legacy: true };
      }
    }
  }

  const details = await resendJson(createResponse);
  throw new Error(details.message || details.error || `Resend HTTP ${createResponse.status}`);
}

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

  // Still deliver the PDF when Resend is not configured on Vercel yet.
  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      saved: false,
      warning: 'RESEND_API_KEY is not set — PDF will still download.',
    });
  }

  try {
    const result = await saveToResendContacts(email, source, apiKey, segmentId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('lead-magnet Resend error:', error?.message || error);
    return res.status(502).json({
      ok: false,
      error: error?.message || 'Unable to save contact',
    });
  }
}
