const BEST_KEY = 'marioRushBest';
function loadBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; }
  catch (_) { return 0; }
}

export const gameState = {
  score: 0,
  lives: 3,
  coinCount: 0,
  gameOver: false,
  gameWon: false,
  levelComplete: false,
  currentLevel: 1,
  worldW: 3200,
  girlState: 'idle',
  celebrating: false,
  celebrationTimer: 0,
  cameraX: 0,
  restartHeld: false,
  jumpDown: false,

  bestScore: loadBest(),
  newBest: false,
  speedScale: 1,
  jumpScale: 1,

  // quiz
  quizActive: false,
  quizData: null,
  quizSelected: 0,
  quizAnswered: false,
  quizAnswerCorrect: false,
  quizTimer: 0,
  quizNavL: false,
  quizNavR: false,
  quizNavOk: false,

  // pigeons
  pigeonTimer: 0,
  pigeonTarget: 360,

  // kill score → extra life
  killScore: 0,
  killThreshold: 1000,
  killBarFlash: 0,

  // active powerup (Allegro speed boost)
  powerupActive: null,
  powerupTimer: 0,
  speedMult: 1,

  // caesar companion
  treats: 0,
  caesarEverMet: false,
  caesarNear: false,
  treatDropped: false,

  // level-save
  levelFailed: false,
  showCaesarIntro: false,
  levelStartScore: 0,     // score at the start of current level (retry cost base)
  treatButtonCooldown: 0, // frames remaining before treat button re-enables
};

// Persist the best score once a run ends. Idempotent — safe to call each frame.
export function commitBestScore() {
  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    gameState.newBest   = true;
    try { localStorage.setItem(BEST_KEY, String(gameState.bestScore)); } catch (_) {}
  }
}

export const player = {
  x: 100, y: 360, w: 32, h: 40,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  invincible: 0,
  shieldTimer: 0,  // pet-granted immunity — no flicker, golden aura
  walkFrame: 0, walkTimer: 0,
};

export const particles = [];

export const media = { playerImage: null, girlImage: null, caesarImage: null, pigeonImage: null };

export const caesar = {
  active: false,
  x: 0, y: 368,
  w: 40, h: 32,
  vx: 0, vy: 0,
  facing: 1,
  onGround: true,
  curled: true,      // sleeping ball before found (L2-3)
  roaming: false,    // follows player (L4+)
  met: false,
  petTimer: 0,
  catchTimer: 0,
  sleeping: false,
  enhanced: false,   // treat mode — jumps for flying pigeons
  scrollSeen: false, // paw-print cue fired once on first scroll-in
  idleTimer: 0,      // player stillness counter → sit/lie pose
  sitPose: false,    // sticky sit flag (hysteresis prevents idle-flicker)
  lyingPose: false,  // lie-down after 10 s idle
  jumpCooldown: 0,   // frames until next platform-jump attempt allowed
  jumpDecisionX: null, jumpDecisionY: null, // player pos when last jump decision was made
  onElevated: false, // currently on a floating platform (h<=25)
  walkFrame: 0, walkTimer: 0,
};

export function burst(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 7 - 2,
      life: 1,
      color,
    });
  }
}

// Floating text particle — drifts upward and fades out
export function floatText(x, y, text, color = '#fff') {
  particles.push({
    x, y,
    vx: 0, vy: -1.0,
    life: 1.2,
    decay: 0.016,
    color,
    symbol: text,
    fontSize: 22,
  });
}

export function burstHearts(x, y) {
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const spd   = 1.5 + Math.random() * 2.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1.5,
      life: 1,
      color: Math.random() < 0.5 ? '#ff4466' : '#ff99bb',
      symbol: '♥',
    });
  }
}