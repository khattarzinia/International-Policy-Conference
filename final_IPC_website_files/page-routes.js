// Project the globe's live 3D anchor into a page-wide route system.
const SVG_NS = 'http://www.w3.org/2000/svg';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const point = p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const svgNode = (tag, attributes = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
};

if (document.querySelector('.ipc-home .world-section')) createPageRoutes();

function createPageRoutes() {
  const root = svgNode('svg', { class: 'page-routes', 'aria-hidden': 'true', focusable: 'false' });
  const group = svgNode('g', { class: 'page-route-space' });
  const spine = svgNode('g', { class: 'page-route-spine' });
  const escape = svgNode('g', { class: 'page-route-escape' });
  const fragments = svgNode('g', { class: 'page-route-fragments' });
  escape.style.opacity = '0';
  group.append(spine, escape, fragments); root.append(group); document.body.append(root);
  document.body.classList.add('has-page-routes');
  const sections = [...document.querySelectorAll('main > section, footer#contact')];
  const routes = new Map();
  const chapterRoutes = [];
  const fragmentsList = [];
  let width = innerWidth, height = innerHeight, frame = 0, needsMeasure = true, source = null;
  let measured = [], lastSelected = '2', lastBurst = -Infinity, lastTime = 0;
  let lastScroll = scrollY, scrollVelocity = 0, scrollDirty = true, removed = false;

  function addRoute(parent, name, delay = 0) {
    const g = svgNode('g', { class: `page-route page-route-${name}` });
    const line = svgNode('path', { class: 'page-route-line', fill: 'none', pathLength: '1000' });
    const flight = svgNode('path', { class: 'page-route-flight', fill: 'none', pathLength: '1000' });
    const echo = svgNode('path', { class: 'page-route-echo', fill: 'none', pathLength: '1000' });
    const dot = svgNode('circle', { class: 'page-route-dock', r: '3' });
    flight.style.animationDelay = `${delay}s`; echo.style.animationDelay = `${delay - 1.4}s`;
    g.append(line, flight, echo, dot); parent.append(g);
    return { g, line, flight, echo, dot, name, d: '' };
  }
  function setRoute(route, d, end) {
    if (route.d !== d) {
      route.d = d;
      route.line.setAttribute('d', d); route.flight.setAttribute('d', d); route.echo.setAttribute('d', d);
    }
    if (end) { route.dot.setAttribute('cx', end.x); route.dot.setAttribute('cy', end.y); }
  }
  for (const [i, name] of ['headline', 'story', 'country', 'category', 'stage'].entries()) routes.set(name, addRoute(escape, name, -i * .84));
  for (let i = 0; i < sections.length; i++) chapterRoutes.push(addRoute(spine, `chapter-${i}`, -i * .71));

  const rect = element => {
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return { left: r.left + scrollX, top: r.top + scrollY, right: r.right + scrollX,
      bottom: r.bottom + scrollY, width: r.width, height: r.height };
  };
  const dock = (element, where = 'right') => {
    const r = rect(element);
    if (!r) return null;
    return where === 'left' ? { x: r.left - 12, y: r.top + r.height * .5 } :
      where === 'top' ? { x: r.left + r.width * .5, y: r.top - 5 } :
      { x: r.right + 14, y: r.top + r.height * .5 };
  };
  let targets = {};
  function measure() {
    width = innerWidth; height = innerHeight;
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    root.setAttribute('width', width); root.setAttribute('height', height);
    measured = sections.map((element, index) => {
      const box = rect(element);
      const heading = element.querySelector('[data-route-anchor],h1,h2,h3');
      const title = rect(heading) || box;
      const x = clamp(title.left * .4, 9, width > 760 ? 34 : 10);
      return { element, index, box, title, x, y: title.top + Math.min(title.height * .45, 45) };
    });
    for (let i = 0; i < measured.length; i++) {
      const current = measured[i], previous = measured[Math.max(0, i - 1)];
      const start = i ? { x: previous.x, y: previous.y + 35 } : { x: current.x, y: current.box.top + 35 };
      const end = { x: current.x, y: current.y };
      const distance = Math.max(20, end.y - start.y);
      const bend = width > 760 ? 30 : 7;
      const d = `M${point(start)} C${point({ x: start.x + bend, y: start.y + distance * .37 })} ${point({ x: end.x - bend, y: end.y - distance * .3 })} ${point(end)} L${point({ x: Math.min(current.title.left - 7, end.x + 25), y: end.y })}`;
      setRoute(chapterRoutes[i], d, { x: Math.min(current.title.left - 7, end.x + 25), y: end.y });
    }
    const title = rect(document.querySelector('.world-heading h2 em'));
    const story = document.querySelector(`.world-story[data-example="${lastSelected}"]`);
    const category = document.querySelector(`.category-card[data-world-example="${lastSelected}"]`);
    targets = {
      headline: title ? { x: title.right + 7, y: title.bottom + 10, left: title.left } : null,
      story: dock(story?.querySelector('.world-field-link'), 'right'),
      country: dock(document.querySelector(`.world-country[data-country-focus="${lastSelected}"]`), 'top'),
      category: dock(category?.querySelector('img'), 'right'),
      stage: dock(document.querySelector('#stages .stage-image'), 'right'),
      world: rect(document.querySelector('.world-section')),
    };
    needsMeasure = false;
  }

  function shapeEscapes() {
    if (!source || !targets.world) return;
    const s = source;
    const narrow = width <= 1000;
    const rightRail = width - (narrow ? 9 : 25);
    const t = targets.headline;
    if (t) {
      const d = narrow
        ? `M${point(s)} C${point({ x: width - 15, y: s.y - 50 })} ${point({ x: width - 11, y: t.y + 80 })} ${point(t)} L${point({ x: t.left, y: t.y })}`
        : `M${point(s)} C${point({ x: s.x - 170, y: s.y - 200 })} ${point({ x: t.x + 190, y: t.y + 40 })} ${point(t)} L${point({ x: t.left, y: t.y })}`;
      setRoute(routes.get('headline'), d, { x: t.left, y: t.y });
    }
    const story = targets.story;
    if (story) {
      const d = narrow
        ? `M${point(s)} C${point({ x: width - 12, y: s.y + 120 })} ${point({ x: width - 12, y: story.y - 35 })} ${point(story)}`
        : `M${point(s)} C${point({ x: s.x - 90, y: s.y + 190 })} ${point({ x: story.x + 150, y: story.y - 10 })} ${point(story)}`;
      setRoute(routes.get('story'), d, story);
    }
    const country = targets.country;
    if (country) {
      const d = `M${point(s)} C${point({ x: rightRail, y: s.y + 90 })} ${point({ x: rightRail, y: country.y - 70 })} ${point(country)}`;
      setRoute(routes.get('country'), d, country);
    }
    const category = targets.category;
    if (category) {
      const target = { x: Math.min(width - 13, category.x), y: category.y };
      const depart = { x: rightRail, y: targets.world.top - 35 };
      const d = `M${point(s)} C${point({ x: rightRail, y: s.y - 120 })} ${point({ x: rightRail, y: depart.y + 100 })} ${point(depart)} C${point({ x: rightRail, y: target.y + 70 })} ${point({ x: target.x + 45, y: target.y + 20 })} ${point(target)}`;
      setRoute(routes.get('category'), d, target);
    }
    const stage = targets.stage;
    if (stage) {
      const turn = { x: rightRail, y: targets.world.bottom - 15 };
      const d = `M${point(s)} C${point({ x: rightRail, y: s.y + 170 })} ${point({ x: rightRail, y: turn.y - 50 })} ${point(turn)} C${point({ x: rightRail, y: stage.y - 70 })} ${point({ x: stage.x + 30, y: stage.y - 30 })} ${point(stage)}`;
      setRoute(routes.get('stage'), d, stage);
    }
    escape.style.opacity = source.visible ? '1' : '0';
    root.dataset.selectedCountry = lastSelected;
    root.dataset.departureX = source.x.toFixed(1);
    root.dataset.departureY = source.y.toFixed(1);
  }

  function burst() {
    if (!source?.visible || motion.matches || document.body.classList.contains('page-motion-paused')) return;
    const now = performance.now();
    if (now - lastBurst < 650) return;
    lastBurst = now;
    for (const name of ['headline', 'story', 'country', 'category', 'stage']) {
      const route = routes.get(name);
      if (!route.d) continue;
      const path = svgNode('path', { class: 'page-route-fragment', fill: 'none', pathLength: '1000', d: route.d });
      fragments.append(path);
      fragmentsList.push({ path, route, start: now, duration: name === 'category' || name === 'stage' ? 2300 : 1600 });
    }
    requestPaint();
  }

  function paint(time) {
    frame = 0;
    if (removed || document.hidden) return;
    if (needsMeasure) measure();
    group.setAttribute('transform', `translate(0,${-scrollY})`);
    if (scrollDirty) {
      const progress = scrollY / Math.max(1, document.documentElement.scrollHeight - height);
      document.body.style.setProperty('--scroll-progress', progress.toFixed(4));
      for (const entry of measured) {
        const top = entry.box.top - scrollY;
        const p = clamp((height - top) / (entry.box.height + height), 0, 1);
        entry.element.style.setProperty('--section-progress', p.toFixed(4));
        const visible = top < height + 120 && top + entry.box.height > -120;
        entry.element.classList.toggle('is-in-view', visible);
        chapterRoutes[entry.index].g.classList.toggle('is-visible', visible);
      }
      scrollDirty = false;
    }
    shapeEscapes();
    const paused = document.body.classList.contains('page-motion-paused') || motion.matches;
    for (let i = fragmentsList.length - 1; i >= 0; i--) {
      const fragment = fragmentsList[i];
      if (paused) { fragment.path.remove(); fragmentsList.splice(i, 1); continue; }
      const p = clamp((time - fragment.start) / fragment.duration, 0, 1);
      fragment.path.setAttribute('d', fragment.route.d);
      fragment.path.style.strokeDashoffset = String(70 - p * 1070);
      fragment.path.style.opacity = String(Math.min(1, p * 8, (1 - p) * 6));
      if (p === 1) { fragment.path.remove(); fragmentsList.splice(i, 1); }
    }
    lastTime = time;
    if (fragmentsList.length) requestPaint();
  }
  function requestPaint() { if (!frame && !document.hidden && !removed) frame = requestAnimationFrame(paint); }
  const invalidate = () => { needsMeasure = true; scrollDirty = true; requestPaint(); };
  document.addEventListener('ipc:globe-frame', event => {
    const d = event.detail;
    if (!Number.isFinite(d?.x) || !Number.isFinite(d?.y)) return;
    const changed = lastSelected !== d.selected;
    lastSelected = d.selected;
    source = { x: d.x + scrollX, y: d.y + scrollY, visible: d.visible };
    document.body.classList.toggle('page-motion-paused', !!d.paused || !!d.reduced);
    root.dataset.linkedToGlobe = 'true';
    if (changed) { needsMeasure = true; setTimeout(burst, motion.matches ? 0 : 450); }
    requestPaint();
  });
  document.addEventListener('ipc:country-focus', () => { needsMeasure = true; requestPaint(); });
  document.addEventListener('ipc:country-select', () => { needsMeasure = true; requestPaint(); });
  document.querySelectorAll('.world-field-link').forEach(link => link.addEventListener('click', burst));
  window.addEventListener('scroll', () => {
    const now = performance.now();
    scrollVelocity = Math.min(1, Math.abs(scrollY - lastScroll) / Math.max(16, now - lastTime) / 2);
    root.style.setProperty('--route-speed', `${4.8 - scrollVelocity * 2}s`);
    lastScroll = scrollY; scrollDirty = true; requestPaint();
  }, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  document.addEventListener('toggle', invalidate, true);
  document.addEventListener('load', invalidate, true);
  const settleGeometry = event => {
    if (event.target instanceof Element && event.target.closest('.reveal,.world-story,.category-card,.sample-brief-card')) invalidate();
  };
  document.addEventListener('transitionend', settleGeometry, true);
  document.addEventListener('animationend', settleGeometry, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else invalidate();
  });
  motion.addEventListener('change', () => { document.body.classList.toggle('page-reduced-motion', motion.matches); requestPaint(); });
  new ResizeObserver(invalidate).observe(document.body);
  document.fonts.ready.then(invalidate);
  document.body.classList.toggle('page-reduced-motion', motion.matches);
  root.dataset.ready = 'true';
  window.addEventListener('pagehide', event => { if (!event.persisted) { removed = true; if (frame) cancelAnimationFrame(frame); } });
  invalidate();
}
