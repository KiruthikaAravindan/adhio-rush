// ── Quiz Questions — 20 total (qi 0-4: Level 1, qi 5-9: Level 2, 10-19: reserve) ──
export const QUIZ_QUESTIONS = [
  { q: 'What does "Forte" (f) mean?',               choices: ['Play loudly',     'Play softly',      'Play quickly'    ], answer: 0 },
  { q: 'How many beats in 4/4 time?',               choices: ['3 beats',         '4 beats',          '6 beats'         ], answer: 1 },
  { q: 'What is the speed of music called?',        choices: ['Pitch',           'Timbre',           'Tempo'           ], answer: 2 },
  { q: 'What does "Piano" (p) mean?',               choices: ['Fast',            'Softly',           'High pitch'      ], answer: 1 },
  { q: 'A full set of tones spanning an octave?',   choices: ['Scale',           'Chord',            'Arpeggio'        ], answer: 0 },
  { q: 'Which instrument has the highest pitch?',   choices: ['Tuba',            'Violin',           'Cello'           ], answer: 1 },
  { q: 'How many strings on a standard violin?',    choices: ['4',               '6',                '3'               ], answer: 0 },
  { q: 'What does a sharp (♯) do to a note?',       choices: ['Raises pitch',    'Lowers pitch',     'Holds note'      ], answer: 0 },
  { q: 'What does "Crescendo" mean?',               choices: ['Getting louder',  'Getting softer',   'Getting faster'  ], answer: 0 },
  { q: 'What does "Staccato" mean?',                choices: ['Smooth/connected','Short & detached', 'Very loud'       ], answer: 1 },
  { q: 'What does "Allegro" mean?',                 choices: ['Slow & calm',     'Fast & lively',    'Very loud'       ], answer: 1 },
  { q: 'Which is a woodwind instrument?',           choices: ['Trumpet',         'Violin',           'Flute'           ], answer: 2 },
  { q: 'What does "Adagio" mean?',                  choices: ['Very fast',       'Very slow',        'Very loud'       ], answer: 1 },
  { q: 'What does "Legato" mean?',                  choices: ['Short notes',     'Smooth/connected', 'Very fast'       ], answer: 1 },
  { q: 'What does "Mezzo forte" (mf) mean?',        choices: ['Very softly',     'Moderately loud',  'Very loudly'     ], answer: 1 },
  { q: 'How many beats in 3/4 time?',               choices: ['4',               '2',                '3'               ], answer: 2 },
  { q: 'What does "Decrescendo" mean?',             choices: ['Getting louder',  'Getting softer',   'Getting faster'  ], answer: 1 },
  { q: 'Which clef is for low instruments?',        choices: ['Treble clef',     'Alto clef',        'Bass clef'       ], answer: 2 },
  { q: 'What is a rest in music?',                  choices: ['A long note',     'A slow tempo',     'Silence'         ], answer: 2 },
  { q: 'What does "pp" (pianissimo) mean?',         choices: ['Moderately soft', 'Very softly',      'Very loudly'     ], answer: 1 },
];

// ── Helper: build a prize box anchored above a platform ──────────────────────
const BOX_W = 36, BOX_H = 36, BOX_GAP = 70;
function mkBox(platforms, hostIdx, qi) {
  const p = platforms[hostIdx];
  return { x: Math.round(p.x + p.w / 2 - BOX_W / 2), y: p.y - BOX_GAP - BOX_H, w: BOX_W, h: BOX_H, hit: false, qi };
}

// ── Level 1 ───────────────────────────────────────────────────────────────────
const L1_PLATFORMS = [
  // Ground
  { x: 0,    y: 400, w: 580, h: 50 },
  { x: 680,  y: 400, w: 520, h: 50 },
  { x: 1300, y: 400, w: 420, h: 50 },
  { x: 1820, y: 400, w: 580, h: 50 },
  { x: 2500, y: 400, w: 750, h: 50 },
  // Floating piano-key platforms [5-19]
  { x: 200,  y: 285, w: 100, h: 18 },
  { x: 380,  y: 245, w: 100, h: 18 },
  { x: 550,  y: 205, w: 130, h: 18 },
  { x: 760,  y: 305, w: 90,  h: 18 },
  { x: 900,  y: 245, w: 90,  h: 18 },
  { x: 1060, y: 185, w: 110, h: 18 },
  { x: 1210, y: 305, w: 80,  h: 18 },
  { x: 1410, y: 265, w: 120, h: 18 },
  { x: 1600, y: 210, w: 90,  h: 18 },
  { x: 1900, y: 305, w: 100, h: 18 },
  { x: 2100, y: 245, w: 110, h: 18 },
  { x: 2310, y: 185, w: 130, h: 18 },
  { x: 2600, y: 305, w: 100, h: 18 },
  { x: 2810, y: 245, w: 90,  h: 18 },
  { x: 3010, y: 185, w: 130, h: 18 },
];

