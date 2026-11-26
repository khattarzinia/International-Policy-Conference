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

  // ─── 1. 2008 Beijing Olympics-Inspired 15×9 Kinetic 3D Movable-Type Matrix ───
  const COLS = 15;
  const ROWS = 9;
  // Monumental raised movable-type bitmap spelling I · P · C (15 cols × 9 rows)
  const IPC_MAP = [
    '...............',
    '.###.####.####.',
    '..#..#..#.#..#.',
    '..#..#..#.#....',
    '..#..####.#....',
    '..#..#....#....',
    '..#..#....#..#.',
    '.###.#....####.',
    '...............'
  ];

  const gridEl = document.getElementById('mt-grid');
  const planeEl = document.getElementById('mt-plane');
  const stageEl = document.getElementById('mt-stage');
  const readoutEl = document.getElementById('mt-readout');
  const flipWaveBtn = document.getElementById('archive-flip-btn');
  const openSourcesBtn = document.getElementById('archive-sources-btn');
  const formationBtns = [...document.querySelectorAll('.mt-formations [data-mode]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultReadout = readoutEl?.textContent || '';

  let activeMode = 'ipc';
  let introStartTime = null;
  let hoveredBlock = null;
  let pointerGridX = -99;
  let pointerGridY = -99;
  let targetTiltX = 22;
  let targetTiltY = 0;
  let curTiltX = 22;
  let curTiltY = 0;
  const blocks = [];

  if (gridEl && planeEl) {
    // Build 135 interlocking 3D extruded movable-type pillars (15 × 9)
    const frag = document.createDocumentFragment();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isLetter = IPC_MAP[r][c] === '#';
        // Distribute the 20 verified diplomacy photos with prime strides so adjacent pillars never duplicate
        const frontIdx = (r * 7 + c * 3) % ARCHIVE_PRINTS.length;
        const backIdx = (frontIdx + 11) % ARCHIVE_PRINTS.length;
        const frontItem = ARCHIVE_PRINTS[frontIdx];
        const backItem = ARCHIVE_PRINTS[backIdx];

        const cell = document.createElement('div');
        cell.className = 'mt-cell';

        const pillar = document.createElement('button');
        pillar.type = 'button';
        pillar.className = 'mt-pillar';
        pillar.dataset.dof = isLetter ? '2' : '0';
        pillar.setAttribute('aria-label', `${frontItem.title} (${frontItem.origin}, ${frontItem.year}) — Click for origin and source`);

        pillar.innerHTML = `
          <span class="mt-wall mt-wall-s" aria-hidden="true"></span>
          <span class="mt-wall mt-wall-e" aria-hidden="true"></span>
          <span class="mt-wall mt-wall-w" aria-hidden="true"></span>
          <span class="mt-top">
            <span class="mt-top-flip">
              <span class="mt-face front"><img src="${frontItem.src}" alt="${frontItem.title}" loading="${isLetter ? 'eager' : 'lazy'}" decoding="async"></span>
              <span class="mt-face back"><img src="${backItem.src}" alt="${backItem.title}" loading="lazy" decoding="async"></span>
            </span>
            <span class="mt-hover-tag">${frontItem.id} · ${frontItem.year}</span>
          </span>`;

        const block = {
          r,
          c,
          isLetter,
          el: pillar,
          frontImg: pillar.querySelector('.mt-face.front img'),
          backImg: pillar.querySelector('.mt-face.back img'),
          tagEl: pillar.querySelector('.mt-hover-tag'),
          frontItem,
          backItem,
          flipped: false,
          z: 4,
          dof: isLetter ? 2 : 0,
          distCenter: Math.hypot(c - (COLS - 1) / 2, r - (ROWS - 1) / 2),
          diag: c + r * 0.72
        };

        const updateHoverReadout = () => {
          const item = block.flipped ? block.backItem : block.frontItem;
          if (readoutEl) {
            readoutEl.textContent = `${item.id} · ${item.title} — ${item.origin} (${item.year}) · Click for source`;
            readoutEl.classList.add('is-live');
          }
          if (block.tagEl) block.tagEl.textContent = `${item.id} · ${item.year}`;
        };

        pillar.addEventListener('mouseenter', () => {
          hoveredBlock = block;
          pointerGridX = c;
          pointerGridY = r;
          pillar.classList.add('is-hovered');
          updateHoverReadout();
        });
        pillar.addEventListener('mouseleave', () => {
          if (hoveredBlock === block) hoveredBlock = null;
          pillar.classList.remove('is-hovered');
          if (!hoveredBlock && readoutEl) {
            readoutEl.textContent = defaultReadout;
            readoutEl.classList.remove('is-live');
          }
        });
        pillar.addEventListener('focus', () => {
          hoveredBlock = block;
          pointerGridX = c;
          pointerGridY = r;
          pillar.classList.add('is-hovered');
          updateHoverReadout();
        });
        pillar.addEventListener('blur', () => {
          if (hoveredBlock === block) hoveredBlock = null;
          pillar.classList.remove('is-hovered');
        });
        pillar.addEventListener('click', () => {
          const item = block.flipped ? block.backItem : block.frontItem;
          openPrintModal(ARCHIVE_PRINTS.indexOf(item));
        });

        cell.appendChild(pillar);
        frag.appendChild(cell);
        blocks.push(block);
      }
    }
    gridEl.appendChild(frag);

    // Subtle 3D Bird's Nest Camera Perspective Parallax
    stageEl?.addEventListener('mousemove', e => {
      const rect = stageEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      const baseX = window.innerWidth <= 560 ? 16 : 22;
      targetTiltX = baseX - ny * 4.5;
      targetTiltY = nx * 6.5;
    }, { passive: true });
    stageEl?.addEventListener('mouseleave', () => {
      targetTiltX = window.innerWidth <= 560 ? 16 : 22;
      targetTiltY = 0;
      pointerGridX = -99;
      pointerGridY = -99;
    });

    // Formation Switcher (I·P·C Relief / Beijing Wave / Concentric Ripple / Great Wall Terrace)
    formationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeMode = btn.dataset.mode || 'ipc';
        formationBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      });
    });

    // Kinetic 3D Block Flip Helper (swaps in a fresh verified diplomacy photograph)
    let poolCursor = 0;
    const flipBlock = b => {
      if (hoveredBlock === b) return;
      const curId = b.flipped ? b.backItem.id : b.frontItem.id;
      let nextItem = ARCHIVE_PRINTS[poolCursor % ARCHIVE_PRINTS.length];
      poolCursor += 1;
      if (nextItem.id === curId) {
        nextItem = ARCHIVE_PRINTS[poolCursor % ARCHIVE_PRINTS.length];
        poolCursor += 1;
      }
      if (!b.flipped) {
        b.backItem = nextItem;
        if (b.backImg) { b.backImg.src = nextItem.src; b.backImg.alt = nextItem.title; }
        b.flipped = true;
        b.el.classList.add('is-flipped');
      } else {
        b.frontItem = nextItem;
        if (b.frontImg) { b.frontImg.src = nextItem.src; b.frontImg.alt = nextItem.title; }
        b.flipped = false;
        b.el.classList.remove('is-flipped');
      }
      const shown = b.flipped ? b.backItem : b.frontItem;
      if (b.tagEl) b.tagEl.textContent = `${shown.id} · ${shown.year}`;
      b.el.setAttribute('aria-label', `${shown.title} (${shown.origin}, ${shown.year}) — Click for origin and source`);
    };

    // Periodic Living Flips across elevated blocks (keeps the sculpture shimmering with diplomacy)
    if (!reducedMotion) {
      let flipStep = 0;
      const letterBlocks = blocks.filter(b => b.isLetter);
      setInterval(() => {
        if (document.hidden || document.documentElement.classList.contains('ipc-loading')) return;
        const pool = activeMode === 'ipc' ? letterBlocks : blocks;
        const b = pool[(flipStep * 7) % pool.length];
        flipStep += 1;
        if (b) flipBlock(b);
      }, 950);
    }

    // Manual "↻ Flip Wave" sweeps a Beijing-2008 left-to-right domino flip across all 135 pillars
    flipWaveBtn?.addEventListener('click', () => {
      for (let c = 0; c < COLS; c++) {
        setTimeout(() => {
          for (let r = 0; r < ROWS; r++) {
            const b = blocks[r * COLS + c];
            if (b) flipBlock(b);
          }
        }, c * 52);
      }
    });

    // Compute Target Pillar Elevation (strictly >= 4px so Chromium 3D hit-testing reaches EVERY block!)
    const computeTargetZ = (b, sec, isMobile) => {
      const scale = isMobile ? 0.56 : 1;
      let h = 6;
      if (activeMode === 'ipc') {
        if (b.isLetter) {
          // Elevated monumental I·P·C relief breathing smoothly like the 897 Beijing performers
          const breath = Math.sin(sec * 1.45 - b.c * 0.42 + b.r * 0.25) * 6;
          h = 74 + breath;
        } else {
          // Recessed rippling sea of background diplomacy blocks
          const sea = (Math.sin(sec * 1.25 - b.diag * 0.48) + 1) * 7.5;
          h = 5 + sea;
        }
      } else if (activeMode === 'wave') {
        // Iconic Beijing 2008 rolling diagonal liquid wave
        const w = (Math.sin(sec * 2.1 - b.c * 0.52 - b.r * 0.36) + 1) * 0.5;
        h = 6 + Math.pow(w, 1.35) * 76;
      } else if (activeMode === 'ripple') {
        // Concentric stone-in-water stadium rings pulsing outward from center
        const w = (Math.sin(sec * 2.5 - b.distCenter * 1.05) + 1) * 0.5;
        h = 6 + Math.pow(w, 1.45) * 76;
      } else {
        // "Great Wall" terraced architectural steps + crenellated diagonal crest
        const ridge = Math.abs((b.r - 4) - Math.sin(b.c * 0.44 + sec * 0.85) * 2.1);
        const crest = Math.max(0, 1 - ridge / 2.25);
        const battlement = (b.c % 2 === 0 && crest > 0.55) ? 10 : 0;
        h = 6 + crest * 66 + battlement;
      }

      // Interactive physical cursor ripple (nearby blocks surge up toward the cursor!)
      if (pointerGridX >= 0) {
        const d = Math.hypot(b.c - pointerGridX, b.r - pointerGridY);
        if (d === 0) {
          h = Math.max(h, 96);
        } else if (d < 2.6) {
          const boost = (1 - d / 2.6) * 34;
          h = Math.max(h, h + boost * 0.65);
        }
      }

      return Math.max(4, h * scale);
    };

    const tick = now => {
      const isLoading = document.documentElement.classList.contains('ipc-loading');
      if (!isLoading && introStartTime === null) introStartTime = now;
      const isMobile = window.innerWidth <= 560;
      const sec = now * 0.001;

      // Smooth 3D perspective camera tilt
      curTiltX += (targetTiltX - curTiltX) * 0.07;
      curTiltY += (targetTiltY - curTiltY) * 0.07;
      planeEl.style.transform = `rotateX(${curTiltX.toFixed(2)}deg) rotateY(${curTiltY.toFixed(2)}deg)`;

      const sharpCut = isMobile ? 28 : 48;
      const midCut = isMobile ? 16 : 26;

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        let targetZ = 4;
        if (!isLoading && introStartTime !== null) {
          // Staggered Beijing-2008 wave rise from flat floor after loader clears
          const introElapsed = (now - introStartTime) - 420 - b.diag * 34;
          const introT = introElapsed <= 0 ? 0 : introElapsed >= 650 ? 1 : 1 - Math.pow(1 - introElapsed / 650, 3);
          targetZ = 4 + (computeTargetZ(b, sec, isMobile) - 4) * introT;
        }
        const lerp = hoveredBlock === b ? 0.24 : 0.14;
        b.z += (targetZ - b.z) * lerp;
        b.el.style.transform = `translate3d(0, 0, ${b.z.toFixed(1)}px)`;
        b.el.style.setProperty('--sh', (b.z / 100).toFixed(3));

        // Discrete GPU-cached optical depth-of-field tier
        const nextDof = b.z >= sharpCut ? 2 : b.z >= midCut ? 1 : 0;
        if (nextDof !== b.dof) {
          b.dof = nextDof;
          b.el.dataset.dof = String(nextDof);
        }
      }

      requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      requestAnimationFrame(tick);
    } else {
      const isMobile = window.innerWidth <= 560;
      blocks.forEach(b => {
        const z = b.isLetter ? (isMobile ? 42 : 74) : 6;
        b.z = z;
        b.el.style.transform = `translate3d(0, 0, ${z}px)`;
        b.el.style.setProperty('--sh', (z / 100).toFixed(3));
        b.el.dataset.dof = b.isLetter ? '2' : '0';
      });
    }
  }

  // ─── 2. Archival Light-Table Modal + Full 20-Source Registry ───
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
  const heroSection = document.querySelector('.mt-hero');
  const onScroll = () => {
    const threshold = heroSection ? Math.max(120, heroSection.offsetHeight - 96) : 36;
    header?.classList.toggle('scrolled', window.scrollY > threshold);
  };
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
