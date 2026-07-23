/* Naru Landing — footer + inline newsletter forms → /api/newsletter */
(function () {
  'use strict';

  function currentLocale() {
    try {
      return localStorage.getItem('naru-lang') === 'kr' ? 'kr' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function messageFor(ok, locale) {
    if (ok) {
      return locale === 'kr'
        ? '구독해 주셔서 감사합니다. 확인 메일을 보내드렸습니다.'
        : 'Thank you — check your inbox for a confirmation email.';
    }
    return locale === 'kr'
      ? '구독에 실패했습니다. 잠시 후 다시 시도하거나 info@narulanding.com 으로 문의해 주세요.'
      : 'Unable to subscribe. Try again or email info@narulanding.com.';
  }

  function attachForm(form) {
    if (form.dataset.naruSubscribeBound) return;
    form.dataset.naruSubscribeBound = '1';

    var msgEl = form.querySelector('.subscribe-message');
    if (!msgEl) {
      msgEl = document.createElement('p');
      msgEl.className = 'subscribe-message';
      msgEl.setAttribute('aria-live', 'polite');
      form.appendChild(msgEl);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var emailInput = form.querySelector('input[type="email"]');
      var email = emailInput ? String(emailInput.value || '').trim() : '';
      var locale = currentLocale();
      var source = form.getAttribute('data-source') || 'footer';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msgEl.textContent =
          locale === 'kr' ? '유효한 이메일을 입력해 주세요.' : 'Please enter a valid email.';
        msgEl.className = 'subscribe-message error';
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      msgEl.textContent = locale === 'kr' ? '처리 중…' : 'Subscribing…';
      msgEl.className = 'subscribe-message pending';

      fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: source, locale: locale }),
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, data: d };
          });
        })
        .then(function (res) {
          if (res.ok && res.data.ok) {
            msgEl.textContent = messageFor(true, locale);
            msgEl.className = 'subscribe-message success';
            form.reset();
          } else {
            msgEl.textContent = res.data.error || messageFor(false, locale);
            msgEl.className = 'subscribe-message error';
          }
        })
        .catch(function () {
          msgEl.textContent = messageFor(false, locale);
          msgEl.className = 'subscribe-message error';
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  document.querySelectorAll('.subscribe-form').forEach(attachForm);
})();
