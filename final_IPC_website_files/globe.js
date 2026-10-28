import { geoGraticule10, geoInterpolate, geoOrthographic, geoPath, geoRotation } from './globe-assets/d3-geo-3.1.1.js';

const mount = document.querySelector('#ipc-globe');
const PLACES = [
  { id: '1', code: 'US', country: 'United States', topic: 'Healthcare', coordinates: [-98.58, 39.83], description: 'Expanding rural healthcare access through telehealth infrastructure.' },
  { id: '2', code: 'EU', country: 'European Union', topic: 'Environment', coordinates: [4.35, 50.85], description: 'Reducing emissions leakage through carbon border adjustments.' },
  { id: '3', code: 'IN', country: 'India', topic: 'Education', coordinates: [78.96, 20.59], description: 'Expanding digital literacy for girls in underserved districts.' },
  { id: '4', code: 'KE', country: 'Kenya', topic: 'Economic policy', coordinates: [37.9, -0.02], description: 'Supporting financial inclusion through mobile banking regulation.' },
  { id: '5', code: 'BR', country: 'Brazil', topic: 'Housing', coordinates: [-51.93, -14.24], description: 'Encouraging mixed-income housing through zoning reform.' },
  { id: '6', code: 'AU', country: 'Australia', topic: 'Technology', coordinates: [133.78, -25.27], description: 'Strengthening accountability for AI in public-sector decisions.' },
];
const TO_RADIANS = Math.PI / 180;
const GRATICULE = geoGraticule10();
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const wrap = value => ((value + 180) % 360 + 360) % 360 - 180;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function decodeLand(topology) {
  if (topology?.type !== 'Topology' || !topology.objects?.land || !Array.isArray(topology.arcs)) throw new Error('Invalid geographic data');
  const { scale, translate } = topology.transform;
  const cache = new Map();
  const arc = index => {
    const key = index < 0 ? ~index : index;
    if (!cache.has(key)) {
      let x = 0;
      let y = 0;
      cache.set(key, topology.arcs[key].map(point => {
        x += point[0]; y += point[1];
        return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
      }));
    }
    const points = cache.get(key);
    return index < 0 ? [...points].reverse() : points;
  };
  const ring = indexes => indexes.flatMap((index, position) => position ? arc(index).slice(1) : arc(index));
  const geometry = object => {
    if (object.type === 'GeometryCollection') return { type: 'GeometryCollection', geometries: object.geometries.map(geometry) };
    if (object.type === 'Polygon') return { type: 'Polygon', coordinates: object.arcs.map(ring) };
    if (object.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: object.arcs.map(polygon => polygon.map(ring)) };
    throw new Error('Unsupported geography');
  };
  return geometry(topology.objects.land);
}

