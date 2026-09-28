/* Naru Landing — contact form → Vercel /api/contact */
(function () {
  'use strict';

  var form = document.getElementById('contact__form');
  if (!form) return;

  var msgEl = document.getElementById('response-message');

  function currentLocale() {
    try {
      return localStorage.getItem('naru-lang') === 'kr' ? 'kr' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function setMessage(text, ok) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = ok ? 'success' : 'error';
    msgEl.style.display = 'block';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var locale = currentLocale();
    var name = (document.getElementById('name') || {}).value || '';
    var email = (document.getElementById('email') || {}).value || '';
    var message = (document.getElementById('message') || {}).value || '';
    var company = (document.getElementById('company') || {}).value || '';
    var phone = (document.getElementById('phone') || {}).value || '';
    var stage = (document.getElementById('stage') || {}).value || '';
    var sectorEl = document.getElementById('sector');
    var sector = '';
    if (sectorEl && sectorEl.selectedIndex > 0) {
      sector = sectorEl.options[sectorEl.selectedIndex].text;
    }

    name = name.trim();
    email = email.trim();
    message = message.trim();

    if (!name || !email || !message) {
      setMessage(
        locale === 'kr' 
          ? '이름, 이메일, 문의 내용을 입력해 주세요.' 
          : 'Please fill in name, email, and message.',
        false
      );
      return;
    }

    var body = message;
    if (phone.trim()) body = 'Phone: ' + phone.trim() + '\n\n' + body;
    if (stage.trim()) body = 'North America stage: ' + stage.trim() + '\n\n' + body;

    var payload = {
      intent: 'market',
      name: name,
      email: email,
      company: company.trim(),
      sector: sector,
      message: body
    };

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setMessage(locale === 'kr' ? '전송 중…' : 'Sending…', true);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          setMessage(
            locale === 'kr'
              ? '감사합니다. 영업일 기준 1일 이내에 답변드리겠습니다.'
              : 'Thank you — we will reply within one business day.',
            true
          );
          form.reset();
        } else {
          setMessage(
            res.data.error || (locale === 'kr'
              ? '문제가 발생했습니다. info@narulanding.com으로 직접 메일을 보내 주세요.'
              : 'Something went wrong. Email info@narulanding.com instead.'),
            false
          );
        }
      })
      .catch(function () {
        setMessage(
          locale === 'kr'
            ? '전송하지 못했습니다. info@narulanding.com으로 직접 문의해 주세요.'
            : 'Unable to send. Please email info@narulanding.com directly.',
          false
        );
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  });
})();
