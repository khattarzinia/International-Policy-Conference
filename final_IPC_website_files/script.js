(() => {
  // ─── Curated Diplomacy Photography Metadata (Verified Wikimedia Commons & IPC) ───
  const DIPLOMACY_SLIDES = [
    {
      src: './assets/diplomacy/un-general-assembly.webp',
      tag: 'Multilateral Assembly',
      title: 'United Nations General Assembly Hall',
      location: 'New York, USA',
      story: 'Every autumn, 193 member states converge inside the General Assembly Hall to debate climate accords, humanitarian law, and global governance.',
      credit: 'Basil D Soufi · CC BY-SA 3.0 · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_General_Assembly_Hall_(3).jpg'
    },
    {
      src: './assets/diplomacy/un-security-council.webp',
      tag: 'Peace & Security',
      title: 'UN Security Council Chamber in Session',
      location: 'New York, USA',
      story: 'Around the iconic horseshoe table, ministers negotiate nuclear non-proliferation and crisis resolutions under live six-language simultaneous interpretation.',
      credit: 'U.S. Department of State · Public Domain · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_Security_Council_Meeting_on_the_Comprehensive_Nuclear-Test-Ban_Treaty_(29795162411).jpg'
    },
    {
      src: './assets/diplomacy/paris-signing.webp',
      tag: 'Climate Treaties',
      title: 'Signing the Paris Climate Agreement (COP21)',
      location: 'UN Headquarters, New York',
      story: 'World leaders sign the landmark Paris Agreement—a defining moment of intergenerational climate diplomacy shaping energy and environmental policy worldwide.',
      credit: 'U.S. Department of State · Public Domain · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Holds_Granddaughter_Dobbs-Higginson_on_Lap_While_Signing_COP21_Climate_Change_Agreement_at_UN_General_Assembly_Hall_in_New_York_(26556850026).jpg'
    },
    {
      src: './assets/diplomacy/eu-parliament.webp',
      tag: 'Legislative Governance',
      title: 'European Parliament Plenary Hemicycle',
      location: 'Strasbourg, France',
      story: 'Hundreds of parliamentarians debate cross-border AI regulation, trade standards, and climate legislation in the world’s largest transnational legislature.',
      credit: 'Diliff · CC BY-SA 3.0 · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:European_Parliament_Strasbourg_Hemicycle_-_Diliff.jpg'
    },
    {
      src: './assets/diplomacy/icj-hague.webp',
      tag: 'International Law',
      title: 'International Court of Justice, Great Hall of Justice',
      location: 'The Hague, Netherlands',
      story: 'Fifteen elected judges hear sovereign states argue treaty obligations, maritime borders, and international human rights before the world’s highest court.',
      credit: 'Lybil BER · CC BY-SA 4.0 · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Grand_Hall_de_Justice_de_Palais_de_La_Paix_%C3%A0_La_Haye_Pays-Bas.jpg'
    },
    {
      src: './assets/diplomacy/geneva-flags.webp',
      tag: 'Global Cooperation',
      title: 'Allée des Nations at the Palais des Nations',
      location: 'Geneva, Switzerland',
      story: 'The avenue of member-state flags outside the UN Office at Geneva—epicenter of humanitarian diplomacy, global health treaties, and disarmament talks.',
      credit: 'Tom Page · CC BY-SA 2.0 · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_Flags_-_cropped.jpg'
    },
    {
      src: './assets/diplomacy/peace-palace.webp',
      tag: 'Global Institutions',
      title: 'The Peace Palace (Vredespaleis)',
      location: 'The Hague, Netherlands',
      story: 'Built in 1913 as a permanent home for peaceful dispute resolution, housing the International Court of Justice and the Permanent Court of Arbitration.',
      credit: 'Thomas Wolf · CC BY-SA 3.0 DE · Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Friedenspalast_Den_Haag_(100MP).jpg'
    },
    {
      src: './assets/lowell-house-hires.jpg',
      tag: 'Spring 2027 Finals',
      title: 'Cambridge, Massachusetts — IPC 2027 Finals',
      location: 'Cambridge, MA, USA',
      story: 'Finalist teams from high schools and universities worldwide gather in Cambridge to present research-backed policy briefs to policymakers and judges.',
      credit: 'International Policy Conference Archive',
      sourceUrl: '#stages'
    }
  ];

  // ─── 1. Hero Kinetic Diplomacy Montage Controller ───
  const stage = document.getElementById('hero-stage');
  const flashPulse = document.getElementById('hero-flash-pulse');
  const filmstrip = document.getElementById('hero-filmstrip');
  const counterEl = document.getElementById('hero-frame-counter');
  const tagEl = document.getElementById('hero-caption-tag');
  const titleEl = document.getElementById('hero-caption-title');
  const creditEl = document.getElementById('hero-caption-credit');
  const flashBtn = document.getElementById('hero-flash-btn');
  const pauseBtn = document.getElementById('hero-pause-btn');

  let activeIndex = 0;
  let flashMode = false;
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let slideTimer = null;
  const slideEls = [];
  const thumbEls = [];

  const setSlide = (idx, withFlash = true) => {
    activeIndex = (idx + DIPLOMACY_SLIDES.length) % DIPLOMACY_SLIDES.length;
    slideEls.forEach((el, i) => el.classList.toggle('is-active', i === activeIndex));
    thumbEls.forEach((el, i) => el.classList.toggle('is-active', i === activeIndex));

    if (withFlash && flashPulse && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flashPulse.classList.add('is-flashing');
      requestAnimationFrame(() => requestAnimationFrame(() => flashPulse.classList.remove('is-flashing')));
    }

    const item = DIPLOMACY_SLIDES[activeIndex];
    if (counterEl) counterEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(DIPLOMACY_SLIDES.length).padStart(2, '0')}`;
    if (tagEl) tagEl.textContent = `${item.tag} · ${item.location}`;
    if (titleEl) titleEl.textContent = item.title;
    if (creditEl) {
      const isExternal = item.sourceUrl.startsWith('http');
      creditEl.innerHTML = isExternal
        ? `Photo: <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">${item.credit} ↗</a>`
        : `Photo: ${item.credit}`;
    }
  };

  const restartSlideTimer = () => {
    clearInterval(slideTimer);
    if (paused) return;
    slideTimer = setInterval(() => setSlide(activeIndex + 1, true), flashMode ? 850 : 2900);
  };

  if (stage && filmstrip) {
    const existingFirst = stage.querySelector('img.hero-slide');
    DIPLOMACY_SLIDES.forEach((item, idx) => {
      let img;
      if (idx === 0 && existingFirst) {
        img = existingFirst;
      } else {
        img = document.createElement('img');
        img.className = 'hero-slide' + (idx === 0 ? ' is-active' : '');
        img.src = item.src;
        img.alt = `${item.title}, ${item.location}`;
        img.decoding = 'async';
        if (idx === 0) img.fetchPriority = 'high';
        stage.appendChild(img);
      }
      slideEls.push(img);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'film-thumb' + (idx === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', `View ${item.title}`);
      btn.innerHTML = `<img src="${item.src}" alt="" loading="lazy" decoding="async">`;
      btn.addEventListener('click', () => {
        setSlide(idx, true);
        restartSlideTimer();
      });
      filmstrip.appendChild(btn);
      thumbEls.push(btn);
    });
    setSlide(0, false);

    flashBtn?.addEventListener('click', () => {
      flashMode = !flashMode;
      paused = false;
      stage.classList.toggle('flash-mode', flashMode);
      flashBtn.setAttribute('aria-pressed', String(flashMode));
      flashBtn.textContent = flashMode ? '⚡ Fast Flash: On' : '⚡ Fast Flash';
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', 'false');
        pauseBtn.textContent = 'Pause';
      }
      setSlide(activeIndex + 1, true);
      restartSlideTimer();
    });

    pauseBtn?.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Play' : 'Pause';
      restartSlideTimer();
    });
  }

  // ─── 2. Single-Canvas Liquid IPC Cutout Loading Screen (Zero Early Fade!) ───
  const root = document.documentElement;
  const loader = document.getElementById('ipc-loader');
  const svg = document.getElementById('ipc-loader-svg');
  const glyphI = document.getElementById('ipc-glyph-i');
  const glyphP = document.getElementById('ipc-glyph-p');
  const glyphC = document.getElementById('ipc-glyph-c');
  const curtain = document.getElementById('ipc-curtain');

  if (loader && svg && glyphI && glyphP && glyphC && curtain) {
    let dismissed = false;
    let loaderFlashInterval = null;
    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
    const easeLiquid = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const cubicPt = (t, p0, p1, p2, p3) => {
      const m = 1 - t;
      return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
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
      clearInterval(loaderFlashInterval);
      root.classList.remove('ipc-loading', 'ipc-loader-exiting');
      loader.remove();
      restartSlideTimer();
    };

    // Rapid kinetic flash of diplomacy photography right inside the giant IPC cutouts while loading
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && slideEls.length > 1) {
      stage?.classList.add('flash-mode');
      let burst = 0;
      loaderFlashInterval = setInterval(() => {
        burst += 1;
        setSlide(burst, false);
      }, 240);
    }

    const triggerExit = () => {
      if (dismissed) return;
      dismissed = true;
      clearInterval(loaderFlashInterval);
      stage?.classList.remove('flash-mode');
      root.classList.remove('ipc-loading');
      root.classList.add('ipc-loader-exiting');

      if (reduced) {
        setTimeout(cleanup, 340);
        return;
      }

      const duration = 1280;
      const start = performance.now();

      const step = now => {
        const p = clamp((now - start) / duration, 0, 1);
        const { xLeft, xRight, yTop, yBot } = getViewportBounds();
        const vW = xRight - xLeft;
        const vH = yBot - yTop;
        const xMid = (xLeft + xRight) / 2;

        // 1. P stays 100% solid (NO early fade!) and glides straight up off the actual top edge
        const uP = clamp(p / 0.78, 0, 1);
        const eP = easeLiquid(uP);
        const dyP = -eP * (525 - yTop + 80);
        glyphP.setAttribute('transform', `translate(0 ${dyP.toFixed(2)})`);

        // 2. I rises UP FIRST along a vertical tangent (100% solid), then curves cleanly into the left edge
        const uSide = clamp((p - 0.03) / 0.84, 0, 1);
        const eSide = easeLiquid(uSide);
        const endXI = -(320 - xLeft + 90);
        const dxI = cubicPt(eSide, 0, 0, -vW * 0.22, endXI);
        const dyI = cubicPt(eSide, 0, -vH * 0.28, -vH * 0.34, -vH * 0.35);
        glyphI.setAttribute('transform', `translate(${dxI.toFixed(2)} ${dyI.toFixed(2)})`);

        // 3. C mirrors I: rises UP FIRST (100% solid), then curves cleanly into the right edge
        const endXC = xRight - 720 + 90;
        const dxC = cubicPt(eSide, 0, 0, vW * 0.22, endXC);
        const dyC = dyI;
        glyphC.setAttribute('transform', `translate(${dxC.toFixed(2)} ${dyC.toFixed(2)})`);

        // 4. Strictly monotonic liquid white arch wave sweeps ALL THE WAY past the top edge (opacity: 1 throughout!)
        const uWave = clamp((p - 0.22) / 0.78, 0, 1);
        const wCenter = easeInOutSine(Math.pow(uWave, 0.72));
        const wEdge = easeInOutSine(Math.pow(uWave, 1.22));
        const span = vH + 160;
        const edgeY = (yBot + 30) - wEdge * span;
        const centerY = (yBot + 30) - wCenter * span;
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

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          cleanup();
        }
      };

      requestAnimationFrame(step);
    };

    const minHold = new Promise(resolve => setTimeout(resolve, 760));
    const firstImgReady = new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = DIPLOMACY_SLIDES[0].src;
      if (img.complete) resolve();
    });
    const maxWait = new Promise(resolve => setTimeout(resolve, 1650));

    Promise.race([Promise.all([minHold, firstImgReady]), maxWait]).then(triggerExit);
    window.addEventListener('pageshow', event => {
      if (event.persisted) cleanup();
    });
  } else {
    root.classList.remove('ipc-loading', 'ipc-loader-exiting');
    restartSlideTimer();
  }

  // ─── 3. Populate Kinetic "Diplomacy in Motion" Marquee & Lightbox ───
  const reelTrack = document.getElementById('reel-track');
  const modal = document.getElementById('photo-modal');
  const modalImg = document.getElementById('photo-modal-img');
  const modalTag = document.getElementById('photo-modal-tag');
  const modalTitle = document.getElementById('photo-modal-title');
  const modalStory = document.getElementById('photo-modal-story');
  const modalSource = document.getElementById('photo-modal-source');
  const modalClose = document.getElementById('photo-modal-close');

  const openModal = item => {
    if (!modal) return;
    modalImg.src = item.src;
    modalImg.alt = item.title;
    modalTag.textContent = `${item.tag} · ${item.location}`;
    modalTitle.textContent = item.title;
    modalStory.textContent = item.story;
    modalSource.textContent = `Source: ${item.credit}`;
    modalSource.href = item.sourceUrl;
    if (item.sourceUrl.startsWith('http')) {
      modalSource.target = '_blank';
      modalSource.rel = 'noopener noreferrer';
    } else {
      modalSource.removeAttribute('target');
    }
    modal.classList.add('open');
  };

  if (reelTrack) {
    const doubled = [...DIPLOMACY_SLIDES, ...DIPLOMACY_SLIDES];
    doubled.forEach((item, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'reel-card';
      if (idx >= DIPLOMACY_SLIDES.length) card.setAttribute('aria-hidden', 'true');
      card.innerHTML = `
        <div class="reel-card-media">
          <img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async">
          <span class="reel-tag">${item.tag}</span>
        </div>
        <div class="reel-card-body">
          <h3>${item.title}</h3>
          <p>${item.story}</p>
          <span class="reel-credit">${item.credit}</span>
        </div>`;
      card.addEventListener('click', () => openModal(item));
      reelTrack.appendChild(card);
    });
  }

  const closeModal = () => modal?.classList.remove('open');
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ─── 4. Floating Navbar Scroll State & Mobile Menu ───
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 48);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-header nav');
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }));

  // ─── 5. Interactive Global Examples Globe <-> List Sync ───
  const markers = document.querySelectorAll('.location-marker');
  const examples = document.querySelectorAll('.example-item');
  const setActiveLocation = loc => {
    markers.forEach(m => m.classList.toggle('is-active', m.dataset.location === loc));
    examples.forEach(ex => ex.classList.toggle('is-active', ex.dataset.location === loc));
  };
  markers.forEach(m => {
    m.addEventListener('mouseenter', () => setActiveLocation(m.dataset.location));
    m.addEventListener('click', () => setActiveLocation(m.dataset.location));
  });
  examples.forEach(ex => {
    ex.addEventListener('mouseenter', () => setActiveLocation(ex.dataset.location));
    ex.addEventListener('click', () => setActiveLocation(ex.dataset.location));
  });
  setActiveLocation('1');

  // ─── 6. Interactive Requirements Stage Tabs ───
  const reqTabs = document.querySelectorAll('.req-tab');
  const reqPanels = document.querySelectorAll('.req-stage');
  reqTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.stage;
      reqTabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      reqPanels.forEach(p => p.classList.toggle('is-active', p.dataset.stage === target));
    });
  });

  // ─── 7. Scroll Reveal Observer ───
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();
