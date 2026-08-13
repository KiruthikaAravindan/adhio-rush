import { GRAVITY, CANVAS_W } from '../constants.js';
import { gameState, player, particles, burst, burstHearts, floatText, commitBestScore } from '../model/state.js';
import { coins, enemies, prizeBoxes, pigeons, boxItems, QUIZ_QUESTIONS } from '../model/level.js';
import { SFX } from '../audio.js';
import { isJump, isLeft, isRight, isRestart } from './input.js';
import { overlap, resolveVsWorld, resetPlayer, resetGame, nextLevel } from './physics.js';

const SPEED = 5.5;
const JUMP  = -11;

// ── Reward helpers ─────────────────────────────────────────────────────────────

function checkKillScore(x, y) {
  if (gameState.killScore >= gameState.killThreshold) {
    gameState.killScore -= gameState.killThreshold;
    gameState.lives = Math.min(gameState.lives + 1, 9);
    gameState.killBarFlash = 50;
    floatText(x, y - 10, '+1 UP! ♥', '#ff4466');
    burst(x, y, '#ff4466', 12);
    burst(x, y, '#FFD700', 6);
    SFX.prize();
  }
}

function spawnDangerEnemy(bx, by) {
  enemies.push({
    x: bx - 16, y: by,
    w: 32, h: 32, alive: true,
    vx: Math.random() < 0.5 ? -1.3 : 1.3,
    left: Math.max(0, bx - 220),
    right: Math.min(gameState.worldW, bx + 220),
    walkFrame: 0, walkTimer: 0,
    vy: 0, spawned: true,
  });
}

function applyReward(item) {
  burst(item.x + 12, item.y + 12, item.color, 10);
  SFX.note(0);

  switch (item.reward) {
    case 'life':
      gameState.lives = Math.min(gameState.lives + 1, 9);
      floatText(item.x + 12, item.y - 10, '+1 ♥ LIFE', '#ff66aa');
      SFX.prize();
      break;

    case 'noteburst': {
      let picked = 0;
      for (const c of coins) {
        if (c.collected) continue;
        if (Math.abs(c.x - player.x) < 280) {
          c.collected = true;
          gameState.coinCount++;
          gameState.score += 100;
          SFX.note(c.noteType);
          burst(c.x + 8, c.y + 8, '#FFD700');
          picked++;
        }
      }
      floatText(item.x + 12, item.y - 10, `+${picked} ♪ BURST`, '#FFD700');
      break;
    }

    case 'speed':
      if (gameState.powerupActive === 'speed') {
        gameState.powerupTimer = 300; // refresh duration
      } else {
        gameState.speedMult    = 1.5;
        gameState.powerupActive = 'speed';
        gameState.powerupTimer  = 300;
      }
      floatText(item.x + 12, item.y - 10, 'ALLEGRO! ♪', '#44ddff');
      break;

    case 'quiz':
      gameState.quizActive        = true;
      gameState.quizData          = QUIZ_QUESTIONS[item.qi];
      gameState.quizSelected      = 0;
      gameState.quizAnswered      = false;
      gameState.quizAnswerCorrect = false;
      break;

    case 'danger':
      spawnDangerEnemy(item.x + 12, item.y);
      floatText(item.x + 12, item.y - 10, '⚠ WATCH OUT!', '#ff4444');
      break;
  }
}

// Spawn the pop-up item above a hit box
function hitBox(b) {
  b.hit = true;
  SFX.prize();
  burst(b.x + b.w / 2, b.y, '#FFD700');

  let reward, symbol, color;
  if (b.type === 'quiz') {
    reward = 'quiz'; symbol = '?'; color = '#FFD700';
  } else if (b.type === 'danger') {
    reward = 'danger'; symbol = '☠'; color = '#ff4444';
  } else {
    const roll = Math.random();
    if      (roll < 0.34) { reward = 'life';      symbol = '♥'; color = '#ff66aa'; }
    else if (roll < 0.67) { reward = 'noteburst'; symbol = '♪'; color = '#FFD700'; }
    else                  { reward = 'speed';     symbol = '♫'; color = '#44ddff'; }
  }

  boxItems.push({
    x: b.x + Math.round(b.w / 2) - 12,
    y: b.y - 28,      // initial position just above box — pops upward from here
    w: 24, h: 24,
    reward, symbol, color,
    qi: b.qi,
    collected: false,
    vy: -3.5,          // initial upward pop
    settled: false,
    restY: b.y - 30,   // final resting Y (bobs gently here once settled)
    bob: Math.random() * Math.PI * 2,
  });
}

