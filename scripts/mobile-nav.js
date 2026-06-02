(function () {
  var header = document.getElementById('site-header');
  if (!header) return;

  var toggle = header.querySelector('.mobile-nav-toggle');
  var panel = header.querySelector('#mobile-nav-panel');
  var backdrop = header.querySelector('.mobile-nav-backdrop');
  var menuIcon = header.querySelector('[data-menu-icon]');
  var closeIcon = header.querySelector('[data-close-icon]');

  if (!toggle || !panel || !backdrop) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.hidden = !open;
    backdrop.hidden = !open;
    document.body.classList.toggle('mobile-nav-open', open);
    if (menuIcon) menuIcon.classList.toggle('hidden', open);
    if (closeIcon) closeIcon.classList.toggle('hidden', !open);
    if (window.lucide) window.lucide.createIcons();
  }

  toggle.addEventListener('click', function () {
    setOpen(panel.hidden);
  });

  backdrop.addEventListener('click', function () {
    setOpen(false);
  });

  panel.querySelectorAll('.nav-to, .mobile-nav-link').forEach(function (el) {
    el.addEventListener('click', function () {
      setOpen(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });
})();
