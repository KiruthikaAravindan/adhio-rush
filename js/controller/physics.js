import { gameState, player, burst } from '../model/state.js';
import { initLevel, platforms, coins, enemies, prizeBoxes, pigeons } from '../model/level.js';
export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveVsWorld() {
  player.onGround = false;

  // Resolve against ground/floating platforms
  for (const p of platforms) {
    if (!overlap(player, p)) continue;
    const ox = Math.min(player.x + player.w - p.x, p.x + p.w - player.x);
    const oy = Math.min(player.y + player.h - p.y, p.y + p.h - player.y);
    if (oy <= ox) {
      if (player.y + player.h / 2 < p.y + p.h / 2) {
        player.y = p.y - player.h; player.vy = 0; player.onGround = true;
      } else {
        player.y = p.y + p.h; player.vy = 0;
      }
    } else {
      player.x = player.x + player.w / 2 < p.x + p.w / 2
        ? p.x - player.w
        : p.x + p.w;
      player.vx = 0;
    }
  }

  // Prize boxes are solid — player can stand on top of them
  for (const b of prizeBoxes) {
    if (!overlap(player, b)) continue;
    const ox = Math.min(player.x + player.w - b.x, b.x + b.w - player.x);
    const oy = Math.min(player.y + player.h - b.y, b.y + b.h - player.y);
    if (oy <= ox) {
      if (player.y + player.h / 2 < b.y + b.h / 2) {
        player.y = b.y - player.h; player.vy = 0; player.onGround = true;
      } else {
        player.y = b.y + b.h; player.vy = Math.max(0, player.vy);
      }
    } else {
      player.x = player.x + player.w / 2 < b.x + b.w / 2
        ? b.x - player.w
        : b.x + b.w;
      player.vx = 0;
    }
  }
}

export function resetPlayer() {
  player.x = 100; player.y = 360;
  player.vx = 0;  player.vy = 0;
  player.invincible = 0;
  gameState.cameraX = 0;
}

function clearQuiz() {
  gameState.quizActive       = false;
  gameState.quizData         = null;
  gameState.quizSelected     = 0;
  gameState.quizAnswered     = false;
  gameState.quizAnswerCorrect = false;
  gameState.quizTimer        = 0;
}

export function resetGame() {
  gameState.score        = 0;
  gameState.lives        = 3;
  gameState.coinCount    = 0;
  gameState.gameOver     = false;
  gameState.gameWon      = false;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.levelComplete = false;
  gameState.currentLevel = 1;
  gameState.worldW       = 3200;
  gameState.newBest      = false;
  gameState.restartHeld  = false;
  gameState.pigeonTimer  = 0;
  gameState.pigeonTarget = 360;
  gameState.jumpDown     = true;
  gameState.killScore    = 0;
  gameState.killBarFlash = 0;
  gameState.speedMult    = 1;
  gameState.powerupActive = null;
  gameState.powerupTimer  = 0;
  clearQuiz();
  initLevel(1);
  resetPlayer();
}

export function nextLevel() {
  gameState.levelComplete    = false;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.currentLevel  = 2;
  gameState.worldW        = 4700;
  gameState.restartHeld   = false;
  gameState.pigeonTimer   = 0;
  gameState.pigeonTarget  = 350;
  gameState.jumpDown      = true;
  gameState.killScore     = 0;
  gameState.killBarFlash  = 0;
  gameState.speedMult     = 1;
  gameState.powerupActive = null;
  gameState.powerupTimer  = 0;
  clearQuiz();
  initLevel(2);
  resetPlayer();
}