function createAtlas(container) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { yaw: -12, pitch: -20, roll: -9, selected: '2', hovered: null, paused: motion.matches,
    reduced: motion.matches, visible: false, focused: false, dragging: false, width: 0, height: 0,
    radius: 0, cx: 0, cy: 0, raf: 0, last: 0, lastPaint: 0, land: null, tween: null,
    velocity: 0, markers: [], pointer: null, hoverPoint: null, dirty: true };
  container.classList.add('ipc-atlas');
  container.dataset.globeState = 'loading';

  const top = element('div', 'atlas-topline');
  const stamp = element('span', 'atlas-stamp', 'IPC / WORLD VIEW');
  const coordinates = element('span', 'atlas-coordinates', '18° N · 12° E');
  top.append(stamp, coordinates);
  const stage = element('div', 'atlas-stage');
  const canvas = element('canvas', 'atlas-canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Rotating geographic globe. Drag to explore, or use the arrow keys to rotate. Use the country buttons to explore policy examples.');
  canvas.setAttribute('aria-describedby', 'atlas-instructions');
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Home');
  const instructions = element('p', 'atlas-sr-only', 'Use left and right arrows to rotate east and west. Use up and down arrows to tilt. Home resets the view. Select a country below for a policy example.');
  instructions.id = 'atlas-instructions';
  const tooltip = element('div', 'atlas-tooltip');
  tooltip.hidden = true;
  const fallback = element('p', 'atlas-fallback', 'Explore six policy perspectives using the country buttons below.');
  fallback.hidden = true;
  stage.append(canvas, tooltip, fallback, instructions);

  const controls = element('div', 'atlas-controls');
  const gesture = element('span', 'atlas-gesture', 'DRAG TO EXPLORE');
  const pause = element('button', 'atlas-control atlas-motion-control');
  pause.type = 'button';
  const pauseIcon = element('span', 'atlas-motion-icon');
  pauseIcon.setAttribute('aria-hidden', 'true');
  const pauseText = element('span');
  pause.append(pauseIcon, pauseText);
  const reset = element('button', 'atlas-control atlas-reset', 'Reset view ↺');
  reset.type = 'button';
  reset.setAttribute('aria-label', 'Reset globe view');
  controls.append(gesture, pause, reset);

  const selectors = element('div', 'atlas-selectors');
  selectors.setAttribute('role', 'group');
  selectors.setAttribute('aria-label', 'Policy example locations');
  const buttons = new Map();
  for (const place of PLACES) {
    const button = element('button', 'atlas-place');
    button.type = 'button';
    button.dataset.countryId = place.id;
    button.setAttribute('aria-label', `${place.country}: ${place.topic}`);
    button.setAttribute('aria-pressed', String(place.id === state.selected));
    button.append(element('span', 'atlas-place-index', `0${place.id}`), element('span', 'atlas-place-code', place.code));
    button.addEventListener('click', () => select(place.id));
    button.addEventListener('focus', () => select(place.id));
    selectors.append(button);
    buttons.set(place.id, button);
  }
  const detail = element('div', 'atlas-detail');
  detail.setAttribute('aria-live', 'polite');
  detail.setAttribute('aria-atomic', 'true');
  const label = element('span', 'atlas-detail-label');
  const country = element('strong', 'atlas-detail-country');
  const description = element('p', 'atlas-detail-description');
  detail.append(label, country, description);
  const footer = element('div', 'atlas-footer');
  footer.append(element('span', '', 'ILLUSTRATIVE POLICY PERSPECTIVES'), element('span', '', 'NATURAL EARTH / 110M'));
  container.replaceChildren(top, stage, controls, selectors, detail, footer);

  const ctx = canvas.getContext('2d', { alpha: true });
  const projection = geoOrthographic().precision(0.45).clipAngle(90);
  const path = ctx ? geoPath(projection, ctx) : null;
  const routes = PLACES.filter(place => place.id !== '2').map((place, index) => {
    const interpolate = geoInterpolate(PLACES[1].coordinates, place.coordinates);
    return { target: place.id, phase: index * 0.17, points: Array.from({ length: 49 }, (_, i) => {
      const t = i / 48;
      return { coordinate: interpolate(t), lift: Math.sin(t * Math.PI) * 0.14, t };
    }) };
  });

  function updateControls() {
    pause.setAttribute('aria-pressed', String(state.paused));
    pause.disabled = state.reduced || !ctx || !state.land;
    reset.disabled = !ctx || !state.land;
    pause.setAttribute('aria-label', state.reduced ? 'Automatic globe rotation disabled for reduced motion' : state.paused ? 'Resume globe rotation' : 'Pause globe rotation');
    pauseText.textContent = state.reduced ? 'Motion off' : state.paused ? 'Resume' : 'Pause';
    pauseIcon.dataset.paused = String(state.paused);
    container.dataset.globeState = state.land ? state.paused ? 'paused' : 'running' : container.dataset.globeState;
  }

  function select(id, notify = true) {
    const place = PLACES.find(item => item.id === String(id));
    if (!place) return;
    const changed = state.selected !== place.id;
    state.selected = place.id;
    state.velocity = 0;
    const targetYaw = -place.coordinates[0];
    const targetPitch = -place.coordinates[1];
    const deltaYaw = wrap(targetYaw - state.yaw);
    state.tween = state.reduced ? null : { fromYaw: state.yaw, fromPitch: state.pitch, fromRoll: state.roll,
      yaw: state.yaw + deltaYaw, pitch: targetPitch, start: performance.now(), duration: 900 };
    if (state.reduced) { state.yaw = targetYaw; state.pitch = targetPitch; state.roll = 0; }
    for (const [key, button] of buttons) button.setAttribute('aria-pressed', String(key === place.id));
    label.textContent = `0${place.id} / ${place.topic}`;
    country.textContent = place.country;
    description.textContent = place.description;
    if (notify && changed) document.dispatchEvent(new CustomEvent('ipc:country-select', { detail: { id: place.id, country: place.country } }));
    requestDraw();
  }

  function screenPoint(coordinate, rotation, lift = 0) {
    const point = rotation(coordinate);
    const longitude = point[0] * TO_RADIANS;
    const latitude = point[1] * TO_RADIANS;
    const z = Math.cos(latitude) * Math.cos(longitude);
    return { x: state.cx + Math.cos(latitude) * Math.sin(longitude) * state.radius * (1 + lift),
      y: state.cy - Math.sin(latitude) * state.radius * (1 + lift), z };
  }

  function paint(time) {
    if (!ctx || !state.width || !state.land) return;
    const { width: w, height: h, radius: r, cx, cy } = state;
    const rotation = geoRotation([state.yaw, state.pitch, state.roll]);
    projection.translate([cx, cy]).scale(r).rotate([state.yaw, state.pitch, state.roll]);
    ctx.clearRect(0, 0, w, h);

    // A quiet cartographic frame makes the sphere feel suspended in space.
    ctx.save();
    ctx.strokeStyle = 'rgba(233,232,222,0.09)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.22, cy); ctx.lineTo(cx + r * 1.22, cy);
    ctx.moveTo(cx, cy - r * 1.2); ctx.lineTo(cx, cy + r * 1.2);
    ctx.stroke();
    ctx.translate(cx, cy); ctx.rotate(-0.32);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.22, r * 0.36, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233,232,222,0.23)'; ctx.stroke();
    ctx.restore();

    const atmosphere = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.085);
    atmosphere.addColorStop(0, 'rgba(191,216,190,0.22)');
    atmosphere.addColorStop(1, 'rgba(191,216,190,0)');
    ctx.fillStyle = atmosphere; ctx.beginPath(); ctx.arc(cx, cy, r * 1.085, 0, Math.PI * 2); ctx.fill();
    const ocean = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.4, r * 0.1, cx, cy, r);
    ocean.addColorStop(0, '#264b43'); ocean.addColorStop(0.63, '#143930'); ocean.addColorStop(1, '#082321');
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = ocean; ctx.fill();

    ctx.beginPath(); path(GRATICULE);
    ctx.strokeStyle = 'rgba(206,225,202,0.12)'; ctx.lineWidth = 0.55; ctx.stroke();
    const landColor = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    landColor.addColorStop(0, '#83947e'); landColor.addColorStop(0.6, '#59705f'); landColor.addColorStop(1, '#354f45');
    ctx.beginPath(); path(state.land); ctx.fillStyle = landColor; ctx.fill();
    ctx.strokeStyle = 'rgba(233,232,222,0.63)'; ctx.lineWidth = 0.65; ctx.stroke();

    const shade = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.35, r * 0.12, cx + r * 0.12, cy + r * 0.06, r * 1.18);
    shade.addColorStop(0, 'rgba(7,22,20,0)'); shade.addColorStop(0.65, 'rgba(7,22,20,0.04)'); shade.addColorStop(1, 'rgba(3,14,13,0.67)');
    ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233,232,222,0.46)'; ctx.lineWidth = 0.8; ctx.stroke();

    for (const route of routes) {
      const active = route.target === state.selected || state.selected === '2';
      ctx.beginPath();
      let started = false;
      for (const item of route.points) {
        const point = screenPoint(item.coordinate, rotation, item.lift);
        if (point.z < 0.01) { started = false; continue; }
        if (started) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y);
        started = true;
      }
      ctx.setLineDash(active ? [] : [2, 5]);
      ctx.lineWidth = active ? 1.2 : 0.7;
      ctx.strokeStyle = active ? 'rgba(240,100,72,0.72)' : 'rgba(232,232,220,0.24)';
      ctx.stroke(); ctx.setLineDash([]);
      if (!state.reduced) {
        const progress = ((time * 0.000055 + route.phase) % 1);
        const item = route.points[Math.min(48, Math.floor(progress * 48))];
        const particle = screenPoint(item.coordinate, rotation, item.lift);
        if (particle.z > 0.03) {
          ctx.beginPath(); ctx.arc(particle.x, particle.y, active ? 2.1 : 1.3, 0, Math.PI * 2);
          ctx.fillStyle = active ? '#f7b091' : '#dae1cd'; ctx.fill();
        }
      }
    }

    state.markers.length = 0;
    for (const place of PLACES) {
      const point = screenPoint(place.coordinates, rotation);
      if (point.z <= 0.015) continue;
      const active = place.id === state.selected || place.id === state.hovered;
      state.markers.push({ ...point, place });
      if (active) {
        ctx.beginPath(); ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240,100,72,0.15)'; ctx.fill();
        ctx.strokeStyle = 'rgba(247,176,145,0.6)'; ctx.lineWidth = 0.7; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(point.x, point.y, active ? 4.2 : 3.1, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#ff9b79' : '#edeee0'; ctx.fill();
      ctx.strokeStyle = '#0c2b26'; ctx.lineWidth = 1.5; ctx.stroke();
      if (active) {
        ctx.font = '500 9px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#f2eee3'; ctx.textBaseline = 'middle';
        const alignRight = point.x > cx + r * 0.6;
        ctx.textAlign = alignRight ? 'right' : 'left';
        ctx.fillText(place.code, point.x + (alignRight ? -18 : 18), point.y);
      }
    }
    ctx.fillStyle = 'rgba(233,232,222,0.38)'; ctx.font = '500 8px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - r * 1.15); ctx.fillText('S', cx, cy + r * 1.15);
    const latitude = Math.round(-state.pitch);
    const longitude = Math.round(-wrap(state.yaw));
    coordinates.textContent = `${Math.abs(latitude)}° ${latitude >= 0 ? 'N' : 'S'} · ${Math.abs(longitude)}° ${longitude >= 0 ? 'E' : 'W'}`;
    if (state.hovered) positionTooltip();
    canvas.dataset.globeReady = 'true';
  }

  function animate(time) {
    state.raf = 0;
    if (!state.visible || document.hidden || !state.land) return;
    const elapsed = state.last ? Math.min(time - state.last, 64) : 16;
    state.last = time;
    if (state.tween) {
      const t = clamp((time - state.tween.start) / state.tween.duration, 0, 1);
      const eased = 1 - (1 - t) ** 3;
      state.yaw = state.tween.fromYaw + (state.tween.yaw - state.tween.fromYaw) * eased;
      state.pitch = state.tween.fromPitch + (state.tween.pitch - state.tween.fromPitch) * eased;
      state.roll = state.tween.fromRoll * (1 - eased);
      if (t === 1) state.tween = null;
    } else if (!state.paused && !state.reduced && !state.dragging && !state.focused && !state.hovered) {
      state.yaw = wrap(state.yaw + elapsed * 0.0018 + state.velocity * elapsed / 16);
      state.velocity *= 0.92;
    }
    if (state.dirty || time - state.lastPaint >= 32 || state.dragging || state.tween || state.reduced || state.paused) {
      paint(time); state.lastPaint = time; state.dirty = false;
    }
    if (state.tween || state.dragging || (!state.paused && !state.reduced && !state.focused && !state.hovered)) state.raf = requestAnimationFrame(animate);
  }

  function requestDraw() {
    state.dirty = true;
    if (state.raf || !state.visible || document.hidden || !state.land) return;
    state.raf = requestAnimationFrame(animate);
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    state.width = rect.width; state.height = rect.height;
    state.radius = Math.min(rect.width, rect.height) * 0.39;
    state.cx = rect.width / 2; state.cy = rect.height / 2;
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    requestDraw();
  }

  function markerAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    return state.markers.find(marker => Math.hypot(marker.x - x, marker.y - y) < 17);
  }

  function positionTooltip() {
    const marker = state.markers.find(item => item.place.id === state.hovered);
    if (!marker) { tooltip.hidden = true; return; }
    tooltip.textContent = `${marker.place.country} / ${marker.place.topic}`;
    tooltip.hidden = false;
    tooltip.style.left = `${clamp(marker.x, 95, state.width - 95)}px`;
    tooltip.style.top = `${Math.max(12, marker.y - 28)}px`;
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    state.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
    state.dragging = true; state.tween = null; state.velocity = 0; state.hovered = null; tooltip.hidden = true;
    canvas.setPointerCapture(event.pointerId);
    container.classList.add('is-dragging');
    requestDraw();
  });
  canvas.addEventListener('pointermove', event => {
    if (state.dragging && state.pointer?.id === event.pointerId) {
      const delta = event.clientX - state.pointer.x;
      state.yaw = wrap(state.yaw + delta * 0.3);
      state.pitch = clamp(state.pitch - (event.clientY - state.pointer.y) * 0.25, -75, 75);
      state.velocity = delta * 0.035;
      state.pointer.x = event.clientX; state.pointer.y = event.clientY;
      requestDraw();
    } else {
      const marker = markerAt(event);
      const id = marker?.place.id || null;
      if (state.hovered !== id) {
        state.hovered = id;
        canvas.classList.toggle('is-over-marker', !!id);
        tooltip.hidden = !id;
        positionTooltip(); requestDraw();
      }
    }
  });
  const release = event => {
    if (!state.pointer || state.pointer.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - state.pointer.startX, event.clientY - state.pointer.startY);
    state.dragging = false; state.pointer = null; container.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (distance < 7 && event.type === 'pointerup') { const marker = markerAt(event); if (marker) select(marker.place.id); }
    requestDraw();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { state.hovered = null; tooltip.hidden = true; requestDraw(); });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault(); state.tween = null; state.velocity = 0;
    if (event.key === 'ArrowLeft') state.yaw -= 12;
    if (event.key === 'ArrowRight') state.yaw += 12;
    if (event.key === 'ArrowUp') state.pitch = clamp(state.pitch + 10, -75, 75);
    if (event.key === 'ArrowDown') state.pitch = clamp(state.pitch - 10, -75, 75);
    if (event.key === 'Home') { state.yaw = -12; state.pitch = -20; state.roll = -9; }
    requestDraw();
  });
  container.addEventListener('focusin', event => { state.focused = !pause.contains(event.target) && !reset.contains(event.target); requestDraw(); });
  container.addEventListener('focusout', event => { if (!container.contains(event.relatedTarget)) { state.focused = false; state.last = 0; requestDraw(); } });
  pause.addEventListener('click', () => { state.paused = !state.paused; state.velocity = 0; updateControls(); requestDraw(); });
  reset.addEventListener('click', () => { state.yaw = -12; state.pitch = -20; state.roll = -9; state.tween = null; state.velocity = 0; requestDraw(); });
  document.addEventListener('ipc:country-focus', event => select(event.detail?.id));
  document.addEventListener('visibilitychange', () => { state.last = 0; if (document.hidden && state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; } else requestDraw(); });
  motion.addEventListener('change', event => { state.reduced = event.matches; if (event.matches) { state.paused = true; state.tween = null; } updateControls(); requestDraw(); });
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => {
    state.visible = entries.some(entry => entry.isIntersecting);
    state.last = 0;
    if (!state.visible && state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
    requestDraw();
  }, { rootMargin: '60px' }).observe(container);

  updateControls();
  // Set the initial lens without moving the deliberately composed default view.
  label.textContent = '02 / Environment'; country.textContent = PLACES[1].country; description.textContent = PLACES[1].description;
  if (!ctx) {
    canvas.hidden = true; fallback.hidden = false; container.dataset.globeState = 'fallback';
    pause.disabled = true; reset.disabled = true;
    return;
  }
  fetch(new URL('./globe-assets/land-110m.json', import.meta.url))
    .then(response => { if (!response.ok) throw new Error('Map data unavailable'); return response.json(); })
    .then(topology => { state.land = decodeLand(topology); updateControls(); resize(); requestDraw(); })
    .catch(() => {
      canvas.hidden = true; fallback.hidden = false; container.dataset.globeState = 'fallback';
      pause.disabled = true; reset.disabled = true;
    });
}

if (mount) createAtlas(mount);
