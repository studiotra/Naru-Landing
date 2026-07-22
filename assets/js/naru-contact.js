/* Naru Landing — contact form → Vercel /api/contact */
(function () {
  'use strict';

  var form = document.getElementById('contact__form');
  if (!form) return;

  var msgEl = document.getElementById('response-message');

  function setMessage(text, ok) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = ok ? 'success' : 'error';
    msgEl.style.display = 'block';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

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
      setMessage('Please fill in name, email, and message.', false);
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
    setMessage('Sending…', true);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          setMessage('Thank you — we will reply within one business day.', true);
          form.reset();
        } else {
          setMessage(res.data.error || 'Something went wrong. Email info@narulanding.com instead.', false);
        }
      })
      .catch(function () {
        setMessage('Unable to send. Please email info@narulanding.com directly.', false);
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  });
})();
