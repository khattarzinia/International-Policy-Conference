(() => {
  'use strict';
  const header = document.querySelector('.ipc-home .site-header');
  const button = header?.querySelector('.menu-button');
  const menu = header?.querySelector('nav');
  const closeMenu = () => { menu?.classList.remove('open'); button?.setAttribute('aria-expanded', 'false'); button?.setAttribute('aria-label', 'Open navigation'); };
  button?.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.classList.contains('open')) { closeMenu(); button?.focus(); } });
  document.addEventListener('pointerdown', event => { if (header && !header.contains(event.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000) closeMenu(); }, { passive: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px 30px 0px' });
    document.querySelectorAll('.ipc-home .reveal').forEach(node => observer.observe(node));
  }
  const selectCountry = id => {
    document.querySelectorAll('.example-item[data-example]').forEach(node => {
      const active = node.dataset.example === String(id);
      node.classList.toggle('is-active', active);
      node.querySelector('.example-select')?.setAttribute('aria-pressed', String(active));
    });
  };
  document.addEventListener('ipc:country-select', event => selectCountry(event.detail?.id));
  document.querySelectorAll('[data-country-focus]').forEach(control => control.addEventListener('click', () => {
    const id = control.dataset.countryFocus;
    selectCountry(id);
    document.dispatchEvent(new CustomEvent('ipc:country-focus', { detail: { id } }));
  }));
})();