const L1_COIN_DEFS = [
  // Platform notes (fixed so none overflow their piano bar)
  [220,255],[260,255],[280,255],          // above [5]
  [400,215],[440,215],[460,215],          // above [6]
  [565,175],[605,175],[645,175],          // above [7]
  [770,275],[810,275],                    // above [8]
  [910,215],[950,215],                    // above [9]
  [1065,155],[1105,155],[1145,155],       // above [10]
  [1220,275],[1260,275],                  // above [11]
  [1420,235],[1460,235],[1500,235],       // above [12]
  [1610,180],[1650,180],                  // above [13]
  [1915,275],[1955,275],                  // above [14]
  [2110,215],[2150,215],                  // above [15]
  [2320,155],[2360,155],[2400,155],       // above [16]
  [2615,275],[2655,275],                  // above [17]
  [2820,215],[2860,215],                  // above [18]
  [3020,155],[3060,155],[3100,155],       // above [19]
  // Ground-level notes — harder to grab (enemies share the ground)
  [130,375],[330,375],                    // ground [0]
  [730,375],[960,375],                    // ground [1]
  [1360,375],[1560,375],                  // ground [2]
  [1890,375],[2070,375],                  // ground [3]
  [2570,375],[2760,375],[2980,375],       // ground [4]
  // Mid-air notes — float in the gaps between ground segments
  [600,260],[640,260],                    // gap [0]→[1]
  [1225,260],[1265,260],                  // gap [1]→[2]
  [1745,260],[1785,260],                  // gap [2]→[3]
  [2430,260],[2460,260],                  // gap [3]→[4]
];

const L1_ENEMY_DEFS = [
  // ground enemies (y = 400 - 32 = 368)
  [300,  368, 250,  400,  1.0],
  [820,  368, 710,  960,  1.0],
  [1060, 368, 960,  1160, 1.0],
  [1520, 368, 1420, 1600, 1.2],
  [1920, 368, 1840, 2000, 1.0],
  [2220, 368, 2120, 2320, 1.5],
  [2720, 368, 2620, 2820, 1.0],
  [3050, 368, 2950, 3150, 1.2],
  // platform enemies
  [565,  173, 555,  675,  1.0],   // on [7]
  [1065, 153, 1055, 1165, 1.0],   // on [10]
  [2320, 153, 2310, 2440, 1.0],   // on [16]
];

// Prize boxes: platform indices 6, 9, 12, 15, 18 — qi 0-4
const L1_BOX_DEFS = [[6,0],[9,1],[12,2],[15,3],[18,4]];

// ── Level 2 ───────────────────────────────────────────────────────────────────
const L2_PLATFORMS = [
  // Ground [0-5]
  { x: 0,    y: 400, w: 550,  h: 50 },
  { x: 700,  y: 400, w: 480,  h: 50 },
  { x: 1340, y: 400, w: 420,  h: 50 },
  { x: 1940, y: 400, w: 500,  h: 50 },
  { x: 2650, y: 400, w: 480,  h: 50 },
  { x: 3600, y: 400, w: 1100, h: 50 },
  // Stepping stones in wide gaps [6-8]
  { x: 2530, y: 360, w: 90,   h: 18 },   // gap [3]→[4] (2440–2650)
  { x: 3240, y: 360, w: 90,   h: 18 },   // gap [4]→[5] first stone
  { x: 3490, y: 360, w: 90,   h: 18 },   // gap [4]→[5] second stone
  // Floating piano-key platforms [9-26]
  { x: 190,  y: 300, w: 90,   h: 18 },
  { x: 360,  y: 248, w: 100,  h: 18 },   // [10] ← prize box host qi:5
  { x: 540,  y: 190, w: 110,  h: 18 },
  { x: 730,  y: 310, w: 80,   h: 18 },
  { x: 875,  y: 248, w: 90,   h: 18 },   // [13] ← prize box host qi:6
  { x: 1045, y: 183, w: 110,  h: 18 },
  { x: 1370, y: 308, w: 80,   h: 18 },
  { x: 1520, y: 248, w: 95,   h: 18 },
  { x: 1685, y: 183, w: 120,  h: 18 },   // [17] ← prize box host qi:7
  { x: 1975, y: 308, w: 85,   h: 18 },
  { x: 2130, y: 248, w: 95,   h: 18 },
  { x: 2295, y: 183, w: 130,  h: 18 },   // [20] ← prize box host qi:8
  { x: 2680, y: 308, w: 85,   h: 18 },
  { x: 2840, y: 248, w: 95,   h: 18 },
  { x: 3010, y: 183, w: 130,  h: 18 },
  { x: 3640, y: 308, w: 85,   h: 18 },
  { x: 3800, y: 248, w: 95,   h: 18 },   // [25] ← prize box host qi:9
  { x: 3970, y: 183, w: 130,  h: 18 },
];