// ── Main update ────────────────────────────────────────────────────────────────

export function update() {
  // ── Restart / level-advance ─────────────────────────────────────────────────
  if (isRestart()) {
    if (!gameState.restartHeld) {
      if (gameState.levelComplete)              nextLevel();
      else if (gameState.gameOver || gameState.gameWon) resetGame();
    }
    gameState.restartHeld = true;
  } else {
    gameState.restartHeld = false;
  }

  if (gameState.gameOver || gameState.gameWon || gameState.levelComplete) {
    commitBestScore();
    return;
  }

  // ── Celebration ─────────────────────────────────────────────────────────────
  if (gameState.celebrating) {
    player.vx = 0;
    player.vy = Math.min(player.vy + GRAVITY, 16);
    player.y += player.vy;
    resolveVsWorld();
    gameState.celebrationTimer--;
    if (gameState.celebrationTimer % 18 === 0) {
      const midX = gameState.worldW - 155;
      burstHearts(midX, 355);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.3;
      p.life -= (p.decay || 0.045);
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (gameState.celebrationTimer <= 0) {
      gameState.celebrating = false;
      if (gameState.currentLevel === 1) { gameState.levelComplete = true; SFX.levelComplete(); }
      else                              { gameState.gameWon = true; SFX.win(); }
    }
    return;
  }

  // ── Quiz overlay ────────────────────────────────────────────────────────────
  if (gameState.quizActive) {
    if (gameState.quizAnswered) {
      gameState.quizTimer--;
      if (gameState.quizTimer <= 0) { gameState.quizActive = false; gameState.quizData = null; }
    }
    return;
  }

  // ── Powerup timer ───────────────────────────────────────────────────────────
  if (gameState.powerupTimer > 0) {
    gameState.powerupTimer--;
    if (gameState.powerupTimer === 0) {
      gameState.speedMult    = 1;
      gameState.powerupActive = null;
    }
  }

  // ── Player movement ─────────────────────────────────────────────────────────
  const speed = SPEED * (gameState.speedScale ?? 1) * gameState.speedMult;
  if (isLeft())       { player.vx = -speed; player.facing = -1; }
  else if (isRight()) { player.vx =  speed; player.facing =  1; }
  else player.vx *= 0.72;

  const jumpNow = isJump();
  if (jumpNow && !gameState.jumpDown && player.onGround) {
    player.vy = JUMP * (gameState.jumpScale ?? 1); player.onGround = false; SFX.jump();
  }
  gameState.jumpDown = jumpNow;

  player.vy = Math.min(player.vy + GRAVITY, 16);
  player.x  = Math.max(0, Math.min(player.x + player.vx, gameState.worldW - player.w));
  player.y += player.vy;

  // ── Prize box hit detection — must run BEFORE resolveVsWorld ────────────────
  // (player.vy is still negative here when jumping up into a box)
  for (const b of prizeBoxes) {
    if (b.hit) continue;
    if (player.vy < 0 && overlap(player, b)) {
      hitBox(b);
    }
  }

  resolveVsWorld();

  if (player.y > 570) {
    gameState.lives--;
    SFX.hit();
    if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); return; }
    resetPlayer();
  }

  // ── Note collection ─────────────────────────────────────────────────────────
  const t = Date.now();
  for (const c of coins) {
    if (c.collected) continue;
    const cy = c.y + Math.sin(t / 400 + c.bob) * 4;
    if (overlap(player, { x: c.x, y: cy, w: c.w, h: c.h })) {
      c.collected = true;
      gameState.coinCount++;
      gameState.score += 100;
      SFX.note(c.noteType);
      burst(c.x + 8, c.y + 8, '#FFD700');
    }
  }

  // ── Box item pop-up animation + collection ───────────────────────────────────
  for (let i = boxItems.length - 1; i >= 0; i--) {
    const item = boxItems[i];
    if (item.collected) { boxItems.splice(i, 1); continue; }

    if (!item.settled) {
      item.vy += 0.25;
      item.y  += item.vy;
      if (item.y >= item.restY) { item.y = item.restY; item.vy = 0; item.settled = true; }
    }

    if (overlap(player, item)) {
      item.collected = true;
      applyReward(item);
    }
  }

  // ── Pigeon spawning — Level 2 only ──────────────────────────────────────────
  if (gameState.currentLevel === 2) {
    gameState.pigeonTimer++;
    if (gameState.pigeonTimer >= gameState.pigeonTarget) {
      gameState.pigeonTimer  = 0;
      gameState.pigeonTarget = 300 + Math.floor(Math.random() * 200);
      if (pigeons.length < 1) {
        const fromLeft = Math.random() < 0.5;
        pigeons.push({
          x: fromLeft ? gameState.cameraX - 60 : gameState.cameraX + CANVAS_W + 20,
          y: 80 + Math.floor(Math.random() * 130),
          w: 36, h: 28,
          vx: fromLeft ? 3.0 : -3.0,
          wingFrame: 0, wingTimer: 0,
        });
        SFX.pigeon();
      }
    }
  }

  // ── Pigeon movement + collision ─────────────────────────────────────────────
  for (let i = pigeons.length - 1; i >= 0; i--) {
    const pg = pigeons[i];
    pg.x += pg.vx;
    pg.wingTimer++;
    if (pg.wingTimer > 14) { pg.wingFrame = (pg.wingFrame + 1) % 2; pg.wingTimer = 0; }
    if (pg.x < -100 || pg.x > gameState.worldW + 100) { pigeons.splice(i, 1); continue; }

    if (!overlap(player, pg)) continue;
    if (player.vy > 0 && player.y + player.h < pg.y + pg.h * 0.6) {
      pigeons.splice(i, 1);
      player.vy = -9;
      gameState.score += 500;
      gameState.killScore += 500;
      checkKillScore(pg.x + pg.w / 2, pg.y);
      SFX.stomp();
      burst(pg.x + pg.w / 2, pg.y + pg.h / 2, '#aaaacc');
    } else if (player.invincible <= 0) {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // ── Enemy movement + collision ──────────────────────────────────────────────
  for (const e of enemies) {
    if (!e.alive) continue;

    // Spawned danger enemies fall to ground level before patrolling
    if (e.spawned) {
      e.vy = (e.vy || 0) + GRAVITY;
      e.y += e.vy;
      if (e.y >= 368) { e.y = 368; e.vy = 0; e.spawned = false; }
    }

    e.x += e.vx;
    if (!e.spawned && (e.x <= e.left || e.x + e.w >= e.right)) e.vx *= -1;
    e.walkTimer++;
    if (e.walkTimer > 10) { e.walkFrame = (e.walkFrame + 1) % 2; e.walkTimer = 0; }

    if (player.invincible > 0 || !overlap(player, e)) continue;
    if (player.vy > 0 && player.y + player.h < e.y + e.h * 0.6) {
      e.alive = false;
      player.vy = -9;
      gameState.score += 200;
      gameState.killScore += 200;
      checkKillScore(e.x + e.w / 2, e.y);
      SFX.stomp();
      burst(e.x + e.w / 2, e.y + e.h / 2, '#8B4513');
    } else {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // Prevent enemies visually overlapping each other
  for (let i = 0; i < enemies.length; i++) {
    if (!enemies[i].alive) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      if (!enemies[j].alive) continue;
      if (overlap(enemies[i], enemies[j])) {
        enemies[i].vx *= -1;
        enemies[j].vx *= -1;
      }
    }
  }

  // ── Player animation ─────────────────────────────────────────────────────────
  if (Math.abs(player.vx) > 0.5) {
    player.walkTimer++;
    if (player.walkTimer > 9) { player.walkFrame = (player.walkFrame + 1) % 2; player.walkTimer = 0; }
  } else {
    player.walkFrame = 0;
  }
  if (player.invincible > 0) player.invincible--;

  // ── Particles ────────────────────────────────────────────────────────────────
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.3;
    p.life -= (p.decay || 0.045);
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Camera ───────────────────────────────────────────────────────────────────
  gameState.cameraX = Math.max(0, Math.min(player.x - CANVAS_W / 3, gameState.worldW - CANVAS_W));

  // ── Girl proximity transitions ────────────────────────────────────────────────
  if (gameState.girlState === 'idle' && player.x > gameState.worldW - 380) {
    gameState.girlState = 'cheer';
  }

  // ── Win trigger ───────────────────────────────────────────────────────────────
  if (!gameState.celebrating && player.x + player.w > gameState.worldW - 195) {
    gameState.girlState        = 'hearts';
    gameState.celebrating      = true;
    gameState.celebrationTimer = 180;
    player.vx    = 0;
    player.facing = 1;
    burst(gameState.worldW - 155, 360, '#ff66cc', 16);
    burst(gameState.worldW - 155, 360, '#FFD700', 12);
  }
}
