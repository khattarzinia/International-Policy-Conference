(() => {
  const root = document.documentElement;
  const loader = document.getElementById('ipc-loader');
  const svg = document.getElementById('ipc-loader-svg');
  const glyphI = document.getElementById('ipc-glyph-i');
  const glyphP = document.getElementById('ipc-glyph-p');
  const glyphC = document.getElementById('ipc-glyph-c');
  const curtain = document.getElementById('ipc-curtain');

  if (loader && svg && glyphI && glyphP && glyphC && curtain) {
    let dismissed = false;
    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
    // Smooth fluid ease-in-out quintic/cubic blend for liquid momentum
    const easeLiquid = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
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
      if (!ctm) return { xLeft: 0, xRight: 1200, yTop: -100, yBot: 700 };
      const inv = ctm.inverse();
      const pt = svg.createSVGPoint();
      pt.x = 0; pt.y = 0;
      const tl = pt.matrixTransform(inv);
      pt.x = window.innerWidth; pt.y = window.innerHeight;
      const br = pt.matrixTransform(inv);
      return { xLeft: tl.x, xRight: br.x, yTop: tl.y, yBot: br.y };
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

      const duration = 1380;
      const start = performance.now();

      const step = now => {
        const p = clamp((now - start) / duration, 0, 1);
        const { xLeft, xRight, yTop, yBot } = getViewportBounds();
        const vW = xRight - xLeft;
        const vH = yBot - yTop;
        const xMid = (xLeft + xRight) / 2;

        // 1. P glides straight up smoothly off the top edge
        const uP = clamp(p / 0.78, 0, 1);
        const eP = easeLiquid(uP);
        const dyP = -eP * (525 - yTop + 60);
        glyphP.setAttribute('transform', `translate(0 ${dyP.toFixed(2)})`);

        // 2. I rises UP FIRST along a vertical tangent, then curves fluidly into the left edge
        const uSide = clamp((p - 0.03) / 0.86, 0, 1);
        const eSide = easeLiquid(uSide);
        const endXI = -(320 - xLeft + 80);
        const dxI = cubicPt(eSide, 0, 0, -vW * 0.22, endXI);
        const dyI = cubicPt(eSide, 0, -vH * 0.28, -vH * 0.35, -vH * 0.36);
        glyphI.setAttribute('transform', `translate(${dxI.toFixed(2)} ${dyI.toFixed(2)})`);

        // 3. C mirrors I: rises UP FIRST, then curves fluidly into the right edge
        const endXC = xRight - 720 + 80;
        const dxC = cubicPt(eSide, 0, 0, vW * 0.22, endXC);
        const dyC = dyI;
        glyphC.setAttribute('transform', `translate(${dxC.toFixed(2)} ${dyC.toFixed(2)})`);

        // 4. Single continuous white curtain lifts as a silky liquid arch wave behind the letters
        const uWave = clamp((p - 0.24) / 0.76, 0, 1);
        const wEdge = easeLiquid(uWave);
        const wArch = Math.sin(Math.PI * easeOutQuart(uWave));
        const edgeY = (yBot + 30) - wEdge * (vH + 180);
        const centerY = edgeY - wArch * (vH * 0.44);
        const xL = xLeft - 120;
        const xR = xRight + 120;
        const yT = yTop - 220;
        const ctrl = (xR - xL) * 0.26;
        const d =
          `M${xL.toFixed(1)} ${yT.toFixed(1)} ` +
          `H${xR.toFixed(1)} ` +
          `V${edgeY.toFixed(1)} ` +
          `C${(xR - ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${(xMid + ctrl).toFixed(1)} ${centerY.toFixed(1)} ${xMid.toFixed(1)} ${centerY.toFixed(1)} ` +
          `C${(xMid - ctrl).toFixed(1)} ${centerY.toFixed(1)} ${(xL + ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${xL.toFixed(1)} ${edgeY.toFixed(1)} Z`;
        curtain.setAttribute('d', d);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          cleanup();
        }
      };

      requestAnimationFrame(step);
    };

    const minHold = new Promise(resolve => setTimeout(resolve, 600));
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