const L2_COIN_DEFS = [
  // Platform notes (y = platform.y - 30)
  [205,270],[245,270],                    // above [9]
  [375,218],[415,218],                    // above [10]
  [555,160],[595,160],[635,160],          // above [11]
  [745,280],[785,280],                    // above [12]
  [890,218],[930,218],                    // above [13]
  [1060,153],[1100,153],[1140,153],       // above [14]
  [1385,278],[1425,278],                  // above [15]
  [1535,218],[1575,218],                  // above [16]
  [1700,153],[1740,153],[1780,153],       // above [17]
  [1990,278],[2030,278],                  // above [18]
  [2145,218],[2185,218],                  // above [19]
  [2310,153],[2350,153],[2390,153],       // above [20]
  [2695,278],[2735,278],                  // above [21]
  [2855,218],[2895,218],                  // above [22]
  [3025,153],[3065,153],[3105,153],       // above [23]
  [3655,278],[3695,278],                  // above [24]
  [3815,218],[3855,218],                  // above [25]
  [3985,153],[4025,153],[4065,153],       // above [26]
  // Ground-level notes
  [150,375],[360,375],                    // ground [0]
  [760,375],[1000,375],                   // ground [1]
  [1400,375],[1640,375],                  // ground [2]
  [2000,375],[2240,375],                  // ground [3]
  [2720,375],[2980,375],                  // ground [4]
  [3680,375],[3960,375],[4200,375],       // ground [5]
  // Mid-air notes — float in the gaps between ground segments
  [590,260],[640,260],                    // gap [0]→[1]
  [1230,260],[1290,260],                  // gap [1]→[2]
  [1800,260],[1870,260],                  // gap [2]→[3]
  [2490,260],[2570,260],                  // gap [3]→[4]
  [3200,260],[3350,260],[3480,260],       // gap [4]→[5]
];

const L2_ENEMY_DEFS = [
  // ground enemies — ~1.4–2.0× faster than Level 1
  [280,  368, 60,   490,  1.4],
  [820,  368, 700,  1070, 1.5],
  [1080, 368, 940,  1180, 1.4],
  [1550, 368, 1380, 1760, 1.6],
  [2050, 368, 1940, 2200, 1.4],
  [2260, 368, 2150, 2380, 1.8],
  [2750, 368, 2650, 2860, 1.6],
  [3060, 368, 2940, 3130, 1.4],
  [3680, 368, 3600, 3850, 1.8],
  [3960, 368, 3800, 4100, 2.0],
  [4250, 368, 4100, 4400, 1.6],
  // platform enemies (y = platform.y - 32)
  [590,  158, 540,  650,  1.4],   // on [11]
  [1740, 151, 1685, 1805, 1.4],   // on [17]
  [3070, 151, 3010, 3140, 1.4],   // on [23]
];

// Prize boxes: platform indices 10, 13, 17, 20, 25 — qi 5-9
const L2_BOX_DEFS = [[10,5],[13,6],[17,7],[20,8],[25,9]];

// ── Mutable exports (populated by initLevel) ──────────────────────────────────
export const platforms  = [];
export const coins      = [];
export const enemies    = [];
export const prizeBoxes = [];
export const pigeons    = [];

export function initLevel(n) {
  platforms.length  = 0;
  coins.length      = 0;
  enemies.length    = 0;
  prizeBoxes.length = 0;
  pigeons.length    = 0;

  const pd = n === 1 ? L1_PLATFORMS : L2_PLATFORMS;
  const cd = n === 1 ? L1_COIN_DEFS : L2_COIN_DEFS;
  const ed = n === 1 ? L1_ENEMY_DEFS : L2_ENEMY_DEFS;
  const bd = n === 1 ? L1_BOX_DEFS   : L2_BOX_DEFS;

  platforms.push(...pd);
  cd.forEach(([x, y], i) => coins.push({
    x, y, w: 16, h: 16, collected: false,
    bob: Math.random() * Math.PI * 2,
    noteType: i % 4,
  }));
  ed.forEach(([x, y, l, r, spd]) => enemies.push({
    x, y, w: 32, h: 32, alive: true,
    vx: -spd, origVx: -spd,
    left: l, right: r,
    walkFrame: 0, walkTimer: 0,
  }));
  bd.forEach(([hi, qi]) => prizeBoxes.push(mkBox(platforms, hi, qi)));
}

// Seed level 1 on module load so all importing modules get valid arrays immediately
initLevel(1);
