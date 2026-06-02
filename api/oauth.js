/**
 * GitHub OAuth for Decap CMS on Vercel (replaces Netlify's api.netlify.com bridge).
 *
 * Env: GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
 * GitHub OAuth App callback URL: https://narulanding.com/api/oauth
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method not allowed');
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).end('Missing GITHUB_OAUTH_CLIENT_ID or GITHUB_OAUTH_CLIENT_SECRET');
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/oauth`;

  const code = typeof req.query.code === 'string' ? req.query.code : '';

  if (!code) {
    const scope = typeof req.query.scope === 'string' ? req.query.scope : 'repo';
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    return res.redirect(302, authUrl.toString());
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    const message = tokenData.error_description || tokenData.error || 'OAuth failed';
    return res.status(400).end(message);
  }

  const payload = JSON.stringify({
    token: tokenData.access_token,
    provider: 'github',
  });
  const postMessage = `authorization:github:success:${payload}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html>
<html lang="en"><body><script>
(function () {
  var msg = ${JSON.stringify(postMessage)};
  if (window.opener) {
    window.opener.postMessage(msg, '*');
  }
  window.close();
})();
</script><p>Signing in… You can close this window.</p></body></html>`);
}
