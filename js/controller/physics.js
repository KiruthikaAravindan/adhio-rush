import { gameState, player, burst, caesar } from '../model/state.js';
import { initLevel, platforms, coins, enemies, prizeBoxes, pigeons } from '../model/level.js';

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Tighter hitbox for interactive collisions (enemies, pigeons, coins).
// Uses visible player bounds — excludes transparent sprite margins.
export function playerHit() {
  return { x: player.x + 5, y: player.y + 2, w: 22, h: 36 };
}

export function resolveVsWorld() {
  player.onGround = false;

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

const LEVEL_WORLD_W      = [0, 3200, 4700, 5200, 5700, 6200];
const LEVEL_PIGEON_BASE  = [0,    0,  480,  400,  320,  260];

function applyCaesarForLevel(n) {
  // Active from Level 2 onward
  if (n < 2) { caesar.active = false; return; }

  const worldW = LEVEL_WORLD_W[n] || 3200;
  Object.assign(caesar, {
    active:     true,
    roaming:    n >= 4,
    curled:     n <= 3,
    met:        n >= 4,       // already bonded in L4+
    petTimer:   0,
    catchTimer: 0,
    sleeping:   false,
    enhanced:   false,
    scrollSeen: false,
    idleTimer:  0,
    vy:         0,
    onGround:   true,
    facing:     1,
    vx:         0,
    walkFrame:  0,
    walkTimer:  0,
  });

  if (n <= 3) {
    // Random floating platform in the middle third of the level
    const midStart = worldW * 0.33;
    const midEnd   = worldW * 0.67;
    const candidates = platforms.filter(p =>
      p.h <= 25 &&
      p.x + p.w / 2 >= midStart &&
      p.x + p.w / 2 <= midEnd
    );
    if (candidates.length > 0) {
      const p = candidates[Math.floor(Math.random() * candidates.length)];
      caesar.x = Math.round(p.x + p.w / 2 - caesar.w / 2);
      caesar.y = p.y - caesar.h;
    } else {
      caesar.x = Math.round(worldW / 2);
      caesar.y = 368;
    }
  } else {
    caesar.x = 60;
    caesar.y = 368;
  }
}

export function resetGame() {
  gameState.score        = 0;
  gameState.lives        = 3;
  gameState.coinCount    = 0;
  gameState.gameOver     = false;
  gameState.gameWon      = false;
  gameState.levelFailed  = false;
  gameState.showCaesarIntro = false;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.levelComplete = false;
  gameState.currentLevel = 1;
  gameState.worldW       = LEVEL_WORLD_W[1];
  gameState.newBest      = false;
  gameState.restartHeld  = false;
  gameState.pigeonTimer  = 0;
  gameState.pigeonTarget = LEVEL_PIGEON_BASE[1];
  gameState.jumpDown     = true;
  gameState.killScore    = 0;
  gameState.killBarFlash = 0;
  gameState.speedMult    = 1;
  gameState.powerupActive = null;
  gameState.powerupTimer  = 0;
  gameState.treats            = 0;
  gameState.caesarEverMet     = false;
  gameState.caesarNear        = false;
  gameState.treatDropped      = false;
  gameState.levelStartScore   = 0;
  gameState.treatButtonCooldown = 0;
  clearQuiz();
  initLevel(1);
  applyCaesarForLevel(1);
  resetPlayer();
}

export function nextLevel() {
  const next = Math.min(gameState.currentLevel + 1, 5);
  gameState.levelComplete    = false;
  gameState.levelFailed      = false;
  gameState.showCaesarIntro  = next === 4;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.currentLevel     = next;
  gameState.worldW           = LEVEL_WORLD_W[next];
  gameState.restartHeld      = false;
  gameState.pigeonTimer      = 0;
  gameState.pigeonTarget     = LEVEL_PIGEON_BASE[next];
  gameState.jumpDown         = true;
  gameState.killScore        = 0;
  gameState.killBarFlash     = 0;
  gameState.speedMult        = 1;
  gameState.powerupActive    = null;
  gameState.powerupTimer     = 0;
  gameState.caesarNear       = false;
  gameState.treatDropped     = false;
  gameState.levelStartScore  = gameState.score; // bank for next level's retry cost
  gameState.treatButtonCooldown = 0;
  clearQuiz();
  initLevel(next);
  applyCaesarForLevel(next);
  resetPlayer();
}

export function retryLevel() {
  const n = gameState.currentLevel;

  // Score handling: L1 is free (reset to 0); L2+ costs 2000 from level-start bank
  if (n === 1) {
    gameState.score           = 0;
    gameState.levelStartScore = 0;
    gameState.coinCount       = 0;
  } else {
    const newScore            = Math.max(0, gameState.levelStartScore - 2000);
    gameState.score           = newScore;
    gameState.levelStartScore = newScore; // updated bank for further retries
  }

  gameState.lives        = 3;
  gameState.gameOver     = false;
  gameState.gameWon      = false;
  gameState.levelFailed  = false;
  gameState.levelComplete    = false;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.restartHeld  = false;
  gameState.pigeonTimer  = 0;
  gameState.pigeonTarget = LEVEL_PIGEON_BASE[n] || 360;
  gameState.jumpDown     = true;
  gameState.killScore    = 0;
  gameState.killBarFlash = 0;
  gameState.speedMult    = 1;
  gameState.powerupActive   = null;
  gameState.powerupTimer    = 0;
  gameState.caesarNear      = false;
  gameState.treatButtonCooldown = 0;
  // treats/coinCount intentionally kept (except L1 above) — inventory persists
  // treatDropped NOT reset — same box won't drop a second treat on retry
  clearQuiz();
  initLevel(n);
  applyCaesarForLevel(n);
  resetPlayer();
}

export function jumpToLevel(n) {
  gameState.lives            = 3;
  gameState.coinCount        = 0;
  gameState.gameOver         = false;
  gameState.gameWon          = false;
  gameState.levelComplete    = false;
  gameState.girlState        = 'idle';
  gameState.celebrating      = false;
  gameState.celebrationTimer = 0;
  gameState.currentLevel     = n;
  gameState.worldW           = LEVEL_WORLD_W[n] || 3200;
  gameState.newBest          = false;
  gameState.restartHeld      = false;
  gameState.pigeonTimer      = 0;
  gameState.pigeonTarget     = LEVEL_PIGEON_BASE[n] || 360;
  gameState.jumpDown         = true;
  gameState.killScore        = 0;
  gameState.killBarFlash     = 0;
  gameState.speedMult        = 1;
  gameState.powerupActive    = null;
  gameState.powerupTimer     = 0;
  gameState.treats           = 0;
  gameState.caesarNear       = false;
  gameState.treatDropped     = false;
  gameState.levelStartScore  = 0;
  gameState.treatButtonCooldown = 0;
  clearQuiz();
  initLevel(n);
  applyCaesarForLevel(n);
  resetPlayer();
}
