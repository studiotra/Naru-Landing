import {
  parseBody,
  escapeHtml,
  saveToResendContacts,
  sendResendEmail,
} from './_resend-utils.js';

const SITE_URL = 'https://narulanding.com';

function buildWelcomeEmail({ firstName, locale }) {
  const kr = locale === 'kr';
  const greeting = firstName
    ? kr
      ? `${escapeHtml(firstName)}님,`
      : `Hi ${escapeHtml(firstName)},`
    : kr
      ? '안녕하세요,'
      : 'Hi there,';

  if (kr) {
    return {
      subject: 'Naru Landing 뉴스레터 구독을 환영합니다',
      html: `<!doctype html><html><body style="font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#14181a;line-height:1.65;max-width:560px;margin:0 auto;padding:24px">
        <p style="margin:0 0 16px">${greeting}</p>
        <p style="margin:0 0 16px">Naru Landing 뉴스레터 구독이 완료되었습니다. 한국 혁신 기업의 북미 진출, 캐나다 시장·자금·파트너십 인사이트를 정기적으로 보내드립니다.</p>
        <p style="margin:0 0 16px"><strong>다음에 기대하실 내용</strong></p>
        <ul style="margin:0 0 20px;padding-left:1.2em">
          <li>2026 북미 확장 시그널 &amp; 정책 업데이트</li>
          <li>캐나다 그랜트·IRAP·NRC 활용 팁</li>
          <li>현지화 vs. 번역 — 구매자 관점의 메시지</li>
          <li>파일럿에서 파이프라인까지의 실행 노트</li>
        </ul>
        <p style="margin:0 0 24px">
          <a href="${SITE_URL}/insights.html" style="color:#D94E26">인사이트 읽기</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}/contact.html" style="color:#D94E26">디스커버리 콜 예약</a>
        </p>
        <p style="margin:0;font-size:12px;color:#6b6560">Naru Landing · Toronto · Seoul<br>
        <a href="${SITE_URL}/privacy-policy.html" style="color:#6b6560">개인정보 처리방침</a></p>
      </body></html>`,
    };
  }

  return {
    subject: 'Welcome to the Naru Landing newsletter',
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#14181a;line-height:1.65;max-width:560px;margin:0 auto;padding:24px">
      <p style="margin:0 0 16px">${greeting}</p>
      <p style="margin:0 0 16px">You&rsquo;re subscribed to the Naru Landing newsletter — practical insights on North American market entry, Canadian funding, and cross-border growth for Korean innovators.</p>
      <p style="margin:0 0 16px"><strong>What to expect</strong></p>
      <ul style="margin:0 0 20px;padding-left:1.2em">
        <li>2026 North American expansion signals &amp; policy updates</li>
        <li>Canadian grants, IRAP &amp; NRC program notes</li>
        <li>Localization vs. translation for North American buyers</li>
        <li>From pilot to pipeline — execution playbooks</li>
      </ul>
      <p style="margin:0 0 24px">
        <a href="${SITE_URL}/insights.html" style="color:#D94E26">Read insights</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}/contact.html" style="color:#D94E26">Book a discovery call</a>
      </p>
      <p style="margin:0;font-size:12px;color:#6b6560">Naru Landing · Toronto · Seoul<br>
      <a href="${SITE_URL}/privacy-policy.html" style="color:#6b6560">Privacy Policy</a></p>
    </body></html>`,
  };
}

function buildInternalNotification({ email, firstName, source, locale }) {
  return {
    subject: `[Naru] New newsletter subscriber — ${email}`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#14181a">
      <h2 style="margin:0 0 12px">New newsletter subscriber</h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:6px 12px 6px 0;font-weight:600">Email</td><td>${escapeHtml(email)}</td></tr>
        ${firstName ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600">Name</td><td>${escapeHtml(firstName)}</td></tr>` : ''}
        <tr><td style="padding:6px 12px 6px 0;font-weight:600">Source</td><td>${escapeHtml(source)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:600">Locale</td><td>${escapeHtml(locale)}</td></tr>
      </table>
    </body></html>`,
  };
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

  const email = String(body.email || '').trim().toLowerCase();
  const firstName = String(body.firstName || body.name || '').trim();
  const source = String(body.source || 'newsletter-landing').trim();
  const locale = String(body.locale || 'en').trim() === 'kr' ? 'kr' : 'en';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID || process.env.RESEND_SEGMENT_ID || '';
  const audienceId = process.env.RESEND_AUDIENCE_ID || '';
  const fromEmail =
    process.env.NEWSLETTER_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    'Naru Landing <info@narulanding.com>';
  const notifyEmail = process.env.CONTACT_TO_EMAIL || 'info@narulanding.com';

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'Newsletter is not configured. Set RESEND_API_KEY on Vercel.',
    });
  }

  try {
    const contactResult = await saveToResendContacts(email, {
      apiKey,
      segmentId,
      audienceId,
      source,
      firstName,
      locale,
    });

    const welcome = buildWelcomeEmail({ firstName, locale });
    const welcomeResult = await sendResendEmail(apiKey, {
      from: fromEmail,
      to: [email],
      subject: welcome.subject,
      html: welcome.html,
    });

    let notifyResult = null;
    try {
      const internal = buildInternalNotification({ email, firstName, source, locale });
      notifyResult = await sendResendEmail(apiKey, {
        from: fromEmail,
        to: [notifyEmail],
        reply_to: email,
        subject: internal.subject,
        html: internal.html,
      });
    } catch (notifyError) {
      console.error('newsletter internal notify error:', notifyError?.message || notifyError);
    }

    return res.status(200).json({
      ok: true,
      saved: contactResult.saved,
      duplicate: Boolean(contactResult.duplicate),
      welcomeId: welcomeResult.id,
      notifyId: notifyResult?.id || null,
    });
  } catch (error) {
    console.error('newsletter error:', error?.message || error);
    return res.status(502).json({
      ok: false,
      error: error?.message || 'Unable to complete subscription.',
    });
  }
}
