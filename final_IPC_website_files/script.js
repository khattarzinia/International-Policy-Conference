(() => {
  // ─── 20 Verified Archival Diplomacy Photographs (Exact Origin + Source + License) ───
  const ARCHIVE_PRINTS = [
    {
      id: '01',
      src: './assets/archive/01-un-general-assembly.webp',
      shortLoc: 'UNGA · New York',
      year: '2014',
      theme: 'Multilateral Assembly',
      title: 'United Nations General Assembly Hall',
      origin: 'United Nations Headquarters · New York, USA',
      story: 'The plenary hall where all 193 UN member states hold equal voice on international treaties, humanitarian crises, and global policy.',
      credit: 'Basil D Soufi',
      license: 'CC BY-SA 3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_General_Assembly_Hall_(3).jpg'
    },
    {
      id: '02',
      src: './assets/archive/02-un-security-council.webp',
      shortLoc: 'UNSC · New York',
      year: '2016',
      theme: 'Peace & Security',
      title: 'UN Security Council Chamber — Nuclear Non-Proliferation Debate',
      origin: 'United Nations Headquarters · New York, USA',
      story: 'Foreign ministers and ambassadors negotiate around the Security Council horseshoe table on the Comprehensive Nuclear-Test-Ban Treaty.',
      credit: 'U.S. Department of State',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_Security_Council_Meeting_on_the_Comprehensive_Nuclear-Test-Ban_Treaty_(29795162411).jpg'
    },
    {
      id: '03',
      src: './assets/archive/03-paris-signing.webp',
      shortLoc: 'COP21 · New York',
      year: '2016',
      theme: 'Climate Diplomacy',
      title: 'Signing of the Paris Climate Agreement (COP21)',
      origin: 'UN General Assembly Hall · New York, USA',
      story: 'A defining Earth Day moment of intergenerational climate diplomacy as nations formally sign the Paris Agreement under the golden UN emblem.',
      credit: 'U.S. Department of State',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Holds_Granddaughter_Dobbs-Higginson_on_Lap_While_Signing_COP21_Climate_Change_Agreement_at_UN_General_Assembly_Hall_in_New_York_(26556850026).jpg'
    },
    {
      id: '04',
      src: './assets/archive/04-eu-parliament.webp',
      shortLoc: 'EU Parliament · Strasbourg',
      year: '2014',
      theme: 'Transnational Governance',
      title: 'European Parliament Plenary Hemicycle',
      origin: 'Louise Weiss Building · Strasbourg, France',
      story: 'Directly elected legislators from across Europe debate cross-border climate targets, AI governance, and trade rules in plenary session.',
      credit: 'Diliff',
      license: 'CC BY-SA 3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:European_Parliament_Strasbourg_Hemicycle_-_Diliff.jpg'
    },
    {
      id: '05',
      src: './assets/archive/05-icj-hague.webp',
      shortLoc: 'ICJ · The Hague',
      year: '2009',
      theme: 'International Law',
      title: 'International Court of Justice — Great Hall of Justice',
      origin: 'Peace Palace · The Hague, Netherlands',
      story: 'Fifteen elected judges hear sovereign states present legal arguments on international law, treaty interpretation, and sovereignty.',
      credit: 'Lybil BER',
      license: 'CC BY-SA 4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Grand_Hall_de_Justice_de_Palais_de_La_Paix_%C3%A0_La_Haye_Pays-Bas.jpg'
    },
    {
      id: '06',
      src: './assets/archive/06-geneva-flags.webp',
      shortLoc: 'Palais des Nations · Geneva',
      year: '2014',
      theme: 'Global Cooperation',
      title: 'Allée des Nations at the UN Office in Geneva',
      origin: 'Palais des Nations · Geneva, Switzerland',
      story: 'Member-state flags line the approach to the Palais des Nations—hub of humanitarian diplomacy, disarmament talks, and global health.',
      credit: 'Tom Page',
      license: 'CC BY-SA 2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:United_Nations_Flags_-_cropped.jpg'
    },
    {
      id: '07',
      src: './assets/archive/07-peace-palace.webp',
      shortLoc: 'Peace Palace · The Hague',
      year: '1913–',
      theme: 'International Institutions',
      title: 'The Peace Palace (Vredespaleis)',
      origin: 'Carnegieplein · The Hague, Netherlands',
      story: 'Inaugurated in 1913 as a permanent architectural home for international arbitration and the peaceful settlement of global disputes.',
      credit: 'Thomas Wolf (foto-tw.de)',
      license: 'CC BY-SA 3.0 DE',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Friedenspalast_Den_Haag_(100MP).jpg'
    },
    {
      id: '08',
      src: './assets/archive/08-g7-apulia.webp',
      shortLoc: 'G7 Summit · Apulia',
      year: '2024',
      theme: 'Development & Climate',
      title: 'G7 Summit Working Session on Africa, Climate & Development',
      origin: 'Borgo Egnazia · Apulia, Italy',
      story: 'Heads of state gather around an olive-wood table to coordinate infrastructure financing, clean-energy transitions, and global development.',
      credit: 'The White House',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:President_Joe_Biden_at_Working_Session_I,_Africa,_Climate_Change_and_Development_at_the_2024_G7_Summit,_June_13,_2024,_at_Borgo_Egnazia_in_Apulia,_Italy.jpg'
    },
    {
      id: '09',
      src: './assets/archive/09-g20-brisbane.webp',
      shortLoc: 'G20 · Brisbane',
      year: '2014',
      theme: 'Economic Policy',
      title: '9th G20 Summit Leaders’ Roundtable',
      origin: 'Brisbane Convention Centre · Brisbane, Australia',
      story: 'Leaders of the world’s major economies meet face-to-face on fiscal resilience, cross-border trade, and macroeconomic stability.',
      credit: 'Aman Sharma / European Union',
      license: 'CC BY 4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Round_table_during_the_G20_Summit_in_Australia_-_2014_(03).jpg'
    },
    {
      id: '10',
      src: './assets/archive/10-nato-council.webp',
      shortLoc: 'NATO 75 · Washington',
      year: '2024',
      theme: 'Collective Security',
      title: 'North Atlantic Council — 75th Anniversary Summit',
      origin: 'Walter E. Washington Convention Center · Washington, D.C., USA',
      story: 'Allied heads of state convene at the North Atlantic Council to align deterrence strategy, cyber resilience, and collective defense.',
      credit: 'The White House',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Joe_Biden_attends_a_meeting_of_the_North_Atlantic_Council,_2024-07-10_(53849051323).jpg'
    },
    {
      id: '11',
      src: './assets/archive/11-nato-wales.webp',
      shortLoc: 'NAC · Wales, UK',
      year: '2014',
      theme: 'Alliance Diplomacy',
      title: 'North Atlantic Council Plenary Table',
      origin: 'Celtic Manor · Newport, Wales, United Kingdom',
      story: 'Ministers and defense advisors consult directly across the alliance plenary table during the 2014 Wales Summit.',
      credit: 'Glenn Fawcett / U.S. Department of Defense',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Meeting_of_the_North_Atlantic_Council_140905-D-NI589-189.jpg'
    },
    {
      id: '12',
      src: './assets/archive/12-asean-singapore.webp',
      shortLoc: 'EAS / ASEAN · Singapore',
      year: '2018',
      theme: 'Indo-Pacific Diplomacy',
      title: 'East Asia Summit Foreign Ministers’ Meeting',
      origin: 'Singapore Expo · Singapore',
      story: 'Eighteen Indo-Pacific delegations gather under the ASEAN framework to negotiate regional trade, maritime norms, and strategic stability.',
      credit: 'U.S. Department of State',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Secretary_of_State_Michael_R._Pompeo_attends_the_East_Asia_Summit_(43834928811).jpg'
    },
    {
      id: '13',
      src: './assets/archive/13-au-addis-ababa.webp',
      shortLoc: 'AU Summit · Addis Ababa',
      year: '2009',
      theme: 'Regional Integration',
      title: '12th African Union Summit Plenary Hall',
      origin: 'UN Conference Centre · Addis Ababa, Ethiopia',
      story: 'African heads of state and diplomatic delegations fill the plenary hall in Addis Ababa to debate continental trade, infrastructure, and peace.',
      credit: 'Jesse B. Awalt / U.S. Navy',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Plenary_Hall,_12th_AU_Summit,_090202-N-0506A-291.jpg'
    },
    {
      id: '14',
      src: './assets/archive/14-iaea-vienna.webp',
      shortLoc: 'IAEA · Vienna',
      year: '2024',
      theme: 'Science & Safeguards',
      title: 'IAEA 1717th Board of Governors Press Briefing',
      origin: 'Vienna International Centre · Vienna, Austria',
      story: 'Technical diplomacy in action: international nuclear safeguards, energy security, and verification briefings before the global press corps.',
      credit: 'IAEA Imagebank',
      license: 'CC BY 2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:IAEA_1717th_Board_of_Governors_Meeting_Press_Conference,_Vienna,_June_2024,_64.jpg'
    },
    {
      id: '15',
      src: './assets/archive/15-arms-trade-treaty.webp',
      shortLoc: 'Treaty Event · UN HQ',
      year: '2013',
      theme: 'Treaty Making',
      title: 'Arms Trade Treaty Signing Ceremony',
      origin: 'United Nations Treaty Event · New York, USA',
      story: 'Formal treaty accession at UN Headquarters establishing international standards regulating the cross-border trade in conventional arms.',
      credit: 'U.S. Department of State',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Participates_in_the_Arms_Trade_Treaty_Signing_Ceremony_(9936186524).jpg'
    },
    {
      id: '16',
      src: './assets/archive/16-palau-compact.webp',
      shortLoc: 'Pacific Compact · 2023',
      year: '2023',
      theme: 'Bilateral Agreements',
      title: 'Compact Review Agreement Signing with Palau',
      origin: 'Port Moresby · Pacific Regional Diplomacy',
      story: 'Small-island diplomacy on the global stage: bilateral talks addressing climate resilience, ocean stewardship, and economic partnership.',
      credit: 'U.S. Department of State',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Secretary_Blinken_Participates_in_a_Compact_Review_Agreement_Signing_Ceremony_with_Palau.jpg'
    },
    {
      id: '17',
      src: './assets/archive/17-us-mexico-dialogue.webp',
      shortLoc: 'Bilateral · Washington',
      year: '2022',
      theme: 'Cross-Border Policy',
      title: 'U.S.–Mexico High-Level Security Dialogue',
      origin: 'U.S. Department of State · Washington, D.C., USA',
      story: 'Senior delegations face each other across the negotiating table on shared border security, public health, and regional economic cooperation.',
      credit: 'U.S. Department of Homeland Security',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:DHS_Secretary_Mayorkas_in_U.S.-Mexico_High-Level_Security_Dialogue_in_Washington,_D.C.,_October_13,_2022_-_10.jpg'
    },
    {
      id: '18',
      src: './assets/archive/18-imf-annual-meeting.webp',
      shortLoc: 'IMF · Annual Meetings',
      year: '2003',
      theme: 'Global Finance',
      title: 'African Finance Ministers IMF Press Briefing',
      origin: 'IMF / World Bank Annual Meetings · 2003',
      story: 'Finance ministers address international correspondents on sovereign debt reform, growth targets, and equitable fiscal policy.',
      credit: 'International Monetary Fund',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:African_Finance_Ministers_IMF_2003_Annual_Meeting_-_IMF_62ph030920GH.jpg'
    },
    {
      id: '19',
      src: './assets/archive/19-world-bank-archive.webp',
      shortLoc: 'World Bank · Washington',
      year: '1966',
      theme: 'Archival Diplomacy',
      title: 'World Bank Group Annual Meetings (1966 Archive)',
      origin: 'World Bank Headquarters · Washington, D.C., USA',
      story: 'Post-independence economic diplomacy captured on monochrome press film during the 1966 Bretton Woods institutional meetings.',
      credit: 'World Bank Group Archive',
      license: 'CC BY-SA 4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mr._Alexandre_Banza,_Governor_for_Central_African_Republic_(left),_Annual_Meetings,_Washington,_D.C.,_USA.jpg'
    },
    {
      id: '20',
      src: './assets/lowell-house-hires.jpg',
      shortLoc: 'IPC Finals · Cambridge',
      year: '2027',
      theme: 'IPC 2027 Finals',
      title: 'Cambridge, Massachusetts — IPC Spring 2027 Finals',
      origin: 'Cambridge, Massachusetts, USA',
      story: 'Where top high school and collegiate finalists from around the world convene to present policy briefs and face executive Q&A.',
      credit: 'International Policy Conference Archive',
      license: 'IPC Archive',
      sourceUrl: '#stages'
    }
  ];

  // ─── 15 Curated 3D Floating Slots Across 3 True Optical Depth-of-Field Planes ───
  // All Z planes stay strictly >= 10px (in front of z=0 container plane) so Chromium 3D hit-testing reaches EVERY print!
  const SLOTS = [
    // Near Foreground (5 crisp prints framing outer corners & lower gallery)
    { x: 11, y: 21, w: 206, depth: 2, rotZ: -5.2, driftX: 9,  driftY: 10, speed: 0.00055, phase: 0.2, mx: 18, my: 18, mw: 120 },
    { x: 89, y: 22, w: 208, depth: 2, rotZ:  4.6, driftX: 10, driftY: 10, speed: 0.00051, phase: 1.7, mx: 82, my: 19, mw: 120 },
    { x: 11, y: 79, w: 210, depth: 2, rotZ:  3.6, driftX: 10, driftY:  9, speed: 0.00049, phase: 3.1, mx: 19, my: 81, mw: 122 },
    { x: 89, y: 79, w: 208, depth: 2, rotZ: -4.0, driftX: 9,  driftY:  9, speed: 0.00053, phase: 4.5, mx: 81, my: 80, mw: 122 },
    { x: 65, y: 85, w: 186, depth: 2, rotZ:  2.2, driftX: 8,  driftY:  6, speed: 0.00046, phase: 2.4, hideMobile: true },

    // Mid Ground (5 prints with gentle lens softness around the inner ring)
    { x: 10, y: 50, w: 184, depth: 1, rotZ: -6.8, driftX: 8, driftY: 9, speed: 0.00042, phase: 0.9, hideMobile: true },
    { x: 90, y: 51, w: 186, depth: 1, rotZ:  6.2, driftX: 8, driftY: 8, speed: 0.00040, phase: 2.8, hideMobile: true },
    { x: 31, y: 15, w: 174, depth: 1, rotZ:  3.0, driftX: 7, driftY: 6, speed: 0.00044, phase: 5.2, mx: 50, my: 15, mw: 102 },
    { x: 69, y: 15, w: 176, depth: 1, rotZ: -3.2, driftX: 7, driftY: 6, speed: 0.00041, phase: 1.1, hideMobile: true },
    { x: 35, y: 85, w: 174, depth: 1, rotZ: -2.4, driftX: 7, driftY: 6, speed: 0.00038, phase: 3.9, mx: 50, my: 83, mw: 102 },

    // Far Background Bokeh (5 soft atmospheric prints adding unmistakable 3D depth, clear of headline at 1280px+)
    { x: 20, y: 31, w: 146, depth: 0, rotZ:  5.2, driftX: 5, driftY: 5, speed: 0.00032, phase: 0.5, hideMobile: true },
    { x: 80, y: 31, w: 146, depth: 0, rotZ: -5.6, driftX: 5, driftY: 5, speed: 0.00030, phase: 2.1, hideMobile: true },
    { x: 20, y: 69, w: 148, depth: 0, rotZ: -4.4, driftX: 5, driftY: 5, speed: 0.00034, phase: 4.1, hideMobile: true },
    { x: 80, y: 69, w: 146, depth: 0, rotZ:  4.4, driftX: 5, driftY: 5, speed: 0.00031, phase: 1.5, hideMobile: true },
    { x: 50, y: 12, w: 144, depth: 0, rotZ:  1.4, driftX: 6, driftY: 4, speed: 0.00029, phase: 5.8, hideMobile: true }
  ];

  const DEPTH_STYLE = [
    { blur: '3.2px', opacity: '0.72', z: 5,  zPx: 10,  parallax: 11, shadow: '0 10px 24px rgba(20, 32, 24, 0.09)' },
    { blur: '1.1px', opacity: '0.92', z: 9,  zPx: 55,  parallax: 22, shadow: '0 16px 36px rgba(20, 32, 24, 0.14)' },
    { blur: '0px',   opacity: '1',    z: 14, zPx: 110, parallax: 36, shadow: '0 24px 52px rgba(20, 32, 24, 0.21)' }
  ];

  // ─── 1. Build 15 Floating 3D Press Prints + Orbit & Flip Engine ───
  const world = document.getElementById('archive-world');
  const flipWaveBtn = document.getElementById('archive-flip-btn');
  const openSourcesBtn = document.getElementById('archive-sources-btn');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slotStates = [];
  let nextPoolIdx = SLOTS.length;

  const setFaceContent = (faceEl, item) => {
    const img = faceEl.querySelector('img');
    const loc = faceEl.querySelector('.print-meta-loc');
    const yr = faceEl.querySelector('.print-meta-yr');
    if (img) { img.src = item.src; img.alt = `${item.title} (${item.origin})`; }
    if (loc) loc.textContent = `${item.id} · ${item.shortLoc}`;
    if (yr) yr.textContent = item.year;
  };

  if (world) {
    SLOTS.forEach((slot, idx) => {
      const ds = DEPTH_STYLE[slot.depth];
      const frontItem = ARCHIVE_PRINTS[idx % ARCHIVE_PRINTS.length];
      const backItem = ARCHIVE_PRINTS[(idx + 10) % ARCHIVE_PRINTS.length];

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arch-print';
      btn.style.setProperty('--x', `${slot.x}%`);
      btn.style.setProperty('--y', `${slot.y}%`);
      btn.style.setProperty('--w', `${slot.w}px`);
      if (slot.mx != null) {
        btn.dataset.mx = '1';
        btn.style.setProperty('--mx', `${slot.mx}%`);
        btn.style.setProperty('--my', `${slot.my}%`);
        btn.style.setProperty('--mw', `${slot.mw}px`);
      }
      btn.style.setProperty('--dof-blur', ds.blur);
      btn.style.setProperty('--dof-opacity', ds.opacity);
      btn.style.setProperty('--dof-shadow', ds.shadow);
      btn.style.setProperty('--z', String(ds.z));
      if (slot.hideMobile) btn.dataset.hideMobile = '1';
      btn.setAttribute('aria-label', `Inspect ${frontItem.title} (${frontItem.origin})`);

      btn.innerHTML = `
        <span class="print-flipper">
          <span class="print-face front">
            <span class="print-photo-wrap">
              <img src="${frontItem.src}" alt="${frontItem.title}" loading="eager" decoding="async">
              <span class="print-stamp">Origin &amp; Source →</span>
            </span>
            <span class="print-meta">
              <span class="print-meta-loc">${frontItem.id} · ${frontItem.shortLoc}</span>
              <span class="print-meta-yr">${frontItem.year}</span>
            </span>
          </span>
          <span class="print-face back">
            <span class="print-photo-wrap">
              <img src="${backItem.src}" alt="${backItem.title}" loading="lazy" decoding="async">
              <span class="print-stamp">Origin &amp; Source →</span>
            </span>
            <span class="print-meta">
              <span class="print-meta-loc">${backItem.id} · ${backItem.shortLoc}</span>
              <span class="print-meta-yr">${backItem.year}</span>
            </span>
          </span>
        </span>`;

      const state = {
        el: btn,
        slot,
        ds,
        flipped: false,
        hovered: false,
        frontItem,
        backItem,
        frontFace: btn.querySelector('.print-face.front'),
        backFace: btn.querySelector('.print-face.back'),
        ox: 0, oy: 0, oz: ds.zPx, rx: 0, ry: 0, rz: slot.rotZ
      };

      btn.addEventListener('mouseenter', () => { state.hovered = true; });
      btn.addEventListener('mouseleave', () => { state.hovered = false; });
      btn.addEventListener('click', () => {
        const activeItem = state.flipped ? state.backItem : state.frontItem;
        openPrintModal(ARCHIVE_PRINTS.indexOf(activeItem));
      });

      world.appendChild(btn);
      slotStates.push(state);
    });

    // Smooth 3D Cursor Parallax + Continuous Organic Orbital Drift
    let targetMX = 0, targetMY = 0;
    let curMX = 0, curMY = 0;
    const heroEl = document.querySelector('.archive-hero');
    heroEl?.addEventListener('mousemove', e => {
      const rect = heroEl.getBoundingClientRect();
      targetMX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    heroEl?.addEventListener('mouseleave', () => { targetMX = 0; targetMY = 0; });

    const animateOrbit = now => {
      curMX += (targetMX - curMX) * 0.055;
      curMY += (targetMY - curMY) * 0.055;

      for (let i = 0; i < slotStates.length; i++) {
        const s = slotStates[i];
        const { slot, ds } = s;
        const t = now * slot.speed + slot.phase;
        let tx, ty, tz, trx, tryy, trz, lerp;
        if (s.hovered) {
          tx = 0;
          ty = -6;
          tz = 170;
          trx = 0;
          tryy = 0;
          trz = 0;
          lerp = 0.16;
        } else {
          tx = Math.sin(t) * slot.driftX + curMX * ds.parallax;
          ty = Math.cos(t * 0.85) * slot.driftY + curMY * ds.parallax;
          tz = ds.zPx;
          trz = slot.rotZ + Math.sin(t * 0.7) * 1.8;
          trx = -curMY * (slot.depth + 1) * 2.2 + Math.sin(t * 0.5) * 2.0;
          tryy = curMX * (slot.depth + 1) * 2.8 + Math.cos(t * 0.6) * 2.5;
          lerp = 0.12;
        }
        s.ox += (tx - s.ox) * lerp;
        s.oy += (ty - s.oy) * lerp;
        s.oz += (tz - s.oz) * lerp;
        s.rx += (trx - s.rx) * lerp;
        s.ry += (tryy - s.ry) * lerp;
        s.rz += (trz - s.rz) * lerp;
        s.el.style.transform = `translate3d(${s.ox.toFixed(1)}px, ${s.oy.toFixed(1)}px, ${s.oz.toFixed(1)}px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) rotateZ(${s.rz.toFixed(2)}deg)`;
      }
      requestAnimationFrame(animateOrbit);
    };

    if (!reducedMotion) {
      requestAnimationFrame(animateOrbit);
    } else {
      slotStates.forEach(s => {
        s.el.style.transform = `translate3d(0, 0, ${s.ds.zPx}px) rotateZ(${s.slot.rotZ}deg)`;
      });
    }

    // Periodic Staggered 3D Y-Axis Flips Cycling Through All 20 Verified Photos (avoiding on-screen duplicates)
    const flipSlot = s => {
      if (s.hovered) return;
      const visibleIds = new Set(slotStates.map(st => (st.flipped ? st.backItem.id : st.frontItem.id)));
      let incoming = ARCHIVE_PRINTS[nextPoolIdx % ARCHIVE_PRINTS.length];
      for (let tries = 0; tries < ARCHIVE_PRINTS.length; tries++) {
        const candidate = ARCHIVE_PRINTS[(nextPoolIdx + tries) % ARCHIVE_PRINTS.length];
        if (!visibleIds.has(candidate.id)) {
          incoming = candidate;
          nextPoolIdx = (nextPoolIdx + tries + 1) % ARCHIVE_PRINTS.length;
          break;
        }
      }
      if (!s.flipped) {
        s.backItem = incoming;
        setFaceContent(s.backFace, incoming);
        s.flipped = true;
        s.el.classList.add('is-flipped');
      } else {
        s.frontItem = incoming;
        setFaceContent(s.frontFace, incoming);
        s.flipped = false;
        s.el.classList.remove('is-flipped');
      }
      const shown = s.flipped ? s.backItem : s.frontItem;
      s.el.setAttribute('aria-label', `Inspect ${shown.title} (${shown.origin})`);
    };

    let flipCursor = 0;
    if (!reducedMotion) {
      setInterval(() => {
        if (document.hidden || document.documentElement.classList.contains('ipc-loading')) return;
        // Pick next non-hovered slot using coprime step so flips bounce organically across the desk
        for (let tries = 0; tries < slotStates.length; tries++) {
          const idx = (flipCursor * 5 + tries) % slotStates.length;
          if (!slotStates[idx].hovered) {
            flipSlot(slotStates[idx]);
            flipCursor += 1;
            break;
          }
        }
      }, 1750);
    }

    // Manual "Flip Wave" button triggers a cascading left-to-right 3D flip across all 14 prints
    flipWaveBtn?.addEventListener('click', () => {
      const sorted = [...slotStates].sort((a, b) => a.slot.x - b.slot.x);
      sorted.forEach((s, i) => setTimeout(() => flipSlot(s), i * 85));
    });
  }

  // ─── 2. Archival Press Print Light-Table Modal + Full 20-Source Registry ───
  const printModal = document.getElementById('print-modal');
  const pmImg = document.getElementById('pm-img');
  const pmIndex = document.getElementById('pm-index');
  const pmTitle = document.getElementById('pm-title');
  const pmStory = document.getElementById('pm-story');
  const pmOrigin = document.getElementById('pm-origin');
  const pmYear = document.getElementById('pm-year');
  const pmCredit = document.getElementById('pm-credit');
  const pmSource = document.getElementById('pm-source');
  const pmPrev = document.getElementById('pm-prev');
  const pmNext = document.getElementById('pm-next');
  const pmClose = document.getElementById('pm-close');
  let modalIdx = 0;

  const openPrintModal = idx => {
    if (!printModal) return;
    modalIdx = (idx + ARCHIVE_PRINTS.length) % ARCHIVE_PRINTS.length;
    const item = ARCHIVE_PRINTS[modalIdx];
    pmImg.src = item.src;
    pmImg.alt = item.title;
    pmIndex.textContent = `ARCHIVE PRINT ${item.id} / ${ARCHIVE_PRINTS.length} · ${item.theme}`;
    pmTitle.textContent = item.title;
    pmStory.textContent = item.story;
    pmOrigin.textContent = item.origin;
    pmYear.textContent = item.year;
    pmCredit.textContent = `${item.credit} (${item.license})`;
    const isExt = item.sourceUrl.startsWith('http');
    pmSource.innerHTML = isExt
      ? `<a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons Archive Record ↗</a>`
      : `<a href="${item.sourceUrl}">International Policy Conference Archive</a>`;
    printModal.classList.add('open');
  };

  const closePrintModal = () => printModal?.classList.remove('open');
  pmPrev?.addEventListener('click', () => openPrintModal(modalIdx - 1));
  pmNext?.addEventListener('click', () => openPrintModal(modalIdx + 1));
  pmClose?.addEventListener('click', closePrintModal);
  printModal?.addEventListener('click', e => { if (e.target === printModal) closePrintModal(); });

  // Full 20-Photo Origins & Sources Drawer + Footer List
  const sourcesModal = document.getElementById('sources-modal');
  const sourcesGrid = document.getElementById('sources-grid');
  const sourcesClose = document.getElementById('sources-close');
  const footerSourcesList = document.getElementById('footer-sources-list');

  if (sourcesGrid) {
    ARCHIVE_PRINTS.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'source-entry';
      const isExt = item.sourceUrl.startsWith('http');
      card.innerHTML = `
        <img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async">
        <div>
          <div class="source-entry-title">${item.id}. ${item.title}</div>
          <div class="source-entry-origin">Origin: ${item.origin} (${item.year})</div>
          <div class="source-entry-credit">Source: ${item.credit} · ${item.license}${isExt ? ` · <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons ↗</a>` : ''}</div>
        </div>`;
      card.querySelector('img')?.addEventListener('click', () => {
        sourcesModal?.classList.remove('open');
        openPrintModal(idx);
      });
      sourcesGrid.appendChild(card);
    });
  }
  if (footerSourcesList) {
    ARCHIVE_PRINTS.forEach(item => {
      const li = document.createElement('li');
      const isExt = item.sourceUrl.startsWith('http');
      li.innerHTML = `<strong>${item.id}. ${item.title}</strong> (${item.origin}, ${item.year}) — ${item.credit}, ${item.license}${isExt ? ` · <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ''}`;
      footerSourcesList.appendChild(li);
    });
  }

  openSourcesBtn?.addEventListener('click', () => sourcesModal?.classList.add('open'));
  sourcesClose?.addEventListener('click', () => sourcesModal?.classList.remove('open'));
  sourcesModal?.addEventListener('click', e => { if (e.target === sourcesModal) sourcesModal.classList.remove('open'); });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closePrintModal();
      sourcesModal?.classList.remove('open');
    } else if (printModal?.classList.contains('open')) {
      if (e.key === 'ArrowRight') openPrintModal(modalIdx + 1);
      if (e.key === 'ArrowLeft') openPrintModal(modalIdx - 1);
    }
  });

  // ─── 3. Liquid Single-Canvas IPC Cutout Loading Screen (ZERO Early Fade!) ───
  const root = document.documentElement;
  const loader = document.getElementById('ipc-loader');
  const svg = document.getElementById('ipc-loader-svg');
  const glyphI = document.getElementById('ipc-glyph-i');
  const glyphP = document.getElementById('ipc-glyph-p');
  const glyphC = document.getElementById('ipc-glyph-c');
  const curtain = document.getElementById('ipc-curtain');
  const loaderMosaic = document.getElementById('loader-mosaic');

  if (loader && svg && glyphI && glyphP && glyphC && curtain) {
    let dismissed = false;
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
      root.classList.remove('ipc-loading', 'ipc-loader-exiting');
      loader.remove();
      loaderMosaic?.remove();
    };

    const triggerExit = () => {
      if (dismissed) return;
      dismissed = true;
      root.classList.remove('ipc-loading');
      root.classList.add('ipc-loader-exiting');

      if (reducedMotion) {
        setTimeout(cleanup, 340);
        return;
      }

      const duration = 1260;
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
        const dyP = -eP * (525 - yTop + 90);
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

        // 4. Strictly monotonic liquid white arch wave sweeps ALL THE WAY past yTop (opacity: 1)
        const uWave = clamp((p - 0.22) / 0.78, 0, 1);
        const wCenter = easeInOutSine(Math.pow(uWave, 0.72));
        const wEdge = easeInOutSine(Math.pow(uWave, 1.22));
        const span = vH + 180;
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

    const minHold = new Promise(resolve => setTimeout(resolve, 640));
    const ready = new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = ARCHIVE_PRINTS[0].src;
      if (img.complete) resolve();
    });
    const maxWait = new Promise(resolve => setTimeout(resolve, 1600));

    Promise.race([Promise.all([minHold, ready]), maxWait]).then(triggerExit);
    window.addEventListener('pageshow', event => {
      if (event.persisted) cleanup();
    });
  } else {
    root.classList.remove('ipc-loading', 'ipc-loader-exiting');
  }

  // ─── 4. Header Scroll State, Mobile Nav & Scroll Reveal ───
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 36);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const button = document.querySelector('.menu-button');
  const menu = document.querySelector('.site-header nav');
  button?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    button?.setAttribute('aria-expanded', 'false');
  }));

  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
})();
