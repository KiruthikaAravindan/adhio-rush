export const platforms = [
  { x: 0,    y: 400, w: 580, h: 50 },
  { x: 680,  y: 400, w: 520, h: 50 },
  { x: 1300, y: 400, w: 420, h: 50 },
  { x: 1820, y: 400, w: 580, h: 50 },
  { x: 2500, y: 400, w: 750, h: 50 },
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

export const coins = [
  [220,255],[260,255],[300,255],[400,215],[440,215],[480,215],
  [565,175],[605,175],[645,175],[770,275],[810,275],[910,215],[950,215],
  [1065,155],[1105,155],[1145,155],[1220,275],[1260,275],
  [1420,235],[1460,235],[1500,235],[1610,180],[1650,180],
  [1915,275],[1955,275],[2110,215],[2150,215],
  [2320,155],[2360,155],[2400,155],[2615,275],[2655,275],
  [2820,215],[2860,215],[3020,155],[3060,155],[3100,155],
].map(([x, y], i) => ({
  x, y, w: 16, h: 16,
  collected: false,
  bob: Math.random() * Math.PI * 2,
  noteType: i % 4,
}));

const ENEMY_DEFS = [
  // ground enemies (platform top 400, enemy h 32 → y 368)
  [300,  368, 250,  400,  1.0],
  [820,  368, 710,  960,  1.0],
  [1060, 368, 960,  1160, 1.0],
  [1520, 368, 1420, 1600, 1.2],
  [1920, 368, 1840, 2000, 1.0],
  [2220, 368, 2120, 2320, 1.5],
  [2720, 368, 2620, 2820, 1.0],
  [3050, 368, 2950, 3150, 1.2],
  // platform enemies
  [565,  173, 555,  675,  1.0],
  [1065, 153, 1055, 1165, 1.0],
  [2320, 153, 2310, 2440, 1.0],
];

export const enemies = ENEMY_DEFS.map(([x, y, l, r, spd]) => ({
  x, y, w: 32, h: 32,
  alive: true,
  vx: -spd, origVx: -spd,
  left: l, right: r,
  walkFrame: 0, walkTimer: 0,
}));

export const QUIZ_QUESTIONS = [
  { q: 'What does "Forte" (f) mean?',           choices: ['Play loudly',  'Play softly', 'Play quickly'], answer: 0 },
  { q: 'How many beats in 4/4 time?',            choices: ['3 beats',      '4 beats',     '6 beats'     ], answer: 1 },
  { q: 'What is the speed of music called?',     choices: ['Pitch',        'Timbre',      'Tempo'       ], answer: 2 },
  { q: 'What does "Piano" (p) mean?',            choices: ['Fast',         'Softly',      'High pitch'  ], answer: 1 },
  { q: 'A group of 8 notes spanning an octave?', choices: ['Scale',        'Chord',       'Arpeggio'    ], answer: 0 },
];

// Each prize box is anchored just above a "host" piano-key platform so the
// player can stand on that platform and jump up to hit it. Centered on the
// platform and placed ~52px above its top → within a single jump's reach.
const BOX = 18;                    // box is same height as a piano platform (h:18)
const BOX_GAP = 52;                // clearance from platform top to box bottom
function boxAbove(hostIndex, qi) {
  const p = platforms[hostIndex];
  return {
    x: Math.round(p.x + p.w / 2 - BOX / 2),
    y: p.y - BOX_GAP - BOX,
    w: BOX, h: BOX,
    hit: false, qi,
  };
}
export const prizeBoxes = [
  boxAbove(6,  0),   // above platform [380,245,w100]
  boxAbove(9,  1),   // above platform [900,245,w90]
  boxAbove(12, 2),   // above platform [1410,265,w120]
  boxAbove(15, 3),   // above platform [2100,245,w110]
  boxAbove(18, 4),   // above platform [2810,245,w90]
];

export const pigeons = [];
