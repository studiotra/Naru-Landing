/* =============================================================
   Naru Landing — partner / ecosystem name list (text, no logos)
   ============================================================= */
(function (window) {
  'use strict';

  var PARTNERS = [
    'Amazon Ads',
    'TD Bank',
    'WWF (World Wildlife Foundation)',
    'Seoul Techno Park',
    'Rogers Media',
    'Vitamin D',
    'Space Creatorz',
    'Imperial Capital Private Equity',
    'Victura Private Equity',
    'BlueC Capital',
    'Skyline Succession Partners',
    'Keilhauer',
    'SickKids',
    'OBA',
    'All Health Medical',
    'Synaptic AI',
    'Skyline Roofing Partners',
    'Actual Pet Foods',
    'Elissa Katzman',
    'Blue Forest Shores',
    'ALLGOOD',
    'Kyla Penner',
    'Madame Zero',
    'MARA MA',
    'The Art of Science Psychologists',
    'EMD',
    'Church Brewing',
    'Lapis Beauty and Co',
    'SwiftRide',
    'Vantage Hemp',
    'Realty Rise'
  ];

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function partnerBoxHtml(name) {
    return '<div class="client-box partner-name"><span class="partner-label">' + escapeHtml(name) + '</span></div>';
  }

  /** Swiper carousel (homepage + about) */
  function renderCarousel(selector, duplicate) {
    var wrap = document.querySelector(selector);
    if (!wrap) return;
    var list = PARTNERS.slice();
    if (duplicate !== false) list = list.concat(PARTNERS);
    wrap.innerHTML = list.map(function (name) {
      return '<div class="swiper-slide">' + partnerBoxHtml(name) + '</div>';
    }).join('');
  }

  /** Throwable capsules (services page) */
  function renderCapsules(selector) {
    var wrap = document.querySelector(selector);
    if (!wrap) return;
    wrap.innerHTML = PARTNERS.map(function (name) {
      return '<p data-t-throwable-el="">' + partnerBoxHtml(name) + '</p>';
    }).join('');
  }

  window.NaruPartners = {
    PARTNERS: PARTNERS,
    renderCarousel: renderCarousel,
    renderCapsules: renderCapsules
  };
})(window);
