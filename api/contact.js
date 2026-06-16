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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const INTENT_LABELS = {
  sourcing: 'Sourcing request',
  market: 'Market entry',
  partner: 'Partnership',
  press: 'Press inquiry',
};

function buildEmailHtml(data) {
  const intent = INTENT_LABELS[data.intent] || data.intent || 'Contact';
  const rows = [
    ['Intent', intent],
    ['Name', data.name],
    ['Email', data.email],
    data.company ? ['Company / organization', data.company] : null,
    data.sector ? ['Sector', data.sector] : null,
    data.type ? ['Type', data.type] : null,
    data.publication ? ['Publication', data.publication] : null,
    data.nda ? ['NDA requested', 'Yes'] : null,
    ['Message', data.message],
  ].filter(Boolean);

  const bodyRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e8e4de;font-weight:600;vertical-align:top;width:160px">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e8e4de;white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`
    )
    .join('');

  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#14181a">
    <h2 style="margin:0 0 16px">New contact form — ${escapeHtml(intent)}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:640px">${bodyRows}</table>
    <p style="margin:24px 0 0;font-size:12px;color:#6b6560">Sent from narulanding.com contact form</p>
  </body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(req);

  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const intent = String(body.intent || 'sourcing').trim();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const message = String(body.message || '').trim();
  const company = String(body.company || body.organization || '').trim();
  const sector = String(body.sector || '').trim();
  const type = String(body.type || '').trim();
  const publication = String(body.publication || '').trim();
  const nda = Boolean(body.nda);

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'info@narulanding.com';
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || 'Naru Landing <onboarding@resend.dev>';

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'Contact form is not configured. Set RESEND_API_KEY on Vercel.',
    });
  }

  const intentLabel = INTENT_LABELS[intent] || intent;
  const subject = `[Naru] ${intentLabel} — ${name}`;

  const emailPayload = {
    from: fromEmail,
    to: [toEmail],
    reply_to: email,
    subject,
    html: buildEmailHtml({
      intent,
      name,
      email,
      company,
      sector,
      type,
      publication,
      message,
      nda,
    }),
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend email error:', result);
      return res.status(502).json({
        ok: false,
        error: result?.message || result?.error || 'Unable to send message.',
      });
    }

    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error('contact form error:', error?.message || error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Unexpected server error',
    });
  }
}
