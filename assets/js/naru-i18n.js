/* Naru Landing — EN/KR toggle (localStorage: naru-lang) */
(function (window) {
  'use strict';

  var KEY = 'naru-lang';

  function initI18n() {
    var i18nEls = Array.prototype.slice.call(document.querySelectorAll('[data-kr]'));
    i18nEls.forEach(function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.innerHTML.trim());
    });
    var phEls = Array.prototype.slice.call(document.querySelectorAll('[data-kr-ph]'));
    phEls.forEach(function (el) {
      if (!el.hasAttribute('data-en-ph')) el.setAttribute('data-en-ph', el.getAttribute('placeholder') || '');
    });

    function apply(lang) {
      var kr = lang === 'kr';
      document.documentElement.lang = kr ? 'ko' : 'en';
      document.body.classList.toggle('lang-kr', kr);
      i18nEls.forEach(function (el) {
        var v = el.getAttribute(kr ? 'data-kr' : 'data-en');
        if (v !== null) el.innerHTML = v;
      });
      phEls.forEach(function (el) {
        var v = el.getAttribute(kr ? 'data-kr-ph' : 'data-en-ph');
        if (v !== null) el.setAttribute('placeholder', v);
      });
      var titleEl = document.querySelector('title[data-kr]');
      if (titleEl) document.title = titleEl.textContent;
      document.querySelectorAll('.lang-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      });
      try { window.localStorage.setItem(KEY, lang); } catch (e) {}
      window.dispatchEvent(new CustomEvent('naru:langchange', { detail: { lang: lang } }));
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.lang-btn') : null;
      if (btn) { e.preventDefault(); apply(btn.getAttribute('data-lang')); }
    });

    var saved = 'en';
    try { saved = window.localStorage.getItem(KEY) || 'en'; } catch (e) {}
    apply(saved);

    window.NaruI18n = { apply: apply, getLang: function () { return document.body.classList.contains('lang-kr') ? 'kr' : 'en'; } };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})(window);
