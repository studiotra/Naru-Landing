(function () {
  if (window.lucide) window.lucide.createIcons();

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      if (window.NaruI18n && lang) window.NaruI18n.applyLang(lang);
    });
  });

  if (window.NaruI18n) {
    var lang = document.documentElement.lang === 'ko' ? 'ko' : 'en';
    window.NaruI18n.applyLang(lang);
  }
})();
