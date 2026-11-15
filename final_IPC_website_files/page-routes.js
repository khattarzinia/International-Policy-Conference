// Loose ink strokes in the margins. Nothing converges on a globe marker or text.
const SVG_NS = 'http://www.w3.org/2000/svg';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const svgNode = (tag, attributes = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
};

if (document.querySelector('.ipc-home .world-section')) createPageRoutes();

function createPageRoutes() {
  const root = svgNode('svg', { class: 'page-routes', 'aria-hidden': 'true', focusable: 'false' });
  const defs = svgNode('defs'), group = svgNode('g', { class: 'page-route-space' });
  root.append(defs, group); document.body.append(root);
  const sections = [...document.querySelectorAll('main > section, footer#contact')];
  const strokes = sections.map((section, index) => {
    const id = `ipc-margin-fade-${index}`;
    const gradient = svgNode('linearGradient', { id, gradientUnits: 'userSpaceOnUse' });
    for (const [offset, opacity] of [[0, 0], [.15, .55], [.4, .8], [.75, .2], [1, 0]]) {
      gradient.append(svgNode('stop', { offset, 'stop-color': index % 3 ? '#f58260' : '#a8cbb3', 'stop-opacity': opacity }));
    }
    defs.append(gradient);
    const g = svgNode('g', { class: 'page-route' });
    const line = svgNode('path', { class: 'page-route-line', fill: 'none', stroke: `url(#${id})` });
    const flight = svgNode('path', { class: 'page-route-flight', fill: 'none', stroke: `url(#${id})`, pathLength: '1000' });
    flight.style.animationDelay = `${index * -.73}s`;
    g.append(line, flight); group.append(g);
    return { section, g, line, flight, gradient, top: 0, height: 1 };
  });
  let frame = 0, dirty = true, removed = false, width = innerWidth, height = innerHeight;
  function measure() {
    width = innerWidth; height = innerHeight;
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    strokes.forEach((stroke, index) => {
      const r = stroke.section.getBoundingClientRect();
      stroke.top = r.top + scrollY; stroke.height = r.height;
      const right = index % 2 === 0, margin = width > 760 ? 18 : 5;
      const x = right ? width - margin : margin;
      const y = stroke.top + Math.min(80, r.height * .12);
      const length = Math.max(1, Math.min(r.height * .68, 510));
      const bow = (right ? -1 : 1) * (width > 760 ? 20 : 5);
      const d = `M ${x} ${y} C ${x + bow} ${y + length * .25}, ${x - bow} ${y + length * .6}, ${x} ${y + length}`;
      stroke.line.setAttribute('d', d); stroke.flight.setAttribute('d', d);
      for (const [key, value] of Object.entries({ x1: x, x2: x, y1: y, y2: y + length })) stroke.gradient.setAttribute(key, value);
    });
    dirty = false;
  }
  function paint() {
    frame = 0;
    if (removed || document.hidden) return;
    if (dirty) measure();
    group.setAttribute('transform', `translate(0,${-scrollY})`);
    document.body.style.setProperty('--scroll-progress', clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - height), 0, 1).toFixed(4));
    for (const stroke of strokes) {
      const top = stroke.top - scrollY;
      const visible = top < height + 120 && top + stroke.height > -120;
      stroke.section.style.setProperty('--section-progress', clamp((height - top) / (stroke.height + height), 0, 1).toFixed(4));
      stroke.section.classList.toggle('is-in-view', visible);
      stroke.g.classList.toggle('is-visible', visible);
    }
  }
  const requestPaint = () => { if (!frame && !document.hidden && !removed) frame = requestAnimationFrame(paint); };
  const invalidate = () => { dirty = true; requestPaint(); };
  const updateMotion = () => { document.body.classList.toggle('page-reduced-motion', motion.matches); requestPaint(); };
  document.addEventListener('ipc:globe-frame', event => {
    document.body.classList.toggle('page-motion-paused', !!event.detail?.paused || !!event.detail?.reduced);
  });
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  document.addEventListener('toggle', invalidate, true);
  document.addEventListener('load', invalidate, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else invalidate();
  });
  motion.addEventListener('change', updateMotion);
  const observer = new ResizeObserver(invalidate); observer.observe(document.body);
  document.fonts.ready.then(invalidate);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { removed = true; observer.disconnect(); if (frame) cancelAnimationFrame(frame); }
  });
  root.dataset.ready = 'true'; updateMotion(); invalidate();
}
