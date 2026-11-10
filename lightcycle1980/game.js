/**
 * NAGEL // GRID '84 — 2D Serigraph & Cyberpunk Light-Cycle Engine
 * Pure Vanilla JS. Zero frameworks. Zero getElementById.
 */
(() => {
  'use strict';

  // --- GRID & TIMING CONSTANTS ---
  const CELL = 8;
  const COLS = 120; // 960px
  const ROWS = 84;  // 672px
  const WIDTH = COLS * CELL;
  const HEIGHT = ROWS * CELL;

  const DIRS = {
    up:    { dx: 0,  dy: -1, angle: -Math.PI / 2, index: 0, opposite: 'down' },
    right: { dx: 1,  dy: 0,  angle: 0,            index: 1, opposite: 'left' },
    down:  { dx: 0,  dy: 1,  angle: Math.PI / 2,  index: 2, opposite: 'up' },
    left:  { dx: -1, dy: 0,  angle: Math.PI,      index: 3, opposite: 'right' },
  };
  const DIR_KEYS = ['up', 'right', 'down', 'left'];

  const WINS_TO_CLAIM_MATCH = 3;
  const BASE_STEP_SEC = 0.052; // ~19.2 cells/sec base speed (approachable Stage 1 pace)
  const BOOST_MULTIPLIER = 1.78;
  const PANIC_MULTIPLIER = 2.15;

  const PANIC_CALLOUTS = [
    'BOXED IN?!',
    'NO EXIT!',
    'TRAPPED!',
    'NOT THE HAIR!',
    'SEALED OFF!',
  ];

  // --- NAGEL RIVAL ROSTER ---
  const RIVALS = [
    {
      id: 'valerie',
      name: 'VALERIE // VIPER-84',
      sub: 'Neural-Jacked Couture Assassin',
      colorLabel: 'LIPSTICK CRIMSON',
      color: '#ff1755',
      glow: 'rgba(255, 23, 85, 0.72)',
      portrait: 'assets/rival-valerie.jpg',
      style: 'hunter',
      sectorName: 'MIAMI-GINZA // SECTOR 01',
      quotesStart: [
        '“Darling, that teal chassis clashes horribly with your imminent explosion.”',
        '“Don’t smudge my serigraph finish when you derez against my wake.”',
        '“All shoulder pads, zero reflexes. Show me something sharp.”',
      ],
      quotesWin: [
        '“Predictable. Frame the wreckage and hang it in a Soho gallery.”',
        '“Too slow, sweetie. Chrome never forgives hesitation.”',
      ],
      quotesLose: [
        '“Impossible! My neural visor had your trajectory locked!”',
        '“Fine—clean cut. Don’t let the neon go to your hair.”',
      ],
    },
    {
      id: 'dante',
      name: 'DANTE // CHROME-ZERO',
      sub: 'New-Romantic Geometry Architect',
      colorLabel: 'SUNSET AMBER',
      color: '#ff9e00',
      glow: 'rgba(255, 158, 0, 0.72)',
      portrait: 'assets/rival-dante.jpg',
      style: 'architect',
      sectorName: 'ROPPONGI-VICE // SECTOR 02',
      quotesStart: [
        '“Every 90-degree turn is a brushstroke. Yours are tragically amateur.”',
        '“My synthesizer has more survival instinct than your steering.”',
        '“I will box you into a 4-pixel coffin with immaculate symmetry.”',
      ],
      quotesWin: [
        '“Pure Euclidean perfection. Not a single hair out of place.”',
        '“Another silhouette erased from the evening edition.”',
      ],
      quotesLose: [
        '“My monocle flared! That razor turn was statistically absurd!”',
        '“A chaotic line... yet undeniably fashionable. Touché.”',
      ],
    },
    {
      id: 'twins',
      name: 'THE SALON SYNDICATE',
      sub: 'Valerie + Dante Dual-Vector Ambush',
      colorLabel: 'CRIMSON & VIOLET',
      color: '#ff1755',
      glow: 'rgba(255, 23, 85, 0.72)',
      portrait: 'assets/rival-valerie.jpg',
      style: 'syndicate',
      sectorName: 'PENTHOUSE CORE // FINALE',
      quotesStart: [
        '“Two against one? Relax darling, symmetry demands a sacrifice.”',
        '“Valerie takes your flank, Dante seals the horizon. Pose nicely!”',
      ],
      quotesWin: [
        '“Cross-hatched in crimson and violet. Hang it in the Louvre.”',
      ],
      quotesLose: [
        '“You dismantled the entire Syndicate?! Respect, Grid Sovereign.”',
      ],
    },
  ];

  const GRAZE_CALLOUTS = [
    'RAZOR GRAZE!',
    'SO CHIC!',
    'SILK CUT!',
    'CHROME NERVE!',
    '84 VOLTAGE!',
    'SHARP!',
  ];

  // --- DOM REFERENCES (strictly document.querySelector / querySelectorAll) ---
  const canvas = document.querySelector('#grid-canvas');
  const ctx = canvas.getContext('2d');
  const arenaMat = document.querySelector('#arena-mat');
  const stageOverlay = document.querySelector('#stage-overlay');
  const overlayKicker = document.querySelector('#overlay-kicker');
  const overlayHeadline = document.querySelector('#overlay-headline');
  const overlayCopy = document.querySelector('#overlay-copy');
  const startBtn = document.querySelector('#start-btn');

  const modeButtons = document.querySelectorAll('.mode-btn');
  const audioBtn = document.querySelector('#audio-btn');
  const crtBtn = document.querySelector('#crt-btn');
  const manualOpenBtn = document.querySelector('#manual-open-btn');
  const overlayManualBtn = document.querySelector('#overlay-manual-btn');
  const manualDialog = document.querySelector('#manual-dialog');

  // Player 1 HUD
  const p1StatusBadge = document.querySelector('#p1-status-badge');
  const p1ScoreEl = document.querySelector('#p1-score');
  const p1MultEl = document.querySelector('#p1-mult');
  const p1WinsEl = document.querySelector('#p1-wins');
  const p1GrazesEl = document.querySelector('#p1-grazes');
  const p1BoostPct = document.querySelector('#p1-boost-pct');
  const p1BoostBar = document.querySelector('#p1-boost-bar');
  const p1KeysEl = document.querySelector('#p1-keys');

  // Rival / P2 HUD
  const rivalSlotLabel = document.querySelector('#rival-slot-label');
  const rivalColorLabel = document.querySelector('#rival-color-label');
  const rivalPortrait = document.querySelector('#rival-portrait');
  const rivalStatusBadge = document.querySelector('#rival-status-badge');
  const rivalNameEl = document.querySelector('#rival-name');
  const rivalSubEl = document.querySelector('#rival-sub');
  const rivalStat1Label = document.querySelector('#rival-stat1-label');
  const rivalStat1Val = document.querySelector('#rival-stat1-val');
  const rivalWinsEl = document.querySelector('#rival-wins');
  const rivalBoostPct = document.querySelector('#rival-boost-pct');
  const rivalBoostBar = document.querySelector('#rival-boost-bar');
  const rivalQuoteEl = document.querySelector('#rival-quote');

  // Footer ticker & Touch
  const stageReadout = document.querySelector('#stage-readout');
  const hiScoreReadout = document.querySelector('#hi-score-readout');
  const dpadBtns = document.querySelectorAll('.dpad-btn');
  const touchBoostBtn = document.querySelector('#touch-boost-btn');

  // --- PROGRESSIVE ENHANCEMENT FOR DIALOG ---
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    const openManual = () => {
      if (manualDialog && !manualDialog.open) manualDialog.showModal();
    };
    manualOpenBtn?.addEventListener('click', openManual);
    overlayManualBtn?.addEventListener('click', openManual);
  }

  if (!('closedBy' in HTMLDialogElement.prototype) && manualDialog) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    manualDialog.addEventListener('pointerdown', (e) => {
      pressedOutside = outside(e, manualDialog);
    });
    manualDialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && outside(e, manualDialog)) manualDialog.close();
    });
  }

  // --- AUDIO INSTANCE & PERSISTENT SOUND PREFERENCE (checked first on load) ---
  const AUDIO_STORAGE_KEY = 'nagel_grid84_audio';
  const audio = new window.SynthGridAudio();

  function syncAudioButtonUI(isOn) {
    audioBtn.setAttribute('aria-pressed', String(isOn));
    audioBtn.textContent = `SFX + Synth: ${isOn ? 'ON' : 'OFF'}`;
  }

  try {
    const savedAudio = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (savedAudio === 'off' || savedAudio === 'false') {
      audio.setEnabled(false);
      syncAudioButtonUI(false);
    }
  } catch {
    // Ignore storage privacy restrictions
  }

  function handleAudioToggle() {
    const isOn = audio.toggleAudio();
    syncAudioButtonUI(isOn);
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, isOn ? 'on' : 'off');
    } catch {
      // Ignore storage restrictions
    }
  }

  // --- PERSISTENT HIGH SCORE ---
  const STORAGE_KEY = 'nagel_grid84_hiscore';
  let hiScore = 19840;
  try {
    const saved = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) || '19840', 10);
    if (Number.isFinite(saved) && saved > hiScore) hiScore = saved;
  } catch {
    // Ignore storage privacy restrictions
  }
  hiScoreReadout.textContent = String(hiScore).padStart(6, '0');

  function updateHighScore(candidate) {
    if (candidate > hiScore) {
      hiScore = Math.floor(candidate);
      hiScoreReadout.textContent = String(hiScore).padStart(6, '0');
      try {
        window.localStorage.setItem(STORAGE_KEY, String(hiScore));
      } catch {
        // Ignore storage restrictions
      }
    }
  }

  // --- REDUCED MOTION & VFX PREFERENCES ---
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let vfxEnabled = !reducedMotionQuery.matches;
  if (!vfxEnabled) {
    document.body.dataset.crt = 'off';
    crtBtn.setAttribute('aria-pressed', 'false');
    crtBtn.textContent = 'CRT + VFX: OFF';
  }

  // --- OFFSCREEN SERIGRAPH ARENA BACKDROP ---
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = WIDTH;
  bgCanvas.height = HEIGHT;
  const bgCtx = bgCanvas.getContext('2d');

  function renderSerigraphBackdrop(stageIndex = 0) {
    bgCtx.fillStyle = '#090710';
    bgCtx.fillRect(0, 0, WIDTH, HEIGHT);

    // Bold Nagel geometric color-block slashes (subtle ink-tinted planes so neon trails pop!)
    const palettes = [
      ['#180d2c', '#2a1029', '#0a2129'],
      ['#1f1024', '#291811', '#120f2e'],
      ['#160b2e', '#2d0e28', '#0d2228'],
    ];
    const pal = palettes[stageIndex % palettes.length];

    // Diagonal Polygon 1
    bgCtx.fillStyle = pal[0];
    bgCtx.beginPath();
    bgCtx.moveTo(0, 0);
    bgCtx.lineTo(WIDTH * 0.58, 0);
    bgCtx.lineTo(WIDTH * 0.32, HEIGHT);
    bgCtx.lineTo(0, HEIGHT);
    bgCtx.closePath();
    bgCtx.fill();

    // Diagonal Polygon 2
    bgCtx.fillStyle = pal[1];
    bgCtx.beginPath();
    bgCtx.moveTo(WIDTH * 0.58, 0);
    bgCtx.lineTo(WIDTH * 0.72, 0);
    bgCtx.lineTo(WIDTH * 0.46, HEIGHT);
    bgCtx.lineTo(WIDTH * 0.32, HEIGHT);
    bgCtx.closePath();
    bgCtx.fill();

    // Right accent plane
    bgCtx.fillStyle = pal[2];
    bgCtx.beginPath();
    bgCtx.moveTo(WIDTH * 0.85, 0);
    bgCtx.lineTo(WIDTH, 0);
    bgCtx.lineTo(WIDTH, HEIGHT);
    bgCtx.lineTo(WIDTH * 0.62, HEIGHT);
    bgCtx.closePath();
    bgCtx.fill();

    // Crisp Nagel razor-thin accent slash lines
    bgCtx.strokeStyle = 'rgba(255, 23, 85, 0.28)';
    bgCtx.lineWidth = 2;
    bgCtx.beginPath();
    bgCtx.moveTo(WIDTH * 0.58, 0);
    bgCtx.lineTo(WIDTH * 0.32, HEIGHT);
    bgCtx.stroke();

    bgCtx.strokeStyle = 'rgba(0, 245, 212, 0.24)';
    bgCtx.beginPath();
    bgCtx.moveTo(WIDTH * 0.72, 0);
    bgCtx.lineTo(WIDTH * 0.46, HEIGHT);
    bgCtx.stroke();

    // Halftone dot clusters in top-left & bottom-right corners
    bgCtx.fillStyle = 'rgba(250, 246, 240, 0.065)';
    for (let y = 16; y < 190; y += 12) {
      for (let x = 16; x < 240 - y * 0.8; x += 12) {
        bgCtx.beginPath();
        bgCtx.arc(x, y, 1.7, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }
    for (let y = HEIGHT - 180; y < HEIGHT - 12; y += 12) {
      for (let x = WIDTH - (y - (HEIGHT - 200)) * 1.1; x < WIDTH - 12; x += 12) {
        bgCtx.beginPath();
        bgCtx.arc(x, y, 1.7, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }

    // Fine architectural cell sub-grid (8px)
    bgCtx.strokeStyle = 'rgba(155, 246, 255, 0.035)';
    bgCtx.lineWidth = 1;
    bgCtx.beginPath();
    for (let x = CELL; x < WIDTH; x += CELL) {
      bgCtx.moveTo(x + 0.5, 0);
      bgCtx.lineTo(x + 0.5, HEIGHT);
    }
    for (let y = CELL; y < HEIGHT; y += CELL) {
      bgCtx.moveTo(0, y + 0.5);
      bgCtx.lineTo(WIDTH, y + 0.5);
    }
    bgCtx.stroke();

    // Major architectural 10-cell sector grid (80px)
    bgCtx.strokeStyle = 'rgba(250, 246, 240, 0.09)';
    bgCtx.lineWidth = 1;
    bgCtx.beginPath();
    for (let x = CELL * 10; x < WIDTH; x += CELL * 10) {
      bgCtx.moveTo(x + 0.5, 0);
      bgCtx.lineTo(x + 0.5, HEIGHT);
    }
    for (let y = CELL * 10; y < HEIGHT; y += CELL * 10) {
      bgCtx.moveTo(0, y + 0.5);
      bgCtx.lineTo(WIDTH, y + 0.5);
    }
    bgCtx.stroke();

    // Crosshair registration marks at sector intersections
    bgCtx.strokeStyle = 'rgba(255, 209, 102, 0.2)';
    for (let x = CELL * 20; x < WIDTH; x += CELL * 20) {
      for (let y = CELL * 20; y < HEIGHT; y += CELL * 20) {
        bgCtx.beginPath();
        bgCtx.moveTo(x - 4, y);
        bgCtx.lineTo(x + 4, y);
        bgCtx.moveTo(x, y - 4);
        bgCtx.lineTo(x, y + 4);
        bgCtx.stroke();
      }
    }

    // Subtle 1984 architectural watermark typography
    bgCtx.save();
    bgCtx.fillStyle = 'rgba(250, 246, 240, 0.055)';
    bgCtx.font = '900 54px "Futura", "Avenir Next Condensed", sans-serif';
    bgCtx.fillText('RIO // 1984', 26, HEIGHT - 28);
    bgCtx.font = '700 13px "SFMono-Regular", monospace';
    bgCtx.fillStyle = 'rgba(0, 245, 212, 0.22)';
    bgCtx.fillText('SERIGRAPH MATRIX 120×84 // NO MERCY', WIDTH - 295, 24);
    bgCtx.restore();

    // Lethal Perimeter Neon Wall Inner Trim
    bgCtx.strokeStyle = '#ff1755';
    bgCtx.lineWidth = 3;
    bgCtx.strokeRect(1.5, 1.5, WIDTH - 3, HEIGHT - 3);
  }

  // --- GAME STATE ---
  // Supported modes:
  //   - 'circuit' : 1P fighting-game ladder (Valerie -> Dante -> Salon Syndicate)
  //   - 'chaos'   : 1P endless escalating 4-bike survival waves
  //   - 'versus'  : 2P same-keyboard PvP (P1: WASD+Space, P2: Arrows+Shift/Enter).
  //                 NOTE: 'versus' is intentionally hidden in index.html UI,
  //                 but all setup, input, HUD, and scoring logic remains intact here.
  //                 To restore it, uncomment the `data-mode="versus"` button in index.html.
  const state = {
    mode: 'circuit',     // 'circuit' | 'chaos' | 'versus' (hidden in UI; see note above)
    phase: 'attract',    // 'attract' | 'countdown' | 'playing' | 'paused' | 'roundEnd' | 'matchEnd'
    circuitStage: 0,     // 0: Valerie, 1: Dante, 2: Syndicate Twins
    chaosWave: 1,

    p1Wins: 0,
    rivalWins: 0,
    score: 0,
    styleMult: 1.0,
    grazes: 0,

    countdownTimer: 0,
    lastCountdownInt: 4,
    hitStopTimer: 0,
    shakePower: 0,
    slashFlash: null,    // { x, y, angle, timer }
    chronoTimer: 0,      // Teal prism slow-mo for enemies!
    prismSpawnTimer: 3.5,

    grid: new Uint8Array(COLS * ROWS), // 0 = empty, 1..4 = bike id + 1
    cycles: [],
    prisms: [],          // { gx, gy, type, pulse }
    particles: [],
    scorchMarks: [],     // { x, y, color }
    callouts: [],        // { x, y, text, color, life, maxLife }
  };

  const keysHeld = new Set();
  let touchBoostActive = false;

  // --- CYCLE FACTORY ---
  function createCycle({
    id,
    name,
    gx,
    gy,
    dir,
    color,
    glow,
    isAI = false,
    aiStyle = 'hunter',
    controlScheme = 'p1', // 'p1' | 'p2' | 'both'
  }) {
    return {
      id,
      name,
      gx,
      gy,
      prevGx: gx,
      prevGy: gy,
      dir,
      turnQueue: [],
      color,
      glow,
      alive: true,
      isAI,
      aiStyle,
      controlScheme,

      stepAccum: 0,
      boostEnergy: 100,
      boosting: false,
      aiBoostTicks: 0,
      grazeCooldown: 0,
      turnCooldownCells: 0,
      panicking: false,
      hasPanicked: false,

      // Trail stored as list of polylines so EMP Slash can trim old cells cleanly!
      // Each cell entry: { gx, gy }
      cells: [{ gx, gy }],
      afterimages: [],
    };
  }

  function clearGridAndRebuild() {
    state.grid.fill(0);
    for (const c of state.cycles) {
      const val = c.id + 1;
      for (const pt of c.cells) {
        if (pt.gx >= 0 && pt.gx < COLS && pt.gy >= 0 && pt.gy < ROWS) {
          state.grid[pt.gy * COLS + pt.gx] = val;
        }
      }
    }
  }

  function isCellBlocked(gx, gy) {
    if (gx <= 0 || gx >= COLS - 1 || gy <= 0 || gy >= ROWS - 1) return true;
    return state.grid[gy * COLS + gx] !== 0;
  }

  // --- SETUP ROUNDS & ATTRACT DEMO ---
  function setupCyclesForCurrentMode(isAttractDemo = false) {
    state.cycles = [];
    state.prisms = [];
    state.particles = [];
    state.scorchMarks = [];
    state.callouts = [];
    state.chronoTimer = 0;
    state.prismSpawnTimer = 3.2;
    state.slashFlash = null;

    const midY = Math.floor(ROWS / 2);

    if (isAttractDemo) {
      state.cycles.push(
        createCycle({
          id: 0,
          name: 'DEMO-TEAL',
          gx: 24,
          gy: midY,
          dir: 'right',
          color: '#00f5d4',
          glow: 'rgba(0, 245, 212, 0.75)',
          isAI: true,
          aiStyle: 'architect',
        }),
        createCycle({
          id: 1,
          name: 'DEMO-CRIMSON',
          gx: COLS - 25,
          gy: midY,
          dir: 'left',
          color: '#ff1755',
          glow: 'rgba(255, 23, 85, 0.75)',
          isAI: true,
          aiStyle: 'hunter',
        }),
        createCycle({
          id: 2,
          name: 'DEMO-VIOLET',
          gx: Math.floor(COLS / 2),
          gy: 16,
          dir: 'down',
          color: '#c77dff',
          glow: 'rgba(199, 125, 255, 0.75)',
          isAI: true,
          aiStyle: 'hunter',
        })
      );
      renderSerigraphBackdrop(0);
      clearGridAndRebuild();
      return;
    }

    if (state.mode === 'versus') {
      // 2-Player Local Duel
      state.cycles.push(
        createCycle({
          id: 0,
          name: 'PLAYER 01',
          gx: 22,
          gy: midY,
          dir: 'right',
          color: '#00f5d4',
          glow: 'rgba(0, 245, 212, 0.78)',
          isAI: false,
          controlScheme: 'p1',
        }),
        createCycle({
          id: 1,
          name: 'PLAYER 02',
          gx: COLS - 23,
          gy: midY,
          dir: 'left',
          color: '#ff1755',
          glow: 'rgba(255, 23, 85, 0.78)',
          isAI: false,
          controlScheme: 'p2',
        })
      );
      renderSerigraphBackdrop(0);
    } else if (state.mode === 'chaos') {
      // 4-Bike Neon Chaos: Player 1 vs 3 AI Rivals!
      state.cycles.push(
        createCycle({
          id: 0,
          name: 'RYDER // RIO-01',
          gx: 20,
          gy: midY,
          dir: 'right',
          color: '#00f5d4',
          glow: 'rgba(0, 245, 212, 0.78)',
          isAI: false,
          controlScheme: 'both',
        }),
        createCycle({
          id: 1,
          name: 'VALERIE // VIPER',
          gx: COLS - 21,
          gy: midY,
          dir: 'left',
          color: '#ff1755',
          glow: 'rgba(255, 23, 85, 0.78)',
          isAI: true,
          aiStyle: 'hunter',
        }),
        createCycle({
          id: 2,
          name: 'DANTE // CHROME',
          gx: Math.floor(COLS / 2),
          gy: 15,
          dir: 'down',
          color: '#ff9e00',
          glow: 'rgba(255, 158, 0, 0.78)',
          isAI: true,
          aiStyle: 'architect',
        }),
        createCycle({
          id: 3,
          name: 'CONTESSA // VIOLET',
          gx: Math.floor(COLS / 2),
          gy: ROWS - 16,
          dir: 'up',
          color: '#c77dff',
          glow: 'rgba(199, 125, 255, 0.78)',
          isAI: true,
          aiStyle: 'hunter',
        })
      );
      renderSerigraphBackdrop(2);
    } else {
      // 1P Circuit Mode (Stages 0, 1, 2)
      const rival = RIVALS[state.circuitStage];
      state.cycles.push(
        createCycle({
          id: 0,
          name: 'RYDER // RIO-01',
          gx: 22,
          gy: midY,
          dir: 'right',
          color: '#00f5d4',
          glow: 'rgba(0, 245, 212, 0.78)',
          isAI: false,
          controlScheme: 'both',
        })
      );

      if (rival.style === 'syndicate') {
        // Boss Stage: Valerie + Dante simultaneously!
        state.cycles.push(
          createCycle({
            id: 1,
            name: 'VALERIE // VIPER-84',
            gx: COLS - 23,
            gy: midY - 14,
            dir: 'left',
            color: '#ff1755',
            glow: 'rgba(255, 23, 85, 0.78)',
            isAI: true,
            aiStyle: 'hunter',
          }),
          createCycle({
            id: 2,
            name: 'DANTE // SYNDICATE',
            gx: COLS - 23,
            gy: midY + 14,
            dir: 'left',
            color: '#c77dff',
            glow: 'rgba(199, 125, 255, 0.78)',
            isAI: true,
            aiStyle: 'architect',
          })
        );
      } else {
        state.cycles.push(
          createCycle({
            id: 1,
            name: rival.name,
            gx: COLS - 23,
            gy: midY,
            dir: 'left',
            color: rival.color,
            glow: rival.glow,
            isAI: true,
            aiStyle: rival.style,
          })
        );
      }
      renderSerigraphBackdrop(state.circuitStage);
    }

    clearGridAndRebuild();
    syncDossierUI();
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- DOSSIER & HUD SYNCHRONIZATION ---
  function syncDossierUI() {
    p1WinsEl.textContent = String(state.p1Wins);
    rivalWinsEl.textContent = String(state.rivalWins);
    p1ScoreEl.textContent = String(Math.floor(state.score)).padStart(6, '0');
    p1MultEl.textContent = `×${state.styleMult.toFixed(1)}`;
    p1GrazesEl.textContent = String(state.grazes);

    if (state.mode === 'versus') {
      p1KeysEl.innerHTML = '<span><kbd>WASD</kbd></span><span><kbd>SPACE</kbd> Boost</span><span><kbd>P</kbd> Pause</span>';
      rivalSlotLabel.textContent = 'PLAYER 02';
      rivalColorLabel.textContent = 'LIPSTICK CRIMSON';
      rivalPortrait.src = 'assets/rival-valerie.jpg';
      rivalNameEl.textContent = 'PLAYER 02 // VIPER';
      rivalSubEl.textContent = 'Arrows Steer • Shift / Enter Overdrive';
      rivalStat1Label.textContent = 'Control Deck';
      rivalStat1Val.textContent = 'ARROWS';
      rivalQuoteEl.textContent = '“Same keyboard, zero excuses. First to 3 wins owns the penthouse.”';
      stageReadout.textContent = `2P COUCH DUEL // FIRST TO ${WINS_TO_CLAIM_MATCH} WINS`;
    } else if (state.mode === 'chaos') {
      p1KeysEl.innerHTML = '<span><kbd>SPACE</kbd> Overdrive</span><span><kbd>P</kbd> Pause</span>';
      rivalSlotLabel.textContent = '3-AI PACK';
      rivalColorLabel.textContent = 'NEON SYNDICATE';
      rivalPortrait.src = state.chaosWave % 2 === 1 ? 'assets/rival-dante.jpg' : 'assets/rival-valerie.jpg';
      rivalNameEl.textContent = `PACK WAVE 0${state.chaosWave}`;
      rivalSubEl.textContent = '3 Simultaneous Cyber-Hunters';
      rivalStat1Label.textContent = 'Wave Bonus';
      rivalStat1Val.textContent = `×${state.chaosWave}`;
      stageReadout.textContent = `4-BIKE CHAOS // WAVE 0${state.chaosWave} // SURVIVE THE GRID`;
    } else {
      p1KeysEl.innerHTML = '<span><kbd>SPACE</kbd> Overdrive</span><span><kbd>P</kbd> Pause</span>';
      const rival = RIVALS[state.circuitStage];
      rivalSlotLabel.textContent = `RIVAL 0${state.circuitStage + 1}/03`;
      rivalColorLabel.textContent = rival.colorLabel;
      rivalPortrait.src = rival.portrait;
      rivalNameEl.textContent = rival.name;
      rivalSubEl.textContent = rival.sub;
      rivalStat1Label.textContent = 'Circuit Tier';
      rivalStat1Val.textContent = `STAGE 0${state.circuitStage + 1}`;
      stageReadout.textContent = `CIRCUIT STAGE 0${state.circuitStage + 1} // ${rival.sectorName}`;
    }
  }

  function updateRealtimeMeters() {
    // Do not mirror background Attract Mode demo bots onto the player HUD cards
    if (state.phase === 'attract') {
      p1BoostPct.textContent = '100%';
      p1BoostBar.style.transform = 'scaleX(1)';
      p1StatusBadge.textContent = 'READY';
      rivalBoostPct.textContent = '100%';
      rivalBoostBar.style.transform = 'scaleX(1)';
      rivalStatusBadge.textContent = 'LOCKED IN';
      return;
    }

    const p1 = state.cycles[0];
    if (p1) {
      const pct = Math.max(0, Math.min(100, Math.round(p1.boostEnergy)));
      p1BoostPct.textContent = `${pct}%`;
      p1BoostBar.style.transform = `scaleX(${pct / 100})`;
      p1StatusBadge.textContent = !p1.alive ? 'DEREZZED' : p1.boosting ? 'OVERDRIVE!' : 'LOCKED IN';
    }

    const r = state.cycles[1];
    if (r) {
      const pct = Math.max(0, Math.min(100, Math.round(r.boostEnergy)));
      rivalBoostPct.textContent = `${pct}%`;
      rivalBoostBar.style.transform = `scaleX(${pct / 100})`;
      rivalStatusBadge.textContent = !r.alive
        ? 'DEREZZED'
        : r.panicking
          ? 'PANICKING!'
          : r.boosting
            ? 'OVERDRIVE!'
            : 'HUNTING';
    }
  }

  // --- TURN BUFFERING ---
  function queueTurn(cycle, desiredDir) {
    if (!cycle || !cycle.alive) return;
    const referenceDir = cycle.turnQueue.length > 0
      ? cycle.turnQueue[cycle.turnQueue.length - 1]
      : cycle.dir;

    // Ignore same direction or illegal 180-degree self-reversal
    if (desiredDir === referenceDir || DIRS[referenceDir].opposite === desiredDir) {
      return;
    }
    if (cycle.turnQueue.length < 2) {
      cycle.turnQueue.push(desiredDir);
    }
  }

  // --- FLOOD-FILL SPACE ESTIMATOR FOR SMART AI ---
  const bfsVisited = new Uint8Array(COLS * ROWS);
  const bfsQueue = new Int32Array(COLS * ROWS);
  let bfsStamp = 1;

  function analyzeChamber(startGx, startGy, targetBike = null, maxCount = 380) {
    if (isCellBlocked(startGx, startGy)) {
      return { count: 0, reachesTarget: false };
    }
    bfsStamp = (bfsStamp + 1) % 250;
    if (bfsStamp === 0) {
      bfsVisited.fill(0);
      bfsStamp = 1;
    }

    let head = 0;
    let tail = 0;
    const startIdx = startGy * COLS + startGx;
    bfsVisited[startIdx] = bfsStamp;
    bfsQueue[tail++] = startIdx;

    const hasTarget = Boolean(targetBike && targetBike.alive);
    const tx = hasTarget ? targetBike.gx : -999;
    const ty = hasTarget ? targetBike.gy : -999;

    let count = 0;
    let reachesTarget = false;

    while (head < tail && count < maxCount) {
      const curr = bfsQueue[head++];
      count++;
      const cx = curr % COLS;
      const cy = (curr / COLS) | 0;

      if (!reachesTarget && hasTarget && Math.abs(cx - tx) + Math.abs(cy - ty) <= 2) {
        reachesTarget = true;
      }

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];
      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1) {
          const nIdx = ny * COLS + nx;
          if (bfsVisited[nIdx] !== bfsStamp && state.grid[nIdx] === 0) {
            bfsVisited[nIdx] = bfsStamp;
            bfsQueue[tail++] = nIdx;
          }
        }
      }
    }
    return { count, reachesTarget };
  }

  function raycastClearance(gx, gy, dirKey, maxDist = 35) {
    const { dx, dy } = DIRS[dirKey];
    let dist = 0;
    let cx = gx + dx;
    let cy = gy + dy;
    while (dist < maxDist && !isCellBlocked(cx, cy)) {
      dist++;
      cx += dx;
      cy += dy;
    }
    return dist;
  }

  function getAITierSettings() {
    let tier = 1;
    if (state.phase !== 'attract') {
      if (state.mode === 'circuit') {
        tier = state.circuitStage; // 0, 1, 2
      } else if (state.mode === 'chaos') {
        tier = Math.min(2, state.chaosWave - 1);
      }
    }

    if (tier <= 0) {
      // Stage 1: Approachable, stylish, commits 5 cells per turn, short-sighted flood-fill
      return { visionCap: 55, turnLock: 5, noise: 34, boostChance: 0.08, huntWeight: 15 };
    }
    if (tier === 1) {
      // Stage 2: Medium tactical vision, 3-cell turn commitment
      return { visionCap: 120, turnLock: 3, noise: 16, boostChance: 0.18, huntWeight: 21 };
    }
    // Stage 3 / Chaos Wave 3+: Sharp syndicate awareness, 2-cell human reaction floor
    return { visionCap: 210, turnLock: 2, noise: 7, boostChance: 0.28, huntWeight: 25 };
  }

  function runAIDecision(cycle) {
    const currentDir = cycle.dir;
    const candidates = DIR_KEYS.filter((d) => d !== DIRS[currentDir].opposite);
    const targetPlayer = state.cycles.find((c) => c.id !== cycle.id && c.alive);
    const tier = getAITierSettings();

    if (cycle.turnCooldownCells > 0) {
      cycle.turnCooldownCells--;
    }

    // Evaluate candidate directions once for both Panic Spiral check and tactical choice
    const options = [];
    let maxRawSpace = 0;
    let anyReachesTarget = false;

    for (const dirKey of candidates) {
      const { dx, dy } = DIRS[dirKey];
      const nx = cycle.gx + dx;
      const ny = cycle.gy + dy;
      if (isCellBlocked(nx, ny)) continue;

      const chamber = analyzeChamber(nx, ny, targetPlayer, 380);
      const clearance = raycastClearance(cycle.gx, cycle.gy, dirKey, 36);
      if (chamber.count > maxRawSpace) maxRawSpace = chamber.count;
      if (chamber.reachesTarget) anyReachesTarget = true;

      options.push({
        dirKey,
        nx,
        ny,
        rawSpace: chamber.count,
        perceivedSpace: Math.min(chamber.count, tier.visionCap),
        clearance,
      });
    }

    if (options.length === 0) return;

    // --- #1: PANIC SPIRAL DETECTION WHEN BOXED IN ---
    if (state.phase === 'playing') {
      if (!cycle.panicking && !anyReachesTarget && maxRawSpace < 350) {
        let playerSpace = 400;
        if (targetPlayer) {
          const pDir = DIRS[targetPlayer.dir];
          const pFront = analyzeChamber(
            targetPlayer.gx + pDir.dx,
            targetPlayer.gy + pDir.dy,
            null,
            400
          );
          playerSpace = pFront.count;
        }
        // Only panic if THIS AI is sealed in a tight box or smaller room than the player!
        if (maxRawSpace < 145 || maxRawSpace < playerSpace * 0.85) {
          cycle.panicking = true;
          cycle.boosting = true;
          cycle.boostEnergy = 100;
          if (!cycle.hasPanicked) {
            cycle.hasPanicked = true;
            spawnCallout(
              cycle.gx * CELL + CELL / 2,
              cycle.gy * CELL - 10,
              pickRandom(PANIC_CALLOUTS),
              cycle.color
            );
          }
        }
      } else if (cycle.panicking && anyReachesTarget && maxRawSpace > 220) {
        // A Ribbon Slash prism reopened the cage!
        cycle.panicking = false;
      }
    }

    // Panicking AI charges wall-to-wall at high speed instead of lawnmowering every pixel
    if (cycle.panicking) {
      cycle.boosting = true;
      cycle.boostEnergy = 100;
      const straightOpt = options.find((o) => o.dirKey === currentDir);
      if (straightOpt && straightOpt.clearance > 2) {
        return; // Slam straight across the cage until right before the wall!
      }
      // Forced to ricochet at the wall — pick wildly among available turns
      const turnOpts = options.filter((o) => o.dirKey !== currentDir);
      const chosen = turnOpts.length > 0 ? pickRandom(turnOpts) : options[0];
      if (chosen.dirKey !== currentDir) {
        cycle.dir = chosen.dirKey;
        audio.playTurn(DIRS[chosen.dirKey].index, false);
      }
      return;
    }

    // --- #2: HUMAN TURN COMMITMENT COOLDOWN ---
    const straightOption = options.find((o) => o.dirKey === currentDir);
    if (cycle.turnCooldownCells > 0 && straightOption && straightOption.clearance >= 2) {
      return;
    }

    let bestDir = currentDir;
    let bestScore = -Infinity;

    for (const opt of options) {
      const { dirKey, nx, ny, perceivedSpace, clearance } = opt;

      // Base survival score capped by stage vision so early rivals fall for traps
      let score = perceivedSpace * 2.2 + clearance * 1.6;

      // Avoid hugging lethal perimeter on 1-cell margin unless needed
      if (nx <= 2 || nx >= COLS - 3 || ny <= 2 || ny >= ROWS - 3) {
        score -= 18;
      }

      // Personality-based tactical modifiers
      if (cycle.aiStyle === 'architect') {
        if (dirKey === currentDir && clearance > 6) {
          score += 34;
        }
      } else if (cycle.aiStyle === 'hunter' && targetPlayer) {
        const pDir = DIRS[targetPlayer.dir];
        const aimX = targetPlayer.gx + pDir.dx * 9;
        const aimY = targetPlayer.gy + pDir.dy * 9;
        const distBefore = Math.hypot(aimX - cycle.gx, aimY - cycle.gy);
        const distAfter = Math.hypot(aimX - nx, aimY - ny);
        if (distAfter < distBefore && perceivedSpace >= tier.visionCap * 0.65) {
          score += tier.huntWeight;
        }
        if (dirKey === currentDir && clearance > 4) {
          score += 14;
        }
      }

      // Subtle attraction toward spawned power-up prisms if chamber feels open
      if (state.prisms.length > 0 && perceivedSpace >= tier.visionCap * 0.7) {
        const prism = state.prisms[0];
        const dNow = Math.hypot(prism.gx - cycle.gx, prism.gy - cycle.gy);
        const dNext = Math.hypot(prism.gx - nx, prism.gy - ny);
        if (dNext < dNow) score += 14;
      }

      // Stage-scaled swagger/imperfection noise
      score += Math.random() * tier.noise;

      if (score > bestScore) {
        bestScore = score;
        bestDir = dirKey;
      }
    }

    if (bestDir !== currentDir) {
      cycle.dir = bestDir;
      cycle.turnCooldownCells = tier.turnLock;
      audio.playTurn(DIRS[bestDir].index, false);
    }

    // AI Tactical Overdrive Boost (committed burst instead of 1-frame flicker)
    if (cycle.aiBoostTicks > 0) {
      cycle.aiBoostTicks--;
      const frontClear = raycastClearance(cycle.gx, cycle.gy, cycle.dir, 8);
      if (frontClear <= 4 || cycle.boostEnergy < 18) {
        cycle.aiBoostTicks = 0;
        cycle.boosting = false;
      } else {
        cycle.boosting = true;
      }
    } else if (cycle.boostEnergy > 45 && targetPlayer) {
      const dist = Math.hypot(targetPlayer.gx - cycle.gx, targetPlayer.gy - cycle.gy);
      const frontClear = raycastClearance(cycle.gx, cycle.gy, cycle.dir, 20);
      if (dist < 22 && frontClear > 11 && Math.random() < tier.boostChance) {
        cycle.aiBoostTicks = 9;
        cycle.boosting = true;
      } else {
        cycle.boosting = false;
      }
    } else {
      cycle.boosting = false;
    }
  }

  // --- POWER-UP PRISMS ---
  function spawnPrism() {
    if (state.prisms.length >= 2) return;
    for (let attempt = 0; attempt < 25; attempt++) {
      const gx = 10 + Math.floor(Math.random() * (COLS - 20));
      const gy = 10 + Math.floor(Math.random() * (ROWS - 20));
      if (!isCellBlocked(gx, gy)) {
        const types = ['overdrive', 'slash', 'chrono'];
        const type = types[Math.floor(Math.random() * types.length)];
        state.prisms.push({ gx, gy, type, pulse: 0 });
        break;
      }
    }
  }

  function activatePrism(cycle, prism) {
    audio.playPrismPickup();
    const px = prism.gx * CELL + CELL / 2;
    const py = prism.gy * CELL + CELL / 2;

    if (prism.type === 'overdrive') {
      cycle.boostEnergy = 100;
      if (cycle.id === 0 && state.phase === 'playing') {
        state.score += Math.round(500 * state.styleMult);
      }
      spawnCallout(px, py, 'MAX OVERDRIVE!', '#ffd166');
      spawnBurstParticles(px, py, '#ffd166', 26);
    } else if (prism.type === 'slash') {
      // Vaporize oldest 40% of ALL active trails!
      for (const c of state.cycles) {
        const cutCount = Math.floor(c.cells.length * 0.42);
        if (cutCount > 3) {
          const removed = c.cells.splice(0, cutCount);
          for (let i = 0; i < removed.length; i += 6) {
            spawnBurstParticles(
              removed[i].gx * CELL + 4,
              removed[i].gy * CELL + 4,
              c.color,
              2
            );
          }
        }
      }
      clearGridAndRebuild();
      if (cycle.id === 0 && state.phase === 'playing') {
        state.score += Math.round(750 * state.styleMult);
      }
      spawnCallout(px, py, 'RIBBON SLASH!', '#ff1755');
      if (vfxEnabled) state.shakePower = Math.max(state.shakePower, 6);
    } else if (prism.type === 'chrono') {
      if (cycle.id === 0) {
        state.chronoTimer = 3.2;
        state.score += Math.round(600 * state.styleMult);
        spawnCallout(px, py, 'CHRONO VOGUE!', '#00f5d4');
      } else {
        cycle.boostEnergy = Math.min(100, cycle.boostEnergy + 60);
        spawnCallout(px, py, 'CHROME SURGE!', cycle.color);
      }
      spawnBurstParticles(px, py, '#00f5d4', 28);
    }
  }

  // --- PARTICLES & CALLOUTS ---
  function spawnBurstParticles(x, y, color, count = 40) {
    const cap = vfxEnabled ? count : Math.min(14, Math.ceil(count * 0.35));
    for (let i = 0; i < cap; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 290;
      const shapes = ['tri', 'slash', 'dot'];
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        color: i % 5 === 0 ? '#faf6f0' : color,
        shape: shapes[i % shapes.length],
        life: 0.45 + Math.random() * 0.55,
        maxLife: 1.0,
      });
    }
  }

  function spawnCallout(x, y, text, color = '#faf6f0') {
    const clampedX = Math.max(85, Math.min(WIDTH - 85, x));
    const clampedY = Math.max(40, Math.min(HEIGHT - 30, y));
    state.callouts.push({
      x: clampedX,
      y: clampedY,
      text,
      color,
      life: 1.05,
      maxLife: 1.05,
    });
  }

  // --- RAZOR GRAZE CHECK ---
  function checkRazorGraze(cycle) {
    if (cycle.id !== 0 || state.phase !== 'playing') return;
    // Check orthogonal lateral cells (left & right of travel vector) within 1-2 cells
    const { dx, dy } = DIRS[cycle.dir];
    const perpX = -dy;
    const perpY = dx;

    let grazed = false;
    for (const side of [-1, 1]) {
      for (const dist of [1, 2]) {
        const cx = cycle.gx + perpX * side * dist;
        const cy = cycle.gy + perpY * side * dist;
        if (cx <= 0 || cx >= COLS - 1 || cy <= 0 || cy >= ROWS - 1) {
          if (dist === 1) grazed = true;
        } else {
          const occupant = state.grid[cy * COLS + cx];
          // Graze counts against ANY wall (enemy trail, or old segment of own trail > 10 steps ago)
          if (occupant !== 0) {
            if (occupant !== cycle.id + 1) {
              grazed = true;
            } else if (cycle.cells.length > 14) {
              // Ensure it's not the immediate neck right behind us
              grazed = true;
            }
          }
        }
      }
    }

    if (grazed) {
      cycle.boostEnergy = Math.min(100, cycle.boostEnergy + 3.2);
      state.score += Math.round(28 * state.styleMult);
      state.styleMult = Math.min(8.0, +(state.styleMult + 0.1).toFixed(1));

      if (cycle.grazeCooldown <= 0) {
        cycle.grazeCooldown = 0.22;
        state.grazes++;
        audio.playGraze();

        const px = cycle.gx * CELL + CELL / 2;
        const py = cycle.gy * CELL + CELL / 2;
        spawnBurstParticles(px, py, '#ffd166', 6);

        if (state.grazes % 4 === 1) {
          spawnCallout(px, py - 12, pickRandom(GRAZE_CALLOUTS), '#ffd166');
        }
      }
    }
  }

  // --- DEREZ CRASH ---
  function derezCycle(cycle) {
    if (!cycle.alive) return;
    cycle.alive = false;
    cycle.boosting = false;

    const px = cycle.gx * CELL + CELL / 2;
    const py = cycle.gy * CELL + CELL / 2;

    if (state.phase === 'playing') {
      audio.playDerez();
      state.hitStopTimer = 0.11; // Crisp arcade impact freeze!
      if (vfxEnabled) {
        state.shakePower = 13;
        state.slashFlash = {
          x: px,
          y: py,
          angle: -0.55 + Math.random() * 0.4,
          color: cycle.color,
          timer: 0.28,
        };
      }
      if (cycle.id !== 0 && state.cycles[0]?.alive) {
        state.score += Math.round(1500 * state.styleMult);
        spawnCallout(px, py, 'DEREZZED!', cycle.color);
      } else if (cycle.id === 0) {
        state.styleMult = 1.0;
        spawnCallout(px, py, 'FATAL CLASH!', '#ff1755');
      }
    }

    state.scorchMarks.push({ x: px, y: py, color: cycle.color });
    spawnBurstParticles(px, py, cycle.color, 78);
  }

  // --- ADVANCE SINGLE CYCLE 1 GRID CELL ---
  function advanceCycleOneCell(cycle) {
    if (!cycle.alive) return null;

    cycle.prevGx = cycle.gx;
    cycle.prevGy = cycle.gy;

    if (cycle.isAI) {
      runAIDecision(cycle);
    } else if (cycle.turnQueue.length > 0) {
      const nextDir = cycle.turnQueue.shift();
      if (nextDir !== DIRS[cycle.dir].opposite && nextDir !== cycle.dir) {
        cycle.dir = nextDir;
        audio.playTurn(DIRS[nextDir].index, true);
      }
    }

    if (cycle.boosting) {
      cycle.afterimages.push({
        x: cycle.gx * CELL + CELL / 2,
        y: cycle.gy * CELL + CELL / 2,
        angle: DIRS[cycle.dir].angle,
        life: 0.18,
        color: cycle.color,
      });
    }

    const { dx, dy } = DIRS[cycle.dir];
    const nx = cycle.gx + dx;
    const ny = cycle.gy + dy;

    return { cycle, nx, ny };
  }

  // --- ROUND RESOLUTION ---
  function checkRoundEnd() {
    const aliveCycles = state.cycles.filter((c) => c.alive);

    if (state.phase === 'attract') {
      if (aliveCycles.length <= 1) {
        setupCyclesForCurrentMode(true);
      }
      return;
    }

    if (aliveCycles.length > 1) return;

    // Someone won (or simultaneous head-on draw!)
    updateHighScore(state.score);
    audio.setTurboState(false);

    const winner = aliveCycles[0] || null;

    if (state.mode === 'versus') {
      if (!winner) {
        showStagePoster({
          kicker: 'SIMULTANEOUS IMPACT // DRAW',
          headline: 'MUTUAL DEREZ',
          copy: 'Both riders vaporized on the exact same microsecond. Chic, symmetrical, and totally pointless.',
          cta: 'Re-Rack Round',
          phase: 'roundEnd',
        });
      } else if (winner.id === 0) {
        state.p1Wins++;
        audio.playRoundWin();
        if (state.p1Wins >= WINS_TO_CLAIM_MATCH) {
          showStagePoster({
            kicker: '2P COUCH CHAMPION',
            headline: 'PLAYER 01 OWNS THE SALON',
            copy: `Final tally ${state.p1Wins}–${state.rivalWins}. Player 02 owes you a cassette tape and an espresso.`,
            cta: 'New 2P Match',
            phase: 'matchEnd',
          });
        } else {
          showStagePoster({
            kicker: `ROUND SECURED // ${state.p1Wins} – ${state.rivalWins}`,
            headline: 'TEAL CUTS DEEP',
            copy: 'Player 01 boxed out the grid. Ready for the next drop?',
            cta: 'Next Round [ENTER]',
            phase: 'roundEnd',
          });
        }
      } else {
        state.rivalWins++;
        if (state.rivalWins >= WINS_TO_CLAIM_MATCH) {
          showStagePoster({
            kicker: '2P COUCH CHAMPION',
            headline: 'PLAYER 02 REIGNS IN CRIMSON',
            copy: `Final tally ${state.rivalWins}–${state.p1Wins}. Teal has been permanently uninvited from the VIP lounge.`,
            cta: 'New 2P Match',
            phase: 'matchEnd',
          });
        } else {
          showStagePoster({
            kicker: `ROUND SECURED // ${state.p1Wins} – ${state.rivalWins}`,
            headline: 'CRIMSON STRIKES BACK',
            copy: 'Player 02 carved the cleaner line. Step back up.',
            cta: 'Next Round [ENTER]',
            phase: 'roundEnd',
          });
        }
      }
      syncDossierUI();
      return;
    }

    if (state.mode === 'chaos') {
      if (winner && winner.id === 0) {
        state.p1Wins++;
        state.chaosWave++;
        state.score += 2500 * state.chaosWave;
        updateHighScore(state.score);
        audio.playRoundWin();
        rivalQuoteEl.textContent = '“Three hunters derezzed and not a crease in your jacket? Unbelievable.”';
        showStagePoster({
          kicker: `CHAOS WAVE CLEARED // NEXT: WAVE 0${state.chaosWave}`,
          headline: 'SOLE SURVIVOR',
          copy: `All three syndicate bikes shattered. Score: ${Math.floor(state.score).toLocaleString()}. Ready for a faster pack?`,
          cta: `Launch Wave 0${state.chaosWave}`,
          phase: 'roundEnd',
        });
      } else {
        rivalQuoteEl.textContent = '“Three neon ribbons, zero escape routes. Better luck next season.”';
        showStagePoster({
          kicker: `PACK OVERWHELMED YOU AT WAVE 0${state.chaosWave}`,
          headline: 'SWARMED IN NEON',
          copy: `Final Score: ${Math.floor(state.score).toLocaleString()} across ${state.grazes} Razor Grazes.`,
          cta: 'Restart Chaos Run',
          phase: 'matchEnd',
        });
      }
      syncDossierUI();
      return;
    }

    // 1P CIRCUIT MODE
    const rival = RIVALS[state.circuitStage];
    if (!winner) {
      rivalQuoteEl.textContent = '“A head-on collision?! How terribly unrefined!”';
      showStagePoster({
        kicker: 'HEAD-ON COLLISION // NO CONTEST',
        headline: 'DOUBLE SHATTER',
        copy: 'You slammed visors at full speed. Nobody scores on a tie.',
        cta: 'Replay Round',
        phase: 'roundEnd',
      });
    } else if (winner.id === 0) {
      state.p1Wins++;
      state.score += Math.round(2000 * (state.circuitStage + 1) * state.styleMult);
      updateHighScore(state.score);
      audio.playRoundWin();
      rivalQuoteEl.textContent = pickRandom(rival.quotesLose);

      if (state.p1Wins >= WINS_TO_CLAIM_MATCH) {
        if (state.circuitStage < RIVALS.length - 1) {
          // Advance to next Nagel Rival!
          const defeatedName = rival.name;
          state.circuitStage++;
          state.p1Wins = 0;
          state.rivalWins = 0;
          const nextRival = RIVALS[state.circuitStage];
          syncDossierUI();
          rivalQuoteEl.textContent = pickRandom(nextRival.quotesStart);
          showStagePoster({
            kicker: `STAGE CLEARED // ENTERING ${nextRival.sectorName}`,
            headline: `NEXT RIVAL: ${nextRival.name}`,
            copy: `${defeatedName} has been erased from the gallery. ${nextRival.sub} steps onto the grid.`,
            cta: 'Challenge Next Rival',
            phase: 'roundEnd',
          });
        } else {
          // Beat the entire 1984 Nagel Circuit!
          showStagePoster({
            kicker: '1984 GRAND CIRCUIT CHAMPION',
            headline: 'SOVEREIGN OF THE SERIGRAPH GRID',
            copy: `Valerie, Dante, and the Salon Syndicate lie shattered in neon dust. Final Score: ${Math.floor(state.score).toLocaleString()}.`,
            cta: 'Defend Your Crown',
            phase: 'matchEnd',
          });
        }
      } else {
        showStagePoster({
          kicker: `ROUND WON // MATCH ${state.p1Wins} – ${state.rivalWins}`,
          headline: 'CLEAN GEOMETRIC KILL',
          copy: `${rival.name} walked straight into your teal wake. ${WINS_TO_CLAIM_MATCH - state.p1Wins} more to take the stage.`,
          cta: 'Next Round [ENTER]',
          phase: 'roundEnd',
        });
      }
    } else {
      state.rivalWins++;
      rivalQuoteEl.textContent = pickRandom(rival.quotesWin);
      if (state.rivalWins >= WINS_TO_CLAIM_MATCH) {
        showStagePoster({
          kicker: `DEFEATED BY ${rival.name}`,
          headline: 'FRAMED & DEREZZED',
          copy: `Match lost ${state.p1Wins}–${state.rivalWins}. Final Score: ${Math.floor(state.score).toLocaleString()}. Care to touch up your lipstick and try again?`,
          cta: 'Restart Circuit',
          phase: 'matchEnd',
        });
      } else {
        showStagePoster({
          kicker: `ROUND LOST // MATCH ${state.p1Wins} – ${state.rivalWins}`,
          headline: 'BOXED IN NEON',
          copy: `${rival.name} cut off your oxygen. Keep your cool and skim walls to build Overdrive.`,
          cta: 'Next Round [ENTER]',
          phase: 'roundEnd',
        });
      }
    }
    syncDossierUI();
  }

  function showStagePoster({ kicker, headline, copy, cta, phase }) {
    state.phase = phase;
    audio.setMuffled(true);
    overlayKicker.textContent = kicker;
    overlayHeadline.textContent = headline;
    overlayCopy.textContent = copy;
    startBtn.textContent = cta;
    stageOverlay.hidden = false;
  }

  function startPlayableRound() {
    if (audio.enabled) {
      audio.init();
      if (audio.musicEnabled) {
        audio.startMusic();
      }
      audio.setMuffled(false);
    }

    if (state.phase === 'matchEnd' || state.phase === 'attract') {
      state.p1Wins = 0;
      state.rivalWins = 0;
      state.score = 0;
      state.styleMult = 1.0;
      state.grazes = 0;
      if (state.mode === 'circuit') state.circuitStage = 0;
      if (state.mode === 'chaos') state.chaosWave = 1;
    }

    setupCyclesForCurrentMode(false);
    if (state.mode === 'circuit') {
      rivalQuoteEl.textContent = pickRandom(RIVALS[state.circuitStage].quotesStart);
    }

    stageOverlay.hidden = true;
    state.phase = 'countdown';
    state.countdownTimer = 2.35;
    state.lastCountdownInt = 4;
  }

  // --- INPUT CONTROLS ---
  function syncHumanBoostFlags() {
    if (state.phase !== 'playing') return;
    const p1 = state.cycles[0];
    if (p1 && !p1.isAI) {
      const wantBoost = p1.controlScheme === 'both'
        ? keysHeld.has('Space') || keysHeld.has('ShiftLeft') || keysHeld.has('ShiftRight') || touchBoostActive
        : keysHeld.has('Space') || touchBoostActive;
      p1.boosting = wantBoost && p1.boostEnergy > 4;
      audio.setTurboState(p1.boosting);
    }

    const p2 = state.cycles[1];
    if (p2 && !p2.isAI && p2.controlScheme === 'p2') {
      const wantBoost2 = keysHeld.has('ShiftRight') || keysHeld.has('ShiftLeft') || keysHeld.has('Enter');
      p2.boosting = wantBoost2 && p2.boostEnergy > 4;
    }
  }

  window.addEventListener('keydown', (e) => {
    if (manualDialog && manualDialog.open) return;

    // Quick start from overlay with Enter or Space
    if (!stageOverlay.hidden && (e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault();
      startPlayableRound();
      return;
    }

    if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
      if (state.phase === 'playing' || state.phase === 'countdown') {
        state.resumePhase = state.phase;
        state.phase = 'paused';
        audio.setMuffled(true);
        audio.setTurboState(false);
      } else if (state.phase === 'paused') {
        state.phase = state.resumePhase || 'playing';
        audio.setMuffled(false);
      }
      return;
    }

    if (e.code === 'KeyM') {
      handleAudioToggle();
      return;
    }

    keysHeld.add(e.code);

    const p1 = state.cycles[0];
    const p2 = state.cycles[1];

    // Prevent page scroll on arrow keys & space during active rounds
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (state.phase === 'playing' || state.phase === 'countdown') {
      // WASD always steers P1
      const wasdMap = { KeyW: 'up', KeyD: 'right', KeyS: 'down', KeyA: 'left' };
      const arrowMap = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };

      if (wasdMap[e.code] && p1 && !p1.isAI) {
        queueTurn(p1, wasdMap[e.code]);
      }

      if (arrowMap[e.code]) {
        if (state.mode === 'versus' && p2 && !p2.isAI) {
          queueTurn(p2, arrowMap[e.code]);
        } else if (p1 && !p1.isAI) {
          queueTurn(p1, arrowMap[e.code]);
        }
      }
    }

    syncHumanBoostFlags();
  });

  window.addEventListener('keyup', (e) => {
    keysHeld.delete(e.code);
    syncHumanBoostFlags();
  });

  // Touch D-Pad & Overdrive Listeners
  dpadBtns.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const dir = btn.dataset.dir;
      const p1 = state.cycles[0];
      if (dir && p1 && !p1.isAI && (state.phase === 'playing' || state.phase === 'countdown')) {
        queueTurn(p1, dir);
      }
    });
  });

  if (touchBoostBtn) {
    const endTouchBoost = () => {
      touchBoostActive = false;
      syncHumanBoostFlags();
    };
    touchBoostBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchBoostActive = true;
      syncHumanBoostFlags();
    });
    touchBoostBtn.addEventListener('pointerup', endTouchBoost);
    touchBoostBtn.addEventListener('pointercancel', endTouchBoost);
    touchBoostBtn.addEventListener('pointerleave', endTouchBoost);
  }

  // Toolbar Buttons
  startBtn.addEventListener('click', () => startPlayableRound());

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextMode = btn.dataset.mode;
      if (!nextMode || nextMode === state.mode) return;
      state.mode = nextMode;
      modeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      state.p1Wins = 0;
      state.rivalWins = 0;
      state.score = 0;
      state.styleMult = 1.0;
      state.grazes = 0;
      state.circuitStage = 0;
      state.chaosWave = 1;

      syncDossierUI();
      setupCyclesForCurrentMode(true);
      showStagePoster({
        kicker:
          nextMode === 'versus'
            ? 'LOCAL PVP // SAME KEYBOARD'
            : nextMode === 'chaos'
              ? 'ENDLESS 4-CYCLE SURVIVAL'
              : 'EDITION 1984 // 1P RIVAL CIRCUIT',
        headline:
          nextMode === 'versus'
            ? '2P COUCH DUEL'
            : nextMode === 'chaos'
              ? 'FOUR BIKES, ZERO BRAKES'
              : 'SILK, LIPSTICK & LETHAL LIGHT',
        copy:
          nextMode === 'versus'
            ? 'Player 1 rides WASD + Space. Player 2 rides Arrow Keys + Shift/Enter. First to 3 wins claims bragging rights.'
            : nextMode === 'chaos'
              ? 'Face three simultaneous Nagel cyber-hunters in escalating speed waves. Grab prisms and carve breathing room.'
              : 'Duel Valerie, Dante, and the Salon Syndicate across three serigraph sectors. First to 3 wins advances.',
        cta: 'Insert Coin // Ride',
        phase: 'attract',
      });
    });
  });

  audioBtn.addEventListener('click', () => {
    handleAudioToggle();
  });

  crtBtn.addEventListener('click', () => {
    vfxEnabled = !vfxEnabled;
    document.body.dataset.crt = vfxEnabled ? 'on' : 'off';
    crtBtn.setAttribute('aria-pressed', String(vfxEnabled));
    crtBtn.textContent = `CRT + VFX: ${vfxEnabled ? 'ON' : 'OFF'}`;
    if (!vfxEnabled) {
      state.shakePower = 0;
      arenaMat.style.transform = '';
    }
  });

  // --- MAIN UPDATE STEP ---
  function update(dt) {
    // Update particles & floating callouts regardless of hit-stop
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.rot += p.vRot * dt;
    }

    for (let i = state.callouts.length - 1; i >= 0; i--) {
      const c = state.callouts[i];
      c.life -= dt;
      c.y -= 26 * dt;
      if (c.life <= 0) state.callouts.splice(i, 1);
    }

    for (const c of state.cycles) {
      for (let i = c.afterimages.length - 1; i >= 0; i--) {
        c.afterimages[i].life -= dt;
        if (c.afterimages[i].life <= 0) c.afterimages.splice(i, 1);
      }
      if (c.grazeCooldown > 0) c.grazeCooldown -= dt;
    }

    if (state.slashFlash) {
      state.slashFlash.timer -= dt;
      if (state.slashFlash.timer <= 0) state.slashFlash = null;
    }

    if (state.shakePower > 0) {
      state.shakePower = Math.max(0, state.shakePower - dt * 36);
      if (vfxEnabled && state.shakePower > 0.2) {
        const sx = (Math.random() - 0.5) * state.shakePower * 1.4;
        const sy = (Math.random() - 0.5) * state.shakePower * 1.4;
        arenaMat.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      } else {
        arenaMat.style.transform = '';
      }
    }

    if (state.hitStopTimer > 0) {
      state.hitStopTimer -= dt;
      return;
    }

    if (state.phase === 'paused' || state.phase === 'roundEnd' || state.phase === 'matchEnd') {
      return;
    }

    if (state.phase === 'countdown') {
      state.countdownTimer -= dt;
      const ceilVal = Math.ceil(state.countdownTimer * 1.25);
      if (ceilVal < state.lastCountdownInt && ceilVal >= 1) {
        state.lastCountdownInt = ceilVal;
        audio.playCountdownBeep(false);
      }
      if (state.countdownTimer <= 0) {
        state.phase = 'playing';
        audio.playCountdownBeep(true);
        syncHumanBoostFlags();
      }
      updateRealtimeMeters();
      return;
    }

    // Active simulation ('playing' or 'attract')
    if (state.chronoTimer > 0) {
      state.chronoTimer = Math.max(0, state.chronoTimer - dt);
    }

    // Spawn geometric power-up prisms periodically
    state.prismSpawnTimer -= dt;
    if (state.prismSpawnTimer <= 0) {
      spawnPrism();
      state.prismSpawnTimer = 5.5 + Math.random() * 3.5;
    }
    for (const pr of state.prisms) {
      pr.pulse += dt * 4.5;
    }

    // Passive survival score & gentle style decay
    if (state.phase === 'playing') {
      state.score += dt * 45 * state.styleMult;
    }

    // Speed wave scaling in Chaos / late Circuit
    const waveSpeedScale = state.mode === 'chaos'
      ? 1 + Math.min(0.38, (state.chaosWave - 1) * 0.06)
      : state.mode === 'circuit'
        ? 1 + state.circuitStage * 0.05
        : 1;

    const pendingByTick = true;

    for (const cycle of state.cycles) {
      if (!cycle.alive) continue;

      // Drain or trickle-recharge Overdrive (panicking bikes stay pinned at full throttle!)
      if (cycle.panicking) {
        cycle.boostEnergy = 100;
        cycle.boosting = true;
      } else if (cycle.boosting && cycle.boostEnergy > 0) {
        cycle.boostEnergy = Math.max(0, cycle.boostEnergy - dt * 38);
        if (cycle.boostEnergy <= 0) {
          cycle.boosting = false;
          if (cycle.id === 0) audio.setTurboState(false);
        }
      } else {
        cycle.boostEnergy = Math.min(100, cycle.boostEnergy + dt * 7.5);
      }

      cycle.stepAccum += dt;
    }

    // Resolve discrete grid steps in clean synchronized sub-ticks (up to 3 per frame)
    let anyMoved = false;
    for (let subTick = 0; subTick < 3 && pendingByTick; subTick++) {
      const batchMoves = [];

      for (const cycle of state.cycles) {
        if (!cycle.alive) continue;
        const speedBoost = cycle.panicking
          ? PANIC_MULTIPLIER
          : cycle.boosting
            ? BOOST_MULTIPLIER
            : 1;
        let mult = waveSpeedScale * speedBoost;
        if (state.chronoTimer > 0 && cycle.id !== 0 && !cycle.panicking) {
          mult *= 0.48; // Chrono prism slows enemy cycles!
        }
        const stepInterval = BASE_STEP_SEC / mult;

        if (cycle.stepAccum >= stepInterval) {
          cycle.stepAccum -= stepInterval;
          // Clamp excess lag accumulation
          if (cycle.stepAccum > stepInterval * 2) {
            cycle.stepAccum = stepInterval * 2;
          }
          const move = advanceCycleOneCell(cycle);
          if (move) batchMoves.push(move);
        }
      }

      if (batchMoves.length === 0) break;
      anyMoved = true;

      const destCounts = new Map();
      for (const m of batchMoves) {
        const key = `${m.nx},${m.ny}`;
        destCounts.set(key, (destCounts.get(key) || 0) + 1);
      }

      const crashed = new Set();
      for (const m of batchMoves) {
        const key = `${m.nx},${m.ny}`;
        if (isCellBlocked(m.nx, m.ny) || destCounts.get(key) > 1) {
          crashed.add(m.cycle);
        }
      }

      for (const m of batchMoves) {
        m.cycle.gx = m.nx;
        m.cycle.gy = m.ny;
        if (crashed.has(m.cycle)) continue;

        m.cycle.cells.push({ gx: m.nx, gy: m.ny });
        state.grid[m.ny * COLS + m.nx] = m.cycle.id + 1;

        for (let pi = state.prisms.length - 1; pi >= 0; pi--) {
          const pr = state.prisms[pi];
          if (Math.abs(pr.gx - m.nx) <= 1 && Math.abs(pr.gy - m.ny) <= 1) {
            state.prisms.splice(pi, 1);
            activatePrism(m.cycle, pr);
          }
        }

        checkRazorGraze(m.cycle);
      }

      for (const deadCycle of crashed) {
        derezCycle(deadCycle);
      }

      if (crashed.size > 0) {
        checkRoundEnd();
        if (state.phase !== 'playing' && state.phase !== 'attract') break;
      }
    }

    if (anyMoved) {
      checkRoundEnd();
    }

    updateRealtimeMeters();
  }

  // --- 2D NAGEL × CYBERPUNK CANVAS RENDERER ---
  function drawTrailRibbon(cycle) {
    const pts = cycle.cells;
    if (pts.length < 2) return;

    // Build contiguous polyline sub-paths (handles any gaps smoothly)
    const buildPath = (offsetX = 0, offsetY = 0) => {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < pts.length; i++) {
        const px = pts[i].gx * CELL + CELL / 2 + offsetX;
        const py = pts[i].gy * CELL + CELL / 2 + offsetY;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          const prev = pts[i - 1];
          const manhattan = Math.abs(pts[i].gx - prev.gx) + Math.abs(pts[i].gy - prev.gy);
          if (manhattan > 1) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
    };

    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';

    // 1. Stark Patrick Nagel black serigraph ink shadow offset
    ctx.strokeStyle = '#040208';
    ctx.lineWidth = 8;
    buildPath(3, 3);
    ctx.stroke();

    // 2. Outer cyberpunk neon bloom
    ctx.save();
    ctx.strokeStyle = cycle.color;
    ctx.lineWidth = 7;
    if (vfxEnabled) {
      ctx.shadowColor = cycle.color;
      ctx.shadowBlur = cycle.boosting ? 20 : 12;
    }
    buildPath(0, 0);
    ctx.stroke();
    ctx.restore();

    // 3. Porcelain-white hot laser core
    ctx.strokeStyle = '#faf6f0';
    ctx.lineWidth = 2.2;
    buildPath(0, 0);
    ctx.stroke();
  }

  function drawTopDownLightCycle(cycle) {
    if (!cycle.alive) return;

    // Draw boost afterimages
    for (const ghost of cycle.afterimages) {
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.angle);
      ctx.globalAlpha = Math.max(0, ghost.life * 3.2);
      ctx.fillStyle = ghost.color;
      ctx.fillRect(-11, -5, 22, 10);
      ctx.restore();
    }

    const x = cycle.gx * CELL + CELL / 2;
    const y = cycle.gy * CELL + CELL / 2;
    const angle = DIRS[cycle.dir].angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Thruster flame cone
    const flameLen = cycle.boosting ? 18 + Math.random() * 10 : 8 + Math.random() * 4;
    ctx.fillStyle = cycle.boosting ? '#ffd166' : cycle.color;
    ctx.beginPath();
    ctx.moveTo(-9, -3.5);
    ctx.lineTo(-9 - flameLen, 0);
    ctx.lineTo(-9, 3.5);
    ctx.closePath();
    ctx.fill();

    // Hard ink silhouette outline (2D Kaneda/Tron sleek light-cycle fairing)
    ctx.fillStyle = '#090710';
    ctx.strokeStyle = '#faf6f0';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(13, 0);       // Razor nose cone
    ctx.lineTo(5, -6.5);     // Front fender flare
    ctx.lineTo(-9, -6);      // Rear cowling
    ctx.lineTo(-11, -3);
    ctx.lineTo(-11, 3);
    ctx.lineTo(-9, 6);
    ctx.lineTo(5, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Signature neon wheel-well / fairing stripes
    ctx.fillStyle = cycle.color;
    ctx.fillRect(-7, -4.5, 13, 2.2);
    ctx.fillRect(-7, 2.3, 13, 2.2);

    // Glossy Nagel visor canopy
    ctx.fillStyle = '#faf6f0';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(1, -2.6);
    ctx.lineTo(-3, -2.2);
    ctx.lineTo(-3, 2.2);
    ctx.lineTo(1, 2.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawPrisms() {
    for (const pr of state.prisms) {
      const x = pr.gx * CELL + CELL / 2;
      const y = pr.gy * CELL + CELL / 2;
      const scale = 1 + Math.sin(pr.pulse) * 0.16;

      let fill = '#ffd166';
      let label = '⚡';
      if (pr.type === 'slash') {
        fill = '#ff1755';
        label = '✂';
      } else if (pr.type === 'chrono') {
        fill = '#00f5d4';
        label = '⧗';
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Rotating outer geometric Nagel diamond
      ctx.save();
      ctx.rotate(pr.pulse * 0.5);
      ctx.fillStyle = '#090710';
      ctx.strokeStyle = fill;
      ctx.lineWidth = 2.5;
      if (vfxEnabled) {
        ctx.shadowColor = fill;
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#faf6f0';
      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0.5);
      ctx.restore();
    }
  }

  function render() {
    // 1. Cached serigraph geometric grid
    ctx.drawImage(bgCanvas, 0, 0);

    // 2. Chrono Time-Dilation tint
    if (state.chronoTimer > 0) {
      ctx.fillStyle = 'rgba(0, 245, 212, 0.08)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // 3. Scorch decals from derezzed bikes
    for (const sc of state.scorchMarks) {
      ctx.save();
      ctx.strokeStyle = sc.color;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sc.x - 24, sc.y - 12);
      ctx.lineTo(sc.x + 24, sc.y + 12);
      ctx.moveTo(sc.x - 14, sc.y + 22);
      ctx.lineTo(sc.x + 14, sc.y - 22);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Power-up Prisms
    drawPrisms();

    // 5. Light Ribbons
    for (const cycle of state.cycles) {
      drawTrailRibbon(cycle);
    }

    // 6. Top-Down Light Cycles
    for (const cycle of state.cycles) {
      drawTopDownLightCycle(cycle);
    }

    // 7. Geometric Shards & Sparks
    for (const p of state.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      ctx.fillStyle = p.color;

      if (p.shape === 'tri') {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.85, p.size);
        ctx.lineTo(-p.size * 0.85, p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'slash') {
        ctx.fillRect(-p.size * 1.4, -1.3, p.size * 2.8, 2.6);
      } else {
        ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
      }
      ctx.restore();
    }

    // 8. Nagel Diagonal Impact Slash Beam (no full-screen strobe)
    if (state.slashFlash) {
      const sf = state.slashFlash;
      ctx.save();
      ctx.translate(sf.x, sf.y);
      ctx.rotate(sf.angle);
      ctx.globalAlpha = Math.min(1, sf.timer * 3.5);
      ctx.fillStyle = '#faf6f0';
      ctx.fillRect(-WIDTH, -5, WIDTH * 2, 10);
      ctx.fillStyle = sf.color;
      ctx.fillRect(-WIDTH, 6, WIDTH * 2, 4);
      ctx.restore();
    }

    // 9. Floating Editorial Style Callouts
    for (const c of state.callouts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, c.life / 0.35);
      ctx.font = 'italic 900 18px "Futura", "Avenir Next Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#090710';
      ctx.fillText(c.text, c.x + 2, c.y + 2);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, c.x, c.y);
      ctx.restore();
    }

    // 10. Countdown & Pause Banner Overlays
    if (state.phase === 'countdown') {
      const num = Math.max(1, Math.ceil(state.countdownTimer * 1.25));
      const label = num >= 4 ? 'READY' : String(num);
      drawBannerBadge(`SECTOR LIVE IN ${label}`, '#00f5d4');
    } else if (state.phase === 'paused') {
      drawBannerBadge('PAUSED // TOUCH UP YOUR LIPSTICK [P]', '#ffd166');
    }
  }

  function drawBannerBadge(text, accentColor) {
    ctx.save();
    const maxBoxW = 468;
    const minBoxW = 340;
    const padX = 44;

    let fontSize = 18;
    ctx.font = `900 ${fontSize}px "Futura", "Avenir Next Condensed", sans-serif`;
    let textW = ctx.measureText(text).width;

    while (textW > maxBoxW - padX && fontSize > 12) {
      fontSize -= 1;
      ctx.font = `900 ${fontSize}px "Futura", "Avenir Next Condensed", sans-serif`;
      textW = ctx.measureText(text).width;
    }

    const boxW = Math.min(maxBoxW, Math.max(minBoxW, Math.ceil(textW + padX)));
    const boxH = 60;
    const bx = (WIDTH - boxW) / 2;
    const by = (HEIGHT - boxH) / 2;

    ctx.fillStyle = accentColor;
    ctx.fillRect(bx + 7, by + 7, boxW, boxH);

    ctx.fillStyle = '#faf6f0';
    ctx.strokeStyle = '#090710';
    ctx.lineWidth = 4;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#090710';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 1, boxW - padX);
    ctx.restore();
  }

  // --- MAIN ANIMATION LOOP ---
  let lastTime = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!document.hidden) {
      update(dt);
      render();
    }
    window.requestAnimationFrame(frame);
  }

  // Boot into live Attract Mode behind the serigraph poster!
  syncDossierUI();
  setupCyclesForCurrentMode(true);
  window.requestAnimationFrame(frame);
})();
