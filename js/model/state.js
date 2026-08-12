export const gameState = {
  score: 0,
  lives: 3,
  coinCount: 0,
  gameOver: false,
  gameWon: false,
  cameraX: 0,
  restartHeld: false,
  jumpDown: false,

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

export const player = {
  x: 100, y: 300, w: 32, h: 40,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  invincible: 0,
  walkFrame: 0, walkTimer: 0,
};

export const particles = [];

export const media = { playerImage: null };

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
