/* =============================================================
   Naru Landing — Vercel Speed Insights + Web Analytics
   -------------------------------------------------------------
   Static-site equivalent of <SpeedInsights/> / <Analytics/>.
   Enable in Vercel → Project → Speed Insights / Analytics.
   ============================================================= */
(function () {
  'use strict';

  // Speed Insights queue
  window.si = window.si || function () {
    (window.si.q = window.si.q || []).push(arguments);
  };

  // Web Analytics queue
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  function inject(src) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = src;
    document.head.appendChild(s);
  }

  inject('/_vercel/speed-insights/script.js');
  inject('/_vercel/insights/script.js');
})();
