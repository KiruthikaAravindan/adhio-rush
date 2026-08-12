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
  girlState: 'idle',   // 'idle' | 'cheer' | 'hearts'
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
  x: 100, y: 300, w: 32, h: 40,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  invincible: 0,
  walkFrame: 0, walkTimer: 0,
};

export const particles = [];

export const media = { playerImage: null, girlImage: null };

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
