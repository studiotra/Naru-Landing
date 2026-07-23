/* Naru Landing — dedicated newsletter / lead magnet landing page */
(function () {
  'use strict';

  var form = document.getElementById('newsletter-lead-form');
  if (!form) return;

  var msgEl = document.getElementById('newsletter-lead-message');
  var successEl = document.getElementById('newsletter-lead-success');

  function currentLocale() {
    try {
      return localStorage.getItem('naru-lang') === 'kr' ? 'kr' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function setMessage(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = kind ? 'lead-form-message ' + kind : 'lead-form-message';
    msgEl.style.display = text ? 'block' : 'none';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var locale = currentLocale();
    var firstName = (document.getElementById('lead-first-name') || {}).value || '';
    var email = (document.getElementById('lead-email') || {}).value || '';
    firstName = firstName.trim();
    email = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage(
        locale === 'kr' ? '유효한 이메일을 입력해 주세요.' : 'Please enter a valid email address.',
        'error'
      );
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setMessage(locale === 'kr' ? '처리 중…' : 'Subscribing…', 'pending');

    fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        firstName: firstName,
        source: 'newsletter-landing',
        locale: locale,
        website: (form.querySelector('[name="website"]') || {}).value || '',
      }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          form.style.display = 'none';
          if (successEl) successEl.hidden = false;
          setMessage('', '');
        } else {
          setMessage(
            res.data.error ||
              (locale === 'kr'
                ? '구독에 실패했습니다. info@narulanding.com 으로 문의해 주세요.'
                : 'Unable to subscribe. Email info@narulanding.com for help.'),
            'error'
          );
        }
      })
      .catch(function () {
        setMessage(
          locale === 'kr'
            ? '연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'
            : 'Connection failed. Please try again.',
          'error'
        );
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  });
})();
