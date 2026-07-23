export function parseBody(req) {
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

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function resendJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function saveToResendContacts(email, options = {}) {
  const {
    apiKey,
    segmentId,
    source = '',
    firstName = '',
    locale = 'en',
  } = options;

  const payload = {
    email,
    unsubscribed: false,
    properties: {
      lead_source: source || 'website',
      locale,
      subscribed_at: new Date().toISOString(),
    },
  };

  if (firstName) {
    payload.first_name = firstName;
    payload.properties.first_name = firstName;
  }

  if (segmentId) {
    payload.segments = [{ id: segmentId }];
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
    const patchPayload = {
      unsubscribed: false,
      properties: payload.properties,
    };
    if (firstName) patchPayload.first_name = firstName;

    const updateResponse = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchPayload),
      }
    );

    if (updateResponse.ok) {
      return { saved: true, duplicate: true };
    }
  }

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

export async function sendResendEmail(apiKey, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await resendJson(response);

  if (!response.ok) {
    const message = result?.message || result?.error || `Resend HTTP ${response.status}`;
    throw new Error(message);
  }

  return result;
}
