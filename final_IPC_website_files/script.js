(() => {
  const root = document.documentElement;
  const loader = document.getElementById('ipc-loader');
  if (loader) {
    let dismissed = false;
    const cleanup = () => {
      root.classList.remove('ipc-loading', 'ipc-loader-exiting');
      loader.remove();
    };
    const triggerExit = () => {
      if (dismissed) return;
      dismissed = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('ipc-loading');
          root.classList.add('ipc-loader-exiting');
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          setTimeout(cleanup, reduced ? 350 : 1100);
        });
      });
    };

    const minHold = new Promise(resolve => setTimeout(resolve, 650));
    const heroReady = new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = './assets/lowell-house-hires.jpg';
      if (img.complete) resolve();
    });
    const maxWait = new Promise(resolve => setTimeout(resolve, 1600));

    Promise.race([Promise.all([minHold, heroReady]), maxWait]).then(triggerExit);
    window.addEventListener('pageshow', event => {
      if (event.persisted) cleanup();
    });
  } else {
    root.classList.remove('ipc-loading', 'ipc-loader-exiting');
  }
})();

const button = document.querySelector('.menu-button');
const menu = document.querySelector('.site-header nav');
button?.addEventListener('click', () => { const open = menu.classList.toggle('open'); button.setAttribute('aria-expanded', open); });
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.classList.remove('open'); button?.setAttribute('aria-expanded', 'false'); }));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
