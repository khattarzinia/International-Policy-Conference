const button = document.querySelector('.menu-button');
const menu = document.querySelector('.site-header nav');
button?.addEventListener('click', () => { const open = menu.classList.toggle('open'); button.setAttribute('aria-expanded', open); });
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.classList.remove('open')));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
