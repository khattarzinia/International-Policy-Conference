// One Three.js scene shared by the country stories and policy-category links.
const mount = document.getElementById('ipc-globe');
const PLACES = [
  { id: '1', country: 'United States', short: 'United States', lon: -98.58, lat: 39.83 },
  { id: '2', country: 'European Union', short: 'European Union', lon: 4.35, lat: 50.85 },
  { id: '3', country: 'India', short: 'India', lon: 78.96, lat: 20.59 },
  { id: '4', country: 'Kenya', short: 'Kenya', lon: 37.9, lat: -0.02 },
  { id: '5', country: 'Brazil', short: 'Brazil', lon: -51.93, lat: -14.24 },
  { id: '6', country: 'Australia', short: 'Australia', lon: 133.78, lat: -25.27 },
];
const HOST = { lon: -71.1097, lat: 42.3736 };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => 1 - (1 - t) ** 4;

if (mount) setupWorld(mount);

function setupWorld(container) {
  const section = container.closest('.world-section');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pause = section.querySelector('.world-motion');
  const reset = section.querySelector('.world-reset');
  const status = section.querySelector('.world-status');
  const state = { selected: '2', paused: motion.matches, reduced: motion.matches, visible: false,
    loading: false, ready: false, failed: false, viewer: null };
  container.dataset.globeState = 'loading';
  pause.disabled = true; reset.disabled = true;
  const updateMotion = () => {
    pause.setAttribute('aria-pressed', String(state.paused));
    pause.setAttribute('aria-label', state.reduced ? 'Globe motion disabled for reduced motion' : state.paused ? 'Resume globe rotation' : 'Pause globe rotation');
    pause.innerHTML = state.reduced ? '<span aria-hidden="true">Ⅱ</span> Motion off' : state.paused ? '<span aria-hidden="true">▷</span> Resume motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
    pause.disabled = state.reduced || !state.ready;
  };
  const select = (id, notify = false) => {
    const place = PLACES.find(p => p.id === String(id));
    if (!place) return;
    state.selected = place.id;
    container.dataset.selectedCountry = place.id;
    state.viewer?.select(place.id);
    if (notify) document.dispatchEvent(new CustomEvent('ipc:country-select', { detail: { id: place.id, country: place.country } }));
  };
  document.addEventListener('ipc:country-focus', event => select(event.detail?.id));
  pause.addEventListener('click', () => { state.paused = !state.paused; updateMotion(); state.viewer?.pauseChange(); });
  reset.addEventListener('click', () => state.viewer?.select(state.selected));
  motion.addEventListener('change', event => {
    state.reduced = event.matches;
    if (event.matches) state.paused = true;
    updateMotion(); state.viewer?.motionChange();
  });
  const fail = () => {
    state.failed = true; state.ready = false;
    container.dataset.globeState = 'fallback';
    pause.disabled = true; reset.disabled = true;
    status.textContent = 'The 3D view is unavailable. All six policy examples can still be explored with the country buttons.';
    state.viewer?.stop();
  };
  const load = async () => {
    if (state.loading) return;
    state.loading = true;
    try {
      const THREE = await import('./globe-assets/three-0.186.1/three.module.js');
      if (state.failed) return;
      state.viewer = await createScene(THREE, container, state, id => select(id, true), fail);
      if (state.failed) { state.viewer.stop(); return; }
      state.ready = true; container.dataset.globeState = 'ready';
      container.dataset.engine = `Three.js r${THREE.REVISION}`;
      pause.disabled = state.reduced; reset.disabled = false;
      updateMotion(); state.viewer.select(state.selected, true); state.viewer.draw();
    } catch { fail(); }
  };
  new IntersectionObserver(entries => {
    state.visible = entries.some(entry => entry.isIntersecting);
    if (state.visible) { load(); state.viewer?.draw(); }
    else state.viewer?.suspend();
  }, { rootMargin: '120px' }).observe(container);
  document.addEventListener('visibilitychange', () => document.hidden ? state.viewer?.suspend() : state.viewer?.draw());
  updateMotion();
  select('2');
}

