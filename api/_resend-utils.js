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

function isSegmentMissingError(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('segment') && (text.includes('do not exist') || text.includes('not found'));
}

function buildContactPayload(email, { source, firstName, locale, segmentId }) {
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

  return payload;
}

async function createOrUpdateContact(email, payload, apiKey) {
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
    if (payload.first_name) patchPayload.first_name = payload.first_name;

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

  const details = await resendJson(createResponse);
  const message = details.message || details.error || `Resend HTTP ${createResponse.status}`;
  const error = new Error(message);
  error.status = createResponse.status;
  error.details = details;
  throw error;
}

async function addLegacyAudienceContact(email, audienceId, apiKey) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const legacyResponse = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
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
      `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
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

  const details = await resendJson(legacyResponse);
  throw new Error(details.message || details.error || `Resend HTTP ${legacyResponse.status}`);
}

export async function saveToResendContacts(email, options = {}) {
  const {
    apiKey,
    segmentId = '',
    audienceId = '',
    source = '',
    firstName = '',
    locale = 'en',
  } = options;

  const baseOptions = { source, firstName, locale };
  let lastError = null;

  if (segmentId) {
    try {
      return await createOrUpdateContact(
        email,
        buildContactPayload(email, { ...baseOptions, segmentId }),
        apiKey
      );
    } catch (error) {
      lastError = error;
      if (!isSegmentMissingError(error.message)) {
        throw error;
      }
      console.warn('Resend segment assignment failed; retrying without segment:', error.message);
    }
  }

  try {
    const result = await createOrUpdateContact(
      email,
      buildContactPayload(email, baseOptions),
      apiKey
    );
    if (segmentId && lastError) {
      return { ...result, segmentSkipped: true };
    }
    return result;
  } catch (error) {
    lastError = error;
  }

  const legacyAudienceId = audienceId || segmentId;
  if (legacyAudienceId) {
    try {
      return await addLegacyAudienceContact(email, legacyAudienceId, apiKey);
    } catch (error) {
      console.warn('Resend legacy audience failed:', error.message);
      lastError = error;
    }
  }

  if (lastError && !isSegmentMissingError(lastError.message)) {
    throw lastError;
  }

  throw lastError || new Error('Unable to save contact to Resend');
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
