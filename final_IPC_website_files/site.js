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
    const selected = String(id);
    if (!/^[1-6]$/.test(selected)) return;
    if (!document.querySelector(`.world-story[data-example="${selected}"]`)) return;
    document.querySelectorAll('.world-story[data-example]').forEach(node => {
      const active = node.dataset.example === selected;
      node.hidden = !active;
      node.classList.toggle('is-active', active);
    });
    document.querySelectorAll('.world-country[data-country-focus]').forEach(node => {
      const active = node.dataset.countryFocus === selected;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.category-card[data-world-example]').forEach(node => node.classList.toggle('is-world-active', node.dataset.worldExample === selected));
    const section = document.getElementById('examples');
    if (section) section.dataset.activeCountry = selected;
  };
  document.addEventListener('ipc:country-select', event => selectCountry(event.detail?.id));
  document.querySelectorAll('[data-country-focus],[data-world-jump]').forEach(control => control.addEventListener('click', () => {
    const id = control.dataset.countryFocus || control.dataset.worldJump;
    selectCountry(id);
    document.dispatchEvent(new CustomEvent('ipc:country-focus', { detail: { id } }));
  }));
  const countries = [...document.querySelectorAll('.world-country')];
  countries.forEach((control, index) => control.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? countries.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + countries.length) % countries.length;
    countries[next].focus(); countries[next].click();
  }));
  selectCountry('2');
})();