async function createScene(T, container, state, onSelect, onFailure) {
  const canvas = document.createElement('canvas');
  canvas.className = 'world-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D globe. Drag to rotate. Select a country marker to explore its policy question. Arrow keys rotate; Home recenters the selected country.');
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Home');
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x102e2b, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  container.append(canvas);
  const pins = document.createElement('div'); pins.className = 'world-pins'; container.append(pins);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 20);
  camera.position.set(0, 0, 4.2);
  const world = new T.Group(); scene.add(world);
  const position = (lon, lat, radius = 1) => {
    const a = lon * Math.PI / 180, b = lat * Math.PI / 180;
    return new T.Vector3(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a)).multiplyScalar(radius);
  };
  const [colorMap, landMask] = await Promise.all([
    new T.TextureLoader().loadAsync(new URL('./globe-assets/textures/earth-policy.png', import.meta.url).href),
    new T.TextureLoader().loadAsync(new URL('./globe-assets/textures/earth-landmask.png', import.meta.url).href),
  ]).catch(error => { renderer.dispose(); throw error; });
  colorMap.colorSpace = T.SRGBColorSpace;
  colorMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const earthMaterial = new T.MeshStandardMaterial({ map: colorMap, bumpMap: landMask, bumpScale: .018,
    roughness: .76, metalness: .08, color: 0xf7f4e9 });
  const earth = new T.Mesh(new T.SphereGeometry(1, 96, 64), earthMaterial);
  world.add(earth);
  scene.add(new T.AmbientLight(0x9fae9c, 1.9));
  const sun = new T.DirectionalLight(0xfff0d2, 3.6); sun.position.set(-2.5, 3.5, 4); scene.add(sun);
  const edge = new T.DirectionalLight(0x91b7a7, 2.8); edge.position.set(3, .5, -2); scene.add(edge);
  const fill = new T.DirectionalLight(0x6c9583, .7); fill.position.set(0, -3, 2); scene.add(fill);
  const atmosphere = new T.Mesh(new T.SphereGeometry(1.035, 64, 48), new T.ShaderMaterial({
    uniforms: { tint: { value: new T.Color(0x8da98e) } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'uniform vec3 tint; varying vec3 vNormal; varying vec3 vView; void main(){float rim=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.8);gl_FragColor=vec4(tint,rim*.35);}',
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  }));
  world.add(atmosphere);

  const markers = [];
  const hitTargets = [];
  const markerGeometry = new T.SphereGeometry(.009, 12, 8);
  const markerMaterial = new T.MeshBasicMaterial({ color: 0xffcda6 });
  const ringGeometry = new T.RingGeometry(.018, .020, 40);
  const normalZ = new T.Vector3(0, 0, 1);
  for (const place of [...PLACES, { ...HOST, id: 'host', country: 'Cambridge · Finals 2027', short: 'Cambridge · Finals 2027' }]) {
    const anchor = position(place.lon, place.lat, 1.014);
    const dot = new T.Mesh(markerGeometry, markerMaterial); dot.position.copy(anchor); world.add(dot);
    const ring = new T.Mesh(ringGeometry, new T.MeshBasicMaterial({ color: 0xf96b48, transparent: true, opacity: .8, side: T.DoubleSide, depthWrite: false }));
    ring.position.copy(position(place.lon, place.lat, 1.016)); ring.quaternion.setFromUnitVectors(normalZ, anchor.clone().normalize()); world.add(ring);
    const button = document.createElement(place.id === 'host' ? 'span' : 'button');
    button.className = `world-pin${place.id === 'host' ? ' world-pin-host' : ''}`;
    button.textContent = place.short;
    button.dataset.markerId = place.id;
    button.hidden = true;
    if (place.id !== 'host') {
      button.type = 'button'; button.setAttribute('aria-label', `Explore ${place.country} policy example`);
      button.setAttribute('aria-pressed', String(place.id === state.selected));
      button.addEventListener('click', () => onSelect(place.id));
      const hit = new T.Mesh(new T.SphereGeometry(.045, 8, 6), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
      hit.position.copy(anchor); hit.userData.countryId = place.id; world.add(hit); hitTargets.push(hit);
    }
    pins.append(button);
    markers.push({ place, anchor, dot, ring, button });
  }

  // These arcs connect policy perspectives, not participant or chapter locations.
  const routes = [];
  const makeCurve = (from, to, lift) => {
    const a = position(from.lon, from.lat), b = position(to.lon, to.lat);
    const angle = a.angleTo(b);
    const points = Array.from({ length: 73 }, (_, i) => {
      const t = i / 72;
      const v = angle < .001 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * angle)).add(b.clone().multiplyScalar(Math.sin(t * angle))).divideScalar(Math.sin(angle));
      return v.normalize().multiplyScalar(1.016 + Math.sin(Math.PI * t) * lift);
    });
    return new T.CatmullRomCurve3(points);
  };
  for (const place of PLACES) {
    const curve = makeCurve(HOST, place, .12 + Math.abs(place.lon - HOST.lon) / 1000);
    const material = new T.MeshBasicMaterial({ color: 0xf76b49, transparent: true, opacity: .17, depthWrite: false });
    const line = new T.Mesh(new T.TubeGeometry(curve, 100, .0014, 4, false), material); world.add(line);
    const bead = new T.Mesh(new T.SphereGeometry(.006, 8, 6), new T.MeshBasicMaterial({ color: 0xffb68b }));
    world.add(bead);
    routes.push({ id: place.id, curve, line, bead, material, phase: Number(place.id) / 6 });
  }

  // Sparse raised land points gives the surface physical depth as it turns.
  const points = [];
  const maskCanvas = document.createElement('canvas'); maskCanvas.width = 360; maskCanvas.height = 180;
  const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (maskContext) {
    maskContext.drawImage(landMask.image, 0, 0, 360, 180);
    const pixels = maskContext.getImageData(0, 0, 360, 180).data;
    for (let lat = -75; lat < 81; lat += 2.5) {
      const step = 2.5 / Math.max(.25, Math.cos(lat * Math.PI / 180));
      for (let lon = -180; lon < 180; lon += step) {
        const x = clamp(Math.floor(lon + 180), 0, 359), y = clamp(Math.floor(90 - lat), 0, 179);
        if (pixels[(y * 360 + x) * 4] < 160) continue;
        const v = position(lon, lat, 1.004); points.push(v.x, v.y, v.z);
      }
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    world.add(new T.Points(geometry, new T.PointsMaterial({ color: 0xfff5d3, size: .0035, transparent: true, opacity: .32, depthWrite: false })));
  }

  let raf = 0, lastPaint = 0, width = 0, height = 0, tween = null, disposed = false;
  let pointer = null, dragging = false, hovered = false, focused = false;
  let resumeAt = 0, frameCount = 0;
  const idleBase = new T.Quaternion();
  const raycaster = new T.Raycaster(), mouse = new T.Vector2();
  const projected = new T.Vector3(), worldPoint = new T.Vector3(), normal = new T.Vector3();
  const dragRotation = new T.Quaternion();
  const rotationAxis = new T.Vector3(0, 1, 0), pitchAxis = new T.Vector3(1, 0, 0);
  const targetFor = id => {
    const p = PLACES.find(place => place.id === id);
    // Apply longitude first, then latitude: this preserves geographic north.
    const yaw = new T.Quaternion().setFromAxisAngle(rotationAxis, -p.lon * Math.PI / 180 - Math.PI / 2);
    const tilt = new T.Quaternion().setFromAxisAngle(pitchAxis, p.lat * Math.PI / 180 - .18);
    return tilt.multiply(yaw);
  };
  world.quaternion.copy(targetFor(state.selected));
  idleBase.copy(world.quaternion);
  const rememberPose = (delay = 600) => { idleBase.copy(world.quaternion); resumeAt = performance.now() + delay; };
  const isActive = () => !disposed && state.ready && state.visible && !document.hidden && !state.failed;
  function render(time) {
    world.updateMatrixWorld(true);
    const stageBounds = container.getBoundingClientRect();
    for (const m of markers) {
      worldPoint.copy(m.anchor).applyQuaternion(world.quaternion);
      normal.copy(camera.position).sub(worldPoint).normalize();
      const visible = worldPoint.clone().normalize().dot(normal) > .04;
      projected.copy(worldPoint).project(camera);
      const x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height;
      const viewportX = stageBounds.left + x;
      const onStage = visible && x > 12 && x < width - 12 && viewportX > 16 && viewportX < innerWidth - 16 && y > 25 && y < height - 25;
      m.button.hidden = !onStage;
      if (onStage) {
        m.button.style.left = `${x}px`; m.button.style.top = `${y}px`;
        m.button.classList.toggle('is-left', viewportX > innerWidth - 160);
      }
      const active = m.place.id === state.selected;
      m.ring.visible = active || m.place.id === 'host';
      m.ring.scale.setScalar(active && !state.reduced && !state.paused ? 1 + .2 * Math.sin(time * .0025) : 1);
      m.ring.material.opacity = active ? .85 : .35;
      m.dot.scale.setScalar(active ? 1.5 : .85);
      if (m.place.id !== 'host') m.button.setAttribute('aria-pressed', String(active));
    }
    for (const route of routes) {
      const active = route.id === state.selected;
      route.material.opacity = active ? .88 : .16;
      route.bead.visible = active;
      const t = state.reduced || state.paused ? .48 : (time * .00009 + route.phase) % 1;
      route.bead.position.copy(route.curve.getPoint(t));
      route.bead.scale.setScalar(active ? 1.5 : 1);
    }
    renderer.render(scene, camera);
    canvas.dataset.globeReady = 'true';
    canvas.dataset.frames = String(++frameCount);
  }
  function animate(time) {
    raf = 0;
    if (!isActive()) return;
    if (tween) {
      const t = clamp((time - tween.start) / 1200, 0, 1);
      world.quaternion.slerpQuaternions(tween.from, tween.to, ease(t));
      if (t === 1) { tween = null; rememberPose(2500); }
    } else if (!state.paused && !state.reduced && !dragging && !hovered && !focused && time > resumeAt) {
      // Keep the selected country in view while giving the scene a gentle drift.
      world.quaternion.copy(idleBase);
      dragRotation.setFromAxisAngle(rotationAxis, Math.sin((time - resumeAt) * .0003) * .14);
      world.quaternion.premultiply(dragRotation);
    }
    if (time - lastPaint > 32 || tween || dragging || state.paused || state.reduced) { render(time); lastPaint = time; }
    if (tween || dragging || (!state.paused && !state.reduced)) raf = requestAnimationFrame(animate);
  }
  function draw() { if (isActive() && !raf) { raf = requestAnimationFrame(animate); } }
  function suspend() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function select(id, immediate = false) {
    if (!PLACES.some(p => p.id === id)) return;
    const target = targetFor(id);
    tween = state.reduced || immediate ? null : { from: world.quaternion.clone(), to: target, start: performance.now() };
    if (!tween) { world.quaternion.copy(target); rememberPose(2500); }
    draw();
  }
  function resize() {
    const rect = container.getBoundingClientRect(); width = rect.width; height = rect.height;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.z = width < 600 ? 4.0 : 3.9;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
  }
  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const earthHit = raycaster.intersectObject(earth)[0];
    const markerHit = raycaster.intersectObjects(hitTargets)[0];
    return markerHit && (!earthHit || markerHit.distance < earthHit.distance + .025) ? markerHit.object.userData.countryId : null;
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, type: event.pointerType };
    tween = null;
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id === event.pointerId) {
      const totalX = event.clientX - pointer.startX, totalY = event.clientY - pointer.startY;
      if (!dragging && pointer.type === 'touch' && Math.abs(totalY) > Math.abs(totalX) && Math.abs(totalY) > 7) { pointer = null; return; }
      if (!dragging && Math.hypot(totalX, totalY) > 5) {
        dragging = true; canvas.setPointerCapture(event.pointerId); container.classList.add('is-dragging');
      }
      if (dragging) {
        dragRotation.setFromAxisAngle(rotationAxis, (event.clientX - pointer.x) * .006); world.quaternion.premultiply(dragRotation);
        dragRotation.setFromAxisAngle(pitchAxis, (event.clientY - pointer.y) * .006); world.quaternion.premultiply(dragRotation);
        pointer.x = event.clientX; pointer.y = event.clientY; resumeAt = performance.now() + 1000; draw();
      }
    } else {
      hovered = !!hit(event); container.classList.toggle('is-hovering', hovered);
    }
  });
  const release = event => {
    if (pointer?.id !== event.pointerId) return;
    if (!dragging && event.type === 'pointerup') { const id = hit(event); if (id) onSelect(id); }
    pointer = null; dragging = false; container.classList.remove('is-dragging');
    rememberPose();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    draw();
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { hovered = false; container.classList.remove('is-hovering'); draw(); });
  canvas.addEventListener('focus', () => { focused = true; draw(); });
  canvas.addEventListener('blur', () => { focused = false; draw(); });
  pins.addEventListener('focusin', () => { focused = true; draw(); });
  pins.addEventListener('focusout', event => { if (!pins.contains(event.relatedTarget)) { focused = false; draw(); } });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)) return;
    event.preventDefault(); tween = null;
    if (event.key === 'Home') select(state.selected);
    else {
      const horizontal = ['ArrowLeft','ArrowRight'].includes(event.key);
      dragRotation.setFromAxisAngle(horizontal ? rotationAxis : pitchAxis, (['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1) * .16);
      world.quaternion.premultiply(dragRotation); draw();
      rememberPose();
    }
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); onFailure(); });
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const stop = () => {
    if (disposed) return;
    suspend(); disposed = true; observer.disconnect();
    scene.traverse(object => { object.geometry?.dispose(); if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); });
    colorMap.dispose(); landMask.dispose(); renderer.dispose();
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) stop(); });
  return { select, draw, suspend, stop,
    pauseChange() { rememberPose(); draw(); },
    motionChange() { if (state.reduced) { tween = null; world.quaternion.copy(targetFor(state.selected)); } rememberPose(); draw(); } };
}
