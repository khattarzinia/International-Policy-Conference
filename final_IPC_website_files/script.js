(() => {
  const root = document.documentElement;
  const loader = document.getElementById('ipc-loader');
  const svg = document.getElementById('ipc-loader-svg');
  const glyphI = document.getElementById('ipc-glyph-i');
  const glyphP = document.getElementById('ipc-glyph-p');
  const glyphC = document.getElementById('ipc-glyph-c');
  const curtain = document.getElementById('ipc-curtain');
  const topShield = document.getElementById('ipc-top-shield');
  const topFeather = document.getElementById('ipc-top-feather');

  if (loader && svg && glyphI && glyphP && glyphC && curtain) {
    let dismissed = false;
    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
    const easeLiquid = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const cubicPt = (t, p0, p1, p2, p3) => {
      const m = 1 - t;
      return (
        m * m * m * p0 +
        3 * m * m * t * p1 +
        3 * m * t * t * p2 +
        t * t * t * p3
      );
    };

    const getViewportBounds = () => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { xLeft: 0, xRight: 1200, yTop: -100, yBot: 700, yHeroTop: 10 };
      const inv = ctm.inverse();
      const pt = svg.createSVGPoint();
      pt.x = 0; pt.y = 0;
      const tl = pt.matrixTransform(inv);
      pt.x = window.innerWidth; pt.y = window.innerHeight;
      const br = pt.matrixTransform(inv);
      const header = document.querySelector('.site-header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      pt.x = 0; pt.y = headerBottom;
      const heroTop = pt.matrixTransform(inv);
      return { xLeft: tl.x, xRight: br.x, yTop: tl.y, yBot: br.y, yHeroTop: heroTop.y };
    };

    const cleanup = () => {
      root.classList.remove('ipc-loading', 'ipc-loader-exiting');
      loader.remove();
    };

    const triggerExit = () => {
      if (dismissed) return;
      dismissed = true;
      root.classList.remove('ipc-loading');
      root.classList.add('ipc-loader-exiting');

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTimeout(cleanup, 340);
        return;
      }

      const duration = 1280;
      const start = performance.now();

      const step = now => {
        const p = clamp((now - start) / duration, 0, 1);
        const { xLeft, xRight, yTop, yBot, yHeroTop } = getViewportBounds();
        const vW = xRight - xLeft;
        const vH = yBot - yTop;
        const xMid = (xLeft + xRight) / 2;

        // Position soft top mask feather right at the hero/header seam (above resting letters)
        if (topShield && topFeather) {
          const featherY = Math.min(yHeroTop, 20);
          const featherH = Math.max(45, Math.min(95, 86 - featherY));
          topShield.setAttribute('y', (featherY - 6000).toFixed(1));
          topShield.setAttribute('height', '6000');
          topFeather.setAttribute('y', featherY.toFixed(1));
          topFeather.setAttribute('height', featherH.toFixed(1));
        }

        // 1. P glides straight up smoothly and dissolves gently into the top feather
        const uP = clamp(p / 0.72, 0, 1);
        const eP = easeLiquid(uP);
        const dyP = -eP * (525 - yHeroTop + 90);
        glyphP.setAttribute('transform', `translate(0 ${dyP.toFixed(2)})`);
        const fadeP = 1 - clamp((uP - 0.42) / 0.42, 0, 1);
        glyphP.setAttribute('opacity', fadeP.toFixed(3));

        // 2. I rises UP FIRST along a vertical tangent, then curves fluidly into the left edge
        const uSide = clamp((p - 0.03) / 0.78, 0, 1);
        const eSide = easeLiquid(uSide);
        const heroHeadroom = Math.max(80, 96 - yHeroTop);
        const riseSide = Math.min(vH * 0.28, heroHeadroom + vH * 0.06);
        const endXI = -(320 - xLeft + 90);
        const dxI = cubicPt(eSide, 0, 0, -vW * 0.22, endXI);
        const dyI = cubicPt(eSide, 0, -riseSide * 0.85, -riseSide * 1.05, -riseSide);
        glyphI.setAttribute('transform', `translate(${dxI.toFixed(2)} ${dyI.toFixed(2)})`);

        // 3. C mirrors I: rises UP FIRST, then curves fluidly into the right edge
        const endXC = xRight - 720 + 90;
        const dxC = cubicPt(eSide, 0, 0, vW * 0.22, endXC);
        const dyC = dyI;
        glyphC.setAttribute('transform', `translate(${dxC.toFixed(2)} ${dyC.toFixed(2)})`);

        // 4. Strictly monotonic liquid white arch wave
        const uWave = clamp((p - 0.20) / 0.80, 0, 1);
        const wCenter = easeInOutSine(Math.pow(uWave, 0.72));
        const wEdge = easeInOutSine(Math.pow(uWave, 1.22));
        const span = vH + 100;
        const edgeY = (yBot + 24) - wEdge * span;
        const centerY = (yBot + 24) - wCenter * span;
        const xL = xLeft - 140;
        const xR = xRight + 140;
        const yT = yTop - 600;
        const ctrl = (xR - xL) * 0.27;
        const d =
          `M${xL.toFixed(1)} ${yT.toFixed(1)} ` +
          `H${xR.toFixed(1)} ` +
          `V${edgeY.toFixed(1)} ` +
          `C${(xR - ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${(xMid + ctrl).toFixed(1)} ${centerY.toFixed(1)} ${xMid.toFixed(1)} ${centerY.toFixed(1)} ` +
          `C${(xMid - ctrl).toFixed(1)} ${centerY.toFixed(1)} ${(xL + ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${xL.toFixed(1)} ${edgeY.toFixed(1)} Z`;
        curtain.setAttribute('d', d);

        // Dissolve remaining upper white veil cleanly before the header/banner settle in
        const curtainAlpha = 1 - easeInOutSine(clamp((uWave - 0.54) / 0.34, 0, 1));
        curtain.setAttribute('opacity', curtainAlpha.toFixed(3));

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          cleanup();
        }
      };

      requestAnimationFrame(step);
    };

    const minHold = new Promise(resolve => setTimeout(resolve, 550));
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
